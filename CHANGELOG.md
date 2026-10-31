# ArcTalent Changelog

All notable changes and technical modifications across the ArcTalent codebase are documented in this log.

---

## [dihom Branch] - 2026-10-31

### Added: Multi-User Authentication & Reactive Profile Synchronization (Hackathon Option A)

- **Commit**: `495b036`
- **Branch**: `dihom` (isolated from `main`)
- **Files Added**:
  - `src/components/auth-provider.tsx`
  - `src/components/auth-modal.css`
- **Files Modified**:
  - `src/app/layout.tsx`
  - `src/components/introduction.tsx`
  - `src/components/arctalent-app.tsx`
  - `src/components/profile-panel.tsx`
  - `src/lib/messages/settings.ms.json`
  - `src/lib/messages/settings.zh-CN.json`

#### Key Capabilities & Implementation Details:

1. **Authentication Context & Browser Persistence (`auth-provider.tsx`)**:
   - Implemented `AuthProvider` managing `currentUser`, `isLoggedIn`, and registered user accounts in `localStorage` under keys `arctalent-auth-users-v1` and `arctalent-auth-session-v1`.
   - Seeded default accounts for instant judge review:
     - **Aina**: `aina@arctalent.my` / `demo1234`
     - **Farid**: `farid@arctalent.my` / `demo1234`
   - Provided core actions: `login(email, password)`, `signup(formData)`, `logout()`, `updateProfile(newData)`, `openAuthModal(mode)`, and `closeAuthModal()`.
   - Automatically synchronizes authenticated user profile state with workspace storage (`arctalent-v1`).

2. **Liquid Glass Authentication Modal (`auth-modal.css`)**:
   - Styled native `<dialog class="auth-dialog">` with frosted glass background (`backdrop-filter: blur(24px) saturate(165%)`, subtle border `rgba(255, 255, 255, 0.78)`).
   - Interactive tab switcher between **Log in** and **Sign up**.
   - Includes a 1-click **"Fill Aina (Demo)"** button for judge evaluation.
   - Comprehensive registration fields: Full Name, Current Role, Email, Password, Primary Career Interest, and Study Hours per Week.

3. **Global Layout & Navigation Integration**:
   - Mounted `<AuthProvider>` inside `src/app/layout.tsx` to enable seamless auth state across both `/` and `/workspace`.
   - **Introduction (`src/components/introduction.tsx`)**: Added Log in / Sign up pill buttons in the top navigation header; displays the logged-in user name and Log out button; redirects to `/workspace` upon login or sign-up.
   - **Workspace Topbar (`src/components/arctalent-app.tsx`)**: Shows Log in / Sign up or Log out controls in the top bar.

4. **Sidebar User Card & Settings Profile Integration**:
   - **Sidebar Card (`.sidebar-user`)**: Dynamically binds to `currentUser.name`, `currentUser.email`, and the user's avatar; clicking the user card immediately routes to `Settings -> Profile`.
   - **Profile Settings (`src/components/profile-panel.tsx`)**:
     - Added account banner displaying current login status with quick action buttons (**Switch account**, **Log out**, or **Log in / Sign up**).
     - Submitting edits via **"Update my pathways"** invokes `updateProfile(parsed.data)`, simultaneously syncing `AuthProvider`, `localStorage`, `.sidebar-user`, topbar avatar, and Career Explorer recommendations in real time.

5. **Internationalization (i18n)**:
   - Added English, Malay (`ms`), and Simplified Chinese (`zh-CN`) translations for all authentication banners and modal actions in `src/lib/messages/settings.ms.json` and `src/lib/messages/settings.zh-CN.json`.
   - Verified that all 216 test suite checks continue to pass.

---

## [main & dihom Branches] - 2026-10-31

### Enhanced: Liquid Glass Styling & Visual Hierarchy

- **Commits**: `04eeae4`, `33579b1`
- **File Modified**: `src/app/globals.css`

#### Key Visual Improvements:

1. **Uniform Liquid Glass Surface**:
   - Styled **Planned Learning** (`.stats-grid.three > .stat:nth-child(2)`) to use semi-transparent Liquid Glass (`var(--surface)`, `var(--glass-edge)`, `var(--glass-blur)`, `var(--glass-shadow)`).
   - Styled SME Workspace cost comparison cards (**Individual commercial seats**, **ArcTalent cohort plan**, **Saving**) with matching Liquid Glass styling.
2. **Hover-Only Highlight Behavior**:
   - Removed permanent selected purple glow/background from **ArcTalent cohort plan**; all three cards now present uniform neutrality and highlight only when hovered.
   - Career Explorer **Top Match** (`.career-card.is-selected`) and its **Explore pathway** button restyled from static purple glow to clean Liquid Glass with hover-only purple accents.

---

### Enhanced: SME Workspace Layout & Controls

- **Commits**: `bf62b95`, `b8e7386`, `1a78e70`
- **Files Modified**:
  - `src/app/globals.css`
  - `src/components/workforce-destination.tsx`
  - `src/components/workforce-destination.css`
  - `src/components/career-goal.css`
  - `src/components/glass.css`

#### Key Layout Improvements:

1. **Full-Width "Plan within real constraints"**:
   - Converted `.two-columns:has(.slot-inputs)` from 50/50 split to `1fr` full-width.
   - Reorganized the 6 opening input slots into a 3-column horizontal grid (`repeat(3, minmax(0, 1fr))`) on desktop, responsive to 2 columns on tablet and 1 column on mobile.
2. **Workforce Destination Modal Polish**:
   - Adjusted prompt button layout, modal card padding, and button padding to prevent overflow and text truncation.
   - Aligned modal action buttons cleanly with the rest of the workspace interface.
