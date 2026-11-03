import { useArchiveDeletion } from "./ArchiveDeletion";
import StoredDate from "./StoredDate";
import { getStatusColor, sortTaskTable, type TaskSortColumn, type SortDirection } from "../utils/task-table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Task } from "../../types";
import { apiClient } from "../lib/api";
import { useTranslation } from "../contexts/LanguageContext";

export default function TaskArchive({
	onRefreshData,
	onOpenTask,
	dateFormat,
	availablePriorities,
}: {
	dateFormat?: string;
	availablePriorities?: string[];
	onRefreshData: () => Promise<void>;
	onOpenTask: (task: Task) => void;
}) {
	const { t } = useTranslation();
	const [sortColumn, setSortColumn] = useState<TaskSortColumn>("id");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const sortHeader = (label: string, column: TaskSortColumn) => (
		<th
			scope="col"
			className="px-3 py-2"
			aria-sort={sortColumn !== column ? "none" : sortDirection === "asc" ? "ascending" : "descending"}
		>
			<button
				type="button"
				className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100"
				onClick={() => {
					if (column === sortColumn) setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
					else {
						setSortColumn(column);
						setSortDirection(column === "id" || column === "created" ? "desc" : "asc");
					}
				}}
			>
				{t(label)}
				<span
					aria-hidden="true"
					className={`text-[10px] select-none ${sortColumn === column ? "text-gray-600 dark:text-gray-300" : "text-gray-300 dark:text-gray-600"}`}
				>
					{sortColumn === column ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
				</span>
			</button>
		</th>
	);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [pending, setPending] = useState<string | null>(null);
	const running = useRef(false);
	const generation = useRef(0);
	const load = useCallback(async () => {
		const current = ++generation.current;
		setLoading(true);
		try {
			const next = await apiClient.fetchArchivedTasks();
			if (current === generation.current) setTasks(next);
		} catch (error) {
			if (current === generation.current) setError(error instanceof Error ? error.message : String(error));
		} finally {
			if (current === generation.current) setLoading(false);
		}
	}, []);
	useEffect(() => {
		void load();
		return () => {
			generation.current++;
		};
	}, [load]);
	const restore = async (task: Task) => {
		if (
			running.current ||
			!window.confirm(t('Restore "{0}" to the board with its original status?', { "0": task.title }))
		)
			return;
		running.current = true;
		setPending(task.id);
		setError("");
		setNotice("");
		try {
			const result = await apiClient.restoreTask(task.id);
			setTasks((current) => current.filter((item) => item.id !== task.id));
			setNotice(result.warning || t("Restored {0}", { "0": task.id }));
			await onRefreshData();
		} catch (error) {
			setError(error instanceof Error ? error.message : String(error));
		} finally {
			running.current = false;
			setPending(null);
		}
	};
	const filtered = tasks.filter((task) =>
		`${task.id} ${task.title}`.toLowerCase().includes(query.trim().toLowerCase()),
	);
	const sortedTasks = useMemo(
		() => sortTaskTable(filtered, sortColumn, sortDirection, availablePriorities),
		[filtered, sortColumn, sortDirection, availablePriorities],
	);
	const deletion = useArchiveDeletion("tasks", tasks, filtered, pending !== null || loading, async (ids) => {
		setTasks((current) => current.filter((task) => !ids.includes(task.id)));
		await onRefreshData();
	});
	return (
		<div className="page-shell transition-colors duration-200 min-w-0">
			<div className="flex gap-3 flex-wrap my-6">
				<input
					aria-label={t("Search archived tasks")}
					placeholder={t("Search archived tasks")}
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					className="min-w-0 flex-1 max-w-md border border-gray-300 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
					<p className="mb-3 text-sm text-gray-500">{t("{0} archived tasks", { "0": filtered.length })}</p>
					{filtered.length === 0 ? (
						<p>{t(query ? "No matching archived tasks" : "No archived tasks")}</p>
					) : (
						<div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
							<table className="w-full table-fixed border-collapse min-w-[900px]">
								<colgroup>
									<col className="w-11" />
									<col className="w-28" />
									<col />
									<col className="w-28" />
									<col className="w-24" />
									<col className="w-36" />
									<col className="w-36" />
									<col className="w-44" />
								</colgroup>
								<thead className="bg-gray-50 dark:bg-gray-700/95 border-b border-gray-200 dark:border-gray-700">
									<tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
										<th className="p-0">{deletion.selectAll}</th>
										{sortHeader("ID", "id")}
										{sortHeader("Title", "title")}
										{sortHeader("Status", "status")}
										{sortHeader("Priority", "priority")}
										<th scope="col" className="px-3 py-2">
											{t("Assignee")}
										</th>
										{sortHeader("Created", "created")}
										<th scope="col" className="px-3 py-2">
											{t("Actions")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
									{sortedTasks.map((task, index) => (
										<tr
											key={`${task.id}:${index}`}
											onClick={() => onOpenTask(task)}
											className="cursor-pointer transition-colors bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50"
										>
											<td className="p-0" onClick={(event) => event.stopPropagation()}>
												{deletion.checkbox(task)}
											</td>
											<td className="px-3 py-2.5 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
												{task.id}
											</td>
											<td className="px-3 py-2.5">
												<button
													onClick={(event) => {
														event.stopPropagation();
														onOpenTask(task);
													}}
													title={task.title}
													aria-label={t("Open {0}: {1}", { "0": task.id, "1": task.title })}
													className="block w-full truncate text-sm text-gray-900 dark:text-gray-100 rounded text-left focus:outline-none focus:ring-2 focus:ring-stone-500"
												>
													{task.title}
												</button>
											</td>
											<td className="px-3 py-2.5">
												<span
													className={`inline-flex rounded-circle px-2 py-0.5 text-[11px] font-medium ${getStatusColor(task.status)}`}
												>
													{t(task.status)}
												</span>
											</td>
											<td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300">
												{task.priority ? t(task.priority.charAt(0).toUpperCase() + task.priority.slice(1)) : "—"}
											</td>
											<td
												className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300 truncate"
												title={task.assignee.join(", ")}
											>
												{task.assignee.join(", ") || "—"}
											</td>
											<td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
												<StoredDate value={task.createdDate} dateFormat={dateFormat} compact />
											</td>
											<td className="px-3 py-2.5">
												<button
													disabled={pending !== null || deletion.busy}
													onClick={(event) => {
														event.stopPropagation();
														void restore(task);
													}}
													aria-label={t("Restore {0}", { "0": task.id })}
													className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
												>
													{t(pending === task.id ? "Restoring..." : "Restore")}
												</button>
												{deletion.button(task)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>
			)}
		</div>
	);
}
