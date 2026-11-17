import { afterEach, describe, expect, it, mock } from "bun:test";
import { JSDOM } from "jsdom";
import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { Task } from "../types/index.ts";
import { TaskDetailsModal } from "../web/components/TaskDetailsModal";
import { TaskIdIndexProvider } from "../web/contexts/TaskIdIndexContext.tsx";
import { ThemeProvider } from "../web/contexts/ThemeContext";
import { setNativeInputValue } from "./react-dom-input.ts";

let activeRoot: Root | null = null;
let activeDom: JSDOM | null = null;
let currentPath = "";

const dependency: Task = {
	id: "BACK-2",
	title: "Dependency task",
	status: "To Do",
	assignee: [],
	createdDate: "2026-08-07",
	labels: [],
	dependencies: [],
};

const task: Task = {
	id: "BACK-1",
	title: "Task being edited",
	status: "To Do",
	assignee: [],
	createdDate: "2026-08-07",
	labels: [],
	dependencies: ["BACK-2"],
	references: [],
	comments: [{ index: 1, body: "Blocked by BACK-2 until it lands.", createdDate: "2026-08-07" }],
};

const setupDom = () => {
	activeDom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
		url: "http://localhost",
	});
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
	globalThis.window = activeDom.window as unknown as Window & typeof globalThis;
	globalThis.document = activeDom.window.document as Document;
	globalThis.navigator = activeDom.window.navigator as Navigator;
	globalThis.localStorage = activeDom.window.localStorage;
	globalThis.Element = activeDom.window.Element;
	globalThis.HTMLElement = activeDom.window.HTMLElement;
	globalThis.HTMLInputElement = activeDom.window.HTMLInputElement;
	globalThis.HTMLTextAreaElement = activeDom.window.HTMLTextAreaElement;
	globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => window.setTimeout(callback, 0);
	globalThis.cancelAnimationFrame = (handle: number) => window.clearTimeout(handle);

	window.matchMedia = () =>
		({
			matches: false,
			media: "",
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		}) as MediaQueryList;

	const htmlElementPrototype = window.HTMLElement.prototype as unknown as {
		attachEvent?: () => void;
		detachEvent?: () => void;
	};
	htmlElementPrototype.attachEvent = () => {};
	htmlElementPrototype.detachEvent = () => {};
};

function LocationProbe() {
	currentPath = useLocation().pathname;
	return null;
}

const renderModal = async (
	modalTask: Task | undefined,
	options: Partial<ComponentProps<typeof TaskDetailsModal>> = {},
): Promise<HTMLElement> => {
	setupDom();
	currentPath = "";
	const container = document.getElementById("root");
	activeRoot = createRoot(container as HTMLElement);
	await act(async () => {
		activeRoot?.render(
			<MemoryRouter initialEntries={["/tasks/BACK-1"]}>
				<ThemeProvider>
					<TaskIdIndexProvider tasks={[task, dependency]}>
						<LocationProbe />
						<TaskDetailsModal
							task={modalTask}
							isOpen={true}
							onClose={() => {}}
							availableTasks={[task, dependency]}
							{...options}
						/>
					</TaskIdIndexProvider>
				</ThemeProvider>
			</MemoryRouter>,
		);
		await Promise.resolve();
	});
	return container as HTMLElement;
};

/** Existing task, opens in preview mode. */
const mountModal = () => renderModal(task);
/** No task, opens in create mode. */
const mountCreateModal = () => renderModal(undefined);

const click = async (element: Element): Promise<MouseEvent> => {
	const event = new window.MouseEvent("click", { bubbles: true, cancelable: true });
	await act(async () => {
		element.dispatchEvent(event);
		await Promise.resolve();
	});
	return event;
};

const typeInto = async (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
	await act(async () => {
		setNativeInputValue(element, value);
		await Promise.resolve();
	});
};

const pressEnter = async (element: Element) => {
	await act(async () => {
		element.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
		await Promise.resolve();
	});
};

const startEditing = async (container: HTMLElement) => {
	const editButton = Array.from(container.querySelectorAll("button")).find(
		(button) => button.textContent?.trim() === "Edit",
	);
	expect(editButton).toBeTruthy();
	await click(editButton as Element);
};

const declineOnConfirm = () => {
	const prompts: string[] = [];
	window.confirm = (message?: string) => {
		prompts.push(message ?? "");
		return false;
	};
	return prompts;
};

