# Global Control Feature Implementation Plan

## 1. Overview
The goal is to transition the application from a single-screen layout into a structured 3-step wizard:
1. **Organize Step:** The current document sorting and metadata editing interface.
2. **Global Control Step:** A new full-screen, Adobe Acrobat-style PDF viewer displaying the fully merged document, allowing users to insert white pages, mark pages for deletion, and inject new documents using global page numbering.
3. **Export Step:** Finalization and download of the merged PDF or ZIP archive.

This plan outlines the architecture, state management, and UI changes required to seamlessly implement these features without breaking existing functionalities.

---

## 2. UI & Workflow Restructuring

### 2.1. The 3-Step Progress Bar
We will introduce a top navigation bar indicating the current step:
- **State:** `const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);`
- **UI Element:** A horizontal stepper (e.g., `1. Organize -> 2. Global Control -> 3. Export`).
- Users can navigate back and forth. Moving from Step 1 to Step 2 triggers the "Initial Merge" process.

### 2.2. View Layouts
- **Step 1 (Organize):** Existing layout (Left: Draggable list, Right: Individual Preview). The "Export" buttons will be replaced by a "Next: Global Control" button.
- **Step 2 (Global Control):** Full viewport layout. Left sidebar for page thumbnails (similar to Acrobat), main center area for full-page viewing, and a right sidebar/floating toolbar for actions (Delete, Add White Page, Insert Document).
- **Step 3 (Export):** A clean summary screen with the final Export PDF/ZIP buttons and export settings (e.g., stripping annotations).

---

## 3. Global State & PDF Virtualization

To manage adding, deleting, and inserting pages using "Global Page Numbering", we cannot just rely on an iframe. We must virtualize the global document structure.

### 3.1. Virtual Page Mapping
When moving to Step 2, we generate a virtual map of all pages in the merged document.
```typescript
interface GlobalPage {
  globalIndex: number;          // The current 1-based index in the global document
  type: 'original' | 'white' | 'inserted';
  sourceFileId?: string;        // ID of the original ReportFile
  sourcePageNumber?: number;    // 1-based page number within the source file
  isMarkedDeleted: boolean;     // True if the user marked it for deletion in Step 2
}
```

### 3.2. Background Merging
- The current `generatePdfReport` logic in `App.tsx` will be extracted into a reusable utility.
- When entering Step 2, we combine all documents into a single `PDFDocument` buffer and load it via `pdfjs-dist` to render custom UI.

---

## 4. Implementing the Global Viewer (Step 2)

Because we need custom overlays (red tint for deleted pages) and custom inserts (white pages), we will build a custom PDF viewer component instead of relying on a native browser iframe.

### 4.1. PDF.js Custom Renderer
- We will use `pdfjs-dist` and the HTML5 `<canvas>` element to render individual pages.
- **Thumbnails Sidebar:** A vertically scrolling list of low-res canvas renders of each page.
- **Main Viewer:** High-res canvas render of the currently selected page.

### 4.2. Feature: Mark Page for Deletion
- **Action:** User selects a page (or inputs a global page number) and clicks "Delete".
- **State Update:** Set `isMarkedDeleted: true` for that `GlobalPage`.
- **UI Representation:** Overlay a semi-transparent red `<div>` over the canvas in both the thumbnail and the main viewer.

### 4.3. Feature: Insert White Pages
- **Action:** User specifies "Insert white page after page X".
- **State Update:** Splice a new `GlobalPage` of `type: 'white'` into the virtual page map at index X.
- **UI Representation:** Render a blank white canvas/div for that page in the viewer. Update all subsequent `globalIndex` numbers dynamically.

### 4.4. Feature: Insert New Documents
- **Action:** User clicks "Insert Document", uploads a file, and specifies "Insert after page X".
- **Process:** 
  1. Process the new file (PDF/DOCX/HTML to PDF).
  2. Extract its pages.
  3. Splice new `GlobalPage` entries of `type: 'inserted'` into the virtual map.
  4. Update the combined underlying PDF buffer so the viewer can render the new pages.

---

## 5. Final Export Generation (Step 3)

When the user moves to Step 3 and clicks Export, the final compiler will read the Virtual Page Map:
1. Create a fresh `PDFDocument`.
2. Iterate through the Virtual Page Map in order.
3. If `isMarkedDeleted` is true, skip the page.
4. If `type === 'white'`, add a blank page using `mergedPdf.addPage([width, height])`.
5. If `type === 'original'` or `type === 'inserted'`, copy the exact `sourcePageNumber` from the respective source PDF buffer and add it.
6. Apply security/annotation stripping if requested.
7. Save and trigger the download.

---

## 6. Execution Steps & Task Breakdown

1. **Refactor PDF Logic:** Move the file-to-PDF conversion logic (DOCX/HTML handling) out of `App.tsx` into a dedicated `pdfProcessor.ts` utility.
2. **Implement 3-Step Shell:** Add the `currentStep` state, the top progress bar, and split the UI into conditionally rendered components (`<OrganizeStep />`, `<GlobalViewerStep />`, `<ExportStep />`).
3. **Build the Custom PDF Viewer:** Integrate `pdfjs-dist` to render pages onto canvases, creating the Adobe Acrobat-style thumbnail sidebar and main view.
4. **Implement Global Page Logic:** Wire up the Virtual Page Map state. Implement the UI buttons to Delete (red overlay) and Add White Page.
5. **Implement Document Insertion:** Add the file upload trigger within the Global Viewer, map the new pages into the Virtual Page Map, and re-render.
6. **Update Exporter:** Rewrite the `generatePdfReport` function to respect the Virtual Page Map instead of just the Step 1 file list.
