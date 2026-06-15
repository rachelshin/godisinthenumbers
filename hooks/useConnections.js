// hooks/useConnections.js
import { useState, useCallback } from 'react';
import {
  fsGetOrCreateShareCode,
  fsRegenerateShareCode,
  fsJoinByCode,
  fsLoadConnections,
  fsLoadSharingViewers,
  fsStopViewing,
  fsRevokeViewer,
  fsLoadOtherUserData,
} from '../data/firestoreStorage';

export function useConnections(user) {
  const [shareCode, setShareCode]     = useState(null);
  const [viewing, setViewing]         = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading]         = useState(false);

  const loadConnections = useCallback(async () => {
    if (!user || user.isAnonymous) return;
    setLoading(true);
    try {
      const [code, viewingList, viewers] = await Promise.all([
        fsGetOrCreateShareCode(user.uid),
        fsLoadConnections(user.uid),
        fsLoadSharingViewers(user.uid),
      ]);
      setShareCode(code);
      setViewing(viewingList);
      setViewerCount(viewers.length);
    } catch (e) {
      console.warn('loadConnections error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const regenerateCode = useCallback(async () => {
    if (!user) return;
    const newCode = await fsRegenerateShareCode(user.uid);
    setShareCode(newCode);
    setViewerCount(0);
    return newCode;
  }, [user]);

  const joinByCode = useCallback(async (code, nickname) => {
    if (!user) throw new Error('Not signed in');
    await fsJoinByCode(user.uid, code.trim().toUpperCase(), nickname.trim() || 'Connection');
    const newList = await fsLoadConnections(user.uid);
    setViewing(newList);
  }, [user]);

  const stopViewing = useCallback(async (ownerUid) => {
    if (!user) return;
    await fsStopViewing(user.uid, ownerUid);
    setViewing(prev => prev.filter(c => c.uid !== ownerUid));
  }, [user]);

  const revokeViewer = useCallback(async (viewerUid) => {
    if (!user) return;
    await fsRevokeViewer(user.uid, viewerUid);
    setViewerCount(prev => Math.max(0, prev - 1));
  }, [user]);

  const loadUserData = useCallback((uid) => fsLoadOtherUserData(uid), []);

  return {
    shareCode, viewing, viewerCount, loading,
    loadConnections, regenerateCode, joinByCode, stopViewing, revokeViewer, loadUserData,
  };
}
