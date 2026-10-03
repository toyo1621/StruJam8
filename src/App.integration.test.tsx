// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { jamStorageKey } from "./lib/persistence";

function clickButton(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

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

describe("App interactions", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createTestStorage(),
    });
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
  });

  it("shows an unsaved warning when browser storage is unavailable", () => {
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("blocked"); } });
    render(<App />);
    expect(screen.getByText("未保存: Export JSONで保存してください。")).toBeInTheDocument();
    clickButton(/ベース/);
    clickButton(/崩す/);
    clickButton(/音を抜く/);
    expect(screen.getByLabelText("Audible Strudel code")).toHaveTextContent(".degradeBy(0.2)");
  });

  it.each(["invalid", "unreadable", "oversized"])("preserves the current jam on %s import", async (failure) => {
    render(<App />);
    clickButton(/ベース/);
    clickButton(/崩す/);
    clickButton(/音を抜く/);
    const file = {
      size: failure === "oversized" ? 256 * 1024 + 1 : 10,
      text: async () => {
        if (failure === "unreadable") throw new Error("read failure");
        return "invalid JSON";
      },
    };
    fireEvent.change(screen.getByLabelText("Import jam JSON"), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText(/Import failed: 有効なJam/)).toBeInTheDocument());
    expect(screen.getByLabelText("Audible Strudel code")).toHaveTextContent(".degradeBy(0.2)");
  });

  it("navigates through the three pad levels and adds a playable rule", () => {
    render(<App />);

    clickButton(/ベース/);
    expect(screen.getByRole("button", { name: "2崩す" })).toBeInTheDocument();

    clickButton(/崩す/);
    expect(screen.getByRole("button", { name: /音を抜く/ })).toBeInTheDocument();

    clickButton(/音を抜く/);

    expect(screen.getByText("ベース ＞ 崩す ＞ 音を抜く")).toBeInTheDocument();
    expect(screen.getByLabelText("Audible Strudel code")).toHaveTextContent(".degradeBy(0.2)");
    expect(screen.getByText("現在地").parentElement).toHaveTextContent("ベース ＞ 崩す");
  });

  it("backs out of a route and resets only added rules", () => {
    render(<App />);

    clickButton(/ベース/);
    clickButton(/崩す/);
    clickButton(/音を抜く/);

    clickButton("← 戻る");
    expect(screen.getByRole("button", { name: "2崩す" })).toBeInTheDocument();

    clickButton("← 戻る");
    expect(screen.getByRole("button", { name: "2ベース" })).toBeInTheDocument();

    clickButton("2ベース");
    clickButton("2崩す");
    clickButton("1抜く音を抜く");
    expect(screen.getByText("ベース ＞ 崩す ＞ 音を抜く")).toBeInTheDocument();

    clickButton(/^RESET:/);
    expect(screen.queryByText("ベース ＞ 崩す ＞ 音を抜く")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Audible Strudel code")).not.toHaveTextContent(".degradeBy(0.2)");
  });

  it("restores added rules from browser storage after remount", () => {
    const firstRender = render(<App />);

    clickButton(/コード/);
    clickButton(/盛り上げる/);
    clickButton(/高い音を足す/);
    expect(screen.getByText("コード ＞ 盛り上げる ＞ 高い音を足す")).toBeInTheDocument();

    firstRender.unmount();
    render(<App />);

    expect(screen.getByText("コード ＞ 盛り上げる ＞ 高い音を足す")).toBeInTheDocument();
    expect(screen.getByLabelText("Audible Strudel code")).toHaveTextContent('.sometimes(add(note("12")))');
  });

  it("offers a starter jam that updates code and can be undone as one change", () => {
    render(<App />);

    clickButton("おすすめセットを試す");

    const ruleTexts = screen.getAllByRole("listitem").map((rule) => rule.textContent ?? "");
    expect(ruleTexts).toEqual(expect.arrayContaining([
      expect.stringContaining("ベース＞崩す＞音を抜く"),
      expect.stringContaining("コード＞盛り上げる＞高い音を足す"),
    ]));
    expect(screen.getByLabelText("Audible Strudel code")).toHaveTextContent(".degradeBy(0.2)");
    expect(screen.getByLabelText("Audible Strudel code")).toHaveTextContent('.sometimes(add(note("12")))');

    clickButton("UNDO");

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByLabelText("Audible Strudel code")).not.toHaveTextContent(".degradeBy(0.2)");
  });

  it("supports number-key pad shortcuts", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "2" });
    expect(screen.getByRole("button", { name: "2崩す" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "2" });
    expect(screen.getByRole("button", { name: /音を抜く/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /音を抜く/ })).toHaveFocus();
  });

  it("moves keyboard focus into each newly rendered pad level", () => {
    render(<App />);
    const bassPad = screen.getByRole("button", { name: "2ベース" });
    bassPad.focus();
    fireEvent.keyDown(bassPad, { key: "Enter" });
    fireEvent.click(bassPad, { detail: 0 });

    expect(screen.getByRole("button", { name: "1盛り上げる" })).toHaveFocus();
    const breakPad = screen.getByRole("button", { name: "2崩す" });
    breakPad.focus();
    fireEvent.keyDown(breakPad, { key: "Enter" });
    fireEvent.click(breakPad, { detail: 0 });

    expect(screen.getByRole("button", { name: /音を抜く/ })).toHaveFocus();
  });

  it("directs large jams to JSON export instead of copying an unusable URL", () => {
    const rules = Array.from({ length: 40 }, (_, index) => ({
      id: `large-share-rule-${index}`,
      targetId: "bass" as const,
      intentId: "break" as const,
      techniqueId: "bass-break-drop-notes",
      target: "ベース",
      intent: "崩す",
      technique: `手法 ${index}`,
      shortLabel: "手法",
      strudelSnippet: ".degradeBy(0.2)",
      needsTodo: false,
      enabled: true,
    }));

    window.localStorage.setItem(
      jamStorageKey,
      JSON.stringify({ version: 1, selectedPresetId: "toy-house", rules }),
    );

    render(<App />);
    clickButton("Share URL");

    expect(screen.getByText("Share URL too long; use Export JSON")).toBeInTheDocument();
  });
});
