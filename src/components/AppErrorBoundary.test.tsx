// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

function BrokenView(): never {
  throw new Error("render failed");
}

describe("AppErrorBoundary", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    consoleError.mockRestore();
  });

  it("renders children while the app is healthy", () => {
    render(
      <AppErrorBoundary>
        <p>Ready</p>
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a reload action after a rendering error", () => {
    const onReload = vi.fn();

    render(
      <AppErrorBoundary onReload={onReload}>
        <BrokenView />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("画面を読み込めませんでした");
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
  });
});
