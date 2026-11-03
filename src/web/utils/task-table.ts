import type { Milestone, Task } from "../../types";
import { getPriorityRank } from "../../utils/priority-config";
import { compareTaskIds, compareTaskIdsDescending, sortTasks } from "../../utils/task-sorting";
import { parseStoredUtcDate } from "../../utils/utc-timestamp";
import { getMilestoneLabel } from "./milestones";
export type TaskSortColumn = "id" | "title" | "status" | "priority" | "ordinal" | "milestone" | "created";
export type SortDirection = "asc" | "desc";

// The table sorts that `backlog task list --sort` also has, with the `--sort` value each one is.
// Their order comes from sortTasks, so the table and the CLI agree. Every other column and
// direction is a sort only this table has.
const SHARED_SORTS: Partial<Record<`${TaskSortColumn}:${SortDirection}`, string>> = {
	"id:asc": "id",
	"priority:desc": "priority",
	"ordinal:asc": "ordinal",
};

export const getStatusColor = (status: string) => {
	switch (status.toLowerCase()) {
		case "to do":
			return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
		case "in progress":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
		case "done":
			return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
	}
};

export function sortTaskTable(
	displayTasks: Task[],
	sortColumn: TaskSortColumn,
	sortDirection: SortDirection,
	availablePriorities?: readonly string[],
	milestoneEntities: Milestone[] = [],
): Task[] {
	const sharedSort = SHARED_SORTS[`${sortColumn}:${sortDirection}`];
	if (sharedSort) {
		return sortTasks(displayTasks, sharedSort, availablePriorities);
	}

	const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
	const compareText = (a: string, b: string) => collator.compare(a, b);
	const withDirection = (value: number) => (sortDirection === "asc" ? value : -value);

	return [...displayTasks].sort((a, b) => {
		let result = 0;
		switch (sortColumn) {
			case "id": {
				result = compareTaskIdsDescending(a.id, b.id);
				break;
			}
			case "title": {
				result = withDirection(compareText(a.title, b.title));
				break;
			}
			case "status": {
				result = withDirection(compareText(a.status, b.status));
				break;
			}
			case "priority": {
				const rankA = getPriorityRank(a.priority, availablePriorities);
				const rankB = getPriorityRank(b.priority, availablePriorities);
				result = withDirection(rankA - rankB);
				break;
			}
			case "ordinal": {
				const aOrd = a.ordinal;
				const bOrd = b.ordinal;
				if (typeof aOrd === "number" && typeof bOrd === "number") {
					result = withDirection(aOrd - bOrd);
				} else if (typeof aOrd === "number") {
					result = -1;
				} else if (typeof bOrd === "number") {
					result = 1;
				}
				break;
			}
			case "milestone": {
				const milestoneA = getMilestoneLabel(a.milestone, milestoneEntities);
				const milestoneB = getMilestoneLabel(b.milestone, milestoneEntities);
				result = withDirection(compareText(milestoneA, milestoneB));
				break;
			}
			case "created": {
				const createdA = parseStoredUtcDate(a.createdDate)?.getTime();
				const createdB = parseStoredUtcDate(b.createdDate)?.getTime();
				if (createdA === undefined && createdB === undefined) {
					result = 0;
				} else if (createdA === undefined) {
					result = 1;
				} else if (createdB === undefined) {
					result = -1;
				} else {
					result = withDirection(createdA - createdB);
				}
				break;
			}
		}

		if (result !== 0) return result;
		if (sortColumn === "ordinal") return compareTaskIds(a.id, b.id);
		return compareTaskIdsDescending(a.id, b.id);
	});
}
