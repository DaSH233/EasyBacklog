import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { join } from "node:path";
import { BranchTaskLoader } from "../core/task-loader.ts";
import { FileSystem } from "../file-system/operations.ts";
import { GitOperations } from "../git/operations.ts";
import { BacklogServer } from "../server/index.ts";
import { createUniqueTestDir, safeCleanup } from "./test-utils.ts";

let directory: string;
let server: BacklogServer | undefined;
const config = {
	projectName: "Batch loading",
	statuses: ["To Do", "Done"],
	labels: [],
	dateFormat: "YYYY-MM-DD",
	remoteOperations: true,
	checkActiveBranches: true,
	activeBranchDays: 30,
};
const git = (...args: string[]) => {
	const result = Bun.spawnSync(["git", ...args], { cwd: directory, stdout: "pipe", stderr: "pipe" });
	if (result.exitCode !== 0) throw new Error(result.stderr.toString());
	return result.stdout.toString().trim();
};
beforeEach(async () => {
	directory = createUniqueTestDir("git-batch-loading");
	const fs = new FileSystem(directory);
	await fs.ensureBacklogStructure();
	await fs.saveConfig(config);
	git("init", "-b", "main");
	git("config", "user.name", "Test");
	git("config", "user.email", "test@example.com");
	git("config", "commit.gpgsign", "false");
	git("config", "core.autocrlf", "false");
});
afterEach(async () => {
	await server?.stop();
	server = undefined;
	await safeCleanup(directory);
});

describe("batched branch task reads", () => {
	it("keeps byte framing for Unicode, empty files, invalid UTF-8 and missing blobs", async () => {
		const contents = new Map<string, Uint8Array>([
			["中文 文件.md", Buffer.from("标题\r\n".repeat(40_000))],
			["empty.md", Buffer.alloc(0)],
			["invalid.md", Buffer.from([0xff, 0xfe, 10])],
			["last.md", Buffer.from("尾部没有换行")],
		]);
		for (const [path, content] of contents) await Bun.write(join(directory, path), content);
		git("add", ".");
		git("commit", "-qm", "Fixture");
		const operations = new GitOperations(directory, config);
		const files = await operations.showFiles("HEAD", ["missing.md", ...contents.keys(), "another missing.md"]);
		expect(files.size).toBe(contents.size);
		for (const [path, content] of contents) expect(files.get(path)).toBe(Buffer.from(content).toString("utf8"));
	});

	it("hydrates a large shared commit once, preserves branch provenance, and reuses its cache", async () => {
		const fs = new FileSystem(directory);
		for (let id = 1; id <= 40; id++)
			await fs.saveTask({
				id: `TASK-${id}`,
				title: `任务 ${id}`,
				status: "To Do",
				assignee: [],
				createdDate: "2026-01-01",
				labels: [],
				dependencies: [],
			});
		git("add", ".");
		git("commit", "-qm", "Fixture");
		const commit = git("rev-parse", "HEAD");
		const operations = new GitOperations(directory, config);
		const batch = spyOn(operations, "showFiles");
		const single = spyOn(operations, "showFile");
		const loader = new BranchTaskLoader(operations);
		const tips = [
			{ name: "main", commit, current: true },
			{ name: "feature", commit, current: false },
			{ name: "origin/feature", commit, current: false },
		];
		for (let read = 0; read < 2; read++) {
			const result = await loader.load(tips, config, [], true);
			expect(result.complete).toBe(true);
			expect(result.entries).toHaveLength(80);
			expect(new Set(result.entries.map((entry) => entry.task?.title)).size).toBe(40);
			expect(new Set(result.entries.map((entry) => entry.task?.source))).toEqual(new Set(["local-branch", "remote"]));
		}
		expect(batch).toHaveBeenCalledTimes(1);
		expect(single).not.toHaveBeenCalled();
	});

	it("keeps search responsive after disabling remote operations in a running server", async () => {
		const fs = new FileSystem(directory);
		await fs.saveTask({
			id: "TASK-1",
			title: "Local task",
			status: "To Do",
			assignee: [],
			createdDate: "2026-01-01",
			labels: [],
			dependencies: [],
		});
		git("add", ".");
		git("commit", "-qm", "Fixture");
		git("branch", "feature");
		server = new BacklogServer(directory);
		await server.start(0, false);
		const base = `http://127.0.0.1:${server.getPort()}`;
		const read = async () => {
			const response = await fetch(`${base}/api/search`, { signal: AbortSignal.timeout(3000) });
			expect(response.status).toBe(200);
			expect((await response.json()).map((item: { task: { title: string } }) => item.task.title)).toEqual([
				"Local task",
			]);
		};
		await read();
		const updated = await fetch(`${base}/api/config`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...config, remoteOperations: false }),
		});
		expect(updated.status).toBe(200);
		await Promise.all([read(), read(), read()]);
		// Include the debounced configuration watcher, not just the PUT response.
		await Bun.sleep(600);
		await read();
	});
});
