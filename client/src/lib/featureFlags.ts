import { COMMONPLACE_WORKSPACE_FLAG } from "@shared/featureFlags";
import { trpc } from "@/lib/trpc";

export type WorkspaceFeatureFlagState = {
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
};

export function getFeatureFlagValue(flags: WorkspaceFeatureFlagState[] | undefined, flagKey: string, fallback = false) {
  return flags?.find((flag) => flag.key === flagKey)?.enabled ?? fallback;
}

export function useWorkspaceFeatureFlags() {
  const flagsQuery = trpc.featureFlags.list.useQuery(undefined, {
    staleTime: 30_000,
  });

  return {
    ...flagsQuery,
    flags: (flagsQuery.data ?? []) as WorkspaceFeatureFlagState[],
  };
}

export function useCommonplaceFeatureFlag() {
  const flagsQuery = useWorkspaceFeatureFlags();

  return {
    ...flagsQuery,
    commonplaceEnabled: getFeatureFlagValue(flagsQuery.flags, COMMONPLACE_WORKSPACE_FLAG, true),
  };
}
