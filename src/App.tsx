import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StockDetail from "./pages/StockDetail";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/stock/:ticker" element={<StockDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
