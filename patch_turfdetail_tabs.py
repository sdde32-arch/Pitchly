with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

# Add activeTab state
if 'const [activeTab, setActiveTab]' not in content:
    content = content.replace('const [currentImgIndex, setCurrentImgIndex] = useState(0);', 'const [currentImgIndex, setCurrentImgIndex] = useState(0);\n  const [activeTab, setActiveTab] = useState<"about" | "reviews">("about");')

# Replace sections with tabs
start_idx = content.find('{/* Details Gray Box Grid */}')
end_idx = content.find('</main>')

if start_idx != -1 and end_idx != -1:
    old_content = content[start_idx:end_idx]
    
    # We need to construct the new content
    new_content = """
        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-6 border-b border-[#262626] mb-4">
          <button 
            onClick={() => setActiveTab("about")}
            className={`pb-3 text-[13px] font-bold transition-colors border-b-2 ${activeTab === 'about' ? 'text-[#F4F4F5] border-[#A8FF00]' : 'text-[#A1A1AA] border-transparent hover:text-[#F4F4F5]'}`}
          >
            About Pitch
          </button>
          <button 
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 text-[13px] font-bold transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'reviews' ? 'text-[#F4F4F5] border-[#A8FF00]' : 'text-[#A1A1AA] border-transparent hover:text-[#F4F4F5]'}`}
          >
            Reviews {dynamicTotalReviews !== null && dynamicTotalReviews > 0 ? <span className="text-[11px] bg-[#262626] text-[#F4F4F5] px-1.5 py-0.5 rounded-full">{dynamicTotalReviews}</span> : null}
          </button>
        </div>

        {/* TAB CONTENT */}
        {activeTab === "about" ? (
          <div className="space-y-6 pb-20">
            {/* Details Gray Box Grid */}
            <section aria-label="Details Grid" className="bg-[#161616] p-4 rounded-xl space-y-2.5 shadow-sm border border-[#262626]">
              <h2 className="text-[14px] font-bold text-[#F4F4F5] px-1">Details</h2>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Size */}
                <div className="flex items-center gap-2.5 p-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center shrink-0">
                    <Zap size={14} className="text-[#A8FF00]" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Size</span>
                    <span className="block text-[13px] font-semibold text-[#F4F4F5]">{turf.type || "5-a-side"}</span>
                  </div>
                </div>
                
                {/* Capacity */}
                <div className="flex items-center gap-2.5 p-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-[#A8FF00]">groups</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Capacity</span>
                    <span className="block text-[13px] font-semibold text-[#F4F4F5]">
                      {turf.type?.includes("5") ? "10 Players" : turf.type?.includes("11") ? "22 Players" : "14 Players"}
                    </span>
                  </div>
                </div>
                
                {/* Surface Type */}
                <div className="flex items-center gap-2.5 p-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-[#A8FF00]" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Surface</span>
                    <span className="block text-[13px] font-semibold text-[#F4F4F5]">AstroTurf</span>
                  </div>
                </div>
                
                {/* Floodlights */}
                <div className="flex items-center gap-2.5 p-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center shrink-0">
                    <Lightbulb size={14} className="text-[#A8FF00]" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Lights</span>
                    <span className="block text-[13px] font-semibold text-[#F4F4F5]">Floodlit</span>
                  </div>
                </div>
              </div>
            </section>
            
            {/* DESCRIPTION SECTION */}
            <section className="space-y-1.5 pt-1 px-1">
              <h2 className="text-[14px] font-bold text-[#F4F4F5]">Facilities</h2>
              <p className="text-[13px] text-[#A1A1AA] leading-relaxed font-medium">
                This premium certified AstroTurf pitch spans regulation size and includes high-fidelity floodlights, spectator seating, secure parking, and various other amenities for competitive weekend leagues... <span className="text-[#A8FF00] font-bold cursor-pointer hover:underline">Read More</span>
              </p>
            </section>
            
            {/* HOST / AGENT SECTION */}
            <section className="flex items-center justify-between pt-3 border-t border-[#262626]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#262626] shadow-sm">
                  <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80" alt="Agent" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-bold text-[#F4F4F5]">Pitch Manager</span>
                    <div className="w-3 h-3 rounded-full bg-[#A8FF00] text-[#0D0D0D] flex items-center justify-center">
                      <Check size={8} strokeWidth={4} />
                    </div>
                  </div>
                  <span className="text-[11px] text-[#A1A1AA] font-medium">Property Agent</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-[#161616] shadow-sm border border-[#262626] flex items-center justify-center hover:bg-[#202020] transition-colors cursor-pointer">
                  <MessageSquare size={14} className="text-[#F4F4F5]" />
                </button>
                <button className="w-9 h-9 rounded-full bg-[#A8FF00] text-[#0D0D0D] shadow-sm flex items-center justify-center transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            {/* REVIEWS SECTION */}
            <section className="pt-2">
              <TurfReviews 
                pitchId={turf.id} 
                onReviewAdded={async (avg, total) => {
                  setDynamicRating(avg);
                  setDynamicTotalReviews(total);
                  
                  // Update the pitch document to store aggregated rating
                  try {
                    await pitchService.update(turf.id, { rating: avg } as any);
                  } catch (err) {
                    console.error("Failed to update pitch rating", err);
                  }
                }} 
              />
            </section>
          </div>
        )}
"""
    content = content[:start_idx] + new_content + content[end_idx:]
    
with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
