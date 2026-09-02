const fs = require('fs');
let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

// The bottom buttons
content = content.replace(
    `            onClick={() => {
              if (step === 1) {
                handleProceedToCheckout();
              } else if (step === 2) {
                setStep(3);
              } else if (step === 3) {
                handleConfirmBooking();
              }
            }}`,
    `            onClick={() => {
              if (step === 1) {
                handleProceedToCheckout();
              } else if (step === 2) {
                handleConfirmBooking();
              }
            }}`
);

content = content.replace(
    `                  {step === 1 
                    ? \`hold slot & continue — UGX \${((turf.pricePerHour * duration) + 5000).toLocaleString()}\` 
                    : step === 2 
                      ? "continue to payment" 
                      : "confirm booking"}`,
    `                  {step === 1 
                    ? "continue to payment" 
                    : "confirm booking"}`
);

content = content.replace(
    `              (step === 1 
                ? selectedTimes.length === 0 
                : step === 2
                 ? (!fullName.trim() || !phone.trim() || !email.trim())
                 : (isSubmitting || uploadingProof || ((selectedPaymentMethod === PaymentMethod.MTN || selectedPaymentMethod === PaymentMethod.AIRTEL) && !proofUrl)))`,
    `              (step === 1 
                ? (!fullName.trim() || !phone.trim() || !email.trim())
                : (isSubmitting || uploadingProof || ((selectedPaymentMethod === PaymentMethod.MTN || selectedPaymentMethod === PaymentMethod.AIRTEL) && !proofUrl)))`
);


// In handleProceedToCheckout (around line 500)
// Currently it does setStep(2);
// But wait, step 2 is Payment! So that's actually correct.
// But wait, there is no step 3 now! It sets step 4 for success.
// Let's replace setStep(4) with setStep(3)
content = content.replace(/setStep\(4\)/g, 'setStep(3)');

// And change `if (step === 4)` to `if (step === 3)`
content = content.replace(/if \(step === 4\)/g, 'if (step === 3)');

// Now the back button at the top:
content = content.replace(
    `            <button
              onClick={() => {
                if (step === 1) {
                  navigate(-1);
                } else {
                  if (step === 2) {
                    setStep(1);
                  } else if (step === 3) {
                    setStep(2);
                  }
                }
              }}`,
    `            <button
              onClick={() => {
                if (step === 1) {
                  navigate(-1);
                } else {
                  setStep(1);
                }
              }}`
);

fs.writeFileSync('pages/Checkout.tsx', content, 'utf8');
