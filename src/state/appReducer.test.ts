import { describe, expect, it } from "vitest";
import { appReducer, createInitialAppState, initialAppState } from "./appReducer";
import type { Rule } from "../types";

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "rule-1",
    targetId: "bass",
    intentId: "break",
    techniqueId: "bass-break-drop-notes",
    target: "ベース",
    intent: "崩す",
    technique: "音を抜く",
    shortLabel: "抜く",
    strudelSnippet: ".degradeBy(0.2)",
    needsTodo: false,
    enabled: true,
    ...overrides,
  };
}

describe("createInitialAppState", () => {
  it("creates initial state from a persisted snapshot without restoring transient UI state", () => {
    const rule = makeRule();
    const state = createInitialAppState({
      version: 1,
      selectedPresetId: "neon-dub",
      rules: [rule],
    });

    expect(state.selectedPresetId).toBe("neon-dub");
    expect(state.rules).toEqual([rule]);
    expect(state.currentLevel).toBe("target");
    expect(state.ruleHistory).toEqual([]);
    expect(state.ruleFuture).toEqual([]);
    expect(state.isPlaying).toBe(false);
  });
});

describe("appReducer", () => {
  it("moves from target to intent when a target is selected", () => {
    const state = appReducer(initialAppState, {
      type: "selectTarget",
      target: { id: "bass", label: "ベース" },
    });

    expect(state.currentLevel).toBe("intent");
    expect(state.selectedTarget).toEqual({ id: "bass", label: "ベース" });
    expect(state.selectedIntent).toBeNull();
  });

  it("moves from intent to technique when an intent is selected", () => {
    const targetState = appReducer(initialAppState, {
      type: "selectTarget",
      target: { id: "bass", label: "ベース" },
    });
    const state = appReducer(targetState, {
      type: "selectIntent",
      intent: { id: "break", label: "崩す" },
    });

    expect(state.currentLevel).toBe("technique");
    expect(state.selectedIntent).toEqual({ id: "break", label: "崩す" });
  });

  it("adds, toggles, and removes rules", () => {
    const addedState = appReducer(initialAppState, { type: "addRule", rule: makeRule() });
    const toggledState = appReducer(addedState, { type: "toggleRuleEnabled", ruleId: "rule-1" });
    const removedState = appReducer(toggledState, { type: "removeRule", ruleId: "rule-1" });

    expect(addedState.rules).toHaveLength(1);
    expect(toggledState.rules[0]?.enabled).toBe(false);
    expect(removedState.rules).toEqual([]);
  });

  it("duplicates a rule below its source and keeps it undoable", () => {
    const firstRule = makeRule({ id: "first", technique: "音を抜く" });
    const secondRule = makeRule({ id: "second", technique: "音を反転" });
    const duplicateRule = makeRule({ id: "duplicate", technique: "音を抜く" });
    const stateWithRules = {
      ...initialAppState,
      rules: [firstRule, secondRule],
    };

    const duplicatedState = appReducer(stateWithRules, {
      type: "duplicateRule",
      sourceRuleId: "first",
      rule: duplicateRule,
    });
    const undoState = appReducer(duplicatedState, { type: "undoRuleChange" });
    const redoState = appReducer(undoState, { type: "redoRuleChange" });

    expect(duplicatedState.rules.map((rule) => rule.id)).toEqual(["first", "duplicate", "second"]);
    expect(duplicatedState.ruleFuture).toEqual([]);
    expect(undoState.rules.map((rule) => rule.id)).toEqual(["first", "second"]);
    expect(redoState.rules.map((rule) => rule.id)).toEqual(["first", "duplicate", "second"]);
  });

  it("does not duplicate when the source rule is missing", () => {
    const stateWithRules = {
      ...initialAppState,
      rules: [makeRule({ id: "first" })],
    };

    const state = appReducer(stateWithRules, {
      type: "duplicateRule",
      sourceRuleId: "missing",
      rule: makeRule({ id: "duplicate" }),
    });

    expect(state).toBe(stateWithRules);
  });

  it("moves rules up and down", () => {
    const stateWithRules = {
      ...initialAppState,
      rules: [
        makeRule({ id: "first", technique: "音を抜く" }),
        makeRule({ id: "second", technique: "音を反転" }),
        makeRule({ id: "third", technique: "歪ませる" }),
      ],
    };

    const movedUpState = appReducer(stateWithRules, {
      type: "moveRule",
      ruleId: "third",
      direction: "up",
    });
    const movedDownState = appReducer(movedUpState, {
      type: "moveRule",
      ruleId: "first",
      direction: "down",
    });

    expect(movedUpState.rules.map((rule) => rule.id)).toEqual(["first", "third", "second"]);
    expect(movedDownState.rules.map((rule) => rule.id)).toEqual(["third", "first", "second"]);
  });

  it("does not move rules beyond list boundaries", () => {
    const stateWithRules = {
      ...initialAppState,
      rules: [makeRule({ id: "first" }), makeRule({ id: "second" })],
    };

    const moveFirstUpState = appReducer(stateWithRules, {
      type: "moveRule",
      ruleId: "first",
      direction: "up",
    });
    const moveSecondDownState = appReducer(stateWithRules, {
      type: "moveRule",
      ruleId: "second",
      direction: "down",
    });

    expect(moveFirstUpState.rules.map((rule) => rule.id)).toEqual(["first", "second"]);
    expect(moveSecondDownState.rules.map((rule) => rule.id)).toEqual(["first", "second"]);
  });

  it("undoes rule changes in reverse order", () => {
    const firstRule = makeRule({ id: "first", technique: "音を抜く" });
    const secondRule = makeRule({ id: "second", technique: "音を反転" });
    const withFirstRule = appReducer(initialAppState, { type: "addRule", rule: firstRule });
    const withSecondRule = appReducer(withFirstRule, { type: "addRule", rule: secondRule });
    const movedState = appReducer(withSecondRule, {
      type: "moveRule",
      ruleId: "second",
      direction: "up",
    });

    const undoMoveState = appReducer(movedState, { type: "undoRuleChange" });
    const undoAddSecondState = appReducer(undoMoveState, { type: "undoRuleChange" });
    const undoAddFirstState = appReducer(undoAddSecondState, { type: "undoRuleChange" });

    expect(movedState.rules.map((rule) => rule.id)).toEqual(["second", "first"]);
    expect(undoMoveState.rules.map((rule) => rule.id)).toEqual(["first", "second"]);
    expect(undoMoveState.ruleFuture.map((rules) => rules.map((rule) => rule.id))).toEqual([
      ["second", "first"],
    ]);
    expect(undoAddSecondState.rules.map((rule) => rule.id)).toEqual(["first"]);
    expect(undoAddFirstState.rules).toEqual([]);
  });

  it("redoes undone rule changes in forward order", () => {
    const firstRule = makeRule({ id: "first", technique: "音を抜く" });
    const secondRule = makeRule({ id: "second", technique: "音を反転" });
    const withFirstRule = appReducer(initialAppState, { type: "addRule", rule: firstRule });
    const withSecondRule = appReducer(withFirstRule, { type: "addRule", rule: secondRule });
    const undoSecondRuleState = appReducer(withSecondRule, { type: "undoRuleChange" });
    const undoFirstRuleState = appReducer(undoSecondRuleState, { type: "undoRuleChange" });

    const redoFirstRuleState = appReducer(undoFirstRuleState, { type: "redoRuleChange" });
    const redoSecondRuleState = appReducer(redoFirstRuleState, { type: "redoRuleChange" });

    expect(undoFirstRuleState.rules).toEqual([]);
    expect(redoFirstRuleState.rules.map((rule) => rule.id)).toEqual(["first"]);
    expect(redoSecondRuleState.rules.map((rule) => rule.id)).toEqual(["first", "second"]);
    expect(redoSecondRuleState.ruleFuture).toEqual([]);
  });

  it("clears redo history when a new rule edit branches from an undone state", () => {
    const firstRule = makeRule({ id: "first" });
    const secondRule = makeRule({ id: "second" });
    const branchRule = makeRule({ id: "branch" });
    const withFirstRule = appReducer(initialAppState, { type: "addRule", rule: firstRule });
    const withSecondRule = appReducer(withFirstRule, { type: "addRule", rule: secondRule });
    const undoneState = appReducer(withSecondRule, { type: "undoRuleChange" });

    const branchedState = appReducer(undoneState, { type: "addRule", rule: branchRule });
    const redoState = appReducer(branchedState, { type: "redoRuleChange" });

    expect(undoneState.ruleFuture.map((rules) => rules.map((rule) => rule.id))).toEqual([
      ["first", "second"],
    ]);
    expect(branchedState.rules.map((rule) => rule.id)).toEqual(["first", "branch"]);
    expect(branchedState.ruleFuture).toEqual([]);
    expect(redoState).toBe(branchedState);
  });

  it("undoes remove, toggle, and reset rule operations", () => {
    const firstRule = makeRule({ id: "first" });
    const secondRule = makeRule({ id: "second" });
    const stateWithRules = {
      ...initialAppState,
      rules: [firstRule, secondRule],
    };
    const removedState = appReducer(stateWithRules, { type: "removeRule", ruleId: "second" });
    const restoredState = appReducer(removedState, { type: "undoRuleChange" });
    const toggledState = appReducer(restoredState, { type: "toggleRuleEnabled", ruleId: "first" });
    const undoToggleState = appReducer(toggledState, { type: "undoRuleChange" });
    const resetState = appReducer(undoToggleState, { type: "resetRules" });
    const undoResetState = appReducer(resetState, { type: "undoRuleChange" });

    expect(removedState.rules.map((rule) => rule.id)).toEqual(["first"]);
    expect(restoredState.rules.map((rule) => rule.id)).toEqual(["first", "second"]);
    expect(toggledState.rules[0]?.enabled).toBe(false);
    expect(undoToggleState.rules[0]?.enabled).toBe(true);
    expect(resetState.rules).toEqual([]);
    expect(undoResetState.rules.map((rule) => rule.id)).toEqual(["first", "second"]);
  });

  it("does not create undo history for navigation or no-op rule moves", () => {
    const targetState = appReducer(initialAppState, {
      type: "selectTarget",
      target: { id: "bass", label: "ベース" },
    });
    const stateWithRule = appReducer(targetState, { type: "addRule", rule: makeRule() });
    const noOpMoveState = appReducer(stateWithRule, {
      type: "moveRule",
      ruleId: "rule-1",
      direction: "up",
    });
    const undoState = appReducer(noOpMoveState, { type: "undoRuleChange" });

    expect(targetState.ruleHistory).toEqual([]);
    expect(noOpMoveState.ruleHistory).toHaveLength(1);
    expect(undoState.rules).toEqual([]);
  });

  it("navigates back through the hierarchy", () => {
    const targetState = appReducer(initialAppState, {
      type: "selectTarget",
      target: { id: "bass", label: "ベース" },
    });
    const techniqueState = appReducer(targetState, {
      type: "selectIntent",
      intent: { id: "break", label: "崩す" },
    });

    const intentState = appReducer(techniqueState, { type: "goBack" });
    const homeState = appReducer(intentState, { type: "goBack" });

    expect(intentState.currentLevel).toBe("intent");
    expect(intentState.selectedIntent).toBeNull();
    expect(homeState.currentLevel).toBe("target");
    expect(homeState.selectedTarget).toBeNull();
  });

  it("resets rules without changing the current navigation location", () => {
    const stateWithRule = {
      ...initialAppState,
      currentLevel: "technique" as const,
      selectedTarget: { id: "bass" as const, label: "ベース" },
      selectedIntent: { id: "break" as const, label: "崩す" },
      rules: [makeRule()],
    };

    const state = appReducer(stateWithRule, { type: "resetRules" });

    expect(state.rules).toEqual([]);
    expect(state.currentLevel).toBe("technique");
    expect(state.selectedTarget).toEqual({ id: "bass", label: "ベース" });
    expect(state.selectedIntent).toEqual({ id: "break", label: "崩す" });
  });

  it("sets the transport UI state", () => {
    const playingState = appReducer(initialAppState, { type: "setPlaying", isPlaying: true });
    const stoppedState = appReducer(playingState, { type: "setPlaying", isPlaying: false });

    expect(playingState.isPlaying).toBe(true);
    expect(stoppedState.isPlaying).toBe(false);
  });

  it("imports a persisted snapshot as a fresh jam state", () => {
    const importedRule = makeRule({ id: "imported" });
    const stateWithRule = {
      ...initialAppState,
      currentLevel: "technique" as const,
      rules: [makeRule({ id: "old" })],
      ruleHistory: [[makeRule({ id: "history" })]],
      isPlaying: true,
    };

    const state = appReducer(stateWithRule, {
      type: "importSnapshot",
      snapshot: {
        version: 1,
        selectedPresetId: "neon-dub",
        rules: [importedRule],
      },
    });

    expect(state.selectedPresetId).toBe("neon-dub");
    expect(state.rules).toEqual([importedRule]);
    expect(state.currentLevel).toBe("target");
    expect(state.ruleHistory).toEqual([]);
    expect(state.ruleFuture).toEqual([]);
    expect(state.isPlaying).toBe(false);
  });

  it("selects presets without changing rules and stops the transport", () => {
    const stateWithRule = {
      ...initialAppState,
      rules: [makeRule()],
      isPlaying: true,
    };

    const state = appReducer(stateWithRule, { type: "selectPreset", presetId: "neon-dub" });

    expect(state.selectedPresetId).toBe("neon-dub");
    expect(state.rules).toEqual(stateWithRule.rules);
    expect(state.isPlaying).toBe(false);
    expect(state.ruleHistory).toEqual([]);
  });
});
