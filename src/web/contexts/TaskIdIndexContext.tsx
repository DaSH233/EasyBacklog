import React, { createContext, useContext, useMemo } from "react";
import { type Task } from "../../types";
import { buildTaskIdIndex, type TaskIdIndex } from "../utils/task-id-links";

import { buildRecordLinkIndex, buildRecordBacklinks } from "../utils/record-links";

const EMPTY_RECORDS: { id: string; title: string }[] = [];
const RecordLinksContext = createContext({ index: buildRecordLinkIndex([], []), backlinks: buildRecordBacklinks([]) });
export const useRecordLinks = () => useContext(RecordLinksContext);

const EMPTY_INDEX: TaskIdIndex = new Map();

const TaskIdIndexContext = createContext<TaskIdIndex>(EMPTY_INDEX);

/** Known task IDs, used to auto-link task references in rendered markdown. */
export const useTaskIdIndex = () => useContext(TaskIdIndexContext);

interface TaskIdIndexProviderProps {
	tasks: Task[];
	docs?: { id: string; title: string }[];
	decisions?: { id: string; title: string }[];
	children: React.ReactNode;
}

export const TaskIdIndexProvider: React.FC<TaskIdIndexProviderProps> = ({
	tasks,
	docs = EMPTY_RECORDS,
	decisions = EMPTY_RECORDS,
	children,
}) => {
	const index = useMemo(() => buildTaskIdIndex(tasks), [tasks]);

	const records = useMemo(
		() => ({ index: buildRecordLinkIndex(docs, decisions), backlinks: buildRecordBacklinks(tasks) }),
		[tasks, docs, decisions],
	);

	return (
		<RecordLinksContext.Provider value={records}>
			<TaskIdIndexContext.Provider value={index}>{children}</TaskIdIndexContext.Provider>
		</RecordLinksContext.Provider>
	);
};
