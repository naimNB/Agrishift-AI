import { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import ClimateDashboard from "./components/ClimateDashboard";
import MyFarmManager from "./components/MyFarmManager";
import NasaData from "./components/NasaData";
import HowItWorks from "./components/HowItWorks";
import Impact from "./components/Impact";
import About from "./components/About";
import Footer from "./components/Footer";
import HeroModal from "./components/HeroModal";
import VideoBgManager from "./components/VideoBgManager";

export default function App() {
  const [activeModal, setActiveModal] = useState(null);
  const [bgMode, setBgMode] = useState("normal"); // "normal" | "video"

  return (
    <div
      className={`min-h-screen text-white selection:bg-green-400 selection:text-black ${
        bgMode === "video" ? "video-bg-mode" : "bg-[#060b17]"
      }`}
    >
      {/* Fixed video background — only active in video mode */}
      {bgMode === "video" && <VideoBgManager />}

      <Navbar onOpenModal={setActiveModal} bgMode={bgMode} onToggleBgMode={() => setBgMode((m) => m === "normal" ? "video" : "normal")} />

      <main>
        <Hero onOpenModal={setActiveModal} />
        <Features />
        <ClimateDashboard />
        <MyFarmManager />
        <NasaData onOpenModal={setActiveModal} />
        <HowItWorks onOpenModal={setActiveModal} />
        <Impact onOpenModal={setActiveModal} />
        <About onOpenModal={setActiveModal} />
      </main>

      <Footer />

      {activeModal && (
        <HeroModal type={activeModal} onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}