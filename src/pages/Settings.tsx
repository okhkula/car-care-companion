import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { ResponseMode } from "@/lib/chat";

/** All user preferences stored in localStorage */
interface UserPreferences {
  responseMode: ResponseMode;
  showWelcomeSuggestions: boolean;
  enableSoundEffects: boolean;
}

const PREFS_KEY = "carsgpt-preferences";

/** Load preferences from localStorage with defaults */
const loadPrefs = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return { ...defaultPrefs, ...JSON.parse(stored) };
  } catch { 
    // Ignore parsing errors
  }
  // Also check legacy key
  const legacyMode = localStorage.getItem("carsgpt-response-mode") as ResponseMode | null;
  return { ...defaultPrefs, ...(legacyMode ? { responseMode: legacyMode } : {}) };
};

const defaultPrefs: UserPreferences = {
  responseMode: "brief",
  showWelcomeSuggestions: true,
  enableSoundEffects: false,
};

const savePrefs = (prefs: UserPreferences) => {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  // Keep legacy key in sync for the chat toggle
  localStorage.setItem("carsgpt-response-mode", prefs.responseMode);
};

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<UserPreferences>(loadPrefs);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [saving, setSaving] = useState(false);

  // Redirect if not signed in
  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const updatePref = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: value };
      savePrefs(updated);
      return updated;
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName },
      });
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Link
          to="/"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm font-semibold text-foreground">Settings</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Profile section */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile</h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Display Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name"
                />
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block">Email</label>
              <p className="text-sm text-foreground mt-0.5">{user.email}</p>
            </div>
          </div>
        </section>

        {/* Chat preferences */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chat Preferences</h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {/* Response mode */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Default Response Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Brief gives short 2-4 sentence answers. Detailed gives thorough explanations.
                </p>
              </div>
              <div className="flex rounded-lg border border-input overflow-hidden flex-shrink-0">
                <button
                  onClick={() => updatePref("responseMode", "brief")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    prefs.responseMode === "brief"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ⚡ Brief
                </button>
                <button
                  onClick={() => updatePref("responseMode", "detailed")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    prefs.responseMode === "detailed"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  📖 Detailed
                </button>
              </div>
            </div>

            {/* Welcome suggestions */}
            <ToggleRow
              label="Show Welcome Suggestions"
              description="Display quick-start topic cards on the home screen."
              checked={prefs.showWelcomeSuggestions}
              onChange={(v) => updatePref("showWelcomeSuggestions", v)}
            />

            {/* Sound effects */}
            <ToggleRow
              label="Sound Effects"
              description="Play a subtle sound when the AI finishes responding."
              checked={prefs.enableSoundEffects}
              onChange={(v) => updatePref("enableSoundEffects", v)}
            />
          </div>
        </section>

        {/* Danger zone */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <button
              onClick={() => {
                localStorage.removeItem(PREFS_KEY);
                localStorage.removeItem("carsgpt-response-mode");
                setPrefs(defaultPrefs);
                toast.success("Preferences reset to defaults");
              }}
              className="text-xs text-destructive hover:underline"
            >
              Reset all preferences to defaults
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

/** Reusable toggle row for boolean preferences */
const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <div className="p-4 flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${
        checked ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow-lg transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

export default Settings;
