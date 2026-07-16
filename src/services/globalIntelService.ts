import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { GlobalIntelFeed } from '../types/globalIntel';

const GLOBAL_INTEL_DOC_PATH = ['siteConfig', 'globalIntel'] as const;

function globalIntelDocRef() {
  return doc(db, GLOBAL_INTEL_DOC_PATH[0], GLOBAL_INTEL_DOC_PATH[1]);
}

export function subscribeToGlobalIntelFeed(
  onData: (feed: GlobalIntelFeed | null) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    globalIntelDocRef(),
    (snapshot) => {
      onData(snapshot.exists() ? (snapshot.data() as GlobalIntelFeed) : null);
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function saveGlobalIntelFeed(feed: GlobalIntelFeed) {
  try {
    await setDoc(globalIntelDocRef(), {
      ...feed,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${GLOBAL_INTEL_DOC_PATH[0]}/${GLOBAL_INTEL_DOC_PATH[1]}`);
  }
}

export { GLOBAL_INTEL_DOC_PATH };