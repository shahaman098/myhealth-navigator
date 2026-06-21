// FlowClear demo: no real auth — pass-through. Kept so existing
// route wrappers don't break.
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
