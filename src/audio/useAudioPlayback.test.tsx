// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioPlayback } from "./useAudioPlayback";
import { startStrudelAudio, stopStrudelAudio } from "./strudelEngine";

vi.mock("./strudelEngine", () => ({ startStrudelAudio: vi.fn(), stopStrudelAudio: vi.fn() }));
const start = vi.mocked(startStrudelAudio);
const announce = vi.fn();
const code = 'note("c2").s("sine")';

function deferred() {
  let resolve!: (value: boolean) => void;
  const promise = new Promise<boolean>((done) => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => { vi.clearAllMocks(); start.mockReset(); start.mockResolvedValue(true); });
afterEach(cleanup);

describe("audio playback lifecycle", () => {
  it("evaluates the exact displayed code without a hidden fallback", async () => {
    start.mockRejectedValueOnce(new Error("invalid code"));
    const { result } = renderHook(() => useAudioPlayback(code, announce));
    await act(() => result.current.play());
    expect(start).toHaveBeenCalledTimes(1);
    expect(start.mock.calls[0][0]).toBe(code);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.recoveryAvailable).toBe(true);
    expect(result.current.statusMessage).toBe("Audio start failed. Retry available.");
    await act(() => result.current.play());
    expect(result.current.statusMessage).toBe("Audio playing");
  });

  it("stays stopped when an initial request completes after Stop", async () => {
    const pending = deferred(); start.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useAudioPlayback(code, announce));
    let request!: Promise<void>;
    act(() => { request = result.current.play(); });
    act(() => result.current.stop());
    await act(async () => { pending.resolve(true); await request; });
    expect(result.current.statusMessage).toBe("Audio stopped");
    expect(result.current.isPlaying).toBe(false);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("handles a live update failure and retries the latest code", async () => {
    const { result, rerender } = renderHook(({ text }) => useAudioPlayback(text, announce), { initialProps: { text: code } });
    await act(() => result.current.play());
    start.mockRejectedValueOnce(new Error("update failed"));
    rerender({ text: code + ".rev()" });
    await waitFor(() => expect(result.current.recoveryAvailable).toBe(true));
    expect(result.current.statusMessage).toBe("Audio update failed. Retry available.");
    expect(result.current.isPlaying).toBe(false);
    expect(stopStrudelAudio).toHaveBeenCalled();
    await act(() => result.current.play());
    expect(start.mock.lastCall?.[0]).toBe(code + ".rev()");
  });

  it("ignores stale completion and callbacks after a newer code request", async () => {
    const pending = deferred(); start.mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(({ text }) => useAudioPlayback(text, announce), { initialProps: { text: code } });
    let request!: Promise<void>;
    act(() => { request = result.current.play(); });
    const oldHandlers = start.mock.calls[0];
    rerender({ text: code + ".slow(2)" });
    await waitFor(() => expect(result.current.statusMessage).toBe("Audio playing"));
    await act(async () => { oldHandlers[2]?.(new Error("old error")); pending.resolve(false); await request; });
    expect(result.current.statusMessage).toBe("Audio playing");
    expect(start.mock.lastCall?.[0]).toBe(code + ".slow(2)");
  });

  it("does not restart when Stop happens during a live update", async () => {
    const { result, rerender } = renderHook(({ text }) => useAudioPlayback(text, announce), { initialProps: { text: code } });
    await act(() => result.current.play());
    const pending = deferred(); start.mockReturnValueOnce(pending.promise);
    rerender({ text: code + ".rev()" });
    act(() => result.current.stop());
    await act(async () => { pending.resolve(false); });
    expect(result.current.statusMessage).toBe("Audio stopped");
    expect(start).toHaveBeenCalledTimes(2);
  });

  it("invalidates pending work on unmount", async () => {
    const pending = deferred(); start.mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(() => useAudioPlayback(code, announce));
    let request!: Promise<void>;
    act(() => { request = result.current.play(); });
    unmount();
    await act(async () => { pending.resolve(true); await request; });
    expect(stopStrudelAudio).toHaveBeenCalled();
    expect(announce).not.toHaveBeenCalledWith("Audio playback started");
  });
});
