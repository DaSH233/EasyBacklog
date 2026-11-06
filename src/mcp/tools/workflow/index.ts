import { withTaskManagementPolicy } from "../../../utils/task-management-policy.ts";
import type { McpServer } from "../../server.ts";
import type { McpToolHandler } from "../../types.ts";
import { createSimpleValidatedTool } from "../../validation/tool-wrapper.ts";
import type { JsonSchema } from "../../validation/validators.ts";
import {
	getWorkflowGuideByKey,
	WORKFLOW_GUIDE_KEYS,
	type WorkflowGuideDefinition,
	type WorkflowGuideKey,
} from "../../workflow-guides.ts";

const workflowInstructionsSchema: JsonSchema = {
	type: "object",
	properties: {
		instruction: {
			type: "string",
			enum: [...WORKFLOW_GUIDE_KEYS],
		},
	},
	required: [],
	additionalProperties: false,
};

function getToolPayload(key: WorkflowGuideKey): WorkflowGuideDefinition {
	const guide = getWorkflowGuideByKey(key);
	if (guide) {
		return guide;
	}

	const overviewGuide = getWorkflowGuideByKey("overview");
	if (!overviewGuide) {
		throw new Error("Workflow guide definitions are missing the overview entry.");
	}

	return overviewGuide;
}

function createWorkflowTool(server: McpServer): McpToolHandler {
	type WorkflowInstructionsInput = {
		instruction?: WorkflowGuideKey;
	};

	return createSimpleValidatedTool(
		{
			name: "get_backlog_instructions",
			description:
				"Retrieve EasyBacklog workflow guidance in markdown format. Defaults to the overview when no instruction is selected.",
			inputSchema: workflowInstructionsSchema,
			annotations: { title: "Backlog Instructions", readOnlyHint: true, destructiveHint: false },
		},
		workflowInstructionsSchema,
		async (input: WorkflowInstructionsInput) => {
			const guide = getToolPayload(input.instruction ?? "overview");
			const toolText = withTaskManagementPolicy(
				guide.toolText ?? guide.resourceText,
				await server.filesystem.loadConfig(),
			);

			return {
				content: [
					{
						type: "text",
						text: toolText,
					},
				],
				structuredContent: {
					type: "resource",
					uri: guide.uri,
					title: guide.name,
					description: guide.description,
					mimeType: guide.mimeType,
					text: toolText,
				},
			};
		},
	);
}

export function registerWorkflowTools(server: McpServer): void {
	server.addTool(createWorkflowTool(server));
}
