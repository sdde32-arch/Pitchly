import React, { useState } from "react";
import { Share2, Copy, Check, ExternalLink, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ShareTournamentCardProps {
  tournamentId: string;
  tournamentName?: string;
}

export const ShareTournamentCard: React.FC<ShareTournamentCardProps> = ({
  tournamentId,
  tournamentName = "WEHAT Soccer Tournament",
}) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/#/tournament/${tournamentId}`
    : `/#/tournament/${tournamentId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tournamentName} • Live Hub`,
          text: "Follow live scores, top goal scorers, and vote for Man of the Match!",
          url: publicUrl,
        });
      } catch (err) {
        // user cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  const handleOpen = () => {
    window.open(publicUrl, "_blank");
  };

  return (
    <div className="bg-surface-card rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-md relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary-lime/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-lime/15 text-primary-lime border border-primary-lime/30 text-[10px] font-black uppercase tracking-wider">
              Spectator Portal
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-text-primary uppercase tracking-tight font-display flex items-center gap-2">
            Share Tournament
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed max-w-md">
            Live matchday link for standings, fixtures, and top scorers.
          </p>
          
          <div className="flex items-center gap-2 mt-4 max-w-md bg-app-base border border-border-subtle rounded-xl p-1.5 pl-3">
            <span className="text-xs font-mono text-text-secondary truncate flex-1 select-all">
              {publicUrl}
            </span>
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm ${
                copied 
                  ? "bg-primary-lime/20 text-primary-lime border border-primary-lime/30" 
                  : "bg-surface-card hover:bg-[#262626] text-text-primary border border-border-subtle"
              }`}
            >
              {copied ? <Check size={14} className="text-primary-lime" /> : <Copy size={14} className="text-text-secondary" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-border-subtle pt-4 md:pt-0 md:pl-6">
          {showQR ? (
            <div className="bg-white p-2 rounded-xl flex-shrink-0 animate-fadeIn" onClick={() => setShowQR(false)}>
              <QRCodeSVG value={publicUrl} size={90} className="cursor-pointer hover:opacity-80 transition-opacity" title="Click to hide" />
            </div>
          ) : (
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center justify-center w-[90px] h-[90px] rounded-xl bg-surface-raised border border-dashed border-border-subtle hover:border-primary-lime/50 hover:bg-primary-lime/5 text-text-secondary transition-all cursor-pointer flex-col gap-1.5 shrink-0"
              title="Show QR Code"
            >
              <QrCode size={26} />
              <span className="text-[10px] font-bold tracking-wide">QR Code</span>
            </button>
          )}

          <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={handleShare}
              className="flex-1 sm:w-[130px] h-10 px-4 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary-lime/20 cursor-pointer active:scale-95"
            >
              <Share2 size={16} />
              Share Link
            </button>
            <button
              onClick={handleOpen}
              className="flex-1 sm:w-[130px] h-10 px-4 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-bold text-text-primary transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={16} className="text-text-secondary" />
              Open Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
