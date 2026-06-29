// screens/TodaysNumbersScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors } from '../styles/shared';
import layout from '../styles/layout';
import styles, { CATEGORY_COLORS, INCOME_COLOR, BDA_CATEGORY_COLORS, BDA_INCOME_COLOR } from '../styles/numbers';
import historyStyles from '../styles/history';
import EditEntrySheet from '../components/EditEntrySheet';
import AddEntrySheet from '../components/AddEntrySheet';
import ManageCategoriesModal from '../components/ManageCategoriesModal';

const isIncome = (cat) => cat?.name === 'Income' || cat?.name === 'Revenue';

function formatAmount(item) {
  const neg = !item.income && item.amount < 0;
  const prefix = item.income ? '+' : neg ? '-' : '';
  return `${prefix}$${Math.abs(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const toDateStr = (d) => {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

function computeStreak(history) {
  const h = history || {};
  const todayStr = toDateStr(new Date());
  let streak = 0;
  let d = new Date();
  if (!h[todayStr]) d.setDate(d.getDate() - 1);
  while (true) {
    const s = toDateStr(d);
    if (h[s] === 'yes') { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}


export default function TodaysNumbersScreen({ mode, onSwitchMode, modeSwitching = false, categories, categoryVersions = {}, onUpdateCategoryVersions, onAdd, onUpdateCategories, purchases, onDelete, onUpdate, bankBalance, onUpdateBankBalance, bills = [], sobriety = { history: {} }, onUpdateSobriety }) {
  const isBusiness = mode === 'business';
  const activeCategoryColors = isBusiness ? BDA_CATEGORY_COLORS : CATEGORY_COLORS;
  const activeIncomeColor = isBusiness ? BDA_INCOME_COLOR : INCOME_COLOR;
  const dateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const [addVisible, setAddVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [saved, setSaved] = useState(false);

  const [editing, setEditing] = useState(null);
  const [manageVisible, setManageVisible] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);

  const todayMonthKey = new Date().toLocaleDateString('en-CA').slice(0, 7);
  const effectiveCategories = (() => {
    const keys = Object.keys(categoryVersions).filter(m => m <= todayMonthKey).sort();
    for (let i = keys.length - 1; i >= 0; i--) {
      if (categoryVersions[keys[i]]) return categoryVersions[keys[i]];
    }
    return categories;
  })();
  const [balanceInput, setBalanceInput] = useState('');
  const [paycheckDateInput, setPaycheckDateInput] = useState('');

  const balanceIsToday = bankBalance.updatedAt &&
    new Date(bankBalance.updatedAt).toDateString() === new Date().toDateString();

  const computeAvailable = (amount, paycheckDate) => {
    if (amount == null || !paycheckDate) return amount;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const paycheck = new Date(paycheckDate + 'T00:00:00');
    if (paycheck <= today) return amount;
    let billsTotal = 0;
    bills.forEach(bill => {
      if (!bill.amount || bill.amount <= 0) return;
      let d = new Date(today.getFullYear(), today.getMonth(), bill.dayOfMonth);
      if (d <= today) d = new Date(today.getFullYear(), today.getMonth() + 1, bill.dayOfMonth);
      while (d <= paycheck) {
        const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!bill.skippedMonths?.includes(mk)) billsTotal += bill.amount;
        d = new Date(d.getFullYear(), d.getMonth() + 1, bill.dayOfMonth);
      }
    });
    return amount - billsTotal;
  };

  const todayPurchases = purchases.filter(
    p => new Date(p.date).toDateString() === new Date().toDateString()
  );
  const todayTotal = todayPurchases.filter(p => !p.income).reduce((s, p) => s + p.amount, 0);
  const todayNonSavingsTotal = todayPurchases.filter(p => !p.income && p.category !== 'Savings').reduce((s, p) => s + p.amount, 0);

  const availableAmount = (() => {
    const base = computeAvailable(bankBalance.amount, bankBalance.paycheckDate);
    return base != null ? base - todayNonSavingsTotal : base;
  })();

  const todayStr = toDateStr(new Date());
  const todayAnswer = (sobriety.history || {})[todayStr] || null;
  const displayStreak = computeStreak(sobriety.history);

  const handleSobriety = (answer) => {
    const newHistory = { ...(sobriety.history || {}), [todayStr]: answer };
    onUpdateSobriety({ history: newHistory });
  };

  const openCategory = (cat, index) => {
    setSelectedCategory(cat);
    setSelectedCategoryIndex(index);
    setAddVisible(true);
  };

  const handleAdd = (entry) => {
    onAdd(entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={layout.screen}>
      <ScrollView style={layout.scroll} contentContainerStyle={layout.scrollContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <Text style={[layout.date, { flex: 1, marginBottom: 0, textAlign: 'left' }]}>{dateString}</Text>
          <TouchableOpacity
            onPress={() => !modeSwitching && onSwitchMode(isBusiness ? 'personal' : 'business')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ flexDirection: 'row', alignItems: 'center', opacity: modeSwitching ? 0.4 : 1 }}
          >
            <Text style={{ fontSize: 11, color: isBusiness ? colors.textLight : colors.textDark, fontStyle: 'italic', letterSpacing: 0.3 }}>Personal</Text>
            <Text style={{ fontSize: 11, color: colors.textLight, fontStyle: 'italic' }}>  ·  </Text>
            <Text style={{ fontSize: 11, color: isBusiness ? colors.textDark : colors.textLight, fontStyle: 'italic', letterSpacing: 0.3 }}>BDA</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.eyebrowTagline}>
          {isBusiness ? 'BDA Numbers' : 'God is in the Numbers'}
        </Text>

        <View style={styles.statCard}>
          <TouchableOpacity style={styles.statCell} onPress={() => { setBalanceInput(bankBalance.amount != null ? bankBalance.amount.toString() : ''); setPaycheckDateInput(bankBalance.paycheckDate || ''); setBalanceModalVisible(true); }} activeOpacity={0.7}>
            <Text style={styles.balanceLabel}>available</Text>
            {availableAmount != null ? (
              <>
                <Text style={styles.balanceAmount} numberOfLines={1}>
                  ${availableAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                {!balanceIsToday && <Text style={styles.balanceStaleBadge}>tap to update</Text>}
              </>
            ) : (
              <Text style={styles.balancePlaceholder}>tap to enter</Text>
            )}
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <View style={styles.statCell}>
            <Text style={styles.balanceLabel}>spent today</Text>
            <Text style={styles.balanceAmount} numberOfLines={1}>
              ${todayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {!isBusiness && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.balanceLabel}>days sober</Text>
                <Text style={styles.balanceAmount} numberOfLines={1}>{displayStreak}</Text>
              </View>
            </>
          )}
        </View>

        {!isBusiness && (
          <View style={styles.sobrietyRow}>
            <Text style={{ fontSize: 12, color: colors.textLight, fontStyle: 'italic', letterSpacing: 0.3 }}>Sober today?</Text>
            <TouchableOpacity
              onPress={() => handleSobriety('yes')}
              style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: todayAnswer === 'yes' ? colors.rose : colors.surfaceMuted }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: todayAnswer === 'yes' ? colors.surface : colors.textMid }}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSobriety('no')}
              style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.surfaceMuted }}
            >
              <Text style={{ fontSize: 13, fontWeight: todayAnswer === 'no' ? '500' : '400', color: todayAnswer === 'no' ? colors.textMid : colors.textLight }}>No</Text>
            </TouchableOpacity>
          </View>
        )}

        {categories.map((cat, index) => {
          const palette = activeCategoryColors[index % activeCategoryColors.length];
          const catEntries = todayPurchases.filter(p => p.category === cat.name);
          return (
            <View key={cat.id}>
              <TouchableOpacity
                style={[styles.categoryRow, { backgroundColor: palette.bg }]}
                onPress={() => openCategory(cat, index)}
                activeOpacity={0.75}
              >
                <Text style={[styles.categoryName, { color: palette.text }]}>{cat.name}</Text>
                <Text style={[styles.categoryChevron, { color: palette.text }]}>›</Text>
              </TouchableOpacity>
              {catEntries.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={historyStyles.summaryRow}
                  onPress={() => setEditing(item)}
                  activeOpacity={0.75}
                >
                  <Text style={historyStyles.summarySubcat}>{item.subcategory || item.category}</Text>
                  {item.note ? <Text style={historyStyles.summaryNote}>{item.note}</Text> : null}
                  <Text style={[historyStyles.summaryRowAmount, item.income && { color: activeIncomeColor.text }]}>
                    {formatAmount(item)}
                  </Text>
                  <Text style={historyStyles.editHint}>Edit</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        {saved && (
          <Text style={styles.kindNote}>One number at a time. You're doing it.</Text>
        )}

        <TouchableOpacity
          style={[layout.ghostButton, { marginTop: 16 }]}
          onPress={() => setManageVisible(true)}
        >
          <Text style={layout.ghostButtonText}>Edit categories</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddEntrySheet
        visible={addVisible}
        date={new Date().toISOString()}
        categories={categories}
        activeCategoryColors={activeCategoryColors}
        activeIncomeColor={activeIncomeColor}
        initialCategory={selectedCategory}
        initialCategoryIndex={selectedCategoryIndex}
        onAdd={handleAdd}
        onUpdateCategories={onUpdateCategories}
        onClose={() => { setAddVisible(false); setSelectedCategory(null); }}
      />

      <EditEntrySheet
        item={editing}
        categories={categories}
        activeCategoryColors={activeCategoryColors}
        activeIncomeColor={activeIncomeColor}
        onSave={onUpdate}
        onDelete={onDelete}
        onClose={() => setEditing(null)}
      />

      <Modal visible={balanceModalVisible} transparent animationType="fade" onRequestClose={() => setBalanceModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={layout.modalOverlay}>
          <View style={layout.modalBox}>
            <Text style={[layout.modalTitle, { marginBottom: 4 }]}>Bank balance</Text>
            <Text style={[styles.balanceStaleBadge, { textAlign: 'center', marginBottom: 16 }]}>
              enter your current balance
            </Text>
            <TextInput
              style={styles.amountInput}
              value={balanceInput}
              onChangeText={setBalanceInput}
              keyboardType="decimal-pad"
              placeholder=""
              placeholderTextColor={colors.textLight}
              autoFocus
              textAlign="center"
            />
            <Text style={[styles.balanceStaleBadge, { textAlign: 'center', marginBottom: 8, marginTop: 16 }]}>
              next paycheck
            </Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={paycheckDateInput}
                min={new Date().toLocaleDateString('en-CA')}
                onChange={e => setPaycheckDateInput(e.target.value)}
                style={{ fontSize: 16, border: 'none', borderBottom: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: paycheckDateInput ? colors.textDark : colors.textLight, textAlign: 'center', width: '100%', paddingBottom: 8, marginBottom: 16, outline: 'none' }}
              />
            ) : (
              <TextInput
                style={[styles.amountInput, { fontSize: 14 }]}
                value={paycheckDateInput}
                onChangeText={setPaycheckDateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textLight}
                textAlign="center"
              />
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[layout.modalBtn, { backgroundColor: colors.surfaceMuted, flex: 1 }]} onPress={() => setBalanceModalVisible(false)}>
                <Text style={{ color: colors.textMid, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[layout.modalBtn, { backgroundColor: colors.rose, flex: 2 }]}
                onPress={() => {
                  const amt = parseFloat(balanceInput.replace(/[^0-9.]/g, ''));
                  if (!isNaN(amt) && amt >= 0) { onUpdateBankBalance(amt, paycheckDateInput || null); }
                  setBalanceModalVisible(false);
                }}
              >
                <Text style={{ color: colors.surface, fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ManageCategoriesModal
        visible={manageVisible}
        categories={effectiveCategories}
        onSave={(cats) => {
          onUpdateCategoryVersions({ ...categoryVersions, [todayMonthKey]: cats });
          setManageVisible(false);
        }}
        onClose={() => setManageVisible(false)}
      />
    </View>
  );
}
