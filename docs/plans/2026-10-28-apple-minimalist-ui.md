# Apple Minimalist UI Refactor Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Refactor the visual design system of OmniRoute from the high-contrast neon-lime theme to a clean, elegant Apple Minimalist aesthetic with pure neutrals, Apple System Blue accent, smooth squircle radii, subtle frosted glass, and uncluttered dashboard layout.

**Architecture:** Token-first design system update in packages/ui-kit/src/ci-tokens.css and tokens.ts, bridged through src/app/globals.css, polished in DashboardShell, Header, and decluttering dashboard banners in src/app/(dashboard)/dashboard/, backed by unit tests in tests/unit/design-kit-bridge.test.ts and tests/unit/pwa-theme-colors.test.ts.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, @omniroute/ui-kit, Vitest, Node test runner.

---

### Task 1: Update Design Tokens & Bridge for Apple Minimalist Palette

**Files:**
- Modify: packages/ui-kit/src/ci-tokens.css
- Modify: packages/ui-kit/src/tokens.ts
- Modify: src/app/globals.css
- Modify: src/shared/constants/pwaThemeColors.ts
- Test: tests/unit/pwa-theme-colors.test.ts
- Test: tests/unit/design-kit-bridge.test.ts

**Step 1: Update tests for Apple Minimalist tokens**
- In tests/unit/pwa-theme-colors.test.ts: Assert light background #ffffff, dark background #000000.
- In tests/unit/design-kit-bridge.test.ts: Assert Apple Minimalist tokens and WCAG AA contrast ratios.

**Step 2: Run test — confirm failure**
Command: node --import tsx/esm tests/unit/pwa-theme-colors.test.ts
Expected: FAIL on background hex assertion.

**Step 3: Implement token updates**
- Update ci-tokens.css:
  - Light mode: Pure clean canvas #ffffff, surface subtle #f5f5f7, surface muted #e5e5ea.
  - Dark mode: True black #000000, surface #1c1c1e, surface subtle #2c2c2e.
  - Accent: Apple System Blue #0071e3 (light) / #0a84ff (dark).
  - Radii: Refined squircle curves (8px control, 12px surface, 16px cards).
- Update tokens.ts:
  - Sync ciTokens values with the Apple Minimalist palette.
- Update pwaThemeColors.ts:
  - Set light #ffffff, dark #000000.
- Update src/app/manifest.ts:
  - Set background and theme color to #ffffff.

**Step 4: Run tests — confirm pass**
Command: node --import tsx/esm tests/unit/pwa-theme-colors.test.ts && node --import tsx/esm tests/unit/design-kit-bridge.test.ts
Expected: PASS (all tests green).

**Step 5: Commit**
git add packages/ui-kit/ src/ tests/ && git commit -m 'feat(ui): refactor design tokens to Apple Minimalist aesthetic'

---

### Task 2: Polishing Shell & Navigation (Header, Sidebar, Glassmorphism)

**Files:**
- Modify: src/shared/components/Header.tsx
- Modify: src/shared/components/layouts/DashboardShell.tsx
- Modify: src/shared/components/Sidebar.tsx
- Test: tests/unit/ui/header-kit.test.tsx
- Test: tests/unit/ui/sidebar-kit-render.test.tsx

**Step 1: Verify current tests pass**
Command: npx vitest run --config vitest.config.ts tests/unit/ui/header-kit.test.tsx tests/unit/ui/sidebar-kit-render.test.tsx

**Step 2: Apply Apple styling to Header & Sidebar**
- In Header.tsx:
  - Apply frosted glass effect backdrop-blur-xl bg-background/80 border-b border-border/40.
  - Refine command palette button with subtle border and crisp typography.
- In DashboardShell.tsx:
  - Refine main content background and custom scrollbars.
- In Sidebar.tsx:
  - Enhance active state indicator with Apple rounded pill highlight and subtle contrast.

**Step 3: Run tests — confirm pass**
Command: npx vitest run --config vitest.config.ts tests/unit/ui/header-kit.test.tsx tests/unit/ui/sidebar-kit-render.test.tsx
Expected: PASS

**Step 4: Commit**
git add src/shared/components/ && git commit -m 'feat(ui): elevate Header and Sidebar with Apple frosted glass styling'

---

### Task 3: Decluttering and Refining Dashboard Banners

**Files:**
- Modify: src/app/(dashboard)/dashboard/CheaperInferenceSponsorBanner.tsx
- Modify: src/app/(dashboard)/dashboard/KimiSponsorBanner.tsx
- Modify: src/app/(dashboard)/dashboard/VscodeCopilotBanner.tsx
- Modify: src/app/(dashboard)/dashboard/NewsBanner.tsx
- Test: tests/unit/ui/cheaperInferenceSponsorBanner.test.tsx
- Test: tests/unit/ui/kimiSponsorBanner.test.tsx
- Test: tests/unit/ui/vscodeCopilotBanner.test.tsx

**Step 1: Verify banner tests pass**
Command: npx vitest run --config vitest.config.ts tests/unit/ui/cheaperInferenceSponsorBanner.test.tsx tests/unit/ui/kimiSponsorBanner.test.tsx tests/unit/ui/vscodeCopilotBanner.test.tsx

**Step 2: Redesign banner presentation**
- Replace loud neon background boxes with clean Apple callout style: subtle neutral surface (bg-surface border border-border/60 shadow-xs rounded-xl), crisp typography, minimal discreet badge.
- Ensure all interactive elements (dismiss button, external link, titles) retain their existing aria-labels, roles, and test selectors.

**Step 3: Run banner tests — confirm pass**
Command: npx vitest run --config vitest.config.ts tests/unit/ui/cheaperInferenceSponsorBanner.test.tsx tests/unit/ui/kimiSponsorBanner.test.tsx tests/unit/ui/vscodeCopilotBanner.test.tsx
Expected: PASS

**Step 4: Commit**
git add src/app/\(dashboard\)/dashboard/ && git commit -m 'feat(ui): refine dashboard banners to discreet minimalist callouts'

---

### Task 4: Full Quality Gate Verification & Pull Request Preparation

**Files:**
- Full test sweep on modified areas.

**Step 1: Run comprehensive tests**
Command:
- node --import tsx/esm tests/unit/design-kit-bridge.test.ts
- node --import tsx/esm tests/unit/pwa-theme-colors.test.ts
- node --import tsx/esm tests/unit/dashboard-kit-sweep.test.ts
- npx vitest run --config vitest.config.ts tests/unit/ui/

**Step 2: Commit & push branch**
Command: git push origin feat/apple-minimalist-ui

**Step 3: Create Pull Request**
Create PR on Hungzazed/OmniRoute targetting release/v3.8.53 with detailed summary of changes.
