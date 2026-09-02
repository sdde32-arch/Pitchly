with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

import_stmt = 'import { TurfReviews } from "../components/TurfReviews";\nimport { pitchService } from "../services/pitchService";'
content = content.replace('import { TurfReviews } from "../components/TurfReviews";', import_stmt)

reviews_section = """
        {/* REVIEWS SECTION */}
        <section className="pt-3 border-t border-[#262626]">
          <TurfReviews 
            pitchId={turf.id} 
            onReviewAdded={async (avg, total) => {
              setDynamicRating(avg);
              setDynamicTotalReviews(total);
              
              // Update the pitch document to store aggregated rating
              try {
                await pitchService.update(turf.id, { rating: avg });
              } catch (err) {
                console.error("Failed to update pitch rating", err);
              }
            }} 
          />
        </section>
"""

content = content.replace('        {/* REVIEWS SECTION */}\n        <section className="pt-3 border-t border-[#262626]">\n          <TurfReviews pitchId={turf.id} />\n        </section>', reviews_section)

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
