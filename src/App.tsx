import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PostGenerator from "./pages/PostGenerator";
import Subscriptions from "./pages/Subscriptions";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import Header from "./components/Header";
import SavedPosts from "./pages/SavedPosts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/post-generator" element={<PostGenerator />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
              <Route path="/saved-posts" element={<SavedPosts />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
