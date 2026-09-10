import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  startStrudelAudio,
  stopStrudelAudio,
  type StrudelAudioErrorHandler,
  type StrudelAudioTriggerHandler,
  type StrudelCodeLocation,
} from "./audio/strudelEngine";
import { RuleDetailPanel } from "./components/RuleDetailPanel";
import {
  formatRedoAnnouncement,
  formatRuleAddedAnnouncement,
  formatRuleDuplicatedAnnouncement,
  formatRuleMovedAnnouncement,
  formatRuleRemovedAnnouncement,
  formatRuleToggledAnnouncement,
  formatRulesResetAnnouncement,
  formatUndoAnnouncement,
  resetRulesControlCopy,
} from "./lib/announcements";
import { getTechniqueOptions, intents, targets } from "./data/pads";
import {
  formatRuleActionsGroupLabel,
  formatRuleDetailActionLabel,
  formatRuleDuplicateActionLabel,
  formatRuleMoveActionLabel,
  formatRuleRemoveActionLabel,
  formatRuleToggleActionLabel,
  formatTransportActionLabel,
  transportUiDescription,
} from "./lib/accessibilityLabels";
import { livePadTextColor } from "./data/padColors";
import { getPresetDefinition, presets } from "./data/presets";
import { projectLinks } from "./data/projectLinks";
import { getRouteDefinition } from "./data/routes";
import { starterJam } from "./data/starterJam";
import { getTechniqueById } from "./data/techniques";
import { formatPlayableCodeLines } from "./lib/codegen";
import { getActiveCodeLineIndexes, getActiveCodeRuleId, joinCodeLines } from "./lib/codeHighlight";
import {
  getActiveCodeLineIndexesFromLocations,
  getCodeLineOffsets,
  getCodeTokenOffsets,
  getCodeTokenSegments,
  mergeCodeLocations,
} from "./lib/codeLocations";
import { tokenizeCodeLine } from "./lib/codeTokens";
import {
  copyTextToClipboard,
  getBrowserClipboard,
  getCopyStatusLabel,
  type CopyTextResult,
} from "./lib/clipboard";
import { getPadShortcutIndexFromEvent } from "./lib/keyboard";
import {
  createJamShareUrl,
  getBrowserHref,
  isJamShareUrlWithinLimit,
  parseJamShareUrl,
} from "./lib/shareUrl";
import {
  getBrowserStorage,
  loadJamSnapshot,
  parseJamSnapshotText,
  saveJamSnapshot,
  serializeJamSnapshot,
} from "./lib/persistence";
import { appReducer, createInitialAppState, initialAppState } from "./state/appReducer";
import type {
  CurrentLevel,
  IntentId,
  PadOption,
  PresetId,
  RouteSelection,
  Rule,
  TargetId,
  TechniqueDefinition,
} from "./types";

function getPathLabel(
  level: CurrentLevel,
  target: RouteSelection<TargetId> | null,
  intent: RouteSelection<IntentId> | null,
) {
  if (level === "target" || !target) {
    return "HOME";
  }

  if (level === "intent" || !intent) {
    return target.label;
  }

  return `${target.label} ＞ ${intent.label}`;
}

type LivePadStyle = React.CSSProperties & {
  "--pad-color": string;
  "--pad-text-color": string;
};

