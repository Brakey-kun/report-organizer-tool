# Design Document: Fix GUI Layout

## Overview

This design addresses five visual/layout problems in the Report Organizer Tool's Organize step. The root causes are overly restrictive `max-w-xl` constraints, fixed 50/50 panel splits that don't match content needs, and absolute positioning conflicts in the title area. All fixes are CSS/Tailwind class changes with minimal structural JSX modifications.

The approach is conservative: change only the layout utility classes needed to resolve each requirement, preserving all existing functionality and component architecture.

## Architecture

The layout hierarchy remains unchanged:

```
App (flex col, full height)
├── Header (sticky, shrink-0)
├── ProgressBar (shrink-0, 60px)
└── Main (flex-1, overflow-hidden)
    └── OrganizeStep (flex row, full height)
        ├── Left Panel (organize controls)
        └── Right Panel (document preview)
```

No new components are introduced. All changes are to Tailwind class strings within existing components.

## Components and Interfaces

### Modified Components

| Component | File | Changes |
|-----------|------|---------|
| `OrganizeStep` | `src/components/organize/OrganizeStep.tsx` | Panel width ratio, remove inner max-width, fix title section |
| `ProgressBar` | `src/components/ProgressBar.tsx` | Remove max-width constraint, widen layout |
| `DocumentPreview` | `src/components/organize/DocumentPreview.tsx` | Adjust width class to match new ratio |
| `App` | `src/App.tsx` | No structural changes needed (header already uses `max-w-7xl`) |

### Change Details

#### 1. Panel Proportions (Requirement 1)

**Current:**
- Left panel: `w-1/2` → content further constrained by inner `max-w-xl mx-auto`
- Right panel: `w-1/2`

**New:**
- Left panel: `w-2/5` with padding but **no inner max-width wrapper**
- Right panel: `w-3/5`
- The `max-w-xl mx-auto` wrapper inside the left panel is replaced with a simple `space-y-8` div (no max-width constraint)

This gives the preview panel more room (it displays full documents) while the left panel content naturally fills its 40% allocation.

#### 2. Title Section Fix (Requirement 2)

**Current:**
```jsx
<div className="text-center relative">
  <button className="absolute left-0 top-0 ...">History</button>
  <h1 className="text-4xl font-extrabold ...">Report Organizer / منسق التقارير</h1>
</div>
```

The absolute-positioned History button overlaps the title text at narrow widths.

**New:**
```jsx
<div className="space-y-4">
  <div className="flex items-start justify-between gap-4">
    <button ...>History</button>
    <div className="flex-1 text-center">
      <h1 className="text-3xl font-extrabold ...">Report Organizer</h1>
      <p className="text-lg text-gray-600 mt-1" dir="rtl">أداة تنظيم التقارير</p>
    </div>
    {/* Invisible spacer to keep title centered */}
    <div className="w-[100px]" />
  </div>
  <p className="text-base text-gray-600 text-center ...">Upload PDFs...</p>
  <p className="text-sm text-gray-500 text-center" dir="rtl">...</p>
</div>
```

Key decisions:
- Replace absolute positioning with a flex row containing: History button | centered title | invisible spacer
- Split the bilingual title into two lines (English heading + Arabic subtitle below)
- The spacer matches the History button's approximate width to keep the title visually centered
- Reduce title from `text-4xl` to `text-3xl` to avoid crowding at 40% panel width

#### 3. ProgressBar Centering (Requirement 3)

**Current:**
```jsx
<div className="flex items-center justify-center h-full max-w-xl mx-auto px-6">
```

The `max-w-xl` (~576px) makes the progress indicator look cramped on wide screens.

**New:**
```jsx
<div className="flex items-center justify-center h-full max-w-2xl mx-auto px-8">
```

Change to `max-w-2xl` (~672px) gives more breathing room for the three steps + connecting lines while still keeping the bar centered and not overly spread out.

#### 4. Content Spacing (Requirement 4)

**Left panel padding adjustments:**
- Current: `py-12 px-6 lg:px-12`
- New: `py-8 px-8 lg:px-10`

This reduces excessive vertical padding at the top and provides more consistent horizontal padding. The content fills width naturally since the `max-w-xl` constraint is removed.

#### 5. Bilingual Text Handling (Requirement 5)

The existing `dir="rtl"` attributes on Arabic text elements are correct and preserved. The design changes:
- Title section: Arabic subtitle gets its own `<p>` element with `dir="rtl"` and is stacked below English
- The combined "Report Organizer / منسق التقارير" in the `<h1>` is split into separate English and Arabic lines
- Upload area bilingual text keeps its existing separate-line pattern (already correct)

## Data Models

No data model changes. This is purely a presentation layer fix.

## Error Handling

No error handling changes needed. These are static layout changes with no runtime failure modes.

## Testing Strategy

### Why Property-Based Testing Does Not Apply

This feature consists entirely of CSS/Tailwind class changes to fix visual layout proportions and spacing. There are no:
- Pure functions with input/output behavior to test
- Data transformations or algorithms
- Universal properties that vary across inputs

The changes are deterministic layout declarations, not parameterized logic.

### Recommended Testing Approach

1. **Visual regression testing** (manual or screenshot-based):
   - Verify panel proportions at typical desktop widths (1200px, 1440px, 1920px)
   - Verify title text is fully visible without clipping
   - Verify progress bar is centered
   - Verify Arabic text renders RTL correctly

2. **Smoke tests** (manual verification):
   - App renders without errors after class changes
   - All interactive features still work (file upload, drag-and-drop, preview)
   - History sidebar still opens/closes correctly

3. **Responsive checks**:
   - Minimum supported width (Electron window minimum)
   - Typical widths (1280px, 1440px, 1920px)

Since this project doesn't have an existing test framework for component rendering, and the changes are purely cosmetic Tailwind class swaps, automated tests would add little value here. The verification is best done visually.
