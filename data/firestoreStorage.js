// data/firestoreStorage.js
import { db } from './firebase';
import {
  doc, getDoc, setDoc, collection,
  getDocs, deleteDoc, writeBatch,
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
