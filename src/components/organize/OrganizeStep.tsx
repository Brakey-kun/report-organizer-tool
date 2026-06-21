import React, { useState, useEffect } from 'react';
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
} from '@dnd-kit/sortable';
import { extractDateFromFile, findDateInText } from '../../utils/dateExtractor';
import { format } from 'date-fns';
import { FileUp, FileBadge, History, Trash2, ArrowRight } from 'lucide-react';
import mammoth from 'mammoth';
import { PDFDocument, rgb } from 'pdf-lib';
import type { ReportFile, ReportSession } from '../../types';

import SortableItem from './SortableItem';
import DocumentPreview from './DocumentPreview';
import HistorySidebar from './HistorySidebar';

interface OrganizeStepProps {
  files: ReportFile[];
  setFiles: React.Dispatch<React.SetStateAction<ReportFile[]>>;
  docCounter: number;
  setDocCounter: React.Dispatch<React.SetStateAction<number>>;
  sessions: ReportSession[];
  setSessions: React.Dispatch<React.SetStateAction<ReportSession[]>>;
  onNextStep: () => void;
}

export default function OrganizeStep({
  files,
  setFiles,
  docCounter,
  setDocCounter,
  sessions,
  setSessions,
  onNextStep,
}: OrganizeStepProps) {
  // Internal state owned by this component
  const [activePreview, setActivePreview] = useState<ReportFile | null>(null);
  const [lockedPreview, setLockedPreview] = useState<ReportFile | null>(null);
  const [activePreviewPdfUrl, setActivePreviewPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Dynamic PDF Preview Generation to highlight removed pages in RED
  useEffect(() => {
    let isMounted = true;
    
    if (!activePreview || !(activePreview.file.type === 'application/pdf' || activePreview.file.name.endsWith('.pdf'))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActivePreviewPdfUrl(activePreview?.previewUrl || null);
      return;
    }

    if (!activePreview.removedPages || activePreview.removedPages.length === 0) {
      setActivePreviewPdfUrl(activePreview.previewUrl);
      return;
    }

    const generateRedPreview = async () => {
      try {
        const pdfBytes = await activePreview.file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = pdf.getPages();
        
        for (let i = 0; i < pages.length; i++) {
          if (activePreview.removedPages.includes(i + 1)) {
            const page = pages[i];
            const { width, height } = page.getSize();
            page.drawRectangle({
              x: 0,
              y: 0,
              width,
              height,
              color: rgb(1, 0, 0),
              opacity: 0.3,
            });
          }
        }
        
        const newPdfBytes = await pdf.save();
        const blob = new Blob([newPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
        if (isMounted) setActivePreviewPdfUrl(URL.createObjectURL(blob));
      } catch (e) {
        console.error("Failed to generate red preview overlay", e);
        if (isMounted) setActivePreviewPdfUrl(activePreview.previewUrl);
      }
    };

    generateRedPreview();

    return () => { isMounted = false; };
  }, [activePreview, activePreview?.removedPages]);

  // DnD sensors setup
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
        } catch { /* ignore */ }
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
        try { URL.revokeObjectURL(item.previewUrl); } catch { /* ignore */ }
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
           try { URL.revokeObjectURL(f.previewUrl); } catch { /* ignore */ }
         }
      });
      setFiles([]);
      setDocCounter(1);
      setActivePreview(null);
      setLockedPreview(null);
    }
  };

  const saveCurrentSession = () => {
    const defaultName = `Session - ${format(new Date(), 'MMM dd, HH:mm')}`;
    const newSession: ReportSession = {
      id: Date.now().toString(),
      name: defaultName,
      updatedAt: Date.now(),
      files: [...files],
      docCounter
    };
    setSessions([...sessions, newSession]);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const loadSession = (session: ReportSession) => {
    if (files.length > 0) {
      if (!confirm("Loading a session will replace your current workspace. Proceed? / تحميل الجلسة سيستبدل مساحة العمل الحالية. المتابعة؟")) {
        return;
      }
    }
    
    const loadedFiles = session.files.map(f => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((f.file.type === 'application/pdf' || f.file.name.endsWith('.pdf')) && ((f.file as any) instanceof Blob || (f.file as any) instanceof File)) {
          f.previewUrl = URL.createObjectURL(f.file);
        }
      } catch { /* ignore */ }
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

  return (
    <div className="flex h-full w-full bg-gray-50 overflow-hidden relative">
      
      {/* Edit History Modal Sidebar */}
      {showHistory && (
        <HistorySidebar
          sessions={sessions}
          onClose={() => setShowHistory(false)}
          onLoadSession={loadSession}
          onDeleteSession={deleteSession}
        />
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
                      disabled={isSaved}
                      className={`flex items-center gap-1 bg-white border border-primary-200 ${isSaved ? 'text-green-600 border-green-200 bg-green-50' : 'text-primary-700 hover:bg-primary-50'} px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer`}
                    >
                      <History size={14}/> {isSaved ? 'Saved!' : 'Save to History'}
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
                      onClick={onNextStep}
                      disabled={files.length === 0}
                      className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary-600/20 w-full"
                    >
                      Next: Review Merged Document
                      <ArrowRight size={20} />
                    </button>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Preview Area */}
      <DocumentPreview
        activePreview={activePreview}
        lockedPreview={lockedPreview}
        activePreviewPdfUrl={activePreviewPdfUrl}
        onUnlock={() => { setLockedPreview(null); setActivePreview(null); }}
      />

    </div>
  );
}
