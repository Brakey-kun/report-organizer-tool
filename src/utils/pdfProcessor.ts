import { PDFDocument, PDFName } from 'pdf-lib';
import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';
import type { ReportFile, VirtualPage } from '../types';

/**
 * Convert any supported file (PDF, DOCX, HTML) to PDF bytes.
 */
export async function convertFileToPdfBytes(file: File): Promise<ArrayBuffer> {
  // PDF – pass through directly
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    return file.arrayBuffer();
  }

  // DOCX – convert to HTML with mammoth, then render to PDF
  if (
    file.name.endsWith('.docx') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.innerHTML = `<div style="padding: 40px; font-family: sans-serif;" dir="auto">${html}</div>`;
    document.body.appendChild(container);

    try {
      const blob: Blob = await html2pdf().from(container).outputPdf('blob');
      return blob.arrayBuffer();
    } finally {
      document.body.removeChild(container);
    }
  }

  // HTML / other text-based files
  const htmlContent = await file.text();

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = `<div dir="auto">${htmlContent}</div>`;
  document.body.appendChild(container);

  try {
    const blob: Blob = await html2pdf().from(container).outputPdf('blob');
    return blob.arrayBuffer();
  } finally {
    document.body.removeChild(container);
  }
}

export interface MergeResult {
  virtualPages: VirtualPage[];
  pdfBytesMap: Map<string, ArrayBuffer>;
}

/**
 * Takes the sorted file list from Step 1 and produces a Virtual Page Map + PDF bytes map.
 * Per-document removedPages are applied here (those pages are excluded from the map).
 */
export async function mergeFilesToVirtualPages(
  files: ReportFile[],
  onProgress?: (current: number, total: number) => void,
): Promise<MergeResult> {
  const virtualPages: VirtualPage[] = [];
  const pdfBytesMap = new Map<string, ArrayBuffer>();

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const reportFile = files[fileIndex];

    // Convert every file to PDF bytes
    const pdfBytes = await convertFileToPdfBytes(reportFile.file);
    pdfBytesMap.set(reportFile.id, pdfBytes);

    // Load with pdf-lib to inspect pages
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    for (let index = 0; index < pages.length; index++) {
      // removedPages is stored as 1-based page numbers
      if (reportFile.removedPages.includes(index + 1)) {
        continue;
      }

      const { width, height } = pages[index].getSize();

      virtualPages.push({
        id: crypto.randomUUID(),
        type: 'original',
        sourceId: reportFile.id,
        sourcePageIndex: index,
        width,
        height,
        markedForDeletion: false,
      });
    }

    onProgress?.(fileIndex + 1, files.length);
  }

  return { virtualPages, pdfBytesMap };
}

/**
 * Compile the final PDF from the Virtual Page Map.
 * Skips markedForDeletion pages. Adds blank pages for type 'blank'.
 * Copies pages from source PDFs for type 'original' and 'inserted'.
 */
export async function compileFinalPdf(
  virtualPages: VirtualPage[],
  pdfBytesMap: Map<string, ArrayBuffer>,
  options: { removeAnnotations: boolean },
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  // Cache loaded source PDFs so we don't re-parse for every page
  const srcCache = new Map<string, PDFDocument>();

  for (const page of virtualPages) {
    if (page.markedForDeletion) {
      continue;
    }

    if (page.type === 'blank') {
      mergedPdf.addPage([page.width, page.height]);
      continue;
    }

    // 'original' or 'inserted'
    const sourceId = page.sourceId!;
    const pageIndex = page.sourcePageIndex!;

    // Load or retrieve the source document
    let srcDoc = srcCache.get(sourceId);
    if (!srcDoc) {
      const bytes = pdfBytesMap.get(sourceId);
      if (!bytes) {
        throw new Error(`Missing PDF bytes for source id "${sourceId}"`);
      }
      srcDoc = await PDFDocument.load(bytes);
      srcCache.set(sourceId, srcDoc);
    }

    // Optionally strip annotations from the source page before copying
    if (options.removeAnnotations) {
      srcDoc.getPages()[pageIndex].node.delete(PDFName.of('Annots'));
    }

    const [copiedPage] = await mergedPdf.copyPages(srcDoc, [pageIndex]);
    mergedPdf.addPage(copiedPage);
  }

  return mergedPdf.save();
}
