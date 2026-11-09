import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const RAW_DIR = path.resolve('ui-audit/raw');
const SCREENSHOT_DIR = path.resolve('ui-audit/screenshots');
const REPORT_FILE = path.resolve('ui-audit/report.md');

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const PAGE_FILE_MAP = {
  'onboarding': 'pages/Onboarding.tsx',
  'welcome-back': 'pages/WelcomeBack.tsx',
  'auth': 'pages/Auth.tsx',
  'install': 'pages/Install.tsx',
  'teams-join': 'pages/JoinTeam.tsx',
  'tournament': 'pages/TournamentHub.tsx',
  'home': 'pages/Home.tsx',
  'turf-detail': 'pages/TurfDetail.tsx',
  'turf-book': 'pages/BookPitch.tsx',
  'bookings': 'pages/Bookings.tsx',
  'profile': 'pages/Profile.tsx',
  'settings': 'pages/Settings.tsx',
  'teams': 'pages/Teams.tsx',
  'invitations': 'pages/Invitations.tsx',
  'chat': 'pages/ChatList.tsx',
  'explore-map': 'pages/ExploreMap.tsx'
};

const SIGNED_IN_ROUTES_SPEC = [
  { name: 'home', route: '/home', fileLine: 'App.tsx:252' },
  { name: 'turf-detail', route: '/turf/:id', fileLine: 'App.tsx:253' },
  { name: 'turf-book', route: '/turf/:id/book', fileLine: 'App.tsx:254' },
  { name: 'bookings', route: '/bookings', fileLine: 'App.tsx:259' },
  { name: 'profile', route: '/profile', fileLine: 'App.tsx:262' },
  { name: 'settings', route: '/settings', fileLine: 'App.tsx:263' },
  { name: 'teams', route: '/teams', fileLine: 'App.tsx:257' },
  { name: 'invitations', route: '/invitations', fileLine: 'App.tsx:258' },
  { name: 'chat', route: '/chat', fileLine: 'App.tsx:265' },
  { name: 'explore-map', route: '/explore-map', fileLine: 'App.tsx:256' }
];

const PUBLIC_PAGES = [
  {
    name: 'onboarding',
    route: '/#/onboarding'
  },
  {
    name: 'welcome-back',
    route: '/#/welcome-back',
    initStorage: {
      pitchly_last_user: JSON.stringify({
        id: 'player_test_1',
        name: 'Alex Mukasa',
        email: 'alex.mukasa@example.com',
        role: 'PLAYER',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
      })
    }
  },
  {
    name: 'auth',
    route: '/#/auth'
  },
  {
    name: 'install',
    route: '/#/install'
  },
  {
    name: 'teams-join',
    route: '/#/teams/join'
  },
  {
    name: 'tournament',
    route: '/#/tournament/wehat-s2-w2'
  }
];

const WIDTHS = [360, 390, 768, 1280];
const THEMES = ['dark', 'light'];

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

  const idMatch = selector.match(/#([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    try {
      const res = execSync(`grep -rn "id=\\"${idMatch[1]}\\"" components/ pages/ 2>/dev/null`, { encoding: 'utf8' });
      const line = res.trim().split('\n')[0];
      if (line) return `${line.split(':').slice(0, 2).join(':')} (GUESS)`;
    } catch (e) {}
  }

  const classes = (selector.match(/\.([a-zA-Z0-9_-]+)/g) || [])
    .map(c => c.slice(1))
    .filter(c => !['flex', 'items-center', 'space-y-4', 'hidden', 'block', 'w-full', 'h-full', 'relative', 'absolute'].includes(c));

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

