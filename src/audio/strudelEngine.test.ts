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
