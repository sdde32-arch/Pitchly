# Pitchly UI Audit Evidence Report (UI-2 Upgrade)

Generated automatically by `/ui-audit/audit.mjs` with Playwright & Axe-Core.

## Table 1: Run Summary
| Metric | Value |
| :--- | :--- |
| **Pages Tested** | 6 pages (`auth`, `install`, `onboarding`, `teams-join`, `tournament`, `welcome-back`) |
| **Viewport Widths** | 4 widths (`1280px`, `360px`, `390px`, `768px`) |
| **Themes Tested** | 2 themes (`dark`, `light`) |
| **Total Test Combinations** | 48 (6 pages × 4 widths × 2 themes) |
| **Total Checks Evaluated** | 528 checks (48 combinations × 11 checks a-k) |
| **Raw Data Output** | 48 JSON files saved in `/ui-audit/raw/` |
| **Caps & Limits** | REMOVED (Full DOM tree examined without element or count caps) |

---

## Table 2: Signed-In Route Coverage Status
| Route | App.tsx Source Location | Auth Guard | Coverage Status | Reason |
| :--- | :--- | :--- | :--- | :--- |
| `/home` | `App.tsx:252` | `<RequireAuth>` | **NOT TESTED (no credentials)** | AUDIT_EMAIL and AUDIT_PASSWORD not present in environment |
| `/turf/:id` | `App.tsx:253` | `<RequireAuth>` | **NOT TESTED (no credentials)** | AUDIT_EMAIL and AUDIT_PASSWORD not present in environment |
| `/turf/:id/book` | `App.tsx:254` | `<RequireAuth>` | **NOT TESTED (no credentials)** | AUDIT_EMAIL and AUDIT_PASSWORD not present in environment |
| `/explore-map` | `App.tsx:256` | `<RequireAuth>` | **NOT TESTED (no credentials)** | AUDIT_EMAIL and AUDIT_PASSWORD not present in environment |
| `/teams` | `App.tsx:257` | `<RequireAuth>` | **NOT TESTED (no credentials)** | AUDIT_EMAIL and AUDIT_PASSWORD not present in environment |
| `/invitations` | `App.tsx:258` | `<RequireAuth>` | **NOT TESTED (no credentials)** | AUDIT_EMAIL and AUDIT_PASSWORD not present in environment |
| `/bookings` | `App.tsx:259` | `<RequireAuth>` | **NOT TESTED (no credentials)** | AUDIT_EMAIL and AUDIT_PASSWORD not present in environment |
| `/profile` | `App.tsx:262` | `<RequireAuth>` | **NOT TESTED (no credentials)** | AUDIT_EMAIL and AUDIT_PASSWORD not present in environment |
| `/settings` | `App.tsx:263` | `<RequireAuth>` | **NOT TESTED (no credentials)** | AUDIT_EMAIL and AUDIT_PASSWORD not present in environment |
| `/chat` | `App.tsx:265` | `<RequireAuth>` | **NOT TESTED (no credentials)** | AUDIT_EMAIL and AUDIT_PASSWORD not present in environment |

---

## Table 3: Summary Table by Page × Viewport × Theme

