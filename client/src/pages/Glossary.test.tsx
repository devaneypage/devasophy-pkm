import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const composeWithScribe = vi.fn().mockResolvedValue({ composition: "Verified composition." });

vi.mock("@/lib/trpc", () => ({
  trpc: {
    lexicon: {
      list: {
        useQuery: () => ({
          data: [
            {
              id: 1,
              term: "Aletheia",
              definition: null,
              partOfSpeech: "noun",
            },
          ],
        }),
      },
    },
    glossary: {
      composeWithScribe: {
        useMutation: () => ({ mutateAsync: composeWithScribe }),
      },
    },
  },
}));

import Glossary from "./Glossary";

describe("Glossary API integration", () => {
  it("normalizes lexicon term fields and nullable definitions without crashing", () => {
    render(<Glossary />);

    expect(screen.getByText("Aletheia")).toBeTruthy();
  });

  it("uses the render-initialized mutation hook when composing with Scribe", async () => {
    render(<Glossary />);

    fireEvent.click(screen.getByRole("button", { name: "Scribe" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Write a short verification sentence." },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Compose ✦$/ }));

    await waitFor(() => {
      expect(composeWithScribe).toHaveBeenCalledWith({
        prompt: "Write a short verification sentence.",
        glossaryContext: "Aletheia: ",
      });
    });
    expect(await screen.findByText("Verified composition.")).toBeTruthy();
  });
});
