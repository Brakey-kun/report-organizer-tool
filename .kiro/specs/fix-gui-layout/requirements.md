# Requirements Document

## Introduction

This specification addresses visual and layout issues in the Report Organizer Tool's GUI. The current interface has asymmetrical panel proportions, clipped title text, misaligned step indicators, and unnatural spacing. The goal is to fix these issues so the layout is balanced, readable, and fills available space naturally across the Electron desktop window.

## Glossary

- **App_Layout**: The top-level page structure comprising header, progress bar, and main content area
- **Organize_Panel**: The left-side panel in the Organize step containing the upload area and document list
- **Preview_Panel**: The right-side panel in the Organize step showing document previews
- **Progress_Bar**: The horizontal step indicator showing workflow progress (Organize → Review → Export)
- **Title_Section**: The heading area within the Organize panel displaying the app name in English and Arabic

## Requirements

### Requirement 1: Balanced Panel Proportions

**User Story:** As a user, I want the left and right panels to have balanced proportions, so that I can comfortably use both the document list and the preview area without either feeling cramped.

#### Acceptance Criteria

1. WHEN the Organize step is displayed, THE App_Layout SHALL render the Organize_Panel at approximately 40% width and the Preview_Panel at approximately 60% width
2. WHEN the window is resized, THE App_Layout SHALL maintain the proportional split between Organize_Panel and Preview_Panel
3. THE Organize_Panel SHALL allow its content to fill the available width without an overly restrictive inner max-width constraint

### Requirement 2: Title Text Fully Visible

**User Story:** As a user, I want to see the full page title without any clipping, so that I can read the application name clearly.

#### Acceptance Criteria

1. THE Title_Section SHALL display the complete text "Report Organizer" without any horizontal clipping or overflow hiding
2. WHEN the History button is positioned near the title, THE Title_Section SHALL provide sufficient spacing so the button does not overlap or cause text clipping
3. THE Title_Section SHALL display the Arabic subtitle "أداة تنظيم التقارير" on a separate line with proper right-to-left rendering

### Requirement 3: Centered Step Indicator

**User Story:** As a user, I want the step progress indicator to be visually centered in the window, so that it feels balanced and easy to follow.

#### Acceptance Criteria

1. THE Progress_Bar SHALL be horizontally centered within the full window width
2. THE Progress_Bar SHALL have consistent spacing between step circles and connecting lines
3. WHEN the window is at typical desktop width (1200px or wider), THE Progress_Bar SHALL display all three steps with their labels without crowding

### Requirement 4: Natural Content Spacing

**User Story:** As a user, I want the interface elements to have natural, consistent spacing so the app feels polished and professional.

#### Acceptance Criteria

1. THE Organize_Panel SHALL use consistent padding that allows content to breathe without excessive empty margins
2. THE App_Layout header SHALL align visually with the main content area below it
3. WHEN the document list contains items, THE Organize_Panel SHALL allow the list to use available vertical space with proper scrolling
4. THE Preview_Panel SHALL fill its allocated space completely without inner gaps or misaligned borders

### Requirement 5: Proper Bilingual Text Handling

**User Story:** As a user reading both English and Arabic text, I want each language to render in its correct direction so the text is readable and professional.

#### Acceptance Criteria

1. WHEN Arabic text is displayed, THE App_Layout SHALL apply right-to-left direction to that specific text element without affecting surrounding English content
2. THE Title_Section SHALL stack the English title and Arabic subtitle vertically with clear visual separation
3. WHEN bilingual placeholder text appears (upload area, empty states), THE App_Layout SHALL render each language line in its correct text direction

