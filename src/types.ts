export interface ReportFile {
  id: string;
  displayId: string;
  file: File;
  parsedDate: Date | null;
  dateText: string;
  name: string;
  isHeader: boolean;
  previewUrl: string | null;
  removedPages: number[];
}

export interface ReportSession {
  id: string;
  name: string;
  updatedAt: number;
  files: ReportFile[];
  docCounter: number;
}

export type WizardStep = 1 | 2 | 3;

/**
 * Represents a single page in the globally-merged document.
 * The ordered array of VirtualPages IS the global page map.
 * Array index = global page number (0-based internally, displayed 1-based).
 */
export interface VirtualPage {
  id: string;
  type: 'original' | 'blank' | 'inserted';

  /** Key into the pdfBytesMap. Used by both 'original' and 'inserted' pages. */
  sourceId?: string;

  /** 0-based page index within the source PDF referenced by sourceId. */
  sourcePageIndex?: number;

  /** Page width in PDF points. Always populated. */
  width: number;

  /** Page height in PDF points. Always populated. */
  height: number;

  /** When true, the page is overlaid in red and excluded from the final export. */
  markedForDeletion: boolean;
}
