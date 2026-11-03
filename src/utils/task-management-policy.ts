import type { BacklogConfig } from "../types/index.ts";

export function withTaskManagementPolicy(markdown: string, config?: BacklogConfig | null): string {
	const permission =
		config?.automaticTaskManagement === true
			? "Allowed: within the user-authorized work, agents may create and update task records automatically."
			: "Not allowed (default): do not automatically create, reopen, assign, or update tasks for ordinary development requests. Only perform task mutations explicitly requested by the user. Read-only inspection is allowed.";
	return `## Project task-management permission

${permission}
This permission takes precedence over automatic tracking instructions below. It does not authorize extra work, commits, publishing, archiving or deletion. Explicit task requests still require the existing acceptance criteria, DoD and verification. Re-read permission when the project or configuration changes.

${markdown}`;
}
