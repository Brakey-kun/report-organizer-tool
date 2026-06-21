import React, { useState } from 'react';
import type { ReportFile, VirtualPage } from '../../types';
import { compileFinalPdf } from '../../utils/pdfProcessor';
import { Download, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import JSZip from 'jszip';

interface ExportStepProps {
  virtualPages: VirtualPage[];
  pdfBytesMap: React.MutableRefObject<Map<string, ArrayBuffer>>;
  files: ReportFile[];
  onPrevStep: () => void;
}

export default function ExportStep({
  virtualPages,
  pdfBytesMap,
  files,
  onPrevStep,
}: ExportStepProps) {
  const [removeAnnotations, setRemoveAnnotations] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  const totalEffectivePages = virtualPages.filter((p) => !p.markedForDeletion).length;
  const blankPagesAdded = virtualPages.filter((p) => p.type === 'blank' && !p.markedForDeletion).length;
  const deletedPages = virtualPages.filter((p) => p.markedForDeletion).length;

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const pdfBytes = await compileFinalPdf(virtualPages, pdfBytesMap.current, { removeAnnotations });
      
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Chronological_Report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('An error occurred while generating the PDF. Check console for details.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      const zip = new JSZip();
      
      files.forEach((file, index) => {
        const prefix = String(index + 1).padStart(2, '0');
        const filename = `${prefix}_${file.file.name}`;
        zip.file(filename, file.file);
      });
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Chronological_Report_Source_Files_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating ZIP:', error);
      alert('An error occurred while generating the ZIP. Check console for details.');
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center pt-12 px-6 overflow-y-auto bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex flex-col">
            <span>Export Report</span>
            <span className="text-lg text-gray-500 font-normal mt-1">تصدير التقرير</span>
          </h2>
          
          <div className="mt-8 space-y-6">
            {/* Summary Section */}
            <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
              <h3 className="text-sm font-semibold text-primary-900 uppercase tracking-wider mb-4">Summary</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-primary-700">Source Documents</dt>
                  <dd className="text-2xl font-bold text-primary-900">{files.length}</dd>
                </div>
                <div>
                  <dt className="text-sm text-primary-700">Total Effective Pages</dt>
                  <dd className="text-2xl font-bold text-primary-900">{totalEffectivePages}</dd>
                </div>
                <div>
                  <dt className="text-sm text-primary-700">Blank Pages Added</dt>
                  <dd className="text-xl font-bold text-primary-800">{blankPagesAdded}</dd>
                </div>
                <div>
                  <dt className="text-sm text-primary-700">Pages Deleted</dt>
                  <dd className="text-xl font-bold text-primary-800">{deletedPages}</dd>
                </div>
              </dl>
            </div>

            {/* Settings Section */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Export Settings</h3>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600 transition-colors"
                    checked={removeAnnotations}
                    onChange={(e) => setRemoveAnnotations(e.target.checked)}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
                    Strip Hyperlinks & Annotations
                  </span>
                  <span className="text-sm text-gray-500">
                    إزالة الروابط والتعليقات
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    Recommended for clean printing. Removes clickable links and PDF annotations.
                  </p>
                </div>
              </label>
            </div>

            {/* Export Actions */}
            <div className="pt-4 flex flex-col gap-4">
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf || isExportingZip || totalEffectivePages === 0}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isExportingPdf ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <FileText size={24} />
                )}
                <div className="flex flex-col items-start">
                  <span className="text-lg">Export Single PDF Report</span>
                  <span className="text-sm text-primary-100 font-normal">تصدير كملف PDF واحد</span>
                </div>
              </button>

              <button
                onClick={handleExportZip}
                disabled={isExportingPdf || isExportingZip || files.length === 0}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:border-gray-100 text-gray-700 disabled:text-gray-400 rounded-xl font-medium transition-all"
              >
                {isExportingZip ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <Download size={24} />
                )}
                <div className="flex flex-col items-start">
                  <span>Export ZIP Archive (Original Files)</span>
                  <span className="text-xs text-gray-500 font-normal">تصدير الملفات الأصلية كـ ZIP</span>
                </div>
              </button>
              <p className="text-xs text-center text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-2">
                <strong>Note:</strong> ZIP export contains the original files in sorted order. Global edits (blank pages, deletions, insertions) only apply to the PDF export.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 mb-12">
        <button
          onClick={onPrevStep}
          disabled={isExportingPdf || isExportingZip}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={18} />
          <span className="flex flex-col items-start">
            <span>Back to Review</span>
            <span className="text-xs text-gray-500 font-normal">العودة للمراجعة</span>
          </span>
        </button>
      </div>
    </div>
  );
}
