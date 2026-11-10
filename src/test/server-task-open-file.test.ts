import { afterAll, beforeAll, describe, expect, it, spyOn } from "bun:test";
import { mkdir, symlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";
import { FileSystem } from "../file-system/operations.ts";
import { BacklogServer } from "../server/index.ts";
import * as editor from "../utils/editor.ts";
import { createUniqueTestDir, safeCleanup } from "./test-utils.ts";

describe("open modified task files in an editor", () => {
	let root: string;
	let outside: string;
	let server: BacklogServer;
	let base: string;
	const launch = spyOn(editor, "openInEditor").mockResolvedValue(true);
	const open = (path: string, id = "TASK-1", origin?: string) =>
		fetch(`${base}/api/tasks/${id}/open-file`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...(origin ? { origin } : {}) },
			body: JSON.stringify({ path }),
		});

	beforeAll(async () => {
		root = resolve(createUniqueTestDir("reference-preview"));
		outside = resolve(createUniqueTestDir("reference-outside"));
		await mkdir(root, { recursive: true });
		await mkdir(outside, { recursive: true });
		await $`git init -b main`.cwd(root).quiet();
		const fs = new FileSystem(root);
		await fs.ensureBacklogStructure();
		await fs.saveConfig({
			projectName: "Preview",
			statuses: ["To Do", "Done"],
			labels: [],
			milestones: [],
			dateFormat: "YYYY-MM-DD",
			remoteOperations: false,
			checkActiveBranches: false,
			autoCommit: false,
		});
		await mkdir(join(root, "docs"));
		await Bun.write(join(root, "README.md"), "# Local README\n尚未提交的内容");
		await Bun.write(join(root, "docs", "中文 文档.md"), "# 中文");
		await Bun.write(join(outside, "secret.txt"), "outside project");
		await symlink(outside, join(root, "escape"), process.platform === "win32" ? "junction" : "dir");
		await fs.saveTask({
			id: "TASK-1",
			title: "Reference preview",
			status: "To Do",
			assignee: [],
			labels: [],
			dependencies: [],
			createdDate: "2026-11-10",
			modifiedFiles: [
				"README.md",
				"docs/中文 文档.md",
				"missing.md",
				"docs",
				"../secret.txt",
				"C:\\secret.txt",
				"/etc/passwd",
				"escape/secret.txt",
			],
		});
		server = new BacklogServer(root);
		await server.start(0, false);
		base = `http://127.0.0.1:${server.getPort()}`;
	});

	afterAll(async () => {
		launch.mockRestore();
		await server?.stop();
		await safeCleanup(root);
		await safeCleanup(outside);
	});

	it("opens the actual local file, including spaces and Unicode paths", async () => {
		const response = await open("README.md");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true });
		expect(launch.mock.calls.at(-1)?.[0]).toBe(join(root, "README.md"));
		expect(launch.mock.calls.at(-1)?.[2]).toEqual({ wait: false });
		expect((await open("docs/中文 文档.md")).status).toBe(200);
		expect(launch.mock.calls.at(-1)?.[0]).toBe(join(root, "docs", "中文 文档.md"));
	});

	it("does not expose unreferenced files or missing tasks", async () => {
		expect((await open("backlog/config.yml")).status).toBe(404);
		expect((await open("README.md", "TASK-999")).status).toBe(404);
	});

	it("rejects traversal, absolute paths and symlinks outside the project", async () => {
		for (const path of ["../secret.txt", "C:\\secret.txt", "/etc/passwd"]) {
			expect((await open(path)).status).toBe(400);
		}
		expect((await open("escape/secret.txt")).status).toBe(403);
	});

	it("rejects cross-origin launches, missing files and directories without spawning", async () => {
		const count = launch.mock.calls.length;
		expect((await open("README.md", "TASK-1", "https://example.com")).status).toBe(403);
		expect((await open("missing.md")).status).toBe(404);
		expect((await open("docs")).status).toBe(400);
		expect((await fetch(`${base}/api/tasks/TASK-1/open-file`)).status).not.toBe(200);
		expect(launch.mock.calls.length).toBe(count);
	});

	it("reports a failed editor launch without claiming success", async () => {
		launch.mockResolvedValueOnce(false);
		expect((await open("README.md")).status).toBe(503);
	});
});
