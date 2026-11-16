import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { JSDOM } from "jsdom";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import type { BacklogConfig, Task } from "../types";
import Settings from "../web/components/Settings";
import SideNavigation from "../web/components/SideNavigation";
import TaskCard from "../web/components/TaskCard";
import TaskColumn from "../web/components/TaskColumn";
import { TaskDetailsModal } from "../web/components/TaskDetailsModal";
import { LanguageProvider, translate, useTranslation } from "../web/contexts/LanguageContext";
import { ThemeProvider } from "../web/contexts/ThemeContext";
import { apiClient } from "../web/lib/api";
import { setNativeInputValue } from "./react-dom-input";

let root: Root | undefined;
let dom: JSDOM | undefined;
const savedGlobals = new Map<string, PropertyDescriptor | undefined>();
const mocks: Array<{ mockRestore(): void }> = [];

function setup(language?: string) {
	dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "http://localhost" });
	const values: Record<string, unknown> = {
		window: dom.window,
		document: dom.window.document,
		navigator: dom.window.navigator,
		Element: dom.window.Element,
		Event: dom.window.Event,
		CustomEvent: dom.window.CustomEvent,
		MutationObserver: dom.window.MutationObserver,
		getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
		localStorage: dom.window.localStorage,
		HTMLElement: dom.window.HTMLElement,
		HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
		HTMLInputElement: dom.window.HTMLInputElement,
		HTMLSelectElement: dom.window.HTMLSelectElement,
		IS_REACT_ACT_ENVIRONMENT: true,
		requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(callback, 0),
		cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
	};
	for (const [name, value] of Object.entries(values)) {
		savedGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
		Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
	}
	window.matchMedia = (query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	});
	if (language) localStorage.setItem("backlog-language", language);
	const container = document.getElementById("root")!;
	root = createRoot(container);
	return container;
}

async function render(children: ReactNode) {
	await act(async () => {
		root!.render(<LanguageProvider>{children}</LanguageProvider>);
	});
}

async function selectLanguage(value: string) {
	await act(async () => {
		const select = document.querySelector<HTMLSelectElement>("#language")!;
		select.value = value;
		select.dispatchEvent(new window.Event("change", { bubbles: true }));
	});
}

function Switcher() {
	const { language, setLanguage, t } = useTranslation();
	return (
		<>
			<select id="language" value={language} onChange={(e) => setLanguage(e.target.value as "en" | "zh-CN")}>
				<option value="en">English</option>
				<option value="zh-CN">简体中文</option>
			</select>
			<span>{t("Settings")}</span>
		</>
	);
}

afterEach(async () => {
	await act(async () => root?.unmount());
	root = undefined;
	for (const mock of mocks.splice(0)) mock.mockRestore();
	dom?.window.close();
	dom = undefined;
	for (const [name, descriptor] of savedGlobals) {
		if (descriptor) Object.defineProperty(globalThis, name, descriptor);
		else Reflect.deleteProperty(globalThis, name);
	}
	savedGlobals.clear();
});

