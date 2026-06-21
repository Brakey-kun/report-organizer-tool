import { useRef, useEffect } from 'react';
import type { VirtualPage } from '../../types';
import PageCanvas from './PageCanvas';

interface ThumbnailSidebarProps {
  virtualPages: VirtualPage[];
  selectedPageIndex: number;
  onSelectPage: (index: number) => void;
  pdfBytesMap: React.MutableRefObject<Map<string, ArrayBuffer>>;
}

export default function ThumbnailSidebar({
  virtualPages,
  selectedPageIndex,
  onSelectPage,
  pdfBytesMap,
}: ThumbnailSidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Auto-scroll to keep the selected thumbnail visible
  useEffect(() => {
    const el = thumbRefs.current.get(selectedPageIndex);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedPageIndex]);

  return (
    <div
      ref={containerRef}
      className="w-50 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-200 bg-white">
        <h3 className="text-sm font-semibold text-gray-700">
          Pages{' '}
          <span className="text-xs font-normal text-gray-400">
            ({virtualPages.length})
          </span>
        </h3>
      </div>

      {/* Thumbnail list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {virtualPages.map((page, index) => {
          const isSelected = index === selectedPageIndex;

          return (
            <div
              key={page.id}
              ref={(el) => {
                if (el) thumbRefs.current.set(index, el);
                else thumbRefs.current.delete(index);
              }}
              onClick={() => onSelectPage(index)}
              className={`
                relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200
                ${isSelected ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md border border-gray-200'}
              `}
            >
              {/* Canvas wrapper */}
              <div className="relative bg-white">
                <PageCanvas
                  page={page}
                  pdfBytesMap={pdfBytesMap}
                  scale={0.2}
                  className="w-full h-auto block"
                />

                {/* Deletion overlay */}
                {page.markedForDeletion && (
                  <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold bg-red-600/70 px-1.5 py-0.5 rounded">
                      Deleted
                    </span>
                  </div>
                )}
              </div>

              {/* Page label */}
              <div className="flex items-center justify-between px-2 py-1 bg-white border-t border-gray-100">
                <span
                  className={`text-[11px] ${
                    isSelected ? 'text-primary-700 font-semibold' : 'text-gray-500'
                  }`}
                >
                  Page {index + 1}
                </span>
                {page.type === 'blank' && (
                  <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-px rounded-full font-medium">
                    Blank
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
