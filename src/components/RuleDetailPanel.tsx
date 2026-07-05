import type { Rule, TechniqueDefinition } from "../types";

interface RuleDetailPanelProps {
  rule: Rule;
  technique?: TechniqueDefinition;
}

export function RuleDetailPanel({ rule, technique }: RuleDetailPanelProps) {
  return (
    <section
      className={`rule-detail ${rule.enabled ? "" : "is-disabled"}`}
      aria-labelledby="rule-detail-heading"
    >
      <div className="rule-detail-header">
        <div>
          <p className="eyebrow">Rule Detail</p>
          <h3 id="rule-detail-heading">{rule.technique}</h3>
        </div>
        {rule.needsTodo && <span className="todo-badge">TODO</span>}
      </div>

      <p className="rule-detail-route">
        {rule.target} ＞ {rule.intent} ＞ {rule.technique}
      </p>
      <p className="rule-detail-copy-text">
        {technique?.description ??
          "このルールは仮の手法です。具体的な音の変化は今後追加します。"}
      </p>

      <div className="rule-detail-code">
        <span>Snippet</span>
        <code>{rule.strudelSnippet ?? "TODO: snippet not defined"}</code>
        <p>{technique?.snippetExplanation ?? "このsnippetの日本語説明はまだ未定義です。"}</p>
      </div>

      {rule.needsTodo && (
        <p className="rule-detail-note">
          このsnippetは未検証です。安全のため、Play用コードにはまだ反映されません。
        </p>
      )}

      {!rule.enabled && (
        <p className="rule-detail-note">
          このルールはOFFです。右側のコード表示には反映されません。
        </p>
      )}
    </section>
  );
}
