import type { PresetDefinition, PresetId } from "../types";

export const presets: PresetDefinition[] = [
  {
    id: "toy-house",
    name: "Toy House",
    description: "明るいドラム、軽いベース、エレピのコードで始める最初のプリセット。",
    baseCode: `stack(
  s("bd*4"),
  s("~ cp ~ cp"),
  s("hh*8").gain(0.55),
  note("c2 ~ eb2 g2").s("sawtooth").gain(0.45),
  note("c4 eb4 g4 bb4").s("gm_electric_piano_1").slow(2).room(0.4)
)`,
    trackPatterns: {
      drums: 'stack(s("bd*4"), s("~ cp ~ cp"), s("hh*8").gain(0.55))',
      bass: 'note("c2 ~ eb2 g2").s("sawtooth").gain(0.45)',
      chords: 'note("c4 eb4 g4 bb4").s("gm_electric_piano_1").slow(2).room(0.4)',
      keys: 'note("c4 eb4 g4").s("gm_electric_piano_1")',
      strings: 'note("c3 g3 eb4").s("gm_strings").slow(4)',
      bells: 'note("c5 eb5 g5").s("gm_celesta").slow(2)',
      guitar: 'note("c3 eb3 g3 bb3").s("gm_electric_guitar_clean")',
      voice: 's("~ [ah oh] ~ [eh]")',
    },
  },
  {
    id: "neon-dub",
    name: "Neon Dub",
    description: "深めの低音、控えめなハット、余韻のあるコードで始める夜寄りのプリセット。",
    baseCode: `stack(
  stack(s("bd ~ bd ~"), s("~ cp ~ cp"), s("hh*8").gain(0.35)),
  note("c2 ~ c2 bb1").s("sawtooth").lpf(900).gain(0.5),
  note("c4 eb4 g4 bb4").s("gm_electric_piano_1").slow(4).room(0.65),
  note("g4 ~ eb4 c4").s("gm_synth_bass_2").slow(2).gain(0.32)
)`,
    trackPatterns: {
      drums: 'stack(s("bd ~ bd ~"), s("~ cp ~ cp"), s("hh*8").gain(0.35))',
      bass: 'note("c2 ~ c2 bb1").s("sawtooth").lpf(900).gain(0.5)',
      chords: 'note("c4 eb4 g4 bb4").s("gm_electric_piano_1").slow(4).room(0.65)',
      keys: 'note("g4 ~ eb4 c4").s("gm_synth_bass_2").slow(2).gain(0.32)',
      strings: 'note("c3 bb3 eb4").s("gm_strings").slow(6).room(0.7)',
      bells: 'note("c5 ~ g5 eb5").s("gm_celesta").slow(4).gain(0.35)',
      guitar: 'note("c3 ~ eb3 g3").s("gm_electric_guitar_clean").room(0.25)',
      voice: 's("~ [oh ah] ~ ~").gain(0.4)',
    },
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
