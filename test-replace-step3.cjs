const fs = require('fs');
let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

// I will write a regex to capture everything from `if (step === 3) {` to `  return (` (before the Layout)
const regex = /if \(step === 3\) \{([\s\S]*?)\}\n\n  return \(/;

const newStep3 = `if (step === 3) {
    return (
      <div className="min-h-[100dvh] bg-[#0D0D0D] text-[#F4F4F5] font-body flex flex-col items-center justify-start py-12 px-4 text-center relative overflow-y-auto w-full transition-colors duration-300">
        
        {/* Central Success Badge */}
        <div className="relative mb-6 z-10">
          <div className="w-16 h-16 rounded-full border border-[#A8FF00] bg-transparent flex items-center justify-center">
            <Check size={32} className="text-[#A8FF00]" strokeWidth={2.5} />
          </div>
        </div>

        {/* Text Header & Subtitle */}
        <div className="z-10 w-full max-w-sm flex flex-col items-center">
          <div className="border border-[#A8FF00]/50 rounded-full px-3 py-1 text-[#A8FF00] text-xs font-medium mb-4">
            booking reserved
          </div>
          <h1 className="text-2xl font-semibold text-[#F4F4F5] mb-2">
            Match locked in
          </h1>
          <p className="text-[#A1A1AA] text-sm mb-8">
            Your slot at <strong className="text-[#F4F4F5] font-medium">{createdBooking?.turfName || turf.name}</strong> has been secured.
          </p>
        </div>

        {/* Digital Match Ticket Card */}
        <Card className="w-full max-w-sm p-5 text-left mb-8 relative z-10 space-y-4 rounded-[20px] bg-[#161616] border-[#262626]">
          {/* Top Banner Tag */}
          <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#A8FF00]" />
              <span className="text-sm font-medium text-[#A1A1AA]">
                Official pitch pass
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-[#A8FF00] px-2.5 py-1 rounded-full border border-[#A8FF00]/30 bg-[#A8FF00]/10">
              #{createdBooking?.id?.substring(0,8).toUpperCase() || bookingId?.substring(0,8).toUpperCase() || "B-527038"}
            </span>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[#A1A1AA]">Pitch:</span>
              <span className="font-medium text-[#F4F4F5] text-right truncate max-w-[200px]">{createdBooking?.turfName || turf.name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[#A1A1AA]">Date:</span>
              <span className="font-medium text-[#F4F4F5]">{formattedDisplayDate}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[#A1A1AA]">Time slot:</span>
              <span className="font-medium text-[#A8FF00]">
                {createdBooking?.time || (selectedTimes.length > 0 ? selectedTimes[0] : "10:00")} ({createdBooking?.duration || duration} hrs)
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-[#262626] mt-1">
              <span className="text-[#A1A1AA]">Total price:</span>
              <span className="font-medium text-[#F4F4F5] text-lg">
                UGX {(createdBooking?.totalPrice || createdBooking?.price || ((turf.pricePerHour * duration) + 5000)).toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-1">
              <span className="text-[#A1A1AA]">Status:</span>
              <div className="px-2.5 py-1 text-xs border border-[#A8FF00]/50 text-[#A8FF00] rounded-full font-medium">
                {(createdBooking?.status || "pending payment").toLowerCase().replace('_', ' ')}
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3 z-10">
          <Button 
            onClick={() => navigate('/settings')} 
            variant="primary" 
            fullWidth 
            className="flex flex-col items-center justify-center py-4 rounded-full bg-[#A8FF00] text-[#0D0D0D] font-semibold text-sm hover:bg-[#96E600]"
          >
            <span>view my bookings</span>
            <ArrowRight size={16} className="mt-1" />
          </Button>
          
          <Button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'My Match Pass',
                  text: \`I booked a match at \${turf.name} on \${formattedDisplayDate}\`,
                  url: window.location.href,
                }).catch(console.error);
              }
            }}
            variant="outline" 
            fullWidth 
            className="flex flex-col items-center justify-center py-4 rounded-full border-[#262626] bg-[#202020] text-[#F4F4F5] font-semibold text-sm hover:bg-[#262626]"
          >
            <Share2 size={16} className="mb-1" />
            <span>share match pass</span>
          </Button>
        </div>
      </div>
    );
  }

  return (`;

content = content.replace(regex, newStep3);
fs.writeFileSync('pages/Checkout.tsx', content, 'utf8');