| Page | Width | Theme | Overflow (a) | Text < 12px (b) | Tap < 44px (c) | Tokens: Size/Radius/Color (d) | Row Diff (e) | Gap Diff (f) | Axe Violations (g) | Img Issues (h) | Clipped (i) | Prices (j) | Cards (k) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `auth` | 1280px | dark | ✅ PASS | 6 | 7 | 10 / 2 / 8 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| `auth` | 1280px | light | ✅ PASS | 6 | 7 | 10 / 2 / 8 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| `auth` | 360px | dark | ✅ PASS | 6 | 7 | 10 / 2 / 8 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| `auth` | 360px | light | ✅ PASS | 6 | 7 | 10 / 2 / 8 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| `auth` | 390px | dark | ✅ PASS | 6 | 7 | 10 / 2 / 8 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| `auth` | 390px | light | ✅ PASS | 6 | 7 | 10 / 2 / 8 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| `auth` | 768px | dark | ✅ PASS | 6 | 7 | 10 / 2 / 8 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| `auth` | 768px | light | ✅ PASS | 6 | 7 | 10 / 2 / 8 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| `install` | 1280px | dark | ✅ PASS | 9 | 6 | 7 / 7 / 5 | 0 | 0 | 1 | 3 | 1 | 0 | 2 |
| `install` | 1280px | light | ✅ PASS | 9 | 6 | 7 / 7 / 5 | 0 | 0 | 2 | 3 | 1 | 0 | 2 |
| `install` | 360px | dark | ✅ PASS | 9 | 5 | 7 / 7 / 5 | 0 | 0 | 1 | 3 | 1 | 0 | 2 |
| `install` | 360px | light | ✅ PASS | 9 | 5 | 7 / 7 / 5 | 0 | 0 | 2 | 3 | 1 | 0 | 2 |
| `install` | 390px | dark | ✅ PASS | 9 | 6 | 7 / 7 / 5 | 0 | 0 | 1 | 3 | 1 | 0 | 2 |
| `install` | 390px | light | ✅ PASS | 9 | 6 | 7 / 7 / 5 | 0 | 0 | 2 | 3 | 1 | 0 | 2 |
| `install` | 768px | dark | ✅ PASS | 9 | 6 | 7 / 7 / 5 | 0 | 0 | 1 | 3 | 1 | 0 | 2 |
| `install` | 768px | light | ✅ PASS | 9 | 6 | 7 / 7 / 5 | 0 | 0 | 2 | 3 | 1 | 0 | 2 |
| `onboarding` | 1280px | dark | ✅ PASS | 14 | 10 | 10 / 6 / 10 | 0 | 0 | 2 | 1 | 0 | 1 | 1 |
| `onboarding` | 1280px | light | ✅ PASS | 14 | 10 | 10 / 6 / 9 | 0 | 0 | 2 | 1 | 0 | 1 | 1 |
| `onboarding` | 360px | dark | ✅ PASS | 17 | 7 | 9 / 6 / 10 | 1 | 0 | 1 | 1 | 0 | 1 | 1 |
| `onboarding` | 360px | light | ✅ PASS | 17 | 7 | 9 / 6 / 9 | 1 | 0 | 2 | 1 | 0 | 1 | 1 |
| `onboarding` | 390px | dark | ✅ PASS | 17 | 7 | 9 / 6 / 10 | 1 | 0 | 1 | 1 | 0 | 1 | 1 |
| `onboarding` | 390px | light | ✅ PASS | 17 | 7 | 9 / 6 / 9 | 1 | 0 | 2 | 1 | 0 | 1 | 1 |
| `onboarding` | 768px | dark | ✅ PASS | 14 | 10 | 10 / 6 / 10 | 0 | 0 | 1 | 1 | 0 | 1 | 1 |
| `onboarding` | 768px | light | ✅ PASS | 14 | 10 | 10 / 6 / 9 | 0 | 0 | 2 | 1 | 0 | 1 | 1 |
| `teams-join` | 1280px | dark | ✅ PASS | 11 | 11 | 6 / 6 / 6 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| `teams-join` | 1280px | light | ✅ PASS | 11 | 11 | 6 / 6 / 6 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `teams-join` | 360px | dark | ✅ PASS | 11 | 3 | 6 / 6 / 6 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| `teams-join` | 360px | light | ✅ PASS | 11 | 3 | 6 / 6 / 6 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `teams-join` | 390px | dark | ✅ PASS | 11 | 3 | 6 / 6 / 6 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| `teams-join` | 390px | light | ✅ PASS | 11 | 3 | 6 / 6 / 6 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `teams-join` | 768px | dark | ✅ PASS | 11 | 3 | 6 / 6 / 6 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| `teams-join` | 768px | light | ✅ PASS | 11 | 3 | 6 / 6 / 6 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `tournament` | 1280px | dark | ✅ PASS | 27 | 12 | 7 / 4 / 21 | 0 | 0 | 1 | 0 | 2 | 0 | 0 |
| `tournament` | 1280px | light | ✅ PASS | 27 | 12 | 7 / 4 / 21 | 0 | 0 | 2 | 0 | 2 | 0 | 0 |
| `tournament` | 360px | dark | ✅ PASS | 26 | 12 | 8 / 4 / 21 | 0 | 0 | 1 | 0 | 3 | 0 | 0 |
| `tournament` | 360px | light | ✅ PASS | 26 | 12 | 8 / 4 / 21 | 0 | 0 | 2 | 0 | 3 | 0 | 0 |
| `tournament` | 390px | dark | ✅ PASS | 26 | 12 | 8 / 4 / 21 | 0 | 0 | 1 | 0 | 3 | 0 | 0 |
| `tournament` | 390px | light | ✅ PASS | 26 | 12 | 8 / 4 / 21 | 0 | 0 | 2 | 0 | 3 | 0 | 0 |
| `tournament` | 768px | dark | ✅ PASS | 27 | 12 | 7 / 4 / 21 | 0 | 0 | 1 | 0 | 3 | 0 | 0 |
| `tournament` | 768px | light | ✅ PASS | 27 | 12 | 7 / 4 / 21 | 0 | 0 | 2 | 0 | 3 | 0 | 0 |
| `welcome-back` | 1280px | dark | ✅ PASS | 0 | 1 | 6 / 2 / 4 | 0 | 0 | 3 | 1 | 0 | 0 | 0 |
| `welcome-back` | 1280px | light | ✅ PASS | 0 | 1 | 6 / 2 / 4 | 0 | 0 | 3 | 1 | 0 | 0 | 0 |
| `welcome-back` | 360px | dark | ✅ PASS | 0 | 1 | 5 / 2 / 4 | 0 | 0 | 3 | 1 | 0 | 0 | 0 |
| `welcome-back` | 360px | light | ✅ PASS | 0 | 1 | 5 / 2 / 4 | 0 | 0 | 3 | 1 | 0 | 0 | 0 |
| `welcome-back` | 390px | dark | ✅ PASS | 0 | 1 | 5 / 2 / 4 | 0 | 0 | 3 | 1 | 0 | 0 | 0 |
| `welcome-back` | 390px | light | ✅ PASS | 0 | 1 | 5 / 2 / 4 | 0 | 0 | 3 | 1 | 0 | 0 | 0 |
| `welcome-back` | 768px | dark | ✅ PASS | 0 | 1 | 6 / 2 / 4 | 0 | 0 | 3 | 1 | 0 | 0 | 0 |
| `welcome-back` | 768px | light | ✅ PASS | 0 | 1 | 6 / 2 / 4 | 0 | 0 | 3 | 1 | 0 | 0 | 0 |

---

## Section 4: Ranked Offenders Across the App (Deduplicated)

### Rank 1: Horizontal Overflow
**Result**: ✅ PASS on all 48 test combinations across all 6 pages, 4 viewports (360px, 390px, 768px, 1280px), and 2 themes (dark and light). No horizontal scrolling detected.

### Rank 2: Small Tap Targets (< 44x44px)
*Targets appearing on multiple pages are listed first, sorted by frequency across pages, followed by single-page targets.*

