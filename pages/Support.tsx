import React, { useState } from "react";
import { Layout } from "../components/Layout";
import {
  ChevronDown,
  MessageSquare,
  Send,
  ArrowLeft,
  Book,
  Info,
  CheckCircle,
  Phone,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
export const Support: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [message, setMessage] = useState("");
  const FAQs = [
    {
      q: "How do I cancel a booking?",
      a: "Go to the 'Bookings' tab, select the booking you wish to cancel, and tap 'Cancel Booking'. Please note our cancellation policy applies.",
    },
    {
      q: "How do I pay for my booking?",
      a: "You can pay via Mobile Money (MTN/Airtel) directly in the app during checkout, or choose 'Pay at Venue' if the turf allows it.",
    },
    {
      q: "Can I invite players to my squad?",
      a: "Yes! Go to 'Squad Finder' or 'Teams', create a squad, and you can invite players using their phone number or Player ID.",
    },
    {
      q: "What happens if it rains?",
      a: "Most turfs have their own rain policies. Generally, if the pitch is unplayable, you can reschedule your booking at no extra cost. Contact the turf owner directly for specifics.",
    },
  ];
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSent(true);
    setMessage("");
    setTimeout(() => setIsSent(false), 3000);
  };
  return (
    <Layout>
      <div className="min-h-[100dvh] bg-app-base pb-32 font-body text-text-primary">
        {/* Header */}
        <div className="bg-surface-card p-4 border-b border-border-subtle mb-8 sticky top-0 z-50">
          <div className="max-w-xl mx-auto flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 w-10 h-10 flex items-center justify-center bg-surface-raised rounded-full text-text-primary hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-medium text-text-primary">
                Support
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                How can we help?
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-xl mx-auto space-y-6">
          {/* Contact Cards */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href="tel:+256700000000"
              className="bg-surface-card p-4 rounded-[16px] border border-border-subtle shadow-sm flex flex-col items-center justify-center text-center hover:border-primary-lime/50 transition-colors active:scale-95 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-amber-50 dark:bg-primary-lime/10 text-amber-600 dark:text-primary-lime rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Phone size={24} />
              </div>
              <h3 className="font-medium text-text-primary mb-1">Call Us</h3>
              <p className="text-[11px] text-text-secondary">
                Mon-Fri, 8am-8pm
              </p>
            </a>
            <a
              href="mailto:support@pitchly.com"
              className="bg-surface-card p-4 rounded-[16px] border border-border-subtle shadow-sm flex flex-col items-center justify-center text-center hover:border-primary-lime/50 transition-colors active:scale-95 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <h3 className="font-medium text-text-primary mb-1">Email Us</h3>
              <p className="text-[11px] text-text-secondary">
                24/7 Support
              </p>
            </a>
          </div>

          {/* FAQ Section */}
          <div className="bg-surface-card rounded-[16px] border border-border-subtle overflow-hidden shadow-sm">
            <div className="p-4  border-b border-border-subtle flex items-center gap-3">
              <Book className="text-primary-lime" size={20} />
              <h2 className="text-sm font-medium text-text-primary">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {FAQs.map((faq, index) => (
                <div key={index} className="px-2 py-1">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full min-h-[48px] flex items-center justify-between p-4 text-left hover:bg-surface-raised/50 rounded-[12px] transition-colors cursor-pointer"
                  >
                    <span className="font-medium text-text-primary pr-4 text-xs sm:text-sm">
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-300 ${openFaq === index ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? "max-h-40 opacity-100 pb-4" : "max-h-0 opacity-0"}`}
                  >
                    <p className="px-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-surface-card rounded-[16px] border border-border-subtle p-4  shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="text-primary-lime" size={20} />
              <h2 className="text-sm font-medium text-text-primary">
                Send a Message
              </h2>
            </div>
            {isSent ? (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-[16px] p-4 flex flex-col items-center justify-center text-center animate-fadeIn">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={24} />
                </div>
                <h3 className="text-sm font-medium text-text-primary mb-2">
                  Message Sent!
                </h3>
                <p className="text-xs text-text-secondary">
                  We'll get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-text-secondary block mb-2">
                    How can we help?
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or ask a question..."
                    className="w-full bg-surface-raised border border-border-subtle focus:border-primary-lime rounded-[16px] p-4 text-xs sm:text-sm text-text-primary outline-none transition-all resize-none placeholder-slate-400"
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="w-full bg-primary-lime text-accent-text min-h-[48px] py-3 rounded-full font-bold shadow-sm shadow-primary-lime/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none cursor-pointer"
                >
                  <Send size={16} /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
