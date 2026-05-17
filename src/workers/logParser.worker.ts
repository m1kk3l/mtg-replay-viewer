import { parseLog } from '../lib/logParser';

self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
  try {
    const text = new TextDecoder().decode(e.data);
    const matches = parseLog(text, (pct) => {
      self.postMessage({ type: 'progress', pct });
    });
    self.postMessage({ type: 'done', matches });
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) });
  }
};
