import { defaultPresetId } from "../data/presets";
import type {
  CurrentLevel,
  IntentId,
  PersistedJamSnapshot,
  PresetId,
  RouteSelection,
  Rule,
  TargetId,
} from "../types";

export type MoveDirection = "up" | "down";

const maxRuleHistory = 50;

export interface AppState {
  currentLevel: CurrentLevel;
  selectedTarget: RouteSelection<TargetId> | null;
  selectedIntent: RouteSelection<IntentId> | null;
  selectedPresetId: PresetId;
  rules: Rule[];
  ruleHistory: Rule[][];
  ruleFuture: Rule[][];
  isPlaying: boolean;
}

export type AppAction =
  | { type: "selectTarget"; target: RouteSelection<TargetId> }
  | { type: "selectIntent"; intent: RouteSelection<IntentId> }
  | { type: "addRule"; rule: Rule }
  | { type: "duplicateRule"; sourceRuleId: string; rule: Rule }
  | { type: "toggleRuleEnabled"; ruleId: string }
  | { type: "moveRule"; ruleId: string; direction: MoveDirection }
  | { type: "removeRule"; ruleId: string }
  | { type: "undoRuleChange" }
  | { type: "redoRuleChange" }
  | { type: "goBack" }
  | { type: "goHome" }
  | { type: "resetRules" }
  | { type: "setPlaying"; isPlaying: boolean }
  | { type: "selectPreset"; presetId: PresetId }
  | { type: "importSnapshot"; snapshot: PersistedJamSnapshot };

export const initialAppState: AppState = {
  currentLevel: "target",
  selectedTarget: null,
  selectedIntent: null,
  selectedPresetId: defaultPresetId,
  rules: [],
  ruleHistory: [],
  ruleFuture: [],
  isPlaying: false,
};

export function createInitialAppState(snapshot: PersistedJamSnapshot | null = null): AppState {
  if (!snapshot) {
    return initialAppState;
  }

  return {
    ...initialAppState,
    selectedPresetId: snapshot.selectedPresetId,
    rules: snapshot.rules,
  };
}

function pushRuleStack(ruleStack: Rule[][], currentRules: Rule[]) {
  return [...ruleStack, currentRules].slice(-maxRuleHistory);
}

function commitRuleChange(state: AppState, nextRules: Rule[]): AppState {
  if (nextRules === state.rules) {
    return state;
  }

  return {
    ...state,
    rules: nextRules,
    ruleHistory: pushRuleStack(state.ruleHistory, state.rules),
    ruleFuture: [],
  };
}

function duplicateRule(rules: Rule[], sourceRuleId: string, rule: Rule) {
  const sourceIndex = rules.findIndex((existingRule) => existingRule.id === sourceRuleId);

  if (sourceIndex === -1) {
    return rules;
  }

  return [...rules.slice(0, sourceIndex + 1), rule, ...rules.slice(sourceIndex + 1)];
}

function moveRule(rules: Rule[], ruleId: string, direction: MoveDirection) {
  const fromIndex = rules.findIndex((rule) => rule.id === ruleId);

  if (fromIndex === -1) {
    return rules;
  }

  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;

  if (toIndex < 0 || toIndex >= rules.length) {
    return rules;
  }

  const nextRules = [...rules];
  [nextRules[fromIndex], nextRules[toIndex]] = [nextRules[toIndex], nextRules[fromIndex]];

  return nextRules;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "selectTarget":
      return {
        ...state,
        currentLevel: "intent",
        selectedTarget: action.target,
        selectedIntent: null,
      };

    case "selectIntent":
      return {
        ...state,
        currentLevel: "technique",
        selectedIntent: action.intent,
      };

    case "addRule":
      return commitRuleChange(state, [...state.rules, action.rule]);

    case "duplicateRule":
      return commitRuleChange(
        state,
        duplicateRule(state.rules, action.sourceRuleId, action.rule),
      );

    case "toggleRuleEnabled": {
      let didChange = false;
      const nextRules = state.rules.map((rule) => {
        if (rule.id !== action.ruleId) {
          return rule;
        }

        didChange = true;
        return { ...rule, enabled: !rule.enabled };
      });

      return didChange ? commitRuleChange(state, nextRules) : state;
    }

    case "moveRule":
      return commitRuleChange(state, moveRule(state.rules, action.ruleId, action.direction));

    case "removeRule": {
      const nextRules = state.rules.filter((rule) => rule.id !== action.ruleId);

      return nextRules.length === state.rules.length ? state : commitRuleChange(state, nextRules);
    }

    case "undoRuleChange": {
      const previousRules = state.ruleHistory[state.ruleHistory.length - 1];

      if (!previousRules) {
        return state;
      }

      return {
        ...state,
        rules: previousRules,
        ruleHistory: state.ruleHistory.slice(0, -1),
        ruleFuture: pushRuleStack(state.ruleFuture, state.rules),
      };
    }

    case "redoRuleChange": {
      const nextRules = state.ruleFuture[state.ruleFuture.length - 1];

      if (!nextRules) {
        return state;
      }

      return {
        ...state,
        rules: nextRules,
        ruleHistory: pushRuleStack(state.ruleHistory, state.rules),
        ruleFuture: state.ruleFuture.slice(0, -1),
      };
    }

    case "goBack":
      if (state.currentLevel === "technique") {
        return {
          ...state,
          currentLevel: "intent",
          selectedIntent: null,
        };
      }

      if (state.currentLevel === "intent") {
        return {
          ...state,
          currentLevel: "target",
          selectedTarget: null,
        };
      }

      return state;

    case "goHome":
      return {
        ...state,
        currentLevel: "target",
        selectedTarget: null,
        selectedIntent: null,
      };

    case "resetRules":
      return state.rules.length === 0 ? state : commitRuleChange(state, []);

    case "setPlaying":
      return {
        ...state,
        isPlaying: action.isPlaying,
      };

    case "selectPreset":
      return {
        ...state,
        selectedPresetId: action.presetId,
        isPlaying: false,
      };

    case "importSnapshot":
      return createInitialAppState(action.snapshot);

    default:
      return state;
  }
}
