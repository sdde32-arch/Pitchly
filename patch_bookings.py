with open('pages/Bookings.tsx', 'r') as f:
    content = f.read()

# Locate the mapping part
start_marker = '              filteredBookings.map((b) => ('
end_marker = '                  {/* Expandable Report Selection Menu */}'
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_card_content = """              filteredBookings.map((b) => (
                <div key={b.id} className="bg-[#161616] rounded-2xl p-4 border border-[#262626] space-y-4 hover:border-[#383838] transition-all">
                  <div className="flex justify-between items-start pb-3 border-b border-[#262626]">
                    <div>
                      <p className="text-[#F4F4F5] font-bold text-sm">
                        {new Date(b.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </p>
                      <p className="text-[#A1A1AA] text-xs font-medium mt-0.5">{b.time}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <p className="text-[#F4F4F5] font-black text-sm">
                        UGX {(b.totalPrice || b.price || 0).toLocaleString()}
                      </p>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                        b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CHECKED_IN
                          ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30"
                          : b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED || b.status === BookingStatus.NO_SHOW
                            ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                            : "bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30"
                      }`}>
                        {b.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#262626]">
                      <img 
                        src={(b as any).image || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80"} 
                        alt="Pitch"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-[#F4F4F5] font-bold text-[15px] leading-tight truncate">
                        {b.pitchName || b.turfName || "Football Pitch"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[#A1A1AA] text-[13px] font-medium mt-1 truncate">
                        <MapPin size={14} className="text-[#71717A] shrink-0" />
                        <span className="truncate">{(b as any).location || "Kampala, Uganda"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#262626] flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setActiveReportMenu(activeReportMenu === b.id ? null : b.id)}
                      className="px-3 py-2 rounded-xl bg-[#202020] hover:bg-[#262626] border border-[#262626] text-[#A1A1AA] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer mr-auto"
                    >
                      <ShieldAlert size={14} />
                      Report
                    </button>
                    {activeTab === "upcoming" && (
                      <>
                        <button
                          className="px-3 py-2 rounded-xl bg-[#202020] hover:bg-[#EF4444]/20 hover:text-[#EF4444] border border-[#262626] text-[#A1A1AA] text-xs font-bold transition-colors cursor-pointer"
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to cancel this booking? This will make the slot available for other players.")) {
                              try {
                                await updateBookingStatus(b.id, BookingStatus.CANCELLED);
                                alert("Booking successfully cancelled.");
                              } catch (err) {
                                console.error("Error cancelling booking", err);
                                alert("Failed to cancel booking.");
                              }
                            }
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 rounded-xl bg-[#A8FF00] hover:bg-[#96E600] text-[#0D0D0D] text-xs font-bold transition-all cursor-pointer"
                          onClick={() => navigate(`/booking-confirmation/${b.id}`)}
                        >
                          View Pass
                        </button>
                      </>
                    )}
                    {activeTab === "completed" && (
                      <button 
                        onClick={() => navigate(`/match-summary/${b.id}`)}
                        className="px-4 py-2 rounded-xl bg-[#A8FF00] hover:bg-[#96E600] text-[#0D0D0D] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        id={`match-summary-btn-${b.id}`}
                      >
                        <Trophy size={14} />
                        Summary
                      </button>
                    )}
                    {activeTab === "cancelled" && (
                      <button 
                        className="px-4 py-2 rounded-xl bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to permanently delete this booking record?")) {
                            try {
                              await removeBooking(b.id);
                              alert("Booking record deleted successfully.");
                            } catch (err) {
                              console.error("Error deleting booking", err);
                              alert("Failed to delete booking.");
                            }
                          }
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>

"""
    new_content = content[:start_idx] + new_card_content + content[end_idx:]
    with open('pages/Bookings.tsx', 'w') as f:
        f.write(new_content)
    print("Patched pages/Bookings.tsx")
else:
    print("Could not find boundaries")
