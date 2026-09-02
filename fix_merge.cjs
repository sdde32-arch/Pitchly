const fs = require('fs');
let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

// 1. Remove the boundary between Order Summary and Player Contact Details
const oldBoundary = `              </Card>
            </div>
            )
          )}
          {step === 2 && (
            <div className="space-y-6">`;

const newBoundary = `              </Card>
              {/* Note: Player Contact Details now part of step 1 */}`;

content = content.replace(oldBoundary, newBoundary);

// 2. We need to remove the closing of the previous step 2 block.
// Let's find:
// `              </Card>
//             </div>
//           )}
//           {step === 2 && (` (which is the payment block)

const endOfDetails = `              </Card>
            </div>
          )}
          {step === 2 && (`;

const fixedEndOfDetails = `              </Card>
            </div>
            )
          )}
          {step === 2 && (`;

content = content.replace(endOfDetails, fixedEndOfDetails);

fs.writeFileSync('pages/Checkout.tsx', content, 'utf8');
