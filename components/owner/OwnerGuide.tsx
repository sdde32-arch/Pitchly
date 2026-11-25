import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, HelpCircle } from "lucide-react";

interface GuideLesson {
  id: string;
  title: string;
  goal: string;
  steps: string[];
  goodToKnow?: string;
}

const OWNER_GUIDE_LESSONS: GuideLesson[] = [
  {
    id: "add-your-pitch",
    title: "Add your pitch",
    goal: "Prepare your details and submit your pitch for review.",
    steps: [
      "Have ready your pitch name, a contact phone number, the pitch location pinned on the map, your hourly rate in UGX and deposit percentage (10% to 100%), the match formats you offer and your opening and closing hours, a cover photo of your pitch, and your Mobile Money number and the name it is registered under.",
      "Tap Add your pitch on Today, or tap New Pitch at the top of your dashboard.",
      "Fill in your pitch details and submit them for administrator review.",
    ],
    goodToKnow: "Players pay the Mobile Money number you enter directly.",
  },
  {
    id: "after-you-submit",
    title: "After you submit",
    goal: "Track your pitch status until players can book it.",
    steps: [
      "Open Facilities to see your pitch listed as Pending Review while an administrator checks your details.",
      "When approved, the status changes to Verified & Active and players can find and book your pitch.",
      "If Pitchly asks for edits or declines the listing, the status shows Action Required with the reason Pitchly gave.",
    ],
    goodToKnow: "You also receive an in-app notification when your pitch status changes.",
  },
  {
    id: "your-today-board",
    title: "Your Today board",
    goal: "Read every hour's status on your daily schedule.",
    steps: [
      "FREE means the hour is open to tap for a walk-in or to close, BEING BOOKED means someone is booking this now, and BOOKED means a confirmed booking.",
      "BLOCKED marks a walk-in or closed slot, WAITING FOR YOUR OK marks a payment sent or unpaid hold to review, and PROBLEM marks a payment problem being checked.",
      "Use the Sound toggle at the top of Today if you want a chime when new waiting bookings arrive while Pitchly is open.",
    ],
  },
  {
    id: "confirm-or-decline",
    title: "Confirm or decline a payment",
    goal: "Review a waiting booking and confirm or cancel it.",
    steps: [
      "Find the slot marked WAITING FOR YOUR OK on Today and check the payment code or tap See proof to view the player's receipt.",
      "Check your own Mobile Money balance, then tap Confirm to lock in the booking and notify the player.",
      "Tap Decline, then tap Yes, cancel to cancel the booking without entering a reason and notify the player.",
    ],
    goodToKnow: "The Today decline sheet does not ask for a reason; it saves a default decline note and alerts the player.",
  },
  {
    id: "walk-ins-and-closed-hours",
    title: "Walk-ins and closed hours",
    goal: "Block an open hour for a walk-in customer or maintenance.",
    steps: [
      "Tap any FREE hour on Today to open the slot action sheet.",
      "Tap Booked by phone or walk-in, enter the customer's name and optional phone number, and tap Save booking to block that hour for players.",
      "Tap Close this slot (maintenance), add an optional short note, and tap Close slot to keep players from booking it.",
    ],
    goodToKnow: "To release a blocked hour later, tap Open this slot again and confirm with Yes, open slot.",
  },
  {
    id: "deposits-and-unpaid-holds",
    title: "Deposits and unpaid holds",
    goal: "Control how much players pay up front and whether unpaid holds are allowed.",
    steps: [
      "Set your Advance Deposit Requirement (%) between 10% and 100% when adding or editing a pitch so players pay that share to secure their slot.",
      "Turn Allow unpaid reservations (pay at the pitch) on or off depending on whether players can reserve a slot with zero deposit.",
      "A player can hold at most 1 open unpaid reservation at a time, another player paying a deposit can take that slot over, and an unpaid hold expires at kickoff.",
    ],
    goodToKnow: "Changing deposit percentage or Allow unpaid reservations (pay at the pitch) does not send an approved pitch back for review.",
  },
  {
    id: "unconfirmed-payments",
    title: "Unconfirmed payments",
    goal: "Understand the deadline to confirm submitted payments.",
    steps: [
      "For a booking with submitted payment proof, confirm at least 1 hour before kickoff or the booking is cancelled when the cutoff passes.",
      "If the player submitted payment proof 1 hour or less before kickoff, the confirmation cutoff extends to kickoff itself.",
      "Because this cutoff check runs when you or the player open Pitchly, confirm waiting bookings promptly so slots stay accurate.",
    ],
  },
  {
    id: "messages-and-staff",
    title: "Messages and staff",
    goal: "Reply to player questions and keep a roster of your venue staff.",
    steps: [
      "Players can message you from your pitch page using Message Host or Message manager, and their chats appear in your Messages tab.",
      "Open Messages from the dashboard tabs or the mobile More menu to read and reply to player chats.",
      "The Staff tab stores a list of your staff's names, phone numbers, and roles for quick calling.",
    ],
    goodToKnow: "Adding someone in the Staff tab only saves their contact details on your account and does not create separate logins.",
  },
];

export const OwnerGuide: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section
      role="region"
      aria-label="Owner guide"
      className="w-full max-w-3xl mx-auto space-y-4 font-sans"
    >
      {/* Intro Card */}
      <div className="rounded-2xl bg-surface-card border border-border-subtle p-4 sm:p-5 space-y-2">
        <p className="text-sm sm:text-base font-bold text-text-primary">
          Short lessons for running your pitch on Pitchly.
        </p>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          Keep Pitchly open on match days. You only hear about new bookings while it is open.
        </p>
      </div>

      {/* Lessons List */}
      <div className="space-y-2.5">
        {OWNER_GUIDE_LESSONS.map((lesson, index) => (
          <details
            key={lesson.id}
            className="group rounded-2xl bg-surface-card border border-border-subtle overflow-hidden"
          >
            <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-3 px-4 py-3.5 min-h-[44px] hover:bg-surface-raised transition-colors motion-reduce:transition-none">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  aria-hidden="true"
                  className="w-7 h-7 rounded-lg bg-status-success-tint text-status-success border border-status-success/30 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 tabular-nums"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-extrabold text-text-primary leading-snug">
                    {lesson.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary mt-0.5 leading-snug">
                    {lesson.goal}
                  </p>
                </div>
              </div>
              <ChevronDown
                size={18}
                aria-hidden="true"
                className="text-text-secondary shrink-0 transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
              />
            </summary>

            <div className="px-4 pb-4 pt-3 border-t border-border-subtle bg-surface-raised space-y-3">
              <ol className="space-y-2 text-xs sm:text-sm text-text-primary leading-relaxed list-decimal list-inside">
                {lesson.steps.map((step, stepIndex) => (
                  <li key={stepIndex}>{step}</li>
                ))}
              </ol>

              {lesson.goodToKnow && (
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pt-2 border-t border-border-subtle">
                  <span className="font-bold text-text-primary">Good to know: </span>
                  {lesson.goodToKnow}
                </p>
              )}
            </div>
          </details>
        ))}
      </div>

      {/* Final Need Help Card */}
      <div className="rounded-2xl bg-surface-card border border-border-subtle p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm sm:text-base font-extrabold text-text-primary">
            Need help?
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Contact Pitchly support if you need help with your pitch or bookings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/support")}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-cta-bg hover:bg-cta-bg-hover text-cta-text text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shrink-0 transition-colors motion-reduce:transition-none cursor-pointer"
        >
          <HelpCircle size={16} aria-hidden="true" />
          <span>Contact support</span>
        </button>
      </div>
    </section>
  );
};

export default OwnerGuide;
