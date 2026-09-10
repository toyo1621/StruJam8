type StrudelWebModule = typeof import("@strudel/web");

export const starterAudioCode = 'note("c2 eb2 g2 bb2").s("sawtooth").slow(2).gain(0.35)';

let strudelModulePromise: Promise<StrudelWebModule> | null = null;
let strudelModule: StrudelWebModule | null = null;
let initPromise: Promise<unknown> | null = null;
let didInitialize = false;
let playbackGeneration = 0;
let latestEvaluationRequest = 0;
let evaluationQueue: Promise<void> = Promise.resolve();

export function getStrudelRuntimeStatus() {
  return didInitialize ? "ready" : "idle";
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
    initPromise = Promise.resolve(module.initStrudel()).then((runtime) => {
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

export async function startStrudelAudio(code: string = starterAudioCode) {
  const requestId = ++latestEvaluationRequest;
  const generation = playbackGeneration;
  const module = await ensureStrudelInitialized();
  let didEvaluate = false;

  const evaluation = evaluationQueue.then(async () => {
    if (generation !== playbackGeneration || requestId !== latestEvaluationRequest) {
      return;
    }

    await module.evaluate(code, true);

    if (generation !== playbackGeneration || requestId !== latestEvaluationRequest) {
      module.hush();
      return;
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
}
