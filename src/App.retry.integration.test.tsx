// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const { startStrudelAudioMock, stopStrudelAudioMock } = vi.hoisted(() => ({
  startStrudelAudioMock: vi.fn(),
  stopStrudelAudioMock: vi.fn(),
}));

vi.mock("./audio/strudelEngine", () => ({
  startStrudelAudio: startStrudelAudioMock,
  stopStrudelAudio: stopStrudelAudioMock,
}));

function createTestStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

describe("App audio recovery", () => {
  let latestErrorHandler: ((error: Error) => void) | undefined;

  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createTestStorage(),
    });
    latestErrorHandler = undefined;
    startStrudelAudioMock.mockReset();
    stopStrudelAudioMock.mockReset();
    startStrudelAudioMock.mockImplementation(
      async (_code: string, _onTrigger: unknown, onError: (error: Error) => void) => {
        latestErrorHandler = onError;
        return true;
      },
    );
  });

  afterEach(() => cleanup());

  it.each(["toy-house", "neon-dub", "indietronica"])("keeps display, Copy and playback identical for %s", async (presetId) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const { container } = render(<App />);
    fireEvent.change(screen.getByLabelText("Preset"), { target: { value: presetId } });
    fireEvent.click(screen.getByRole("button", { name: "2ベース" }));
    fireEvent.click(screen.getByRole("button", { name: "2崩す" }));
    fireEvent.click(screen.getByRole("button", { name: "1抜く音を抜く" }));
    const displayedCode = Array.from(container.querySelectorAll(".code-line"), (line) => line.textContent).join("\n");
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(displayedCode));
    fireEvent.click(screen.getByRole("button", { name: "Start Strudel audio preview" }));
    await waitFor(() => expect(screen.getByText("Audio playing")).toBeInTheDocument());
    expect(startStrudelAudioMock).toHaveBeenCalledTimes(1);
    expect(startStrudelAudioMock.mock.calls[0][0]).toBe(displayedCode);
  });

  it("shows Retry after a start failure and recovers on the next click", async () => {
    startStrudelAudioMock.mockRejectedValueOnce(new Error("audio start failed"));
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start Strudel audio preview" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry Strudel audio preview" })).toBeInTheDocument();
    });
    expect(screen.getByText("Audio start failed. Retry available.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry Strudel audio preview" }));

    await waitFor(() => {
      expect(screen.getByText("Audio playing")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Start Strudel audio preview" })).toBeInTheDocument();
  });

  it("shows Retry after a runtime failure while playing", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Start Strudel audio preview" }));

    await waitFor(() => {
      expect(screen.getByText("Audio playing")).toBeInTheDocument();
    });
    latestErrorHandler?.(new Error("scheduler failed"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry Strudel audio preview" })).toBeInTheDocument();
    });
    expect(screen.getByText("Audio stopped after error. Retry available.")).toBeInTheDocument();
  });
});