describe("Web language preference", () => {
	it("falls back to English for missing messages without changing interpolation values", () => {
		expect(translate("zh-CN", "Settings")).toBe("设置");
		expect(translate("en", "Settings")).toBe("Settings");
		expect(translate("zh-CN", "New message {title}", { title: "Settings <b>{x}</b>" })).toBe(
			"New message Settings <b>{x}</b>",
		);
		expect(translate("zh-CN", "toString")).toBe("toString");
	});

	it("switches immediately, persists across remount and updates document language", async () => {
		const container = setup();
		await render(<Switcher />);
		expect(container.textContent).toContain("Settings");
		await selectLanguage("zh-CN");
		expect(container.textContent).toContain("设置");
		expect(document.documentElement.lang).toBe("zh-CN");
		expect(localStorage.getItem("backlog-language")).toBe("zh-CN");
		await act(async () => root!.unmount());
		root = createRoot(container);
		await render(<Switcher />);
		expect(container.textContent).toContain("设置");
		await selectLanguage("en");
		expect(document.documentElement.lang).toBe("en");
		expect(localStorage.getItem("backlog-language")).toBe("en");
	});

	it("uses English for invalid storage and synchronizes changes from another tab", async () => {
		const container = setup("unsupported");
		await render(<Switcher />);
		expect(container.textContent).toContain("Settings");
		await act(async () =>
			window.dispatchEvent(new window.StorageEvent("storage", { key: "backlog-language", newValue: "zh-CN" })),
		);
		expect(container.textContent).toContain("设置");
		await act(async () => window.dispatchEvent(new window.StorageEvent("storage", { key: null, newValue: null })));
		expect(container.textContent).toContain("Settings");
	});

	it("still switches when browser storage is unavailable", async () => {
		const container = setup();
		Object.defineProperty(globalThis, "localStorage", {
			configurable: true,
			get() {
				throw new Error("Storage blocked");
			},
		});
		await render(<Switcher />);
		expect(container.textContent).toContain("Settings");
		await selectLanguage("zh-CN");
		expect(container.textContent).toContain("设置");
	});

	it("settings updates memoized navigation without saving config or losing edited fields", async () => {
		const container = setup();
		const config: BacklogConfig = {
			projectName: "Settings",
			statuses: ["To Do", "Review 待审", "Done"],
			labels: [],
			dateFormat: "yyyy-mm-dd",
			defaultStatus: "To Do",
		};
		const fetchConfig = spyOn(apiClient, "fetchConfig").mockResolvedValue(config);
		const statuses = spyOn(apiClient, "fetchStatuses").mockResolvedValue(config.statuses);
		const update = spyOn(apiClient, "updateConfig").mockResolvedValue(config);
		mocks.push(fetchConfig, statuses, update);
		await render(
			<MemoryRouter>
				<Settings />
				<SideNavigation taskCount={1} docs={[]} isLoading={false} onRefreshData={async () => {}} />
			</MemoryRouter>,
		);
		const projectName = container.querySelector<HTMLInputElement>("#projectName")!;
		await act(async () => {
			setNativeInputValue(projectName, "未保存的项目 Settings");
		});
		await selectLanguage("zh-CN");
		expect(container.querySelector("h1")?.textContent).toBe("设置");
		expect(container.textContent).toContain("任务看板");
		expect(container.textContent).toContain("所有任务");
		expect(projectName.value).toBe("未保存的项目 Settings");
		expect(container.querySelector("#projectName")).toBe(projectName);
		expect(container.querySelector("#defaultStatus")?.textContent).toContain("Review 待审");
		expect(update).not.toHaveBeenCalled();
		await selectLanguage("en");
		expect(container.textContent).toContain("Kanban Board");
		expect(projectName.value).toBe("未保存的项目 Settings");
	});

	it("translates task chrome and native confirmations while preserving task values", async () => {
		const container = setup("zh-CN");
		const task: Task = {
			id: "TASK-1",
			title: "Settings",
			description: "Save Changes 原始内容",
			finalSummary: "Completion summary 用户内容",
			status: "Review 待审",
			priority: "High",
			type: "feature",
			labels: ["Settings"],
			assignee: [],
			createdDate: "2026-10-01",
			dependencies: [],
		};
		mocks.push(
			spyOn(apiClient, "fetchTasks").mockResolvedValue([]),
			spyOn(apiClient, "fetchStatuses").mockResolvedValue(["To Do", "Review 待审", "Done"]),
		);
		const confirm = spyOn(window, "confirm").mockReturnValue(false);
		mocks.push(confirm);
		await render(
			<MemoryRouter>
				<ThemeProvider>
					<Switcher />
					<TaskCard task={task} onEdit={() => {}} onUpdate={() => {}} />
					<TaskDetailsModal
						isOpen
						onArchive={async () => {}}
						task={task}
						availableStatuses={["To Do", "Review 待审", "Done"]}
						onClose={() => {}}
					/>
				</ThemeProvider>
			</MemoryRouter>,
		);
		expect(container.textContent).toContain("Save Changes 原始内容");
		expect(container.textContent).toContain("最终总结");
		expect(container.textContent?.match(/Completion summary/g)).toHaveLength(1);
		expect(container.textContent).toContain("Completion summary 用户内容");
		expect(container.textContent).toContain("Review 待审");
		expect(container.querySelector('[role="button"]')?.getAttribute("aria-label")).toContain("打开 TASK-1：Settings");
		const archive = Array.from(container.querySelectorAll("button")).find(
			(button) => button.textContent?.trim() === "归档任务",
		)!;
		expect(archive).toBeTruthy();
		await act(async () => archive.click());
		expect(confirm.mock.calls[0]?.[0]).toContain("归档“Settings”？");
		expect(task.title).toBe("Settings");
		expect(task.labels).toEqual(["Settings"]);
		const edit = Array.from(container.querySelectorAll("button")).find(
			(button) => button.textContent?.trim() === "编辑",
		)!;
		await act(async () => edit.click());
		const titleInput = Array.from(container.querySelectorAll<HTMLTextAreaElement>("textarea")).find(
			(input) => input.value === "Save Changes 原始内容",
		)!;
		expect(titleInput).toBeTruthy();
		await act(async () => setNativeInputValue(titleInput, "尚未保存的描述"));
		expect(container.querySelector('button[title="加粗（ctrl + b）"]')).toBeTruthy();
		await selectLanguage("en");
		expect(titleInput.value).toBe("尚未保存的描述");
		expect(Array.from(container.querySelectorAll("textarea"))).toContain(titleInput);
		expect(container.querySelector('button[title="Add bold text (ctrl + b)"]')).toBeTruthy();
	});
	it.each([undefined, "To Do", "Done"])(
		"translates empty columns and drop hints (source: %s)",
		async (dragSourceStatus) => {
			const container = setup("zh-CN");
			await render(
				<>
					<Switcher />
					<TaskColumn
						title="To Do"
						tasks={[]}
						dragSourceStatus={dragSourceStatus}
						onTaskUpdate={() => {}}
						onEditTask={() => {}}
					/>
				</>,
			);
			const isDrop = dragSourceStatus === "Done";
			expect(container.textContent).toContain(isDrop ? "放下以移动" : "空");
			expect(container.textContent).not.toContain(isDrop ? "Drop to move" : "Empty");
			expect(container.textContent).toContain("To Do");
			await selectLanguage("en");
			expect(container.textContent).toContain(isDrop ? "Drop to move" : "Empty");
		},
	);

	it.each(["", "   "])("rejects a blank inline title, then permits correction (%j)", async (blank) => {
		const container = setup("zh-CN");
		const task: Task = {
			id: "TASK-101",
			title: "Original title",
			status: "To Do",
			assignee: [],
			labels: [],
			dependencies: [],
			createdDate: "2026-11-16",
		};
		const update = spyOn(apiClient, "updateTask").mockResolvedValue(task);
		mocks.push(update, spyOn(apiClient, "fetchTasks").mockResolvedValue([]));
		await render(
			<ThemeProvider>
				<Switcher />
				<TaskDetailsModal isOpen task={task} availableStatuses={["To Do", "Done"]} onClose={() => {}} />
			</ThemeProvider>,
		);
		const input = Array.from(container.querySelectorAll("input")).find((input) => input.value === task.title)!;
		await act(async () => setNativeInputValue(input, blank));
		await act(async () => {
			if (blank) input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
			else input.blur();
		});
		expect(container.querySelector('[role="alert"]')?.textContent).toBe("请输入标题");
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(document.getElementById(input.getAttribute("aria-describedby")!)?.textContent).toBe("请输入标题");
		expect(update).not.toHaveBeenCalled();
		expect(task.title).toBe("Original title");
		await selectLanguage("en");
		expect(container.querySelector('[role="alert"]')?.textContent).toBe("Title is required");
		await act(async () => setNativeInputValue(input, task.title));
		await act(async () => input.blur());
		expect(container.querySelector('[role="alert"]')).toBeNull();
		expect(update).not.toHaveBeenCalled();
		await act(async () => setNativeInputValue(input, "  Corrected title  "));
		await act(async () => input.blur());
		expect(update).toHaveBeenCalledTimes(1);
		expect(update).toHaveBeenCalledWith(task.id, { title: "Corrected title" });
		expect(container.querySelector('[role="alert"]')).toBeNull();
	});

	it.each([false, true])("validates blank titles on full save (create: %s)", async (create) => {
		const container = setup("zh-CN");
		const task: Task = {
			id: "TASK-102",
			title: "Original title",
			status: "To Do",
			assignee: [],
			labels: [],
			dependencies: [],
			createdDate: "2026-11-16",
		};
		const update = spyOn(apiClient, "updateTask").mockResolvedValue(task);
		const submit = { save: async (_task: Partial<Task>) => {} };
		const onSubmit = spyOn(submit, "save");
		mocks.push(update, onSubmit, spyOn(apiClient, "fetchTasks").mockResolvedValue([]));
		await render(
			<ThemeProvider>
				<TaskDetailsModal
					isOpen
					task={create ? undefined : task}
					availableStatuses={["To Do", "Done"]}
					onSubmit={onSubmit}
					onClose={() => {}}
				/>
			</ThemeProvider>,
		);
		if (!create) {
			const edit = Array.from(container.querySelectorAll("button")).find(
				(button) => button.textContent?.trim() === "编辑",
			)!;
			await act(async () => edit.click());
		}
		const input = create
			? container.querySelector<HTMLInputElement>('input[placeholder="输入任务标题"]')!
			: Array.from(container.querySelectorAll("input")).find((input) => input.value === task.title)!;
		expect(input).toBeTruthy();
		await act(async () => setNativeInputValue(input, "   "));
		const save = Array.from(container.querySelectorAll("button")).find(
			(button) => button.textContent?.trim() === (create ? "创建" : "保存"),
		)!;
		await act(async () => save.click());
		expect(container.querySelector('[role="alert"]')?.textContent).toBe("请输入标题");
		expect(update).not.toHaveBeenCalled();
		expect(onSubmit).not.toHaveBeenCalled();
	});
	describe("title validation lifecycle", () => {
		const task: Task = {
			id: "TASK-201",
			title: "Original title",
			status: "To Do",
			priority: "high",
			assignee: [],
			labels: [],
			dependencies: [],
			createdDate: "2026-11-16",
		};
		const statuses = ["To Do", "Done"];
		const priorities = ["High", "Low"];
		const details = (value = task, isOpen = true) => (
			<ThemeProvider>
				<TaskDetailsModal
					isOpen={isOpen}
					task={value}
					availableStatuses={statuses}
					availablePriorities={priorities}
					onClose={() => {}}
				/>
			</ThemeProvider>
		);
		async function openDetails() {
			const container = setup("zh-CN");
			const update = spyOn(apiClient, "updateTask").mockResolvedValue(task);
			mocks.push(update, spyOn(apiClient, "fetchTasks").mockResolvedValue([]));
			await render(details());
			const input = container.querySelector<HTMLInputElement>('input[aria-label="标题"]')!;
			return { container, input, update };
		}
		async function invalidate(input: HTMLInputElement) {
			await act(async () => setNativeInputValue(input, "   "));
			await act(async () => input.blur());
		}
		function expectTitleError(container: HTMLElement, input: HTMLInputElement) {
			expect(container.querySelector("#task-title-error")?.textContent).toBe("请输入标题");
			expect(input.getAttribute("aria-invalid")).toBe("true");
			expect(input.getAttribute("aria-describedby")).toBe("task-title-error");
		}

		it.each([false, true])("keeps blank-title feedback through same-task refresh (edit: %s)", async (edit) => {
			const { container, input, update } = await openDetails();
			if (edit) {
				const button = Array.from(container.querySelectorAll("button")).find(
					(button) => button.textContent?.trim() === "编辑",
				)!;
				await act(async () => button.click());
			}
			await invalidate(input);
			expectTitleError(container, input);
			await render(
				details({ ...task, title: "External title", status: "Done", implementationNotes: "External notes" }),
			);
			expect(input.value).toBe("   ");
			expect(container.querySelector('input[aria-label="标题"]')).toBe(input);
			expectTitleError(container, input);
			expect(update).not.toHaveBeenCalled();
			await act(async () => setNativeInputValue(input, "Corrected title"));
			expect(container.querySelector("#task-title-error")).toBeNull();
			expect(input.getAttribute("aria-invalid")).toBe("false");
			await act(async () => input.blur());
			expect(update).toHaveBeenCalledWith(task.id, { title: "Corrected title" });
		});

		it.each(["status", "priority", "failed status"])(
			"keeps title feedback independent of a %s update",
			async (scenario) => {
				const { container, input, update } = await openDetails();
				await invalidate(input);
				expectTitleError(container, input);
				if (scenario === "failed status") {
					update.mockRejectedValueOnce(new Error("Metadata update failed"));
					mocks.push(spyOn(console, "error").mockImplementation(() => {}));
				}
				const priority = scenario === "priority";
				const select = Array.from(container.querySelectorAll("select")).find(
					(select) => select.value === (priority ? "high" : "To Do"),
				)!;
				await act(async () => {
					select.value = priority ? "low" : "Done";
					select.dispatchEvent(new window.Event("change", { bubbles: true }));
				});
				expect(update).toHaveBeenCalledTimes(1);
				expect(update).toHaveBeenCalledWith(task.id, priority ? { priority: "low" } : { status: "Done" });
				expectTitleError(container, input);
				if (scenario === "failed status") {
					expect(Array.from(container.querySelectorAll('[role="alert"]')).map((alert) => alert.textContent)).toEqual([
						"Metadata update failed",
						"请输入标题",
					]);
					await act(async () => setNativeInputValue(input, "Valid title"));
					expect(container.querySelector("#task-title-error")).toBeNull();
					expect(container.querySelector('[role="alert"]')?.textContent).toBe("Metadata update failed");
				}
			},
		);

		it("resets validation when switching tasks and reopening the modal", async () => {
			const { container, input } = await openDetails();
			await invalidate(input);
			const next = { ...task, id: "TASK-202", title: "Next title" };
			await render(details(next));
			expect(input.value).toBe(next.title);
			await act(async () => setNativeInputValue(input, ""));
			expect(container.querySelector("#task-title-error")).toBeNull();
			await act(async () => input.blur());
			expectTitleError(container, input);
			await render(details(next, false));
			await render(details(next));
			const reopened = container.querySelector<HTMLInputElement>('input[aria-label="标题"]')!;
			expect(reopened.value).toBe(next.title);
			await act(async () => setNativeInputValue(reopened, ""));
			expect(container.querySelector("#task-title-error")).toBeNull();
		});

		it("resets title validation after cancelling an edit", async () => {
			const { container, input } = await openDetails();
			mocks.push(spyOn(window, "confirm").mockReturnValue(true));
			const button = Array.from(container.querySelectorAll("button")).find(
				(button) => button.textContent?.trim() === "编辑",
			)!;
			await act(async () => button.click());
			await invalidate(input);
			const cancel = Array.from(container.querySelectorAll("button")).find(
				(button) => button.textContent?.trim() === "取消",
			)!;
			await act(async () => cancel.click());
			expect(input.value).toBe(task.title);
			expect(container.querySelector("#task-title-error")).toBeNull();
			await act(async () => setNativeInputValue(input, ""));
			expect(container.querySelector("#task-title-error")).toBeNull();
		});
	});
});
