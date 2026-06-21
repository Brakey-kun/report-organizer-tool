import { useState, useRef, useEffect } from 'react';
import localforage from 'localforage';
import type { ReportFile, ReportSession, VirtualPage, WizardStep } from './types';
import { mergeFilesToVirtualPages } from './utils/pdfProcessor';

import ProgressBar from './components/ProgressBar';
import OrganizeStep from './components/organize/OrganizeStep';
import GlobalViewerStep from './components/global-viewer/GlobalViewerStep';
import ExportStep from './components/export/ExportStep';

// Initialize local storage
const SESSIONS_STORAGE_KEY = 'report_organizer_sessions';

export default function App() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  
  // Step 1 State
  const [files, setFiles] = useState<ReportFile[]>([]);
  const [docCounter, setDocCounter] = useState(1);
  const [sessions, setSessions] = useState<ReportSession[]>([]);

  // Step 2 & 3 State
  const [virtualPages, setVirtualPages] = useState<VirtualPage[]>([]);
  const pdfBytesMap = useRef<Map<string, ArrayBuffer>>(new Map());
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);

  // Load sessions on mount
  useEffect(() => {
    const loadSavedSessions = async () => {
      try {
        const saved = await localforage.getItem<ReportSession[]>(SESSIONS_STORAGE_KEY);
        if (saved) {
          setSessions(saved);
        }
      } catch (err) {
        console.error("Failed to load sessions", err);
      }
    };
    loadSavedSessions();
  }, []);

  const handleNextToStep2 = async () => {
    setIsMerging(true);
    try {
      const { virtualPages: newPages, pdfBytesMap: newMap } = await mergeFilesToVirtualPages(
        files,
        (current, total) => setMergeProgress(Math.round((current / total) * 100))
      );
      
      setVirtualPages(newPages);
      pdfBytesMap.current = newMap;
      setCurrentStep(2);
    } catch (err) {
      console.error("Error merging files:", err);
      alert("An error occurred while preparing the documents. Check the console.");
    } finally {
      setIsMerging(false);
      setMergeProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Report Organizer Tool</h1>
              <p className="text-xs text-gray-500 font-medium">أداة تنظيم التقارير</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} onStepClick={(step) => {
        // Only allow going back or to a step we have data for
        if (step < currentStep) {
          setCurrentStep(step);
        } else if (step === 2 && currentStep === 1 && files.length > 0) {
          handleNextToStep2();
        } else if (step === 3 && currentStep === 2 && virtualPages.length > 0) {
          setCurrentStep(3);
        }
      }} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {isMerging && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-primary-600 transition-all duration-300" 
                style={{ width: `${mergeProgress}%` }}
              />
            </div>
            <p className="text-gray-900 font-medium">Preparing documents... {mergeProgress}%</p>
            <p className="text-gray-500 text-sm mt-1">تجهيز المستندات</p>
          </div>
        )}

        {currentStep === 1 && (
          <OrganizeStep
            files={files}
            setFiles={setFiles}
            docCounter={docCounter}
            setDocCounter={setDocCounter}
            sessions={sessions}
            setSessions={setSessions}
            onNextStep={handleNextToStep2}
          />
        )}

        {currentStep === 2 && (
          <GlobalViewerStep
            virtualPages={virtualPages}
            setVirtualPages={setVirtualPages}
            pdfBytesMap={pdfBytesMap}
            onNextStep={() => setCurrentStep(3)}
            onPrevStep={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <ExportStep
            virtualPages={virtualPages}
            pdfBytesMap={pdfBytesMap}
            files={files}
            onPrevStep={() => setCurrentStep(2)}
          />
        )}
      </main>
    </div>
  );
}
