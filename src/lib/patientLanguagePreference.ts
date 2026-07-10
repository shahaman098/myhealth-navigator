import {
  DEFAULT_PATIENT_LANGUAGE,
  PATIENT_LANGUAGES,
  type FlowClearLanguage,
} from "@/data/languages";

const STORAGE_KEY = "mhn.patient-language";
export const PATIENT_LANGUAGE_EVENT = "mhn:patient-language-change";

/** Default patient language for Live and Kids sessions, set from Settings. */
export function getPreferredPatientLanguage(): FlowClearLanguage {
  if (typeof window === "undefined") return DEFAULT_PATIENT_LANGUAGE;
  const code = window.localStorage.getItem(STORAGE_KEY);
  return (
    PATIENT_LANGUAGES.find((language) => language.code === code) ??
    DEFAULT_PATIENT_LANGUAGE
  );
}

export function setPreferredPatientLanguage(language: FlowClearLanguage) {
  window.localStorage.setItem(STORAGE_KEY, language.code);
  window.dispatchEvent(
    new CustomEvent<FlowClearLanguage>(PATIENT_LANGUAGE_EVENT, { detail: language }),
  );
}