| Target Label | Rendered Size | Pages Count | Pages List | Selector | Best-Guess Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| "BACK TO INTRO" | 131×16px | **1** | `auth` | `div.max-w-md.w-full:nth-of-type(3) > div.mb-3.text-center > button.mb-2.inline-flex` | `pages/Auth.tsx:269 (GUESS)` |
| "LOG IN" | 195×37px | **1** | `auth` | `div.p-4.sm\:p-5:nth-of-type(2) > div.flex.gap-2 > button.flex-1.py-2\.5` | `pages/Auth.tsx:24 (GUESS)` |
| "REGISTER" | 195×37px | **1** | `auth` | `div.p-4.sm\:p-5:nth-of-type(2) > div.flex.gap-2 > button.flex-1.py-2\.5:nth-of-type(2)` | `pages/Auth.tsx:196 (GUESS)` |
| "Continue with Google" | 406×42px | **1** | `auth` | `div.p-4.sm\:p-5:nth-of-type(2) > div.space-y-3.mb-4:nth-of-type(2) > button.w-full.flex` | `pages/Auth.tsx:353 (GUESS)` |
| "button" | 16×16px | **1** | `auth` | `form.space-y-3 > div.relative.group:nth-of-type(2) > button.absolute.right-4` | `pages/Auth.tsx:271 (GUESS)` |
| "Forgot Password?" | 406×17px | **1** | `auth` | `div.p-4.sm\:p-5:nth-of-type(2) > form.space-y-3 > button.w-full.text-center:nth-of-type(2)` | `pages/Auth.tsx:575 (GUESS)` |
| "Email support@pitchly.live" | 153×15px | **1** | `auth` | `form.space-y-3 > div.mt-5.pt-4:nth-of-type(3) > a.text-primary-lime.hover\:underline` | `pages/Auth.tsx:320 (GUESS)` |
| "Go back" | 40×40px | **1** | `install` | `header.sticky.top-0 > div.max-w-2xl.mx-auto > button.w-10.h-10` | `pages/Install.tsx:230 (GUESS)` |
| "Go to Home" | 40×40px | **1** | `install` | `header.sticky.top-0 > div.max-w-2xl.mx-auto > button.w-10.h-10:nth-of-type(2)` | `pages/Install.tsx:6 (GUESS)` |
| "iOS Safari" | 72×25px | **1** | `install` | `div.flex.items-center > div.flex.items-center > button.px-2\.5.py-1` | `pages/Install.tsx:304 (GUESS)` |
| "Android / Chrome" | 117×25px | **1** | `install` | `div.flex.items-center > div.flex.items-center > button.px-2\.5.py-1:nth-of-type(2)` | `pages/Install.tsx:275 (GUESS)` |
| "Copy" | 65×23px | **1** | `install` | `div.flex.flex-col:nth-of-type(2) > div.mt-3\.5.w-full:nth-of-type(2) > button.px-2\.5.py-1` | `pages/Install.tsx:5 (GUESS)` |
| "Sign In" | 62×28px | **1** | `onboarding` | `div.max-w-7xl.mx-auto > div.flex.items-center:nth-of-type(2) > button.text-xs.font-bold` | `pages/Onboarding.tsx:190 (GUESS)` |
| "SKIP TOUR" | 93×31px | **1** | `onboarding` | `div.max-w-7xl.mx-auto > div.flex.items-center:nth-of-type(2) > button.text-\[11px\].font-extrabold:nth-of-type(2)` | `pages/Onboarding.tsx:196 (GUESS)` |
| "Go to slide 1" | 40×8px | **1** | `onboarding` | `div.pt-2.space-y-4:nth-of-type(4) > div.flex.items-center > button.h-2.rounded-full` | `pages/Onboarding.tsx:24 (GUESS)` |
| "Go to slide 2" | 8×8px | **1** | `onboarding` | `div.pt-2.space-y-4:nth-of-type(4) > div.flex.items-center > button.h-2.rounded-full:nth-of-type(2)` | `pages/Onboarding.tsx:24 (GUESS)` |
| "Go to slide 3" | 8×8px | **1** | `onboarding` | `div.pt-2.space-y-4:nth-of-type(4) > div.flex.items-center > button.h-2.rounded-full:nth-of-type(3)` | `pages/Onboarding.tsx:24 (GUESS)` |
| "Sign in" | 38×16px | **1** | `onboarding` | `div.flex.items-center:nth-of-type(3) > span > button.text-text-primary.font-bold` | `pages/Onboarding.tsx:190 (GUESS)` |
| "Venue Owner Portal" | 130×16px | **1** | `onboarding` | `div.pt-2.space-y-4:nth-of-type(4) > div.flex.items-center:nth-of-type(3) > button.text-primary-lime.hover\:underline` | `pages/Onboarding.tsx:311 (GUESS)` |
| "Back to Squads" | 112×16px | **1** | `teams-join` | `div.max-w-md.mx-auto > div.flex.items-center > button.flex.items-center` | `pages/JoinTeam.tsx:126 (GUESS)` |
| "Browse All Squads" | 398×40px | **1** | `teams-join` | `div.max-w-md.mx-auto > div.bg-surface-card.rounded-3xl:nth-of-type(2) > button.w-full.py-3` | `pages/JoinTeam.tsx:172 (GUESS)` |
| "button" | 28×28px | **1** | `tournament` | `div.max-w-4xl.mx-auto > div.flex.items-center > button.w-7.h-7` | `components/ui/EmptyState.tsx:4 (GUESS)` |
| "Admin" | 73×24px | **1** | `tournament` | `div.max-w-4xl.mx-auto > div.flex.items-center:nth-of-type(2) > button.inline-flex.items-center` | `components/TurfReviews.tsx:35 (GUESS)` |
| "Matches" | 212×30px | **1** | `tournament` | `#tab-fixtures` | `components/home/CommunityActivityFeed.tsx:305 (GUESS)` |
| "Standings" | 210×28px | **1** | `tournament` | `#tab-standings` | `components/tournament/ShareTournamentCard.tsx:64 (GUESS)` |
| "Scorers" | 210×28px | **1** | `tournament` | `#tab-scorers` | `components/home/CommunityActivityFeed.tsx:603 (GUESS)` |
| "Squads" | 210×28px | **1** | `tournament` | `#tab-rosters` | `components/home/CommunityActivityFeed.tsx:305 (GUESS)` |
| "All" | 37×26px | **1** | `tournament` | `div.flex.items-center > div.flex.items-center > button.px-2\.5.py-1` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| "Matchday 3" | 86×24px | **1** | `tournament` | `div.flex.items-center > div.flex.items-center > button.px-2\.5.py-1:nth-of-type(2)` | `components/ui/Skeleton.tsx:212 (GUESS)` |
| "Results" | 62×24px | **1** | `tournament` | `div.flex.items-center > div.flex.items-center > button.px-2\.5.py-1:nth-of-type(3)` | `components/home/ActivityFeed.tsx:38 (GUESS)` |
| "Live" | 42×24px | **1** | `tournament` | `div.flex.items-center > div.flex.items-center > button.px-2\.5.py-1:nth-of-type(4)` | `components/home/CommunityActivityFeed.tsx:289 (GUESS)` |
| "Filter club..." | 192×28px | **1** | `tournament` | `div.flex.items-center > div.relative.w-36:nth-of-type(2) > input.w-full.h-7` | `components/tournament/TournamentLeaderboard.tsx:369 (GUESS)` |
| "Not you? Switch Account" | 165×20px | **1** | `welcome-back` | `div.fixed.inset-0 > div.max-w-sm.w-full > button.text-slate-500.dark\:text-zinc-400:nth-of-type(2)` | `pages/WelcomeBack.tsx:71 (GUESS)` |
| "DOWNLOAD QR CODE (1024X1024 PN" | 494×42px | **1** | `install` | `div.bg-surface-card.rounded-2xl:nth-of-type(3) > div.pt-2:nth-of-type(3) > button.w-full.py-3` | `pages/Install.tsx:240 (GUESS)` |
| "App Walkthrough & Guide" | 36×36px | **1** | `teams-join` | `header.bg-surface-card\/90.backdrop-blur-md > div.flex.items-center:nth-of-type(2) > button.w-9.h-9` | `pages/JoinTeam.tsx:143 (GUESS)` |
| "1
DISCOVER" | 110×28px | **1** | `onboarding` | `div.max-w-7xl.mx-auto > nav.hidden.sm\:flex > button.flex.items-center` | `pages/Onboarding.tsx:41 (GUESS)` |
| "2
BOOK" | 84×28px | **1** | `onboarding` | `div.max-w-7xl.mx-auto > nav.hidden.sm\:flex > button.flex.items-center:nth-of-type(2)` | `pages/Onboarding.tsx:45 (GUESS)` |
| "3
PLAY" | 77×28px | **1** | `onboarding` | `div.max-w-7xl.mx-auto > nav.hidden.sm\:flex > button.flex.items-center:nth-of-type(3)` | `pages/Onboarding.tsx:75 (GUESS)` |
| "Share" | 71×26px | **1** | `tournament` | `div.max-w-4xl.mx-auto > div.flex.items-center:nth-of-type(2) > button.inline-flex.items-center:nth-of-type(2)` | `components/home/CommunityActivityFeed.tsx:10 (GUESS)` |
| "button" | 34×22px | **1** | `tournament` | `div.max-w-4xl.mx-auto > div.flex.items-center:nth-of-type(2) > button.inline-flex.items-center:nth-of-type(2)` | `components/ui/EmptyState.tsx:4 (GUESS)` |
| "Home" | 231×37px | **1** | `teams-join` | `div > nav.space-y-1 > button.relative.flex` | `components/ui/Skeleton.tsx:172 (GUESS)` |
| "Tournament" | 231×37px | **1** | `teams-join` | `div > nav.space-y-1 > button.relative.flex:nth-of-type(2)` | `components/home/CommunityActivityFeed.tsx:33 (GUESS)` |
| "Explore" | 231×37px | **1** | `teams-join` | `div > nav.space-y-1 > button.relative.flex:nth-of-type(3)` | `components/home/SpotlightCarousel.tsx:49 (GUESS)` |
| "Bookings" | 231×37px | **1** | `teams-join` | `div > nav.space-y-1 > button.relative.flex:nth-of-type(4)` | `components/home/ActivityFeed.tsx:38 (GUESS)` |
| "Squads" | 231×37px | **1** | `teams-join` | `div > nav.space-y-1 > button.relative.flex:nth-of-type(5)` | `pages/JoinTeam.tsx:134 (GUESS)` |
| "Profile" | 231×37px | **1** | `teams-join` | `div > nav.space-y-1 > button.relative.flex:nth-of-type(6)` | `pages/JoinTeam.tsx:30 (GUESS)` |
| "App Walkthrough" | 231×34px | **1** | `teams-join` | `aside.hidden.lg\:flex > div.p-3.border-t:nth-of-type(3) > button.w-full.flex` | `components/onboarding/GettingStartedGuide.tsx:129 (GUESS)` |
| "Settings" | 192×34px | **1** | `teams-join` | `div.p-3.border-t:nth-of-type(3) > div.flex.items-center:nth-of-type(2) > button.flex-1.flex` | `components/home/NoPitchesCard.tsx:29 (GUESS)` |
| "Log out" | 33×33px | **1** | `teams-join` | `div.p-3.border-t:nth-of-type(3) > div.flex.items-center:nth-of-type(2) > button.flex.items-center:nth-of-type(2)` | `components/Layout.tsx:557 (GUESS)` |

