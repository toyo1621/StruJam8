import type { IntentDefinition, IntentId, PadOption, TargetDefinition, TargetId } from "../types";
import { techniquePalette } from "./padColors";
import { getTechniquesByRoute } from "./techniques";
import { getTrackDefinition } from "./tracks";

function makeTarget(id: TargetId, label: string, color: string): TargetDefinition {
  return {
    id,
    label,
    color,
    trackName: getTrackDefinition(id).codeName,
  };
}

export const targets: TargetDefinition[] = [
  makeTarget("drums", "ドラム", "#ff5c8a"),
  makeTarget("bass", "ベース", "#4cc9f0"),
  makeTarget("chords", "コード", "#80ed99"),
  makeTarget("keys", "キーボード", "#ffd166"),
  makeTarget("strings", "ストリングス", "#b388ff"),
  makeTarget("bells", "ベル", "#5eead4"),
  makeTarget("guitar", "ギター", "#ff8c42"),
  makeTarget("voice", "ボイス", "#f15bb5"),
];

export const intents: IntentDefinition[] = [
  { id: "build", label: "盛り上げる", color: "#ff8c42" },
  { id: "break", label: "崩す", color: "#4cc9f0" },
  { id: "dance", label: "踊らせる", color: "#80ed99" },
  { id: "remove", label: "抜く", color: "#b388ff" },
  { id: "random", label: "ランダム感", color: "#f15bb5" },
  { id: "chill", label: "チル", color: "#5eead4" },
  { id: "widen", label: "広げる", color: "#ffd166" },
  { id: "forward", label: "前に出す", color: "#ff5c8a" },
];

const fallbackTechniqueLabels = [
  "手法1",
  "手法2",
  "手法3",
  "手法4",
  "手法5",
  "手法6",
  "手法7",
  "手法8",
];

export function getTechniqueOptions(
  targetId: TargetId | null,
  intentId: IntentId | null,
): PadOption[] {
  const routeTechniques = getTechniquesByRoute(targetId, intentId);

  if (routeTechniques.length > 0) {
    return routeTechniques.map((technique, index) => ({
      id: technique.id,
      label: technique.label,
      shortLabel: technique.shortLabel,
      color: techniquePalette[index],
    }));
  }

  return fallbackTechniqueLabels.map((label, index) => ({
    id: `fallback-technique-${index + 1}`,
    label,
    color: techniquePalette[index],
  }));
}
