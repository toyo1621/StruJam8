import { useCallback, useEffect, useRef, useState } from "react";
import { mergeCodeLocations } from "../lib/codeLocations";
import { startStrudelAudio, stopStrudelAudio, type StrudelCodeLocation } from "./strudelEngine";

type PlaybackPhase = "stopped" | "starting" | "playing" | "updating" | "error";

export function useAudioPlayback(code: string, announce: (message: string) => void) {
  const [phase, setPhase] = useState<PlaybackPhase>("stopped");
  const [statusMessage, setStatusMessage] = useState("");
  const [activeCodeLocations, setActiveCodeLocations] = useState<StrudelCodeLocation[] | null>(null);
  const [evaluatedCodeLocations, setEvaluatedCodeLocations] = useState<StrudelCodeLocation[]>([]);
  const generation = useRef(0);
  const wantsPlayback = useRef(false);
  const requestedCode = useRef<string | null>(null);
  const pendingLocations = useRef<StrudelCodeLocation[]>([]);
  const flushTimer = useRef<number | null>(null);

  const clearPendingLocations = useCallback(() => {
    if (flushTimer.current !== null) window.clearTimeout(flushTimer.current);
    flushTimer.current = null;
    pendingLocations.current = [];
  }, []);

  const clearLocations = useCallback(() => {
    clearPendingLocations();
    setActiveCodeLocations(null);
    setEvaluatedCodeLocations([]);
  }, [clearPendingLocations]);

  const stop = useCallback((message = "Audio stopped", announcement = "Audio playback stopped") => {
    generation.current += 1;
    wantsPlayback.current = false;
    requestedCode.current = null;
    stopStrudelAudio();
    clearLocations();
    setPhase("stopped");
    setStatusMessage(message);
    announce(announcement);
  }, [announce, clearLocations]);

  const evaluate = useCallback(async (nextCode: string, updating: boolean) => {
    const request = ++generation.current;
    wantsPlayback.current = true;
    requestedCode.current = nextCode;
    const isCurrent = () => wantsPlayback.current && generation.current === request;
    clearLocations();
    setPhase(updating ? "updating" : "starting");
    setStatusMessage(updating ? "Updating audio..." : "Starting audio...");

    const fail = (message: string) => {
      if (!isCurrent()) return;
      generation.current += 1;
      wantsPlayback.current = false;
      requestedCode.current = null;
      stopStrudelAudio();
      clearLocations();
      setPhase("error");
      setStatusMessage(message);
    };

    try {
      const didEvaluate = await startStrudelAudio(
        nextCode,
        (locations) => {
          if (!isCurrent()) return;
          pendingLocations.current = mergeCodeLocations(pendingLocations.current, locations);
          if (flushTimer.current !== null) return;
          flushTimer.current = window.setTimeout(() => {
            flushTimer.current = null;
            if (!isCurrent()) return;
            const nextLocations = pendingLocations.current;
            pendingLocations.current = [];
            setActiveCodeLocations(nextLocations.length > 0 ? nextLocations : null);
          }, 0);
        },
        () => fail("Audio stopped after error. Retry available."),
        (locations) => {
          if (isCurrent()) setEvaluatedCodeLocations(mergeCodeLocations(locations));
        },
      );

      // Stop, unmount and newer requests invalidate both sound and late UI callbacks.
      if (!isCurrent()) return;
      if (!didEvaluate) {
        stop();
        return;
      }
      setPhase("playing");
      setStatusMessage("Audio playing");
      announce(updating ? "Audio playback updated" : "Audio playback started");
    } catch {
      fail(updating ? "Audio update failed. Retry available." : "Audio start failed. Retry available.");
    }
  }, [announce, clearLocations, stop]);

  const play = useCallback(() => evaluate(code, false), [code, evaluate]);

  useEffect(() => {
    if (wantsPlayback.current && requestedCode.current !== code) {
      void evaluate(code, true);
    }
  }, [code, evaluate]);

  useEffect(() => () => {
    generation.current += 1;
    wantsPlayback.current = false;
    clearPendingLocations();
    stopStrudelAudio();
  }, [clearPendingLocations]);

  return {
    play,
    stop,
    isPlaying: phase === "playing" || phase === "updating",
    isBusy: phase === "starting" || phase === "updating",
    recoveryAvailable: phase === "error",
    statusMessage,
    activeCodeLocations,
    evaluatedCodeLocations,
  };
}