### Rank 3: Low-Contrast Text Violations (WCAG AA)
*Color contrast issues sorted by severity and frequency across pages.*

| Severity | Element / Sample HTML | Pages Count | Pages List | Selector | Best-Guess Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **[serious]** | `<span id="pitchly-tagline" class="text-[8.5px] fon` | **1** | `auth` | `#pitchly-tagline` | `components/Logo.tsx:277 (GUESS)` |
| **[serious]** | `<button class="w-full min-h-[56px] py-4 rounded-fu` | **1** | `welcome-back` | `.min-h-\[56px\]` | `pages/WelcomeBack.tsx:99 (GUESS)` |
| **[serious]** | `<button class="mb-2 inline-flex items-center gap-1` | **1** | `auth` | `.mb-2` | `pages/Auth.tsx:277 (GUESS)` |
| **[serious]** | `<span class="font-display font-black tracking-tigh` | **1** | `auth` | `.items-baseline.justify-center.flex > .font-display.tracking-tight.text-current` | `components/home/FootballPitchCard.tsx:156 (GUESS)` |
| **[serious]** | `<button class="flex-1 py-2.5 text-[11.5px] font-bo` | **1** | `auth` | `.text-slate-500` | `pages/Auth.tsx:303 (GUESS)` |
| **[serious]** | `<button class="flex-1 py-2.5 text-[11.5px] font-bo` | **1** | `auth` | `.shadow-sm` | `pages/Auth.tsx:303 (GUESS)` |
| **[serious]** | `<p class="mt-4 text-center text-[10px] font-bold t` | **1** | `auth` | `p` | `pages/Auth.tsx (GUESS)` |
| **[serious]** | `<span class="absolute -bottom-2 -right-2 px-2 py-0` | **1** | `install` | `.absolute` | `pages/Install.tsx (GUESS)` |
| **[serious]** | `<button class="px-2.5 py-1 text-[11px] font-bold r` | **1** | `install` | `.bg-primary-lime.text-accent-text.px-2\.5` | `pages/Install.tsx:228 (GUESS)` |
| **[serious]** | `<div class="inline-flex items-center gap-1 ml-1 px` | **1** | `install` | `.ml-1` | `pages/Install.tsx:427 (GUESS)` |
| **[serious]** | `<span>Mobile QR Scanner</span>` | **1** | `install` | `.mb-0\.5 > span` | `pages/Install.tsx:497 (GUESS)` |
| **[serious]** | `<span>DISCOVER</span>` | **1** | `onboarding` | `.bg-\[\#38BDF8\]\/10 > span` | `pages/Onboarding.tsx:53 (GUESS)` |
| **[serious]** | `<span>Continue</span>` | **1** | `onboarding` | `#btn-onboarding-continue > span` | `pages/Onboarding.tsx:291 (GUESS)` |
| **[serious]** | `<span>Venue Owner Portal</span>` | **1** | `onboarding` | `.hover\:underline.gap-1.text-primary-lime > span` | `pages/Onboarding.tsx:169 (GUESS)` |
| **[serious]** | `<span class="text-xs font-bold text-primary-lime b` | **1** | `onboarding` | `.rounded-md` | `pages/Onboarding.tsx:338 (GUESS)` |
| **[serious]** | `<span class="text-[10px] font-black uppercase trac` | **1** | `teams-join` | `.px-2` | `pages/JoinTeam.tsx:136 (GUESS)` |
| **[serious]** | `<span>Admin</span>` | **1** | `tournament` | `.text-black > span` | `components/home/CommunityActivityFeed.tsx:351 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-orange-600\/15.text-orange-400.border-orange-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-emerald-600\/15.text-emerald-400.border-emerald-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.space-y-2:nth-child(1) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(2) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-amber-600\/15.text-amber-400.border-amber-500\/30` | `components/ui/Skeleton.tsx:37 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-lime-500\/15.text-lime-400.border-lime-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(3) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-rose-600\/15.text-rose-400.border-rose-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(4) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-teal-500\/15.text-teal-300.border-teal-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(4) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-red-600\/15.text-red-400.border-red-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(5) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-purple-600\/15.text-purple-400.border-purple-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(5) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-yellow-500\/15.text-yellow-400.border-yellow-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(6) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-cyan-600\/15.text-cyan-400.border-cyan-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-blue-600\/15.text-blue-400.border-blue-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(7) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-indigo-600\/15.text-indigo-400.border-indigo-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(7) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-sky-600\/15.text-sky-400.border-sky-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(8) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-fuchsia-600\/15.text-fuchsia-400.border-fuchsia-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(8) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-pink-600\/15.text-pink-400.border-pink-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.pt-2.space-y-2:nth-child(2) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(1) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-blue-600\/15.text-blue-400.border-blue-500\/30` | `components/ui/Skeleton.tsx:43 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-teal-500\/15.text-teal-300.border-teal-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-rose-600\/15.text-rose-400.border-rose-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.pt-2.space-y-2:nth-child(2) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(3) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-emerald-600\/15.text-emerald-400.border-emerald-500\/30` | `components/ui/Skeleton.tsx:43 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(3) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-yellow-500\/15.text-yellow-400.border-yellow-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(4) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-purple-600\/15.text-purple-400.border-purple-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.pt-2.space-y-2:nth-child(2) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(4) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-orange-600\/15.text-orange-400.border-orange-500\/30` | `components/ui/Skeleton.tsx:43 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(5) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-indigo-600\/15.text-indigo-400.border-indigo-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-fuchsia-600\/15.text-fuchsia-400.border-fuchsia-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-sky-600\/15.text-sky-400.border-sky-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.pt-2.space-y-2:nth-child(2) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(6) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-pink-600\/15.text-pink-400.border-pink-500\/30` | `components/ui/Skeleton.tsx:43 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.pt-2.space-y-2:nth-child(2) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(7) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-lime-500\/15.text-lime-400.border-lime-500\/30` | `components/ui/Skeleton.tsx:43 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-amber-600\/15.text-amber-400.border-amber-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(8) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-cyan-600\/15.text-cyan-400.border-cyan-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(8) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-red-600\/15.text-red-400.border-red-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.pt-2.space-y-2:nth-child(3) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(1) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-blue-600\/15.text-blue-400.border-blue-500\/30` | `components/ui/Skeleton.tsx:43 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(1) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-red-600\/15.text-red-400.border-red-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.pt-2.space-y-2:nth-child(3) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(2) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-amber-600\/15.text-amber-400.border-amber-500\/30` | `components/ui/Skeleton.tsx:43 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(2) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-rose-600\/15.text-rose-400.border-rose-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.pt-2.space-y-2:nth-child(3) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(3) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-emerald-600\/15.text-emerald-400.border-emerald-500\/30` | `components/ui/Skeleton.tsx:43 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-purple-600\/15.text-purple-400.border-purple-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-yellow-500\/15.text-yellow-400.border-yellow-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.pt-2.space-y-2:nth-child(3) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(4) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-orange-600\/15.text-orange-400.border-orange-500\/30` | `components/ui/Skeleton.tsx:43 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(5) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-fuchsia-600\/15.text-fuchsia-400.border-fuchsia-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(5) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-sky-600\/15.text-sky-400.border-sky-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(6) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-indigo-600\/15.text-indigo-400.border-indigo-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.pt-2.space-y-2:nth-child(3) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(6) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-pink-600\/15.text-pink-400.border-pink-500\/30` | `components/ui/Skeleton.tsx:43 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.pt-2.space-y-2:nth-child(3) > .grid.grid-cols-1.md\:grid-cols-2 > .p-3.hover\:border-border-prominent.rounded-xl:nth-child(7) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-lime-500\/15.text-lime-400.border-lime-500\/30` | `components/ui/Skeleton.tsx:43 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.p-3.hover\:border-border-prominent.rounded-xl:nth-child(8) > .space-y-1\.5.py-0\.5 > .justify-between.gap-2.items-center:nth-child(1) > .min-w-0.gap-2.items-center > .bg-teal-500\/15.text-teal-300.border-teal-500\/30` | `components/ui/Checkbox.tsx:23 (GUESS)` |
| **[serious]** | `<div class="w-5 h-5 rounded flex items-center just` | **1** | `tournament` | `.justify-between.gap-2.items-center:nth-child(2) > .min-w-0.gap-2.items-center > .bg-cyan-600\/15.text-cyan-400.border-cyan-500\/30` | `components/ui/Skeleton.tsx:25 (GUESS)` |
| **[serious]** | `<span class="font-display font-black tracking-tigh` | **1** | `welcome-back` | `.items-baseline.justify-center.flex > .font-display.font-black.tracking-tight` | `components/home/FootballPitchCard.tsx:156 (GUESS)` |
| **[serious]** | `<a href="mailto:support@pitchly.live?subject=Pitch` | **1** | `auth` | `a` | `pages/Auth.tsx (GUESS)` |
| **[serious]** | `<span class="text-[10px] font-bold text-primary-li` | **1** | `teams-join` | `.gap-2.items-center.flex > .py-1.rounded-md.px-2\.5 > .tracking-wider.uppercase.text-primary-lime` | `pages/JoinTeam.tsx:196 (GUESS)` |
| **[serious]** | `<p class="text-[11px] font-bold text-text-tertiary` | **1** | `onboarding` | `.line-through` | `pages/Onboarding.tsx:381 (GUESS)` |
| **[serious]** | `<span class="text-[9px] font-bold text-red-400 upp` | **1** | `onboarding` | `.text-red-400` | `pages/Onboarding.tsx:382 (GUESS)` |
| **[serious]** | `<span>DISCOVER</span>` | **1** | `onboarding` | `.shadow-sm > span:nth-child(2)` | `pages/Onboarding.tsx:167 (GUESS)` |
| **[serious]** | `<span class="hidden sm:inline-block text-[10px] fo` | **1** | `tournament` | `.sm\:inline-block` | `components/ui/Card.tsx:25 (GUESS)` |
| **[serious]** | `<span class="font-extrabold text-primary-lime">UGX` | **1** | `onboarding` | `.justify-between.text-xs.items-center > .font-extrabold.text-primary-lime` | `pages/Onboarding.tsx:151 (GUESS)` |
| **[serious]** | `<p class="text-[11px] font-extrabold text-primary-` | **1** | `onboarding` | `.border-primary-lime\/40.p-2.text-center:nth-child(1) > .font-extrabold` | `pages/Onboarding.tsx:71 (GUESS)` |
| **[serious]** | `<p class="text-[11px] font-extrabold text-primary-` | **1** | `onboarding` | `.border-primary-lime\/40.p-2.text-center:nth-child(3) > .font-extrabold` | `pages/Onboarding.tsx:71 (GUESS)` |
| **[serious]** | `<span class="text-[10px] font-bold text-primary-li` | **1** | `teams-join` | `.pt-1.justify-between.items-center > .py-1.rounded-md.px-2\.5 > .tracking-wider.uppercase.text-primary-lime` | `components/ui/Skeleton.tsx:66 (GUESS)` |
| **[serious]** | `<span>App Walkthrough</span>` | **1** | `teams-join` | `.gap-2.items-center.flex > span` | `pages/JoinTeam.tsx:196 (GUESS)` |

