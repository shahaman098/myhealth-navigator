import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import LiveConversation from "@/pages/LiveConversation";
import DemoConversation from "@/pages/DemoConversation";
import KidsMode from "@/pages/KidsMode";
import BilingualTranscript from "@/pages/BilingualTranscript";
import ClinicianReview from "@/pages/ClinicianReview";
import AuditTrail from "@/pages/AuditTrail";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Standalone animated landing page — no Layout chrome */}
          <Route path="/landing" element={<Landing />} />

          {/* App routes wrapped in Layout */}
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<DemoConversation />} />
                  <Route path="/live" element={<LiveConversation />} />
                  <Route path="/demo" element={<DemoConversation />} />
                  <Route path="/kids" element={<KidsMode />} />
                  <Route path="/transcript" element={<BilingualTranscript />} />
                  <Route path="/review" element={<ClinicianReview />} />
                  <Route path="/audit" element={<AuditTrail />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
