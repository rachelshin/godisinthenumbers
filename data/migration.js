// data/migration.js
import { loadItem } from './storage';
import { STORAGE_KEYS, BDA_STORAGE_KEYS, DEFAULT_CATEGORIES, DEFAULT_BDA_CATEGORIES } from './constants';
import { fsSaveMeta, fsBatchWritePurchases, fsSaveSobriety, fsSaveMode } from './firestoreStorage';

export async function migrateLocalToFirestore(uid) {
  const [
    personalCats, personalPlan, personalPurchases, personalBalance, personalBills,
    bdaCats,      bdaPlan,      bdaPurchases,      bdaBalance,      bdaBills,
    sobriety,     mode,
  ] = await Promise.all([
    loadItem(STORAGE_KEYS.categories,     DEFAULT_CATEGORIES),
    loadItem(STORAGE_KEYS.plan,           { Ideal: {}, Realistic: {}, Mini: {} }),
    loadItem(STORAGE_KEYS.purchases,      []),
    loadItem(STORAGE_KEYS.bankBalance,    { amount: null, updatedAt: null }),
    loadItem(STORAGE_KEYS.bills,          []),
    loadItem(BDA_STORAGE_KEYS.categories, DEFAULT_BDA_CATEGORIES),
    loadItem(BDA_STORAGE_KEYS.plan,       { Ideal: {}, Realistic: {}, Mini: {} }),
    loadItem(BDA_STORAGE_KEYS.purchases,  []),
    loadItem(BDA_STORAGE_KEYS.bankBalance,{ amount: null, updatedAt: null }),
    loadItem(BDA_STORAGE_KEYS.bills,      []),
    loadItem('numbers_sobriety',          { history: {} }),
    loadItem('numbers_mode',              'personal'),
  ]);

  await Promise.all([
    fsSaveMeta(uid, 'personal', {
      categories: personalCats, plan: personalPlan,
      bankBalance: personalBalance, bills: personalBills,
    }),
    fsSaveMeta(uid, 'business', {
      categories: bdaCats, plan: bdaPlan,
      bankBalance: bdaBalance, bills: bdaBills,
    }),
    fsSaveSobriety(uid, sobriety),
    fsSaveMode(uid, mode),
  ]);

  if (personalPurchases.length > 0) await fsBatchWritePurchases(uid, 'personal', personalPurchases);
  if (bdaPurchases.length > 0)      await fsBatchWritePurchases(uid, 'business', bdaPurchases);
}