### Rank 4: Font Sizes < 12px
*Elements with computed font size < 12px, sorted by frequency across pages, then font size ascending.*

| Font Size | Sample Text | Pages Count | Pages List | Selector | Best-Guess Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **8px** | "SP" | **1** | `tournament` | `div.flex.items-center > div.flex.items-center > div.w-5.h-5` | `components/ui/Checkbox.tsx:38 (GUESS)` |
| **8px** | "BF" | **1** | `tournament` | `div.flex.items-center:nth-of-type(2) > div.flex.items-center > div.w-5.h-5` | `components/ui/Checkbox.tsx:38 (GUESS)` |
| **8.5px** | "Uganda" | **1** | `auth` | `#pitchly-tagline` | `components/home/CommunityActivityFeed.tsx:305 (GUESS)` |
| **9px** | "Available" | **1** | `onboarding` | `div.grid.grid-cols-3:nth-of-type(2) > div.p-2.rounded-xl > span.text-\[9px\].font-bold` | `pages/Onboarding.tsx:378 (GUESS)` |
| **9px** | "Held" | **1** | `onboarding` | `div.grid.grid-cols-3:nth-of-type(2) > div.p-2.rounded-xl:nth-of-type(2) > span.text-\[9px\].font-bold` | `pages/Onboarding.tsx:49 (GUESS)` |
| **9px** | "Available" | **1** | `onboarding` | `div.grid.grid-cols-3:nth-of-type(2) > div.p-2.rounded-xl:nth-of-type(3) > span.text-\[9px\].font-bold` | `pages/Onboarding.tsx:378 (GUESS)` |
| **10px** | "or continue with email" | **1** | `auth` | `div.space-y-3.mb-4:nth-of-type(2) > div.flex.items-center > span.text-\[10px\].font-bold` | `pages/Auth.tsx:362 (GUESS)` |
| **10px** | "End-to-End Encrypted Session" | **1** | `auth` | `div.fixed.inset-0 > div.max-w-md.w-full:nth-of-type(3) > p.mt-4.text-center` | `pages/Auth.tsx:606 (GUESS)` |
| **10px** | "PWA" | **1** | `install` | `div.text-center.space-y-3 > div.relative.inline-block > span.absolute.-bottom-2` | `pages/Install.tsx:44 (GUESS)` |
| **10px** | "Player" | **1** | `teams-join` | `div.flex.items-center:nth-of-type(2) > div.inline-flex.items-center > span.text-\[10px\].font-bold` | `pages/JoinTeam.tsx:82 (GUESS)` |
| **10px** | "App" | **1** | `teams-join` | `div.p-4.border-b > div.flex.items-center:nth-of-type(2) > span.text-\[10px\].font-bold` | `pages/JoinTeam.tsx:7 (GUESS)` |
| **10px** | "Main Navigation" | **1** | `teams-join` | `div.flex-1.overflow-y-auto:nth-of-type(2) > div > p.font-bold.text-\[10px\]` | `components/Layout.tsx:469 (GUESS)` |
| **10px** | "verified account" | **1** | `teams-join` | `div.flex.items-center > div.min-w-0:nth-of-type(2) > p.text-\[10px\].text-text-tertiary:nth-of-type(2)` | `components/Layout.tsx:539 (GUESS)` |
| **10px** | "Player" | **1** | `teams-join` | `div.flex.items-center > div.inline-flex.items-center:nth-of-type(2) > span.text-\[10px\].font-bold` | `pages/JoinTeam.tsx:82 (GUESS)` |
| **10px** | "Pitchly Squad Invite" | **1** | `teams-join` | `div.max-w-md.mx-auto > div.flex.items-center > span.text-\[10px\].font-black` | `pages/JoinTeam.tsx:137 (GUESS)` |
| **10px** | "Home" | **1** | `teams-join` | `nav.pointer-events-auto.w-full > button.relative.flex > span.text-\[10px\].leading-tight` | `components/ui/Skeleton.tsx:172 (GUESS)` |
| **10px** | "Tournament" | **1** | `teams-join` | `nav.pointer-events-auto.w-full > button.relative.flex:nth-of-type(2) > span.text-\[10px\].leading-tight` | `components/home/CommunityActivityFeed.tsx:33 (GUESS)` |
| **10px** | "Explore" | **1** | `teams-join` | `nav.pointer-events-auto.w-full > button.relative.flex:nth-of-type(3) > span.text-\[10px\].leading-tight` | `components/home/SpotlightCarousel.tsx:49 (GUESS)` |
| **10px** | "Bookings" | **1** | `teams-join` | `nav.pointer-events-auto.w-full > button.relative.flex:nth-of-type(4) > span.text-\[10px\].leading-tight` | `components/home/ActivityFeed.tsx:38 (GUESS)` |
| **10px** | "Squads" | **1** | `teams-join` | `nav.pointer-events-auto.w-full > button.relative.flex:nth-of-type(5) > span.text-\[10px\].leading-tight` | `pages/JoinTeam.tsx:134 (GUESS)` |
| **10px** | "FT" | **1** | `tournament` | `div.flex.items-center > div.flex.items-center:nth-of-type(2) > span.text-\[10px\].text-text-tertiary` | `components/ui/Card.tsx:19 (GUESS)` |
| **10px** | "Senior Player" | **1** | `tournament` | `div.rounded-xl.border > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1` | `components/tournament/TournamentLeaderboard.tsx:59 (GUESS)` |
| **10px** | "Semalulu Paul (2), Mark Jordan" | **1** | `tournament` | `div.rounded-xl.border > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1:nth-of-type(2)` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Yawe" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(2) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Paco (2), Nico, Travis" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(2) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1:nth-of-type(2)` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Nyanzi Shafik (5), Bacola, Boyz" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(3) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1:nth-of-type(2)` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Bwanika Shafik, Muguza Collin" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(5) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1:nth-of-type(2)` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Ebong Mark" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(6) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Raymond Junior" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(6) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1:nth-of-type(2)` | `pages/tournament/TournamentHub.tsx:2016 (GUESS)` |
| **10px** | "Jackson, Kabenge" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(7) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "David, Ssembatya Sharif" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(7) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1:nth-of-type(2)` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Ntege Peter" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(8) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Rodger, Ssali Arafat" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(8) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1:nth-of-type(2)` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Shehu, Salim" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(4) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Nsubuga Mark (4)" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(5) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Mark Jordan, Magala Hassan, Walusimbi, S" | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(3) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| **10px** | "Tournament" | **1** | `tournament` | `div.max-w-4xl.mx-auto > div.flex.items-center > span.hidden.sm\:inline-block` | `components/home/CommunityActivityFeed.tsx:33 (GUESS)` |
| **11px** | "Forgot Password?" | **1** | `auth` | `div.p-4.sm\:p-5:nth-of-type(2) > form.space-y-3 > button.w-full.text-center:nth-of-type(2)` | `pages/Auth.tsx:575 (GUESS)` |
| **11px** | "iOS Safari" | **1** | `install` | `div.flex.items-center > div.flex.items-center > button.px-2\.5.py-1` | `pages/Install.tsx:304 (GUESS)` |
| **11px** | "Android / Chrome" | **1** | `install` | `div.flex.items-center > div.flex.items-center > button.px-2\.5.py-1:nth-of-type(2)` | `pages/Install.tsx:275 (GUESS)` |
| **11px** | "https://ais-pre-e35syz3bvfqlhjdx424sss-2" | **1** | `install` | `div.flex.flex-col:nth-of-type(2) > div.mt-3\.5.w-full:nth-of-type(2) > span.font-mono.text-\[11px\]` | `pages/Install.tsx:228 (GUESS)` |
| **11px** | "Copy" | **1** | `install` | `div.mt-3\.5.w-full:nth-of-type(2) > button.px-2\.5.py-1 > span` | `pages/Install.tsx:5 (GUESS)` |
| **11px** | "High-resolution 1024x1024 format with ma" | **1** | `install` | `div.bg-surface-card.rounded-2xl:nth-of-type(3) > div.pt-2:nth-of-type(3) > p.text-\[11px\].text-text-tertiary` | `pages/Install.tsx:561 (GUESS)` |
| **11px** | "Launches instantly from your home screen" | **1** | `install` | `div.grid.grid-cols-1:nth-of-type(4) > div.p-3\.5.rounded-xl > p.text-\[11px\].text-text-secondary` | `pages/Install.tsx:574 (GUESS)` |
| **11px** | "Browse pitches, match vouchers, and tour" | **1** | `install` | `div.grid.grid-cols-1:nth-of-type(4) > div.p-3\.5.rounded-xl:nth-of-type(2) > p.text-\[11px\].text-text-secondary` | `pages/Install.tsx:567 (GUESS)` |
| **11px** | "Immersive full-screen experience with no" | **1** | `install` | `div.grid.grid-cols-1:nth-of-type(4) > div.p-3\.5.rounded-xl:nth-of-type(3) > p.text-\[11px\].text-text-secondary` | `pages/Install.tsx:594 (GUESS)` |
| **11px** | "Skip Tour" | **1** | `onboarding` | `div.max-w-7xl.mx-auto > div.flex.items-center:nth-of-type(2) > button.text-\[11px\].font-extrabold:nth-of-type(2)` | `pages/Onboarding.tsx:196 (GUESS)` |
| **11px** | "Kampala Turf Radar" | **1** | `onboarding` | `div.flex.items-center > div.flex.items-center > span.inline-flex.items-center:nth-of-type(2)` | `pages/Onboarding.tsx:42 (GUESS)` |
| **11px** | "FIFA Synthetic Turf" | **1** | `onboarding` | `div.relative.rounded-2xl:nth-of-type(2) > div.absolute.top-3:nth-of-type(2) > span` | `pages/Onboarding.tsx:354 (GUESS)` |
| **11px** | "4.9 (128)" | **1** | `onboarding` | `div.relative.rounded-2xl:nth-of-type(2) > div.absolute.top-3:nth-of-type(3) > span` | `pages/Onboarding.tsx:358 (GUESS)` |
| **11px** | "18:00 - 19:00" | **1** | `onboarding` | `div.grid.grid-cols-3:nth-of-type(2) > div.p-2.rounded-xl > p.text-\[11px\].font-extrabold` | `pages/Onboarding.tsx:204 (GUESS)` |
| **11px** | "19:00 - 20:00" | **1** | `onboarding` | `div.grid.grid-cols-3:nth-of-type(2) > div.p-2.rounded-xl:nth-of-type(2) > p.text-\[11px\].font-bold` | `pages/Onboarding.tsx:204 (GUESS)` |
| **11px** | "20:00 - 21:00" | **1** | `onboarding` | `div.grid.grid-cols-3:nth-of-type(2) > div.p-2.rounded-xl:nth-of-type(3) > p.text-\[11px\].font-extrabold` | `pages/Onboarding.tsx:204 (GUESS)` |
| **11px** | "Floodlights" | **1** | `onboarding` | `div.space-y-4.animate-fadeIn > div.flex.flex-wrap:nth-of-type(4) > span.px-2\.5.py-1` | `pages/Onboarding.tsx:48 (GUESS)` |
| **11px** | "Showers" | **1** | `onboarding` | `div.space-y-4.animate-fadeIn > div.flex.flex-wrap:nth-of-type(4) > span.px-2\.5.py-1:nth-of-type(2)` | `pages/Onboarding.tsx:393 (GUESS)` |
| **11px** | "Secure Parking" | **1** | `onboarding` | `div.space-y-4.animate-fadeIn > div.flex.flex-wrap:nth-of-type(4) > span.px-2\.5.py-1:nth-of-type(3)` | `pages/Onboarding.tsx:393 (GUESS)` |
| **11px** | "Cafeteria" | **1** | `onboarding` | `div.space-y-4.animate-fadeIn > div.flex.flex-wrap:nth-of-type(4) > span.px-2\.5.py-1:nth-of-type(4)` | `pages/Onboarding.tsx:393 (GUESS)` |
| **11px** | "· Sat 26 Sept" | **1** | `tournament` | `div.flex.items-baseline > div.flex.items-center > span.text-\[11px\].text-text-tertiary:nth-of-type(2)` | `components/home/FootballPitchCard.tsx:156 (GUESS)` |
| **11px** | "upcoming" | **1** | `tournament` | `div.space-y-2 > div.flex.items-baseline > span.text-\[11px\].text-text-tertiary` | `components/home/ActivityFeed.tsx:38 (GUESS)` |
| **11px** | "Group B" | **1** | `tournament` | `div.flex.items-center > div.flex.items-center > span.font-semibold.text-text-secondary` | `components/ui/Button.tsx:52 (GUESS)` |
| **11px** | "Matchday 3 • Group B" | **1** | `tournament` | `div.flex.items-center > div.flex.items-center > span.truncate:nth-of-type(3)` | `components/home/CommunityActivityFeed.tsx:521 (GUESS)` |
| **11px** | "played" | **1** | `tournament` | `div.space-y-2.pt-2:nth-of-type(2) > div.flex.items-baseline > span.text-\[11px\].text-text-tertiary` | `components/home/CommunityActivityFeed.tsx:33 (GUESS)` |
| **11px** | "played" | **1** | `tournament` | `div.space-y-2.pt-2:nth-of-type(3) > div.flex.items-baseline > span.text-\[11px\].text-text-tertiary` | `components/home/CommunityActivityFeed.tsx:33 (GUESS)` |
| **11px** | "Respect • Fair Play • Team Spirit • Grea" | **1** | `tournament` | `div.min-h-screen.w-full > footer.max-w-4xl.mx-auto > p.text-\[11px\].text-text-tertiary:nth-of-type(2)` | `components/ui/Skeleton.tsx:301 (GUESS)` |
| **11px** | "WEHAT Soccer Tournament • Second Edition" | **1** | `tournament` | `div.min-h-screen.w-full > footer.max-w-4xl.mx-auto > p.text-\[11px\].text-text-tertiary:nth-of-type(3)` | `components/home/TournamentBanner.tsx:26 (GUESS)` |
| **11px** | "Browse pitches across Lugogo, Kololo, Na" | **1** | `onboarding` | `div.flex.items-start > div.min-w-0:nth-of-type(2) > p.text-\[11px\].sm\:text-xs` | `pages/Onboarding.tsx:47 (GUESS)` |
| **11px** | "FIFA Synthetic AstroTurf & natural grass" | **1** | `onboarding` | `div.flex.items-start:nth-of-type(2) > div.min-w-0:nth-of-type(2) > p.text-\[11px\].sm\:text-xs` | `pages/Onboarding.tsx:48 (GUESS)` |
| **11px** | "Instant view of open, held, and peak mat" | **1** | `onboarding` | `div.flex.items-start:nth-of-type(3) > div.min-w-0:nth-of-type(2) > p.text-\[11px\].sm\:text-xs` | `pages/Onboarding.tsx:243 (GUESS)` |
| **11.5px** | "Log In" | **1** | `auth` | `div.p-4.sm\:p-5:nth-of-type(2) > div.flex.gap-2 > button.flex-1.py-2\.5` | `pages/Auth.tsx:24 (GUESS)` |
| **11.5px** | "Register" | **1** | `auth` | `div.p-4.sm\:p-5:nth-of-type(2) > div.flex.gap-2 > button.flex-1.py-2\.5:nth-of-type(2)` | `pages/Auth.tsx:196 (GUESS)` |

