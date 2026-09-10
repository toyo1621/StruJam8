import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getStrudelRuntimeStatus,
  resetStrudelEngineForTests,
  startStrudelAudio,
  starterAudioCode,
  stopStrudelAudio,
} from "./strudelEngine";

const { evaluateMock, hushMock, initStrudelMock } = vi.hoisted(() => ({
  evaluateMock: vi.fn(),
  hushMock: vi.fn(),
  initStrudelMock: vi.fn(),
}));

vi.mock("@strudel/web", () => ({
  evaluate: evaluateMock,
  hush: hushMock,
  initStrudel: initStrudelMock,
}));

describe("strudel engine", () => {
  beforeEach(() => {
    resetStrudelEngineForTests();
    evaluateMock.mockReset();
    hushMock.mockReset();
    initStrudelMock.mockReset();
    initStrudelMock.mockResolvedValue({});
    evaluateMock.mockResolvedValue({});
  });

  it("initializes Strudel once and evaluates the playable code", async () => {
    await startStrudelAudio(starterAudioCode);
    await startStrudelAudio('note("c3").s("sawtooth")');

    expect(initStrudelMock).toHaveBeenCalledTimes(1);
    expect(evaluateMock).toHaveBeenNthCalledWith(1, starterAudioCode, true);
    expect(evaluateMock).toHaveBeenNthCalledWith(2, 'note("c3").s("sawtooth")', true);
    expect(getStrudelRuntimeStatus()).toBe("ready");
  });

  it("skips stale evaluation requests and keeps the latest code", async () => {
    const first = startStrudelAudio('note("first")');
    const second = startStrudelAudio('note("second")');

    await expect(first).resolves.toBe(false);
    await expect(second).resolves.toBe(true);
    expect(evaluateMock).toHaveBeenCalledTimes(1);
    expect(evaluateMock).toHaveBeenCalledWith('note("second")', true);
  });

  it("hushes an evaluation that becomes stale while running", async () => {
    let resolveEvaluate: () => void = () => {};
    evaluateMock.mockImplementationOnce(() => new Promise<void>((resolve) => {
      resolveEvaluate = resolve;
    }));

    const pending = startStrudelAudio("note(\"stale\")");
    await vi.waitFor(() => expect(evaluateMock).toHaveBeenCalledTimes(1));

    stopStrudelAudio();
    resolveEvaluate();

    await expect(pending).resolves.toBe(false);
    expect(hushMock).toHaveBeenCalledTimes(2);
  });

  it("does not call hush before the runtime has been initialized", () => {
    stopStrudelAudio();

    expect(hushMock).not.toHaveBeenCalled();
  });

  it("stops playback through hush after initialization", async () => {
    await startStrudelAudio();
    stopStrudelAudio();

    expect(hushMock).toHaveBeenCalledTimes(1);
  });
});
