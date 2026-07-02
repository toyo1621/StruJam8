import type { TechniqueDefinition } from "../types";

export const techniques: TechniqueDefinition[] = [
  {
    id: "bass-break-drop-notes",
    label: "音を抜く",
    shortLabel: "抜く",
    target: "ベース",
    intent: "崩す",
    description: "ベースの発音を少し間引いて、隙間と揺らぎを作る。",
    strudelSnippet: ".degradeBy(0.2)",
  },
  {
    id: "bass-break-octave-jump",
    label: "オクターブ跳ね",
    shortLabel: "Oct+",
    target: "ベース",
    intent: "崩す",
    description: "たまに1オクターブ上へ跳ねさせて、フレーズに引っかかりを作る。",
    strudelSnippet: ".sometimes(add(note(\"12\")))",
  },
  {
    id: "bass-break-rhythm-offset",
    label: "リズムずらし",
    shortLabel: "ズラし",
    target: "ベース",
    intent: "崩す",
    description: "薄い遅れのレイヤーを足して、ベースの重心を揺らす。",
    strudelSnippet: ".off(1/8, x => x.gain(0.5))",
  },
  {
    id: "bass-break-sometimes-rest",
    label: "たまに休む",
    shortLabel: "休む",
    target: "ベース",
    intent: "崩す",
    description: "一定確率で休符化し、ベースに抜けを作る。",
    strudelSnippet: ".sometimes(silence)",
    needsTodo: true,
  },
  {
    id: "bass-break-reverse",
    label: "音を反転",
    shortLabel: "反転",
    target: "ベース",
    intent: "崩す",
    description: "パターンを逆再生方向にして、流れを一瞬ひっくり返す。",
    strudelSnippet: ".rev()",
  },
  {
    id: "bass-break-wobble",
    label: "うねらせる",
    shortLabel: "うねり",
    target: "ベース",
    intent: "崩す",
    description: "LFO風にローパスを動かして、ベースをうねらせる。",
    strudelSnippet: ".lpf(sine.range(300, 2000).slow(4))",
  },
  {
    id: "bass-break-distort",
    label: "歪ませる",
    shortLabel: "歪み",
    target: "ベース",
    intent: "崩す",
    description: "軽く歪ませて、ベースを荒く前に出す。",
    strudelSnippet: ".distort(0.4)",
  },
  {
    id: "bass-break-close-filter",
    label: "フィルター閉じる",
    shortLabel: "LPF",
    target: "ベース",
    intent: "崩す",
    description: "ローパスを固定値にして、ベースの明るさを抑える。",
    strudelSnippet: ".lpf(600)",
  },
  {
    id: "chords-build-add-high-note",
    label: "高い音を足す",
    shortLabel: "高音+",
    target: "コード",
    intent: "盛り上げる",
    description: "高い音を追加して、コードに上方向の広がりを作る。",
    strudelSnippet: ".sometimes(add(note(\"12\")))",
  },
  {
    id: "chords-build-widen-range",
    label: "音域を広げる",
    shortLabel: "音域+",
    target: "コード",
    intent: "盛り上げる",
    description: "ボイシングを広げ、コードの存在感を強める。",
    strudelSnippet: ".voicing()",
    needsTodo: true,
  },
  {
    id: "chords-build-deep-reverb",
    label: "リバーブ深く",
    shortLabel: "Room+",
    target: "コード",
    intent: "盛り上げる",
    description: "深めのルームを足して、コードを広く響かせる。",
    strudelSnippet: ".room(0.8)",
  },
  {
    id: "chords-build-open-filter",
    label: "フィルター開く",
    shortLabel: "Open",
    target: "コード",
    intent: "盛り上げる",
    description: "ローパスをゆっくり開き、展開感を作る。",
    strudelSnippet: ".lpf(sine.range(800, 4000).slow(8))",
  },
  {
    id: "chords-build-arpeggio",
    label: "アルペジオ化",
    shortLabel: "Arp",
    target: "コード",
    intent: "盛り上げる",
    description: "コードを上昇アルペジオ風にして、動きを増やす。",
    strudelSnippet: ".arp(\"up\")",
    needsTodo: true,
  },
  {
    id: "chords-build-longer",
    label: "音を長くする",
    shortLabel: "Long",
    target: "コード",
    intent: "盛り上げる",
    description: "レガートを伸ばし、コードをなめらかにつなげる。",
    strudelSnippet: ".legato(1.4)",
  },
  {
    id: "chords-build-brighten",
    label: "明るくする",
    shortLabel: "Bright",
    target: "コード",
    intent: "盛り上げる",
    description: "7度相当の音を加えて、コードの色を明るくする。",
    strudelSnippet: ".add(note(\"7\"))",
  },
  {
    id: "chords-build-louder",
    label: "音量を上げる",
    shortLabel: "Gain+",
    target: "コード",
    intent: "盛り上げる",
    description: "コードの音量を少し上げ、前面に出す。",
    strudelSnippet: ".gain(0.75)",
  },
];

export function getTechniquesByRoute(
  target: string | null,
  intent: string | null,
): TechniqueDefinition[] {
  if (!target || !intent) {
    return [];
  }

  return techniques.filter((technique) => technique.target === target && technique.intent === intent);
}

export function getTechniqueById(id: string): TechniqueDefinition | undefined {
  return techniques.find((technique) => technique.id === id);
}