### Rank 5: Clipped / Truncated Text Elements (scrollWidth > clientWidth)
*Elements with text truncated by overflow without wrapping, risking cut-off information on narrow viewports.*

| Clipped Text | Dimensions (scrollW vs clientW) | Pages Count | Pages List | Selector | Best-Guess Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| "https://ais-pre-e35syz3bvfqlhjdx424sss-24895992886" | 568px scrollW > 293px clientW | **1** | `install` | `div.flex.flex-col:nth-of-type(2) > div.mt-3\.5.w-full:nth-of-type(2) > span.font-mono.text-\[11px\]` | `pages/Install.tsx:228 (GUESS)` |
| "Mark Jordan, Magala Hassan, Walusimbi, Ssempijja, " | 290px scrollW > 197px clientW | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(3) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| "David (2), Walele Tabani, Ssembatya Sharif, Bogere" | 263px scrollW > 197px clientW | **1** | `tournament` | `div.rounded-xl.border:nth-of-type(5) > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1:nth-of-type(2)` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |
| "Raymond Junior, Kavuma Dennis, Isaac" | 185px scrollW > 151px clientW | **1** | `tournament` | `div.rounded-xl.border > div.mt-2.pt-1\.5:nth-of-type(3) > span.truncate.flex-1` | `components/ui/PitchAvailabilitySlot.tsx:39 (GUESS)` |

