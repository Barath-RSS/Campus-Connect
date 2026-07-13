# Fix: Keep motto on a single line on mobile

**File:** `src/components/SplashScreen.tsx` (motto block only)

**Problem:** On narrow screens, "Justice • Peace • Revolution" wraps to a second line because the text sits between two fixed-width decorative lines (`w-8`) inside a `flex` row, leaving too little room.

**Changes (visual-only, mobile):**
1. Add `whitespace-nowrap` to the motto `<p>` so the three words never break across lines.
2. Slightly reduce mobile sizing so it fits comfortably:
   - Tracking: `tracking-[0.25em]` → `tracking-[0.15em] md:tracking-[0.25em]`
   - Font size: add `text-xs md:text-sm`
   - Side decorative lines: `w-8` → `w-4 md:w-8`
3. Add `px-2` to the flex container to guarantee side padding on very narrow viewports.

**Out of scope:** No changes to logo, college name, loading dots, colors, or desktop appearance beyond what's needed to keep parity.
