import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FileSystem } from "../file-system/operations";
import { BacklogServer } from "../server";
import { createUniqueTestDir, safeCleanup } from "./test-utils";

const cases = [
	{
		kind: "drafts",
		id: "draft-1",
		folder: "drafts",
		name: "draft-1 - Example.md",
		body: "---\nid: draft-1\ntitle: Example\nstatus: Draft\ncreated_date: 2026-10-29\n---\n\n## Description\nKeep this body.\n",
	},
	{
		kind: "documents",
		id: "doc-1",
		folder: "docs",
		name: "nested/doc-1 - Example.md",
		body: "---\nid: doc-1\ntitle: Example\ntype: other\ncreated_date: 2026-10-29\n---\n\nKeep this body.\n",
	},
	{
		kind: "decisions",
		id: "decision-1",
		folder: "decisions",
		name: "decision-1 - Example.md",
		body: "---\nid: decision-1\ntitle: Example\nstatus: proposed\ndate: 2026-10-29\n---\n\n## Context\nKeep this body.\n",
	},
	{
		kind: "milestones",
		id: "m-1",
		folder: "milestones",
		name: "m-1 - Example.md",
		body: "---\nid: m-1\ntitle: Example\n---\n\nKeep this body.\n",
	},
];
type Handlers = {
	handleDeleteArchiveCategory(req: Request, kind: string, id: string): Promise<Response>;
	handleListArchiveCategory(kind: string): Promise<Response>;
	handleRestoreArchiveCategory(kind: string, id: string): Promise<Response>;
};
describe("Archive categories", () => {
	let dir: string;
	let server: BacklogServer;
	let handlers: Handlers;
	beforeEach(async () => {
		dir = createUniqueTestDir("archive-categories");
		await mkdir(dir, { recursive: true });
		const fs = new FileSystem(dir);
		await fs.ensureBacklogStructure();
		await fs.saveConfig({
			projectName: "Archive",
			statuses: ["To Do", "Done"],
			labels: [],
			dateFormat: "yyyy-mm-dd",
			autoCommit: false,
			remoteOperations: false,
			checkActiveBranches: false,
		});
		server = new BacklogServer(dir);
		handlers = server as unknown as Handlers;
	});
	afterEach(async () => {
		await server.stop();
		await safeCleanup(dir);
	});
	for (const fixture of cases) {
		const paths = () => ({
			source: join(dir, "backlog", "archive", fixture.folder, fixture.name),
			target: join(dir, "backlog", fixture.folder, fixture.name),
		});
		const seed = async () => {
			const { source } = paths();
			await mkdir(join(source, ".."), { recursive: true });
			await writeFile(source, fixture.body);
		};
		it(`lists and restores ${fixture.kind} with bytes and nested path preserved`, async () => {
			await seed();
			const list = await handlers.handleListArchiveCategory(fixture.kind);
			expect(list.status).toBe(200);
			expect(await list.json()).toHaveLength(1);
			const response = await handlers.handleRestoreArchiveCategory(fixture.kind, fixture.id);
			expect(response.status).toBe(200);
			const { source, target } = paths();
			expect(await readFile(target, "utf8")).toBe(fixture.body);
			expect(
				await access(source).then(
					() => true,
					() => false,
				),
			).toBe(false);
			expect(await (await handlers.handleListArchiveCategory(fixture.kind)).json()).toEqual([]);
		});
		it(`refuses active ID collisions for ${fixture.kind}`, async () => {
			await seed();
			const { source, target } = paths();
			await mkdir(join(target, ".."), { recursive: true });
			await writeFile(target, fixture.body.replace("Keep this body.", "Active body."));
			expect((await handlers.handleRestoreArchiveCategory(fixture.kind, fixture.id)).status).toBe(409);
			expect(await readFile(source, "utf8")).toBe(fixture.body);
			expect(await readFile(target, "utf8")).toContain("Active body.");
		});
		it(`returns not found for missing ${fixture.kind}`, async () => {
			expect((await handlers.handleRestoreArchiveCategory(fixture.kind, fixture.id)).status).toBe(404);
		});
	}

	for (const kind of ["drafts", "milestones"]) {
		it(`refuses duplicate archived numeric identities for ${kind}`, async () => {
			const fixture = cases.find((item) => item.kind === kind);
			if (!fixture) throw new Error("Missing fixture");
			const folder = join(dir, "backlog", "archive", fixture.folder);
			const padded = fixture.id.replace("-1", "-01");
			await mkdir(folder, { recursive: true });
			await writeFile(join(folder, fixture.name), fixture.body);
			await writeFile(join(folder, `${padded} - Duplicate.md`), fixture.body.replace(fixture.id, padded));
			expect((await handlers.handleRestoreArchiveCategory(kind, fixture.id)).status).toBe(409);
			expect(await readFile(join(folder, fixture.name), "utf8")).toBe(fixture.body);
		});
		it(`refuses a destination filename owned by another ID for ${kind}`, async () => {
			const fixture = cases.find((item) => item.kind === kind);
			if (!fixture) throw new Error("Missing fixture");
			const source = join(dir, "backlog", "archive", fixture.folder, fixture.name);
			const target = join(dir, "backlog", fixture.folder, fixture.name);
			await mkdir(join(source, ".."), { recursive: true });
			await mkdir(join(target, ".."), { recursive: true });
			await writeFile(source, fixture.body);
			await writeFile(target, fixture.body.replace(fixture.id, fixture.id.replace("-1", "-99")));
			expect((await handlers.handleRestoreArchiveCategory(kind, fixture.id)).status).toBe(409);
			expect(await readFile(source, "utf8")).toBe(fixture.body);
			expect(await readFile(target, "utf8")).toContain("-99");
		});
	}

	for (const fixture of cases) {
		it(`deletes only confirmed archived ${fixture.kind}`, async () => {
			const path = join(dir, "backlog", "archive", fixture.folder, fixture.name);
			await mkdir(join(path, ".."), { recursive: true });
			await writeFile(path, fixture.body);
			const request = (confirmed: boolean) =>
				new Request("http://localhost/api/archive", {
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ confirmed }),
				});
			expect((await handlers.handleDeleteArchiveCategory(request(false), fixture.kind, fixture.id)).status).toBe(400);
			expect(await readFile(path, "utf8")).toBe(fixture.body);
			expect((await handlers.handleDeleteArchiveCategory(request(true), fixture.kind, fixture.id)).status).toBe(200);
			expect(
				await access(path).then(
					() => true,
					() => false,
				),
			).toBe(false);
			expect((await handlers.handleDeleteArchiveCategory(request(true), fixture.kind, fixture.id)).status).toBe(404);
			const active = join(dir, "backlog", fixture.folder, fixture.name);
			await mkdir(join(active, ".."), { recursive: true });
			await writeFile(active, fixture.body);
			const refused = await handlers.handleDeleteArchiveCategory(request(true), fixture.kind, fixture.id);
			expect([404, 409]).toContain(refused.status);
			expect(await readFile(active, "utf8")).toBe(fixture.body);
		});
	}
	it("exposes all category list and restore routes over HTTP", async () => {
		for (const fixture of cases) {
			const path = join(dir, "backlog", "archive", fixture.folder, fixture.name);
			await mkdir(join(path, ".."), { recursive: true });
			await writeFile(path, fixture.body);
		}
		await server.start(0, false);
		const base = `http://127.0.0.1:${server.getPort()}`;
		for (const fixture of cases) {
			const response = await fetch(`${base}/api/archive/${fixture.kind}`);
			expect(response.status).toBe(200);
			expect(await response.json()).toHaveLength(1);
			const restored = await fetch(`${base}/api/archive/${fixture.kind}/${fixture.id}/restore`, { method: "POST" });
			expect(restored.status).toBe(200);
		}
	});
	it("rejects unknown categories", async () => {
		expect((await handlers.handleListArchiveCategory("other")).status).toBe(404);
		expect((await handlers.handleRestoreArchiveCategory("other", "x")).status).toBe(404);
	});
});
