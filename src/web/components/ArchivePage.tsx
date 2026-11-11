import { useArchiveDeletion } from "./ArchiveDeletion";
import { useEffect, useState, useRef, type ComponentProps } from "react";
import { useSearchParams } from "react-router-dom";
import TaskArchive from "./TaskArchive";
import StoredDate from "./StoredDate";
import Modal from "./Modal";
import MermaidMarkdown from "./MermaidMarkdown";
import { useTranslation } from "../contexts/LanguageContext";

const categories = {
	tasks: "Tasks",
	drafts: "Drafts",
	documents: "Documents",
	milestones: "Milestones",
} as const;
type Category = keyof typeof categories;
type RecordRow = {
	id: string;
	title: string;
	status?: string;
	createdDate?: string;
	date?: string;
	dueDate?: string;
	rawContent?: string;
	description?: string;
};

export default function ArchivePage(props: ComponentProps<typeof TaskArchive>) {
	const { t } = useTranslation();
	const [params, setParams] = useSearchParams();
	const requested = params.get("category") ?? "tasks";
	const category: Category = Object.hasOwn(categories, requested) ? (requested as Category) : "tasks";
	return (
		<>
			<div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 pt-4">
				<div role="tablist" aria-label={t("Archive categories")} className="flex gap-1 overflow-x-auto">
					{Object.entries(categories).map(([key, label], index) => (
						<button
							key={key}
							id={`archive-tab-${key}`}
							type="button"
							role="tab"
							aria-selected={category === key}
							aria-controls={`archive-panel-${key}`}
							tabIndex={category === key ? 0 : -1}
							onClick={() => setParams({ category: key })}
							onKeyDown={(event) => {
								const keys = Object.keys(categories);
								let next: number;
								if (event.key === "ArrowRight") next = (index + 1) % keys.length;
								else if (event.key === "ArrowLeft") next = (index + keys.length - 1) % keys.length;
								else if (event.key === "Home") next = 0;
								else if (event.key === "End") next = keys.length - 1;
								else return;
								event.preventDefault();
								const nextKey = keys[next];
								if (!nextKey) return;
								setParams({ category: nextKey });
								document.getElementById(`archive-tab-${nextKey}`)?.focus();
							}}
							className={`shrink-0 px-5 py-3 text-sm border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${category === key ? "border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 font-semibold" : "border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
						>
							{t(label)}
						</button>
					))}
				</div>
			</div>
			<section
				role="tabpanel"
				id={`archive-panel-${category}`}
				aria-labelledby={`archive-tab-${category}`}
				tabIndex={0}
			>
				{category === "tasks" ? (
					<TaskArchive {...props} />
				) : (
					<RecordArchiveList
						key={category}
						category={category}
						onRefreshData={props.onRefreshData}
						dateFormat={props.dateFormat}
					/>
				)}
			</section>
		</>
	);
}
function RecordArchiveList({
	category,
	onRefreshData,
	dateFormat,
}: {
	category: Exclude<Category, "tasks">;
	onRefreshData: () => Promise<void>;
	dateFormat?: string;
}) {
	const { t } = useTranslation();
	const [rows, setRows] = useState<RecordRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [query, setQuery] = useState("");
	const [pending, setPending] = useState<string | null>(null);
	const running = useRef(false);
	const [preview, setPreview] = useState<RecordRow | null>(null);
	const [sort, setSort] = useState<"id" | "title" | "created">("id");
	const [descending, setDescending] = useState(true);
	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);
		setError("");
		fetch(`/api/archive/${category}`, { signal: controller.signal })
			.then(async (response) => {
				if (!response.ok) {
					const body = await response.json();
					throw new Error(body.error || "Failed to load archive");
				}
				return response.json();
			})
			.then((data) => setRows(data))
			.catch((error) => {
				if (!controller.signal.aborted) setError(String(error.message));
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});
		return () => controller.abort();
	}, [category]);
	const restore = async (record: RecordRow) => {
		if (running.current || !window.confirm(t('Restore "{0}" to its original list?', { "0": record.title }))) return;
		running.current = true;
		setPending(record.id);
		setError("");
		setNotice("");
		try {
			const response = await fetch(`/api/archive/${category}/${encodeURIComponent(record.id)}/restore`, {
				method: "POST",
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Restore failed");
			setRows((current) => current.filter((row) => row.id !== record.id));
			setNotice(result.warning || t("Restored {0}", { "0": record.id }));
			await onRefreshData();
		} catch (error) {
			setError(error instanceof Error ? error.message : String(error));
		} finally {
			running.current = false;
			setPending(null);
		}
	};
	const filtered = rows
		.filter((row) => `${row.id} ${row.title}`.toLowerCase().includes(query.trim().toLowerCase()))
		.sort((a, b) => {
			const value = (row: RecordRow) => (sort === "created" ? (row.createdDate ?? row.date ?? "") : row[sort]);
			return (
				(descending ? -1 : 1) * value(a).localeCompare(value(b), undefined, { numeric: true, sensitivity: "base" })
			);
		});
	const header = (label: string, key: typeof sort) => (
		<th scope="col" className="px-3 py-2" aria-sort={sort !== key ? "none" : descending ? "descending" : "ascending"}>
			<button
				onClick={() => {
					if (sort === key) setDescending(!descending);
					else {
						setSort(key);
						setDescending(key !== "title");
					}
				}}
			>
				{t(label)} <span aria-hidden="true">{sort === key ? (descending ? "▼" : "▲") : "↕"}</span>
			</button>
		</th>
	);
	const deletion = useArchiveDeletion(category, rows, filtered, pending !== null || loading, async (ids) => {
		setRows((current) => current.filter((row) => !ids.includes(row.id)));
		await onRefreshData();
	});
	return (
		<div className="page-shell min-w-0">
			<div className="my-6 flex flex-wrap gap-3">
				<input
					aria-label={t("Search archived records")}
					placeholder={t("Search archived records")}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="min-w-0 flex-1 max-w-md border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800"
				/>
				{deletion.toolbar}
			</div>
			{error && (
				<p role="alert" className="mb-4 text-red-600 dark:text-red-400">
					{t(error)}
				</p>
			)}
			{notice && (
				<p role="status" className="mb-4 text-green-700 dark:text-green-400">
					{notice}
				</p>
			)}
			{deletion.notice}
			{deletion.dialog}
			{loading ? (
				<p role="status">{t("Loading...")}</p>
			) : (
				<>
					<p className="text-sm text-gray-500 mb-3">{t("{0} archived records", { "0": filtered.length })}</p>
					{!filtered.length ? (
						<p>{t("No archived records found")}</p>
					) : (
						<div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
							<table className="w-full min-w-[640px] table-fixed border-collapse">
								<colgroup>
									<col className="w-11" />
									<col className="w-28" />
									<col />
									<col className="w-36" />
									<col className="w-44" />
								</colgroup>
								<thead className="bg-gray-50 dark:bg-gray-700">
									<tr className="text-left text-xs text-gray-500 dark:text-gray-300">
										<th className="p-0">{deletion.selectAll}</th>
										{header("ID", "id")}
										{header("Title", "title")}
										{header("Created", "created")}
										<th className="px-3 py-2">{t("Actions")}</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
									{filtered.map((row, index) => (
										<tr
											key={`${row.id}:${index}`}
											className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
										>
											<td className="p-0">{deletion.checkbox(row)}</td>
											<td className="px-3 py-2.5 text-xs font-mono text-gray-500">{row.id}</td>
											<td className="px-3 py-2.5">
												<button
													onClick={() => setPreview(row)}
													className="block w-full truncate text-left text-sm"
													title={row.title}
												>
													{row.title}
												</button>
											</td>
											<td className="px-3 py-2.5 text-xs text-gray-500">
												<StoredDate value={row.createdDate ?? row.date} dateFormat={dateFormat} compact />
											</td>
											<td className="px-3 py-2.5">
												<button
													aria-label={t("Restore {0}", { "0": row.id })}
													disabled={pending !== null || deletion.busy}
													onClick={() => void restore(row)}
													className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-xs disabled:opacity-50"
												>
													{t(pending === row.id ? "Restoring..." : "Restore")}
												</button>
												{deletion.button(row)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>
			)}
			<Modal
				isOpen={preview !== null}
				onClose={() => setPreview(null)}
				title={preview ? `${preview.id} — ${preview.title}` : ""}
				maxWidthClass="max-w-5xl"
			>
				{preview && (
					<>
						<p className="mb-4 text-sm text-gray-500">{t("Archived record · Read-only")}</p>
						<MermaidMarkdown source={preview.rawContent ?? preview.description ?? ""} />
					</>
				)}
			</Modal>
		</div>
	);
}
