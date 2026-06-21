export type FlowClearLanguage = {
  code: string;
  label: string;
  nativeLabel: string;
};

export const DOCTOR_LANGUAGE: FlowClearLanguage = {
  code: "en",
  label: "English",
  nativeLabel: "English",
};

export const FLOWCLEAR_LANGUAGES: FlowClearLanguage[] = [
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "ru", label: "Russian", nativeLabel: "Русский" },
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو" },
  { code: "pl", label: "Polish", nativeLabel: "Polski" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "ro", label: "Romanian", nativeLabel: "Română" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
  { code: "uk", label: "Ukrainian", nativeLabel: "Українська" },
  { code: "zh", label: "Chinese (Simplified)", nativeLabel: "中文" },
  { code: "so", label: "Somali", nativeLabel: "Soomaali" },
];

export const PATIENT_LANGUAGES = FLOWCLEAR_LANGUAGES.filter(
  (language) => language.code !== DOCTOR_LANGUAGE.code,
);

export const DEFAULT_PATIENT_LANGUAGE =
  PATIENT_LANGUAGES.find((language) => language.code === "fr") ??
  PATIENT_LANGUAGES[0];

export function getLanguageByCode(code: string): FlowClearLanguage {
  if (code === DOCTOR_LANGUAGE.code) return DOCTOR_LANGUAGE;
  return (
    PATIENT_LANGUAGES.find((language) => language.code === code) ??
    DEFAULT_PATIENT_LANGUAGE
  );
}
