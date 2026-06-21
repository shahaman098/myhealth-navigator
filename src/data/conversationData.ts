// ─────────────────────────────────────────────────────────────
// FlowClear Live — synthetic bilingual conversation data.
// No real patient data.
// ─────────────────────────────────────────────────────────────

export type Speaker = "doctor" | "patient";
export type Lang = string;

export interface Turn {
  id: string;
  speaker: Speaker;
  originalLang: Lang;
  translatedLang: Lang;
  original: string;
  translated: string;
  confidence: number;        // 0-1
}

export const DOCTOR = {
  name: "Dr Ahmed",
  role: "Discharge consultant",
  language: "English",
  langCode: "en" as Lang,
};

export const PATIENT = {
  name: "Mrs Asha Patel",
  age: 82,
  ward: "Ward 3B",
  language: "Auto-detect",
  langCode: "auto" as Lang,
  context: "Medically ready for discharge tomorrow · lives alone",
};

// Sample conversation — synthetic, demo only.
export const SAMPLE_TURNS: Turn[] = [
  {
    id: "t1",
    speaker: "doctor",
    originalLang: "en",
    translatedLang: "auto",
    original:
      "Mrs Patel, your infection has improved and you are medically stable. We are planning for you to go home tomorrow, but first we need to confirm two care visits each day and prepare your medication in a blister pack.",
    translated:
      "Detected-language translation: Mrs Patel, your infection has improved and you are medically stable. We are planning for you to go home tomorrow after confirming care visits and preparing your medicines.",
    confidence: 0.96,
  },
  {
    id: "t2",
    speaker: "patient",
    originalLang: "auto",
    translatedLang: "en",
    original:
      "Detected patient speech: I want to go home, but I live alone. I need help with walking, and it is important that my daughter is updated.",
    translated:
      "I want to go home, but I live alone. I need help with walking, and it is important that my daughter is updated.",
    confidence: 0.92,
  },
  {
    id: "t3",
    speaker: "doctor",
    originalLang: "en",
    translatedLang: "auto",
    original:
      "Thank you for telling me. We will contact social care to arrange two daily visits, ask pharmacy to prepare your medication, and update your daughter before discharge.",
    translated:
      "Detected-language translation: We will contact social care, ask pharmacy to prepare your medication, and update your daughter before discharge.",
    confidence: 0.95,
  },
  {
    id: "t4",
    speaker: "patient",
    originalLang: "auto",
    translatedLang: "en",
    original:
      "Detected patient speech: Will my daughter be told which medicines I need to take?",
    translated:
      "Will my daughter be told which medicines I need to take?",
    confidence: 0.93,
  },
  {
    id: "t5",
    speaker: "doctor",
    originalLang: "en",
    translatedLang: "auto",
    original:
      "Yes, we will give your daughter a clear medication explanation before you leave, and your medicines will be prepared in a blister pack.",
    translated:
      "Detected-language translation: Yes, your daughter will receive a clear medication explanation before you leave, and your medicines will be prepared in a blister pack.",
    confidence: 0.96,
  },
];

export const CONVERSATION_SUMMARY = `Mrs Asha Patel understands that her infection has improved and that discharge is planned for tomorrow. She wants to return home but is concerned because she lives alone and needs help with walking. She asked that her daughter be updated, especially about medication. The doctor explained that social care will be contacted for two daily visits, pharmacy will prepare a blister pack, and her daughter will receive a clear update before discharge.`;

export const KEY_CONCERNS: string[] = [
  "Patient lives alone",
  "Patient needs help with walking",
  "Patient wants daughter updated",
  "Patient is concerned about medication instructions",
  "Discharge depends on social care support and blister pack medication",
];

export const NEXT_STEPS: string[] = [
  "Contact social care to confirm two daily visits",
  "Request pharmacy blister pack",
  "Update daughter before discharge",
  "Confirm patient understands discharge plan",
  "Save bilingual transcript to patient notes",
];

export function langName(code: Lang): string {
  if (code === "en") return "English";
  if (code === "auto") return "Detected language";
  return code.toUpperCase();
}

export function bcp47(code: Lang): string {
  if (code === "en") return "en-GB";
  if (code === "auto") return "und";
  return code;
}
