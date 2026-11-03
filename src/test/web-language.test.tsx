import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { JSDOM } from "jsdom";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import type { BacklogConfig, Task } from "../types";
import Settings from "../web/components/Settings";
import SideNavigation from "../web/components/SideNavigation";
import TaskCard from "../web/components/TaskCard";
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
				<SideNavigation taskCount={1} docs={[]} decisions={[]} isLoading={false} onRefreshData={async () => {}} />
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
});
