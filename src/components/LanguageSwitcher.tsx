import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  DEFAULT_PATIENT_LANGUAGE,
  FLOWCLEAR_LANGUAGES,
  type FlowClearLanguage,
} from "@/data/languages";

const STORAGE_KEY = "flowclear.language";
const EVENT_NAME = "flowclear:language-change";

function getActiveLanguage(): FlowClearLanguage {
  if (typeof window === "undefined") return FLOWCLEAR_LANGUAGES[0];
  const code = window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_PATIENT_LANGUAGE.code;
  return (
    FLOWCLEAR_LANGUAGES.find((l) => l.code === code) ?? FLOWCLEAR_LANGUAGES[0]
  );
}

export function LanguageSwitcher() {
  const [active, setActive] = useState<FlowClearLanguage>(() =>
    getActiveLanguage(),
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<FlowClearLanguage>).detail;
      if (detail) setActive(detail);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const choose = (lang: FlowClearLanguage) => {
    window.localStorage.setItem(STORAGE_KEY, lang.code);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: lang }));
    setActive(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="glass"
          size="sm"
          className="gap-2"
          aria-label="Change translation language"
        >
          <Languages className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline text-sm font-medium">
            {active.nativeLabel}
          </span>
          <Badge variant="secondary" className="uppercase text-[10px]">
            {active.code}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 glass">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Translation</span>
            <span className="text-xs text-muted-foreground">
              Used for patient & clinician communications
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[320px] overflow-y-auto" role="listbox">
          {FLOWCLEAR_LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              role="option"
              aria-selected={active.code === lang.code}
              onClick={() => choose(lang)}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{lang.nativeLabel}</span>
                <span className="text-xs text-muted-foreground">
                  {lang.label}
                </span>
              </div>
              {active.code === lang.code && (
                <Badge variant="default" className="text-[10px]">
                  Active
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
