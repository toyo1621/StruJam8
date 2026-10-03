import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { codeTokenColors } from "../data/codeColors";
import {
  getCodeLineOffsets,
  getCodeTokenOffsets,
  getCodeTokenSegments,
} from "../lib/codeLocations";
import type { StrudelCodeLocation } from "../audio/strudelEngine";
import { tokenizeCodeLine } from "../lib/codeTokens";
import type { PlayableCodeLine } from "../lib/codegen";
import type { CopyTextResult } from "../lib/clipboard";

type CodeViewStyle = CSSProperties & {
  "--code-function-color": string;
  "--code-string-color": string;
  "--code-number-color": string;
  "--code-punctuation-color": string;
  "--code-operator-color": string;
  "--code-comment-color": string;
};

interface CodePanelProps {
  lines: PlayableCodeLine[];
  activeLineIndexes: ReadonlySet<number>;
  activeRuleId: string | null;
  selectedRuleId: string | null;
  isPlaying: boolean;
  evaluatedLocationCount: number;
  renderedLocations: StrudelCodeLocation[] | null;
  copyStatus: CopyTextResult | "idle";
  copyStatusLabel: string;
  onCopy: () => void;
}

export function CodePanel({
  lines,
  activeLineIndexes,
  activeRuleId,
  selectedRuleId,
  isPlaying,
  evaluatedLocationCount,
  renderedLocations,
  copyStatus,
  copyStatusLabel,
  onCopy,
}: CodePanelProps) {
  const codeViewRef = useRef<HTMLPreElement | null>(null);
  const textLines = useMemo(() => lines.map((line) => line.text), [lines]);
  const tokens = useMemo(() => textLines.map((line) => tokenizeCodeLine(line || " ")), [textLines]);
  const lineOffsets = useMemo(() => getCodeLineOffsets(textLines), [textLines]);
  const tokenOffsets = useMemo(
    () => tokens.map((lineTokens, index) => getCodeTokenOffsets(lineOffsets[index] ?? 0, lineTokens)),
    [lineOffsets, tokens],
  );

  useEffect(() => {
    if (!selectedRuleId || !codeViewRef.current) return;
    const selectedLine = [...codeViewRef.current.querySelectorAll<HTMLElement>(".code-line")]
      .find((line) => line.dataset.ruleId === selectedRuleId);
    selectedLine?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [lines, selectedRuleId]);

  return (
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
          <button className="copy-code-button" type="button" onClick={onCopy}>Copy</button>
        </div>
      </div>
      <pre
        ref={codeViewRef}
        className="code-view"
        style={{
          "--code-function-color": codeTokenColors.function,
          "--code-string-color": codeTokenColors.string,
          "--code-number-color": codeTokenColors.number,
          "--code-punctuation-color": codeTokenColors.punctuation,
          "--code-operator-color": codeTokenColors.operator,
          "--code-comment-color": codeTokenColors.comment,
        } as CodeViewStyle}
        aria-label="Audible Strudel code"
        data-location-map={isPlaying ? (evaluatedLocationCount > 0 ? "ready" : "pending") : "idle"}
        data-source-location-count={evaluatedLocationCount}
      >
        <code>
          {lines.map((line, index) => (
            <span
              className={[
                "code-line",
                activeLineIndexes.has(index) ? "is-active" : "",
                activeRuleId === line.ruleId ? "is-rule-active" : "",
                selectedRuleId === line.ruleId ? "is-rule-selected" : "",
              ].filter(Boolean).join(" ")}
              data-rule-id={line.ruleId}
              data-target-id={line.targetId}
              key={index + "-" + line.text}
            >
              {(tokens[index] ?? []).flatMap((token, tokenIndex) =>
                getCodeTokenSegments(
                  tokenOffsets[index]?.[tokenIndex] ?? lineOffsets[index] ?? 0,
                  token.text,
                  isPlaying && renderedLocations !== null ? renderedLocations : [],
                ).map((segment, segmentIndex) => (
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
                )),
              )}
            </span>
          ))}
        </code>
      </pre>
    </section>
  );
}
