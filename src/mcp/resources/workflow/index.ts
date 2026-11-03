import { withTaskManagementPolicy } from "../../../utils/task-management-policy.ts";
import type { McpServer } from "../../server.ts";
import type { McpResourceHandler } from "../../types.ts";
import { WORKFLOW_GUIDES } from "../../workflow-guides.ts";

export function registerWorkflowResources(server: McpServer): void {
	for (const guide of WORKFLOW_GUIDES) {
		const resource: McpResourceHandler = {
			uri: guide.uri,
			name: guide.name,
			description: guide.description,
			mimeType: guide.mimeType,
			handler: async () => ({
				contents: [
					{
						uri: guide.uri,
						mimeType: guide.mimeType,
						text: withTaskManagementPolicy(guide.resourceText, await server.filesystem.loadConfig()),
					},
				],
			}),
		};

		server.addResource(resource);
	}
}