const startEditingWithUnsavedChanges = async (container: HTMLElement) => {
	await startEditing(container);

	const titleInput = Array.from(container.querySelectorAll("input")).find((input) => input.value === task.title);
	expect(titleInput).toBeTruthy();
	await typeInto(titleInput as HTMLInputElement, "Task being edited with unsaved work");
};

const findLinkByText = (container: HTMLElement, text: string): HTMLAnchorElement => {
	const link = Array.from(container.querySelectorAll('a[href="/tasks/BACK-2"]')).find(
		(candidate) => candidate.textContent === text,
	);
	expect(link, `link "${text}"`).toBeTruthy();
	return link as HTMLAnchorElement;
};

/** Dependency chip: a react-router link that changes the route in place. */
const findChipLink = (container: HTMLElement) => findLinkByText(container, `${dependency.id} - ${dependency.title}`);
/** Auto-linked task ID in a comment: a plain anchor that would reload the page. */
const findCommentLink = (container: HTMLElement) => findLinkByText(container, dependency.id);

afterEach(() => {
	if (activeRoot) {
		act(() => {
			activeRoot?.unmount();
		});
		activeRoot = null;
	}
	activeDom?.window.close();
	activeDom = null;
});

describe("Task details modal navigation with unsaved edits", () => {
	it("keeps the editor open when a dependency chip is clicked and the discard prompt is declined", async () => {
		const container = await mountModal();
		await startEditingWithUnsavedChanges(container);

		let prompts = 0;
		window.confirm = () => {
			prompts += 1;
			return false;
		};

		const event = await click(findChipLink(container));

		expect(prompts).toBe(1);
		expect(event.defaultPrevented).toBe(true);
		expect(currentPath).toBe("/tasks/BACK-1");
	});

	it("navigates from a dependency chip once the discard prompt is accepted", async () => {
		const container = await mountModal();
		await startEditingWithUnsavedChanges(container);

		window.confirm = () => true;

		await click(findChipLink(container));

		expect(currentPath).toBe("/tasks/BACK-2");
	});

	it("protects a comment draft that is the only unsaved work", async () => {
		const container = await mountModal();
		await startEditing(container);

		const commentBox = container.querySelector('textarea[placeholder="Add a comment..."]');
		expect(commentBox).toBeTruthy();
		await typeInto(commentBox as HTMLTextAreaElement, "Draft comment nobody has submitted yet");

		const prompts = declineOnConfirm();
		const event = await click(findChipLink(container));

		expect(prompts.length).toBe(1);
		expect(event.defaultPrevented).toBe(true);
		expect(currentPath).toBe("/tasks/BACK-1");
	});

	it("protects create-mode metadata entered before any title", async () => {
		const container = await mountCreateModal();

		const dependencyInput = container.querySelector("#dependency-input");
		expect(dependencyInput).toBeTruthy();
		await typeInto(dependencyInput as HTMLTextAreaElement, dependency.id);
		await pressEnter(dependencyInput as Element);

		const prompts = declineOnConfirm();
		const event = await click(findChipLink(container));

		expect(prompts.length).toBe(1);
		expect(event.defaultPrevented).toBe(true);
		expect(currentPath).toBe("/tasks/BACK-1");
	});

	it("blocks an auto-linked task ID in a comment when the discard prompt is declined", async () => {
		const container = await mountModal();
		await startEditingWithUnsavedChanges(container);

		window.confirm = () => false;

		const event = await click(findCommentLink(container));

		expect(event.defaultPrevented).toBe(true);
	});

	it("lets links through while there is nothing unsaved to lose", async () => {
		const container = await mountModal();

		let prompts = 0;
		window.confirm = () => {
			prompts += 1;
			return false;
		};

		await click(findChipLink(container));

		expect(prompts).toBe(0);
		expect(currentPath).toBe("/tasks/BACK-2");
	});
});

