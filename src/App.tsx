import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { startStrudelAudio, stopStrudelAudio } from "./audio/strudelEngine";
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
import { getTechniqueById } from "./data/techniques";
import { formatPlayableCodeLines } from "./lib/codegen";
import { getActiveCodeLineIndexes, joinCodeLines } from "./lib/codeHighlight";
import {
  copyTextToClipboard,
  getBrowserClipboard,
  getCopyStatusLabel,
  type CopyTextResult,
} from "./lib/clipboard";
import { getPadShortcutIndexFromEvent } from "./lib/keyboard";
import { createJamShareUrl, getBrowserHref, parseJamShareUrl } from "./lib/shareUrl";
import {
  getBrowserStorage,
  loadJamSnapshot,
  parseJamSnapshotText,
  saveJamSnapshot,
  serializeJamSnapshot,
} from "./lib/persistence";
import { appReducer, createInitialAppState, initialAppState } from "./state/appReducer";
import type { CurrentLevel, IntentId, PadOption, PresetId, RouteSelection, Rule, TargetId } from "./types";

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
  const [codePulseIndex, setCodePulseIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
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
  const activeCodeLineIndexes = useMemo(
    () => (isPlaying ? getActiveCodeLineIndexes(audibleCodeLines, codePulseIndex) : new Set<number>()),
    [audibleCodeLines, codePulseIndex, isPlaying],
  );
  const pathLabel = getPathLabel(currentLevel, selectedTarget, selectedIntent);
  const copyStatusLabel = getCopyStatusLabel(copyStatus);

  const announce = useCallback((message: string) => {
    setStatusMessage("");
    window.setTimeout(() => setStatusMessage(message), 0);
  }, []);

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
    const nextRule: Rule = {
      id: createRuleId(selectedTarget.id, selectedIntent.id, pad.id),
      targetId: selectedTarget.id,
      intentId: selectedIntent.id,
      techniqueId: pad.id,
      target: selectedTarget.label,
      intent: selectedIntent.label,
      technique: pad.label,
      shortLabel: techniqueDefinition?.shortLabel ?? pad.label,
      strudelSnippet: techniqueDefinition?.strudelSnippet ?? null,
      needsTodo: techniqueDefinition?.needsTodo ?? false,
      enabled: true,
    };

    dispatch({ type: "addRule", rule: nextRule });
    setSelectedRuleId(nextRule.id);
    announce(formatRuleAddedAnnouncement(nextRule));
  }, [announce, currentLevel, selectedIntent, selectedTarget]);

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
    dispatch({ type: "selectPreset", presetId });
  }, []);

  const handlePlay = useCallback(async () => {
    setAudioStatusMessage("Starting audio...");

    try {
      await startStrudelAudio(audibleCode);
      dispatch({ type: "setPlaying", isPlaying: true });
      setAudioStatusMessage("Audio playing");
      announce("Audio playback started");
    } catch (error) {
      console.error(error);
      dispatch({ type: "setPlaying", isPlaying: false });
      setAudioStatusMessage("Audio start failed");
      announce("Audio playback could not start");
    }
  }, [announce, audibleCode]);

  const handleStop = useCallback(() => {
    stopStrudelAudio();
    dispatch({ type: "setPlaying", isPlaying: false });
    setAudioStatusMessage("Audio stopped");
    announce("Audio playback stopped");
  }, [announce]);

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

    dispatch({ type: "importSnapshot", snapshot });
    setFileStatusMessage("Imported");
    announce("Jam JSON imported");
  }, [announce]);

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

          <div className="file-controls" aria-label="Jam file controls">
            <button type="button" onClick={handleExportJam}>
              Export JSON
            </button>
            <button type="button" onClick={handleImportClick}>
              Import JSON
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
            aria-label="Transport controls"
            aria-describedby="transport-ui-description"
          >
            <span id="transport-ui-description" className="sr-only">
              {transportUiDescription}
            </span>
            <button
              className={`transport-button ${isPlaying ? "is-active" : ""}`}
              type="button"
              aria-label={formatTransportActionLabel("play")}
              aria-pressed={isPlaying}
              onClick={() => {
                void handlePlay();
              }}
            >
              Play
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
              <span className="audio-status" aria-live="polite">
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
                    </div>
                    <div className="rule-actions" aria-label={formatRuleActionsGroupLabel(rule)}>
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
              {audibleCodeLines.map((line, index) => (
                <span
                  className={`code-line ${activeCodeLineIndexes.has(index) ? "is-active" : ""}`}
                  key={`${index}-${line.text}`}
                >
                  {line.text || " "}
                </span>
              ))}
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

          <div className="navigation-controls">
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

        <div className="pad-grid" aria-label={`${currentLevel} pads`}>
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
