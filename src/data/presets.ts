import type { PresetDefinition, PresetId } from "../types";

const toyHouseTrackPatterns = {
  drums: 'stack(s("sbd*4").gain(0.8), s("~ pink ~ pink").decay(0.06).gain(0.35), s("white*8").decay(0.03).hpf(5000).gain(0.22))',
  bass: 'note("c2 ~ eb2 g2").s("sawtooth").lpf(900).gain(0.45)',
  chords: 'note("c4 eb4 g4 bb4").s("triangle").slow(2).room(0.35).gain(0.38)',
  keys: 'note("c4 eb4 g4").s("square").lpf(1800).gain(0.26)',
  strings: 'note("c3 g3 eb4").s("triangle").slow(4).room(0.55).gain(0.28)',
  bells: 'note("c5 eb5 g5").s("sine").slow(2).release(0.25).gain(0.24)',
  guitar: 'note("c3 eb3 g3 bb3").s("sawtooth").decay(0.18).lpf(1700).gain(0.24)',
  voice: 'note("c4 ~ eb4 ~").s("triangle").vowel("a e").gain(0.24)',
};

const neonDubTrackPatterns = {
  drums: 'stack(s("sbd ~ sbd ~").gain(0.85), s("~ pink ~ pink").decay(0.07).room(0.25).gain(0.3), s("white*8").decay(0.025).hpf(5200).gain(0.16))',
  bass: 'note("c2 ~ c2 bb1").s("sawtooth").lpf(750).gain(0.5)',
  chords: 'note("c4 eb4 g4 bb4").s("triangle").slow(4).room(0.6).gain(0.34)',
  keys: 'note("g4 ~ eb4 c4").s("square").slow(2).lpf(1400).gain(0.22)',
  strings: 'note("c3 bb3 eb4").s("triangle").slow(6).room(0.7).gain(0.24)',
  bells: 'note("c5 ~ g5 eb5").s("sine").slow(4).release(0.3).gain(0.2)',
  guitar: 'note("c3 ~ eb3 g3").s("sawtooth").decay(0.2).room(0.25).gain(0.22)',
  voice: 'note("c4 ~ bb3 ~").s("triangle").vowel("o a").gain(0.22)',
};

const indietronicaTrackPatterns = {
  drums:
    'stack(s("sbd*4").gain(0.74), s("~ pink ~ pink").decay(0.055).hpf(4600).gain(0.25), s("white*8").decay(0.028).hpf(5600).gain(0.16), s("white*4").slow(2).decay(0.04).hpf(4800).gain(0.12))',
  bass: 'note("c2 ~ c2 eb2 g2").s("sawtooth").lpf(650).room(0.25).gain(0.46)',
  chords:
    'note("c4 eb4 g4 bb4").s("triangle").slow(2.75).lpf(1700).room(0.62).gain(0.32)',
  keys: 'note("g4 eb5 g5 c6").s("sawtooth").lpf(2300).slow(2).room(0.44).gain(0.18)',
  strings: 'note("c3 eb3 g3 bb3").s("triangle").slow(4).lpf(1500).room(0.68).gain(0.18)',
  bells: 'note("g5 eb6 c6").s("sine").slow(6).release(0.46).room(0.72).gain(0.1)',
  guitar: 'note("c3 eb3 g3 bb3").s("sawtooth").lpf(1600).decay(0.12).room(0.24).gain(0.14)',
  voice: 'note("c4 eb4 g4").s("triangle").room(0.28).gain(0.08)',
};

const indietronicaCompatTrackPatterns = {
  drums:
    'stack(s("sbd*4").gain(0.8), s("~ pink ~ pink").decay(0.06).gain(0.3), s("white*8").decay(0.028).hpf(5600).gain(0.14))',
  bass: 'note("c2 ~ c2 g2").s("sawtooth").lpf(700).gain(0.5)',
  chords: 'note("c4 eb4 g4 bb4").s("triangle").slow(2).room(0.42).gain(0.32)',
  keys: 'note("g4 eb5 c5").s("sawtooth").slow(2).room(0.36).gain(0.16)',
  strings: 'note("c3 g3 eb4").s("triangle").slow(4).room(0.56).gain(0.14)',
  bells: 'note("g5 eb6 c6").s("sine").slow(6).release(0.4).gain(0.08)',
  guitar: 'note("c3 eb3 g3").s("sawtooth").lpf(1400).decay(0.12).room(0.2).gain(0.12)',
  voice: 'note("c4 eb4 g4").s("triangle").room(0.22).gain(0.08)',
};

export const indietronicaFallbackBaseCode = `stack(
  ${indietronicaCompatTrackPatterns.drums},
  ${indietronicaCompatTrackPatterns.bass},
  ${indietronicaCompatTrackPatterns.chords},
  ${indietronicaCompatTrackPatterns.keys},
  ${indietronicaCompatTrackPatterns.strings},
  ${indietronicaCompatTrackPatterns.bells},
  ${indietronicaCompatTrackPatterns.guitar},
  ${indietronicaCompatTrackPatterns.voice}
)`;

export const presets: PresetDefinition[] = [
  {
    id: "toy-house",
    name: "Toy House",
    description: "外部サンプルなしで鳴る、明るいシンセドラム、軽いベース、柔らかいコードの最初のプリセット。",
    baseCode: `stack(
  ${toyHouseTrackPatterns.drums},
  ${toyHouseTrackPatterns.bass},
  ${toyHouseTrackPatterns.chords}
)`,
    playbackTrackIds: ["drums", "bass", "chords"],
    trackPatterns: toyHouseTrackPatterns,
  },
  {
    id: "neon-dub",
    name: "Neon Dub",
    description: "外部サンプルなしで鳴る、深めの低音、控えめなノイズハット、余韻のあるコードの夜寄りプリセット。",
    baseCode: `stack(
  ${neonDubTrackPatterns.drums},
  ${neonDubTrackPatterns.bass},
  ${neonDubTrackPatterns.chords},
  ${neonDubTrackPatterns.keys}
)`,
    playbackTrackIds: ["drums", "bass", "chords", "keys"],
    trackPatterns: neonDubTrackPatterns,
  },
  {
    id: "indietronica",
    name: "Indietronica",
    description:
      "alt-J「Tessellate」を意識した、クリック系のドラムと少し湿度のあるシンセレイヤーを組み合わせたオリジナルプリセット。原曲のメロディや録音は使用していません。",
    baseCode: `stack(
  ${indietronicaTrackPatterns.drums},
  ${indietronicaTrackPatterns.bass},
  ${indietronicaTrackPatterns.chords},
  ${indietronicaTrackPatterns.keys},
  ${indietronicaTrackPatterns.strings},
  ${indietronicaTrackPatterns.bells},
  ${indietronicaTrackPatterns.guitar},
  ${indietronicaTrackPatterns.voice}
)`,
    playbackTrackIds: [
      "drums",
      "bass",
      "chords",
      "keys",
      "strings",
      "bells",
      "guitar",
      "voice",
    ],
    trackPatterns: indietronicaTrackPatterns,
  },
];

export const defaultPresetId: PresetId = "toy-house";

const presetsById = new Map<PresetId, PresetDefinition>(
  presets.map((preset) => [preset.id, preset]),
);

export function isPresetId(value: unknown): value is PresetId {
  return typeof value === "string" && presetsById.has(value as PresetId);
}

export function getPresetDefinition(presetId: PresetId) {
  const preset = presetsById.get(presetId);

  if (!preset) {
    throw new Error("Preset definition not found: " + presetId);
  }

  return preset;
}

export const defaultPreset = getPresetDefinition(defaultPresetId);
