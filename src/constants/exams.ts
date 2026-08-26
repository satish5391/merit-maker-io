export const DEFAULT_TARGET_EXAM = "JKSSB";

export const TARGET_EXAM_OPTIONS = [
  "JKSSB",
  "JKPSC",
  "SSC CGL",
  "Banking",
  "Railways",
  "UPSC CSE",
  "State PSC",
  "SSC CHSL",
  "Defence",
] as const;

export const TARGET_EXAM_LABELS: Record<string, string> = {
  JKSSB: "JKSSB",
  JKPSC: "JKPSC",
  "SSC CGL": "SSC CGL",
  Banking: "Banking",
  Railways: "Railways",
  "UPSC CSE": "UPSC CSE",
  "State PSC": "State PSC",
  "SSC CHSL": "SSC CHSL",
  Defence: "Defence",
};

export const TARGET_EXAM_OPTIONS_WITH_LABELS = TARGET_EXAM_OPTIONS.map((value) => ({
  value,
  label: TARGET_EXAM_LABELS[value] ?? value,
}));
