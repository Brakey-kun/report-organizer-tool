import { Eye } from 'lucide-react';
import type { ReportFile } from '../../types';

interface DocumentPreviewProps {
  activePreview: ReportFile | null;
  lockedPreview: ReportFile | null;
  activePreviewPdfUrl: string | null;
  onUnlock: () => void;
}

export default function DocumentPreview(props: DocumentPreviewProps) {
  const { activePreview, lockedPreview, activePreviewPdfUrl, onUnlock } = props;

  return (
    <div className="flex-1 min-w-0 h-full bg-gray-50 border-l border-gray-200 relative">
      {activePreview ? (
        <div className="w-full h-full flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200 bg-gray-50 shadow-sm z-10 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800 truncate" dir="auto">{activePreview.name}</h3>
              <p className="text-xs text-gray-500 mt-1">Live Preview {lockedPreview?.id === activePreview.id ? '(Locked / مثبت)' : ''}</p>
            </div>
            {lockedPreview?.id === activePreview.id && (
              <button 
                onClick={onUnlock}
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded transition-colors"
              >
                Unlock Preview
              </button>
            )}
          </div>
          <div className="flex-1 w-full relative bg-gray-100 overflow-hidden">
            {(activePreview.file.type === 'application/pdf' || activePreview.file.name.endsWith('.pdf')) && activePreviewPdfUrl ? (
              <iframe 
                src={`${activePreviewPdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                className="w-full h-full border-none" 
                title="PDF Preview"
              />
            ) : (
              <div className="w-full h-full p-8 overflow-y-auto bg-white select-text cursor-text" dir="auto">
                <div 
                  className="prose max-w-none text-gray-700 text-sm whitespace-pre-wrap select-text cursor-text"
                  dangerouslySetInnerHTML={{ __html: activePreview.previewUrl || '' }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
          <Eye size={48} className="text-gray-300" />
          <p className="text-lg font-medium text-gray-500">Hover over the eye icon to preview a document</p>
          <p className="text-sm text-gray-400" dir="rtl">مرر الماوس فوق أيقونة العين لمعاينة الوثيقة</p>
          <p className="text-xs text-gray-400 mt-2">Click the eye icon to lock the preview / اضغط على العين لتثبيت المعاينة</p>
        </div>
      )}
    </div>
  );
}
