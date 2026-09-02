import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

original_step1 = """                {modalStep === 1 && (
                  <div className="space-y-3 pb-32">
                    {timesList.map((time) => {
                      const status = getSlotStatus(time);
                      const isSelected = selectedTimes.includes(time);
                      const isPassed = isSlotPassed(time, selectedDate);
                      const isBooked = status === 'booked' || status === 'blocked';
                      const isHeld = status === 'held';
                      const isDisabled = hasError || isBooked || isHeld || isPassed;
                      const endHourNum = parseInt(time.split(':')[0]) + 1;
                      const endHour = `${String(endHourNum).padStart(2, '0')}:00`;

                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSlotClick(time)}
                          className={`w-full flex items-center justify-between p-5 rounded-[24px] transition-all text-left ${
                            isSelected
                              ? "bg-[#A8FF00] text-[#0D0D0D]"
                              : isDisabled
                                ? "bg-[#18181A]/50 text-[#71717A] cursor-not-allowed"
                                : "bg-[#18181A] text-white"
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-[19px] font-extrabold tracking-tight">
                              {time} - {endHour}
                            </span>
                            <div className="flex items-center gap-6">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                isSelected ? "text-[#0D0D0D]/70" : "text-[#A1A1AA]"
                              }`}>
                                {isBooked ? "Reserved" : isPassed ? "Passed" : isHeld ? "In Cart" : "Available"}
                              </span>
                              {!isDisabled && (
                                <span className={`text-xs font-bold ${isSelected ? "text-[#0D0D0D]" : "text-white"}`}>
                                  UGX {(turf.pricePerHour / 1000).toFixed(0)}k
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-[#0D0D0D] text-[#A8FF00]" : "bg-transparent text-[#A1A1AA]"
                          }`}>
                            {isSelected ? <Check size={16} strokeWidth={3} /> : isDisabled ? <Lock size={16} /> : <Clock size={16} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}"""

new_step1 = """                {modalStep === 1 && (
                  <div className="grid grid-cols-2 gap-3 pb-32">
                    {timesList.map((time) => {
                      const status = getSlotStatus(time);
                      const isSelected = selectedTimes.includes(time);
                      const isPassed = isSlotPassed(time, selectedDate);
                      const isBooked = status === 'booked' || status === 'blocked';
                      const isHeld = status === 'held';
                      const isDisabled = hasError || isBooked || isHeld || isPassed;
                      const endHourNum = parseInt(time.split(':')[0]) + 1;
                      const endHour = `${String(endHourNum).padStart(2, '0')}:00`;

                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSlotClick(time)}
                          className={`w-full flex flex-col items-center justify-center p-4 rounded-[20px] transition-all text-center gap-1.5 ${
                            isSelected
                              ? "bg-[#A8FF00] text-[#0D0D0D] shadow-[0_0_15px_rgba(168,255,0,0.2)]"
                              : isDisabled
                                ? "bg-[#18181A]/40 text-[#71717A] cursor-not-allowed"
                                : "bg-[#18181A] text-white hover:bg-[#202020]"
                          }`}
                        >
                          <span className="text-[17px] font-extrabold tracking-tight">
                            {time} - {endHour}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isSelected ? "text-[#0D0D0D]/70" : "text-[#A1A1AA]"
                          }`}>
                            {isBooked ? "Reserved" : isPassed ? "Passed" : isHeld ? "In Cart" : `UGX ${(turf.pricePerHour / 1000).toFixed(0)}k`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}"""

if original_step1 in content:
    content = content.replace(original_step1, new_step1)
    with open('pages/TurfDetail.tsx', 'w') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("COULD NOT FIND STEP 1")
