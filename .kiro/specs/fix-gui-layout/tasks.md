# Implementation Plan: Fix GUI Layout

## Overview

All fixes are CSS/Tailwind class changes within existing React components. No new components, data models, or logic are introduced. Each task targets a specific file and can be implemented independently.

## Tasks

- [x] 1. Fix panel proportions in OrganizeStep
  - [x] 1.1 Change left panel width from `w-1/2` to `w-2/5` in `src/components/organize/OrganizeStep.tsx`
    - Remove the inner `max-w-xl mx-auto` wrapper that over-constrains left panel content
    - Replace with a simple `space-y-8` container (no max-width)
    - _Requirements: 1.1, 1.3_

  - [x] 1.2 Change right panel / DocumentPreview width from `w-1/2` to `w-3/5` in `src/components/organize/DocumentPreview.tsx`
    - Update the width class on the preview panel container
    - Ensure the preview fills its allocated space without inner gaps
    - _Requirements: 1.1, 4.4_

- [x] 2. Fix title section layout in OrganizeStep
  - [x] 2.1 Replace absolute positioning with flex row in title area of `src/components/organize/OrganizeStep.tsx`
    - Create flex container with: History button | centered title block | invisible spacer
    - The spacer should match approximate History button width (~100px) to keep title centered
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Split bilingual title into separate lines
    - Change `<h1>` from combined "Report Organizer / منسق التقارير" to English-only "Report Organizer"
    - Add separate `<p>` element below with `dir="rtl"` for Arabic subtitle "أداة تنظيم التقارير"
    - Reduce title font size from `text-4xl` to `text-3xl`
    - _Requirements: 2.1, 2.3, 5.1, 5.2_

- [x] 3. Fix ProgressBar centering
  - [x] 3.1 Widen max-width constraint in `src/components/ProgressBar.tsx`
    - Change inner container from `max-w-xl` to `max-w-2xl`
    - Update horizontal padding from `px-6` to `px-8`
    - _Requirements: 3.1, 3.3_

- [x] 4. Fix content spacing on left panel
  - [x] 4.1 Adjust padding values in `src/components/organize/OrganizeStep.tsx` left panel
    - Change from `py-12 px-6 lg:px-12` to `py-8 px-8 lg:px-10`
    - Ensures content breathes without excessive empty margins
    - _Requirements: 4.1, 4.2_

- [x] 5. Checkpoint - Visual verification
  - Run the app and visually verify all layout fixes render correctly
  - Check panel proportions at typical desktop widths (1280px, 1440px, 1920px)
  - Verify title text is fully visible, Arabic text renders RTL, and progress bar is centered
  - Ensure all interactive features still work (file upload, drag-and-drop, preview, History sidebar)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All changes are Tailwind class modifications with no functional logic changes
- Tasks 1–4 are independent and can be implemented in parallel
- Task 5 is a manual visual verification checkpoint
- No property-based tests apply — these are deterministic layout declarations
- No existing test framework for component rendering is in place; verification is visual
