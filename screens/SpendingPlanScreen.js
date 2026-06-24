// screens/SpendingPlanScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { colors } from '../styles/shared';
import layout from '../styles/layout';
import styles from '../styles/plan';
import historyStyles from '../styles/history';
import { TIER_META } from '../data/constants';
import { PLAN_CATEGORY_COLORS, BDA_PLAN_CATEGORY_COLORS } from '../styles/numbers';
import ManageCategoriesModal from '../components/ManageCategoriesModal';
import BillsScreen from './BillsScreen';
import SavingsGoalsScreen from './SavingsGoalsScreen';
import { IconTarget } from '../components/Icon';

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const MAIN_TIER = 'Realistic';
const ALT_TIERS = ['Ideal', 'Mini'];

export default function SpendingPlanScreen({ mode, categories, idealCategories, plan, planOverrides = {}, onUpdatePlan, onUpdatePlanOverride, onUpdateCategories, onUpdateIdealCategories, bills, onAddBill, onUpdateBill, onDeleteBill, purchases = [], savingsGoals = {}, onUpdateSavingsGoals }) {
  const activePlanColors = mode === 'business' ? BDA_PLAN_CATEGORY_COLORS : PLAN_CATEGORY_COLORS;
  const [altTier, setAltTier] = useState(null);
  const [billsVisible, setBillsVisible] = useState(false);
  const [billToEdit, setBillToEdit] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const [thisMonthOnly, setThisMonthOnly] = useState(false);
  const [viewingEntriesFor, setViewingEntriesFor] = useState(null);
  const [manageModal, setManageModal] = useState(false);
  const [idealManageModal, setIdealManageModal] = useState(false);
  const [savingsGoalsVisible, setSavingsGoalsVisible] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const prevViewMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextViewMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const planKey = (catName, sub) => `${catName} > ${sub}`;
  const catsForTier = (tier) => tier === 'Ideal' ? idealCategories : categories;

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const effectiveBudget = (tier, key) => planOverrides?.[monthKey]?.[tier]?.[key] ?? plan[tier]?.[key];
  const hasOverride = (tier, key) => planOverrides?.[monthKey]?.[tier]?.[key] !== undefined;

  const monthlyActual = useMemo(() => {
    const result = {};
    purchases.forEach(p => {
      const d = new Date(p.date);
      if (d.getMonth() !== viewMonth || d.getFullYear() !== viewYear) return;
      if (!p.subcategory) return;
      const k = planKey(p.category, p.subcategory);
      result[k] = (result[k] || 0) + p.amount;
    });
    return result;
  }, [purchases, viewMonth, viewYear]);
  const isIncomeCat = (name) => name === 'Income' || name === 'Revenue';
  const actualCatTotal = (cat) =>
    cat.subcategories.reduce((sum, sub) => sum + (monthlyActual[planKey(cat.name, sub)] || 0), 0);
  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const subTotal = (tier, cat) =>
    cat.subcategories.reduce((sum, sub) => {
      const v = parseFloat(effectiveBudget(tier, planKey(cat.name, sub)) || '0');
      return sum + (isNaN(v) ? 0 : v);
    }, 0);

  const catBudgetFor = (tier, cat) => {
    const v = parseFloat(plan[tier]?.[cat.name] || '0');
    return (!isNaN(v) && v > 0) ? v : null;
  };

  const grandTotal = (tier) =>
    catsForTier(tier)
      .filter(cat => cat.name !== 'Income' && cat.name !== 'Revenue')
      .reduce((sum, cat) => sum + (catBudgetFor(tier, cat) ?? subTotal(tier, cat)), 0);

  const openCell = (tier, catName, sub) => {
    setEditingCell({ tier, catName, sub });
    setCellValue(plan[tier]?.[planKey(catName, sub)] || '');
    setThisMonthOnly(false);
  };

  const openCatBudget = (tier, catName) => {
    setEditingCell({ tier, catName, sub: null });
    setCellValue(plan[tier]?.[catName] || '');
    setThisMonthOnly(false);
  };

  const handleToggleMonthOnly = (val, cell) => {
    setThisMonthOnly(val);
    const { tier, catName, sub } = cell;
    const key = sub === null ? catName : planKey(catName, sub);
    if (val) {
      setCellValue(planOverrides?.[monthKey]?.[tier]?.[key] || '');
    } else {
      setCellValue(plan[tier]?.[key] || '');
    }
  };

  const commitCell = () => {
    if (!editingCell) return;
    const { tier, catName, sub } = editingCell;
    const raw = cellValue.replace(/[^0-9.]/g, '');
    const key = sub === null ? catName : planKey(catName, sub);

    const entered = parseFloat(raw) || 0;
    if (editingCell.sub !== null && editingCell.tier === MAIN_TIER) {
      const activeBillsForCell = bills.filter(b =>
        b.category === editingCell.catName &&
        b.subcategory === editingCell.sub &&
        !b.skippedMonths?.includes(monthKey)
      );
      const billFloor = activeBillsForCell.reduce((s, b) => s + b.amount, 0);
      if (billFloor > 0 && entered > 0 && entered < billFloor) {
        Alert.alert('Budget too low', `This subcategory has $${fmt(billFloor)} in recurring bills this month. Set the budget to at least that amount, or skip the bill first.`);
        return;
      }
    }

    if (thisMonthOnly) {
      const next = {
        ...planOverrides,
        [monthKey]: {
          ...planOverrides?.[monthKey],
          [tier]: { ...planOverrides?.[monthKey]?.[tier], [key]: raw },
        },
      };
      onUpdatePlanOverride(next);
    } else {
      if (sub === null) {
        const entered = parseFloat(raw) || 0;
        const cat = catsForTier(tier).find(c => c.name === catName);
        const subSum = subTotal(tier, cat);
        if (entered > 0 && entered < subSum) {
          Alert.alert('Budget too low', `Category budget must be at least $${fmt(subSum)} to cover your subcategory totals.`);
          return;
        }
        onUpdatePlan({ ...plan, [tier]: { ...plan[tier], [catName]: raw } });
      } else {
        onUpdatePlan({ ...plan, [tier]: { ...plan[tier], [planKey(catName, sub)]: raw } });
      }
    }
    setEditingCell(null);
    setThisMonthOnly(false);
  };

  const activeTier = altTier ?? MAIN_TIER;
  const meta = TIER_META[activeTier];
  const accentColor = altTier ? meta.color : colors.rose;

  const renderPlanList = (tier) => {
    const tierCats = catsForTier(tier);
    const showActuals = tier !== 'Ideal';
    const isRealistic = tier === MAIN_TIER;

    const totalActual = showActuals
      ? tierCats.filter(cat => !isIncomeCat(cat.name)).reduce((sum, cat) => sum + actualCatTotal(cat), 0)
      : 0;
    const totalBudgeted = grandTotal(tier);

    return (
    <>
      {showActuals && (
        <Text style={{ fontSize: 10, color: colors.textLight, textAlign: 'right', paddingRight: 38, marginBottom: 4, fontStyle: 'italic', letterSpacing: 0.3 }}>
          actual / planned
        </Text>
      )}
      {tierCats.map((cat, index) => {
        const palette = activePlanColors[index % activePlanColors.length];
        const isExpanded = expandedCategory === cat.name;

        const filledSubs = cat.subcategories.filter(sub => {
          const v = parseFloat(effectiveBudget(tier, planKey(cat.name, sub)) || '0');
          const a = showActuals ? (monthlyActual[planKey(cat.name, sub)] || 0) : 0;
          return v > 0 || a > 0;
        });
        const catBudget = catBudgetFor(tier, cat);
        const catTotal = catBudget ?? subTotal(tier, cat);
        const catActual = showActuals ? actualCatTotal(cat) : 0;
        const catOverBudget = showActuals && !isIncomeCat(cat.name) && catActual > catTotal && catTotal > 0;

        return (
          <View key={cat.id}>
            <TouchableOpacity
              style={[styles.catRow, { backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.text + '30' }]}
              onPress={() => setExpandedCategory(isExpanded ? null : cat.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.catName, { color: palette.text }]}>{cat.name}</Text>
              <Text style={[styles.catTotal, { color: catOverBudget ? colors.rose : catTotal > 0 || catActual !== 0 ? palette.text : palette.text + '55', fontWeight: catOverBudget ? '700' : 'normal' }]}>
                {showActuals && catActual !== 0 && catTotal > 0
                  ? `$${fmt(catActual)} / $${fmt(catTotal)}`
                  : catTotal > 0
                  ? `$${fmt(catTotal)}`
                  : showActuals && catActual !== 0
                  ? `$${fmt(catActual)}`
                  : '—'}
              </Text>
              <Text style={[styles.catChevron, { color: palette.text }]}>{isExpanded ? '∨' : '›'}</Text>
            </TouchableOpacity>

            {/* Always-visible filled subcategories when collapsed */}
            {!isExpanded && filledSubs.map(sub => {
              const subPlanKey = planKey(cat.name, sub);
              const val = effectiveBudget(tier, subPlanKey) || '';
              const actual = showActuals ? (monthlyActual[subPlanKey] || 0) : 0;
              const budget = parseFloat(val) || 0;
              const matchingBills = isRealistic ? bills.filter(b => b.category === cat.name && b.subcategory === sub) : [];
              const activeBills = matchingBills.filter(b => !b.skippedMonths?.includes(monthKey));
              const hasBills = matchingBills.length > 0;
              const activeBillsTotal = activeBills.reduce((s, b) => s + b.amount, 0);
              const overrideVal = planOverrides?.[monthKey]?.[tier]?.[subPlanKey];
              const basePlan = parseFloat(plan[tier]?.[subPlanKey] || '0') || 0;
              const displayBudget = overrideVal !== undefined ? (parseFloat(overrideVal) || 0) : basePlan > 0 ? basePlan : activeBillsTotal > 0 ? activeBillsTotal : 0;
              const overBudget = showActuals && !isIncomeCat(cat.name) && actual > 0 && actual > displayBudget;
              const isOverridden = hasOverride(tier, subPlanKey);
              return (
                <View key={sub} style={historyStyles.summaryRow}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => setViewingEntriesFor({ catName: cat.name, sub })}
                    activeOpacity={0.6}
                  >
                    <Text style={historyStyles.summarySubcat}>{sub}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => openCell(tier, cat.name, sub)}
                    activeOpacity={0.75}
                  >
                    {hasBills && <Text style={{ fontSize: 12, color: palette.text, marginRight: 4 }}>↻</Text>}
                    <Text style={[historyStyles.summaryRowAmount, { color: overBudget ? colors.rose : isOverridden ? colors.bill : palette.text, fontWeight: overBudget ? '700' : 'normal' }]}>
                      {showActuals && displayBudget > 0
                        ? `$${fmt(actual)} / $${fmt(displayBudget)}`
                        : displayBudget > 0
                        ? `$${fmt(displayBudget)}`
                        : showActuals && actual > 0
                        ? `$${fmt(actual)}`
                        : '—'}
                    </Text>
                    <Text style={historyStyles.editHint}>Edit</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Category-level budget cap row */}
            {isExpanded && !isIncomeCat(cat.name) && (
              <TouchableOpacity
                style={styles.subRow}
                onPress={() => openCatBudget(tier, cat.name)}
                activeOpacity={0.7}
              >
                <Text style={[styles.subName, { fontStyle: 'italic', color: colors.textMid }]}>Category cap</Text>
                <Text style={[styles.subAmount, { color: catBudget ? palette.text : colors.textLight }]}>
                  {catBudget ? `$${fmt(catBudget)}` : 'tap to set'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Expanded: all subcategories for editing */}
            {isExpanded && cat.subcategories.map(sub => {
              const subPlanKey = planKey(cat.name, sub);
              const val = effectiveBudget(tier, subPlanKey) || '';
              const actual = showActuals ? (monthlyActual[subPlanKey] || 0) : 0;
              const budget = parseFloat(val) || 0;
              const overBudget = showActuals && !isIncomeCat(cat.name) && actual > 0 && budget > 0 && actual > budget;
              const hasBill = isRealistic && bills.some(b => b.category === cat.name && b.subcategory === sub);
              const isOverridden = hasOverride(tier, subPlanKey);
              const actualColor = overBudget ? colors.rose : palette.text;
              return (
                <View key={sub} style={styles.subRow}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => setViewingEntriesFor({ catName: cat.name, sub })}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.subName}>{sub}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    onPress={() => openCell(tier, cat.name, sub)}
                    activeOpacity={0.7}
                  >
                    {hasBill && <Text style={{ fontSize: 12, color: val ? palette.text : colors.bill }}>↻</Text>}
                    {showActuals && actual > 0 && (
                      <Text style={[styles.subAmount, { color: actualColor, fontWeight: overBudget ? '700' : 'normal' }]}>${fmt(actual)}</Text>
                    )}
                    {showActuals && actual > 0 && val ? (
                      <Text style={{ fontSize: 11, color: colors.textLight }}>/</Text>
                    ) : null}
                    <Text style={[styles.subAmount, { color: val ? (showActuals && actual > 0 ? colors.textLight : isOverridden ? colors.bill : palette.text) : colors.textLight }]}>
                      {val ? `$${fmt(parseFloat(val))}` : showActuals && actual > 0 ? '' : 'tap to enter'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        );
      })}

      <View style={[styles.totalRow, { borderTopColor: accentColor }]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={[styles.totalAmount, { color: accentColor }]}>
          {showActuals && totalActual > 0 && totalBudgeted > 0
            ? `$${fmt(totalActual)} / $${fmt(totalBudgeted)}`
            : totalBudgeted > 0
            ? `$${fmt(totalBudgeted)}`
            : showActuals && totalActual > 0
            ? `$${fmt(totalActual)}`
            : '—'}
        </Text>
      </View>
    </>
    );
  };

  const renderEditModal = (tintColor) => (
    <Modal visible={!!editingCell} transparent animationType="fade">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={layout.modalOverlay}>
        <View style={layout.modalBox}>
          {editingCell && (
            <>
              <Text style={styles.modalSub}>{editingCell.sub ?? 'Category cap'}</Text>
              <Text style={styles.modalCat}>{editingCell.catName}{altTier ? ` · ${meta.label}` : ''}</Text>
              <TextInput
                style={styles.modalAmountInput}
                value={cellValue}
                onChangeText={setCellValue}
                keyboardType="decimal-pad"
                placeholder=""
                placeholderTextColor={colors.textLight}
                textAlign="center"
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: editingCell.sub && editingCell.tier === MAIN_TIER && bills.some(b => b.category === editingCell.catName && b.subcategory === editingCell.sub) ? 4 : 12 }}>
                <Text style={{ fontSize: 13, color: colors.textMid }}>This month only</Text>
                <Switch
                  value={thisMonthOnly}
                  onValueChange={(val) => handleToggleMonthOnly(val, editingCell)}
                  trackColor={{ false: colors.borderMuted, true: colors.bill }}
                  thumbColor={colors.surface}
                />
              </View>
              {editingCell.sub && editingCell.tier === MAIN_TIER && bills.some(b => b.category === editingCell.catName && b.subcategory === editingCell.sub) && (
                <Text style={{ fontSize: 12, color: colors.textLight, textAlign: 'center', marginBottom: 12 }}>
                  Recurring bill —{' '}
                  <Text
                    style={{ color: colors.bill, textDecorationLine: 'underline' }}
                    onPress={() => { setEditingCell(null); setThisMonthOnly(false); setBillsVisible(true); }}
                  >
                    edit in Bills screen
                  </Text>
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[layout.modalBtn, { backgroundColor: colors.surfaceMuted, flex: 1 }]} onPress={() => { setEditingCell(null); setThisMonthOnly(false); }}>
                  <Text style={{ color: colors.textMid, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[layout.modalBtn, { backgroundColor: thisMonthOnly ? colors.bill : tintColor, flex: 2 }]} onPress={commitCell}>
                  <Text style={{ color: colors.surface, fontWeight: '600' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEntriesModal = () => {
    if (!viewingEntriesFor) return null;
    const { catName, sub } = viewingEntriesFor;
    const entries = purchases
      .filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === viewMonth && d.getFullYear() === viewYear &&
          p.category === catName && p.subcategory === sub && !p.deleted;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const total = entries.reduce((s, p) => s + p.amount, 0);
    return (
      <Modal visible transparent animationType="fade">
        <View style={layout.modalOverlay}>
          <View style={[layout.modalBox, { maxHeight: '70%' }]}>
            <Text style={styles.modalSub}>{sub}</Text>
            <Text style={[styles.modalCat, { marginBottom: 16 }]}>{catName}</Text>
            {entries.length === 0 ? (
              <Text style={{ color: colors.textLight, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>No entries this month</Text>
            ) : (
              <ScrollView style={{ marginBottom: 12 }} showsVerticalScrollIndicator={false}>
                {entries.map(p => (
                  <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderColor: colors.border }}>
                    <Text style={{ fontSize: 13, color: colors.textMid }}>
                      {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {p.note ? `  ·  ${p.note}` : ''}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textDark, fontWeight: '500' }}>${fmt(p.amount)}</Text>
                  </View>
                ))}
                {entries.length > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 }}>
                    <Text style={{ fontSize: 13, color: colors.textLight }}>Total</Text>
                    <Text style={{ fontSize: 13, color: colors.textDark, fontWeight: '600' }}>${fmt(total)}</Text>
                  </View>
                )}
              </ScrollView>
            )}
            <TouchableOpacity style={[layout.modalBtn, { backgroundColor: colors.surfaceMuted }]} onPress={() => setViewingEntriesFor(null)}>
              <Text style={{ color: colors.textMid, fontWeight: '500' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ── Bills sub-screen ─────────────────────────────────────────

  if (billsVisible) {
    return (
      <BillsScreen
        categories={categories}
        bills={bills}
        onAdd={onAddBill}
        onUpdate={onUpdateBill}
        onDelete={onDeleteBill}
        onBack={() => { setBillsVisible(false); setBillToEdit(null); }}
        initialEditBill={billToEdit}
        viewMonth={viewMonth}
        viewYear={viewYear}
      />
    );
  }

  if (savingsGoalsVisible) {
    return (
      <SavingsGoalsScreen
        categories={categories}
        purchases={purchases}
        savingsGoals={savingsGoals}
        onUpdateSavingsGoals={onUpdateSavingsGoals}
        onBack={() => setSavingsGoalsVisible(false)}
      />
    );
  }

  const canGoBack = !altTier;

  const monthNav = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 8 }}>
      <TouchableOpacity onPress={prevViewMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} disabled={!canGoBack}>
        <Text style={{ fontSize: 20, color: canGoBack ? colors.textLight : colors.borderMuted }}>‹</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 13, color: colors.textMid, letterSpacing: 0.5, minWidth: 130, textAlign: 'center' }}>
        {MONTH_NAMES[viewMonth]} {viewYear}
      </Text>
      <TouchableOpacity onPress={nextViewMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={{ fontSize: 20, color: colors.textLight }}>›</Text>
      </TouchableOpacity>
    </View>
  );


  // ── Alternate tier sub-screen ────────────────────────────────

  if (altTier) {
    return (
      <View style={layout.screen}>
        <View style={styles.altHeader}>
          <TouchableOpacity onPress={() => { setAltTier(null); setExpandedCategory(null); }}>
            <Text style={styles.altBackLabel}>‹ Plan</Text>
          </TouchableOpacity>
          <Text style={[styles.altTierLabel, { color: meta.color }]} numberOfLines={1} adjustsFontSizeToFit>{meta.label} Spending Plan</Text>
          <Text style={[styles.altTotal, { color: meta.color }]}>
            ${grandTotal(altTier).toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </Text>
        </View>
        {monthNav}
        <ScrollView style={layout.scroll} contentContainerStyle={layout.scrollContent}>
          {renderPlanList(altTier)}
          {altTier === 'Ideal' && (
            <TouchableOpacity style={[layout.ghostButton, { marginTop: 8 }]} onPress={() => setIdealManageModal(true)}>
              <Text style={layout.ghostButtonText}>Edit categories</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        {renderEditModal(meta.color)}
        {renderEntriesModal()}
        {altTier === 'Ideal' && (
          <ManageCategoriesModal
            visible={idealManageModal}
            categories={idealCategories}
            onSave={(cats) => { onUpdateIdealCategories(cats); setIdealManageModal(false); }}
            onClose={() => setIdealManageModal(false)}
          />
        )}
      </View>
    );
  }

  // ── Main plan view (Realistic) ───────────────────────────────

  return (
    <View style={layout.screen}>
      <View style={styles.planHeader}>
        <View style={[styles.planHeaderLinks, { justifyContent: 'space-between' }]}>
          <TouchableOpacity
            onPress={() => setSavingsGoalsVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconTarget size={18} color={colors.textLight} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {ALT_TIERS.map(t => (
              <TouchableOpacity key={t} onPress={() => {
                setAltTier(t);
                setExpandedCategory(null);
                if (t === 'Ideal' || t === 'Mini') { setViewMonth(now.getMonth()); setViewYear(now.getFullYear()); }
              }}>
                <Text style={styles.altLinkText}>{t} plan ›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Text style={styles.planTitle} numberOfLines={1} adjustsFontSizeToFit>
          {mode === 'business' ? 'Business Spending Plan' : 'Monthly Spending Plan'}
        </Text>
        {monthNav}
      </View>

      <ScrollView style={layout.scroll} contentContainerStyle={[layout.scrollContent, { paddingTop: 12 }]}>
        {renderPlanList(MAIN_TIER)}
        <TouchableOpacity style={[layout.ghostButton, { marginTop: 8 }]} onPress={() => setManageModal(true)}>
          <Text style={layout.ghostButtonText}>Edit categories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[layout.ghostButton, { marginTop: 0 }]} onPress={() => setBillsVisible(true)}>
          <Text style={[layout.ghostButtonText, { color: colors.bill }]}>Recurring bills ›</Text>
        </TouchableOpacity>
      </ScrollView>

      {renderEditModal(colors.rose)}
      {renderEntriesModal()}

      <ManageCategoriesModal
        visible={manageModal}
        categories={categories}
        onSave={(cats) => { onUpdateCategories(cats); setManageModal(false); }}
        onClose={() => setManageModal(false)}
      />
    </View>
  );
}
