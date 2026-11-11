import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { chmod, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Core } from "../core/backlog.ts";
import { serializeDocument } from "../markdown/serializer.ts";
import type { Document } from "../types/index.ts";
import { documentIdKey, documentIdsEqual } from "../utils/document-id.ts";
import { hasContentIdentityIssues } from "../utils/duplicate-detection.ts";
import { AmbiguousIdError } from "../utils/entity-id.ts";
import { createUniqueTestDir, initializeFilesystemTestProject, isWindows, safeCleanup } from "./test-utils.ts";

let TEST_DIR: string;
let core: Core;

function makeDocument(id: string, title: string): Document {
	return {
		id,
		title,
		type: "other",
		createdDate: "2026-08-01 00:00",
		rawContent: `${title} body`,
	};
}

async function writeDocument(relativePath: string, document: Document): Promise<string> {
	const filePath = join(core.filesystem.docsDir, ...relativePath.split("/"));
	await mkdir(join(filePath, ".."), { recursive: true });
	await Bun.write(filePath, serializeDocument(document));
	return filePath;
}

// gray-matter rejects an unterminated flow collection, so these files cannot be parsed at all.
function malformedFrontmatter(id: string): string {
	return `---\nid: ${id}\ntitle: [unterminated\n---\n\n${id} body\n`;
}

async function writeRaw(directory: string, relativePath: string, content: string): Promise<void> {
	const filePath = join(directory, ...relativePath.split("/"));
	await mkdir(join(filePath, ".."), { recursive: true });
	await Bun.write(filePath, content);
}

beforeEach(async () => {
	TEST_DIR = createUniqueTestDir("content-identity");
	await mkdir(TEST_DIR, { recursive: true });
	core = new Core(TEST_DIR);
	await initializeFilesystemTestProject(core, "Content identity");
});

afterEach(async () => {
	core.disposeSearchService();
	core.disposeContentStore();
	await safeCleanup(TEST_DIR);
});

describe("blank entity IDs", () => {
	it("never match another ID, including another blank one", () => {
		expect(documentIdsEqual("", "")).toBe(false);
		expect(documentIdsEqual("doc-", "doc-")).toBe(false);
		expect(documentIdsEqual("   ", "doc-1")).toBe(false);
		expect(documentIdsEqual("doc-1", "doc-001")).toBe(true);
	});

	it("have no canonical lookup key", () => {
		expect(documentIdKey("")).toBeNull();
		expect(documentIdKey("doc-")).toBeNull();
		expect(documentIdKey("doc-01")).toBe("doc-1");
	});

	it("keep documents without an id in frontmatter unaddressable", async () => {
		await writeDocument("no-id.md", { ...makeDocument("", "Unidentified doc"), id: "" });

		expect((await core.filesystem.listDocuments()).map((document) => document.title)).toContain("Unidentified doc");

		expect(await core.getDocument("")).toBeNull();
		expect(await core.getDocumentViewText("")).toBeNull();
		expect(core.filesystem.loadDocument("")).rejects.toThrow("Document not found");
	});
});

describe("ambiguous content identity", () => {
	it("fails closed when a document ID matches several files", async () => {
		await writeDocument("doc-1 - Alpha.md", makeDocument("doc-1", "Alpha"));
		await writeDocument("nested/doc-01 - Beta.md", makeDocument("doc-01", "Beta"));

		expect(core.getDocument("doc-1")).rejects.toBeInstanceOf(AmbiguousIdError);
		expect(core.filesystem.loadDocument("DOC-001")).rejects.toBeInstanceOf(AmbiguousIdError);

		const error = await core.getDocument("doc-1").catch((caught: unknown) => caught);
		expect(error).toBeInstanceOf(AmbiguousIdError);
		expect((error as AmbiguousIdError).message).toContain("Document ID doc-1 is ambiguous; 2 files match:");
		// Each file is named from the project root, so its folder (docs or archive) is part of the name.
		expect((error as AmbiguousIdError).candidates).toEqual([
			"backlog/docs/doc-1 - Alpha.md",
			"backlog/docs/nested/doc-01 - Beta.md",
		]);
		expect((error as AmbiguousIdError).message).toContain("backlog doctor");
	});

	it("still resolves unambiguous IDs", async () => {
		await writeDocument("doc-1 - Alpha.md", makeDocument("doc-1", "Alpha"));

		expect((await core.getDocument("1"))?.title).toBe("Alpha");
		expect(await core.getDocument("doc-9")).toBeNull();
	});
});

