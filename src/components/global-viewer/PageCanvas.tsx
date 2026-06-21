import { useRef, useEffect } from 'react';
import type { VirtualPage } from '../../types';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PageCanvasProps {
  page: VirtualPage;
  pdfBytesMap: React.MutableRefObject<Map<string, ArrayBuffer>>;
  scale: number;
  className?: string;
}

/**
 * Module-level cache for loaded PDFDocumentProxy objects.
 * Key = sourceId. Shared across all PageCanvas instances.
 */
const pdfDocCache = new Map<string, PDFDocumentProxy>();

export default function PageCanvas({
  page,
  pdfBytesMap,
  scale,
  className,
}: PageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderTask: any = null;

    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle Blank Page
      if (page.type === 'blank') {
        const w = page.width * scale;
        const h = page.height * scale;
        canvas.width = w;
        canvas.height = h;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // Dashed border inset by 20px
        const inset = 20 * scale;
        ctx.strokeStyle = '#d1d5db'; // gray-300
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
        ctx.setLineDash([]);

        // Centered "Blank Page" text
        const fontSize = Math.max(12, 14 * scale);
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = '#9ca3af'; // gray-400
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Blank Page', w / 2, h / 2);
        return;
      }

      // Handle Original or Inserted Page
      const sourceId = page.sourceId;
      if (!sourceId) return;

      const pdfBytes = pdfBytesMap.current.get(sourceId);
      if (!pdfBytes) return;

      try {
        // Get or load the PDFDocumentProxy
        let pdfDoc = pdfDocCache.get(sourceId);
        if (!pdfDoc) {
          const { pdfjsLib } = await import('../../utils/pdfWorkerSetup');
          pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) }).promise;
          pdfDocCache.set(sourceId, pdfDoc);
        }

        if (cancelled) return;

        const pdfPage = await pdfDoc.getPage(page.sourcePageIndex! + 1);
        if (cancelled) return;

        const viewport = pdfPage.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = pdfPage.render({
          canvasContext: ctx,
          viewport,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        await renderTask.promise;
      } catch (err) {
        if (!cancelled) {
          console.error('PageCanvas render error:', err);
        }
      }
    };

    render();

    return () => {
      cancelled = true;
      if (renderTask && typeof renderTask.cancel === 'function') {
        try {
          renderTask.cancel();
        } catch {
          // ignore cancellation errors
        }
      }
    };
  }, [page.id, page.type, page.sourceId, page.sourcePageIndex, page.width, page.height, scale, pdfBytesMap]);

  return <canvas ref={canvasRef} className={className} />;
}
