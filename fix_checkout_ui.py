import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

# Find the start of AnimatePresence and end of Sticky Bottom Summary Bar
start_marker = "<AnimatePresence>"
end_marker = "{/* Sticky Bottom Summary Bar"
end_marker_actual = "      <ReportModal"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker_actual)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

new_modal_jsx = """      <AnimatePresence>
        {isTimeframeModalOpen && (
          <div className="fixed inset-0 z-50 flex justify-center bg-black/90 backdrop-blur-md sm:p-6 sm:items-center items-end pb-0 transition-all">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-[#0D0D0D] w-full sm:w-[500px] h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-[32px] sm:rounded-3xl flex flex-col shadow-2xl border border-[#262626] overflow-hidden relative"
            >
              {modalStep === 1 && (
                <div className="sticky top-0 z-20 bg-[#0D0D0D] p-5 sm:p-6 border-b border-[#262626] flex items-center justify-between shrink-0">
                  <div>
                    <span className="text-[#A8FF00] text-[10px] font-bold tracking-wider uppercase mb-1 block">Slot Selection</span>
                    <h2 className="text-xl font-bold text-white">Available Times & Formats</h2>
                  </div>
                  <button onClick={() => setIsTimeframeModalOpen(false)} className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center text-white">
                    <X size={16} />
                  </button>
                </div>
              )}

              {modalStep >= 2 && modalStep <= 3 && (
                <div className="sticky top-0 z-20 bg-[#0D0D0D] pt-8 pb-4 px-6 shrink-0">
                  <div className="flex items-center justify-between relative max-w-[300px] mx-auto">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center gap-2 relative z-10 w-12">
                      <div className="w-8 h-8 rounded-full bg-[#A8FF00] flex items-center justify-center text-black">
                        <CheckCircle2 size={16} />
                      </div>
                      <span className="text-[10px] text-white">slot</span>
                    </div>
                    {/* Line 1 */}
                    <div className={`flex-1 h-0.5 mx-[-10px] ${modalStep >= 2 ? 'bg-[#A8FF00]' : 'bg-[#262626]'}`} />
                    {/* Step 2 */}
                    <div className="flex flex-col items-center gap-2 relative z-10 w-12">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${modalStep >= 2 ? 'bg-[#A8FF00] text-black' : 'bg-[#202020] text-[#A1A1AA]'}`}>
                        {modalStep > 2 ? <CheckCircle2 size={16} /> : "2"}
                      </div>
                      <span className={`text-[10px] ${modalStep >= 2 ? 'text-white' : 'text-[#A1A1AA]'}`}>details</span>
                    </div>
                    {/* Line 2 */}
                    <div className={`flex-1 h-0.5 mx-[-10px] ${modalStep >= 3 ? 'bg-[#A8FF00]' : 'bg-[#262626]'}`} />
                    {/* Step 3 */}
                    <div className="flex flex-col items-center gap-2 relative z-10 w-12">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${modalStep >= 3 ? 'bg-[#A8FF00] text-black' : 'bg-[#202020] text-[#A1A1AA]'}`}>
                        {modalStep > 3 ? <CheckCircle2 size={16} /> : "3"}
                      </div>
                      <span className={`text-[10px] ${modalStep >= 3 ? 'text-[#A8FF00]' : 'text-[#A1A1AA]'}`}>payment</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Scrolling Content Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0D0D0D]">
                {modalStep === 1 && (
                  <div className="space-y-3 pb-24">
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
                )}

                {modalStep === 2 && (
                  <div className="space-y-4 pb-24">
                    {/* Booking Summary */}
                    <div className="bg-[#18181A] rounded-[24px] p-5 border border-[#262626]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium text-base">Booking summary</h3>
                        <span className="border border-[#A8FF00] text-[#A8FF00] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Verified arena</span>
                      </div>
                      <div className="flex gap-4 items-center mb-6">
                        <img src={turf.image} alt={turf.name} className="w-14 h-14 rounded-2xl object-cover" />
                        <div>
                          <h4 className="text-white font-bold text-lg leading-tight">{turf.name}</h4>
                          <div className="flex items-center gap-1 text-[#A8FF00] text-xs mt-1">
                            <MapPin size={12} />
                            <span className="truncate max-w-[200px] text-[#A1A1AA]">{turf.location}</span>
                          </div>
                          <div className="text-[#A8FF00] font-bold text-sm mt-1">UGX {turf.pricePerHour.toLocaleString()} <span className="text-[#A1A1AA] font-normal text-xs">/hr</span></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#222224] rounded-2xl p-4">
                          <div className="text-[#A1A1AA] text-[11px] mb-1 font-medium">Selected date</div>
                          <div className="text-white font-bold text-sm">
                            {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <div className="bg-[#222224] rounded-2xl p-4">
                          <div className="text-[#A1A1AA] text-[11px] mb-1 font-medium">Time window</div>
                          <div className="text-white font-bold text-sm">
                            {selectedTimes[0]} - {parseInt(selectedTimes[selectedTimes.length - 1].split(':')[0]) + 1}:00
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-[#18181A] rounded-[24px] p-5 border border-[#262626]">
                      <h3 className="text-white font-medium text-base mb-4">Order summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[#A1A1AA] text-sm">Pitch hire ({selectedTimes.length} hr)</span>
                          <span className="text-white font-bold text-sm">UGX {(turf.pricePerHour * selectedTimes.length).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#A1A1AA] text-sm">Booking fee</span>
                          <span className="text-white font-bold text-sm">UGX 3,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#A1A1AA] text-sm">Service fee</span>
                          <span className="text-white font-bold text-sm">UGX 2,000</span>
                        </div>
                      </div>
                      <div className="border-t border-[#333333] my-4"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#A1A1AA] text-base">Total</span>
                        <span className="text-[#A8FF00] font-bold text-xl">UGX {(turf.pricePerHour * selectedTimes.length + 5000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {modalStep === 3 && (
                  <div className="space-y-4 pb-24">
                    <div className="bg-[#18181A] border border-[#A8FF00]/30 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hourglass size={16} className="text-[#A8FF00]" />
                        <span className="text-[#A8FF00] text-sm font-medium">slot held for you...</span>
                      </div>
                      <div className="bg-[#2A3F10] text-[#A8FF00] px-3 py-1 rounded-lg text-sm font-bold">09:47</div>
                    </div>

                    <div className="bg-[#18181A] rounded-[24px] p-5 border border-[#262626]">
                      <h3 className="text-white font-medium text-base mb-4">Select payment method</h3>
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <button onClick={() => setPaymentMethod(PaymentMethod.MTN)} className={`flex flex-col items-center justify-center p-4 rounded-[20px] gap-2 transition-all ${paymentMethod === PaymentMethod.MTN ? 'bg-[#A8FF00] text-black' : 'bg-[#222224] text-white'}`}>
                          <Smartphone size={24} strokeWidth={1.5} />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-center leading-tight">MTN<br/>MoMo</span>
                        </button>
                        <button onClick={() => setPaymentMethod(PaymentMethod.AIRTEL)} className={`flex flex-col items-center justify-center p-4 rounded-[20px] gap-2 transition-all ${paymentMethod === PaymentMethod.AIRTEL ? 'bg-[#A8FF00] text-black' : 'bg-[#222224] text-white'}`}>
                          <Smartphone size={24} strokeWidth={1.5} />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-center leading-tight">Airtel<br/>Money</span>
                        </button>
                        <button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className={`flex flex-col items-center justify-center p-4 rounded-[20px] gap-2 transition-all ${paymentMethod === PaymentMethod.CASH ? 'bg-[#A8FF00] text-black' : 'bg-[#222224] text-white'}`}>
                          <Banknote size={24} strokeWidth={1.5} />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-center leading-tight">Cash on<br/>arrival</span>
                        </button>
                      </div>

                      {(paymentMethod === PaymentMethod.MTN || paymentMethod === PaymentMethod.AIRTEL) && (
                        <>
                          <h3 className="text-[#A8FF00] font-bold text-sm mb-3">Payment instructions</h3>
                          <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center">
                              <span className="text-[#A1A1AA] text-sm">{paymentMethod === PaymentMethod.MTN ? "MTN MoMo Number" : "Airtel Money Number"}</span>
                              <span className="text-white font-medium text-sm">0702 123456</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#A1A1AA] text-sm">Registered Name</span>
                              <span className="text-white font-medium text-sm">Pitchly Uganda</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#A1A1AA] text-sm">Amount to Send</span>
                              <span className="text-[#A8FF00] font-bold text-sm">UGX {(turf.pricePerHour * selectedTimes.length + 5000).toLocaleString()}</span>
                            </div>
                          </div>

                          <h3 className="text-white font-medium text-sm mb-3">Upload transaction screenshot</h3>
                          <div className="bg-[#222224] rounded-[20px] p-6 flex flex-col items-center justify-center text-center border border-dashed border-[#404040]">
                            <label className="cursor-pointer w-full flex flex-col items-center">
                              <input type="file" className="hidden" accept="image/*" onChange={handleProofUpload} disabled={uploadingProof} />
                              {uploadingProof ? (
                                <div className="flex flex-col items-center gap-3">
                                  <Loader2 className="animate-spin text-[#A8FF00]" size={28} />
                                  <span className="text-xs text-[#A1A1AA]">Uploading...</span>
                                </div>
                              ) : proofUrl ? (
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-[#A8FF00]/20 flex items-center justify-center">
                                    <CheckCircle2 size={24} className="text-[#A8FF00]" />
                                  </div>
                                  <div>
                                    <span className="block text-sm font-medium text-white mb-1">Upload Successful!</span>
                                    <span className="text-[10px] text-[#A1A1AA]">{proofFileName}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-[#18181A] flex items-center justify-center text-[#A1A1AA]">
                                    <Upload size={24} />
                                  </div>
                                  <span className="text-sm font-medium text-white">Tap to upload receipt</span>
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
                  <div className="flex flex-col items-center justify-center text-center py-6 pb-24">
                    <div className="w-20 h-20 rounded-full border-2 border-[#A8FF00] flex items-center justify-center mb-6">
                      <Check size={40} className="text-[#A8FF00]" strokeWidth={3} />
                    </div>
                    <div className="border border-[#A8FF00] rounded-full px-4 py-1 mb-6">
                      <span className="text-[#A8FF00] text-[11px] font-bold tracking-wider">booking reserved</span>
                    </div>
                    <h2 className="text-[28px] font-extrabold text-white mb-2">Match locked in</h2>
                    <p className="text-[#A1A1AA] text-sm mb-8">
                      Your slot at <strong className="text-white">{turf.name}</strong> has been secured.
                    </p>

                    <div className="w-full bg-[#18181A] rounded-[24px] p-6 border border-[#262626] text-left relative overflow-hidden">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2 text-white">
                          <ShieldCheck size={18} className="text-[#A8FF00]" />
                          <span className="font-medium text-base">Official pitch pass</span>
                        </div>
                        <div className="border border-[#A8FF00] bg-[#2A3F10] text-[#A8FF00] px-3 py-1 rounded-full text-xs font-mono">
                          #B-{Math.floor(100000 + Math.random() * 900000)}
                        </div>
                      </div>

                      <div className="border-t border-[#333333] mb-6"></div>

                      <div className="space-y-5">
                        <div className="flex justify-between">
                          <span className="text-[#A1A1AA] text-sm">Pitch:</span>
                          <span className="text-white font-medium text-sm text-right">{turf.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#A1A1AA] text-sm">Date:</span>
                          <span className="text-white font-medium text-sm text-right">
                            {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#A1A1AA] text-sm">Time slot:</span>
                          <span className="text-[#A8FF00] font-bold text-sm text-right">{selectedTimes[0]} ({selectedTimes.length} hrs)</span>
                        </div>
                        
                        <div className="border-t border-[#333333] my-3"></div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-[#A1A1AA] text-sm">Total price:</span>
                          <span className="text-white font-bold text-lg text-right">UGX {(turf.pricePerHour * selectedTimes.length + 5000).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#A1A1AA] text-sm">Status:</span>
                          <span className="border border-[#A8FF00] text-[#A8FF00] px-3 py-1 rounded-full text-[10px] font-bold tracking-wider">
                            {paymentMethod === PaymentMethod.CASH ? "pending payment" : "verifying"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Absolute Bottom Action Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-[#0D0D0D] p-4 sm:p-6 pb-safe border-t border-[#262626]">
                {errorMsg && <div className="mb-3 text-[#EF4444] text-xs text-center">{errorMsg}</div>}
                
                {modalStep === 1 && (
                  <div className="flex items-center justify-between">
                    {selectedTimes.length > 0 ? (
                      <div className="flex items-center gap-4 w-full">
                        <div className="shrink-0 flex flex-col">
                          <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider mb-0.5">{selectedTimes.length} {selectedTimes.length === 1 ? 'HOUR' : 'HOURS'} SELECTED</span>
                          <span className="text-white font-extrabold text-[22px] leading-none">UGX {(turf.pricePerHour * selectedTimes.length).toLocaleString()}</span>
                        </div>
                        <button 
                          onClick={() => setModalStep(2)}
                          className="flex-1 py-4 bg-[#A8FF00] hover:bg-[#96E600] text-[#0D0D0D] rounded-full font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          CONFIRM SLOTS
                        </button>
                      </div>
                    ) : (
                      <div className="w-full text-center text-[#A1A1AA] py-2 text-sm font-medium">
                        Select a time slot to continue
                      </div>
                    )}
                  </div>
                )}

                {modalStep === 2 && (
                  <button 
                    onClick={() => setModalStep(3)}
                    className="w-full py-4 bg-[#A8FF00] hover:bg-[#96E600] text-[#0D0D0D] rounded-[100px] font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="lowercase font-bold tracking-wide">continue to payment</span>
                    <ArrowRight size={16} strokeWidth={3} />
                  </button>
                )}

                {modalStep === 3 && (
                  <button 
                    onClick={async () => {
                      const totalWithFees = (turf.pricePerHour * selectedTimes.length) + 5000;
                      try {
                        setIsSubmitting(true);
                        const sortedTimes = [...selectedTimes].sort();
                        const bookingId = Math.random().toString(36).substring(2, 15);
                        const bookingData: import("../types/firebase").Booking = {
                          id: bookingId,
                          pitchId: turf.id,
                          playerId: user.uid,
                          ownerId: turf.ownerId || "",
                          date: selectedDate,
                          time: sortedTimes[0],
                          slots: sortedTimes,
                          duration: sortedTimes.length,
                          totalPrice: totalWithFees,
                          status: paymentMethod === PaymentMethod.CASH ? BookingStatus.PENDING : BookingStatus.CONFIRMED,
                          paymentMethod: paymentMethod,
                          paymentStatus: paymentMethod === PaymentMethod.CASH ? "UNPAID" : "SUBMITTED",
                          paymentProofUrl: proofUrl || "",
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        };
                        await bookingService.create(bookingData);
                        setModalStep(4);
                      } catch (err: any) {
                        setErrorMsg(err.message || "Failed to create booking.");
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting || ((paymentMethod === PaymentMethod.MTN || paymentMethod === PaymentMethod.AIRTEL) && !proofUrl)}
                    className="w-full py-4 bg-[#A8FF00] hover:bg-[#96E600] disabled:bg-[#222224] disabled:text-[#A1A1AA] text-[#0D0D0D] rounded-[100px] font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSubmitting ? (
                      <span className="lowercase font-bold tracking-wide">processing...</span>
                    ) : (
                      <>
                        <span className="lowercase font-bold tracking-wide">confirm booking</span>
                        <ArrowRight size={16} strokeWidth={3} />
                      </>
                    )}
                  </button>
                )}

                {modalStep === 4 && (
                  <button 
                    onClick={() => {
                      setIsTimeframeModalOpen(false);
                      navigate('/bookings');
                    }}
                    className="w-full py-4 bg-[#A8FF00] hover:bg-[#96E600] text-[#0D0D0D] rounded-[100px] font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="lowercase font-bold tracking-wide">view my bookings</span>
                    <ArrowRight size={16} strokeWidth={3} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Page Persistent "Book Now" Button (when modal is closed) */}
      <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-auto sm:w-[852px] sm:ml-6 z-40">
        {!isTimeframeModalOpen && (
          <button
            onClick={() => {
              setModalStep(1);
              setIsTimeframeModalOpen(true);
            }}
            className="w-full py-4 bg-[#A8FF00] hover:bg-[#96E600] text-[#0D0D0D] font-extrabold text-[15px] uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(168,255,0,0.2)] active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            {selectedTimes.length > 0 ? `BOOK SELECTED (${selectedTimes.length} hr)` : 'SELECT TIME SLOT'}
          </button>
        )}
      </div>\n"""

# Reconstruct file
content = content[:start_idx] + new_modal_jsx + "\n" + content[end_idx:]

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
