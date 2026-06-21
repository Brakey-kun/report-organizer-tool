import React, { useState, useEffect } from 'react';
import type { VirtualPage } from '../../types';
import ThumbnailSidebar from './ThumbnailSidebar';
import MainViewer from './MainViewer';
import ViewerToolbar from './ViewerToolbar';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface GlobalViewerStepProps {
  virtualPages: VirtualPage[];
  setVirtualPages: React.Dispatch<React.SetStateAction<VirtualPage[]>>;
  pdfBytesMap: React.MutableRefObject<Map<string, ArrayBuffer>>;
  onNextStep: () => void;
  onPrevStep: () => void;
}

export default function GlobalViewerStep({
  virtualPages,
  setVirtualPages,
  pdfBytesMap,
  onNextStep,
  onPrevStep,
}: GlobalViewerStepProps) {
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1.0);

  // If virtualPages becomes empty or selected index is out of bounds, reset it
  useEffect(() => {
    if (selectedPageIndex >= virtualPages.length && virtualPages.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPageIndex(virtualPages.length - 1);
    }
  }, [virtualPages.length, selectedPageIndex]);

  const totalOriginalPages = virtualPages.filter((p) => p.type === 'original').length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full">
      <div className="flex flex-1 overflow-hidden">
        <ThumbnailSidebar
          virtualPages={virtualPages}
          selectedPageIndex={selectedPageIndex}
          onSelectPage={setSelectedPageIndex}
          pdfBytesMap={pdfBytesMap}
        />
        
        <MainViewer
          virtualPages={virtualPages}
          selectedPageIndex={selectedPageIndex}
          onSelectPage={setSelectedPageIndex}
          pdfBytesMap={pdfBytesMap}
          zoom={zoom}
        />
        
        <ViewerToolbar
          virtualPages={virtualPages}
          setVirtualPages={setVirtualPages}
          selectedPageIndex={selectedPageIndex}
          setSelectedPageIndex={setSelectedPageIndex}
          pdfBytesMap={pdfBytesMap}
          zoom={zoom}
          setZoom={setZoom}
          totalOriginalPages={totalOriginalPages}
        />
      </div>
      
      {/* Bottom Navigation Bar */}
      <div className="h-[70px] bg-white border-t border-gray-200 flex justify-between items-center px-6 shrink-0 z-10 shadow-sm relative">
        <button
          onClick={onPrevStep}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="flex flex-col items-start">
            <span>Back to Organize</span>
            <span className="text-xs text-gray-500 font-normal">العودة للترتيب</span>
          </span>
        </button>

        <button
          onClick={onNextStep}
          disabled={virtualPages.length === 0}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex flex-col items-end">
            <span>Next: Export</span>
            <span className="text-xs text-primary-100 font-normal">التالي: التصدير</span>
          </span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
