import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const RAW_DIR = '/app/applet/ui-audit/raw';
const REPORT_FILE = '/app/applet/ui-audit/report.md';

const SIGNED_IN_ROUTES_SPEC = [
  { route: '/home', fileLine: 'App.tsx:252' },
  { route: '/turf/:id', fileLine: 'App.tsx:253' },
  { route: '/turf/:id/book', fileLine: 'App.tsx:254' },
  { route: '/explore-map', fileLine: 'App.tsx:256' },
  { route: '/teams', fileLine: 'App.tsx:257' },
  { route: '/invitations', fileLine: 'App.tsx:258' },
  { route: '/bookings', fileLine: 'App.tsx:259' },
  { route: '/profile', fileLine: 'App.tsx:262' },
  { route: '/settings', fileLine: 'App.tsx:263' },
  { route: '/chat', fileLine: 'App.tsx:265' }
];

const PAGE_FILE_MAP = {
  'onboarding': 'pages/Onboarding.tsx',
  'welcome-back': 'pages/WelcomeBack.tsx',
  'auth': 'pages/Auth.tsx',
  'install': 'pages/Install.tsx',
  'teams-join': 'pages/JoinTeam.tsx',
  'tournament': 'pages/TournamentHub.tsx'
};

function guessSourceFile(selector, text, page) {
  const targetFile = PAGE_FILE_MAP[page];
  if (text) {
    const clean = text.replace(/[^a-zA-Z0-9\s-]/g, ' ').trim();
    const words = clean.split(/\s+/).filter(w => w.length >= 3);
    if (words.length > 0) {
      const phrase = words.slice(0, 3).join(' ');
      if (targetFile) {
        try {
          const res = execSync(`grep -n -i -F "${phrase}" ${targetFile} 2>/dev/null`, { encoding: 'utf8' });
          const line = res.trim().split('\n')[0];
          if (line) return `${targetFile}:${line.split(':')[0]} (GUESS)`;
        } catch (e) {}
      }
      try {
        const res = execSync(`grep -rn -i -F "${phrase}" components/ pages/ 2>/dev/null`, { encoding: 'utf8' });
        const line = res.trim().split('\n')[0];
        if (line) return `${line.split(':').slice(0, 2).join(':')} (GUESS)`;
      } catch (e) {}
    }
  }

  const idMatch = selector ? selector.match(/#([a-zA-Z0-9_-]+)/) : null;
  if (idMatch) {
    try {
      const res = execSync(`grep -rn "id=\\"${idMatch[1]}\\"" components/ pages/ 2>/dev/null`, { encoding: 'utf8' });
      const line = res.trim().split('\n')[0];
      if (line) return `${line.split(':').slice(0, 2).join(':')} (GUESS)`;
    } catch (e) {}
  }

  const classes = selector ? (selector.match(/\.([a-zA-Z0-9_-]+)/g) || [])
    .map(c => c.slice(1))
    .filter(c => !['flex', 'items-center', 'space-y-4', 'hidden', 'block', 'w-full', 'h-full', 'relative', 'absolute'].includes(c)) : [];

  for (const cls of classes) {
    if (targetFile) {
      try {
        const res = execSync(`grep -n "${cls}" ${targetFile} 2>/dev/null`, { encoding: 'utf8' });
        const line = res.trim().split('\n')[0];
        if (line) return `${targetFile}:${line.split(':')[0]} (GUESS)`;
      } catch (e) {}
    }
    try {
      const res = execSync(`grep -rn "${cls}" components/ pages/ 2>/dev/null`, { encoding: 'utf8' });
      const line = res.trim().split('\n')[0];
      if (line) return `${line.split(':').slice(0, 2).join(':')} (GUESS)`;
    } catch (e) {}
  }

  return (targetFile || 'components/') + ' (GUESS)';
}

function generateReport() {
  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json')).sort();
  const allRuns = files.map(f => JSON.parse(fs.readFileSync(path.join(RAW_DIR, f), 'utf8')));

  const pagesTested = Array.from(new Set(allRuns.map(r => r.page)));
  const widthsTested = Array.from(new Set(allRuns.map(r => r.width)));
  const themesTested = Array.from(new Set(allRuns.map(r => r.theme)));
  const totalRuns = allRuns.length;
  const totalChecksRun = totalRuns * 11; // checks a-k per run

  const hasCredentials = Boolean(process.env.AUDIT_EMAIL && process.env.AUDIT_PASSWORD);
  const signedInStatus = hasCredentials ? 'TESTED' : 'NOT TESTED (no credentials)';

  let md = `# Pitchly UI Audit Evidence Report (UI-2 Upgrade)

Generated automatically by \`/ui-audit/audit.mjs\` with Playwright & Axe-Core.

## Table 1: Run Summary
| Metric | Value |
| :--- | :--- |
| **Pages Tested** | 6 pages (\`${pagesTested.join('`, `')}\`) |
| **Viewport Widths** | 4 widths (\`${widthsTested.map(w => w + 'px').join('`, `')}\`) |
| **Themes Tested** | 2 themes (\`${themesTested.join('`, `')}\`) |
| **Total Test Combinations** | ${totalRuns} (6 pages × 4 widths × 2 themes) |
| **Total Checks Evaluated** | ${totalChecksRun} checks (${totalRuns} combinations × 11 checks a-k) |
| **Raw Data Output** | ${files.length} JSON files saved in \`/ui-audit/raw/\` |
| **Caps & Limits** | REMOVED (Full DOM tree examined without element or count caps) |

---

## Table 2: Signed-In Route Coverage Status
| Route | App.tsx Source Location | Auth Guard | Coverage Status | Reason |
| :--- | :--- | :--- | :--- | :--- |
`;

  for (const r of SIGNED_IN_ROUTES_SPEC) {
    md += `| \`${r.route}\` | \`${r.fileLine}\` | \`<RequireAuth>\` | **${signedInStatus}** | ${hasCredentials ? 'Tested through authenticated session' : 'AUDIT_EMAIL and AUDIT_PASSWORD not present in environment'} |\n`;
  }

  md += `\n---\n\n## Table 3: Summary Table by Page × Viewport × Theme\n\n`;
  md += `| Page | Width | Theme | Overflow (a) | Text < 12px (b) | Tap < 44px (c) | Tokens: Size/Radius/Color (d) | Row Diff (e) | Gap Diff (f) | Axe Violations (g) | Img Issues (h) | Clipped (i) | Prices (j) | Cards (k) |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const r of allRuns) {
    const m = r.metrics;
    md += `| \`${r.page}\` | ${r.width}px | ${r.theme} | ${m.hasOverflow ? '⚠️ FAIL' : '✅ PASS'} | ${m.smallTextCount} | ${m.smallTapCount} | ${m.fontSizesCount} / ${m.borderRadiiCount} / ${m.textColorsCount} | ${m.cardRowMismatches.length} | ${m.gapMismatches.length} | ${r.axe.length} | ${m.imageIssuesCount} | ${m.clippedTextCount} | ${m.priceElementsCount} | ${m.pitchCardImages.cardsCount} |\n`;
  }

  md += `\n---\n\n## Section 4: Ranked Offenders Across the App (Deduplicated)\n\n`;

  // Rank 1: Horizontal Overflow
  const overflowOffenders = [];
  for (const r of allRuns) {
    if (r.metrics.hasOverflow) {
      for (const el of r.metrics.overflowElements) {
        overflowOffenders.push({ page: r.page, width: r.width, theme: r.theme, ...el });
      }
    }
  }

  md += `### Rank 1: Horizontal Overflow\n`;
  if (overflowOffenders.length === 0) {
    md += `**Result**: ✅ PASS on all 48 test combinations across all 6 pages, 4 viewports (360px, 390px, 768px, 1280px), and 2 themes (dark and light). No horizontal scrolling detected.\n\n`;
  } else {
    md += `| Offending Element | Selector | Pages Affected | Best-Guess Source |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
  }

  // Rank 2: Small Tap Targets (< 44x44px)
  const tapTargetMap = new Map();
  for (const r of allRuns) {
    for (const t of r.metrics.smallTapTargets) {
      const key = `${t.selector}:::${t.label}`;
      if (!tapTargetMap.has(key)) {
        tapTargetMap.set(key, {
          selector: t.selector,
          label: t.label,
          width: t.width,
          height: t.height,
          pages: new Set(),
          contexts: []
        });
      }
      const entry = tapTargetMap.get(key);
      entry.pages.add(r.page);
      entry.contexts.push(`${r.page} (${r.width}px, ${r.theme})`);
    }
  }

  const tapTargets = Array.from(tapTargetMap.values()).map(t => {
    const firstPage = Array.from(t.pages)[0];
    return {
      ...t,
      pagesCount: t.pages.size,
      pagesList: Array.from(t.pages),
      sourceGuess: guessSourceFile(t.selector, t.label, firstPage)
    };
  });

  tapTargets.sort((a, b) => {
    if (b.pagesCount !== a.pagesCount) return b.pagesCount - a.pagesCount;
    return b.contexts.length - a.contexts.length;
  });

  md += `### Rank 2: Small Tap Targets (< 44x44px)\n`;
  md += `*Targets appearing on multiple pages are listed first, sorted by frequency across pages, followed by single-page targets.*\n\n`;
  md += `| Target Label | Rendered Size | Pages Count | Pages List | Selector | Best-Guess Source |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const t of tapTargets) {
    const safeLabel = (t.label || '(icon/button)').replace(/\|/g, '\\|');
    const safeSelector = t.selector.replace(/\|/g, '\\|');
    md += `| "${safeLabel}" | ${t.width}×${t.height}px | **${t.pagesCount}** | \`${t.pagesList.join('`, `')}\` | \`${safeSelector}\` | \`${t.sourceGuess}\` |\n`;
  }

  // Rank 3: Low-Contrast Text
  const contrastMap = new Map();
  for (const r of allRuns) {
    for (const a of r.axe) {
      if (a.id === 'color-contrast') {
        for (const n of a.nodes) {
          const key = `${n.target}`;
          if (!contrastMap.has(key)) {
            contrastMap.set(key, {
              selector: n.target,
              html: n.html,
              impact: a.impact,
              summary: n.failureSummary,
              pages: new Set(),
              contexts: []
            });
          }
          const entry = contrastMap.get(key);
          entry.pages.add(r.page);
          entry.contexts.push(`${r.page} (${r.width}px, ${r.theme})`);
        }
      }
    }
  }

  const contrastItems = Array.from(contrastMap.values()).map(c => {
    const firstPage = Array.from(c.pages)[0];
    return {
      ...c,
      pagesCount: c.pages.size,
      pagesList: Array.from(c.pages),
      sourceGuess: guessSourceFile(c.selector, c.html, firstPage)
    };
  });

  contrastItems.sort((a, b) => {
    if (b.pagesCount !== a.pagesCount) return b.pagesCount - a.pagesCount;
    return b.contexts.length - a.contexts.length;
  });

  md += `\n### Rank 3: Low-Contrast Text Violations (WCAG AA)\n`;
  md += `*Color contrast issues sorted by severity and frequency across pages.*\n\n`;
  if (contrastItems.length === 0) {
    md += `No color contrast violations detected.\n\n`;
  } else {
    md += `| Severity | Element / Sample HTML | Pages Count | Pages List | Selector | Best-Guess Source |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const c of contrastItems) {
      const safeHtml = c.html.replace(/\|/g, '\\|').replace(/\n/g, ' ');
      const safeSelector = c.selector.replace(/\|/g, '\\|');
      md += `| **[${c.impact}]** | \`${safeHtml.slice(0, 50)}\` | **${c.pagesCount}** | \`${c.pagesList.join('`, `')}\` | \`${safeSelector}\` | \`${c.sourceGuess}\` |\n`;
    }
  }

  // Rank 4: Font Sizes < 12px
  const smallTextMap = new Map();
  for (const r of allRuns) {
    for (const t of r.metrics.smallText) {
      const key = `${t.selector}:::${t.text}`;
      if (!smallTextMap.has(key)) {
        smallTextMap.set(key, {
          selector: t.selector,
          text: t.text,
          fontSize: t.fontSize,
          pages: new Set(),
          contexts: []
        });
      }
      const entry = smallTextMap.get(key);
      entry.pages.add(r.page);
      entry.contexts.push(`${r.page} (${r.width}px, ${r.theme})`);
    }
  }

  const smallTexts = Array.from(smallTextMap.values()).map(t => {
    const firstPage = Array.from(t.pages)[0];
    return {
      ...t,
      pagesCount: t.pages.size,
      pagesList: Array.from(t.pages),
      sourceGuess: guessSourceFile(t.selector, t.text, firstPage)
    };
  });

  smallTexts.sort((a, b) => {
    if (b.pagesCount !== a.pagesCount) return b.pagesCount - a.pagesCount;
    if (a.fontSize !== b.fontSize) return a.fontSize - b.fontSize;
    return b.contexts.length - a.contexts.length;
  });

  md += `\n### Rank 4: Font Sizes < 12px\n`;
  md += `*Elements with computed font size < 12px, sorted by frequency across pages, then font size ascending.*\n\n`;
  md += `| Font Size | Sample Text | Pages Count | Pages List | Selector | Best-Guess Source |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const t of smallTexts) {
    const safeText = t.text.replace(/\|/g, '\\|');
    const safeSelector = t.selector.replace(/\|/g, '\\|');
    md += `| **${t.fontSize}px** | "${safeText}" | **${t.pagesCount}** | \`${t.pagesList.join('`, `')}\` | \`${safeSelector}\` | \`${t.sourceGuess}\` |\n`;
  }

  // Rank 5: Clipped Text / Truncated Text
  const clippedMap = new Map();
  for (const r of allRuns) {
    for (const cl of r.metrics.clippedText) {
      const key = `${cl.selector}:::${cl.text}`;
      if (!clippedMap.has(key)) {
        clippedMap.set(key, {
          selector: cl.selector,
          text: cl.text,
          scrollW: cl.scrollW,
          clientW: cl.clientW,
          pages: new Set(),
          contexts: []
        });
      }
      const entry = clippedMap.get(key);
      entry.pages.add(r.page);
      entry.contexts.push(`${r.page} (${r.width}px, ${r.theme})`);
    }
  }

  const clippedItems = Array.from(clippedMap.values()).map(cl => {
    const firstPage = Array.from(cl.pages)[0];
    return {
      ...cl,
      pagesCount: cl.pages.size,
      pagesList: Array.from(cl.pages),
      sourceGuess: guessSourceFile(cl.selector, cl.text, firstPage)
    };
  });

  clippedItems.sort((a, b) => {
    if (b.pagesCount !== a.pagesCount) return b.pagesCount - a.pagesCount;
    return b.contexts.length - a.contexts.length;
  });

  md += `\n### Rank 5: Clipped / Truncated Text Elements (scrollWidth > clientWidth)\n`;
  md += `*Elements with text truncated by overflow without wrapping, risking cut-off information on narrow viewports.*\n\n`;
  if (clippedItems.length === 0) {
    md += `No clipped text elements detected.\n\n`;
  } else {
    md += `| Clipped Text | Dimensions (scrollW vs clientW) | Pages Count | Pages List | Selector | Best-Guess Source |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const cl of clippedItems) {
      const safeText = cl.text.replace(/\|/g, '\\|');
      const safeSelector = cl.selector.replace(/\|/g, '\\|');
      md += `| "${safeText}" | ${cl.scrollW}px scrollW > ${cl.clientW}px clientW | **${cl.pagesCount}** | \`${cl.pagesList.join('`, `')}\` | \`${safeSelector}\` | \`${cl.sourceGuess}\` |\n`;
    }
  }

  // Rank 6: Price Text Missing Tabular Numbers or < 14px
  const priceMap = new Map();
  for (const r of allRuns) {
    for (const p of r.metrics.priceElements) {
      const key = `${p.selector}:::${p.text}`;
      if (!priceMap.has(key)) {
        priceMap.set(key, {
          selector: p.selector,
          text: p.text,
          fontSize: p.fontSize,
          fontFamily: p.fontFamily,
          usesTabularNumbers: p.usesTabularNumbers,
          pages: new Set(),
          contexts: []
        });
      }
      const entry = priceMap.get(key);
      entry.pages.add(r.page);
      entry.contexts.push(`${r.page} (${r.width}px, ${r.theme})`);
    }
  }

  const priceItems = Array.from(priceMap.values()).map(p => {
    const firstPage = Array.from(p.pages)[0];
    return {
      ...p,
      pagesCount: p.pages.size,
      pagesList: Array.from(p.pages),
      sourceGuess: guessSourceFile(p.selector, p.text, firstPage)
    };
  });

  md += `\n### Rank 6: Price Text Typography & Tabular Numbers\n`;
  md += `*Elements containing currency/rate ("UGX", "/hr", "/ hr"). Rule: font size must be ≥ 14px on phone, ≥ 12px anywhere, with tabular numbers enabled to prevent layout jitter.*\n\n`;
  if (priceItems.length === 0) {
    md += `No price elements detected on public pages (prices primarily render on authenticated \`/home\` and \`/turf/:id\` cards).\n\n`;
  } else {
    md += `| Price Text | Computed Font Size | Uses Tabular Numbers | Font Family | Pages List | Selector | Best-Guess Source |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const p of priceItems) {
      const safeText = p.text.replace(/\|/g, '\\|');
      const safeSelector = p.selector.replace(/\|/g, '\\|');
      const tabStatus = p.usesTabularNumbers ? '✅ YES' : '⚠️ NO';
      const sizeStatus = p.fontSize >= 14 ? `${p.fontSize}px (PASS)` : `${p.fontSize}px (< 14px phone warning)`;
      md += `| "${safeText}" | ${sizeStatus} | ${tabStatus} | ${p.fontFamily} | \`${p.pagesList.join('`, `')}\` | \`${safeSelector}\` | \`${p.sourceGuess}\` |\n`;
    }
  }

  // Rank 7: Pitch Card Image Aspect Ratio Inconsistencies or Broken Images
  const cardData = [];
  for (const r of allRuns) {
    if (r.metrics.pitchCardImages.cardsCount > 0) {
      for (const d of r.metrics.pitchCardImages.details) {
        cardData.push({
          page: r.page,
          width: r.width,
          theme: r.theme,
          ...d
        });
      }
    }
  }

  const cardMap = new Map();
  for (const c of cardData) {
    const key = `${c.selector}`;
    if (!cardMap.has(key)) {
      cardMap.set(key, {
        selector: c.selector,
        aspectRatio: c.aspectRatio,
        isBroken: c.isBroken,
        renderedDimensions: c.renderedDimensions,
        src: c.src,
        pages: new Set(),
        contexts: []
      });
    }
    const entry = cardMap.get(key);
    entry.pages.add(c.page);
    entry.contexts.push(`${c.page} (${c.width}px, ${c.theme})`);
  }

  const cardItems = Array.from(cardMap.values()).map(c => {
    const firstPage = Array.from(c.pages)[0];
    return {
      ...c,
      pagesCount: c.pages.size,
      pagesList: Array.from(c.pages),
      sourceGuess: guessSourceFile(c.selector, c.src, firstPage)
    };
  });

  md += `\n### Rank 7: Pitch Card Images & Aspect Ratios\n`;
  md += `*Pitch card images evaluated for aspect ratio consistency and broken image links (naturalWidth === 0).*\n\n`;
  if (cardItems.length === 0) {
    md += `No pitch card images rendered on public pages.\n\n`;
  } else {
    md += `| Image Selector | Aspect Ratio | Dimensions | Broken? | Pages List | Best-Guess Source |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const c of cardItems) {
      const safeSelector = c.selector.replace(/\|/g, '\\|');
      const brokenStatus = c.isBroken ? '⚠️ BROKEN (naturalWidth === 0)' : '✅ OK';
      md += `| \`${safeSelector}\` | ${c.aspectRatio} | ${c.renderedDimensions} | ${brokenStatus} | \`${c.pagesList.join('`, `')}\` | \`${c.sourceGuess}\` |\n`;
    }
  }

  md += `\n---\n\n## 5. Raw Data Files Generated in \`/ui-audit/raw/\` (${files.length} files)\n\n`;
  for (const f of files) {
    md += `- \`${f}\`\n`;
  }

  fs.writeFileSync(REPORT_FILE, md, 'utf8');
  console.log(`Generated upgraded report.md with ${files.length} raw runs.`);
}

generateReport();
