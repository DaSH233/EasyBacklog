import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import ReferenceLink from "../web/components/ReferenceLink";

describe("website reference labels", () => {
	let dom: JSDOM;
	let root: Root;
	let container: HTMLElement;
	let previous: Record<string, unknown>;
	let request: ReturnType<typeof spyOn<typeof globalThis, "fetch">>;
	beforeEach(() => {
		dom = new JSDOM("<div id='root'></div>", { url: "http://localhost" });
		const values = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true };
		previous = Object.fromEntries(Object.keys(values).map(key => [key, (globalThis as Record<string, unknown>)[key]]));
		Object.assign(globalThis, values);
		container = dom.window.document.getElementById("root") as HTMLElement;
		root = createRoot(container);
		request = spyOn(globalThis, "fetch");
	});
	afterEach(async () => {
		await act(async () => root.unmount());
		request.mockRestore();
		dom.window.close();
		Object.assign(globalThis, previous);
	});
	const render = async (href: string) => {
		await act(async () => { root.render(<ReferenceLink href={href} />); });
		return container.querySelector("a")!;
	};

	it("shows a GitHub icon and only the first-line commit title while preserving the URL", async () => {
		request.mockResolvedValue(new Response(JSON.stringify({ commit: { message: "Fix board loading\n\nLong explanation" } })));
		const href = "https://github.com/example/project/commit/abcdef1234567890?diff=split#file";
		const link = await render(href);
		expect(link.textContent).toBe("Fix board loading");
		expect(link.getAttribute("href")).toBe(href);
		expect(link.querySelector("svg")).not.toBeNull();
		expect(request.mock.calls[0]?.[0]).toBe("https://api.github.com/repos/example/project/commits/abcdef1234567890");
	});

	it("identifies issue and PR titles and repository and file names", async () => {
		request.mockImplementation(Object.assign(async () => new Response(JSON.stringify({ title: "A useful title" })), { preconnect: () => {} }));
		expect((await render("https://github.com/example/project/issues/11")).textContent).toBe("example/project Issue #11 · A useful title");
		expect((await render("https://github.com/example/project/pull/12")).textContent).toBe("example/project PR #12 · A useful title");
		expect((await render("https://github.com/example/project")).textContent).toBe("example/project");
		expect((await render("https://github.com/example/project/blob/main/docs/hello%20world.md")).textContent).toBe("example/project · docs/hello world.md");
	});

	it("keeps links usable when GitHub titles are unavailable", async () => {
		request.mockRejectedValue(new Error("offline"));
		const link = await render("https://github.com/example/project/commit/123456789abcdef");
		expect(link.textContent).toBe("12345678");
		expect(link.querySelector("svg")).not.toBeNull();
	});

	it("does not identify other sites or lookalike hosts as GitHub", async () => {
		for (const href of ["https://example.com/page", "https://github.com.example.com/user/repo", "https://github.com@evil.example/user/repo"]) {
			const link = await render(href);
			expect(link.textContent).toBe(href);
			expect(link.querySelector("svg")).toBeNull();
		}
		expect(request.mock.calls).toHaveLength(0);
	});
});
