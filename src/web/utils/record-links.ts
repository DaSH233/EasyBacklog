import { fromMarkdown } from "mdast-util-from-markdown";
import type { Task } from "../../types/index.ts";
import { decisionIdKey } from "../../utils/decision-id.ts";
import { documentIdKey } from "../../utils/document-id.ts";
import { buildTaskIdIndex } from "./task-id-links.ts";

type RecordIdentity = { id: string; title: string };
type Node = { type: string; value?: string; url?: string; children?: Node[] };
export type RecordLinkIndex = Map<string, RecordIdentity>;
const skipped = new Set(["link", "linkReference", "definition", "code", "inlineCode"]);

export function buildRecordLinkIndex(docs: RecordIdentity[], decisions: RecordIdentity[]): RecordLinkIndex {
	const index: RecordLinkIndex = new Map();
	const seen = new Set<string>();
	for (const [records, keyFor] of [
		[docs, documentIdKey],
		[decisions, decisionIdKey],
	] as const) {
		for (const record of records) {
			const key = keyFor(record.id);
			if (!key) continue;
			if (seen.has(key)) {
				index.delete(key);
				continue;
			}
			seen.add(key);
			index.set(key, record);
		}
	}
	return index;
}

function matches(value: string) {
	return Array.from(value.matchAll(/#?(?:doc|decision)-[0-9]+/gi))
		.filter((match) => {
			const start = match.index;
			const end = start + match[0].length;
			return (
				!/[\p{L}\p{N}\p{M}_/\\.#-]$/u.test(value.slice(0, start)) &&
				!/^[\p{L}\p{N}\p{M}_/\\-]|^\.[\p{L}\p{N}\p{M}]/u.test(value.slice(end))
			);
		})
		.map((match) => {
			const id = match[0].replace(/^#/, "");
			const isDoc = /^doc-/i.test(id);
			return {
				start: match.index,
				text: match[0],
				key: (isDoc ? documentIdKey(id) : decisionIdKey(id)) as string,
				route: isDoc ? "documentation" : "decisions",
			};
		});
}

function visit(node: Node, onText: (node: Node) => Node[]): void {
	if (skipped.has(node.type) || !node.children) return;
	node.children = node.children.flatMap((child) => {
		if (child.type === "text") return onText(child);
		visit(child, onText);
		return [child];
	});
}

export function createRecordLinkPlugin(index: RecordLinkIndex) {
	return () => (tree: Node) =>
		visit(tree, (node) => {
			const value = node.value ?? "";
			const parts: Node[] = [];
			let cursor = 0;
			for (const ref of matches(value)) {
				parts.push({ type: "text", value: value.slice(cursor, ref.start) });
				const title = index.get(ref.key)?.title;
				parts.push({
					type: "link",
					url: `/${ref.route}/${ref.key}`,
					children: [{ type: "text", value: title ? `${ref.text} — ${title}` : ref.text }],
				});
				cursor = ref.start + ref.text.length;
			}
			parts.push({ type: "text", value: value.slice(cursor) });
			return parts;
		});
}

/** Derived only from displayed Markdown fields; never writes records or scans frontmatter. */
export function buildRecordBacklinks(tasks: Task[]): Map<string, Task[]> {
	const backlinks = new Map<string, Task[]>();
	for (const task of buildTaskIdIndex(tasks).values()) {
		const keys = new Set<string>();
		const bodies = [
			task.description,
			task.implementationPlan,
			task.implementationNotes,
			task.finalSummary,
			...(task.comments ?? []).map((comment) => comment.body),
		];
		for (const body of bodies) {
			if (!body) continue;
			const tree = fromMarkdown(body, { extensions: [{ disable: { null: ["htmlFlow", "htmlText"] } }] });
			visit(tree, (node) => {
				for (const ref of matches(node.value ?? "")) keys.add(ref.key);
				return [node];
			});
		}
		for (const key of keys) backlinks.set(key, [...(backlinks.get(key) ?? []), task]);
	}
	return backlinks;
}
