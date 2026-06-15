// data/firestoreStorage.js
import { db } from './firebase';
import {
  doc, getDoc, setDoc, collection,
  getDocs, deleteDoc, writeBatch, arrayUnion, arrayRemove,
} from 'firebase/firestore';

const metaRef     = (uid, mode) => doc(db, 'users', uid, 'meta', mode === 'business' ? 'business' : 'personal');
const purchCol    = (uid, mode) => collection(db, 'users', uid, mode === 'business' ? 'businessPurchases' : 'personalPurchases');
const sobrietyRef = (uid)       => doc(db, 'users', uid, 'meta', 'sobriety');
const settingsRef = (uid)       => doc(db, 'users', uid, 'meta', 'settings');

export async function fsLoadMeta(uid, mode) {
  const snap = await getDoc(metaRef(uid, mode));
  return snap.exists() ? snap.data() : null;
}

export async function fsSaveMeta(uid, mode, data) {
  await setDoc(metaRef(uid, mode), data, { merge: true });
}

export async function fsLoadPurchases(uid, mode) {
  const snap = await getDocs(purchCol(uid, mode));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fsSetPurchase(uid, mode, purchase) {
  const { id, ...data } = purchase;
  await setDoc(doc(purchCol(uid, mode), id), data);
}

export async function fsDeletePurchase(uid, mode, purchaseId) {
  await deleteDoc(doc(purchCol(uid, mode), purchaseId));
}

export async function fsLoadSobriety(uid) {
  const snap = await getDoc(sobrietyRef(uid));
  return snap.exists() ? snap.data() : { history: {} };
}

export async function fsSaveSobriety(uid, sobriety) {
  await setDoc(sobrietyRef(uid), sobriety, { merge: true });
}

export async function fsLoadMode(uid) {
  const snap = await getDoc(settingsRef(uid));
  return snap.exists() ? (snap.data().mode || null) : null;
}

export async function fsSaveMode(uid, mode) {
  await setDoc(settingsRef(uid), { mode }, { merge: true });
}

export async function fsUserExists(uid) {
  const snap = await getDoc(metaRef(uid, 'personal'));
  return snap.exists();
}

// ── Sharing / connections ────────────────────────────────────

const sharingRef     = (uid)  => doc(db, 'users', uid, 'meta', 'sharing');
const connectionsRef = (uid)  => doc(db, 'users', uid, 'meta', 'connections');
const shareCodeRef   = (code) => doc(db, 'shareCodes', code);

function makeShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function fsGetOrCreateShareCode(uid) {
  const snap = await getDoc(sharingRef(uid));
  if (snap.exists() && snap.data().code) return snap.data().code;
  let code;
  for (let i = 0; i < 10; i++) {
    code = makeShareCode();
    const exists = await getDoc(shareCodeRef(code));
    if (!exists.exists()) break;
  }
  await Promise.all([
    setDoc(sharingRef(uid), { code, viewers: [] }, { merge: true }),
    setDoc(shareCodeRef(code), { uid, createdAt: new Date().toISOString() }),
  ]);
  return code;
}

export async function fsRegenerateShareCode(uid) {
  const snap = await getDoc(sharingRef(uid));
  const oldCode = snap.exists() ? snap.data().code : null;
  let code;
  for (let i = 0; i < 10; i++) {
    code = makeShareCode();
    const exists = await getDoc(shareCodeRef(code));
    if (!exists.exists()) break;
  }
  const batch = writeBatch(db);
  if (oldCode) batch.delete(shareCodeRef(oldCode));
  batch.set(sharingRef(uid), { code, viewers: [] });
  batch.set(shareCodeRef(code), { uid, createdAt: new Date().toISOString() });
  await batch.commit();
  return code;
}

export async function fsJoinByCode(viewerUid, code, nickname) {
  const codeSnap = await getDoc(shareCodeRef(code));
  if (!codeSnap.exists()) throw new Error('not_found');
  const ownerUid = codeSnap.data().uid;
  if (ownerUid === viewerUid) throw new Error('own');
  const connSnap = await getDoc(connectionsRef(viewerUid));
  const existing = connSnap.exists() ? (connSnap.data().viewing || []) : [];
  if (existing.some(c => c.uid === ownerUid)) throw new Error('already');
  const newEntry = { uid: ownerUid, nickname, joinedAt: new Date().toISOString() };
  await Promise.all([
    setDoc(sharingRef(ownerUid), { viewers: arrayUnion(viewerUid) }, { merge: true }),
    setDoc(connectionsRef(viewerUid), { viewing: [...existing, newEntry] }, { merge: true }),
  ]);
}

export async function fsLoadConnections(uid) {
  const snap = await getDoc(connectionsRef(uid));
  return snap.exists() ? (snap.data().viewing || []) : [];
}

export async function fsLoadSharingViewers(uid) {
  const snap = await getDoc(sharingRef(uid));
  return snap.exists() ? (snap.data().viewers || []) : [];
}

export async function fsStopViewing(viewerUid, ownerUid) {
  const connSnap = await getDoc(connectionsRef(viewerUid));
  const newViewing = connSnap.exists()
    ? (connSnap.data().viewing || []).filter(c => c.uid !== ownerUid)
    : [];
  await Promise.all([
    setDoc(connectionsRef(viewerUid), { viewing: newViewing }, { merge: true }),
    setDoc(sharingRef(ownerUid), { viewers: arrayRemove(viewerUid) }, { merge: true }),
  ]);
}

export async function fsRevokeViewer(ownerUid, viewerUid) {
  await setDoc(sharingRef(ownerUid), { viewers: arrayRemove(viewerUid) }, { merge: true });
}

export async function fsLoadOtherUserData(uid) {
  const [meta, purch, sober] = await Promise.all([
    fsLoadMeta(uid, 'personal'),
    fsLoadPurchases(uid, 'personal'),
    fsLoadSobriety(uid),
  ]);
  return {
    categories: meta?.categories || [],
    plan: meta?.plan || { Ideal: {}, Realistic: {}, Mini: {} },
    bills: meta?.bills || [],
    bankBalance: meta?.bankBalance || { amount: null, updatedAt: null },
    purchases: purch.filter(p => !p.deleted),
    sobriety: sober || { history: {} },
  };
}

export async function fsBatchWritePurchases(uid, mode, purchases) {
  const col = purchCol(uid, mode);
  // Chunk into 400 to stay under Firestore's 500-op batch limit
  for (let i = 0; i < purchases.length; i += 400) {
    const batch = writeBatch(db);
    purchases.slice(i, i + 400).forEach(p => {
      const { id, ...data } = p;
      batch.set(doc(col, id), data);
    });
    await batch.commit();
  }
}
