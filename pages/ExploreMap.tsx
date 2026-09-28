import React, { useState, useMemo } from "react";
import { Layout } from "../components/Layout";
import { useBooking } from "../context/BookingContext";
import {
  Search,
  MapPin,
  ArrowLeft,
  Star,
  Compass,
  Info,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ExploreMap: React.FC = () => {
  const navigate = useNavigate();
  const { turfs, loading } = useBooking();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("all");

  const areas = [
    { id: "all", label: "All Areas" },
    { id: "Munyonyo", label: "Munyonyo / Tal" },
    { id: "Lugogo", label: "Lugogo" },
    { id: "Bugolobi", label: "Bugolobi" },
    { id: "Kisaasi", label: "Kisaasi" },
    { id: "Ntinda", label: "Ntinda" },
  ];

  const filteredPitches = useMemo(() => {
    return turfs
      .filter((pitch) => pitch.status === "ACTIVE")
      .filter((pitch) => {
        const matchesSearch =
          !searchTerm ||
          pitch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pitch.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pitch.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesArea =
          selectedArea === "all" ||
          pitch.location?.toLowerCase().includes(selectedArea.toLowerCase()) ||
          pitch.name?.toLowerCase().includes(selectedArea.toLowerCase());

        return matchesSearch && matchesArea;
      });
  }, [turfs, searchTerm, selectedArea]);

  return (
    <Layout>
      <div className="min-h-screen bg-app-base text-text-primary pb-28 pt-4 px-3 sm:px-6 max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              className="w-9 h-9 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer shadow-xs"
              title="Return to Home"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text-primary">
                  Explore Pitches
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Map On Hold
                </span>
              </div>
              <p className="text-xs text-text-tertiary">
                Browse verified Kampala turf grounds and arenas
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/tournament")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-border-subtle text-xs font-semibold text-text-secondary hover:text-primary-lime hover:border-primary-lime/30 transition-all cursor-pointer"
          >
            <Trophy size={13} className="text-primary-lime" />
            <span>Tournament Hub</span>
          </button>
        </div>

        {/* Map On-Hold Status Notice */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-surface-card to-surface-card p-4 sm:p-5 mb-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Compass size={20} />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-300">
                  Interactive Map Integration Temporarily On Hold
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-md bg-amber-400/15 text-amber-300 font-semibold border border-amber-400/25">
                  Configuration in progress
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                The satellite GPS map canvas is paused while pitch coordinates and map details are being finalized. In the meantime, you can easily explore, review, and book all Kampala pitches from the directory below without interruption.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Area Filter Bar */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <input
              type="text"
              placeholder="Search pitches by name, location, or facility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-card border border-border-subtle text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime/50 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary hover:text-text-primary"
              >
                Clear
              </button>
            )}
          </div>

          {/* Area Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {areas.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedArea(a.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedArea === a.id
                    ? "bg-primary-lime text-black font-bold shadow-xs"
                    : "bg-surface-card text-text-secondary hover:text-text-primary border border-border-subtle"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pitches Directory List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-surface-card border border-border-subtle animate-pulse"
              />
            ))}
          </div>
        ) : filteredPitches.length === 0 ? (
          <div className="bg-surface-card rounded-2xl border border-border-subtle p-8 text-center space-y-3">
            <MapPin size={32} className="text-text-tertiary mx-auto" />
            <p className="text-sm font-semibold text-text-primary">No Pitches Found</p>
            <p className="text-xs text-text-tertiary max-w-sm mx-auto">
              We couldn&apos;t find any pitches matching your search. Try clearing your filters or search term.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedArea("all");
              }}
              className="px-4 py-1.5 rounded-lg bg-surface-raised border border-border-subtle text-xs font-semibold text-text-primary hover:text-primary-lime"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredPitches.map((pitch) => {
              const image =
                pitch.images?.[0] ||
                pitch.image ||
                "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80";

              return (
                <div
                  key={pitch.id}
                  onClick={() => navigate(`/turf/${pitch.id}`)}
                  className="bg-surface-card hover:bg-surface-raised/40 border border-border-subtle hover:border-primary-lime/40 rounded-2xl p-3.5 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
                >
                  <div className="flex gap-3.5">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-surface-raised shrink-0 relative">
                      <img
                        src={image}
                        alt={pitch.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-0.5">
                        <Star size={10} className="fill-[#FACC15] text-[#FACC15]" />
                        <span>{pitch.rating || "4.8"}</span>
                      </div>
                    </div>

                    {/* Pitch Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-primary-lime/10 text-primary-lime border border-primary-lime/20">
                          {pitch.pitchFormats?.[0] || "Synthetic Turf"}
                        </span>
                        {pitch.amenities?.includes("Floodlights") && (
                          <span className="text-[10px] text-text-tertiary">• Floodlights</span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-text-primary group-hover:text-primary-lime transition-colors truncate">
                        {pitch.name}
                      </h3>

                      <p className="text-xs text-text-secondary flex items-center gap-1 truncate">
                        <MapPin size={12} className="shrink-0 text-text-tertiary" />
                        <span className="truncate">{pitch.location}</span>
                      </p>

                      <p className="text-[11px] text-text-tertiary line-clamp-1 pt-0.5">
                        {pitch.description || "Official quality 7-a-side football turf."}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="mt-3 pt-2.5 border-t border-border-subtle/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-text-tertiary block">Hourly Rate</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-primary-lime">
                          UGX {(pitch.pricePerHour || 120000).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-text-tertiary">/ hr</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/turf/${pitch.id}`);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-primary-lime hover:bg-[#96E600] text-black text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>Book Pitch</span>
                      <ChevronRight size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExploreMap;

