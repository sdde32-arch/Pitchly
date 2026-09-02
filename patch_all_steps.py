import re

with open('pages/TurfDetail.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if 'className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0D0D0D]"' in line:
        start_idx = i
    if '</motion.div>' in line and start_idx != -1 and i > start_idx:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    replacement = """              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0D0D0D] no-scrollbar">
                {modalStep === 1 && (
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
                )}
                {modalStep === 2 && (
                  <div className="space-y-3 pb-32">
                    {/* Booking Summary */}
                    <div className="bg-[#18181A] rounded-[20px] p-4 border border-[#262626]">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium text-sm">Booking Details</h3>
                        <span className="text-[#A8FF00] text-xs font-bold uppercase tracking-wider">{turf.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#222224] flex items-center justify-center text-white shrink-0">
                          <Clock size={18} className="text-[#A8FF00]" />
                        </div>
                        <div>
                          <div className="text-[#A1A1AA] text-xs mb-0.5">
                            {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-white font-bold text-sm">
                            {selectedTimes[0]} - {parseInt(selectedTimes[selectedTimes.length - 1].split(':')[0]) + 1}:00
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-[#18181A] rounded-[20px] p-4 border border-[#262626]">
                      <h3 className="text-white font-medium text-sm mb-3">Order Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[#A1A1AA] text-xs">Pitch hire ({selectedTimes.length} hr)</span>
                          <span className="text-white font-bold text-xs">UGX {(turf.pricePerHour * selectedTimes.length).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#A1A1AA] text-xs">Booking fee</span>
                          <span className="text-white font-bold text-xs">UGX 3,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#A1A1AA] text-xs">Service fee</span>
                          <span className="text-white font-bold text-xs">UGX 2,000</span>
                        </div>
                      </div>
                      <div className="border-t border-[#333333] my-3"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#A1A1AA] text-sm">Total</span>
                        <span className="text-[#A8FF00] font-bold text-lg">UGX {(turf.pricePerHour * selectedTimes.length + 5000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                {modalStep === 3 && (
                  <div className="space-y-3 pb-32">
                    <div className="bg-[#18181A] border border-[#A8FF00]/30 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hourglass size={14} className="text-[#A8FF00]" />
                        <span className="text-[#A8FF00] text-xs font-medium">Slot held for you...</span>
                      </div>
                      <div className="bg-[#2A3F10] text-[#A8FF00] px-2 py-0.5 rounded text-xs font-bold">09:47</div>
                    </div>

                    <div className="bg-[#18181A] rounded-[20px] p-4 border border-[#262626]">
                      <h3 className="text-white font-medium text-sm mb-3">Payment Method</h3>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <button onClick={() => setPaymentMethod(PaymentMethod.MTN)} className={`flex flex-col items-center justify-center p-2.5 rounded-[16px] gap-1.5 transition-all ${paymentMethod === PaymentMethod.MTN ? 'bg-[#A8FF00] text-black' : 'bg-[#222224] text-white'}`}>
                          <Smartphone size={20} strokeWidth={1.5} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">MTN<br/>MoMo</span>
                        </button>
                        <button onClick={() => setPaymentMethod(PaymentMethod.AIRTEL)} className={`flex flex-col items-center justify-center p-2.5 rounded-[16px] gap-1.5 transition-all ${paymentMethod === PaymentMethod.AIRTEL ? 'bg-[#A8FF00] text-black' : 'bg-[#222224] text-white'}`}>
                          <Smartphone size={20} strokeWidth={1.5} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">Airtel<br/>Money</span>
                        </button>
                        <button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className={`flex flex-col items-center justify-center p-2.5 rounded-[16px] gap-1.5 transition-all ${paymentMethod === PaymentMethod.CASH ? 'bg-[#A8FF00] text-black' : 'bg-[#222224] text-white'}`}>
                          <Banknote size={20} strokeWidth={1.5} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">Cash</span>
                        </button>
                      </div>

                      {(paymentMethod === PaymentMethod.MTN || paymentMethod === PaymentMethod.AIRTEL) && (
                        <>
                          <div className="space-y-1.5 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[#A1A1AA] text-xs">Number</span>
                              <span className="text-white font-medium text-xs">0702 123456</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#A1A1AA] text-xs">Name</span>
                              <span className="text-white font-medium text-xs">Pitchly Uganda</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#A1A1AA] text-xs">Amount</span>
                              <span className="text-[#A8FF00] font-bold text-xs">UGX {(turf.pricePerHour * selectedTimes.length + 5000).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="bg-[#222224] rounded-[16px] p-3 flex flex-col items-center justify-center text-center border border-dashed border-[#404040]">
                            <label className="cursor-pointer w-full flex flex-col items-center">
                              <input type="file" className="hidden" accept="image/*" onChange={handleProofUpload} disabled={uploadingProof} />
                              {uploadingProof ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="animate-spin text-[#A8FF00]" size={20} />
                                  <span className="text-[10px] text-[#A1A1AA]">Uploading...</span>
                                </div>
                              ) : proofUrl ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-[#A8FF00]/20 flex items-center justify-center">
                                    <CheckCircle2 size={16} className="text-[#A8FF00]" />
                                  </div>
                                  <span className="block text-xs font-medium text-white">Upload Successful</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-[#18181A] flex items-center justify-center text-[#A1A1AA]">
                                    <Upload size={16} />
                                  </div>
                                  <span className="text-xs font-medium text-white">Tap to upload receipt</span>
                                </div>
                              )}
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {modalStep === 4 && (
                  <div className="flex flex-col items-center justify-center text-center py-6 pb-32">
                    <div className="w-16 h-16 rounded-full border-2 border-[#A8FF00] flex items-center justify-center mb-4">
                      <Check size={32} className="text-[#A8FF00]" strokeWidth={3} />
                    </div>
                    <div className="border border-[#A8FF00] rounded-full px-3 py-1 mb-4">
                      <span className="text-[#A8FF00] text-[10px] font-bold tracking-wider uppercase">Booking Reserved</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white mb-2">Match Locked In</h2>
                    <p className="text-[#A1A1AA] text-xs mb-6 max-w-[240px] leading-relaxed">
                      Your slot at <strong className="text-white">{turf.name}</strong> has been secured.
                    </p>
                    <div className="w-full bg-[#18181A] rounded-[20px] p-5 border border-[#262626] text-left relative overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-white">
                          <ShieldCheck size={16} className="text-[#A8FF00]" />
                          <span className="font-medium text-sm">Official pitch pass</span>
                        </div>
                        <div className="bg-[#262626] text-[#A1A1AA] text-[10px] font-bold px-2 py-1 rounded">
                          {selectedDate.replace(/-/g, '')}
                        </div>
                      </div>
                      
                      <div className="space-y-4 relative z-10">
                        <div>
                          <p className="text-[#A1A1AA] text-[10px] uppercase tracking-wider font-bold mb-1">Time</p>
                          <p className="text-white font-bold text-sm">{selectedTimes[0]} - {parseInt(selectedTimes[selectedTimes.length - 1].split(':')[0]) + 1}:00</p>
                        </div>
                        <div>
                          <p className="text-[#A1A1AA] text-[10px] uppercase tracking-wider font-bold mb-1">Total Paid</p>
                          <p className="text-[#A8FF00] font-bold text-sm">UGX {(turf.pricePerHour * selectedTimes.length + 5000).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none">
                        <CheckCircle2 size={120} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
"""

    new_lines = lines[:start_idx] + [replacement] + lines[end_idx:]
    with open('pages/TurfDetail.tsx', 'w') as f:
        f.writelines(new_lines)
    print("SUCCESS")
else:
    print("COULD NOT FIND RANGE")