describe("diagnoseContentIdentity", () => {
	it("reports nothing for a healthy project", async () => {
		await writeDocument("doc-1 - Alpha.md", makeDocument("doc-1", "Alpha"));

		expect(await core.diagnoseContentIdentity()).toEqual({
			documents: { duplicates: [], missingIds: [], unreadable: [] },
		});
	});

	it("groups duplicate document IDs by canonical ID", async () => {
		await writeDocument("doc-1 - Alpha.md", makeDocument("doc-1", "Alpha"));
		await writeDocument("nested/doc-01 - Beta.md", makeDocument("doc-01", "Beta"));

		const report = await core.diagnoseContentIdentity();
		expect(report.documents.duplicates).toEqual([
			{ id: "doc-1", paths: ["backlog/docs/doc-1 - Alpha.md", "backlog/docs/nested/doc-01 - Beta.md"] },
		]);
	});

	it("reports documents with no id as malformed", async () => {
		await writeDocument("no-id.md", { ...makeDocument("", "Unidentified doc"), id: "" });

		const report = await core.diagnoseContentIdentity();
		expect(report.documents.missingIds).toEqual(["backlog/docs/no-id.md"]);
		expect(report.documents.duplicates).toEqual([]);
	});
});

describe("unreadable content files", () => {
	it("keeps every other document resolvable", async () => {
		await writeDocument("doc-1 - Alpha.md", makeDocument("doc-1", "Alpha"));
		await writeRaw(core.filesystem.docsDir, "doc-2 - Broken.md", malformedFrontmatter("doc-2"));

		const unreadableDocuments: string[] = [];
		const documents = await core.filesystem.listDocuments(unreadableDocuments);
		expect(documents.map((document) => document.id)).toEqual(["doc-1"]);
		expect(unreadableDocuments).toEqual(["doc-2 - Broken.md"]);

		expect((await core.getDocument("doc-1"))?.title).toBe("Alpha");
	});

	it("are reported as findings so identity is never called healthy on an unread file", async () => {
		await writeRaw(core.filesystem.docsDir, "nested/doc-2 - Broken.md", malformedFrontmatter("doc-9"));

		const report = await core.diagnoseContentIdentity();
		expect(report.documents.unreadable).toEqual(["backlog/docs/nested/doc-2 - Broken.md"]);
		expect(report.documents.duplicates).toEqual([]);
		expect(report.documents.missingIds).toEqual([]);
		expect(hasContentIdentityIssues(report)).toBe(true);
	});
});

describe("unreadable content directories", () => {
	// chmod has no effect for root, and Windows ignores these mode bits, so confirm the directory
	// really became unreadable before asserting on the finding.
	async function lockDirectory(directory: string): Promise<boolean> {
		if (isWindows()) return false;
		await chmod(directory, 0o000);
		try {
			await Array.fromAsync(new Bun.Glob("*.md").scan({ cwd: directory, followSymlinks: true }));
			await chmod(directory, 0o755);
			return false;
		} catch {
			return true;
		}
	}

	it("reports a directory that cannot be scanned instead of calling identity healthy", async () => {
		await writeDocument("doc-1 - Alpha.md", makeDocument("doc-1", "Alpha"));
		const locked = await lockDirectory(core.filesystem.docsDir);
		if (!locked) return;

		try {
			const unreadable: string[] = [];
			expect(await core.filesystem.listDocuments(unreadable)).toEqual([]);
			expect(unreadable).toEqual([""]);

			const report = await core.diagnoseContentIdentity();
			expect(report.documents.unreadable).toEqual(["backlog/docs"]);
			expect(hasContentIdentityIssues(report)).toBe(true);
		} finally {
			await chmod(core.filesystem.docsDir, 0o755);
		}
	});

	it("still treats a directory that does not exist as empty", async () => {
		// A project that has never created docs is healthy, not broken.
		const bareDir = createUniqueTestDir("content-identity-bare");
		await mkdir(bareDir, { recursive: true });
		const bare = new Core(bareDir);
		await initializeFilesystemTestProject(bare, "Bare project");
		await safeCleanup(bare.filesystem.docsDir);

		try {
			const unreadable: string[] = [];
			expect(await bare.filesystem.listDocuments(unreadable)).toEqual([]);
			expect(unreadable).toEqual([]);
			expect(hasContentIdentityIssues(await bare.diagnoseContentIdentity())).toBe(false);
		} finally {
			bare.disposeSearchService();
			bare.disposeContentStore();
			await safeCleanup(bareDir);
		}
	});
});
