import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { Core } from "../core/backlog.ts";
import { BacklogServer } from "../server/index.ts";
import { getTestCliPath } from "./test-cli.ts";
import { createUniqueTestDir, initializeFilesystemTestProject, safeCleanup } from "./test-utils.ts";

describe("retired decision feature", () => {
	let directory: string;
	let core: Core;
	let server: BacklogServer | undefined;

	beforeEach(async () => {
		directory = createUniqueTestDir("decision-removal");
		core = new Core(directory);
		await initializeFilesystemTestProject(core, "Documents only");
	});

	afterEach(async () => {
		await server?.stop();
		server = undefined;
		core.disposeSearchService();
		core.disposeContentStore();
		await safeCleanup(directory);
	});

	it("does not create decision storage or load, search, diagnose, or rewrite legacy files", async () => {
		expect(await readdir(core.filesystem.backlogDir)).not.toContain("decisions");
		const legacyFiles = ["decisions/decision-1.md", "archive/decisions/decision-2.md"];
		const legacy = "---\nid: [unclosed\n---\nHistorical choice\n";
		for (const path of legacyFiles) {
			const absolute = join(core.filesystem.backlogDir, path);
			await mkdir(join(absolute, ".."), { recursive: true });
			await Bun.write(absolute, legacy);
		}
		await core.createDocumentFromInput({ title: "Current guide", content: "Current choice" });
		const search = await core.getSearchService();
		expect(search.search({ query: "Historical" })).toEqual([]);
		expect(search.search({ query: "Current guide" }).map((item) => item.type)).toEqual(["document"]);
		expect(await core.diagnoseContentIdentity()).toEqual({
			documents: { duplicates: [], missingIds: [], unreadable: [] },
		});
		for (const path of legacyFiles) expect(await Bun.file(join(core.filesystem.backlogDir, path)).text()).toBe(legacy);
	});

	it("rejects decision commands and omits them from CLI help", async () => {
		const cli = getTestCliPath();
		const help = await $`bun ${cli} --help`.cwd(directory).quiet().text();
		expect(help).not.toMatch(/^\s+decision\b/m);
		const result = await $`bun ${cli} decision list`.cwd(directory).quiet().nothrow();
		expect(result.exitCode).not.toBe(0);
		expect(result.stderr.toString()).toContain("unknown command 'decision'");
	});

	it("rejects removed HTTP surfaces while an archived replacement document stays readable", async () => {
		const document = await core.createDocumentFromInput({
			title: "Architecture choice",
			path: "decisions",
			content: "Original record: decision-1\nOriginal status: accepted\n\n## Context\nPreserved history",
		});
		await core.archiveContentRecord("document", document.id);
		server = new BacklogServer(directory);
		await server.start(0, false);
		const base = `http://127.0.0.1:${server.getPort()}`;
		for (const path of [
			"/decisions",
			"/decisions/1",
			"/api/decisions",
			"/api/decisions/decision-1",
			"/api/decision/1",
			"/api/archive/decisions",
		]) {
			expect((await fetch(`${base}${path}`)).status).toBe(404);
		}
		for (const path of ["/api/decisions", "/api/decisions/decision-1/archive"]) {
			expect(
				(await fetch(`${base}${path}`, { method: "POST", body: JSON.stringify({ title: "Removed" }) })).status,
			).toBe(404);
		}
		expect((await fetch(`${base}/api/search?type=decision`)).status).toBe(400);
		const response = await fetch(`${base}/api/docs/${document.id}`);
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ archived: true, rawContent: document.rawContent });
	});
});
