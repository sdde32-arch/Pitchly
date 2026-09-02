import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

replacement = """              </div>
              {/* Modal Action Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-[#0D0D0D] border-t border-[#18181A] pb-[max(env(safe-area-inset-bottom),1rem)] z-20">
                {modalStep === 1 && (
                  <button
                    type="button"
                    disabled={selectedTimes.length === 0}
                    onClick={() => setModalStep(2)}
                    className="w-full h-14 bg-[#A8FF00] hover:bg-[#96E600] disabled:opacity-50 disabled:hover:bg-[#A8FF00] text-[#0D0D0D] rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(168,255,0,0.2)] disabled:shadow-none active:scale-[0.98] disabled:active:scale-100"
                  >
                    <span className="font-bold tracking-wide">Continue</span>
                  </button>
                )}
                
                {modalStep === 2 && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="h-14 px-6 bg-[#18181A] hover:bg-[#202020] text-white rounded-xl flex items-center justify-center transition-all active:scale-[0.98] border border-[#262626]"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStep(3)}
                      className="flex-1 h-14 bg-[#A8FF00] hover:bg-[#96E600] text-[#0D0D0D] rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(168,255,0,0.2)] active:scale-[0.98]"
                    >
                      <span className="font-bold tracking-wide">Continue to Payment</span>
                    </button>
                  </div>
                )}

                {modalStep === 3 && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setModalStep(2)}
                      disabled={isProcessingBooking}
                      className="h-14 px-6 bg-[#18181A] hover:bg-[#202020] disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all active:scale-[0.98] border border-[#262626]"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingBooking || (paymentMethod !== PaymentMethod.CASH && !proofUrl)}
                      onClick={handleConfirmBooking}
                      className="flex-1 h-14 bg-[#A8FF00] hover:bg-[#96E600] disabled:opacity-50 disabled:hover:bg-[#A8FF00] text-[#0D0D0D] rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(168,255,0,0.2)] disabled:shadow-none active:scale-[0.98] disabled:active:scale-100"
                    >
                      {isProcessingBooking ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={18} className="animate-spin" />
                          <span className="font-bold tracking-wide">Processing...</span>
                        </div>
                      ) : (
                        <span className="font-bold tracking-wide">Confirm Booking</span>
                      )}
                    </button>
                  </div>
                )}

                {modalStep === 4 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsTimeframeModalOpen(false);
                      setModalStep(1);
                      navigate('/bookings');
                    }}
                    className="w-full h-14 bg-[#18181A] hover:bg-[#202020] border border-[#262626] text-white rounded-xl flex items-center justify-center transition-all active:scale-[0.98]"
                  >
                    <span className="font-bold tracking-wide">View My Bookings</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}"""

content = content.replace("              </div>\n            </motion.div>\n          </div>\n        )}", replacement)

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
