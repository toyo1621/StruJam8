type StrudelWebModule = typeof import("@strudel/web");
type StrudelOutputArgs = [hap: unknown, deadline: number, duration: number, cps: number, time: number];
type StrudelWebModuleWithOutput = StrudelWebModule & {
  webaudioOutput: (...args: StrudelOutputArgs) => unknown;
};

export interface StrudelCodeLocation {
  start: number;
  end: number;
}

export type StrudelAudioTriggerHandler = (locations: StrudelCodeLocation[]) => void;
export type StrudelAudioErrorHandler = (error: Error) => void;

export const starterAudioCode = 'note("c2 eb2 g2 bb2").s("sawtooth").slow(2).gain(0.35)';

let strudelModulePromise: Promise<StrudelWebModule> | null = null;
let strudelModule: StrudelWebModule | null = null;
let initPromise: Promise<unknown> | null = null;
let didInitialize = false;
let playbackGeneration = 0;
let latestEvaluationRequest = 0;
let evaluationQueue: Promise<void> = Promise.resolve();
let audioTriggerHandler: StrudelAudioTriggerHandler | null = null;
let audioErrorHandler: StrudelAudioErrorHandler | null = null;
let didReportSchedulerError = false;
let latestEvaluationError: unknown = null;

export function getStrudelRuntimeStatus() {
  return didInitialize ? "ready" : "idle";
}

function getHapLocations(hap: unknown): StrudelCodeLocation[] {
  if (!hap || typeof hap !== "object") {
    return [];
  }

  const locations = (hap as { context?: { locations?: unknown } }).context?.locations;

  if (!Array.isArray(locations)) {
    return [];
  }

  return locations.flatMap((location) => {
    if (!location || typeof location !== "object") {
      return [];
    }

    const { start, end } = location as { start?: unknown; end?: unknown };

    if (
      typeof start !== "number" ||
      typeof end !== "number" ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start
    ) {
      return [];
    }

    return [{ start, end }];
  });
}

function toEvaluationError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string" && error.length > 0) {
    return new Error(error);
  }

  if (error && typeof error === "object" && "message" in error) {
    return new Error(String(error.message));
  }

  return new Error(fallbackMessage);
}

function notifyAudioTrigger(locations: StrudelCodeLocation[]) {
  if (!audioTriggerHandler || locations.length === 0) {
    return;
  }

  try {
    audioTriggerHandler(locations);
  } catch (error) {
    console.error("StruJam8 audio trigger handler failed", error);
  }
}

function notifyAudioError(error: unknown) {
  playbackGeneration += 1;
  latestEvaluationRequest += 1;

  if (!audioErrorHandler) {
    return;
  }

  try {
    audioErrorHandler(toEvaluationError(error, "Strudel audio runtime failed"));
  } catch (handlerError) {
    console.error("StruJam8 audio error handler failed", handlerError);
  }
}

async function loadStrudelModule() {
  if (!strudelModulePromise) {
    strudelModulePromise = import("@strudel/web").then((module) => {
      strudelModule = module;
      return module;
    });
  }

  try {
    return await strudelModulePromise;
  } catch (error) {
    strudelModulePromise = null;
    strudelModule = null;
    throw error;
  }
}

async function ensureStrudelInitialized() {
  const module = await loadStrudelModule();

  if (!initPromise) {
    const moduleWithOutput = module as StrudelWebModuleWithOutput;
    const defaultOutput = async (...args: StrudelOutputArgs) => {
      notifyAudioTrigger(getHapLocations(args[0]));

      try {
        return await moduleWithOutput.webaudioOutput(...args);
      } catch (error) {
        notifyAudioError(error);
        throw error;
      }
    };

    initPromise = Promise.resolve(
      module.initStrudel({
        defaultOutput,
        onEvalError: (error: unknown) => {
          latestEvaluationError = error;
        },
        onUpdateState: (state: unknown) => {
          if (!state || typeof state !== "object") {
            return;
          }

          const schedulerError = (state as { schedulerError?: unknown }).schedulerError;

          if (!schedulerError) {
            didReportSchedulerError = false;
            return;
          }

          if (didReportSchedulerError) {
            return;
          }

          didReportSchedulerError = true;
          notifyAudioError(schedulerError);
        },
      }),
    ).then((runtime) => {
      didInitialize = true;
      return runtime;
    });
  }

  try {
    await initPromise;
    return module;
  } catch (error) {
    initPromise = null;
    didInitialize = false;
    throw error;
  }
}

export async function startStrudelAudio(
  code: string = starterAudioCode,
  onTrigger?: StrudelAudioTriggerHandler,
  onError?: StrudelAudioErrorHandler,
) {
  if (onTrigger) {
    audioTriggerHandler = onTrigger;
  }

  if (onError) {
    audioErrorHandler = onError;
  }

  const requestId = ++latestEvaluationRequest;
  const generation = playbackGeneration;
  const module = await ensureStrudelInitialized();
  let didEvaluate = false;

  const evaluation = evaluationQueue.then(async () => {
    if (generation !== playbackGeneration || requestId !== latestEvaluationRequest) {
      return;
    }

    latestEvaluationError = null;
    const evaluatedPattern = await module.evaluate(code, true);
    const evaluationError = latestEvaluationError;
    latestEvaluationError = null;

    if (generation !== playbackGeneration || requestId !== latestEvaluationRequest) {
      module.hush();
      return;
    }

    if (evaluationError) {
      module.hush();
      throw toEvaluationError(evaluationError, "Strudel could not evaluate the current code");
    }

    if (evaluatedPattern === undefined || evaluatedPattern === null) {
      module.hush();
      throw new Error("Strudel did not return a playable pattern");
    }

    didEvaluate = true;
  });

  evaluationQueue = evaluation.catch(() => {});
  await evaluation;
  return didEvaluate;
}

export function stopStrudelAudio() {
  playbackGeneration += 1;
  latestEvaluationRequest += 1;
  audioTriggerHandler = null;
  audioErrorHandler = null;
  didReportSchedulerError = false;
  latestEvaluationError = null;

  if (!didInitialize || !strudelModule) {
    return;
  }

  strudelModule.hush();
}

export function resetStrudelEngineForTests() {
  strudelModulePromise = null;
  strudelModule = null;
  initPromise = null;
  didInitialize = false;
  playbackGeneration = 0;
  latestEvaluationRequest = 0;
  evaluationQueue = Promise.resolve();
  audioTriggerHandler = null;
  audioErrorHandler = null;
  didReportSchedulerError = false;
  latestEvaluationError = null;
}
