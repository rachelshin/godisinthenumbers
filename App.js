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
import { useConnections } from './hooks/useConnections';
import { IconUpload } from './components/Icon';
import TodaysNumbersScreen from './screens/TodaysNumbersScreen';
import SpendingPlanScreen  from './screens/SpendingPlanScreen';
import RecordsScreen       from './screens/RecordsScreen';
import AuthScreen          from './screens/AuthScreen';
import ViewUserScreen      from './screens/ViewUserScreen';
import InfoModal           from './components/InfoModal';

const TABS = [
  { key: 'Today',         label: 'Today' },
  { key: 'Spending Plan', label: 'Spending Plan' },
  { key: 'Records',       label: 'Records' },
];

export default function App() {
  const {
    mode, categories, idealCategories, plan, purchases, visiblePurchases, bankBalance, bills, sobriety, savingsGoals,
    loaded, user, authReady, modeSwitching,
    userRef,
    handleSignOut, switchMode,
    updateCategories, updateIdealCategories, updatePlan,
    addPurchase, deletePurchase, updatePurchase,
    addBill, updateBill, deleteBill,
    updateSobriety, updateBankBalance, updateSavingsGoals,
  } = useAppData();

  const connections = useConnections(user);

  const [tab, setTab] = useState('Today');
  const [monthViewData, setMonthViewData] = useState(null);
  const [viewingConnection, setViewingConnection] = useState(null);
  const [infoVisible, setInfoVisible] = useState(false);

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
      ...personalPurchases.filter(p => !p.deleted).map(p => ({ ...p, _mode: 'Personal' })),
      ...businessPurchases.filter(p => !p.deleted).map(p => ({ ...p, _mode: 'Business' })),
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
      <View style={styles.appColumn}>

      {tab === 'Records' && (
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => setInfoVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ fontSize: 20, color: colors.textLight, lineHeight: 24 }}>ⓘ</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            {mode === 'business' ? 'Business Records' : 'Records'}
          </Text>
          <View style={styles.headerShareBtn}>
            <TouchableOpacity onPress={handleExport} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <IconUpload size={20} color={colors.rose} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {tab === 'Today'         && <TodaysNumbersScreen mode={mode} onSwitchMode={switchMode} modeSwitching={modeSwitching} categories={categories} onAdd={addPurchase} onUpdateCategories={updateCategories} purchases={visiblePurchases} onDelete={deletePurchase} onUpdate={updatePurchase} bankBalance={bankBalance} onUpdateBankBalance={updateBankBalance} bills={bills} sobriety={sobriety} onUpdateSobriety={updateSobriety} />}
        {tab === 'Spending Plan' && <SpendingPlanScreen  mode={mode} categories={categories} idealCategories={idealCategories} plan={plan} onUpdatePlan={updatePlan} onUpdateCategories={updateCategories} onUpdateIdealCategories={updateIdealCategories} bills={bills} onAddBill={addBill} onUpdateBill={updateBill} onDeleteBill={deleteBill} purchases={visiblePurchases} savingsGoals={savingsGoals} onUpdateSavingsGoals={updateSavingsGoals} />}
        {tab === 'Records'       && <RecordsScreen       mode={mode} purchases={visiblePurchases} categories={categories} onMonthView={setMonthViewData} bills={bills} onUpdate={updatePurchase} onDelete={deletePurchase} onAdd={addPurchase} onUpdateCategories={updateCategories} sobriety={sobriety} onUpdateSobriety={updateSobriety} />}
      </View>

      {viewingConnection && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <ViewUserScreen
            connection={viewingConnection}
            onClose={() => setViewingConnection(null)}
            loadUserData={connections.loadUserData}
            onRemoveConnection={async () => {
              await connections.stopViewing(viewingConnection.uid);
              setViewingConnection(null);
            }}
          />
        </View>
      )}

      <InfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        connections={connections}
        onSignOut={handleSignOut}
        onViewUser={(conn) => setViewingConnection(conn)}
      />

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

      </View>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}
