import { useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  FilePlus,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import type { VirtualPage } from '../../types';
import { convertFileToPdfBytes } from '../../utils/pdfProcessor';

interface ViewerToolbarProps {
  virtualPages: VirtualPage[];
  setVirtualPages: React.Dispatch<React.SetStateAction<VirtualPage[]>>;
  selectedPageIndex: number;
  setSelectedPageIndex: React.Dispatch<React.SetStateAction<number>>;
  pdfBytesMap: React.MutableRefObject<Map<string, ArrayBuffer>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  totalOriginalPages: number;
}

export default function ViewerToolbar({
  virtualPages,
  setVirtualPages,
  selectedPageIndex,
  setSelectedPageIndex,
  pdfBytesMap,
  zoom,
  setZoom,
  totalOriginalPages,
}: ViewerToolbarProps) {
  const [pageInput, setPageInput] = useState('');
  const [isInserting, setIsInserting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPage = virtualPages[selectedPageIndex] as VirtualPage | undefined;
  const isMarked = currentPage?.markedForDeletion ?? false;

  // Navigation
  const goToPage = () => {
    const num = parseInt(pageInput, 10);
    if (num >= 1 && num <= virtualPages.length) {
      setSelectedPageIndex(num - 1);
      setPageInput('');
    }
  };

  const goPrev = () => {
    setSelectedPageIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    setSelectedPageIndex((i) => Math.min(virtualPages.length - 1, i + 1));
  };

  // Insert Blank Page
  const insertBlankPage = () => {
    const ref = virtualPages[selectedPageIndex];
    const width = ref?.width ?? 595;
    const height = ref?.height ?? 842;

    const blankPage: VirtualPage = {
      id: crypto.randomUUID(),
      type: 'blank',
      width,
      height,
      markedForDeletion: false,
    };

    setVirtualPages((prev) => {
      const next = [...prev];
      next.splice(selectedPageIndex + 1, 0, blankPage);
      return next;
    });
    setSelectedPageIndex(selectedPageIndex + 1);
  };

  // Toggle Delete
  const toggleDelete = () => {
    setVirtualPages((prev) =>
      prev.map((p, i) =>
        i === selectedPageIndex
          ? { ...p, markedForDeletion: !p.markedForDeletion }
          : p,
      ),
    );
  };

  // Insert Document
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsInserting(true);
    try {
      const pdfBytes = await convertFileToPdfBytes(file);
      const sourceId = crypto.randomUUID();
      pdfBytesMap.current.set(sourceId, pdfBytes);

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      const newPages: VirtualPage[] = pages.map((pg, j) => {
        const { width, height } = pg.getSize();
        return {
          id: crypto.randomUUID(),
          type: 'inserted' as const,
          sourceId,
          sourcePageIndex: j,
          width,
          height,
          markedForDeletion: false,
        };
      });

      setVirtualPages((prev) => {
        const next = [...prev];
        next.splice(selectedPageIndex + 1, 0, ...newPages);
        return next;
      });
      setSelectedPageIndex(selectedPageIndex + 1);
    } catch (err) {
      console.error('Failed to insert document:', err);
      alert('Failed to insert document. See console for details.');
    } finally {
      setIsInserting(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Computed stats
  const deletedCount = virtualPages.filter((p) => p.markedForDeletion).length;
  const blankCount = virtualPages.filter((p) => p.type === 'blank').length;
  const effectiveCount = virtualPages.filter(
    (p) => !p.markedForDeletion,
  ).length;

  return (
    <div className="w-60 shrink-0 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* ── Navigation Section ───────────────────────────────────── */}
      <div className="p-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Navigation
        </h4>

        {/* Page jump */}
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={virtualPages.length}
            placeholder={`1–${virtualPages.length}`}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && goToPage()}
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={goToPage}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Go
          </button>
        </div>

        {/* Prev / Next */}
        <div className="flex gap-2">
          <button
            onClick={goPrev}
            disabled={selectedPageIndex === 0}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
          >
            <ChevronLeft size={16} />
            Prev
          </button>
          <button
            onClick={goNext}
            disabled={selectedPageIndex >= virtualPages.length - 1}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Zoom Section ─────────────────────────────────────────── */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Zoom
        </h4>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-primary-500"
          />
          <span className="text-sm font-semibold text-gray-700 tabular-nums w-10 text-right">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <button
          onClick={() => setZoom(1.0)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RotateCcw size={12} />
          Reset to 100%
        </button>
      </div>

      {/* ── Actions Section ──────────────────────────────────────── */}
      <div className="p-4 border-t border-gray-200 space-y-2.5">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Actions
        </h4>

        {/* Insert Blank Page */}
        <button
          onClick={insertBlankPage}
          disabled={virtualPages.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Insert Blank Page After
        </button>

        {/* Toggle Delete */}
        <button
          onClick={toggleDelete}
          disabled={virtualPages.length === 0}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isMarked
              ? 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'
              : 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
          }`}
        >
          <Trash2 size={18} />
          {isMarked ? 'Unmark Deletion' : 'Mark for Deletion'}
        </button>

        {/* Insert Document */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isInserting}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isInserting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <FilePlus size={18} />
          )}
          {isInserting ? 'Processing...' : 'Insert Document After'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.html,.docx,.doc,.htm"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* ── Summary Section ──────────────────────────────────────── */}
      <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50/50">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Summary
        </h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total pages:</span>
            <span className="font-semibold text-gray-800">
              {virtualPages.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Original pages:</span>
            <span className="font-semibold text-gray-800">
              {totalOriginalPages}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Blank pages:</span>
            <span className="font-semibold text-gray-800">{blankCount}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Deleted:</span>
            <span className="font-semibold">{deletedCount}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
            <span className="font-medium text-gray-700">Effective pages:</span>
            <span className="font-bold text-primary-700">{effectiveCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
