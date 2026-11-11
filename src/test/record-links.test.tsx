import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { JSDOM } from "jsdom";
import type { Task } from "../types/index.ts";
import MermaidMarkdown from "../web/components/MermaidMarkdown";
import ReferencedBy from "../web/components/ReferencedBy";
import { TaskIdIndexProvider } from "../web/contexts/TaskIdIndexContext";
import { buildRecordBacklinks, buildRecordLinkIndex } from "../web/utils/record-links";
const task: Task = {
	id: "BACK-1",
	title: "Referencing task",
	status: "To Do",
	createdDate: "2026-10-29",
	assignee: [],
	labels: [],
	dependencies: [],
	description: "doc-01 and #doc-1; doc-2",
};
const docs = [{ id: "doc-001", title: "Guide <safe>" }, { id: "doc-2", title: "Architecture" }];
function render(source: string) {
	return new JSDOM(
		renderToString(
			<TaskIdIndexProvider tasks={[task]} docs={docs}>
				<MermaidMarkdown source={source} />
			</TaskIdIndexProvider>,
		),
	).window.document;
}
describe("record links", () => {
	it("leaves retired decision IDs as text without backlinks", () => {
		const source = "decision-1 and #decision-02";
		expect(render(source).querySelectorAll("a").length).toBe(0);
		expect(buildRecordBacklinks([{ ...task, description: source }]).size).toBe(0);
	});
	it("links numeric IDs, optional hashes and case variants with titles or ID fallback", () => {
		const links = Array.from(render("doc-01, #DOC-1; doc-2 and #doc-99").querySelectorAll("a"));
		expect(links.map((a) => a.getAttribute("href"))).toEqual([
			"/documentation/doc-1",
			"/documentation/doc-1",
			"/documentation/doc-2",
			"/documentation/doc-99",
		]);
		expect(links.map((a) => a.textContent)).toEqual([
			"doc-01 — Guide <safe>",
			"#DOC-1 — Guide <safe>",
			"doc-2 — Architecture",
			"#doc-99",
		]);
	});
	it("does not rewrite code, existing links, paths or longer identifiers", () => {
		const source =
			"`doc-1`\n\n```md\ndoc-2\n```\n\n[doc-1](/elsewhere) xdoc-1 dir/doc-1 doc-1.md doc-1/sub doc-1a #doc-2suffix";
		expect(Array.from(render(source).querySelectorAll("a")).map((a) => a.getAttribute("href"))).toEqual(["/elsewhere"]);
		expect(buildRecordBacklinks([{ ...task, description: source }]).size).toBe(0);
	});
	it("does not guess titles for ambiguous canonical IDs", () => {
		expect(buildRecordLinkIndex([...docs, { id: "DOC-1", title: "Duplicate" }]).has("doc-1")).toBe(false);
	});
	it("deduplicates references, covers all rendered fields, and recomputes without mutation", () => {
		const input = [
			{
				...task,
				implementationPlan: "doc-3",
				implementationNotes: "doc-4",
				finalSummary: "doc-5",
				comments: [{ index: 1, createdDate: "2026-10-29", body: "doc-6" }],
			},
		];
		const before = JSON.stringify(input);
		const result = buildRecordBacklinks(input);
		expect(result.get("doc-1")).toHaveLength(1);
		expect([...result.keys()]).toEqual(["doc-1", "doc-2", "doc-3", "doc-4", "doc-5", "doc-6"]);
		expect(JSON.stringify(input)).toBe(before);
		expect(buildRecordBacklinks([{ ...task, description: "Removed" }]).size).toBe(0);
	});
	it("renders task backlinks from the provider and removes them with changed tasks", () => {
		const output = (tasks: Task[]) =>
			renderToString(
				<MemoryRouter>
					<TaskIdIndexProvider tasks={tasks}>
						<ReferencedBy recordKey="doc-1" />
					</TaskIdIndexProvider>
				</MemoryRouter>,
			);
		expect(output([task])).toContain('href="/tasks/BACK-1"');
		expect(output([task])).toContain("Referenced by");
		expect(output([])).toBe("");
	});
});
