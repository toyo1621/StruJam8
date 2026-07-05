type StrudelWebModule = typeof import("@strudel/web");

export const starterAudioCode = 'note("c2 eb2 g2 bb2").s("sawtooth").slow(2).gain(0.35)';

let strudelModulePromise: Promise<StrudelWebModule> | null = null;
let strudelModule: StrudelWebModule | null = null;
let initPromise: Promise<unknown> | null = null;
let didInitialize = false;

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
  const module = await ensureStrudelInitialized();
  await module.evaluate(code, true);
}

export function stopStrudelAudio() {
  if (!initPromise || !strudelModule) {
    return;
  }

  strudelModule.hush();
}

export function resetStrudelEngineForTests() {
  strudelModulePromise = null;
  strudelModule = null;
  initPromise = null;
  didInitialize = false;
}
