import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { Core } from "../core/backlog.ts";
import { FileSystem } from "../file-system/operations.ts";
import { BacklogServer } from "../server/index.ts";
import type { Task } from "../types/index.ts";
import { createUniqueTestDir, safeCleanup } from "./test-utils.ts";

type Handlers = { handleListArchivedTasks(): Promise<Response>; handleRestoreTask(id: string): Promise<Response> };
describe("Web task archive", () => {
	let dir: string;
	let core: Core;
	let server: BacklogServer;
	let handlers: Handlers;
	beforeEach(async () => {
		dir = createUniqueTestDir("web-archive");
		await mkdir(dir, { recursive: true });
		const fs = new FileSystem(dir);
		await fs.ensureBacklogStructure();
		await fs.saveConfig({
			projectName: "Archive test",
			statuses: ["To Do", "In Progress", "Done"],
			labels: [],
			dateFormat: "yyyy-mm-dd",
			autoCommit: false,
			remoteOperations: false,
			checkActiveBranches: false,
		});
		core = new Core(dir);
		server = new BacklogServer(dir);
		handlers = server as unknown as Handlers;
	});
	afterEach(async () => {
		await server.stop();
		await safeCleanup(dir);
	});
	const create = async () => {
		await core.createTask(
			{
				id: "TASK-1",
				title: "Preserve content",
				status: "In Progress",
				description: "Original body",
				createdDate: "2026-10-29",
				assignee: ["@test"],
				labels: [],
				dependencies: [],
			},
			false,
		);
	};
	it("lists only archived tasks, restores exact contents and preserves status and ID", async () => {
		await create();
		expect(await (await handlers.handleListArchivedTasks()).json()).toEqual([]);
		await core.archiveTask("TASK-1", false);
		const archived = (await (await handlers.handleListArchivedTasks()).json()) as Task[];
		expect(archived).toHaveLength(1);
		expect(archived[0]?.source).toBe("archived");
		const before = await readFile(archived[0]?.filePath as string, "utf8");
		expect((await handlers.handleRestoreTask("TASK-1")).status).toBe(200);
		expect(await (await handlers.handleListArchivedTasks()).json()).toEqual([]);
		const tasks = await core.filesystem.listTasks();
		expect(tasks).toHaveLength(1);
		expect(tasks[0]?.status).toBe("In Progress");
		expect(tasks[0]?.id).toBe("TASK-1");
		expect(await readFile(tasks[0]?.filePath as string, "utf8")).toBe(before);
	});
	it("rejects missing and already restored IDs without creating anything", async () => {
		expect((await handlers.handleRestoreTask("TASK-999")).status).toBe(404);
		await create();
		await core.archiveTask("TASK-1", false);
		await handlers.handleRestoreTask("TASK-1");
		expect((await handlers.handleRestoreTask("TASK-1")).status).toBe(409);
		expect(await core.filesystem.listTasks()).toHaveLength(1);
	});
	it("refuses an ID collision and preserves both copies", async () => {
		await create();
		await core.archiveTask("TASK-1", false);
		const archived = await core.filesystem.listArchivedTasks();
		const original = archived[0]?.filePath as string;
		const active = join(core.filesystem.tasksDir, basename(original));
		await copyFile(original, active);
		const before = await readFile(original, "utf8");
		expect((await handlers.handleRestoreTask("TASK-1")).status).toBe(409);
		expect(await readFile(original, "utf8")).toBe(before);
		expect(await readFile(active, "utf8")).toBe(before);
	});
	it("serves the archive deep link and restores through the public HTTP route", async () => {
		await create();
		await core.archiveTask("TASK-1", false);
		await server.start(0, false);
		const base = `http://127.0.0.1:${server.getPort()}`;
		const page = await fetch(`${base}/archive`);
		expect(page.status).toBe(200);
		expect(page.headers.get("content-type")).toContain("text/html");
		const list = await fetch(`${base}/api/archive/tasks`);
		expect(await list.json()).toHaveLength(1);
		const response = await fetch(`${base}/api/tasks/TASK-1/restore`, { method: "POST" });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true });
		expect(await (await fetch(`${base}/api/archive/tasks`)).json()).toEqual([]);
	});
	it("deletes an archived task through HTTP only with confirmation", async () => {
		await create();
		await core.archiveTask("TASK-1", false);
		await server.start(0, false);
		const url = `http://127.0.0.1:${server.getPort()}/api/archive/tasks/TASK-1`;
		expect((await fetch(url, { method: "DELETE" })).status).toBe(400);
		expect(await core.filesystem.listArchivedTasks()).toHaveLength(1);
		const response = await fetch(url, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ confirmed: true }),
		});
		expect(response.status).toBe(200);
		expect(await core.filesystem.listArchivedTasks()).toHaveLength(0);
	});
});
