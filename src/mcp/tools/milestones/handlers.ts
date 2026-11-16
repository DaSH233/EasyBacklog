import type { Core } from "../../../core/backlog.ts";
import {
	type MilestoneAddArgs,
	type MilestoneArchiveArgs,
	MilestoneOperations,
	type MilestoneRemoveArgs,
	type MilestoneRenameArgs,
} from "../../../core/milestone-operations.ts";
import { formatUtcDateForDisplay } from "../../../utils/utc-date-display.ts";
import { runCoreOperation } from "../../errors/mcp-errors.ts";
import type { CallToolResult } from "../../types.ts";

function formatListBlock(title: string, items: string[]): string {
	if (items.length === 0) {
		return `${title}\n  (none)`;
	}
	return `${title}\n${items.map((item) => `  - ${item}`).join("\n")}`;
}

export class MilestoneHandlers {
	private readonly operations: MilestoneOperations;

	constructor(core: Core) {
		this.operations = new MilestoneOperations(core);
	}

	private async respond(operation: () => Promise<string>): Promise<CallToolResult> {
		return { content: [{ type: "text", text: await runCoreOperation(operation) }] };
	}

	async listMilestones(): Promise<CallToolResult> {
		const { milestones: fileMilestones, unconfigured, archivedTaskValues } = await this.operations.listMilestones();
		const blocks: string[] = [];
		const milestoneLines = fileMilestones.map((m) =>
			m.dueDate ? `${m.id}: ${m.title} (due ${formatUtcDateForDisplay(m.dueDate)})` : `${m.id}: ${m.title}`,
		);
		blocks.push(formatListBlock(`Milestones (${fileMilestones.length}):`, milestoneLines));
		blocks.push(formatListBlock(`Milestones found on tasks without files (${unconfigured.length}):`, unconfigured));
		blocks.push(
			formatListBlock(`Archived milestone values still on tasks (${archivedTaskValues.length}):`, archivedTaskValues),
		);
		blocks.push(
			"Hint: use milestone_add to create milestone files, milestone_rename / milestone_remove to manage, milestone_archive to archive.",
		);

		return {
			content: [
				{
					type: "text",
					text: blocks.join("\n\n"),
				},
			],
		};
	}

	async addMilestone(args: MilestoneAddArgs): Promise<CallToolResult> {
		return this.respond(() => this.operations.addMilestone(args));
	}

	async renameMilestone(args: MilestoneRenameArgs): Promise<CallToolResult> {
		return this.respond(() => this.operations.renameMilestone(args));
	}

	async removeMilestone(args: MilestoneRemoveArgs): Promise<CallToolResult> {
		return this.respond(() => this.operations.removeMilestone(args));
	}

	async archiveMilestone(args: MilestoneArchiveArgs): Promise<CallToolResult> {
		return this.respond(() => this.operations.archiveMilestone(args));
	}
}
