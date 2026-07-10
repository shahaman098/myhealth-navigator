import { Card } from "@/components/ui/card";
import { Settings as SettingsIcon, ShieldCheck, Languages } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Settings = () => (
  <div className="container mx-auto px-6 py-8 max-w-3xl space-y-6">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <SettingsIcon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Workspace preferences</p>
      </div>
    </div>

    <Card className="p-6 space-y-4 hairline border">
      <h2 className="font-bold flex items-center gap-2">
        <Languages className="h-4 w-4 text-primary" /> Default patient language
      </h2>
      <p className="text-xs text-muted-foreground">
        Preselected when you open a Live or Kids session. You can still change it
        per session from the session screen.
      </p>
      <LanguageSwitcher />
    </Card>

    <Card className="p-6 hairline border">
      <h2 className="font-bold flex items-center gap-2 mb-2">
        <ShieldCheck className="h-4 w-4 text-primary" /> Safety
      </h2>
      <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
        <li>MyHealth Navigator never sends anything automatically.</li>
        <li>Every draft requires clinician approval before routing.</li>
        <li>All actions are timestamped in the audit trail.</li>
        <li>AI translation is an aid, not a clinical decision tool.</li>
      </ul>
    </Card>
  </div>
);

export default Settings;
