import React from "react";
type BookingStatus = "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "NO_SHOW";
interface Booking {
  id: string;
  customer: string;
  date: string;
  time: string;
  amount: string;
  status: BookingStatus;
}
const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1",
    customer: "Alex Johnson",
    date: "Mar 12, 2024",
    time: "18:00 - 19:00",
    amount: "UGX 35,000",
    status: "CONFIRMED",
  },
  {
    id: "2",
    customer: "Sarah Williams",
    date: "Mar 12, 2024",
    time: "19:00 - 20:30",
    amount: "UGX 52,500",
    status: "CHECKED_IN",
  },
  {
    id: "3",
    customer: "Michael Brown",
    date: "Mar 11, 2024",
    time: "17:00 - 18:00",
    amount: "UGX 35,000",
    status: "COMPLETED",
  },
  {
    id: "4",
    customer: "Emily Davis",
    date: "Mar 11, 2024",
    time: "20:00 - 21:00",
    amount: "UGX 35,000",
    status: "NO_SHOW",
  },
  {
    id: "5",
    customer: "Chris Wilson",
    date: "Mar 13, 2024",
    time: "16:00 - 17:30",
    amount: "UGX 52,500",
    status: "CONFIRMED",
  },
];
const StatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
  const styles = {
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CHECKED_IN: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-surface-raised text-slate-700 border-border-subtle",
    NO_SHOW: "bg-rose-50 text-rose-700 border-rose-200",
  };
  const labels = {
    CONFIRMED: "Confirmed",
    CHECKED_IN: "Checked In",
    COMPLETED: "Completed",
    NO_SHOW: "No Show",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {" "}
      {labels[status]}{" "}
    </span>
  );
};
export const UpcomingBookings: React.FC = () => {
  return (
    <div className="rounded-[12px] border border-border-subtle bg-surface-card shadow-sm">
      {" "}
      <div className="border-b border-border-subtle px-4 py-4">
        {" "}
        <h3 className="text-sm font-semibold text-text-primary">
          {" "}
          Recent Bookings{" "}
        </h3>{" "}
        <p className="text-xs text-muted">
          {" "}
          Latest activity from your customers{" "}
        </p>{" "}
      </div>{" "}
      <div className="overflow-x-auto">
        {" "}
        <table className="w-full text-left text-sm">
          {" "}
          <thead className="bg-slate-50 text-muted">
            {" "}
            <tr>
              {" "}
              <th className="px-4 py-3 font-medium">Customer</th>{" "}
              <th className="px-4 py-3 font-medium">Date</th>{" "}
              <th className="px-4 py-3 font-medium">Time</th>{" "}
              <th className="px-4 py-3 font-medium">Amount</th>{" "}
              <th className="px-4 py-3 font-medium">Status</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-200">
            {" "}
            {MOCK_BOOKINGS.map((booking) => (
              <tr key={booking.id} className="hover:bg-surface-raised/50">
                {" "}
                <td className="whitespace-nowrap px-4 py-4 font-medium text-text-primary">
                  {" "}
                  {booking.customer}{" "}
                </td>{" "}
                <td className="whitespace-nowrap px-4 py-4 text-muted">
                  {" "}
                  {booking.date}{" "}
                </td>{" "}
                <td className="whitespace-nowrap px-4 py-4 text-muted">
                  {" "}
                  {booking.time}{" "}
                </td>{" "}
                <td className="whitespace-nowrap px-4 py-4 text-muted">
                  {" "}
                  {booking.amount}{" "}
                </td>{" "}
                <td className="whitespace-nowrap px-4 py-4">
                  {" "}
                  <StatusBadge status={booking.status} />{" "}
                </td>{" "}
              </tr>
            ))}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>
  );
};
