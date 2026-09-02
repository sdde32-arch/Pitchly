const fs = require('fs');

let content = fs.readFileSync('pages/TurfDetail.tsx', 'utf8');

const startMarker = '{/* Time Slots 3-Column Content Matrix */}';
const endMarker = '{/* Sticky Bottom Summary Bar with Total Price + Confirm Booking CTA */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found");
    process.exit(1);
}

const replacement = `{/* Time Slots Vertical List */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-surface-card">
                {hasError ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl">
                    <AlertCircle className="text-[#EF4444]" size={28} />
                    <h4 className="text-sm font-bold text-[#EF4444]">
                      Couldn't load current availability — please refresh before booking.
                    </h4>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-[#EF4444] text-white rounded-xl text-xs font-bold"
                    >
                      Refresh Page
                    </button>
                  </div>
                ) : loadingBookings ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary justify-center pt-8">
                      <Loader2 className="animate-spin text-primary-lime" size={14} />
                      <span>Fetching real-time slots...</span>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-4 rounded-xl bg-surface-raised h-[88px]" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timesList.map((time) => {
                      const status = getSlotStatus(time);
                      const isSelected = selectedTimes.includes(time);
                      const isPassed = isSlotPassed(time, selectedDate);
                      const isBooked = status === 'booked' || status === 'blocked';
                      const isHeld = status === 'held';
                      const isDisabled = hasError || isBooked || isHeld || isPassed;
                      const startHour = time;
                      const endHourNum = parseInt(time.split(':')[0]) + 1;
                      const endHour = \`\${String(endHourNum).padStart(2, '0')}:00\`;
                      
                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSlotClick(time)}
                          className={\`w-full flex flex-col justify-between p-4 rounded-2xl transition-all text-left min-h-[88px] cursor-pointer \${
                            isSelected
                              ? "bg-primary-lime text-accent-text shadow-[0_0_20px_rgba(168,255,0,0.15)] font-bold"
                              : isDisabled
                                ? "bg-surface-card/40 text-[#71717A] cursor-not-allowed opacity-50"
                                : "bg-surface-raised text-text-primary border border-border-subtle"
                          }\`}
                        >
                          <div className="flex items-center justify-between w-full mb-3">
                            <span className="text-[17px] font-bold">
                              {startHour} - {endHour}
                            </span>
                            <div className={\`flex items-center justify-center shrink-0 \${
                              isSelected
                                ? "w-6 h-6 rounded-full bg-app-base text-primary-lime"
                                : isDisabled
                                  ? "text-[#71717A]"
                                  : "text-text-secondary"
                            }\`}>
                              {isSelected ? <Check size={14} strokeWidth={3} /> : isDisabled ? <Lock size={16} /> : <Clock size={16} />}
                            </div>
                          </div>
                          <div className="flex items-center justify-between w-full text-xs">
                            <span className={\`text-[11px] font-bold uppercase tracking-wider \${
                              isSelected ? "text-accent-text/80" : "text-text-secondary"
                            }\`}>
                              {isBooked ? "Reserved" : isPassed ? "Passed" : isHeld ? "In Cart" : "Available"}
                            </span>
                            <span className={\`text-[13px] font-bold \${isSelected ? "text-accent-text" : "text-text-primary"}\`}>
                              UGX {(turf.pricePerHour / 1000).toFixed(0)}k
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sticky Confirmation Bar */}
              <div className="p-4 bg-surface-card flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-border-subtle">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">
                    {selectedTimes.length} {selectedTimes.length === 1 ? "HOUR SELECTED" : "HOURS SELECTED"}
                  </div>
                  <div className="text-xl font-bold text-text-primary">
                    UGX {(selectedTimes.length * turf.pricePerHour).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimeframeModalOpen(false);
                    const sortedTimes = [...selectedTimes].sort((a, b) => timesList.indexOf(a) - timesList.indexOf(b));
                    navigate(\`/checkout/\${id}?date=\${selectedDate}&times=\${sortedTimes.join(',')}\`);
                  }}
                  disabled={selectedTimes.length === 0}
                  className="px-6 py-3.5 bg-primary-lime hover:bg-[#96E600] disabled:opacity-50 disabled:bg-surface-raised disabled:text-[#71717A] text-accent-text font-bold text-[13px] tracking-wider uppercase rounded-full transition-all cursor-pointer"
                >
                  CONFIRM SLOTS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      `;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync('pages/TurfDetail.tsx', newContent, 'utf8');
console.log("Updated TurfDetail modal layout");
