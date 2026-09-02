import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

# Replace step 3
step3_pattern = re.compile(r'\{modalStep === 3 && \((.*?)\)\}', re.DOTALL)
step3_replacement = r"""{modalStep === 3 && (
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

content = step3_pattern.sub(step3_replacement, content)

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
