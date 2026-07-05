import type { TargetId, TrackDefinition } from "../types";

export const tracks: TrackDefinition[] = [
  {
    targetId: "drums",
    label: "ドラム",
    codeName: "drums",
    basePattern: 'stack(s("sbd*4").gain(0.8), s("~ pink ~ pink").decay(0.06).gain(0.35), s("white*8").decay(0.03).hpf(5000).gain(0.22))',
    description: "外部サンプルを使わず、内蔵シンセキックとノイズで作るリズムの土台。",
  },
  {
    targetId: "bass",
    label: "ベース",
    codeName: "bass",
    basePattern: 'note("c2 ~ eb2 g2").s("sawtooth").lpf(900).gain(0.45)',
    description: "低音の動きでループの重心を作るトラック。",
  },
  {
    targetId: "chords",
    label: "コード",
    codeName: "chords",
    basePattern: 'note("c4 eb4 g4 bb4").s("triangle").slow(2).room(0.35).gain(0.38)',
    description: "和音と空間感で曲の明るさや展開を支えるトラック。",
  },
  {
    targetId: "keys",
    label: "キーボード",
    codeName: "keys",
    basePattern: 'note("c4 eb4 g4").s("square").lpf(1800).gain(0.26)',
    description: "短いフレーズや柔らかい和音を置くためのキーボードトラック。",
  },
  {
    targetId: "strings",
    label: "ストリングス",
    codeName: "strings",
    basePattern: 'note("c3 g3 eb4").s("triangle").slow(4).room(0.55).gain(0.28)',
    description: "長めの音で背景の厚みや広がりを作るトラック。",
  },
  {
    targetId: "bells",
    label: "ベル",
    codeName: "bells",
    basePattern: 'note("c5 eb5 g5").s("sine").slow(2).release(0.25).gain(0.24)',
    description: "高い音域でアクセントやきらめきを足すトラック。",
  },
  {
    targetId: "guitar",
    label: "ギター",
    codeName: "guitar",
    basePattern: 'note("c3 eb3 g3 bb3").s("sawtooth").decay(0.18).lpf(1700).gain(0.24)',
    description: "リズムの刻みや前面のフレーズ感を作るギタートラック。",
  },
  {
    targetId: "voice",
    label: "ボイス",
    codeName: "voice",
    basePattern: 'note("c4 ~ eb4 ~").s("triangle").vowel("a e").gain(0.24)',
    description: "声っぽいフォルマント感のあるシンセ断片でフックを足すトラック。",
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
