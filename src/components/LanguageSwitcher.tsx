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
import { PATIENT_LANGUAGES, type FlowClearLanguage } from "@/data/languages";
import {
  getPreferredPatientLanguage,
  PATIENT_LANGUAGE_EVENT,
  setPreferredPatientLanguage,
} from "@/lib/patientLanguagePreference";

export function LanguageSwitcher() {
  const [active, setActive] = useState<FlowClearLanguage>(() =>
    getPreferredPatientLanguage(),
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<FlowClearLanguage>).detail;
      if (detail) setActive(detail);
    };
    window.addEventListener(PATIENT_LANGUAGE_EVENT, handler);
    return () => window.removeEventListener(PATIENT_LANGUAGE_EVENT, handler);
  }, []);

  const choose = (lang: FlowClearLanguage) => {
    setPreferredPatientLanguage(lang);
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
            <span className="text-sm font-medium">Default patient language</span>
            <span className="text-xs text-muted-foreground">
              Preselected when opening Live and Kids sessions
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[320px] overflow-y-auto" role="listbox">
          {PATIENT_LANGUAGES.map((lang) => (
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
