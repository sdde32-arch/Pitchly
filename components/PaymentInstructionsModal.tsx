import React, { useState } from "react";
import {
  X,
  CheckCircle,
  Smartphone,
  Banknote,
  Upload,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { storageService } from "../services/storageService";
interface PaymentInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onConfirm: (
    method: "CASH" | "MOBILE_MONEY" | "mtn" | "airtel" | "cash",
    proofUrl?: string,
  ) => void;
  isProcessing: boolean;
  bookingId?: string;
  paymentDetails?: any;
}
export const PaymentInstructionsModal: React.FC<
  PaymentInstructionsModalProps
> = ({
  isOpen,
  onClose,
  amount,
  onConfirm,
  isProcessing,
  bookingId,
  paymentDetails,
}) => {
  const [method, setMethod] = useState<"CASH" | "MOBILE_MONEY" | null>(null);
  const [provider, setProvider] = useState<"mtn" | "airtel" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmedSent, setConfirmedSent] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  if (!isOpen) return null;
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError(null);
    }
  };
  const handleSubmit = async () => {
    if (!method) return;
    if (method === "CASH") {
      onConfirm("cash");
    } else {
      if (!file || !confirmedSent || !provider) return;
      setUploading(true);
      setUploadError(null);
      try {
        const id = bookingId || Math.random().toString(36).substring(2, 11);
        const url = await storageService.uploadPaymentProof(id, file);
        onConfirm(provider, url);
      } catch (error: any) {
        console.error("Upload failed", error);
        setUploadError(
          error.message || "Failed to upload screenshot. Please try again.",
        );
      } finally {
        setUploading(false);
      }
    }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4  bg-black/60 backdrop-blur-sm animate-fadeIn">
      {" "}
      <div className="w-full max-w-md glass-card flex flex-col max-h-[90vh] overflow-hidden">
        {" "}
        {/* Header */}{" "}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-[rgba(0,0,0,0.08)]">
          {" "}
          <h2 className="text-xl font-display font-bold text-[var(--color-text-inverse)] uppercase tracking-tight">
            {" "}
            {method ? "Complete Payment" : "Select Payment Method"}{" "}
          </h2>{" "}
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-[rgba(0,0,0,0.03)] text-[var(--color-text-inverse-muted)] hover:text-[var(--color-text-inverse)] transition-colors"
          >
            {" "}
            <X size={20} />{" "}
          </button>{" "}
        </div>{" "}
        {/* Content */}{" "}
        <div className="p-4 overflow-y-auto min-h-0">
          {" "}
          {!method ? (
            <div className="space-y-4">
              {" "}
              <button
                onClick={() => setMethod("MOBILE_MONEY")}
                className="w-full flex items-center gap-4 p-4 rounded-[16px] bg-[rgba(0,0,0,0.03)] border border-transparent hover:border-[#013F32]/50 transition-all group"
              >
                {" "}
                <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform">
                  {" "}
                  <Smartphone size={24} />{" "}
                </div>{" "}
                <div className="text-left">
                  {" "}
                  <h3 className="font-bold text-[var(--color-text-inverse)] text-sm uppercase tracking-wider">
                    Mobile Money
                  </h3>{" "}
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-inverse-muted)] mt-1">
                    MTN / Airtel Screenshot
                  </p>{" "}
                </div>{" "}
                <div className="ml-auto w-6 h-6 rounded-full border border-[rgba(0,0,0,0.1)] group-hover:border-[#E7FE25] group-hover:bg-[#E7FE25] transition-colors"></div>{" "}
              </button>{" "}
              <button
                onClick={() => setMethod("CASH")}
                className="w-full flex items-center gap-4 p-4 rounded-[16px] bg-[rgba(0,0,0,0.03)] border border-transparent hover:border-[#013F32]/50 transition-all group"
              >
                {" "}
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  {" "}
                  <Banknote size={24} />{" "}
                </div>{" "}
                <div className="text-left">
                  {" "}
                  <h3 className="font-bold text-[var(--color-text-inverse)] text-sm uppercase tracking-wider">
                    Pay at Venue
                  </h3>{" "}
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-inverse-muted)] mt-1">
                    Cash on arrival
                  </p>{" "}
                </div>{" "}
                <div className="ml-auto w-6 h-6 rounded-full border border-[rgba(0,0,0,0.1)] group-hover:border-emerald-500 group-hover:bg-emerald-500 transition-colors"></div>{" "}
              </button>{" "}
            </div>
          ) : method === "MOBILE_MONEY" ? (
            <div className="space-y-6">
              {" "}
              <div className="space-y-3">
                {" "}
                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest">
                  Select Provider
                </label>{" "}
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  <button
                    onClick={() => setProvider("mtn")}
                    className={`p-4 rounded-[1rem] flex flex-col items-center gap-2 transition-all ${provider === "mtn" ? "bg-yellow-400 border border-yellow-400 text-text-primary shadow-[0_0_15px_rgba(250,204,21,0.3)]" : "bg-surface-raised text-text-text-primary hover:border-yellow-400/50 border border-transparent"}`}
                  >
                    {" "}
                    <span className="text-sm font-black uppercase tracking-wider">
                      MTN MoMo
                    </span>{" "}
                  </button>{" "}
                  <button
                    onClick={() => setProvider("airtel")}
                    className={`p-4 rounded-[1rem] flex flex-col items-center gap-2 transition-all ${provider === "airtel" ? "bg-red-500 border border-red-500 text-text-primary shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-surface-raised text-text-text-primary hover:border-red-500/50 border border-transparent"}`}
                  >
                    {" "}
                    <span className="text-sm font-black uppercase tracking-wider">
                      Airtel Money
                    </span>{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
              {provider && (
                <div className="bg-surface-raised p-4 rounded-[16px] border border-border-subtle-light animate-fadeIn">
                  {" "}
                  <p className="text-[10px] font-black text-text-primary uppercase tracking-widest mb-4">
                    Send Payment To
                  </p>{" "}
                  <div className="flex justify-between items-center mb-3">
                    {" "}
                    <span className="text-xs uppercase font-bold text-text-secondary">
                      {provider === "mtn"
                        ? "MTN MoMo Number"
                        : "Airtel Money Number"}
                    </span>{" "}
                    <span className="font-mono font-black text-text-text-primary text-lg tracking-tight">
                      {" "}
                      {provider === "mtn"
                        ? paymentDetails?.mtnNumber || "Not available"
                        : paymentDetails?.airtelNumber || "Not available"}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex justify-between items-center pt-3 border-t border-dashed border-border-subtle-light mb-3">
                    {" "}
                    <span className="text-xs uppercase font-bold text-text-secondary">
                      Registered Name
                    </span>{" "}
                    <span className="font-black uppercase tracking-wider text-text-text-primary text-sm">
                      {" "}
                      {provider === "mtn"
                        ? paymentDetails?.mtnAccountName || "PITCHLY UGANDA"
                        : paymentDetails?.airtelAccountName ||
                          "PITCHLY UGANDA"}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex justify-between items-center pt-3 mt-1">
                    {" "}
                    <span className="text-xs uppercase font-bold text-text-secondary">
                      Total Amount
                    </span>{" "}
                    <span className="font-black text-text-primary text-2xl tracking-tighter">
                      UGX {(amount || 0).toLocaleString()}
                    </span>{" "}
                  </div>{" "}
                </div>
              )}{" "}
              <div className="space-y-3">
                {" "}
                {uploadError && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-[16px] flex items-center gap-3 animate-shake mb-4">
                    {" "}
                    <AlertCircle
                      className="text-error shrink-0 mt-0.5"
                      size={18}
                    />{" "}
                    <p className="text-[10px] font-bold text-error leading-relaxed uppercase tracking-widest">
                      {uploadError}
                    </p>{" "}
                  </div>
                )}{" "}
                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest">
                  Upload Screenshot
                </label>{" "}
                <div className="relative">
                  {" "}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />{" "}
                  <div
                    className={`border border-dashed rounded-[16px] p-4 flex flex-col items-center justify-center transition-colors ${file ? "border-primary bg-primary-lime/5" : "border-border-subtle-light bg-surface-raised hover:border-primary/50"}`}
                  >
                    {" "}
                    {file ? (
                      <>
                        {" "}
                        <CheckCircle
                          className="text-text-primary mb-2"
                          size={24}
                        />{" "}
                        <span className="text-xs font-black uppercase tracking-widest text-text-primary">
                          {file.name}
                        </span>{" "}
                      </>
                    ) : (
                      <>
                        {" "}
                        <Upload
                          className="text-text-secondary mb-3"
                          size={28}
                        />{" "}
                        <span className="text-xs font-black uppercase tracking-wider text-text-text-primary">
                          Tap to upload proof
                        </span>{" "}
                        <span className="text-[10px] font-medium text-text-secondary mt-1">
                          Accepts images from Gallery or Camera
                        </span>{" "}
                      </>
                    )}{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="bg-primary-lime/5 border border-primary/20 rounded-[16px] p-4 flex items-center gap-3">
                {" "}
                <AlertCircle className="text-text-primary shrink-0" size={16} />{" "}
                <p className="text-[10px] text-text-primary/90 font-bold uppercase tracking-widest leading-relaxed">
                  {" "}
                  Your booking will be confirmed after the pitch owner reviews
                  your payment proof.{" "}
                </p>{" "}
              </div>{" "}
              <label className="flex items-center gap-4 p-4 rounded-[1rem] bg-surface-raised cursor-pointer">
                {" "}
                <input
                  type="checkbox"
                  checked={confirmedSent}
                  onChange={(e) => setConfirmedSent(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-border-subtle-light bg-surface-card text-text-primary focus:ring-primary focus:ring-offset-background"
                />{" "}
                <span className="text-xs font-black uppercase tracking-wider text-text-text-primary leading-relaxed">
                  {" "}
                  I confirm that I have sent UGX{" "}
                  {(amount || 0).toLocaleString()} to the designated
                  recipient.{" "}
                </span>{" "}
              </label>{" "}
            </div>
          ) : (
            <div className="text-center py-8">
              {" "}
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                {" "}
                <Banknote size={40} />{" "}
              </div>{" "}
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-text-text-primary mb-3">
                Pay at Venue
              </h3>{" "}
              <p className="text-xs text-text-secondary mb-8 px-4 leading-relaxed font-medium">
                {" "}
                Please pay{" "}
                <strong className="text-text-text-primary">
                  UGX {(amount || 0).toLocaleString()}
                </strong>{" "}
                in cash at the reception before your match starts.{" "}
              </p>{" "}
              <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#FACC15] bg-[#FACC15]/10 border border-[#FACC15]/20 p-4 rounded-2xl">
                <AlertCircle size={16} className="shrink-0 text-[#FACC15]" />
                <span className="text-left font-medium">
                  Booking is subject to availability until paid. Another player
                  might book this slot.
                </span>
              </div>{" "}
            </div>
          )}{" "}
        </div>{" "}
        {/* Footer */}{" "}
        <div className="shrink-0 p-4 flex items-center gap-3">
          {" "}
          {method && (
            <button
              onClick={() => setMethod(null)}
              className="px-4 py-4 rounded-full font-black uppercase tracking-widest text-[10px] text-text-secondary bg-surface-raised hover:bg-border-light transition-colors"
            >
              {" "}
              Back{" "}
            </button>
          )}{" "}
          <button
            onClick={handleSubmit}
            disabled={
              !method ||
              (method === "MOBILE_MONEY" && (!file || !confirmedSent)) ||
              isProcessing ||
              uploading
            }
            className="flex-1 py-4 rounded-[16px] bg-[var(--color-accent)] text-[var(--color-text-inverse)] font-display font-semibold uppercase tracking-widest text-sm shadow-[0_8px_20px_rgba(231,254,37,0.25)] hover:shadow-[0_10px_25px_rgba(231,254,37,0.35)] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {" "}
            {isProcessing || uploading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <CheckCircle size={18} />
            )}{" "}
            {method === "CASH" ? "Confirm Booking" : "Submit Payment"}{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};
