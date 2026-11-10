import { useEffect, useState } from "react";

type GitHubReference = { label: string; api?: string; titleField?: "title" | "commit" | "name" };

function identifyGitHub(href: string): GitHubReference | null {
	try {
		const url = new URL(href);
		if (!/^https?:$/.test(url.protocol) || url.hostname !== "github.com" || url.port || url.username || url.password) return null;
		const parts = url.pathname.split("/").filter(Boolean);
		const [owner, repo, kind, id] = parts;
		if (!owner || !/^[\w-]+$/.test(owner)) return { label: "GitHub" };
		if (!repo) return { label: `@${owner}`, api: `https://api.github.com/users/${owner}`, titleField: "name" };
		if (!/^[\w.-]+$/.test(repo)) return { label: url.pathname };
		const name = `${owner}/${repo.replace(/\.git$/, "")}`;
		const api = `https://api.github.com/repos/${name}`;
		if (kind === "commit" && id && /^[a-f\d]{7,64}$/i.test(id)) return { label: id.slice(0, 8), api: `${api}/commits/${id}`, titleField: "commit" };
		if ((kind === "issues" || kind === "pull") && id && /^\d+$/.test(id)) return { label: `${name} ${kind === "pull" ? "PR" : "Issue"} #${id}`, api: `${api}/issues/${id}`, titleField: "title" };
		if ((kind === "blob" || kind === "tree") && parts.length > 4) return { label: `${name} · ${parts.slice(4).map(decodeURIComponent).join("/")}` };
		return { label: parts.length <= 2 ? name : `${name} · ${parts.slice(2).map(decodeURIComponent).join("/")}` };
	} catch { return null; }
}

// Reopening a task should not repeatedly query GitHub or block task rendering.
const titles = new Map<string, { expires: number; value: Promise<string | null> }>();
function loadTitle(link: GitHubReference): Promise<string | null> {
	if (!link.api) return Promise.resolve(null);
	const cached = titles.get(link.api);
	if (cached && cached.expires > Date.now()) return cached.value;
	const value = fetch(link.api, { signal: AbortSignal.timeout(4000), credentials: "omit", redirect: "error" })
		.then(async response => {
			if (!response.ok) return null;
			const data = await response.json();
			const title = link.titleField === "commit" ? data.commit?.message : data[link.titleField ?? "title"];
			return typeof title === "string" ? title.split(/\r?\n/)[0]?.trim().slice(0, 200) || null : null;
		}).catch(() => null);
	if (titles.size >= 200) titles.clear();
	titles.set(link.api, { expires: Date.now() + 5 * 60_000, value });
	return value;
}

export default function ReferenceLink({ href }: { href: string }) {
	const github = identifyGitHub(href);
	const [title, setTitle] = useState<{ href: string; text: string } | null>(null);
	useEffect(() => {
		let active = true;
		const link = identifyGitHub(href);
		if (link) void loadTitle(link).then(text => { if (active && text) setTitle({ href, text }); });
		return () => { active = false; };
	}, [href]);
	const label = github?.label ?? href;
	const resolvedTitle = title?.href === href ? title.text : null;
	const text = github?.titleField === "commit" ? resolvedTitle ?? label : resolvedTitle ? `${label} · ${resolvedTitle}` : label;
	return (
		<a href={href} title={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
			{github && <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0">
				<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
			</svg>}
			<span>{text}</span>
		</a>
	);
}
