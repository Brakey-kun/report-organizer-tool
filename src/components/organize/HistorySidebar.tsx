import { Trash } from 'lucide-react';
import type { ReportSession } from '../../types';

interface HistorySidebarProps {
  sessions: ReportSession[];
  onClose: () => void;
  onLoadSession: (session: ReportSession) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
}

export default function HistorySidebar(props: HistorySidebarProps) {
  const { sessions, onClose, onLoadSession, onDeleteSession } = props;

  return (
    <div className="absolute inset-y-0 left-0 w-80 bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col transition-all">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="font-bold text-gray-800">Saved Reports History</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-800 font-bold">✕</button>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center mt-10">No saved sessions yet.</p>
        ) : (
          sessions.map(s => (
            <div key={s.id} onClick={() => onLoadSession(s)} className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-colors group">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-gray-800">{s.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{s.files.length} documents</p>
                  <p className="text-[10px] text-gray-400">{new Date(s.updatedAt).toLocaleString()}</p>
                </div>
                <button onClick={(e) => onDeleteSession(e, s.id)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash size={14}/>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
