// hooks/useAppData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_CATEGORIES, DEFAULT_BDA_CATEGORIES, STORAGE_KEYS, BDA_STORAGE_KEYS } from '../data/constants';
import { auth } from '../data/firebase';
import { onAuthStateChanged, getRedirectResult, signOut } from 'firebase/auth';
import {
  fsLoadMeta, fsSaveMeta,
  fsLoadPurchases, fsSetPurchase, fsDeletePurchase,
  fsLoadSobriety, fsSaveSobriety,
  fsLoadMode, fsSaveMode,
  fsUserExists,
} from '../data/firestoreStorage';
import { migrateLocalToFirestore } from '../data/migration';
import { loadItem, saveItem } from '../data/storage';

const SAVINGS_CATEGORY = DEFAULT_CATEGORIES.find(c => c.name === 'Savings');
function ensureSavingsCategory(cats) {
  if (cats.some(c => c.name === 'Savings')) return cats;
  return [...cats, SAVINGS_CATEGORY];
}


export function useAppData() {
  const [mode, setMode]                         = useState('personal');
  const [categories, setCategories]             = useState(DEFAULT_CATEGORIES);
  const [idealCategories, setIdealCategories]   = useState(DEFAULT_CATEGORIES);
  const [plan, setPlan]                         = useState({ Ideal: {}, Realistic: {}, Mini: {} });
  const [planOverrides, setPlanOverrides]       = useState({});
  const [planVersions, setPlanVersions]         = useState({});
  const [purchases, setPurchases]               = useState([]);
  const [bankBalance, setBankBalance]           = useState({ amount: null, updatedAt: null });
  const [bills, setBills]                       = useState([]);
  const [sobriety, setSobriety]                 = useState({ history: {} });
  const [savingsGoals, setSavingsGoals]         = useState({});
  const [loaded, setLoaded]                     = useState(false);
  const [user, setUser]                         = useState(null);
  const [authReady, setAuthReady]               = useState(false);
  const [modeSwitching, setModeSwitching]       = useState(false);

  const userRef      = useRef(null);
  const modeRef      = useRef('personal');
  const billsRef     = useRef([]);
  const purchasesRef = useRef([]);
  const planRef           = useRef({ Ideal: {}, Realistic: {}, Mini: {} });
  const planOverridesRef  = useRef({});
  const planVersionsRef   = useRef({});

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { billsRef.current = bills; }, [bills]);
  useEffect(() => { purchasesRef.current = purchases; }, [purchases]);
  useEffect(() => { planRef.current = plan; }, [plan]);
  useEffect(() => { planOverridesRef.current = planOverrides; }, [planOverrides]);
  useEffect(() => { planVersionsRef.current = planVersions; }, [planVersions]);

  // ── Load localStorage on startup ─────────────────────────────
  useEffect(() => {
    (async () => {
      const savedMode   = await loadItem('numbers_mode', 'personal');
      const keys        = savedMode === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
      const defaultCats = savedMode === 'business' ? DEFAULT_BDA_CATEGORIES : DEFAULT_CATEGORIES;
      const [cats, idealCats, pl, po, pv, purch, bal, bls, sober, sg] = await Promise.all([
        loadItem(keys.categories,      defaultCats),
        loadItem(keys.idealCategories, defaultCats),
        loadItem(keys.plan,            { Ideal: {}, Realistic: {}, Mini: {} }),
        loadItem(keys.planOverrides,   {}),
        loadItem(keys.planVersions,    {}),
        loadItem(keys.purchases,       []),
        loadItem(keys.bankBalance,     { amount: null, updatedAt: null }),
        loadItem(keys.bills,           []),
        loadItem('numbers_sobriety',   { history: {} }),
        loadItem(keys.savingsGoals,    {}),
      ]);
      const migratedCats = savedMode === 'personal' ? ensureSavingsCategory(cats) : cats;
      const migratedIdealCats = savedMode === 'personal' ? ensureSavingsCategory(idealCats) : idealCats;
      if (migratedCats !== cats) saveItem(keys.categories, migratedCats);
      if (migratedIdealCats !== idealCats) saveItem(keys.idealCategories, migratedIdealCats);
      modeRef.current           = savedMode;
      purchasesRef.current      = purch;
      planRef.current           = pl;
      planOverridesRef.current  = po;
      planVersionsRef.current   = pv;
      billsRef.current          = bls;
      setMode(savedMode);
      setCategories(migratedCats);
      setIdealCategories(migratedIdealCats);
      setPlan(pl);
      setPlanOverrides(po);
      setPlanVersions(pv);
      setPurchases(purch);
      setBankBalance(bal);
      setBills(bls);
      setSavingsGoals(sg);
      let soberData = sober;
      if (!soberData.history) {
        const h = {};
        if (soberData.date && soberData.answer) h[soberData.date] = soberData.answer;
        soberData = { history: h };
        saveItem('numbers_sobriety', soberData);
      }
      setSobriety(soberData);
      setLoaded(true);
    })();
  }, []);

  // ── Load all data from Firestore ─────────────────────────────
  const loadFromFirestore = useCallback(async (uid) => {
    const savedMode   = await fsLoadMode(uid) || 'personal';
    const [personalMeta, bdaMeta, personalPurch, bdaPurch, sober] = await Promise.all([
      fsLoadMeta(uid, 'personal'),
      fsLoadMeta(uid, 'business'),
      fsLoadPurchases(uid, 'personal'),
      fsLoadPurchases(uid, 'business'),
      fsLoadSobriety(uid),
    ]);
    const isBiz       = savedMode === 'business';
    const meta        = isBiz ? bdaMeta : personalMeta;
    const defaultCats = isBiz ? DEFAULT_BDA_CATEGORIES : DEFAULT_CATEGORIES;
    const rawCats     = meta?.categories      || defaultCats;
    const rawIdealCats= meta?.idealCategories || defaultCats;
    const cats        = !isBiz ? ensureSavingsCategory(rawCats) : rawCats;
    const idealCats   = !isBiz ? ensureSavingsCategory(rawIdealCats) : rawIdealCats;
    const pl          = meta?.plan            || { Ideal: {}, Realistic: {}, Mini: {} };
    const po          = meta?.planOverrides   || {};
    const pv          = meta?.planVersions    || {};
    const bls         = meta?.bills           || [];
    const bal         = meta?.bankBalance     || { amount: null, updatedAt: null };
    const sg          = meta?.savingsGoals    || {};
    const purch       = isBiz ? bdaPurch : personalPurch;
    if (cats !== rawCats) fsSaveMeta(uid, savedMode, { categories: cats }).catch(console.warn);
    if (idealCats !== rawIdealCats) fsSaveMeta(uid, savedMode, { idealCategories: idealCats }).catch(console.warn);
    modeRef.current           = savedMode;
    purchasesRef.current      = purch;
    planRef.current           = pl;
    planOverridesRef.current  = po;
    planVersionsRef.current   = pv;
    billsRef.current          = bls;
    setMode(savedMode);
    setCategories(cats);
    setIdealCategories(idealCats);
    setPlan(pl);
    setPlanOverrides(po);
    setPlanVersions(pv);
    setPurchases(purch);
    setBankBalance(bal);
    setBills(bls);
    setSavingsGoals(sg);
    setSobriety(sober);
  }, []);

  // ── Auth listener ────────────────────────────────────────────
  useEffect(() => {
    getRedirectResult(auth).catch(console.warn);
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      const wasSignedIn = !!userRef.current;
      userRef.current = firebaseUser;
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        try {
          const exists = await fsUserExists(firebaseUser.uid);
          if (exists) {
            await loadFromFirestore(firebaseUser.uid);
          } else {
            await migrateLocalToFirestore(firebaseUser.uid);
            await loadFromFirestore(firebaseUser.uid);
          }
        } catch (e) {
          console.warn('Firestore sync error:', e);
        }
      } else if (wasSignedIn) {
        const empty = { Ideal: {}, Realistic: {}, Mini: {} };
        modeRef.current           = 'personal';
        purchasesRef.current      = [];
        planRef.current           = empty;
        planOverridesRef.current  = {};
        billsRef.current          = [];
        setMode('personal');
        setCategories(DEFAULT_CATEGORIES);
        setIdealCategories(DEFAULT_CATEGORIES);
        setPlan(empty);
        setPlanOverrides({});
        setPurchases([]);
        setBankBalance({ amount: null, updatedAt: null });
        setBills([]);
        setSobriety({ history: {} });
      }
    });
    return unsub;
  }, [loadFromFirestore]);

  const handleSignOut = useCallback(async () => {
    userRef.current = null;
    await signOut(auth);
  }, []);

  // ── Mode switch ──────────────────────────────────────────────
  const switchMode = useCallback(async (newMode) => {
    setModeSwitching(true);
    const keys        = newMode === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    const defaultCats = newMode === 'business' ? DEFAULT_BDA_CATEGORIES : DEFAULT_CATEGORIES;
    let cats, idealCats, pl, po, pv, purch, bal, bls, sg;
    let fromFirestore = false;
    if (userRef.current) {
      try {
        const [meta, fetchedPurch] = await Promise.all([
          fsLoadMeta(userRef.current.uid, newMode),
          fsLoadPurchases(userRef.current.uid, newMode),
        ]);
        cats      = meta?.categories      || defaultCats;
        idealCats = meta?.idealCategories || defaultCats;
        pl        = meta?.plan            || { Ideal: {}, Realistic: {}, Mini: {} };
        po        = meta?.planOverrides   || {};
        pv        = meta?.planVersions    || {};
        bls       = meta?.bills           || [];
        bal       = meta?.bankBalance     || { amount: null, updatedAt: null };
        sg        = meta?.savingsGoals    || {};
        purch     = fetchedPurch;
        fromFirestore = true;
      } catch (e) {
        console.warn('Firestore switchMode error, falling back to localStorage:', e);
      }
    }
    if (!fromFirestore) {
      [cats, idealCats, pl, po, pv, purch, bal, bls, sg] = await Promise.all([
        loadItem(keys.categories,      defaultCats),
        loadItem(keys.idealCategories, defaultCats),
        loadItem(keys.plan,            { Ideal: {}, Realistic: {}, Mini: {} }),
        loadItem(keys.planOverrides,   {}),
        loadItem(keys.planVersions,    {}),
        loadItem(keys.purchases,       []),
        loadItem(keys.bankBalance,     { amount: null, updatedAt: null }),
        loadItem(keys.bills,           []),
        loadItem(keys.savingsGoals,    {}),
      ]);
    }
    if (newMode === 'personal') {
      const migratedCats = ensureSavingsCategory(cats);
      const migratedIdeal = ensureSavingsCategory(idealCats);
      if (migratedCats !== cats) { cats = migratedCats; if (fromFirestore && userRef.current) fsSaveMeta(userRef.current.uid, newMode, { categories: cats }).catch(console.warn); else saveItem(keys.categories, cats); }
      if (migratedIdeal !== idealCats) { idealCats = migratedIdeal; if (fromFirestore && userRef.current) fsSaveMeta(userRef.current.uid, newMode, { idealCategories: idealCats }).catch(console.warn); else saveItem(keys.idealCategories, idealCats); }
    }
    modeRef.current           = newMode;
    purchasesRef.current      = purch;
    planRef.current           = pl;
    planOverridesRef.current  = po || {};
    planVersionsRef.current   = pv || {};
    billsRef.current          = bls;
    setCategories(cats);
    setIdealCategories(idealCats);
    setPlan(pl);
    setPlanOverrides(po || {});
    setPlanVersions(pv || {});
    setPurchases(purch);
    setBankBalance(bal);
    setBills(bls);
    setSavingsGoals(sg);
    setMode(newMode);
    saveItem('numbers_mode', newMode);
    if (userRef.current) fsSaveMode(userRef.current.uid, newMode).catch(console.warn);
    setModeSwitching(false);
  }, []);

  // ── Callbacks — ref pattern keeps side effects out of updaters ──
  const updateCategories = useCallback((cats) => {
    setCategories(cats);
    const keys = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    saveItem(keys.categories, cats);
    if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { categories: cats }).catch(console.warn);
  }, []);

  const updateIdealCategories = useCallback((cats) => {
    setIdealCategories(cats);
    const keys = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    saveItem(keys.idealCategories, cats);
    if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { idealCategories: cats }).catch(console.warn);
  }, []);

  const updatePlan = useCallback((pl) => {
    planRef.current = pl;
    setPlan(pl);
    const keys = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    saveItem(keys.plan, pl);
    if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { plan: pl }).catch(console.warn);
  }, []);

  const updatePlanOverride = useCallback((po) => {
    planOverridesRef.current = po;
    setPlanOverrides(po);
    const keys = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    saveItem(keys.planOverrides, po);
    if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { planOverrides: po }).catch(console.warn);
  }, []);

  const updatePlanVersions = useCallback((pv) => {
    planVersionsRef.current = pv;
    setPlanVersions(pv);
    const keys = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    saveItem(keys.planVersions, pv);
    if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { planVersions: pv }).catch(console.warn);
  }, []);

  const addPurchase = useCallback((p) => {
    const next = [p, ...purchasesRef.current];
    purchasesRef.current = next;
    setPurchases(next);
    const keys = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    saveItem(keys.purchases, next);
    if (userRef.current) fsSetPurchase(userRef.current.uid, modeRef.current, p).catch(console.warn);
  }, []);

  const deletePurchase = useCallback((id) => {
    const next = purchasesRef.current.filter(p => p.id !== id);
    purchasesRef.current = next;
    setPurchases(next);
    const keys = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    saveItem(keys.purchases, next);
    if (userRef.current) fsDeletePurchase(userRef.current.uid, modeRef.current, id).catch(console.warn);
  }, []);

  const updatePurchase = useCallback((updated) => {
    const next = purchasesRef.current.map(p => p.id === updated.id ? updated : p);
    purchasesRef.current = next;
    setPurchases(next);
    const keys = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    saveItem(keys.purchases, next);
    if (userRef.current) fsSetPurchase(userRef.current.uid, modeRef.current, updated).catch(console.warn);
  }, []);

  const addBill = useCallback((bill) => {
    const keys = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;

    const nextBills = [...billsRef.current, bill];
    billsRef.current = nextBills;
    setBills(nextBills);
    saveItem(keys.bills, nextBills);
    if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { bills: nextBills }).catch(console.warn);

    if (bill.subcategory) {
      const pk      = `${bill.category} > ${bill.subcategory}`;
      const existing = planRef.current.Realistic?.[pk];
      if (!(existing && parseFloat(existing) > 0)) {
        const nextPlan = { ...planRef.current, Realistic: { ...planRef.current.Realistic, [pk]: bill.amount.toString() } };
        planRef.current = nextPlan;
        setPlan(nextPlan);
        saveItem(keys.plan, nextPlan);
        if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { plan: nextPlan }).catch(console.warn);
      }
    }

    const today = new Date();
    if (bill.dayOfMonth === today.getDate()) {
      const entry = {
        id: `bill-${bill.id}-${today.getFullYear()}-${today.getMonth()}`,
        date: today.toISOString(),
        amount: bill.amount,
        category: bill.category,
        subcategory: bill.subcategory || '',
        note: '↻ recurring',
        income: false,
        billId: bill.id,
      };
      if (!purchasesRef.current.some(p => p.id === entry.id)) {
        const nextPurch = [entry, ...purchasesRef.current];
        purchasesRef.current = nextPurch;
        setPurchases(nextPurch);
        saveItem(keys.purchases, nextPurch);
        if (userRef.current) fsSetPurchase(userRef.current.uid, modeRef.current, entry).catch(console.warn);
      }
    }
  }, []);

  const updateBill = useCallback((updated) => {
    const keys     = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    const nextBills = billsRef.current.map(b => b.id === updated.id ? updated : b);
    billsRef.current = nextBills;
    setBills(nextBills);
    saveItem(keys.bills, nextBills);
    if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { bills: nextBills }).catch(console.warn);

    if (updated.subcategory) {
      const pk      = `${updated.category} > ${updated.subcategory}`;
      const nextPlan = { ...planRef.current, Realistic: { ...planRef.current.Realistic, [pk]: updated.amount.toString() } };
      planRef.current = nextPlan;
      setPlan(nextPlan);
      saveItem(keys.plan, nextPlan);
      if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { plan: nextPlan }).catch(console.warn);
    }
  }, []);

  const deleteBill = useCallback((id) => {
    const keys        = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    const billToDelete = billsRef.current.find(b => b.id === id);
    const nextBills   = billsRef.current.filter(b => b.id !== id);
    billsRef.current  = nextBills;
    setBills(nextBills);
    saveItem(keys.bills, nextBills);
    if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { bills: nextBills }).catch(console.warn);

    if (billToDelete?.subcategory) {
      const pk = `${billToDelete.category} > ${billToDelete.subcategory}`;
      if (planRef.current.Realistic?.[pk]) {
        const nextPlan = { ...planRef.current, Realistic: { ...planRef.current.Realistic } };
        delete nextPlan.Realistic[pk];
        planRef.current = nextPlan;
        setPlan(nextPlan);
        saveItem(keys.plan, nextPlan);
        if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { plan: nextPlan }).catch(console.warn);
      }
    }
  }, []);

  const updateSobriety = useCallback((s) => {
    setSobriety(s);
    saveItem('numbers_sobriety', s);
    if (userRef.current) fsSaveSobriety(userRef.current.uid, s).catch(console.warn);
  }, []);

  const updateBankBalance = useCallback((amount) => {
    const next = { amount, updatedAt: new Date().toISOString() };
    setBankBalance(next);
    const keys = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    saveItem(keys.bankBalance, next);
    if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { bankBalance: next }).catch(console.warn);
  }, []);

  const updateSavingsGoals = useCallback((sg) => {
    setSavingsGoals(sg);
    const keys = modeRef.current === 'business' ? BDA_STORAGE_KEYS : STORAGE_KEYS;
    saveItem(keys.savingsGoals, sg);
    if (userRef.current) fsSaveMeta(userRef.current.uid, modeRef.current, { savingsGoals: sg }).catch(console.warn);
  }, []);

  const visiblePurchases = purchases.filter(p => !p.deleted);

  return {
    mode, categories, idealCategories, plan, planOverrides, planVersions, purchases, visiblePurchases, bankBalance, bills, sobriety, savingsGoals,
    loaded, user, authReady, modeSwitching,
    userRef,
    handleSignOut, switchMode,
    updateCategories, updateIdealCategories, updatePlan, updatePlanOverride, updatePlanVersions,
    addPurchase, deletePurchase, updatePurchase,
    addBill, updateBill, deleteBill,
    updateSobriety, updateBankBalance, updateSavingsGoals,
  };
}
