import type { TargetId, TrackDefinition } from "../types";

export const tracks: TrackDefinition[] = [
  {
    targetId: "drums",
    label: "ドラム",
    codeName: "drums",
    basePattern: 'stack(s("bd*4"), s("~ cp ~ cp"), s("hh*8").gain(0.55))',
    description: "Toy Houseのキック、クラップ、ハイハットをまとめたリズムの土台。",
  },
  {
    targetId: "bass",
    label: "ベース",
    codeName: "bass",
    basePattern: 'note("c2 ~ eb2 g2").s("sawtooth").gain(0.45)',
    description: "低音の動きでループの重心を作るトラック。",
  },
  {
    targetId: "chords",
    label: "コード",
    codeName: "chords",
    basePattern: 'note("c4 eb4 g4 bb4").s("gm_electric_piano_1").slow(2).room(0.4)',
    description: "和音と空間感で曲の明るさや展開を支えるトラック。",
  },
  {
    targetId: "keys",
    label: "キーボード",
    codeName: "keys",
    basePattern: 'note("c4 eb4 g4").s("gm_electric_piano_1")',
    description: "短いフレーズや柔らかい和音を置くためのキーボードトラック。",
  },
  {
    targetId: "strings",
    label: "ストリングス",
    codeName: "strings",
    basePattern: 'note("c3 g3 eb4").s("gm_strings").slow(4)',
    description: "長めの音で背景の厚みや広がりを作るトラック。",
  },
  {
    targetId: "bells",
    label: "ベル",
    codeName: "bells",
    basePattern: 'note("c5 eb5 g5").s("gm_celesta").slow(2)',
    description: "高い音域でアクセントやきらめきを足すトラック。",
  },
  {
    targetId: "guitar",
    label: "ギター",
    codeName: "guitar",
    basePattern: 'note("c3 eb3 g3 bb3").s("gm_electric_guitar_clean")',
    description: "リズムの刻みや前面のフレーズ感を作るギタートラック。",
  },
  {
    targetId: "voice",
    label: "ボイス",
    codeName: "voice",
    basePattern: 's("~ [ah oh] ~ [eh]")',
    description: "声っぽい断片でフックや人間味を足すトラック。",
  },
];

const tracksByTargetId = new Map<TargetId, TrackDefinition>(
  tracks.map((track) => [track.targetId, track]),
);

export function getTrackDefinition(targetId: TargetId) {
  const track = tracksByTargetId.get(targetId);

  if (!track) {
    throw new Error("Track definition not found for target: " + targetId);
  }

  return track;
}
