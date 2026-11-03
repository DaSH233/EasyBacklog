export type ContentViewMode = "preview" | "edit";

const keyFor = (kind: "task" | "document", id: string) => `backlog:content-mode:${kind}:${id.toLowerCase()}`;

/** Only the display preference is stored; unsaved content never goes into storage. */
export function readContentViewMode(kind: "task" | "document", id?: string): ContentViewMode {
	if (!id) return "preview";
	try {
		return window.sessionStorage.getItem(keyFor(kind, id)) === "edit" ? "edit" : "preview";
	} catch {
		return "preview";
	}
}

export function rememberContentViewMode(
	kind: "task" | "document",
	id: string | undefined,
	mode: ContentViewMode,
): ContentViewMode {
	if (id) {
		try {
			window.sessionStorage.setItem(keyFor(kind, id), mode);
		} catch {
			/* Storage can be unavailable. */
		}
	}
	return mode;
}
