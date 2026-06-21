import os

app_tsx_content = """import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { extractDateFromFile, findDateInText } from './utils/dateExtractor';
import { format } from 'date-fns';
import { FileUp, FileText, GripVertical, Trash2, Download, Eye, FileBadge, History, Trash, FileDown, Scissors } from 'lucide-react';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import html2pdf from 'html2pdf.js';
import localforage from 'localforage';

interface ReportFile {
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

interface ReportSession {
  id: string;
  name: string;
  updatedAt: number;
  files: ReportFile[];
  docCounter: number;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function SortableItem(props: { 
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

export default function App() {
  const [files, setFiles] = useState<ReportFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [activePreview, setActivePreview] = useState<ReportFile | null>(null);
  const [lockedPreview, setLockedPreview] = useState<ReportFile | null>(null);
  const [docCounter, setDocCounter] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  const [sessions, setSessions] = useState<ReportSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load from localforage on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        const savedCounter = await localforage.getItem<number>('docCounter');
        if (savedCounter) setDocCounter(savedCounter);

        const savedSessions = await localforage.getItem<ReportSession[]>('reportSessions');
        if (savedSessions) setSessions(savedSessions);

        const savedFiles = await localforage.getItem<ReportFile[]>('savedFiles');
        if (savedFiles && Array.isArray(savedFiles)) {
          // Recreate previewUrls for PDFs since Blob URLs expire
          for (const f of savedFiles) {
            try {
              if ((f.file.type === 'application/pdf' || f.file.name.endsWith('.pdf')) && (f.file instanceof Blob || f.file instanceof File)) {
                f.previewUrl = URL.createObjectURL(f.file);
              }
            } catch(e) { console.error("Could not recreate Blob URL", e); }
          }
          setFiles(savedFiles);
        }
      } catch(e) {
        console.error("Failed to load saved progress", e);
        // Fallback to clear state if IndexedDB gets corrupted
        localforage.clear();
      } finally {
        setIsInitialized(true);
      }
    }
    loadData();
  }, []);

  // Save to localforage on change
  React.useEffect(() => {
    if (!isInitialized) return;
    localforage.setItem('docCounter', docCounter);
    localforage.setItem('savedFiles', files).catch(e => console.error("Failed to save progress", e));
  }, [files, docCounter, isInitialized]);

  // Save sessions on change
  React.useEffect(() => {
    if (!isInitialized) return;
    localforage.setItem('reportSessions', sessions);
  }, [sessions, isInitialized]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    
    const newFiles: ReportFile[] = [];
    let currentCounter = docCounter;

    for (const file of uploadedFiles) {
      const extractedDate = await extractDateFromFile(file);
      
      let previewUrl: string | null = null;
      let isHeader = false;

      if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        isHeader = true;
      }

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        previewUrl = URL.createObjectURL(file);
      } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
        const text = await file.text();
        previewUrl = text; 
      } else if (isHeader) {
        try {
           const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
           previewUrl = result.value;
        } catch(e) {}
      }

      newFiles.push({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        displayId: `DOC-${currentCounter++}`,
        file,
        parsedDate: extractedDate,
        dateText: extractedDate ? format(extractedDate, 'dd/MM/yyyy') : '',
        name: file.name,
        isHeader,
        previewUrl,
        removedPages: []
      });
    }

    setDocCounter(currentCounter);

    setFiles(prev => {
      const combined = [...prev, ...newFiles];
      combined.sort((a, b) => {
        if (a.isHeader && !b.isHeader) return -1;
        if (!a.isHeader && b.isHeader) return 1;
        if (!a.parsedDate) return 1;
        if (!b.parsedDate) return -1;
        return a.parsedDate.getTime() - b.parsedDate.getTime();
      });
      return combined;
    });

    setIsProcessing(false);
    event.target.value = '';
  };

  const toggleHeader = (id: string) => {
    setFiles(prev => {
      const items = [...prev];
      const idx = items.findIndex(f => f.id === id);
      if (idx !== -1) {
        items[idx].isHeader = !items[idx].isHeader;
      }
      
      items.sort((a, b) => {
        if (a.isHeader && !b.isHeader) return -1;
        if (!a.isHeader && b.isHeader) return 1;
        if (!a.parsedDate) return 1;
        if (!b.parsedDate) return -1;
        return a.parsedDate.getTime() - b.parsedDate.getTime();
      });
      return items;
    });
  };

  const updateDateText = (id: string, text: string) => {
    setFiles(prev => {
      const items = [...prev];
      const idx = items.findIndex(f => f.id === id);
      if (idx !== -1) {
        items[idx].dateText = text;
        items[idx].parsedDate = findDateInText(text);
      }
      items.sort((a, b) => {
        if (a.isHeader && !b.isHeader) return -1;
        if (!a.isHeader && b.isHeader) return 1;
        if (!a.parsedDate) return 1;
        if (!b.parsedDate) return -1;
        return a.parsedDate.getTime() - b.parsedDate.getTime();
      });
      return items;
    });
  };

  const updateRemovedPages = (id: string, text: string) => {
    setFiles(prev => {
      const items = [...prev];
      const idx = items.findIndex(f => f.id === id);
      if (idx !== -1) {
        // Parse CSV string into array of numbers
        const nums = text.split(',')
          .map(s => parseInt(s.trim()))
          .filter(n => !isNaN(n) && n > 0);
        items[idx].removedPages = nums;
      }
      return items;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemove = (id: string) => {
    setFiles(prev => {
      const item = prev.find(f => f.id === id);
      if (item && item.previewUrl && (item.file.type === 'application/pdf' || item.file.name.endsWith('.pdf'))) {
        try { URL.revokeObjectURL(item.previewUrl); } catch(e){}
      }
      if (activePreview?.id === id) setActivePreview(null);
      if (lockedPreview?.id === id) setLockedPreview(null);
      return prev.filter(f => f.id !== id);
    });
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to remove all documents? / هل أنت متأكد من إزالة جميع الوثائق؟")) {
      files.forEach(f => {
         if (f.previewUrl && (f.file.type === 'application/pdf' || f.file.name.endsWith('.pdf'))) {
           try { URL.revokeObjectURL(f.previewUrl); } catch(e){}
         }
      });
      setFiles([]);
      setDocCounter(1);
      setActivePreview(null);
      setLockedPreview(null);
    }
  };

  const saveCurrentSession = () => {
    const name = prompt("Enter a name for this report session / أدخل اسماً لهذه الجلسة:");
    if (!name) return;
    const newSession: ReportSession = {
      id: Date.now().toString(),
      name,
      updatedAt: Date.now(),
      files: [...files],
      docCounter
    };
    setSessions([...sessions, newSession]);
    alert("Session saved to history!");
  };

  const loadSession = (session: ReportSession) => {
    if (files.length > 0) {
      if (!confirm("Loading a session will replace your current workspace. Proceed? / تحميل الجلسة سيستبدل مساحة العمل الحالية. المتابعة؟")) {
        return;
      }
    }
    
    const loadedFiles = session.files.map(f => {
      try {
        if ((f.file.type === 'application/pdf' || f.file.name.endsWith('.pdf')) && (f.file instanceof Blob || f.file instanceof File)) {
          f.previewUrl = URL.createObjectURL(f.file);
        }
      } catch(e) {}
      return f;
    });

    setFiles(loadedFiles);
    setDocCounter(session.docCounter);
    setShowHistory(false);
    setActivePreview(null);
    setLockedPreview(null);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this saved session?")) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  // Preview Logic
  const handleHoverPreview = (item: ReportFile | null) => { if (item) setActivePreview(item); };
  const handleLeavePreview = () => { setActivePreview(lockedPreview || null); };
  const handleClickPreview = (item: ReportFile) => {
    if (lockedPreview?.id === item.id) setLockedPreview(null);
    else { setLockedPreview(item); setActivePreview(item); }
  };

  const generatePdfReport = async () => {
    if (files.length === 0) return;
    setIsExporting(true);
    
    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        let pdfBytes: ArrayBuffer;
        
        if (item.file.type === 'application/pdf' || item.file.name.endsWith('.pdf')) {
          pdfBytes = await item.file.arrayBuffer();
        } else if (item.file.name.endsWith('.docx') || item.file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const result = await mammoth.convertToHtml({ arrayBuffer: await item.file.arrayBuffer() });
          const container = document.createElement('div');
          container.innerHTML = `<div style="padding: 40px; font-family: sans-serif;" dir="auto">${result.value}</div>`;
          document.body.appendChild(container);
          const pdfBlob = await html2pdf().from(container).outputPdf('blob');
          pdfBytes = await pdfBlob.arrayBuffer();
          document.body.removeChild(container);
        } else {
          const htmlContent = await item.file.text();
          const container = document.createElement('div');
          container.innerHTML = `<div dir="auto">${htmlContent}</div>`;
          document.body.appendChild(container);
          const pdfBlob = await html2pdf().from(container).outputPdf('blob');
          pdfBytes = await pdfBlob.arrayBuffer();
          document.body.removeChild(container);
        }

        const pdf = await PDFDocument.load(pdfBytes);
        
        let pagesToCopy = pdf.getPageIndices();
        if (item.removedPages && item.removedPages.length > 0) {
           pagesToCopy = pagesToCopy.filter(idx => !item.removedPages.includes(idx + 1));
        }

        const copiedPages = await mergedPdf.copyPages(pdf, pagesToCopy);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Chronological_Report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Failed to generate PDF report. See console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateZipReport = async () => {
    if (files.length === 0) return;
    setIsExporting(true);
    
    try {
      const zip = new JSZip();
      files.forEach((item, index) => {
        const numberPrefix = String(index + 1).padStart(3, '0');
        const safeName = item.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const filename = `${numberPrefix}_${safeName}`;
        zip.file(filename, item.file);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Collated_Reports_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. See console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isInitialized) return <div className="h-screen w-full flex items-center justify-center bg-gray-50"><p className="text-gray-500">Loading workspace...</p></div>;

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden relative">
      
      {/* Edit History Modal Sidebar */}
      {showHistory && (
        <div className="absolute inset-y-0 left-0 w-80 bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col transition-all">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-gray-800">Saved Reports History</h2>
            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-800 font-bold">✕</button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center mt-10">No saved sessions yet.</p>
            ) : (
              sessions.map(s => (
                <div key={s.id} onClick={() => loadSession(s)} className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">{s.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{s.files.length} documents</p>
                      <p className="text-[10px] text-gray-400">{new Date(s.updatedAt).toLocaleString()}</p>
                    </div>
                    <button onClick={(e) => deleteSession(e, s.id)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash size={14}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Left side: Main UI */}
      <div className="w-1/2 h-full overflow-y-auto py-12 px-6 lg:px-12 border-r border-gray-200 scrollbar-hide">
        <div className="max-w-xl mx-auto space-y-8">
          
          <div className="text-center relative">
            <button 
              onClick={() => setShowHistory(true)}
              className="absolute left-0 top-0 p-2 text-gray-400 hover:text-primary-600 bg-white rounded-lg border border-gray-200 shadow-sm transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <History size={16}/> History
            </button>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Report Organizer / منسق التقارير
            </h1>
            <p className="text-base text-gray-600 max-w-lg mx-auto">
              Upload PDFs, HTMLs, or DOCX files. Files marked as <FileBadge className="inline text-primary-500 mb-1" size={16}/> Headers will stay at the top. The rest are auto-sorted chronologically.
            </p>
            <p className="text-sm text-gray-500 mt-2" dir="rtl">
              قم بتحميل ملفات PDF أو HTML أو DOCX. يتم وضع الملفات المحددة كغلاف في المقدمة، ويتم ترتيب الباقي زمنياً.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-primary-300 border-dashed rounded-xl cursor-pointer bg-primary-50/30 hover:bg-primary-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileUp className="w-10 h-10 text-primary-500 mb-3" />
                  <p className="mb-1 text-sm text-gray-700">
                    <span className="font-semibold text-primary-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF, HTML, DOCX</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept=".pdf,.html,text/html,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </label>
              {isProcessing && (
                <p className="text-center mt-3 text-sm font-medium text-primary-600 animate-pulse">
                  Extracting dates and processing files / جاري الاستخراج...
                </p>
              )}
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Document Order ({files.length})
                </h2>
                
                {files.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={saveCurrentSession}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium underline px-2"
                    >
                      Save to History
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-sm font-medium transition-colors"
                    >
                      <Trash2 size={14} /> Clear All
                    </button>
                  </div>
                )}
              </div>

              {files.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">No documents uploaded yet / لم يتم رفع أي وثائق</p>
                </div>
              ) : (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={files.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {files.map((file) => (
                        <SortableItem 
                          key={file.id} 
                          item={file} 
                          onRemove={handleRemove} 
                          toggleHeader={toggleHeader} 
                          onHoverPreview={handleHoverPreview}
                          onClickPreview={handleClickPreview}
                          onLeavePreview={handleLeavePreview}
                          onUpdateDateText={updateDateText}
                          onUpdateRemovedPages={updateRemovedPages}
                          lockedPreviewId={lockedPreview?.id || null}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              
              {files.length > 0 && (
                 <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col gap-3">
                    <button
                      onClick={generateZipReport}
                      disabled={isExporting}
                      className="flex items-center justify-center gap-2 bg-white border-2 border-primary-500 text-primary-700 hover:bg-primary-50 px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm w-full"
                    >
                      <FileDown size={20} />
                      {isExporting ? 'Processing...' : 'Export ZIP Archive (Original Files)'}
                    </button>
                    <button
                      onClick={generatePdfReport}
                      disabled={isExporting}
                      className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary-600/20 w-full"
                    >
                      <FileText size={20} />
                      {isExporting ? 'Generating PDF...' : 'Export Single PDF Report'}
                    </button>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Preview Area */}
      <div className="w-1/2 h-full bg-gray-200 border-l border-gray-300 relative shadow-inner">
        {activePreview ? (
          <div className="w-full h-full flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200 bg-gray-50 shadow-sm z-10 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 truncate" dir="auto">{activePreview.name}</h3>
                <p className="text-xs text-gray-500 mt-1">Live Preview {lockedPreview?.id === activePreview.id ? '(Locked / مثبت)' : ''}</p>
              </div>
              {lockedPreview?.id === activePreview.id && (
                <button 
                  onClick={() => { setLockedPreview(null); setActivePreview(null); }}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded transition-colors"
                >
                  Unlock Preview
                </button>
              )}
            </div>
            <div className="flex-1 w-full relative bg-gray-100 overflow-hidden">
              {(activePreview.file.type === 'application/pdf' || activePreview.file.name.endsWith('.pdf')) && activePreview.previewUrl ? (
                <iframe 
                  src={`${activePreview.previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
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

    </div>
  );
}
"""
with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_tsx_content)
