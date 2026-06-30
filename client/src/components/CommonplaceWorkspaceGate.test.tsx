import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const invalidate = vi.fn();
const updateFeatureFlagMutate = vi.fn();
const flagState = {
  commonplaceEnabled: true,
  isLoading: false,
};

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
}));

vi.mock("lucide-react", () => ({
  Sparkles: () => <span>Sparkles</span>,
  ToggleLeft: () => <span>ToggleLeft</span>,
}));

vi.mock("@/lib/featureFlags", () => ({
  useCommonplaceFeatureFlag: () => flagState,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      featureFlags: {
        list: {
          invalidate,
        },
      },
    }),
    featureFlags: {
      update: {
        useMutation: () => ({
          isPending: false,
          mutate: updateFeatureFlagMutate,
        }),
      },
    },
  },
}));

import CommonplaceWorkspaceGate from "./CommonplaceWorkspaceGate";

describe("CommonplaceWorkspaceGate", () => {
  beforeEach(() => {
    invalidate.mockClear();
    updateFeatureFlagMutate.mockClear();
    flagState.commonplaceEnabled = true;
    flagState.isLoading = false;
  });

  it("renders the child workspace when the Commonplace flag is enabled", () => {
    render(
      <CommonplaceWorkspaceGate>
        <div>Workspace body</div>
      </CommonplaceWorkspaceGate>
    );

    expect(screen.getByText("Workspace body")).toBeTruthy();
    expect(screen.queryByText(/Commonplace is currently turned off/i)).toBeNull();
  });

  it("renders the fallback and enables the flag when the Commonplace workspace is disabled", () => {
    flagState.commonplaceEnabled = false;

    render(
      <CommonplaceWorkspaceGate>
        <div>Workspace body</div>
      </CommonplaceWorkspaceGate>
    );

    expect(screen.getByText(/Commonplace is currently turned off/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Enable Commonplace workspace/i }));

    expect(updateFeatureFlagMutate).toHaveBeenCalledWith({
      flagKey: "commonplace_workspace",
      enabled: true,
    });
  });
});