function createRuleId(targetId: TargetId, intentId: IntentId, techniqueId: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${targetId}-${intentId}-${techniqueId}-${Date.now()}`;
}

function createRuleFromTechnique(technique: TechniqueDefinition): Rule {
  return {
    id: createRuleId(technique.targetId, technique.intentId, technique.id),
    targetId: technique.targetId,
    intentId: technique.intentId,
    techniqueId: technique.id,
    target: technique.target,
    intent: technique.intent,
    technique: technique.label,
    shortLabel: technique.shortLabel,
    strudelSnippet: technique.strudelSnippet,
    playbackTransform: technique.playbackTransform,
    needsTodo: technique.needsTodo ?? false,
    enabled: true,
  };
}

function loadInitialAppState() {
  const browserHref = getBrowserHref();
  const urlSnapshot = browserHref ? parseJamShareUrl(browserHref) : null;

  return createInitialAppState(urlSnapshot ?? loadJamSnapshot(getBrowserStorage()));
}

function downloadTextFile(fileName: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getExportFileName() {
  return `strujam8-${new Date().toISOString().slice(0, 10)}.json`;
}

function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState, loadInitialAppState);
  const [highlightedPadId, setHighlightedPadId] = useState<string | null>(null);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyTextResult | "idle">("idle");
  const [fileStatusMessage, setFileStatusMessage] = useState("");
  const [audioStatusMessage, setAudioStatusMessage] = useState("");
  const [audioRecoveryAvailable, setAudioRecoveryAvailable] = useState(false);
  const [codePulseIndex, setCodePulseIndex] = useState(0);
  const [activeCodeLocations, setActiveCodeLocations] = useState<StrudelCodeLocation[] | null>(null);
  const pendingAudioLocationsRef = useRef<StrudelCodeLocation[]>([]);
  const pendingAudioFlushIdRef = useRef<number | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const lastPlayedCodeRef = useRef<string | null>(null);
  const {
    currentLevel,
    selectedTarget,
    selectedIntent,
    selectedPresetId,
    rules,
    ruleHistory,
    ruleFuture,
    isPlaying,
  } = state;

  const visiblePads = useMemo<PadOption[]>(() => {
    if (currentLevel === "target") {
      return targets;
    }

    if (currentLevel === "intent") {
      return intents;
    }

    return getTechniqueOptions(selectedTarget?.id ?? null, selectedIntent?.id ?? null);
  }, [currentLevel, selectedIntent, selectedTarget]);

  const activeTechniqueIds = useMemo(
    () => new Set(rules.filter((rule) => rule.enabled).map((rule) => rule.techniqueId)),
    [rules],
  );
  const previewIntentPad = useMemo<PadOption | null>(() => {
    if (currentLevel !== "intent") {
      return null;
    }

    return visiblePads.find((pad) => pad.id === highlightedPadId) ?? visiblePads[0] ?? null;
  }, [currentLevel, highlightedPadId, visiblePads]);
  const previewRoute =
    selectedTarget && previewIntentPad
      ? getRouteDefinition(selectedTarget.id, previewIntentPad.id as IntentId)
      : undefined;
  const previewPad = useMemo<PadOption | null>(() => {
    if (currentLevel !== "technique") {
      return null;
    }

    return visiblePads.find((pad) => pad.id === highlightedPadId) ?? visiblePads[0] ?? null;
  }, [currentLevel, highlightedPadId, visiblePads]);
  const previewTechnique = previewPad ? getTechniqueById(previewPad.id) : undefined;
  const selectedRule = useMemo<Rule | null>(() => {
    if (rules.length === 0) {
      return null;
    }

    const matchingRule = rules.find((rule) => rule.id === selectedRuleId);

    return matchingRule ?? rules[rules.length - 1] ?? null;
  }, [rules, selectedRuleId]);
  const selectedRuleTechnique = selectedRule
    ? getTechniqueById(selectedRule.techniqueId)
    : undefined;
  const selectedPreset = useMemo(
    () => getPresetDefinition(selectedPresetId),
    [selectedPresetId],
  );
  const audibleCodeLines = useMemo(
    () => formatPlayableCodeLines(rules, selectedPreset),
    [rules, selectedPreset],
  );
  const audibleCode = useMemo(() => joinCodeLines(audibleCodeLines), [audibleCodeLines]);
  const audibleCodeTextLines = useMemo(
    () => audibleCodeLines.map((line) => line.text),
    [audibleCodeLines],
  );
  const audibleCodeTokens = useMemo(
    () => audibleCodeLines.map((line) => tokenizeCodeLine(line.text || " ")),
    [audibleCodeLines],
  );
  const codeLineOffsets = useMemo(
    () => getCodeLineOffsets(audibleCodeTextLines),
    [audibleCodeTextLines],
  );
  const codeTokenOffsets = useMemo(
    () => audibleCodeTokens.map((tokens, index) =>
      getCodeTokenOffsets(codeLineOffsets[index] ?? 0, tokens),
    ),
    [audibleCodeTokens, codeLineOffsets],
  );
  const activeCodeLineIndexes = useMemo(() => {
    if (!isPlaying) {
      return new Set<number>();
    }

    if (activeCodeLocations !== null) {
      return getActiveCodeLineIndexesFromLocations(audibleCodeTextLines, activeCodeLocations);
    }

    return getActiveCodeLineIndexes(audibleCodeLines, codePulseIndex);
  }, [activeCodeLocations, audibleCodeLines, audibleCodeTextLines, codePulseIndex, isPlaying]);
  const activeCodeRuleId = useMemo(() => {
    if (!isPlaying || activeCodeLocations !== null) {
      return null;
    }

    return getActiveCodeRuleId(audibleCodeLines, codePulseIndex);
  }, [activeCodeLocations, audibleCodeLines, codePulseIndex, isPlaying]);
  const pathLabel = getPathLabel(currentLevel, selectedTarget, selectedIntent);
  const copyStatusLabel = getCopyStatusLabel(copyStatus);

  const announce = useCallback((message: string) => {
    setStatusMessage("");
    window.setTimeout(() => setStatusMessage(message), 0);
  }, []);

  const clearPendingAudioLocations = useCallback(() => {
    if (pendingAudioFlushIdRef.current !== null) {
      window.clearTimeout(pendingAudioFlushIdRef.current);
      pendingAudioFlushIdRef.current = null;
    }

    pendingAudioLocationsRef.current = [];
  }, []);

  const handleAudioTrigger = useCallback<StrudelAudioTriggerHandler>((locations) => {
    pendingAudioLocationsRef.current = mergeCodeLocations(pendingAudioLocationsRef.current, locations);

    if (pendingAudioFlushIdRef.current !== null) {
      return;
    }

    pendingAudioFlushIdRef.current = window.setTimeout(() => {
      pendingAudioFlushIdRef.current = null;
      const nextLocations = pendingAudioLocationsRef.current;
      pendingAudioLocationsRef.current = [];
      setActiveCodeLocations(nextLocations.length > 0 ? nextLocations : null);
    }, 0);
  }, []);

  const handleAudioRuntimeError = useCallback<StrudelAudioErrorHandler>((error) => {
    console.error(error);
    clearPendingAudioLocations();
    stopStrudelAudio();
    lastPlayedCodeRef.current = null;
    setActiveCodeLocations(null);
    dispatch({ type: "setPlaying", isPlaying: false });
    setAudioRecoveryAvailable(true);
    setAudioStatusMessage("Audio stopped after error. Retry available.");
    announce("Audio playback stopped because of an audio error");
  }, [announce, clearPendingAudioLocations]);

  const stopAudioPreview = useCallback((statusMessage: string, announcement: string) => {
    clearPendingAudioLocations();
    stopStrudelAudio();
    lastPlayedCodeRef.current = null;
    setActiveCodeLocations(null);
    dispatch({ type: "setPlaying", isPlaying: false });
    setAudioRecoveryAvailable(false);
    setAudioStatusMessage(statusMessage);
    announce(announcement);
  }, [announce, clearPendingAudioLocations]);

  useEffect(() => {
    return () => {
      clearPendingAudioLocations();
      stopStrudelAudio();
    };
  }, [clearPendingAudioLocations]);

  useEffect(() => {
    saveJamSnapshot(getBrowserStorage(), {
      selectedPresetId,
      rules,
    });
  }, [rules, selectedPresetId]);

  useEffect(() => {
    setCopyStatus("idle");
  }, [audibleCode]);

  useEffect(() => {
    if (!isPlaying) {
      setCodePulseIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setCodePulseIndex((currentIndex) => currentIndex + 1);
    }, 280);

    return () => window.clearInterval(intervalId);
  }, [isPlaying]);

  useEffect(() => {
    setHighlightedPadId(null);
  }, [currentLevel, selectedIntent?.id, selectedTarget?.id]);

  useEffect(() => {
    if (rules.length === 0) {
      setSelectedRuleId(null);
      return;
    }

    if (!selectedRuleId || !rules.some((rule) => rule.id === selectedRuleId)) {
      setSelectedRuleId(rules[rules.length - 1]?.id ?? null);
    }
  }, [rules, selectedRuleId]);

  const handlePadPress = useCallback((pad: PadOption) => {
    if (currentLevel === "target") {
      dispatch({ type: "selectTarget", target: { id: pad.id as TargetId, label: pad.label } });
      return;
    }

    if (currentLevel === "intent") {
      dispatch({ type: "selectIntent", intent: { id: pad.id as IntentId, label: pad.label } });
      return;
    }

    if (!selectedTarget || !selectedIntent) {
      return;
    }

    const techniqueDefinition = getTechniqueById(pad.id);
    const nextRule = techniqueDefinition
      ? createRuleFromTechnique(techniqueDefinition)
      : {
          id: createRuleId(selectedTarget.id, selectedIntent.id, pad.id),
          targetId: selectedTarget.id,
          intentId: selectedIntent.id,
          techniqueId: pad.id,
          target: selectedTarget.label,
          intent: selectedIntent.label,
          technique: pad.label,
          shortLabel: pad.label,
          strudelSnippet: null,
          needsTodo: false,
          enabled: true,
        };

    dispatch({ type: "addRule", rule: nextRule });
    setSelectedRuleId(nextRule.id);
    announce(formatRuleAddedAnnouncement(nextRule));
  }, [announce, currentLevel, selectedIntent, selectedTarget]);

  const handleStarterJam = useCallback(() => {
    const starterRules = starterJam.techniqueIds
      .map((techniqueId) => getTechniqueById(techniqueId))
      .filter((technique): technique is TechniqueDefinition => Boolean(technique))
      .map(createRuleFromTechnique);

    if (starterRules.length === 0) {
      return;
    }

    dispatch({ type: "addRules", rules: starterRules });
    setSelectedRuleId(starterRules[starterRules.length - 1]?.id ?? null);
    announce(`${starterJam.label}を追加しました。コードパネルで変化を確認できます。`);
  }, [announce]);

  const handleToggleRule = useCallback((rule: Rule) => {
    dispatch({ type: "toggleRuleEnabled", ruleId: rule.id });
    announce(formatRuleToggledAnnouncement(rule, !rule.enabled));
  }, [announce]);

  const handleMoveRule = useCallback((rule: Rule, direction: "up" | "down") => {
    dispatch({ type: "moveRule", ruleId: rule.id, direction });
    announce(formatRuleMovedAnnouncement(rule, direction));
  }, [announce]);

  const handleDuplicateRule = useCallback((rule: Rule) => {
    const duplicatedRule = {
      ...rule,
      id: createRuleId(rule.targetId, rule.intentId, rule.techniqueId),
    };

    dispatch({ type: "duplicateRule", sourceRuleId: rule.id, rule: duplicatedRule });
    setSelectedRuleId(duplicatedRule.id);
    announce(formatRuleDuplicatedAnnouncement(rule));
  }, [announce]);

  const handleRemoveRule = useCallback((rule: Rule) => {
    dispatch({ type: "removeRule", ruleId: rule.id });
    announce(formatRuleRemovedAnnouncement(rule));
  }, [announce]);

  const handleUndoRuleChange = useCallback(() => {
    dispatch({ type: "undoRuleChange" });
    announce(formatUndoAnnouncement());
  }, [announce]);

  const handleRedoRuleChange = useCallback(() => {
    dispatch({ type: "redoRuleChange" });
    announce(formatRedoAnnouncement());
  }, [announce]);

  const handleResetRules = useCallback(() => {
    dispatch({ type: "resetRules" });
    announce(formatRulesResetAnnouncement(rules.length));
  }, [announce, rules.length]);

  const handlePresetChange = useCallback((presetId: PresetId) => {
    if (isPlaying) {
      stopAudioPreview("Audio stopped for preset change", "Audio stopped for preset change");
    }

    dispatch({ type: "selectPreset", presetId });
  }, [isPlaying, stopAudioPreview]);

  const handlePlay = useCallback(async () => {
    clearPendingAudioLocations();
    setAudioRecoveryAvailable(false);
    setAudioStatusMessage("Starting audio...");
    setActiveCodeLocations(null);

    try {
      const didEvaluate = await startStrudelAudio(audibleCode, handleAudioTrigger, handleAudioRuntimeError);
      if (!didEvaluate) {
        return;
      }

      lastPlayedCodeRef.current = audibleCode;
      setAudioRecoveryAvailable(false);
      dispatch({ type: "setPlaying", isPlaying: true });
      setAudioStatusMessage("Audio playing");
      announce("Audio playback started");
    } catch (error) {
      console.error(error);
      stopStrudelAudio();
      lastPlayedCodeRef.current = null;
      setActiveCodeLocations(null);
      dispatch({ type: "setPlaying", isPlaying: false });
      setAudioRecoveryAvailable(true);
      setAudioStatusMessage("Audio start failed. Retry available.");
      announce("Audio playback could not start");
    }
  }, [announce, audibleCode, clearPendingAudioLocations, handleAudioRuntimeError, handleAudioTrigger]);

  const handleStop = useCallback(() => {
    stopAudioPreview("Audio stopped", "Audio playback stopped");
  }, [stopAudioPreview]);

  useEffect(() => {
    if (!isPlaying || lastPlayedCodeRef.current === audibleCode) {
      return;
    }

    let didCancel = false;
    clearPendingAudioLocations();
    setActiveCodeLocations(null);
    setAudioRecoveryAvailable(false);
    setAudioStatusMessage("Updating audio...");

    startStrudelAudio(audibleCode, handleAudioTrigger, handleAudioRuntimeError)
      .then((didEvaluate) => {
        if (didCancel || !didEvaluate || lastPlayedCodeRef.current === null) {
          return;
        }

        lastPlayedCodeRef.current = audibleCode;
        setAudioRecoveryAvailable(false);
        setAudioStatusMessage("Audio playing");
        announce("Audio playback updated");
      })
      .catch((error) => {
        console.error(error);

        if (didCancel) {
          return;
        }

        stopStrudelAudio();
        lastPlayedCodeRef.current = null;
        setActiveCodeLocations(null);
        dispatch({ type: "setPlaying", isPlaying: false });
        setAudioRecoveryAvailable(true);
        setAudioStatusMessage("Audio update failed. Retry available.");
        announce("Audio playback could not update");
      });

    return () => {
      didCancel = true;
    };
  }, [announce, audibleCode, clearPendingAudioLocations, handleAudioRuntimeError, handleAudioTrigger, isPlaying]);

  const handleCopyCode = useCallback(async () => {
    const result = await copyTextToClipboard(audibleCode, getBrowserClipboard());
    const label = getCopyStatusLabel(result);

    setCopyStatus(result);

    if (label) {
      announce(label);
    }
  }, [announce, audibleCode]);

  const handleExportJam = useCallback(() => {
    downloadTextFile(
      getExportFileName(),
      serializeJamSnapshot({
        selectedPresetId,
        rules,
      }),
    );
    setFileStatusMessage("Exported");
    announce("Jam JSON exported");
  }, [announce, rules, selectedPresetId]);

  const handleImportClick = useCallback(() => {
    importFileInputRef.current?.click();
  }, []);

  const handleImportJam = useCallback(async (file: File | null) => {
    if (!file) {
      return;
    }

    const snapshot = parseJamSnapshotText(await file.text());

    if (!snapshot) {
      setFileStatusMessage("Import failed");
      announce("Import failed");
      return;
    }

    if (isPlaying) {
      stopAudioPreview("Audio stopped for imported jam", "Audio stopped for imported jam");
    }

    dispatch({ type: "importSnapshot", snapshot });
    setFileStatusMessage("Imported");
    announce("Jam JSON imported");
  }, [announce, isPlaying, stopAudioPreview]);

  const handleShareJam = useCallback(async () => {
    const browserHref = getBrowserHref();

    if (!browserHref) {
      setFileStatusMessage("Share unavailable");
      announce("Share URL unavailable");
      return;
    }

    const shareUrl = createJamShareUrl(browserHref, {
      selectedPresetId,
      rules,
    });

    if (!isJamShareUrlWithinLimit(shareUrl)) {
      setFileStatusMessage("Share URL too long; use Export JSON");
      announce("Share URL is too long. Use Export JSON instead");
      return;
    }

    const result = await copyTextToClipboard(shareUrl, getBrowserClipboard());

    if (result === "copied") {
      setFileStatusMessage("Share URL copied");
      announce("Share URL copied");
      return;
    }

    setFileStatusMessage("Share failed");
    announce("Share URL copy failed");
  }, [announce, rules, selectedPresetId]);

  useEffect(() => {
    const handlePadShortcut = (event: KeyboardEvent) => {
      const padIndex = getPadShortcutIndexFromEvent(event);

      if (padIndex === null) {
        return;
      }

      const pad = visiblePads[padIndex];

      if (!pad) {
        return;
      }

      event.preventDefault();
      setHighlightedPadId(pad.id);
      handlePadPress(pad);
    };

    window.addEventListener("keydown", handlePadShortcut);

    return () => {
      window.removeEventListener("keydown", handlePadShortcut);
    };
  }, [handlePadPress, visiblePads]);

  return (
    <div className="app-shell">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
      <header className="app-header">
        <div className="brand-group">
          <h1>STRUJAM8</h1>
          <label className="preset-control">
            <span>Preset</span>
            <select
              aria-label="Preset"
              value={selectedPresetId}
              onChange={(event) => handlePresetChange(event.currentTarget.value as PresetId)}
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="header-actions">
          <nav className="project-links" aria-label="Project links">
            {projectLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                aria-label={link.ariaLabel}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="file-controls" role="group" aria-label="Jam file controls">
            <button type="button" onClick={handleExportJam}>
              Export JSON
            </button>
            <button type="button" onClick={handleImportClick}>
              Import JSON
            </button>
            <button
              type="button"
              onClick={() => {
                void handleShareJam();
              }}
            >
              Share URL
            </button>
            {fileStatusMessage && (
              <span className="file-status" aria-live="polite">
                {fileStatusMessage}
              </span>
            )}
            <input
              ref={importFileInputRef}
              type="file"
              accept="application/json,.json"
              className="file-input"
              aria-label="Import jam JSON"
              onChange={(event) => {
                void handleImportJam(event.currentTarget.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </div>

          <div
            className="transport-controls"
            role="group"
            aria-label="Transport controls"
            aria-describedby="transport-ui-description"
          >
            <span id="transport-ui-description" className="sr-only">
              {transportUiDescription}
            </span>
            <button
              className={`transport-button ${isPlaying ? "is-active" : ""} ${
                audioRecoveryAvailable ? "is-retry" : ""
              }`}
              type="button"
              aria-label={formatTransportActionLabel(audioRecoveryAvailable ? "retry" : "play")}
              aria-pressed={isPlaying}
              onClick={() => {
                void handlePlay();
              }}
            >
              {audioRecoveryAvailable ? "Retry" : "Play"}
            </button>
            <button
              className={`transport-button ${!isPlaying ? "is-active" : ""}`}
              type="button"
              aria-label={formatTransportActionLabel("stop")}
              aria-pressed={!isPlaying}
              onClick={handleStop}
            >
              Stop
            </button>
            {audioStatusMessage && (
              <span
                className={`audio-status ${audioRecoveryAvailable ? "is-error" : ""}`}
                aria-live="polite"
              >
                {audioStatusMessage}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="rules-panel" aria-labelledby="rules-heading">
          <div className="panel-heading">
            <p className="eyebrow">Live Rules</p>
            <h2 id="rules-heading">音のルール一覧</h2>
          </div>

          {rules.length > 0 ? (
            <>
              <ol className="rule-list">
                {rules.map((rule, index) => (
                  <li
                    className={`rule-block ${rule.enabled ? "" : "is-disabled"} ${
                      selectedRule?.id === rule.id ? "is-focused" : ""
                    }`}
                    key={rule.id}
                  >
                    <span className="rule-index">{String(index + 1).padStart(2, "0")}</span>
                    <div className="rule-copy">
                      <span>{rule.target}</span>
                      <span>＞</span>
                      <span>{rule.intent}</span>
                      <span>＞</span>
                      <strong>{rule.technique}</strong>
                      {!rule.enabled && <span className="rule-muted-label">OFF</span>}
                      {rule.needsTodo && <span className="rule-muted-label">TODO</span>}
                    </div>
                    <div
                      className="rule-actions"
                      role="group"
                      aria-label={formatRuleActionsGroupLabel(rule)}
                    >
                      <button
                        aria-label={formatRuleDetailActionLabel(rule)}
                        aria-pressed={selectedRule?.id === rule.id}
                        className={`rule-action-button ${
                          selectedRule?.id === rule.id ? "is-selected" : ""
                        }`}
                        type="button"
                        onClick={() => setSelectedRuleId(rule.id)}
                      >
                        詳細
                      </button>
                      <button
                        aria-label={formatRuleDuplicateActionLabel(rule)}
                        className="rule-action-button"
                        type="button"
                        onClick={() => handleDuplicateRule(rule)}
                      >
                        複製
                      </button>
                      <button
                        aria-label={formatRuleMoveActionLabel(rule, "up")}
                        className="rule-action-button is-icon"
                        type="button"
                        onClick={() => handleMoveRule(rule, "up")}
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        aria-label={formatRuleMoveActionLabel(rule, "down")}
                        className="rule-action-button is-icon"
                        type="button"
                        onClick={() => handleMoveRule(rule, "down")}
                        disabled={index === rules.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        aria-label={formatRuleToggleActionLabel(rule)}
                        className="rule-action-button"
                        type="button"
                        onClick={() => handleToggleRule(rule)}
                      >
                        {rule.enabled ? "OFF" : "ON"}
                      </button>
                      <button
                        aria-label={formatRuleRemoveActionLabel(rule)}
                        className="rule-action-button is-danger"
                        type="button"
                        onClick={() => handleRemoveRule(rule)}
                      >
                        削除
                      </button>
                    </div>
                  </li>
                ))}
              </ol>

              {selectedRule && (
                <RuleDetailPanel rule={selectedRule} technique={selectedRuleTechnique} />
              )}
            </>
          ) : (
            <div className="empty-rules">
              <span>{selectedPreset.name}</span>
              <strong>初期コードのみ</strong>
              <p>{selectedPreset.description}</p>
              <button
                className="starter-jam-button"
                type="button"
                aria-label="おすすめセットを試す"
                onClick={handleStarterJam}
              >
                <span>おすすめセットを試す</span>
                <strong>{starterJam.label}</strong>
                <small>{starterJam.description}</small>
              </button>
            </div>
          )}
        </section>

        <section className="code-panel" aria-labelledby="code-heading">
          <div className="panel-heading code-heading-row">
            <div>
              <p className="eyebrow">Strudel Output</p>
              <h2 id="code-heading">Strudel Code</h2>
            </div>
            <div className="code-actions">
              {copyStatusLabel && (
                <span className={`copy-status copy-status-${copyStatus}`} aria-live="polite">
                  {copyStatusLabel}
                </span>
              )}
              <button className="copy-code-button" type="button" onClick={handleCopyCode}>
                Copy
              </button>
            </div>
          </div>
          <pre className="code-view" aria-label="Audible Strudel code">
            <code>
              {audibleCodeLines.map((line, index) => {
                const isLineActive = activeCodeLineIndexes.has(index);
                const isRuleActive = activeCodeRuleId === line.ruleId;
                const isRuleSelected = selectedRuleId === line.ruleId;

                return (
                  <span
                    className={[
                      "code-line",
                      isLineActive ? "is-active" : "",
                      isRuleActive ? "is-rule-active" : "",
                      isRuleSelected ? "is-rule-selected" : "",
                    ].filter(Boolean).join(" ")}
                    data-rule-id={line.ruleId}
                    data-target-id={line.targetId}
                    key={index + "-" + line.text}
                  >
                    {(audibleCodeTokens[index] ?? []).map((token, tokenIndex) => {
                      const tokenSegments = getCodeTokenSegments(
                        codeTokenOffsets[index]?.[tokenIndex] ?? codeLineOffsets[index] ?? 0,
                        token.text,
                        isPlaying && activeCodeLocations !== null ? activeCodeLocations : [],
                      );

                      return tokenSegments.map((segment, segmentIndex) => (
                        <span
                          className={[
                            "code-token",
                            "code-token--" + token.kind,
                            segment.isActive ? "is-location-active" : "",
                          ].filter(Boolean).join(" ")}
                          key={tokenIndex + "-" + segmentIndex + "-" + segment.text}
                        >
                          {segment.text}
                        </span>
                      ));
                    })}
                  </span>
                );
              })}
            </code>
          </pre>
        </section>
      </main>

      <footer className="pad-dock">
        <div className="dock-topline">
          <div className="path-display" aria-live="polite">
            <span className="path-label">現在地</span>
            <strong>{pathLabel}</strong>
          </div>

          <div className="navigation-controls" role="group" aria-label="Navigation controls">
            <button
              type="button"
              onClick={() => dispatch({ type: "goBack" })}
              disabled={currentLevel === "target"}
            >
              ← 戻る
            </button>
            <button type="button" onClick={() => dispatch({ type: "goHome" })}>
              HOME
            </button>
            <button
              type="button"
              onClick={handleUndoRuleChange}
              disabled={ruleHistory.length === 0}
            >
              UNDO
            </button>
            <button
              type="button"
              onClick={handleRedoRuleChange}
              disabled={ruleFuture.length === 0}
            >
              REDO
            </button>
            <button
              type="button"
              aria-label={resetRulesControlCopy.ariaLabel}
              title={resetRulesControlCopy.title}
              onClick={handleResetRules}
            >
              {resetRulesControlCopy.label}
            </button>
          </div>
        </div>

        <section
          className="pad-inspector"
          id="pad-inspector"
          aria-label="Pad context"
          aria-live="polite"
        >
          <div className="inspector-main">
            <p className="inspector-kicker">Pad Guide</p>

            {currentLevel === "target" && (
              <>
                <h2>対象</h2>
                <p>ルールをかける音の担当。ドラム、ベース、コードなどを分けて考えます。</p>
              </>
            )}

            {currentLevel === "intent" && (
              <>
                <div className="inspector-title-row">
                  <h2>
                    {selectedTarget?.label ?? "対象"} ＞ {previewIntentPad?.label ?? "意図"}
                  </h2>
                  <span className={`route-badge ${previewRoute ? "is-concrete" : "is-prototype"}`}>
                    {previewRoute ? "実装済みルート" : "仮ルート"}
                  </span>
                </div>
                <p>
                  {previewRoute?.description ??
                    `${selectedTarget?.label ?? "この対象"} ＞ ${previewIntentPad?.label ?? "この意図"} はまだ仮の8手法を表示します。具体的な音の変化は今後追加します。`}
                </p>
              </>
            )}

            {currentLevel === "technique" && (
              <>
                <div className="inspector-title-row">
                  <h2>{previewPad?.label ?? "手法"}</h2>
                  {previewTechnique?.needsTodo && <span className="todo-badge">TODO</span>}
                </div>
                <p className="inspector-route">
                  {selectedTarget?.label} ＞ {selectedIntent?.label}
                </p>
                <p>
                  {previewTechnique?.description ??
                    "このルートはまだ仮の手法です。具体的な音の変化とsnippetは今後追加します。"}
                </p>
              </>
            )}
          </div>

          <div className="inspector-code">
            <span>{currentLevel === "technique" ? "Snippet" : "Flow"}</span>
            <code>
              {currentLevel === "technique"
                ? previewTechnique?.strudelSnippet ?? "TODO: snippet not defined"
                : "target -> intent -> technique"}
            </code>
            {currentLevel === "technique" && (
              <p className="snippet-explanation">
                {previewTechnique?.snippetExplanation ??
                  "このsnippetの日本語説明はまだ未定義です。"}
              </p>
            )}
          </div>
        </section>

        <div className="pad-grid" role="group" aria-label={`${currentLevel} pads`}>
          {visiblePads.map((pad, index) => {
            const isSelectedTechnique =
              currentLevel === "technique" && activeTechniqueIds.has(pad.id);

            return (
              <button
                className={`live-pad ${isSelectedTechnique ? "is-selected" : ""}`}
                key={`${currentLevel}-${pad.id}`}
                type="button"
                style={
                  {
                    "--pad-color": pad.color,
                    "--pad-text-color": livePadTextColor,
                  } as LivePadStyle
                }
                aria-describedby={currentLevel === "technique" ? "pad-inspector" : undefined}
                aria-keyshortcuts={String(index + 1)}
                onMouseEnter={() => setHighlightedPadId(pad.id)}
                onFocus={() => setHighlightedPadId(pad.id)}
                onClick={() => handlePadPress(pad)}
              >
                <span className="pad-number">{index + 1}</span>
                {pad.shortLabel && <span className="pad-short-label">{pad.shortLabel}</span>}
                <span className="pad-label">{pad.label}</span>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}

export default App;
