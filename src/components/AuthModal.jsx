import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LoginCard from "./LoginCard";

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode } = useAuth();

  if (!isAuthModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={closeAuthModal}
      role="dialog"
      aria-modal="true"
    >
      <div onClick={(e) => e.stopPropagation()}>
        <LoginCard
          initialMode={authModalMode}
          onClose={closeAuthModal}
          onSuccess={closeAuthModal}
        />
      </div>
    </div>
  );
}
