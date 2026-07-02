import { useMemo, useState } from "react";
import { getTechniqueOptions, intents, targets } from "./data/pads";
import { getTechniqueById } from "./data/techniques";
import type { CurrentLevel, PadOption, Rule } from "./types";

const initialCode = `stack(
  s("bd*4"),
  s("~ cp ~ cp"),
  s("hh*8").gain(0.55),
  note("c2 ~ eb2 g2").s("sawtooth").gain(0.45),
  note("c4 eb4 g4 bb4").s("gm_electric_piano_1").slow(2).room(0.4)
)`;

function getPathLabel(level: CurrentLevel, target: string | null, intent: string | null) {
  if (level === "target" || !target) {
    return "HOME";
  }

  if (level === "intent" || !intent) {
    return target;
  }

  return `${target} ＞ ${intent}`;
}

function getTrackCodeName(target: string) {
  const trackNames: Record<string, string> = {
    ベース: "bass",
    コード: "chords",
    ドラム: "drums",
    キーボード: "keys",
    ストリングス: "strings",
    ベル: "bells",
    ギター: "guitar",
    ボイス: "voice",
  };

  return trackNames[target] ?? "track";
}

function formatRuleSnippet(rule: Rule) {
  const routeComment = `/* ${rule.target} ＞ ${rule.intent} ＞ ${rule.technique} */`;
  const trackName = getTrackCodeName(rule.target);

  if (!rule.strudelSnippet) {
    return `${routeComment}
// TODO: ${trackName}: ${rule.technique} のstrudelSnippetを定義する`;
  }

  const todoComment = rule.needsTodo ? "\n// TODO: Strudelで動作確認する" : "";

  return `${routeComment}${todoComment}
${trackName}: ${rule.strudelSnippet}`;
}

function App() {
  const [currentLevel, setCurrentLevel] = useState<CurrentLevel>("target");
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const visiblePads = useMemo<PadOption[]>(() => {
    if (currentLevel === "target") {
      return targets;
    }

    if (currentLevel === "intent") {
      return intents;
    }

    return getTechniqueOptions(selectedTarget, selectedIntent);
  }, [currentLevel, selectedIntent, selectedTarget]);

  const generatedCode = useMemo(() => {
    if (rules.length === 0) {
      return initialCode;
    }

    const ruleSnippets = rules.map((rule) => formatRuleSnippet(rule)).join("\n");

    return `${initialCode}

${ruleSnippets}`;
  }, [rules]);

  const pathLabel = getPathLabel(currentLevel, selectedTarget, selectedIntent);

  const handlePadPress = (pad: PadOption) => {
    if (currentLevel === "target") {
      setSelectedTarget(pad.label);
      setSelectedIntent(null);
      setCurrentLevel("intent");
      return;
    }

    if (currentLevel === "intent") {
      setSelectedIntent(pad.label);
      setCurrentLevel("technique");
      return;
    }

    if (!selectedTarget || !selectedIntent) {
      return;
    }

    const techniqueDefinition = pad.id ? getTechniqueById(pad.id) : undefined;
    const nextRule: Rule = {
      id: `${selectedTarget}-${selectedIntent}-${pad.label}-${Date.now()}`,
      target: selectedTarget,
      intent: selectedIntent,
      technique: pad.label,
      shortLabel: techniqueDefinition?.shortLabel ?? pad.label,
      strudelSnippet: techniqueDefinition?.strudelSnippet ?? null,
      needsTodo: techniqueDefinition?.needsTodo ?? false,
    };

    setRules((currentRules) => [...currentRules, nextRule]);
    setSelectedTechniques((currentTechniques) => [...currentTechniques, pad.label]);
  };

  const goBack = () => {
    if (currentLevel === "technique") {
      setCurrentLevel("intent");
      setSelectedIntent(null);
      return;
    }

    if (currentLevel === "intent") {
      setCurrentLevel("target");
      setSelectedTarget(null);
    }
  };

  const goHome = () => {
    setCurrentLevel("target");
    setSelectedTarget(null);
    setSelectedIntent(null);
  };

  const resetRules = () => {
    setRules([]);
    setSelectedTechniques([]);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-group">
          <h1>STRUJAM8</h1>
          <span className="preset-pill">Preset: Toy House</span>
        </div>

        <div className="transport-controls" aria-label="Transport controls">
          <button
            className={`transport-button ${isPlaying ? "is-active" : ""}`}
            type="button"
            onClick={() => setIsPlaying(true)}
          >
            Play
          </button>
          <button
            className={`transport-button ${!isPlaying ? "is-active" : ""}`}
            type="button"
            onClick={() => setIsPlaying(false)}
          >
            Stop
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="rules-panel" aria-labelledby="rules-heading">
          <div className="panel-heading">
            <p className="eyebrow">Live Rules</p>
            <h2 id="rules-heading">音のルール一覧</h2>
          </div>

          {rules.length > 0 ? (
            <ol className="rule-list">
              {rules.map((rule, index) => (
                <li className="rule-block" key={rule.id}>
                  <span className="rule-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="rule-copy">
                    <span>{rule.target}</span>
                    <span>＞</span>
                    <span>{rule.intent}</span>
                    <span>＞</span>
                    <strong>{rule.technique}</strong>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty-rules">
              <span>Toy House</span>
              <strong>初期コードのみ</strong>
            </div>
          )}
        </section>

        <section className="code-panel" aria-labelledby="code-heading">
          <div className="panel-heading">
            <p className="eyebrow">Strudel Output</p>
            <h2 id="code-heading">Strudel Code</h2>
          </div>
          <pre className="code-view" aria-label="Generated Strudel code">
            <code>{generatedCode}</code>
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
            <button type="button" onClick={goBack} disabled={currentLevel === "target"}>
              ← 戻る
            </button>
            <button type="button" onClick={goHome}>
              HOME
            </button>
            <button type="button" onClick={resetRules}>
              RESET
            </button>
          </div>
        </div>

        <div className="pad-grid" aria-label={`${currentLevel} pads`}>
          {visiblePads.map((pad, index) => {
            const isSelectedTechnique =
              currentLevel === "technique" && selectedTechniques.includes(pad.label);

            return (
              <button
                className={`live-pad ${isSelectedTechnique ? "is-selected" : ""}`}
                key={`${currentLevel}-${pad.id ?? pad.label}`}
                type="button"
                style={{ "--pad-color": pad.color } as React.CSSProperties}
                onClick={() => handlePadPress(pad)}
              >
                <span className="pad-number">{index + 1}</span>
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
