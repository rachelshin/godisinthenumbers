// App.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StatusBar, Share, Platform,
} from 'react-native';

if (Platform.OS === 'web') {
  const s = document.createElement('style');
  s.textContent = 'input:focus, textarea:focus { outline: none !important; box-shadow: none !important; }';
  document.head.appendChild(s);
}
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { STORAGE_KEYS, BDA_STORAGE_KEYS } from './data/constants';
import { fsLoadPurchases } from './data/firestoreStorage';
import { loadItem } from './data/storage';
import { colors } from './styles/shared';
import styles from './styles/app';

import { useAppData } from './hooks/useAppData';
import { IconUpload, IconLogOut } from './components/Icon';
import TodaysNumbersScreen from './screens/TodaysNumbersScreen';
import SpendingPlanScreen  from './screens/SpendingPlanScreen';
import RecordsScreen       from './screens/RecordsScreen';
import AuthScreen          from './screens/AuthScreen';

const TABS = [
  { key: 'Today',         label: 'Today' },
  { key: 'Spending Plan', label: 'Spending Plan' },
  { key: 'Records',       label: 'Records' },
];

export default function App() {
  const {
    mode, categories, plan, purchases, bankBalance, bills, sobriety,
    loaded, user, authReady, modeSwitching,
    userRef,
    handleSignOut, switchMode,
    updateCategories, updatePlan,
    addPurchase, deletePurchase, updatePurchase,
    addBill, updateBill, deleteBill,
    updateSobriety, updateBankBalance,
  } = useAppData();

  const [tab, setTab] = useState('Today');
  const [monthViewData, setMonthViewData] = useState(null);

  if (!loaded || !authReady) return <View style={styles.safe} />;
  if (!user) return <AuthScreen />;

  const handleExport = async () => {
    let personalPurchases, businessPurchases;
    if (userRef.current) {
      [personalPurchases, businessPurchases] = await Promise.all([
        fsLoadPurchases(userRef.current.uid, 'personal'),
        fsLoadPurchases(userRef.current.uid, 'business'),
      ]);
    } else {
      [personalPurchases, businessPurchases] = await Promise.all([
        mode === 'personal' ? Promise.resolve(purchases) : loadItem(STORAGE_KEYS.purchases, []),
        mode === 'business' ? Promise.resolve(purchases) : loadItem(BDA_STORAGE_KEYS.purchases, []),
      ]);
    }
    const allEntries = [
      ...personalPurchases.map(p => ({ ...p, _mode: 'Personal' })),
      ...businessPurchases.map(p => ({ ...p, _mode: 'Business' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    const rows = [['Date', 'Mode', 'Category', 'Subcategory', 'Amount', 'Income', 'Note']];
    allEntries.forEach(p => {
      const d = new Date(p.date);
      rows.push([
        d.toLocaleDateString('en-US'),
        p._mode,
        p.category,
        p.subcategory || '',
        p.amount.toFixed(2),
        p.income ? 'Yes' : 'No',
        p.note || '',
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    Share.share({ message: csv, title: 'God is in the Numbers — All Records' });
  };

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {tab === 'Records' && (
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={handleExport} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <IconUpload size={20} color={colors.rose} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            {mode === 'business' ? 'Business Records' : 'Records'}
          </Text>
          <View style={styles.headerShareBtn}>
            <TouchableOpacity onPress={handleSignOut} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <IconLogOut size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {tab === 'Today'         && <TodaysNumbersScreen mode={mode} onSwitchMode={switchMode} modeSwitching={modeSwitching} categories={categories} onAdd={addPurchase} onUpdateCategories={updateCategories} purchases={purchases} onDelete={deletePurchase} onUpdate={updatePurchase} bankBalance={bankBalance} onUpdateBankBalance={updateBankBalance} bills={bills} sobriety={sobriety} onUpdateSobriety={updateSobriety} />}
        {tab === 'Spending Plan' && <SpendingPlanScreen  mode={mode} categories={categories} plan={plan} onUpdatePlan={updatePlan} onUpdateCategories={updateCategories} bills={bills} onAddBill={addBill} onUpdateBill={updateBill} onDeleteBill={deleteBill} purchases={purchases} />}
        {tab === 'Records'       && <RecordsScreen       mode={mode} purchases={purchases} categories={categories} onMonthView={setMonthViewData} bills={bills} onUpdate={updatePurchase} onDelete={deletePurchase} onAdd={addPurchase} onUpdateCategories={updateCategories} sobriety={sobriety} onUpdateSobriety={updateSobriety} />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={styles.tabItem}
            onPress={() => { setTab(t.key); if (t.key !== 'Records') setMonthViewData(null); }}
          >
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
            {tab === t.key && <View style={styles.tabDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}
