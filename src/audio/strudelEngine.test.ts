import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getStrudelRuntimeStatus,
  resetStrudelEngineForTests,
  startStrudelAudio,
  starterAudioCode,
  stopStrudelAudio,
} from "./strudelEngine";

const { evaluateMock, hushMock, initStrudelMock, webaudioOutputMock } = vi.hoisted(() => ({
  evaluateMock: vi.fn(),
  hushMock: vi.fn(),
  initStrudelMock: vi.fn(),
  webaudioOutputMock: vi.fn(),
}));

vi.mock("@strudel/web", () => ({
  evaluate: evaluateMock,
  hush: hushMock,
  initStrudel: initStrudelMock,
  webaudioOutput: webaudioOutputMock,
}));

type DefaultOutput = (
  hap: unknown,
  deadline: number,
  duration: number,
  cps: number,
  time: number,
) => unknown;

describe("strudel engine", () => {
  beforeEach(() => {
    resetStrudelEngineForTests();
    evaluateMock.mockReset();
    hushMock.mockReset();
    initStrudelMock.mockReset();
    webaudioOutputMock.mockReset();
    initStrudelMock.mockResolvedValue({});
    evaluateMock.mockResolvedValue({});
    webaudioOutputMock.mockResolvedValue(undefined);
  });

  it("initializes Strudel once and evaluates the playable code", async () => {
    await startStrudelAudio(starterAudioCode);
    await startStrudelAudio('note("c3").s("sawtooth")');

    expect(initStrudelMock).toHaveBeenCalledTimes(1);
    expect(evaluateMock).toHaveBeenNthCalledWith(1, starterAudioCode, true);
    expect(evaluateMock).toHaveBeenNthCalledWith(2, 'note("c3").s("sawtooth")', true);
    expect(getStrudelRuntimeStatus()).toBe("ready");
  });

  it("forwards Strudel event locations from the audio output to the UI", async () => {
    const onTrigger = vi.fn();
    const hap = {
      context: {
        locations: [{ start: 8, end: 10 }, { start: 14, end: 18 }],
      },
    };

    await startStrudelAudio('note("c2 eb2")', onTrigger);

    const options = initStrudelMock.mock.calls[0]?.[0] as { defaultOutput?: DefaultOutput };
    await options.defaultOutput?.(hap, 0, 0.25, 1, 0);
    await options.defaultOutput?.({}, 0, 0.25, 1, 0);

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(onTrigger).toHaveBeenCalledWith(hap.context.locations);
    expect(webaudioOutputMock).toHaveBeenNthCalledWith(1, hap, 0, 0.25, 1, 0);
    expect(webaudioOutputMock).toHaveBeenNthCalledWith(2, {}, 0, 0.25, 1, 0);
  });

  it("reports output failures through the runtime error handler", async () => {
    const onError = vi.fn();
    const outputError = new Error("audio output failed");

    await startStrudelAudio('note("c2")', undefined, onError);

    const options = initStrudelMock.mock.calls[0]?.[0] as { defaultOutput?: DefaultOutput };
    webaudioOutputMock.mockRejectedValueOnce(outputError);

    await expect(options.defaultOutput?.({}, 0, 0.25, 1, 0)).rejects.toThrow("audio output failed");
    expect(onError).toHaveBeenCalledWith(outputError);
  });

  it("invalidates a pending evaluation after an output error", async () => {
    const onError = vi.fn();
    let resolveEvaluate: (value: unknown) => void = () => {};
    let defaultOutput: DefaultOutput | undefined;
    initStrudelMock.mockImplementation((options: { defaultOutput?: DefaultOutput }) => {
      defaultOutput = options.defaultOutput;
      return Promise.resolve({});
    });
    evaluateMock.mockImplementationOnce(() => new Promise((resolve) => {
      resolveEvaluate = resolve;
    }));

    const pending = startStrudelAudio('note("c2")', undefined, onError);
    await vi.waitFor(() => expect(evaluateMock).toHaveBeenCalledTimes(1));
    const outputError = new Error("output failed before start completed");
    webaudioOutputMock.mockRejectedValueOnce(outputError);

    await expect(defaultOutput?.({}, 0, 0.25, 1, 0)).rejects.toThrow("output failed before start completed");
    resolveEvaluate({});

    await expect(pending).resolves.toBe(false);
    expect(onError).toHaveBeenCalledWith(outputError);
  });

  it("reports a scheduler error once until the runtime clears it", async () => {
    const onError = vi.fn();
    let onUpdateState: ((state: unknown) => void) | undefined;
    initStrudelMock.mockImplementation((options: { onUpdateState?: (state: unknown) => void }) => {
      onUpdateState = options.onUpdateState;
      return Promise.resolve({});
    });
    const schedulerError = new Error("scheduler failed");

    await startStrudelAudio('note("c2")', undefined, onError);
    onUpdateState?.({ schedulerError });
    onUpdateState?.({ schedulerError });
    onUpdateState?.({ schedulerError: undefined });
    onUpdateState?.({ schedulerError });

    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenNthCalledWith(1, schedulerError);
    expect(onError).toHaveBeenNthCalledWith(2, schedulerError);
  });

  it("surfaces Strudel evaluation errors instead of reporting playback success", async () => {
    let onEvalError: ((error: unknown) => void) | undefined;
    initStrudelMock.mockImplementation((options: { onEvalError?: (error: unknown) => void }) => {
      onEvalError = options.onEvalError;
      return Promise.resolve({});
    });
    evaluateMock.mockImplementationOnce(async () => {
      onEvalError?.(new Error("invalid pattern"));
      return {};
    });

    await expect(startStrudelAudio('note("broken")')).rejects.toThrow("invalid pattern");
    expect(hushMock).toHaveBeenCalledTimes(1);
  });

  it("rejects when Strudel does not return a playable pattern", async () => {
    evaluateMock.mockResolvedValueOnce(undefined);

    await expect(startStrudelAudio('note("empty")')).rejects.toThrow("playable pattern");
    expect(hushMock).toHaveBeenCalledTimes(1);
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
