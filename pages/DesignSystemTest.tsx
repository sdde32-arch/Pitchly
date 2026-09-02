import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { Checkbox } from '../components/ui/Checkbox';
import { Radio } from '../components/ui/Radio';
import { PitchAvailabilitySlot } from '../components/ui/PitchAvailabilitySlot';
import { EmptyState } from '../components/ui/EmptyState';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  CreditCard,
  User,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronRight,
  Star,
  QrCode,
  Check,
  Zap,
  ArrowRight,
  Phone,
  Flame
} from 'lucide-react';

export const DesignSystemTest: React.FC = () => {
  const [activeScreenTab, setActiveScreenTab] = useState<"components" | "turf-detail" | "checkout" | "bookings">("components");
  const [toggleState, setToggleState] = useState<boolean>(true);
  const [checkboxState, setCheckboxState] = useState<boolean>(true);
  const [selectedRadio, setSelectedRadio] = useState<string>('momo');
  const [slotSelected, setSlotSelected] = useState<string>('18:00');
  const [inputValue, setInputValue] = useState<string>('Kampala Turf Arena');
  const [focusedInput, setFocusedInput] = useState<string>('+256 772 123 456');

  // Booking tab demo state
  const [bookingTab, setBookingTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  // Checkout step demo state
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1);

  return (
    <div className="min-h-screen bg-app-base text-text-primary p-3  font-body">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header & Screen Navigator */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-lime animate-pulse" />
              <span className="text-xs font-semibold text-primary-lime uppercase tracking-wider">
                Visual Inspection Suite
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary mt-1">
              Phase 1 & Phase 2 UI Gallery
            </h1>
          </div>
        </header>

        {/* SCREEN SELECTOR TABS */}
        <nav aria-label="Visual verification sections" className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveScreenTab("components")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeScreenTab === "components"
                ? "bg-primary-lime text-slate-950 shadow-xs"
                : "bg-surface-card border border-border-subtle text-text-secondary"
            }`}
          >
            1. UI Components (Default vs Focused)
          </button>
          <button
            onClick={() => setActiveScreenTab("turf-detail")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeScreenTab === "turf-detail"
                ? "bg-primary-lime text-slate-950 shadow-xs"
                : "bg-surface-card border border-border-subtle text-text-secondary"
            }`}
          >
            2. Pitch Detail (/turf/:id at 375px)
          </button>
          <button
            onClick={() => setActiveScreenTab("checkout")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeScreenTab === "checkout"
                ? "bg-primary-lime text-slate-950 shadow-xs"
                : "bg-surface-card border border-border-subtle text-text-secondary"
            }`}
          >
            3. Checkout Flow (4 Steps at 375px)
          </button>
          <button
            onClick={() => setActiveScreenTab("bookings")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeScreenTab === "bookings"
                ? "bg-primary-lime text-slate-950 shadow-xs"
                : "bg-surface-card border border-border-subtle text-text-secondary"
            }`}
          >
            4. Bookings Tabs (Upcoming / Completed / Cancelled)
          </button>
        </nav>

        {/* 1. UI COMPONENTS SHOWCASE (DEFAULT VS FOCUSED) */}
        {activeScreenTab === "components" && (
          <div className="space-y-6">
            {/* BUTTONS */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <h3 className="text-sm font-semibold text-text-primary">
                  Button Component (Default vs Hover & Focused Rings)
                </h3>
                <span className="text-[11px] text-primary-lime font-medium">
                  min 44px tap target
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <span className="text-xs text-text-secondary block font-medium">
                    Primary Button
                  </span>
                  <div className="space-y-2">
                    <Button variant="primary" fullWidth>
                      Default State
                    </Button>
                    <button className="w-full h-11 px-4 rounded-full bg-amber-400 text-slate-950 text-xs font-semibold ring-3 ring-primary-lime/50 shadow-sm flex items-center justify-center">
                      Focused / Active State
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-text-secondary block font-medium">
                    Secondary Button
                  </span>
                  <div className="space-y-2">
                    <Button variant="secondary" fullWidth>
                      Default State
                    </Button>
                    <button className="w-full h-11 px-4 rounded-full bg-slate-200 dark:bg-[#252834] text-text-primary text-xs font-semibold ring-3 ring-slate-400/40 dark:ring-white/20 shadow-sm flex items-center justify-center">
                      Focused / Active State
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-text-secondary block font-medium">
                    Outline Button
                  </span>
                  <div className="space-y-2">
                    <Button variant="outline" fullWidth>
                      Default State
                    </Button>
                    <button className="w-full h-11 px-4 rounded-full border border-primary-lime bg-primary-lime/10 text-primary-lime text-xs font-semibold ring-3 ring-primary-lime/30 flex items-center justify-center">
                      Focused / Active State
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-text-secondary block font-medium">
                    Danger Button
                  </span>
                  <div className="space-y-2">
                    <Button variant="danger" fullWidth>
                      Default State
                    </Button>
                    <button className="w-full h-11 px-4 rounded-full bg-red-600 text-white text-xs font-semibold ring-3 ring-red-500/40 flex items-center justify-center">
                      Focused / Active State
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* INPUTS & TOGGLES */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <h3 className="text-sm font-semibold text-text-primary">
                  Input & Toggle Components (Default vs Focused Ring & On/Off States)
                </h3>
                <span className="text-[11px] text-primary-lime font-medium">
                  h-11 (44px) inputs
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">
                    Input (Default State)
                  </label>
                  <Input 
                    icon={Search} 
                    placeholder="Search venue or location..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-primary-lime">
                    Input (Focused State with Amber Ring)
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-lime" />
                    <input
                      type="text"
                      value={focusedInput}
                      onChange={(e) => setFocusedInput(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-[12px] bg-surface-card border-2 border-primary-lime ring-3 ring-primary-lime/20 text-xs sm:text-sm text-text-primary font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border-subtle">
                <div className="space-y-2 p-3 rounded-[12px] bg-surface-card border border-border-subtle">
                  <span className="text-xs font-medium text-text-secondary block">
                    Toggle Switches (ON vs OFF & Focus)
                  </span>
                  <div className="flex items-center justify-between gap-4">
                    <Toggle 
                      checked={true} 
                      onChange={() => {}} 
                      label="SMS Updates (ON)" 
                    />
                    <Toggle 
                      checked={false} 
                      onChange={() => {}} 
                      label="Promo Alerts (OFF)" 
                    />
                  </div>
                </div>

                <div className="space-y-2 p-3 rounded-[12px] bg-surface-card border border-border-subtle">
                  <span className="text-xs font-medium text-text-secondary block">
                    Checkboxes & Radios (Checked & Focused)
                  </span>
                  <div className="flex items-center justify-between gap-4">
                    <Checkbox 
                      checked={checkboxState} 
                      onChange={setCheckboxState} 
                      label="Accept terms" 
                    />
                    <Radio 
                      name="sample-payment"
                      checked={true} 
                      onChange={() => {}} 
                      label="Mobile Money (Active)" 
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* BADGES & CARDS */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <h3 className="text-sm font-semibold text-text-primary">
                  Badges & Surface Cards Hierarchy
                </h3>
                <span className="text-[11px] text-primary-lime font-medium">
                  Sentence-case & WCAG AA contrast
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2.5 items-center">
                <Badge variant="available">● Available</Badge>
                <Badge variant="almost-full">● Almost full</Badge>
                <Badge variant="pending">Pending payment</Badge>
                <Badge variant="confirmed">Confirmed</Badge>
                <Badge variant="booked">Booked</Badge>
                <Badge variant="top-rated">★ 4.9 rating</Badge>
                <Badge variant="verified">Verified host</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-text-primary">Standard Flat Card (Surface 1)</h4>
                    <Badge variant="verified">Standard</Badge>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Flat background with hairline 1px border and 12px border radius.
                  </p>
                </Card>

                <Card accent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-primary-lime">Accent Card (Surface 2)</h4>
                    <Badge variant="almost-full">Active reservation</Badge>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Amber tinted border for prominent match fixtures and tickets.
                  </p>
                </Card>
              </div>
            </Card>
          </div>
        )}

        {/* 2. PITCH DETAIL SCREEN AT 375PX VIEWPORT */}
        {activeScreenTab === "turf-detail" && (
          <div className="flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-xs text-text-secondary font-medium">
                Showing uncropped Pitch Detail screen at 375px mobile viewport (/turf/pitch-lugogo-1)
              </span>
            </div>

            {/* 375px Device Container */}
            <div className="w-full max-w-[390px] rounded-[16px] border-4 border-zinc-700 bg-[#0e0f12] overflow-hidden shadow-2xl">
              {/* Mobile Hero Header */}
              <div className="relative h-56 bg-slate-800 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80"
                  alt="Lugogo AstroTurf Grounds"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-slate-950/80 text-primary-lime text-[10px] font-semibold border border-primary-lime/30">
                  Floodlit Arena
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold truncate">Lugogo AstroTurf Grounds</h2>
                    <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full text-primary-lime text-xs font-bold">
                      <Star size={11} className="fill-amber-400 text-primary-lime" />
                      <span>4.9</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-300 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-primary-lime" />
                    <span>Lugogo Bypass, Kampala</span>
                  </p>
                </div>
              </div>

              {/* Pitch Detail Content */}
              <div className="p-4 space-y-4">
                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-[12px] bg-slate-50 dark:bg-[#18191f] border border-border-subtle text-center">
                    <span className="text-[10px] text-text-secondary block">Format</span>
                    <span className="text-xs font-bold text-text-primary">11-a-side</span>
                  </div>
                  <div className="p-2.5 rounded-[12px] bg-slate-50 dark:bg-[#18191f] border border-border-subtle text-center">
                    <span className="text-[10px] text-text-secondary block">Surface</span>
                    <span className="text-xs font-bold text-text-primary">Artificial</span>
                  </div>
                  <div className="p-2.5 rounded-[12px] bg-slate-50 dark:bg-[#18191f] border border-border-subtle text-center">
                    <span className="text-[10px] text-text-secondary block">Lighting</span>
                    <span className="text-xs font-bold text-primary-lime">Night LED</span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider text-[10px]">
                    Ground Amenities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Changing rooms", "Parking", "Cafeteria", "Night floodlights", "Water station"].map((a) => (
                      <span key={a} className="px-2.5 py-1 rounded-full bg-surface-raised dark:bg-[#18191f] border border-border-subtle text-[11px] text-text-secondary">
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 7-Day Calendar Strip */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider text-[10px]">
                    Select Fixture Date
                  </span>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { day: "TODAY", date: "26", active: true },
                      { day: "THU", date: "27", active: false },
                      { day: "FRI", date: "28", active: false },
                      { day: "SAT", date: "29", active: false },
                      { day: "SUN", date: "30", active: false },
                    ].map((d) => (
                      <div
                        key={d.date}
                        className={`w-14 h-16 rounded-[12px] flex flex-col items-center justify-center shrink-0 border ${
                          d.active
                            ? "bg-primary-lime border-primary-lime text-slate-950 font-bold"
                            : "bg-slate-50 dark:bg-[#18191f] border-border-subtle text-text-secondary"
                        }`}
                      >
                        <span className="text-[9px] uppercase">{d.day}</span>
                        <span className="text-sm font-bold">{d.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hourly Slots Availability Grid */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider text-[10px]">
                      Time Slots
                    </span>
                    <span className="text-[10px] text-emerald-500 font-semibold">● 4 slots open</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-[10px] border border-primary-lime bg-primary-lime/15 text-text-primary flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold block">17:00 - 18:00</span>
                        <span className="text-[10px] text-primary-lime">UGX 120,000</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-primary-lime" />
                    </div>
                    <div className="p-2.5 rounded-[10px] border border-border-subtle bg-slate-50 dark:bg-[#18191f] text-text-secondary flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold block">18:00 - 19:00</span>
                        <span className="text-[10px] text-slate-400">UGX 120,000</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="p-2.5 rounded-[10px] border border-border-subtle bg-slate-50 dark:bg-[#18191f] text-text-secondary flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold block">19:00 - 20:00</span>
                        <span className="text-[10px] text-primary-lime">Floodlit night</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="p-2.5 rounded-[10px] border border-border-subtle bg-surface-raised dark:bg-[#14151a] opacity-50 text-slate-400 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold block line-through">20:00 - 21:00</span>
                        <span className="text-[10px]">Booked</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="p-3 bg-surface-card border-t border-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Rate per hour</span>
                  <span className="text-sm font-bold text-text-primary">UGX 120,000</span>
                </div>
                <button className="px-4 py-2.5 rounded-full bg-primary-lime hover:bg-[#96E600] text-slate-950 text-xs font-bold shadow-md">
                  Book Slot →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. CHECKOUT FLOW (4 STEPS AT 375PX) */}
        {activeScreenTab === "checkout" && (
          <div className="space-y-4">
            {/* Step Switcher Controls */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-semibold text-text-secondary">Step Preview:</span>
              {[
                { s: 1, label: "1. Slot & Duration" },
                { s: 2, label: "2. Contact Info" },
                { s: 3, label: "3. Mobile Money Payment" },
                { s: 4, label: "4. Confirmation Pass" },
              ].map((item) => (
                <button
                  key={item.s}
                  onClick={() => setCheckoutStep(item.s as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    checkoutStep === item.s
                      ? "bg-primary-lime text-slate-950 font-bold"
                      : "bg-surface-card border border-border-subtle text-text-secondary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-[390px] rounded-[16px] border-4 border-zinc-700 bg-[#0e0f12] overflow-hidden shadow-2xl p-4 space-y-4">
                {/* Header with Step indicator */}
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div>
                    <span className="text-[10px] text-primary-lime font-bold uppercase tracking-wider">
                      Checkout Step {checkoutStep} of 4
                    </span>
                    <h3 className="text-sm font-bold text-text-primary">
                      {checkoutStep === 1 && "Select Slot Duration"}
                      {checkoutStep === 2 && "Player Contact Details"}
                      {checkoutStep === 3 && "Payment Options"}
                      {checkoutStep === 4 && "Booking Confirmed!"}
                    </h3>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-primary-lime/20 text-primary-lime text-xs font-bold flex items-center justify-center">
                    {checkoutStep}
                  </span>
                </div>

                {/* STEP 1: SLOTS & DURATION */}
                {checkoutStep === 1 && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-[12px] bg-slate-50 dark:bg-[#18191f] border border-border-subtle space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-text-primary">Lugogo AstroTurf Grounds</span>
                        <span className="text-[10px] text-primary-lime font-semibold">17:00 - 18:00</span>
                      </div>
                      <span className="text-[11px] text-text-secondary block">Wed, Aug 26 · Pitch #1</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">Choose Duration</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["1 Hour", "1.5 Hours", "2 Hours"].map((d, i) => (
                          <div
                            key={d}
                            className={`p-2.5 rounded-[10px] text-center border text-xs font-bold cursor-pointer ${
                              i === 0
                                ? "bg-primary-lime border-primary-lime text-slate-950"
                                : "bg-slate-50 dark:bg-[#18191f] border-border-subtle text-text-secondary"
                            }`}
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-[12px] bg-slate-50 dark:bg-[#18191f] border border-border-subtle space-y-1.5 text-xs">
                      <div className="flex justify-between text-text-secondary">
                        <span>Pitch Fee (1 hr)</span>
                        <span>UGX 120,000</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>Service charge</span>
                        <span>UGX 0</span>
                      </div>
                      <div className="flex justify-between font-bold text-text-primary pt-1.5 border-t border-border-subtle">
                        <span>Total</span>
                        <span className="text-primary-lime">UGX 120,000</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setCheckoutStep(2)}
                      className="w-full h-11 rounded-full bg-primary-lime text-slate-950 text-xs font-bold shadow-sm"
                    >
                      Continue to Contact Details →
                    </button>
                  </div>
                )}

                {/* STEP 2: CONTACT DETAILS */}
                {checkoutStep === 2 && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">Captain / Player Name</label>
                      <Input placeholder="John Ssekandi" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">Mobile Number (for SMS & MoMo)</label>
                      <Input placeholder="+256 772 000 000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">Team / Squad Name (Optional)</label>
                      <Input placeholder="Kampala Strikers FC" />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setCheckoutStep(1)}
                        className="w-1/3 h-11 rounded-full border border-border-subtle text-xs font-semibold"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setCheckoutStep(3)}
                        className="w-2/3 h-11 rounded-full bg-primary-lime text-slate-950 text-xs font-bold"
                      >
                        Proceed to Payment →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: PAYMENT */}
                {checkoutStep === 3 && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-text-secondary">Payment Gateway</label>
                      <div className="p-3 rounded-[12px] border border-primary-lime bg-primary-lime/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-lime text-slate-950 font-bold flex items-center justify-center text-xs">
                            MTN
                          </div>
                          <div>
                            <span className="text-xs font-bold text-text-primary block">MTN Mobile Money</span>
                            <span className="text-[10px] text-text-secondary">Instant prompt on +256 772 000 000</span>
                          </div>
                        </div>
                        <span className="w-4 h-4 rounded-full bg-primary-lime flex items-center justify-center text-slate-950 text-[10px] font-bold">✓</span>
                      </div>

                      <div className="p-3 rounded-[12px] border border-border-subtle bg-slate-50 dark:bg-[#18191f] flex items-center justify-between opacity-70">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs">
                            AIR
                          </div>
                          <div>
                            <span className="text-xs font-bold text-text-primary block">Airtel Money</span>
                            <span className="text-[10px] text-text-secondary">Airtel instant push USSD</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-[12px] bg-primary-lime/10 border border-primary-lime/20 text-[11px] text-amber-700 dark:text-amber-300">
                      ⚡ You will receive a prompt on your phone to enter your PIN and approve UGX 120,000.
                    </div>

                    <button
                      onClick={() => setCheckoutStep(4)}
                      className="w-full h-11 rounded-full bg-primary-lime text-slate-950 text-xs font-bold shadow-md"
                    >
                      Pay UGX 120,000 & Confirm →
                    </button>
                  </div>
                )}

                {/* STEP 4: CONFIRMATION */}
                {checkoutStep === 4 && (
                  <div className="space-y-4 text-center py-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                      <Check size={24} strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Booking Confirmed!</h4>
                      <p className="text-xs text-text-secondary mt-0.5">Lugogo AstroTurf Grounds · Slot #1</p>
                    </div>

                    {/* Match Pass QR */}
                    <div className="p-4 rounded-[16px] bg-slate-50 dark:bg-[#18191f] border border-border-subtle space-y-2.5">
                      <div className="w-24 h-24 bg-white p-2 rounded-[10px] mx-auto flex items-center justify-center shadow-xs">
                        <QrCode size={80} className="text-slate-950" />
                      </div>
                      <span className="text-[10px] font-mono text-text-secondary block">PASS #FTL-948204</span>
                      <span className="text-xs font-bold text-primary-lime block">Wed, Aug 26 · 17:00 - 18:00</span>
                    </div>

                    <button
                      onClick={() => setActiveScreenTab("bookings")}
                      className="w-full h-11 rounded-full bg-primary-lime text-accent-text text-xs font-bold"
                    >
                      View in My Bookings
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. BOOKINGS SCREEN (3 TAB STATES AT 375PX) */}
        {activeScreenTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-semibold text-text-secondary">Tab State Preview:</span>
              {[
                { t: "upcoming", label: "Upcoming (Active Pass)" },
                { t: "completed", label: "Completed (Past Matches)" },
                { t: "cancelled", label: "Cancelled (Refunded)" },
              ].map((item) => (
                <button
                  key={item.t}
                  onClick={() => setBookingTab(item.t as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    bookingTab === item.t
                      ? "bg-primary-lime text-slate-950 font-bold"
                      : "bg-surface-card border border-border-subtle text-text-secondary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-[390px] rounded-[16px] border-4 border-zinc-700 bg-[#0e0f12] overflow-hidden shadow-2xl p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-text-primary">My Bookings</h3>
                  <Badge variant="verified">2 Passes</Badge>
                </div>

                {/* Tab Strip */}
                <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-[#18191f]">
                  {["upcoming", "completed", "cancelled"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setBookingTab(t as any)}
                      className={`py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                        bookingTab === t
                          ? "bg-[#252834] text-text-primary shadow-xs"
                          : "text-text-secondary"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* TAB 1: UPCOMING */}
                {bookingTab === "upcoming" && (
                  <div className="space-y-3">
                    <article className="rounded-[16px] bg-slate-50 dark:bg-[#18191f] border border-primary-lime/30 p-3.5 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <Badge variant="confirmed">Confirmed Pass</Badge>
                          <h4 className="text-xs font-bold text-text-primary mt-1">
                            Lugogo AstroTurf Grounds
                          </h4>
                          <span className="text-[10px] text-text-secondary">
                            Wed, Aug 26 · 17:00 - 18:00
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-[10px] bg-white p-1 flex items-center justify-center">
                          <QrCode size={32} className="text-slate-950" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px]">
                        <span className="font-bold text-primary-lime">UGX 120,000 Paid</span>
                        <button className="px-3 py-1 rounded-full bg-primary-lime text-slate-950 font-bold text-[10px]">
                          View Pass
                        </button>
                      </div>
                    </article>
                  </div>
                )}

                {/* TAB 2: COMPLETED */}
                {bookingTab === "completed" && (
                  <div className="space-y-3">
                    <article className="rounded-[16px] bg-slate-50 dark:bg-[#18191f] border border-border-subtle p-3.5 space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="booked">Played Match</Badge>
                        <span className="text-[10px] text-slate-400">Aug 20, 2026</span>
                      </div>
                      <h4 className="text-xs font-bold text-text-primary">
                        Kansanga Football Arena
                      </h4>
                      <p className="text-[11px] text-text-secondary">7-a-side match · 18:00 - 19:00</p>
                      <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                        <div className="flex text-primary-lime">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={11} className="fill-amber-400" />
                          ))}
                        </div>
                        <button className="text-[11px] font-bold text-primary-lime">Rebook Ground →</button>
                      </div>
                    </article>
                  </div>
                )}

                {/* TAB 3: CANCELLED */}
                {bookingTab === "cancelled" && (
                  <div className="space-y-3">
                    <article className="rounded-[16px] bg-slate-50 dark:bg-[#18191f] border border-red-500/20 p-3.5 space-y-2 opacity-80">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[10px] font-bold">
                          Cancelled & Refunded
                        </span>
                        <span className="text-[10px] text-slate-400">Aug 14, 2026</span>
                      </div>
                      <h4 className="text-xs font-bold text-text-primary">
                        Naguru Floodlit Turf Pitch
                      </h4>
                      <p className="text-[10px] text-text-secondary">Refund of UGX 65,000 processed to MTN MoMo</p>
                    </article>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

