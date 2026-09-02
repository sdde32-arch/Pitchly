import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

original_step2 = """                {modalStep === 2 && (
                  <div className="space-y-4 pb-32">
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
                )}"""

new_step2 = """                {modalStep === 2 && (
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
                )}"""

if original_step2 in content:
    content = content.replace(original_step2, new_step2)
    with open('pages/TurfDetail.tsx', 'w') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("COULD NOT FIND STEP 2")