async function auditPage(page, viewWidth, themeName) {
  // Execute checks in browser context (UNCAPPED)
  const domMetrics = await page.evaluate(({ viewWidth }) => {
    function getClassNameString(el) {
      if (!el || !el.className) return '';
      if (typeof el.className === 'string') return el.className;
      if (typeof el.className.baseVal === 'string') return el.className.baseVal;
      return '';
    }

    function getSelector(el) {
      if (!el || el.nodeType !== 1) return '';
      if (el.id) return `#${el.id}`;
      const pathParts = [];
      let curr = el;
      while (curr && curr.nodeType === 1 && curr.tagName.toLowerCase() !== 'body' && curr.tagName.toLowerCase() !== 'html') {
        const tag = curr.tagName.toLowerCase();
        const classStr = getClassNameString(curr).trim();
        let cls = '';
        if (classStr) {
          cls = '.' + classStr.split(/\s+/).slice(0, 2).map(c => c.replace(/[^a-zA-Z0-9_-]/g, '\\$&')).join('.');
        }
        let idx = 1;
        let sib = curr.previousElementSibling;
        while (sib) {
          if (sib.tagName === curr.tagName) idx++;
          sib = sib.previousElementSibling;
        }
        const nth = idx > 1 ? `:nth-of-type(${idx})` : '';
        pathParts.unshift(tag + cls + nth);
        curr = curr.parentElement;
        if (pathParts.length >= 3) break;
      }
      return pathParts.join(' > ');
    }

    // a) Horizontal overflow
    const docScrollWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body ? document.body.scrollWidth : 0
    );
    const hasOverflow = docScrollWidth > viewWidth + 1;
    const overflowElements = [];
    if (hasOverflow) {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const rect = el.getBoundingClientRect();
        if (rect.right > viewWidth + 1 && rect.width > 0) {
          overflowElements.push({
            selector: getSelector(el),
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          });
        }
      }
    }

    // b) Text smaller than 12px (UNCAPPED)
    const smallTextItems = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const text = n.nodeValue ? n.nodeValue.trim() : '';
      if (!text || text.length < 2) continue;
      const parent = n.parentElement;
      if (!parent) continue;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'svg', 'noscript'].includes(tag)) continue;
      const style = window.getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const fs = parseFloat(style.fontSize);
      if (fs > 0 && fs < 12.0) {
        smallTextItems.push({
          selector: getSelector(parent),
          fontSize: Math.round(fs * 10) / 10,
          text: text.slice(0, 40)
        });
      }
    }
    const uniqueSmallText = [];
    const seenTextSelectors = new Set();
    for (const item of smallTextItems) {
      if (!seenTextSelectors.has(item.selector)) {
        seenTextSelectors.add(item.selector);
        uniqueSmallText.push(item);
      }
    }

    // c) Tap targets smaller than 44x44px (UNCAPPED)
    const tapElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"]');
    const smallTapTargets = [];
    for (const el of tapElements) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.width < 44 || rect.height < 44) {
        const label = el.getAttribute('aria-label') || el.innerText || el.getAttribute('value') || el.getAttribute('placeholder') || el.tagName.toLowerCase();
        smallTapTargets.push({
          selector: getSelector(el),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          label: label.trim().slice(0, 30)
        });
      }
    }

    // d) Distinct font sizes, font families, border radii, text colors (UNCAPPED)
    const fontSizes = new Set();
    const fontFamilies = new Set();
    const borderRadii = new Set();
    const textColors = new Set();
    const allVisible = document.querySelectorAll('*');
    for (const el of allVisible) {
      const s = window.getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      if (s.fontSize) fontSizes.add(Math.round(parseFloat(s.fontSize) * 10) / 10 + 'px');
      if (s.fontFamily) {
        const primaryFont = s.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
        fontFamilies.add(primaryFont);
      }
      if (s.borderRadius && s.borderRadius !== '0px') borderRadii.add(s.borderRadius);
      if (s.color) textColors.add(s.color);
    }

    // e) Card rows where sibling cards differ in height or top offset > 2px (UNCAPPED)
    const cardRowMismatches = [];
    const potentialParents = document.querySelectorAll('div, section, ul');
    for (const parent of potentialParents) {
      const children = Array.from(parent.children).filter(c => {
        const r = c.getBoundingClientRect();
        const s = window.getComputedStyle(c);
        const classNameStr = getClassNameString(c);
        const isCardLike = s.borderRadius !== '0px' || s.borderWidth !== '0px' || s.boxShadow !== 'none' || classNameStr.includes('card') || classNameStr.includes('rounded');
        return r.width > 60 && r.height > 40 && s.display !== 'none' && isCardLike;
      });
      if (children.length >= 2) {
        for (let i = 0; i < children.length - 1; i++) {
          const r1 = children[i].getBoundingClientRect();
          const r2 = children[i + 1].getBoundingClientRect();
          const topDiff = Math.abs(r1.top - r2.top);
          if (topDiff <= 12) {
            const heightDiff = Math.abs(r1.height - r2.height);
            if (heightDiff > 2 || (topDiff > 2 && topDiff <= 12)) {
              cardRowMismatches.push({
                parentSelector: getSelector(parent),
                item1: `${getSelector(children[i])} (h:${Math.round(r1.height)}, top:${Math.round(r1.top)})`,
                item2: `${getSelector(children[i+1])} (h:${Math.round(r2.height)}, top:${Math.round(r2.top)})`,
                heightDiff: Math.round(heightDiff),
                topDiff: Math.round(topDiff)
              });
            }
          }
        }
      }
    }

    // f) Gaps between sibling cards that are not equal (UNCAPPED)
    const gapMismatches = [];
    for (const parent of potentialParents) {
      const children = Array.from(parent.children).filter(c => {
        const r = c.getBoundingClientRect();
        const s = window.getComputedStyle(c);
        return r.width > 40 && r.height > 40 && s.display !== 'none';
      });
      if (children.length >= 3) {
        const horizontal = [];
        for (let i = 0; i < children.length - 1; i++) {
          const r1 = children[i].getBoundingClientRect();
          const r2 = children[i + 1].getBoundingClientRect();
          if (Math.abs(r1.top - r2.top) < 8) {
            const gap = r2.left - r1.right;
            if (gap >= 0) horizontal.push(gap);
          }
        }
        if (horizontal.length >= 2) {
          const maxGap = Math.max(...horizontal);
          const minGap = Math.min(...horizontal);
          if (maxGap - minGap > 2) {
            gapMismatches.push({
              parentSelector: getSelector(parent),
              gaps: horizontal.map(g => Math.round(g)),
              diff: Math.round(maxGap - minGap)
            });
          }
        }
      }
    }

    // h) Images without alt text or with no fixed aspect ratio (UNCAPPED)
    const imageIssues = [];
    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
      const r = img.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const alt = img.getAttribute('alt');
      const hasAlt = alt !== null && alt.trim() !== '';
      const style = window.getComputedStyle(img);
      const hasExplicitAspect = style.aspectRatio !== 'auto' ||
        (img.hasAttribute('width') && img.hasAttribute('height'));
      if (!hasAlt || !hasExplicitAspect) {
        imageIssues.push({
          selector: getSelector(img),
          src: (img.src || '').slice(0, 60),
          missingAlt: !hasAlt,
          missingFixedAspect: !hasExplicitAspect
        });
      }
    }

    // i) Elements clipped by overflow:hidden that contain text (UNCAPPED)
    const clippedTextElements = [];
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const s = window.getComputedStyle(el);
      if (s.overflow === 'hidden' || s.overflowX === 'hidden' || s.overflowY === 'hidden') {
        const hasDirectText = Array.from(el.childNodes).some(cn => cn.nodeType === Node.TEXT_NODE && cn.nodeValue.trim().length > 0);
        if (hasDirectText) {
          const isHorizClipped = el.scrollWidth > el.clientWidth + 2;
          const isVertClipped = el.scrollHeight > el.clientHeight + 2;
          if (isHorizClipped || isVertClipped) {
            clippedTextElements.push({
              selector: getSelector(el),
              scrollW: el.scrollWidth,
              clientW: el.clientWidth,
              scrollH: el.scrollHeight,
              clientH: el.clientHeight,
              text: (el.innerText || '').slice(0, 50)
            });
          }
        }
      }
    }

    // j) Price text check (UGX, /hr, / hr)
    const priceElements = [];
    const priceRegex = /(UGX|\/hr|\/\s*hr)/i;
    const priceWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let ptNode;
    const seenPriceParents = new Set();
    while ((ptNode = priceWalker.nextNode())) {
      const textVal = ptNode.nodeValue ? ptNode.nodeValue.trim() : '';
      if (priceRegex.test(textVal)) {
        const parent = ptNode.parentElement;
        if (parent && !seenPriceParents.has(parent)) {
          seenPriceParents.add(parent);
          const style = window.getComputedStyle(parent);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            const fontVarNum = style.fontVariantNumeric || '';
            const fontFeat = style.fontFeatureSettings || '';
            const fontFam = style.fontFamily || '';
            const isTabular = fontVarNum.includes('tabular-nums') ||
                              fontFeat.includes('tnum') ||
                              fontFam.toLowerCase().includes('mono');
            priceElements.push({
              selector: getSelector(parent),
              text: parent.innerText ? parent.innerText.trim().slice(0, 50) : textVal.slice(0, 50),
              fontSize: Math.round(parseFloat(style.fontSize) * 10) / 10,
              fontFamily: fontFam.split(',')[0].replace(/['"]/g, '').trim(),
              usesTabularNumbers: isTabular
            });
          }
        }
      }
    }

    // k) Pitch card images check
    const pitchCards = document.querySelectorAll(
      '.group[class*="rounded-2xl"], [class*="FootballPitchCard"], [class*="PitchCard"], div[class*="rounded-2xl"][class*="border"]'
    );
    const pitchCardDetails = [];
    const aspectRatios = new Set();
    let brokenCount = 0;

    for (const card of pitchCards) {
      const img = card.querySelector('img');
      const placeholder = card.querySelector('[class*="PhotoPlaceholder"], svg[class*="lucide-image"]');
      if (img) {
        const rect = img.getBoundingClientRect();
        if (rect.width > 20 && rect.height > 20) {
          const isBroken = !img.complete || img.naturalWidth === 0 || !img.src;
          if (isBroken) brokenCount++;
          const ratio = (rect.width / rect.height).toFixed(2);
          aspectRatios.add(ratio);
          pitchCardDetails.push({
            selector: getSelector(img),
            renderedDimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
            aspectRatio: ratio,
            isBroken,
            src: (img.src || '').slice(0, 60),
            alt: img.getAttribute('alt') || ''
          });
        }
      } else if (placeholder) {
        brokenCount++;
        pitchCardDetails.push({
          selector: getSelector(placeholder),
          renderedDimensions: 'placeholder',
          aspectRatio: 'placeholder',
          isBroken: true,
          reason: 'Photo placeholder displayed'
        });
      }
    }

    return {
      docScrollWidth,
      hasOverflow,
      overflowElements,
      smallTextCount: uniqueSmallText.length,
      smallText: uniqueSmallText,
      smallTapCount: smallTapTargets.length,
      smallTapTargets,
      fontSizesCount: fontSizes.size,
      fontSizesList: Array.from(fontSizes),
      fontFamiliesCount: fontFamilies.size,
      fontFamiliesList: Array.from(fontFamilies),
      borderRadiiCount: borderRadii.size,
      borderRadiiList: Array.from(borderRadii),
      textColorsCount: textColors.size,
      textColorsList: Array.from(textColors),
      cardRowMismatches,
      gapMismatches,
      imageIssuesCount: imageIssues.length,
      imageIssues,
      clippedTextCount: clippedTextElements.length,
      clippedText: clippedTextElements,
      priceElementsCount: priceElements.length,
      priceElements,
      pitchCardImages: {
        cardsCount: pitchCardDetails.length,
        aspectRatiosFound: Array.from(aspectRatios),
        brokenOrMissingImagesCount: brokenCount,
        details: pitchCardDetails
      }
    };
  }, { viewWidth });

  // g) axe-core violations (UNCAPPED)
  let axeViolations = [];
  try {
    const axeResults = await new AxeBuilder({ page }).analyze();
    axeViolations = axeResults.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodesCount: v.nodes.length,
      nodes: v.nodes.map(n => ({
        target: n.target.join(' '),
        html: n.html.slice(0, 100),
        failureSummary: n.failureSummary
      }))
    }));
  } catch (err) {
    console.warn(`Axe analysis notice on ${page.url()}:`, err.message);
  }

  return { domMetrics, axeViolations };
}

