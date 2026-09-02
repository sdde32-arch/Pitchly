const fs = require('fs');
let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

// Update progress bar
const startMarker = '<div className="flex items-center justify-between max-w-md mx-auto p-4 mb-2">';
const endMarker = '<div className="max-w-xl mx-auto p-4">';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

const newProgress = `<div className="flex items-center justify-between max-w-md mx-auto p-4 mb-2">
            <div className="flex flex-col items-center gap-1.5 relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all bg-[#A8FF00] text-[#0D0D0D] font-bold">
                ✓
              </div>
              <span className="text-[11px] font-medium text-[#A1A1AA]">
                slot
              </span>
            </div>

            <div className="flex-1 h-[2px] mb-4 mx-2 transition-all bg-[#A8FF00]" />

            <div className="flex flex-col items-center gap-1.5 relative">
              <div className={\`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all \${
                step === 1 
                  ? "bg-[#A8FF00] text-[#0D0D0D] font-bold" 
                  : step > 1 
                    ? "bg-[#A8FF00] text-[#0D0D0D] font-bold" 
                    : "border border-[#262626] text-[#A1A1AA] bg-[#202020]"
              }\`}>
                {step > 1 ? "✓" : "2"}
              </div>
              <span className={\`text-[11px] font-medium \${step === 1 ? "text-[#A8FF00]" : "text-[#A1A1AA]"}\`}>
                details
              </span>
            </div>

            <div className={\`flex-1 h-[2px] mb-4 mx-2 transition-all \${step > 1 ? "bg-[#A8FF00]" : "bg-[#262626]"}\`} />

            <div className="flex flex-col items-center gap-1.5 relative">
              <div className={\`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all \${
                step === 2 
                  ? "bg-[#A8FF00] text-[#0D0D0D] font-bold" 
                  : "border border-[#262626] text-[#A1A1AA] bg-[#202020]"
              }\`}>
                3
              </div>
              <span className={\`text-[11px] font-medium \${step === 2 ? "text-[#A8FF00]" : "text-[#A1A1AA]"}\`}>
                payment
              </span>
            </div>
          </div>
        )}
        `;

content = content.substring(0, startIndex) + newProgress + content.substring(endIndex);
fs.writeFileSync('pages/Checkout.tsx', content, 'utf8');
