import { useReplayStore } from './store/replayStore';
import { FileDropZone } from './components/FileDropZone';
import { ReplayViewer } from './components/ReplayViewer';

export default function App() {
  const matches = useReplayStore(s => s.matches);
  return matches.length > 0 ? <ReplayViewer /> : <FileDropZone />;
}