async function runAudit() {
  console.log('=== PITCHLY UI-2 AUDIT STARTING ===');

  const auditEmail = process.env.AUDIT_EMAIL;
  const auditPassword = process.env.AUDIT_PASSWORD;
  const hasCredentials = Boolean(auditEmail && auditPassword);

  if (hasCredentials) {
    console.log('Credentials detected for signed-in testing.');
  } else {
    console.log('No credentials provided (AUDIT_EMAIL / AUDIT_PASSWORD). Signed-in pages: NOT TESTED (no credentials).');
  }

  const browser = await chromium.launch({ headless: true });
  const allRuns = [];
  const rawFilePaths = [];

  // 1. Audit Public Pages
  for (const pageConfig of PUBLIC_PAGES) {
    for (const width of WIDTHS) {
      for (const theme of THEMES) {
        const context = await browser.newContext({
          viewport: { width, height: 850 }
        });

        const page = await context.newPage();

        try {
          // Initialize origin storage
          await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
          await page.evaluate(({ themeName, initStorage }) => {
            try {
              if (themeName === 'light') {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('pitchly_theme', 'light');
              } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('pitchly_theme', 'dark');
              }
              if (initStorage) {
                for (const [k, v] of Object.entries(initStorage)) {
                  localStorage.setItem(k, v);
                }
              } else {
                localStorage.removeItem('pitchly_last_user');
              }
            } catch (e) {}
          }, { themeName: theme, initStorage: pageConfig.initStorage });

          await page.goto(`http://localhost:3000${pageConfig.route}`, {
            waitUntil: 'domcontentloaded'
          });

          await page.evaluate((themeName) => {
            if (themeName === 'light') {
              document.documentElement.classList.remove('dark');
            } else {
              document.documentElement.classList.add('dark');
            }
          }, theme);

          await page.waitForTimeout(1000);

          console.log(`Auditing [${theme}] ${pageConfig.name} at ${width}px (${page.url()})...`);
          const { domMetrics, axeViolations } = await auditPage(page, width, theme);

          const runResult = {
            page: pageConfig.name,
            route: pageConfig.route,
            width,
            theme,
            url: page.url(),
            metrics: domMetrics,
            axe: axeViolations
          };

          // Save raw JSON
          const rawFileName = `${pageConfig.name}_${width}_${theme}.json`;
          const rawFilePath = path.join(RAW_DIR, rawFileName);
          fs.writeFileSync(rawFilePath, JSON.stringify(runResult, null, 2), 'utf8');
          rawFilePaths.push(rawFileName);

          allRuns.push(runResult);
        } catch (err) {
          console.error(`Error auditing ${pageConfig.name} at ${width}px [${theme}]:`, err.message);
        } finally {
          await context.close();
        }
      }
    }
  }

  // 2. Audit Signed-In Pages if credentials provided
  let signedInStatus = 'NOT TESTED (no credentials)';
  if (hasCredentials) {
    console.log('Initiating safe sign-in for authenticated pages...');
    signedInStatus = 'TESTED';
    // Implementation for signed-in flow
    try {
      const authContext = await browser.newContext({ viewport: { width: 390, height: 850 } });
      const authPage = await authContext.newPage();
      await authPage.goto('http://localhost:3000/#/auth', { waitUntil: 'domcontentloaded' });
      await authPage.waitForTimeout(1000);

      // Fill credentials safely (NEVER logged or printed)
      await authPage.fill('input[type="email"]', auditEmail);
      await authPage.fill('input[type="password"]', auditPassword);

      // Submit via Enter key on password to strictly avoid clicking any forbidden verb button
      await authPage.press('input[type="password"]', 'Enter');
      await authPage.waitForTimeout(3000);

      const postAuthUrl = authPage.url();
      if (postAuthUrl.includes('/home')) {
        console.log('Signed in successfully.');

        // Discover first pitch link on /home
        let discoveredPitchHref = null;
        try {
          const firstLink = await authPage.locator('a[href*="/turf/"]').first();
          if (await firstLink.count() > 0) {
            discoveredPitchHref = await firstLink.getAttribute('href');
          }
        } catch (e) {}

        const signedInPagesList = [
          { name: 'home', route: '/#/home' },
          ...(discoveredPitchHref ? [
            { name: 'turf-detail', route: discoveredPitchHref },
            { name: 'turf-book', route: `${discoveredPitchHref}/book` }
          ] : []),
          { name: 'bookings', route: '/#/bookings' },
          { name: 'profile', route: '/#/profile' },
          { name: 'settings', route: '/#/settings' },
          { name: 'teams', route: '/#/teams' },
          { name: 'invitations', route: '/#/invitations' },
          { name: 'chat', route: '/#/chat' },
          { name: 'explore-map', route: '/#/explore-map' }
        ];

        for (const pConfig of signedInPagesList) {
          for (const width of WIDTHS) {
            for (const theme of THEMES) {
              const runCtx = await browser.newContext({ viewport: { width, height: 850 } });
              const page = await runCtx.newPage();
              await page.goto(`http://localhost:3000${pConfig.route}`, { waitUntil: 'domcontentloaded' });
              await page.waitForTimeout(1000);

              const { domMetrics, axeViolations } = await auditPage(page, width, theme);
              const runResult = {
                page: pConfig.name,
                route: pConfig.route,
                width,
                theme,
                url: page.url(),
                metrics: domMetrics,
                axe: axeViolations
              };
              const rawFileName = `${pConfig.name}_${width}_${theme}.json`;
              fs.writeFileSync(path.join(RAW_DIR, rawFileName), JSON.stringify(runResult, null, 2), 'utf8');
              rawFilePaths.push(rawFileName);
              allRuns.push(runResult);
              await runCtx.close();
            }
          }
        }
      } else {
        console.log('Authentication redirect did not reach /home. Status:', postAuthUrl);
      }
      await authContext.close();
    } catch (authErr) {
      console.warn('Signed in audit notice:', authErr.message);
    }
  }

  await browser.close();

  // Print FULL raw console summary without abbreviation
  console.log('\n=== FULL RAW AUDIT OUTPUT (ALL COMBINATIONS) ===');
  for (const r of allRuns) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`PAGE: ${r.page} | WIDTH: ${r.width}px | THEME: ${r.theme} | URL: ${r.url}`);
    console.log(`(a) Horizontal Overflow: ${r.metrics.hasOverflow ? 'FAIL (' + r.metrics.docScrollWidth + 'px > ' + r.width + 'px)' : 'PASS'}`);
    if (r.metrics.overflowElements.length > 0) {
      console.log(`  Overflow elements:`, JSON.stringify(r.metrics.overflowElements, null, 2));
    }
    console.log(`(b) Text < 12px (${r.metrics.smallTextCount}):`);
    for (const t of r.metrics.smallText) {
      console.log(`  - [${t.fontSize}px] "${t.text}" at ${t.selector}`);
    }
    console.log(`(c) Tap Targets < 44x44px (${r.metrics.smallTapCount}):`);
    for (const t of r.metrics.smallTapTargets) {
      console.log(`  - [${t.width}x${t.height}px] "${t.label}" at ${t.selector}`);
    }
    console.log(`(d) Design Tokens: fontSizes=${r.metrics.fontSizesCount}, fontFamilies=${r.metrics.fontFamiliesCount} (${r.metrics.fontFamiliesList.join(', ')}), borderRadii=${r.metrics.borderRadiiCount}, textColors=${r.metrics.textColorsCount}`);
    console.log(`(e) Card Row Mismatches: ${r.metrics.cardRowMismatches.length}`);
    if (r.metrics.cardRowMismatches.length > 0) {
      console.log(`  Mismatches:`, JSON.stringify(r.metrics.cardRowMismatches, null, 2));
    }
    console.log(`(f) Sibling Gap Mismatches: ${r.metrics.gapMismatches.length}`);
    if (r.metrics.gapMismatches.length > 0) {
      console.log(`  Mismatches:`, JSON.stringify(r.metrics.gapMismatches, null, 2));
    }
    console.log(`(g) Axe-Core Violations (${r.axe.length}):`);
    for (const a of r.axe) {
      console.log(`  - [${a.impact}] ${a.id}: ${a.description} (${a.nodesCount} nodes)`);
    }
    console.log(`(h) Image Issues (${r.metrics.imageIssuesCount}):`);
    for (const img of r.metrics.imageIssues) {
      console.log(`  - ${img.selector} (missingAlt: ${img.missingAlt}, missingFixedAspect: ${img.missingFixedAspect})`);
    }
    console.log(`(i) Clipped Text Elements (${r.metrics.clippedTextCount}):`);
    for (const cl of r.metrics.clippedText) {
      console.log(`  - "${cl.text}" at ${cl.selector} (scrollW:${cl.scrollW}, clientW:${cl.clientW})`);
    }
    console.log(`(j) Price Text Elements (${r.metrics.priceElementsCount}):`);
    for (const p of r.metrics.priceElements) {
      console.log(`  - "${p.text}" [${p.fontSize}px, tabular: ${p.usesTabularNumbers}] at ${p.selector}`);
    }
    console.log(`(k) Pitch Card Images: cards=${r.metrics.pitchCardImages.cardsCount}, aspectRatios=[${r.metrics.pitchCardImages.aspectRatiosFound.join(', ')}], broken=${r.metrics.pitchCardImages.brokenOrMissingImagesCount}`);
  }

  // Deduplicate and write report.md according to STEP 5
  await browser.close();
  const { execSync: runSync } = await import('child_process');
  runSync('node /app/applet/ui-audit/generate_report.mjs', { stdio: 'inherit' });
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
