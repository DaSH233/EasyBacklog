import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { readContentViewMode, rememberContentViewMode } from "../web/utils/content-view-mode";

const originalWindow = globalThis.window;
afterEach(() => {
	globalThis.window = originalWindow;
});
describe("content view mode", () => {
	it("scopes modes by record and kind and rejects invalid stored values", () => {
		globalThis.window = new JSDOM("", { url: "http://localhost" }).window as unknown as Window & typeof globalThis;
		expect(readContentViewMode("task", "BACK-1")).toBe("preview");
		rememberContentViewMode("task", "BACK-1", "edit");
		expect(readContentViewMode("task", "back-1")).toBe("edit");
		expect(readContentViewMode("document", "BACK-1")).toBe("preview");
		expect(readContentViewMode("task", "BACK-2")).toBe("preview");
		window.sessionStorage.setItem("backlog:content-mode:task:back-1", "invalid");
		expect(readContentViewMode("task", "BACK-1")).toBe("preview");
	});
	it("works when session storage is unavailable", () => {
		globalThis.window = new JSDOM("").window as unknown as Window & typeof globalThis;
		expect(readContentViewMode("task", "BACK-1")).toBe("preview");
		expect(rememberContentViewMode("task", "BACK-1", "edit")).toBe("edit");
	});
});
