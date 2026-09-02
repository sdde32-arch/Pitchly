import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

original_step3 = """                {modalStep === 3 && (
                  <div className="space-y-4 pb-32">
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
                        <button onClick={() => setPaymentMethod(PaymentMethod.MTN)} className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-[20px] gap-2 transition-all ${paymentMethod === PaymentMethod.MTN ? 'bg-[#A8FF00] text-black' : 'bg-[#222224] text-white'}`}>
                          <Smartphone size={24} strokeWidth={1.5} />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-center leading-tight">MTN<br/>MoMo</span>
                        </button>
                        <button onClick={() => setPaymentMethod(PaymentMethod.AIRTEL)} className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-[20px] gap-2 transition-all ${paymentMethod === PaymentMethod.AIRTEL ? 'bg-[#A8FF00] text-black' : 'bg-[#222224] text-white'}`}>
                          <Smartphone size={24} strokeWidth={1.5} />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-center leading-tight">Airtel<br/>Money</span>
                        </button>
                        <button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-[20px] gap-2 transition-all ${paymentMethod === PaymentMethod.CASH ? 'bg-[#A8FF00] text-black' : 'bg-[#222224] text-white'}`}>
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
                )}"""

new_step3 = """                {modalStep === 3 && (
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
                )}"""

original_step4 = """                {modalStep === 4 && (
                  <div className="flex flex-col items-center justify-center text-center py-6 pb-32">
                    <div className="w-20 h-20 rounded-full border-2 border-[#A8FF00] flex items-center justify-center mb-6">
                      <Check size={40} className="text-[#A8FF00]" strokeWidth={3} />
                    </div>
                    <div className="border border-[#A8FF00] rounded-full px-4 py-1 mb-6">
                      <span className="text-[#A8FF00] text-[11px] font-bold tracking-wider">booking reserved</span>
                    </div>
                    <h2 className="text-[28px] font-extrabold text-white mb-2">Match locked in</h2>
                    <p className="text-[#A1A1AA] text-sm mb-8">
                      Your slot at <strong className="text-white">{turf.name}</strong> has been secured.
                    </p>"""

new_step4 = """                {modalStep === 4 && (
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
                    </p>"""

if original_step3 in content:
    content = content.replace(original_step3, new_step3)
    if original_step4 in content:
        content = content.replace(original_step4, new_step4)
    with open('pages/TurfDetail.tsx', 'w') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("COULD NOT FIND STEP 3")
