with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

import_stmt = 'import { TurfReviews } from "../components/TurfReviews";'
if import_stmt not in content:
    content = content.replace('import { Layout } from "../components/Layout";', 'import { Layout } from "../components/Layout";\nimport { TurfReviews } from "../components/TurfReviews";')

reviews_section = """
        {/* REVIEWS SECTION */}
        <section className="pt-3 border-t border-[#262626]">
          <TurfReviews pitchId={turf.id} />
        </section>
"""

content = content.replace('        {/* HOST / AGENT SECTION */}', reviews_section + '\n        {/* HOST / AGENT SECTION */}')

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
