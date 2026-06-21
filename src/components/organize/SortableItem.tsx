import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FileText, Trash2, Eye, FileBadge, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import type { ReportFile } from '../../types';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function SortableItem(props: { 
  item: ReportFile; 
  onRemove: (id: string) => void; 
  toggleHeader: (id: string) => void;
  onHoverPreview: (item: ReportFile | null) => void;
  onClickPreview: (item: ReportFile) => void;
  onLeavePreview: () => void;
  onUpdateDateText: (id: string, text: string) => void;
  onUpdateRemovedPages: (id: string, text: string) => void;
  lockedPreviewId: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLocked = props.lockedPreviewId === props.item.id;
  const isPdf = props.item.file.type === 'application/pdf' || props.item.name.endsWith('.pdf');

  return (
    <div ref={setNodeRef} style={style} className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border ${props.item.isHeader ? 'border-primary-400 bg-primary-50/20' : 'border-gray-100'} hover:shadow-md transition-shadow relative group`}>
      <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-primary-500 py-2 sm:py-0">
        <GripVertical size={20} />
      </div>
      <div className="bg-primary-50 p-2 rounded-lg text-primary-600 shrink-0">
        <FileText size={24} />
      </div>
      <div className="flex-1 min-w-0 w-full">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-bold text-gray-900 truncate" dir="auto">{props.item.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500" dir="auto">
          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">ID: {props.item.displayId}</span>
          <span>• {formatBytes(props.item.file.size)}</span>
          {props.item.isHeader && (
             <span className="font-semibold text-primary-600 ml-1 bg-primary-100 px-2 py-0.5 rounded-full">Header / الغلاف</span>
          )}
        </div>
        
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 whitespace-nowrap">Date text:</span>
            <input 
              type="text" 
              placeholder="Type date manually..."
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none w-full max-w-[150px]"
              value={props.item.dateText}
              onChange={(e) => props.onUpdateDateText(props.item.id, e.target.value)}
              dir="auto"
            />
            {props.item.parsedDate && (
               <span className="text-[10px] text-green-600 bg-green-50 px-1.5 rounded whitespace-nowrap">Parsed: {format(props.item.parsedDate, 'dd/MM/yyyy')}</span>
            )}
          </div>

          {isPdf && (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-2">
              <Scissors size={14} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Remove pages (e.g. 1,3,4)"
                className="border border-gray-300 rounded px-2 py-1 text-red-600 font-mono text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none w-[140px]"
                value={props.item.removedPages?.join(',') || ''}
                onChange={(e) => props.onUpdateRemovedPages(props.item.id, e.target.value)}
                title="Enter pages to remove separated by commas"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto mt-2 sm:mt-0">
        {props.item.previewUrl && (
          <button 
            onMouseEnter={() => props.onHoverPreview(props.item)}
            onMouseLeave={props.onLeavePreview}
            onClick={() => props.onClickPreview(props.item)}
            className={`${isLocked ? 'text-primary-600 bg-primary-100' : 'text-gray-400 hover:text-primary-500'} transition-colors p-2 rounded-lg cursor-pointer`} 
            title="Hover to preview, click to lock / عاين أو اضغط للتثبيت"
          >
            <Eye size={20} />
          </button>
        )}

        <button 
          onClick={() => props.toggleHeader(props.item.id)}
          className={`${props.item.isHeader ? 'text-primary-600 bg-primary-100' : 'text-gray-400 hover:text-primary-500'} transition-colors p-2 rounded-lg`}
          title={props.item.isHeader ? "Unmark Header" : "Mark as Report Header (Pin to Top) / تعيين كغلاف"}
        >
          <FileBadge size={20} />
        </button>

        <button 
          onClick={() => props.onRemove(props.item.id)}
          className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg"
          title="Remove file / إزالة"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
