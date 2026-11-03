import { afterEach, describe, expect, it } from "bun:test";
import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { Core } from "../core/backlog.ts";
import { initializeProject } from "../core/init.ts";
import { registerWorkflowResources } from "../mcp/resources/workflow/index.ts";
import { McpServer } from "../mcp/server.ts";
import { registerWorkflowTools } from "../mcp/tools/workflow/index.ts";
import { BacklogServer } from "../server/index.ts";
import { getTestCliPath } from "./test-cli.ts";
import { createUniqueTestDir, safeCleanup } from "./test-utils.ts";

const CLI = getTestCliPath();
let dir: string;
afterEach(async () => {
	if (dir) await safeCleanup(dir);
});

describe("Automatic task management permission", () => {
	it("defaults off, round trips both values and preserves consent on re-init", async () => {
		dir = createUniqueTestDir("task-permission");
		const core = new Core(dir);
		const options = { projectName: "Permission", integrationMode: "none" as const, filesystemOnly: true };
		await initializeProject(core, options);
		expect((await core.filesystem.loadConfig())?.automaticTaskManagement).toBe(false);
		await initializeProject(core, {
			...options,
			automaticTaskManagement: true,
			existingConfig: await core.filesystem.loadConfig(),
		});
		expect((await new Core(dir).filesystem.loadConfig())?.automaticTaskManagement).toBe(true);
		await initializeProject(core, { ...options, existingConfig: await core.filesystem.loadConfig() });
		expect((await core.filesystem.loadConfig())?.automaticTaskManagement).toBe(true);
		await initializeProject(core, {
			...options,
			automaticTaskManagement: false,
			existingConfig: await core.filesystem.loadConfig(),
		});
		expect((await new Core(dir).filesystem.loadConfig())?.automaticTaskManagement).toBe(false);
	});

	it("CLI opt-in, opt-out, re-init and explicit task commands", async () => {
		dir = createUniqueTestDir("task-permission-cli");
		await mkdir(dir, { recursive: true });
		await $`bun ${CLI} init Permission --defaults --no-git --integration-mode none`.cwd(dir).quiet();
		expect((await $`bun ${CLI} config get automaticTaskManagement`.cwd(dir).text()).trim()).toBe("false");
		await $`bun ${CLI} task create Explicit --plain`.cwd(dir).quiet();
		const disabled = await $`bun ${CLI} instructions overview`.cwd(dir).text();
		expect(disabled).toContain("Not allowed (default)");
		await $`bun ${CLI} init Permission --defaults --no-git --integration-mode none --automatic-task-management true`
			.cwd(dir)
			.quiet();
		await $`bun ${CLI} init Permission --defaults --no-git --integration-mode none`.cwd(dir).quiet();
		expect((await $`bun ${CLI} config get automaticTaskManagement`.cwd(dir).text()).trim()).toBe("true");
		expect(await $`bun ${CLI} instructions task-creation`.cwd(dir).text()).toContain(
			"Allowed: within the user-authorized work",
		);
		await $`bun ${CLI} config set automaticTaskManagement false`.cwd(dir).quiet();
		expect((await $`bun ${CLI} config get automaticTaskManagement`.cwd(dir).text()).trim()).toBe("false");
		const invalid = await $`bun ${CLI} init Permission --defaults --no-git --automatic-task-management perhaps`
			.cwd(dir)
			.nothrow()
			.quiet();
		expect(invalid.exitCode).not.toBe(0);
		expect((await new Core(dir).filesystem.loadConfig())?.automaticTaskManagement).toBe(false);
	}, 20000);

	it.each([false, true, "false"])("HTTP validates and persists permission %s", async (value) => {
		dir = createUniqueTestDir("task-permission-http");
		const server = new BacklogServer(dir) as unknown as { handleInit(req: Request): Promise<Response> };
		const response = await server.handleInit(
			new Request("http://localhost/api/init", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					projectName: "Permission",
					integrationMode: "none",
					filesystemOnly: true,
					automaticTaskManagement: value,
				}),
			}),
		);
		expect(response.status).toBe(typeof value === "boolean" ? 200 : 400);
		const config = await new Core(dir).filesystem.loadConfig();
		if (typeof value === "boolean") expect(config?.automaticTaskManagement).toBe(value);
		else expect(config).toBeNull();
	});

	it("MCP resources and tools reflect permission changes without restart", async () => {
		dir = createUniqueTestDir("task-permission-mcp");
		const core = new Core(dir);
		await initializeProject(core, { projectName: "Permission", integrationMode: "none", filesystemOnly: true });
		const server = new McpServer(dir, "Test");
		registerWorkflowTools(server);
		registerWorkflowResources(server);
		try {
			for (const allowed of [false, true, false]) {
				const config = await server.filesystem.loadConfig();
				if (!config) throw new Error("Missing config");
				await server.filesystem.saveConfig({ ...config, automaticTaskManagement: allowed });
				const tool = await server.testInterface.callTool({
					params: { name: "get_backlog_instructions", arguments: { instruction: "task-execution" } },
				});
				const resource = await server.testInterface.readResource({
					params: { uri: "backlog://workflow/task-execution" },
				});
				const expected = allowed ? "Allowed: within" : "Not allowed (default)";
				expect(JSON.stringify(tool)).toContain(expected);
				expect(JSON.stringify(resource)).toContain(expected);
			}
		} finally {
			await server.stop();
		}
	});
});
