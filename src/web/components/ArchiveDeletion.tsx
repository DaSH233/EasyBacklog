import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { useTranslation } from "../contexts/LanguageContext";
type Row = { id: string; title: string };
export function useArchiveDeletion(
	category: string,
	rows: Row[],
	visible: Row[],
	blocked: boolean,
	onDeleted: (ids: string[]) => Promise<void>,
) {
	const { t } = useTranslation();
	const [operation, setOperation] = useState<"delete" | "restore">("delete");
	const [selected, setSelected] = useState<string[]>([]);
	const [confirmation, setConfirmation] = useState<Row[] | null>(null);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("");
	const running = useRef(false);
	useEffect(() => {
		setSelected((current) => {
			const next = current.filter((id) => rows.some((row) => row.id === id));
			return next.length === current.length ? current : next;
		});
	}, [rows]);
	const selectedRows = rows.filter((row) => selected.includes(row.id));
	const toggle = (id: string) =>
		setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
	const execute = async () => {
		if (!confirmation || running.current) return;
		running.current = true;
		setBusy(true);
		setMessage("");
		const deleted: string[] = [];
		const failures: string[] = [];
		for (const row of confirmation) {
			try {
				const path =
					operation === "delete"
						? `/api/archive/${category}/${encodeURIComponent(row.id)}`
						: category === "tasks"
							? `/api/tasks/${encodeURIComponent(row.id)}/restore`
							: `/api/archive/${category}/${encodeURIComponent(row.id)}/restore`;
				const response = await fetch(
					path,
					operation === "delete"
						? {
								method: "DELETE",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ confirmed: true }),
							}
						: { method: "POST" },
				);
				const result = await response.json();
				if (!response.ok)
					throw new Error(result.error || (operation === "delete" ? "Delete failed" : "Restore failed"));
				deleted.push(row.id);
				if (result.warning) failures.push(`${row.id}: ${result.warning}`);
			} catch (error) {
				failures.push(`${row.id}: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
		setSelected((current) => current.filter((id) => !deleted.includes(id)));
		setConfirmation(null);
		try {
			if (deleted.length) await onDeleted(deleted);
		} catch (error) {
			failures.push(String(error));
		}
		setMessage(
			[
				t(operation === "delete" ? "Deleted {0} records" : "Restored {0} records", { "0": deleted.length }),
				...failures,
			].join("\n"),
		);
		setBusy(false);
		running.current = false;
	};
	const checkbox = (row: Row) => (
		<label className="flex h-11 w-11 items-center justify-center rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 has-[:disabled]:cursor-not-allowed">
			<input
				type="checkbox"
				aria-label={t("Select {0}", { "0": row.id })}
				checked={selected.includes(row.id)}
				disabled={busy || blocked}
				onClick={(e) => e.stopPropagation()}
				onChange={() => toggle(row.id)}
				className="h-4 w-4 cursor-inherit"
			/>
		</label>
	);
	const allVisible = visible.length > 0 && visible.every((row) => selected.includes(row.id));
	const selectAll = (
		<label className="flex h-11 w-11 items-center justify-center rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 has-[:disabled]:cursor-not-allowed">
			<input
				type="checkbox"
				className="h-4 w-4 cursor-inherit"
				aria-label={t("Select all visible records")}
				checked={allVisible}
				ref={(node) => {
					if (node) node.indeterminate = !allVisible && visible.some((row) => selected.includes(row.id));
				}}
				disabled={busy || blocked || !visible.length}
				onChange={() =>
					setSelected((current) =>
						allVisible
							? current.filter((id) => !visible.some((row) => row.id === id))
							: [...new Set([...current, ...visible.map((row) => row.id)])],
					)
				}
			/>
		</label>
	);
	const button = (row: Row) => (
		<button
			type="button"
			aria-label={t("Delete {0}", { "0": row.id })}
			disabled={busy || blocked}
			onClick={(e) => {
				e.stopPropagation();
				setOperation("delete");
				setConfirmation([row]);
			}}
			className="ml-2 px-3 py-1.5 text-xs rounded-md border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
		>
			{t("Delete")}
		</button>
	);
	const toolbar = (
		<div className="flex flex-wrap items-center gap-3">
			<button
				disabled={busy || blocked || !selectedRows.length}
				onClick={() => {
					setOperation("delete");
					setConfirmation(selectedRows);
				}}
				className="px-3 py-2 text-sm border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 disabled:opacity-50"
			>
				{t("Delete selected ({0})", { "0": selectedRows.length })}
			</button>
			<button
				disabled={busy || blocked || !selectedRows.length}
				onClick={() => {
					setOperation("restore");
					setConfirmation(selectedRows);
				}}
				className="px-3 py-2 text-sm border border-blue-200 dark:border-blue-800 rounded-md text-blue-600 dark:text-blue-400 disabled:opacity-50"
			>
				{t("Restore selected ({0})", { "0": selectedRows.length })}
			</button>
		</div>
	);
	const dialog = (
		<Modal
			isOpen={confirmation !== null}
			onClose={() => {
				if (!busy) setConfirmation(null);
			}}
			disableEscapeClose={busy}
			title={t(operation === "delete" ? "Confirm permanent deletion" : "Confirm restoration")}
		>
			<p
				className={`text-sm mb-4 ${operation === "delete" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}`}
			>
				{t(
					operation === "delete"
						? "Permanently delete {0} selected records? They cannot be restored from the archive."
						: "Restore {0} selected records to their original list?",
					{
						"0": confirmation?.length ?? 0,
					},
				)}
			</p>
			<ul className="max-h-64 overflow-y-auto space-y-2 text-sm mb-6">
				{confirmation?.map((row) => (
					<li key={row.id}>
						{row.id} — {row.title}
					</li>
				))}
			</ul>
			<div className="flex justify-end gap-3">
				<button disabled={busy} onClick={() => setConfirmation(null)} className="border rounded-md px-4 py-2">
					{t("Cancel")}
				</button>
				<button
					disabled={busy}
					onClick={() => void execute()}
					className={`disabled:opacity-50 text-white rounded-md px-4 py-2 ${operation === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
				>
					{t(
						operation === "delete"
							? busy
								? "Deleting..."
								: "Permanently delete"
							: busy
								? "Restoring..."
								: "Confirm restore",
					)}
				</button>
			</div>
		</Modal>
	);
	const notice = message ? (
		<p role="status" className="mb-3 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
			{message}
		</p>
	) : null;
	return { busy, checkbox, selectAll, button, toolbar, dialog, notice };
}
