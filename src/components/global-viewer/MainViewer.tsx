import { useRef, useEffect, useState, useCallback } from 'react';
import type { VirtualPage } from '../../types';
import PageCanvas from './PageCanvas';

interface MainViewerProps {
  virtualPages: VirtualPage[];
  selectedPageIndex: number;
  onSelectPage: (index: number) => void;
  pdfBytesMap: React.MutableRefObject<Map<string, ArrayBuffer>>;
  zoom: number;
}

export default function MainViewer({
  virtualPages,
  selectedPageIndex,
  onSelectPage,
  pdfBytesMap,
  zoom,
}: MainViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [containerWidth, setContainerWidth] = useState(800);
  const [visibleSet, setVisibleSet] = useState<Set<number>>(new Set());

  // Track container width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // IntersectionObserver for virtualization
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleSet((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const idx = Number((entry.target as HTMLElement).dataset.pageIndex);
            if (!isNaN(idx)) {
              if (entry.isIntersecting) {
                next.add(idx);
              } else {
                next.delete(idx);
              }
            }
          }
          return next;
        });
      },
      {
        root: el,
        rootMargin: '500px 0px',
        threshold: 0,
      },
    );

    // Observe all current slots
    slotRefs.current.forEach((slotEl) => observer.observe(slotEl));

    return () => observer.disconnect();
  }, [virtualPages.length]);

  // Re-observe when slotRefs change
  const setSlotRef = useCallback(
    (index: number, el: HTMLDivElement | null) => {
      if (el) {
        slotRefs.current.set(index, el);
      } else {
        slotRefs.current.delete(index);
      }
    },
    [],
  );

  // Scroll selected page into view when selectedPageIndex changes externally
  useEffect(() => {
    const el = slotRefs.current.get(selectedPageIndex);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedPageIndex]);

  const computeScale = (page: VirtualPage) => {
    return ((containerWidth * 0.85) / page.width) * zoom;
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-200 overflow-y-auto overflow-x-hidden relative"
    >
      <div className="flex flex-col items-center py-6 px-4 min-h-full">
        {virtualPages.map((page, index) => {
          const scale = computeScale(page);
          const computedHeight = page.height * scale;
          const computedWidth = page.width * scale;
          const isSelected = index === selectedPageIndex;
          const isVisible = visibleSet.has(index);

          return (
            <div
              key={page.id}
              ref={(el) => setSlotRef(index, el)}
              data-page-index={index}
              onClick={() => onSelectPage(index)}
              className={`
                relative mb-4 cursor-pointer bg-white shadow-md rounded-sm transition-all duration-200
                ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-200' : 'hover:shadow-lg'}
              `}
              style={{
                width: computedWidth,
                height: computedHeight,
              }}
            >
              {isVisible ? (
                <PageCanvas
                  page={page}
                  pdfBytesMap={pdfBytesMap}
                  scale={scale}
                  className="block"
                />
              ) : null}

              {/* Deletion overlay */}
              {page.markedForDeletion && (
                <div className="absolute inset-0 bg-red-500/30 flex flex-col items-center justify-center gap-1 rounded-sm">
                  <span className="text-lg font-bold text-red-900">
                    MARKED FOR DELETION
                  </span>
                  <span className="text-sm font-semibold text-red-800" dir="rtl">
                    محذوف
                  </span>
                </div>
              )}

              {/* Page number badge */}
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full font-medium">
                Page {index + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom page counter */}
      <div className="sticky bottom-0 left-0 right-0 flex justify-center py-2 pointer-events-none">
        <div className="bg-black/70 text-white text-xs px-4 py-1.5 rounded-full font-medium backdrop-blur-sm">
          Page {selectedPageIndex + 1} of {virtualPages.length}
        </div>
      </div>
    </div>
  );
}
