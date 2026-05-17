import { useCallback, useRef, useState } from 'react';
import { useReplayStore, deserializeMatch } from '../store/replayStore';
import type { WorkerMessage } from '../types/game';

export function FileDropZone() {
  const setMatches = useReplayStore(s => s.setMatches);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    setProgress(0);
    setStatusMsg(`Parsing ${file.name}…`);

    const worker = new Worker(new URL('../workers/logParser.worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.pct);
      } else if (msg.type === 'done') {
        const matches = msg.matches.map(deserializeMatch);
        if (matches.length === 0) {
          setError('No valid matches found in this log file.');
          setProgress(null);
          setStatusMsg(null);
        } else {
          setMatches(matches);
          setProgress(null);
          setStatusMsg(null);
        }
        worker.terminate();
      } else if (msg.type === 'error') {
        setError(msg.message);
        setProgress(null);
        setStatusMsg(null);
        worker.terminate();
      }
    };

    file.arrayBuffer().then(buf => {
      worker.postMessage(buf, [buf]);
    });
  }, [setMatches]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">MTG Arena Replay Viewer</h1>
        <p className="text-slate-400 text-center mb-6 sm:mb-8 text-sm sm:text-base">Upload your player.log to watch matches back</p>

        <div
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors ${
            dragging ? 'border-blue-400 bg-blue-950/30' : 'border-slate-600 hover:border-slate-400 bg-slate-900/50'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="text-5xl mb-4">🃏</div>
          <p className="text-white text-lg font-medium mb-2">Tap to open player.log</p>
          <p className="text-slate-400 text-sm hidden sm:block">or drag and drop</p>
          <p className="text-slate-500 text-xs mt-3">Supports player.log and any MTGA log file</p>
          <p className="text-slate-600 text-xs mt-1 sm:hidden">On iPhone: Files app → On My iPhone → MTGA</p>
          <input
            ref={inputRef}
            type="file"
            accept=".log,.txt,*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {progress !== null && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>{statusMsg}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-950/50 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
