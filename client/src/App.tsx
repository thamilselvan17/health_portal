import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WebSocketProvider } from "@/hooks/use-websocket";
import NotFound from "@/pages/not-found";

import { LandingPage } from "./pages/landing";
import { LoginPage } from "./pages/auth/login";
import { RegisterPage } from "./pages/auth/register";
import { DashboardIndex } from "./pages/dashboard/index";
import { AppointmentsPage } from "./pages/dashboard/appointments";
import { RecordsPage } from "./pages/dashboard/records";
import { PatientsPage } from "./pages/dashboard/patients";
import { AvailabilityPage } from "./pages/dashboard/availability";
import { MessagesPage } from "./pages/dashboard/messages";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      {/* Protected Routes (checks happen in components) */}
      <Route path="/dashboard" component={DashboardIndex} />
      <Route path="/dashboard/appointments" component={AppointmentsPage} />
      <Route path="/dashboard/availability" component={AvailabilityPage} />
      <Route path="/dashboard/records" component={RecordsPage} />
      <Route path="/dashboard/patients" component={PatientsPage} />
      <Route path="/dashboard/messages" component={MessagesPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WebSocketProvider>
          <Toaster />
          <Router />
        </WebSocketProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
