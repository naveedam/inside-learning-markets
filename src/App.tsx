import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Markets from "./pages/Markets";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Routes>
          <Route path="/" element={<Markets />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  );
}
