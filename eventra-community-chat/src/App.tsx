import { BrowserRouter, Routes, Route } from "react-router-dom";
import Community from "./pages/Community";
import Marketplace from "./pages/Marketplace";
import MarketPage from "./pages/MarketPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Community />} />
        <Route path="/markets" element={<Marketplace />} />
        <Route path="/market/:id" element={<MarketPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}