describe("closing an unsaved create form", () => {
	it.each(["dependency", "labels", "assignee", "priority", "status", "type", "project", "milestone"])(
		"confirms before discarding only %s, and preserves input when declined",
		async (field) => {
			const onClose = mock(() => {});
			const container = await renderModal(undefined, {
				onClose,
				availableStatuses: ["To Do", "Done"],
				availablePriorities: ["High"],
				availableTypes: ["bug"],
				availableProjects: ["Website"],
				milestoneEntities: [{ id: "m-1", title: "Release", description: "", rawContent: "" }],
			});
			let edited: HTMLElement;
			if (["dependency", "labels", "assignee"].includes(field)) {
				const selector = field === "dependency" ? "#dependency-input" : `#chip-input-${field}`;
				edited = container.querySelector<HTMLElement>(selector)!;
				await typeInto(edited as HTMLInputElement, field === "dependency" ? dependency.id : "review-value");
				await pressEnter(edited);
			} else {
				const values: Record<string, string> = {
					priority: "high",
					status: "Done",
					type: "bug",
					project: "Website",
					milestone: "m-1",
				};
				const value = values[field]!;
				const select = Array.from(container.querySelectorAll("select")).find((element) =>
					Array.from(element.options).some((option) => option.value === value),
				)!;
				expect(select).toBeTruthy();
				await act(async () => {
					select.value = value;
					select.dispatchEvent(new window.Event("change", { bubbles: true }));
				});
				expect(select.value).toBe(value);
				edited = select;
			}
			const contentBeforeClose = container.textContent;
			const prompts = declineOnConfirm();
			const close = container.querySelector<HTMLButtonElement>('button[aria-label="Close modal"]')!;
			expect(close.disabled).toBe(false);
			await click(close);
			expect(prompts).toEqual(["Discard unsaved changes?"]);
			expect(onClose).not.toHaveBeenCalled();
			expect(edited.isConnected).toBe(true);
			expect(container.textContent).toBe(contentBeforeClose);
			window.confirm = () => true;
			await click(close);
			expect(onClose).toHaveBeenCalledTimes(1);
		},
	);

	it.each([false, true])("closes untouched defaults without prompting (draft: %s)", async (isDraftMode) => {
		const onClose = mock(() => {});
		const container = await renderModal(undefined, {
			onClose,
			isDraftMode,
			defaultAssignee: ["@owner"],
			definitionOfDoneDefaults: ["Review changes"],
			availableStatuses: ["Ready", "Done"],
		});
		const prompts = declineOnConfirm();
		await click(container.querySelector('button[aria-label="Close modal"]')!);
		expect(prompts).toEqual([]);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("protects removal of a prefilled default assignee on a new draft", async () => {
		const onClose = mock(() => {});
		const container = await renderModal(undefined, { onClose, isDraftMode: true, defaultAssignee: ["@owner"] });
		await click(container.querySelector('button[aria-label="Remove @owner"]')!);
		const prompts = declineOnConfirm();
		await click(container.querySelector('button[aria-label="Close modal"]')!);
		expect(prompts).toEqual(["Discard unsaved changes?"]);
		expect(onClose).not.toHaveBeenCalled();
	});

	it("does not prompt after a status change is reverted", async () => {
		const onClose = mock(() => {});
		const container = await renderModal(undefined, { onClose });
		const select = Array.from(container.querySelectorAll("select")).find((element) => element.value === "To Do")!;
		for (const value of ["Done", "To Do"]) {
			await act(async () => {
				select.value = value;
				select.dispatchEvent(new window.Event("change", { bubbles: true }));
			});
		}
		const prompts = declineOnConfirm();
		await click(container.querySelector('button[aria-label="Close modal"]')!);
		expect(prompts).toEqual([]);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});

describe("task reading mode persistence", () => {
	it("remembers edit mode across remounts, keeps archived records read-only, and remembers Cancel", async () => {
		const container = await mountModal();
		await startEditing(container);
		const remount = async (key: string, archived = false) => {
			await act(async () => {
				activeRoot?.render(
					<MemoryRouter>
						<ThemeProvider>
							<TaskDetailsModal
								key={key}
								task={{ ...task, source: archived ? "archived" : "local" }}
								isOpen
								onClose={() => {}}
							/>
						</ThemeProvider>
					</MemoryRouter>,
				);
			});
		};
		await remount("again");
		expect(container.querySelector(".w-md-editor textarea")).not.toBeNull();
		await remount("archived", true);
		expect(container.querySelector(".w-md-editor textarea")).toBeNull();
		await remount("active");
		const cancel = Array.from(container.querySelectorAll("button")).find(
			(button) => button.textContent?.trim() === "Cancel",
		);
		expect(cancel).toBeTruthy();
		await click(cancel as Element);
		await remount("preview");
		expect(container.querySelector(".w-md-editor textarea")).toBeNull();
	});
});
