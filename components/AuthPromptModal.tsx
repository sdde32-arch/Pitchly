import React from "react";
import { Shield, ArrowRight, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}
export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  feature,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  if (!isOpen) return null;
  const handleRegister = () => {
    navigate("/auth", { state: { from: location } });
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-card w-full max-w-sm rounded-2xl p-4 shadow-2xl border border-border-subtle relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-surface-raised rounded-full text-text-secondary hover:text-text-primary hover:bg-border-subtle transition-colors z-10"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col items-center text-center mt-4">
          <h2 className="text-xl font-bold text-text-primary mb-2 font-sans">
            Unlock {feature}
          </h2>
          <p className="text-xs text-text-secondary mb-6">
            Sign in or create an account to proceed with your booking.
          </p>
          <button
            onClick={handleRegister}
            className="w-full py-3.5 bg-primary-lime text-accent-text rounded-xl font-bold text-sm shadow-sm shadow-primary-lime/20 active:scale-95 hover:bg-[#96E600] transition-all flex items-center justify-center group"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    </div>
  );
};