### Rank 6: Price Text Typography & Tabular Numbers
*Elements containing currency/rate ("UGX", "/hr", "/ hr"). Rule: font size must be ≥ 14px on phone, ≥ 12px anywhere, with tabular numbers enabled to prevent layout jitter.*

| Price Text | Computed Font Size | Uses Tabular Numbers | Font Family | Pages List | Selector | Best-Guess Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| "UGX 120,000 / hr" | 12px (< 14px phone warning) | ⚠️ NO | Plus Jakarta Sans | `onboarding` | `div.space-y-2:nth-of-type(3) > div.flex.items-center > span.font-extrabold.text-primary-lime:nth-of-type(2)` | `pages/Onboarding.tsx:226 (GUESS)` |

### Rank 7: Pitch Card Images & Aspect Ratios
*Pitch card images evaluated for aspect ratio consistency and broken image links (naturalWidth === 0).*

| Image Selector | Aspect Ratio | Dimensions | Broken? | Pages List | Best-Guess Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `div.flex.flex-col:nth-of-type(2) > div.p-4.bg-white > img.w-48.h-48` | 1.00 | 224x224 | ✅ OK | `install` | `pages/Install.tsx:228 (GUESS)` |
| `div.space-y-4.animate-fadeIn > div.relative.rounded-2xl:nth-of-type(2) > img.w-full.h-full` | 1.78 | 488x274 | ⚠️ BROKEN (naturalWidth === 0) | `onboarding` | `pages/Onboarding.tsx:330 (GUESS)` |

