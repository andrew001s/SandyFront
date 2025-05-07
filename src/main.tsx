import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar.tsx";
import { AppSidebar } from "./components/app-sidebar.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { HeaderContent } from "./components/HeaderContent.tsx";

createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <header className="flex flex-row items-center justify-between p-4">
            <SidebarTrigger className="z-10"/>
            <HeaderContent />
          </header>
          <App />
        </main>
      </SidebarProvider>
    </ThemeProvider>
);
