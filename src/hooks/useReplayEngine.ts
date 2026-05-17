import { useEffect } from 'react';
import { useReplayStore } from '../store/replayStore';

export function useReplayEngine() {
  const isPlaying = useReplayStore(s => s.isPlaying);
  const playbackSpeed = useReplayStore(s => s.playbackSpeed);
  const stepForward = useReplayStore(s => s.stepForward);
  const currentMatch = useReplayStore(s => s.currentMatch);
  const currentStepIndex = useReplayStore(s => s.currentStepIndex);

  useEffect(() => {
    if (!isPlaying) return;
    const match = currentMatch();
    if (!match || currentStepIndex >= match.steps.length - 1) {
      useReplayStore.getState().togglePlay();
      return;
    }
    const intervalMs = 1500 / playbackSpeed;
    const timer = setInterval(() => {
      stepForward();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, currentStepIndex, stepForward, currentMatch]);
}
