# Implementation Plan: Enhanced Firebase Authentication & Secure Password Entry System

## 1. Executive Summary & User Alignment

The user requested strengthening the app's login and password entry system ("بەهێزکردنی سیستەمی چوونە ژوورەوە و داخڵکردنی پاسۆرد"). Through clarifying answers, the user specified:
1. **Firebase Account System**: Official account authentication using **Email and Password** via Firebase Authentication (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`).
2. **Password Security Features**: A real-time **Password Strength Meter** evaluating length, numbers, uppercase/lowercase letters, and special characters, along with a **Show/Hide Password** toggle (`Eye` / `EyeOff`).
3. **User Profile & State Management**: Seamless integration with the existing top navigation bar, displaying user credentials, anonymous/guest vs. registered status, and syncing voice assessment history and bookmarks to their authenticated profile.
4. **Trilingual Localization**: Kurdish (کوردی سۆرانی), Arabic (العربية), and English for all labels, error messages, requirements, and feedback.

---

## 2. Domain-Specific Design & Anti-Slop System

Following the universal frontend design guidelines:
- **Zero Pill / No Generic AI Badges**: Form fields will use crisp, modern input boxes with visible focus borders (`focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20`), clean helper typography, and no static pill wrappers.
- **Password Strength Indicator**: A multi-segment visual progress bar (Weak: Red/Orange, Medium: Amber, Strong: Emerald) with explicit textual criteria checklist (e.g. 8+ characters, uppercase letter, number/symbol) that updates dynamically on input.
- **Show/Hide Password Action**: A sleek, accessible icon toggle button inside the password input field with `aria-label` and smooth visibility switching.
- **Error & Success Feedback**: Clear, non-technical, localized feedback messages (e.g., "ئیمەیڵەکە پێشتر بەکارهاتووە", "وشەی نهێنی کەمترە لە ٦ پیت", "هەڵەیەک لە ئیمەیڵ یان وشەی نهێنی هەیە") without raw Firebase exception strings.

---

## 3. Structural & Spatial Architecture

### Components & File Modifications:
1. **`src/firebase.ts`**:
   - Export Firebase Auth functions: `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`, `updateProfile`.
   - Add helpers: `registerUserWithEmail(email, password, displayName)`, `loginUserWithEmail(email, password)`, `logoutUser()`, and get current user info.
   - Sync user profile document in Firestore `users/{uid}` on successful registration or sign-in.

2. **`src/utils/passwordStrength.ts`** (New):
   - Calculates password score (0–4: Very Weak, Weak, Medium, Strong, Very Strong).
   - Validates specific security criteria: min 8 characters, lowercase, uppercase, number, symbol.
   - Returns localized descriptive feedback and suggested next steps.

3. **`src/components/AuthModal.tsx`** (New):
   - Switchable tabs: **چوونە ژوورەوە (Sign In)** and **دروستکردنی ئەکاونت (Create Account)**.
   - Input fields:
     - Full Name / Display Name (for registration)
     - Email Address (`type="email"`, auto-trim)
     - Password (`type="password"` or `"text"` with show/hide toggle)
     - Confirm Password (for registration)
   - Real-time password strength meter and checklist bar.
   - Trilingual validation error handling.
   - Option to continue as Guest / Anonymous user.

4. **`src/components/Navbar.tsx`**:
   - Add User Profile button in the top bar:
     - If authenticated: Shows user avatar/initials, email/name, and a dropdown/modal with "Sign Out / دەرچوون".
     - If guest / not logged in: Shows "چوونە ژوورەوە / Sign In" button with `LogIn` icon.

5. **`src/App.tsx`**:
   - Manage `isAuthModalOpen` state and `currentUser` profile state.
   - Listen to Firebase Auth state changes and link speaking history / bookmarks to the authenticated user ID.

---

## 4. Technical Execution Plan

### Step 1: Firebase Auth Service Integration
- Update `src/firebase.ts` to support email & password credentials alongside anonymous fallback.
- Handle standard Firebase Auth error codes (`auth/email-already-in-use`, `auth/wrong-password`, `auth/user-not-found`, `auth/weak-password`, `auth/invalid-email`) with Kurdish and Arabic translations.

### Step 2: Password Strength Engine
- Create `src/utils/passwordStrength.ts`:
  - Calculate entropy and requirement fulfillment.
  - Return `{ score: number; label: { ku: string; ar: string; en: string }; color: string; requirements: { id: string; met: boolean; label: { ku: string; ar: string; en: string } }[] }`.

### Step 3: AuthModal Component
- Implement `src/components/AuthModal.tsx`:
  - Mode toggle: Sign In vs Sign Up.
  - Show/Hide password toggle on both password and confirm password fields.
  - Interactive password strength bar and checklist under password input during registration.
  - Loading spinner during async authentication.
  - Graceful error banner.

### Step 4: Top Navbar Profile & App State Integration
- Update `src/components/Navbar.tsx` to display active user credentials or "Sign In" button.
- Update `src/App.tsx` to handle user state and trigger `AuthModal`.

---

## 5. Verification & Safety Checklist

1. **Compilation & Type Safety**:
   - Run `compile_applet` and `lint_applet` to ensure zero TypeScript errors or missing imports.
2. **Interactive Testing**:
   - Register a new account with email & password. Verify password strength meter updates live.
   - Test show/hide password toggle (eye icon switch).
   - Sign in with existing credentials and check error messages for incorrect passwords.
   - Verify Sign Out restores guest mode without crashing.
   - Confirm language switching (Kurdish, Arabic, English) updates all auth modal copy correctly.
