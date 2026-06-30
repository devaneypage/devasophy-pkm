export const workspaceFeatureFlagDefinitions = {
  commonplace_workspace: {
    label: "Commonplace workspace",
    description: "Enables the Kanban-based Commonplace drafting wall, route access, and navigation entry points.",
    defaultEnabled: true,
  },
} as const;

export type WorkspaceFeatureFlagKey = keyof typeof workspaceFeatureFlagDefinitions;

export const COMMONPLACE_WORKSPACE_FLAG: WorkspaceFeatureFlagKey = "commonplace_workspace";

export function getWorkspaceFeatureFlagDefinition(flagKey: WorkspaceFeatureFlagKey) {
  return workspaceFeatureFlagDefinitions[flagKey];
}

export function isKnownWorkspaceFeatureFlag(flagKey: string): flagKey is WorkspaceFeatureFlagKey {
  return flagKey in workspaceFeatureFlagDefinitions;
}
