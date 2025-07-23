// hooks/useYDoc.ts
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function useYDoc(docId = 'room-1') {
  const ydoc = new Y.Doc();
  const provider = new WebsocketProvider('ws://localhost:1234', docId, ydoc);
  const yMap = ydoc.getMap('canvas');

  return { ydoc, provider, yMap };
}
