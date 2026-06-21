// FlowClear demo stub — no real auth. Provides a static
// clinician identity so existing UI keeps working.
import { useNavigate } from "react-router-dom";

export type UserRole = "doctor" | "patient";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

interface DemoUser {
  id: string;
  email: string;
}

type DemoSession = Record<string, never>;

const DEMO_PROFILE: UserProfile = {
  id: "demo-clinician",
  email: "dr.patel@flowclear.demo",
  full_name: "Dr. Patel",
};

export function useAuth() {
  const navigate = useNavigate();
  return {
    user: { id: DEMO_PROFILE.id, email: DEMO_PROFILE.email } satisfies DemoUser,
    session: {} satisfies DemoSession,
    userRole: "doctor" as UserRole,
    userProfile: DEMO_PROFILE,
    loading: false,
    signUp: async () => ({ error: null }),
    signIn: async () => {
      navigate("/dashboard");
      return { error: null };
    },
    signOut: async () => {
      navigate("/");
    },
  };
}
