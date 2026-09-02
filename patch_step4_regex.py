import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

step4_pattern = re.compile(r'\{modalStep === 4 && \((.*?)\)\}', re.DOTALL)
step4_replacement = r"""{modalStep === 4 && (
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
                )}"""

content = step4_pattern.sub(step4_replacement, content)

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
