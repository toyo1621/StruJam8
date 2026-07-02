import type { PadOption } from "../types";
import { getTechniquesByRoute } from "./techniques";

const techniquePalette = [
  "#ff5c8a",
  "#4cc9f0",
  "#80ed99",
  "#ffd166",
  "#b388ff",
  "#ff8c42",
  "#5eead4",
  "#f15bb5",
];

export const targets: PadOption[] = [
  { label: "ドラム", color: "#ff5c8a" },
  { label: "ベース", color: "#4cc9f0" },
  { label: "コード", color: "#80ed99" },
  { label: "キーボード", color: "#ffd166" },
  { label: "ストリングス", color: "#b388ff" },
  { label: "ベル", color: "#5eead4" },
  { label: "ギター", color: "#ff8c42" },
  { label: "ボイス", color: "#f15bb5" },
];

export const intents: PadOption[] = [
  { label: "盛り上げる", color: "#ff8c42" },
  { label: "崩す", color: "#4cc9f0" },
  { label: "踊らせる", color: "#80ed99" },
  { label: "抜く", color: "#b388ff" },
  { label: "ランダム感", color: "#f15bb5" },
  { label: "チル", color: "#5eead4" },
  { label: "広げる", color: "#ffd166" },
  { label: "前に出す", color: "#ff5c8a" },
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

export function getTechniqueOptions(target: string | null, intent: string | null): PadOption[] {
  const routeTechniques = getTechniquesByRoute(target, intent);

  if (routeTechniques.length > 0) {
    return routeTechniques.map((technique, index) => ({
      id: technique.id,
      label: technique.label,
      color: techniquePalette[index],
    }));
  }

  return fallbackTechniqueLabels.map((label, index) => ({
    label,
    color: techniquePalette[index],
  }));
}
