import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Loans from "./pages/Loans";
import Insurance from "./pages/Insurance";
import CreditScore from "./pages/CreditScore";
import BankAccounts from "./pages/BankAccounts";
import Deposits from "./pages/Deposits";
import Retirement from "./pages/Retirement";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/insurance" element={<Insurance />} />
          <Route path="/credit-score" element={<CreditScore />} />
          <Route path="/bank-accounts" element={<BankAccounts />} />
          <Route path="/deposits" element={<Deposits />} />
          <Route path="/retirement" element={<Retirement />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