---

## 5. Raw Data Files Generated in `/ui-audit/raw/` (48 files)

- `auth_1280_dark.json`
- `auth_1280_light.json`
- `auth_360_dark.json`
- `auth_360_light.json`
- `auth_390_dark.json`
- `auth_390_light.json`
- `auth_768_dark.json`
- `auth_768_light.json`
- `install_1280_dark.json`
- `install_1280_light.json`
- `install_360_dark.json`
- `install_360_light.json`
- `install_390_dark.json`
- `install_390_light.json`
- `install_768_dark.json`
- `install_768_light.json`
- `onboarding_1280_dark.json`
- `onboarding_1280_light.json`
- `onboarding_360_dark.json`
- `onboarding_360_light.json`
- `onboarding_390_dark.json`
- `onboarding_390_light.json`
- `onboarding_768_dark.json`
- `onboarding_768_light.json`
- `teams-join_1280_dark.json`
- `teams-join_1280_light.json`
- `teams-join_360_dark.json`
- `teams-join_360_light.json`
- `teams-join_390_dark.json`
- `teams-join_390_light.json`
- `teams-join_768_dark.json`
- `teams-join_768_light.json`
- `tournament_1280_dark.json`
- `tournament_1280_light.json`
- `tournament_360_dark.json`
- `tournament_360_light.json`
- `tournament_390_dark.json`
- `tournament_390_light.json`
- `tournament_768_dark.json`
- `tournament_768_light.json`
- `welcome-back_1280_dark.json`
- `welcome-back_1280_light.json`
- `welcome-back_360_dark.json`
- `welcome-back_360_light.json`
- `welcome-back_390_dark.json`
- `welcome-back_390_light.json`
- `welcome-back_768_dark.json`
- `welcome-back_768_light.json`
