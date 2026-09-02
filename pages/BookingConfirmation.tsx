import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useBooking } from "../context/BookingContext";
import { bookingService } from "../services/bookingService";
import { pitchService } from "../services/pitchService";
import { Turf } from "../types";
import { Check, ShieldCheck, CheckCircle2, ChevronLeft, Loader2, ArrowRight } from "lucide-react";

export const BookingConfirmation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings } = useBooking();
  
  const [booking, setBooking] = useState<any | null>(null);
  const [turf, setTurf] = useState<Turf | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        let foundBooking: any = bookings.find(b => b.id === id) || null;
        if (!foundBooking) {
          foundBooking = await bookingService.getById(id);
        }
        
        if (foundBooking) {
          setBooking(foundBooking);
          const foundTurf = await pitchService.getById((foundBooking as any).pitchId || foundBooking.turfId);
          setTurf(foundTurf as any);
        }
      } catch (error) {
        console.error("Failed to load booking details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [id, bookings]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-app-base flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-lime animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!booking || !turf) {
    return (
      <Layout>
        <div className="min-h-screen bg-app-base flex flex-col items-center justify-center p-4">
          <p className="text-white text-lg font-bold mb-4">Booking not found</p>
          <button onClick={() => navigate('/bookings')} className="text-primary-lime underline">Go back to Bookings</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[100dvh] bg-app-base text-white flex flex-col">
        {/* Navigation Header */}
        <div className="sticky top-0 z-50 bg-app-base/90 backdrop-blur-md border-b border-border-subtle p-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/bookings')}
            className="w-10 h-10 rounded-full bg-[#18181A] flex items-center justify-center text-white hover:bg-surface-raised transition-colors border border-border-subtle"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-sm">Pass</span>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary-lime/20 flex items-center justify-center mb-6">
              <Check size={40} className="text-primary-lime" strokeWidth={3} />
            </div>
            
            <h2 className="text-2xl font-extrabold text-white mb-2">Match Locked In</h2>
            <p className="text-text-secondary text-sm mb-8 max-w-xs">
              Your slot at <strong className="text-white">{turf.name}</strong> has been secured.
            </p>
            
            <div className="w-full bg-[#18181A] rounded-[24px] p-6 border border-border-subtle text-left relative overflow-hidden mb-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-white">
                  <ShieldCheck size={18} className="text-primary-lime" />
                  <span className="font-bold">Official Pitch Pass</span>
                </div>
                <div className="bg-border-subtle text-text-secondary text-[10px] font-bold px-2 py-1 rounded uppercase">
                  {booking.status}
                </div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div>
                  <p className="text-text-secondary text-[11px] uppercase tracking-wider font-bold mb-1">Date</p>
                  <p className="text-white font-bold text-base">
                    {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary text-[11px] uppercase tracking-wider font-bold mb-1">Time</p>
                  <p className="text-white font-bold text-base">
                    {(booking.slots && booking.slots.length > 0 ? booking.slots[0] : booking.time)} - {parseInt(((booking.slots && booking.slots.length > 0 ? booking.slots[booking.slots.length - 1] : booking.time) || "0").split(":")[0]) + 1}:00
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary text-[11px] uppercase tracking-wider font-bold mb-1">Total Paid</p>
                  <p className="text-primary-lime font-bold text-base">UGX {((booking as any).totalPrice || booking.price || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none">
                <CheckCircle2 size={160} />
              </div>
            </div>
            
            <button
              onClick={() => navigate('/bookings')}
              className="w-full h-14 bg-[#18181A] hover:bg-surface-raised border border-border-subtle text-white rounded-xl flex items-center justify-center transition-all active:scale-[0.98] font-bold tracking-wide"
            >
              View My Bookings
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
