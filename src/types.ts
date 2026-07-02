export type CurrentLevel = "target" | "intent" | "technique";

export interface PadOption {
  id?: string;
  label: string;
  color: string;
}

export interface TechniqueDefinition {
  id: string;
  label: string;
  shortLabel: string;
  target: string;
  intent: string;
  description: string;
  strudelSnippet: string;
  needsTodo?: boolean;
}

export interface Rule {
  id: string;
  target: string;
  intent: string;
  technique: string;
  shortLabel: string;
  strudelSnippet: string | null;
  needsTodo: boolean;
}
