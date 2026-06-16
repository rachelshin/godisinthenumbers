// screens/SpendingPlanScreen.js
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform, Linking, ActivityIndicator,
} from 'react-native';
import { colors } from '../styles/shared';
import layout from '../styles/layout';
import styles from '../styles/plan';
import historyStyles from '../styles/history';
import { TIER_META } from '../data/constants';
import { PLAN_CATEGORY_COLORS, BDA_PLAN_CATEGORY_COLORS } from '../styles/numbers';
import ManageCategoriesModal from '../components/ManageCategoriesModal';
import BillsScreen from './BillsScreen';

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const MAIN_TIER = 'Realistic';
const ALT_TIERS = ['Ideal', 'Mini'];

export default function SpendingPlanScreen({ mode, categories, idealCategories, plan, onUpdatePlan, onUpdateCategories, onUpdateIdealCategories, bills, onAddBill, onUpdateBill, onDeleteBill, purchases = [], connections, onViewUser }) {
  const activePlanColors = mode === 'business' ? BDA_PLAN_CATEGORY_COLORS : PLAN_CATEGORY_COLORS;
  const [altTier, setAltTier] = useState(null);
  const [billsVisible, setBillsVisible] = useState(false);
  const [billToEdit, setBillToEdit] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const [manageModal, setManageModal] = useState(false);
  const [idealManageModal, setIdealManageModal] = useState(false);
  const [infoModal, setInfoModal] = useState(false);

  // ── Connections state ────────────────────────────────────────
  const [codeInput, setCodeInput]         = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [joining, setJoining]             = useState(false);
  const [joinError, setJoinError]         = useState('');
  const [copied, setCopied]               = useState(false);
  const [regenerating, setRegenerating]   = useState(false);

  useEffect(() => {
    if (infoModal) connections?.loadConnections();
  }, [infoModal]);

  const handleCopyCode = () => {
    if (!connections?.shareCode) return;
    if (Platform.OS === 'web') {
      try { navigator.clipboard?.writeText(connections.shareCode); } catch {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (codeInput.length < 6) return;
    setJoining(true);
    setJoinError('');
    try {
      await connections.joinByCode(codeInput, nicknameInput);
      setCodeInput('');
      setNicknameInput('');
    } catch (e) {
      setJoinError(
        e.message === 'own'       ? "That's your own code."
        : e.message === 'already' ? "Already connected to this person."
        : e.message === 'not_found' ? "Code not found. Check for typos."
        : "Something went wrong. Try again."
      );
    } finally {
      setJoining(false);
    }
  };

  const handleRegenerate = () => {
    const count = connections?.viewerCount || 0;
    Alert.alert(
      'Generate new code',
      count > 0
        ? `This will disconnect all ${count} ${count === 1 ? 'person' : 'people'} currently viewing your data.`
        : 'Generate a new share code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate new code', style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            try { await connections.regenerateCode(); } catch {}
            setRegenerating(false);
          },
        },
      ]
    );
  };

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const isCurrentViewMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const prevViewMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextViewMonth = () => {
    if (isCurrentViewMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const planKey = (catName, sub) => `${catName} > ${sub}`;
  const catsForTier = (tier) => tier === 'Ideal' ? idealCategories : categories;

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
      const v = parseFloat(plan[tier]?.[planKey(cat.name, sub)] || '0');
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
  };

  const openCatBudget = (tier, catName) => {
    setEditingCell({ tier, catName, sub: null });
    setCellValue(plan[tier]?.[catName] || '');
  };

  const commitCell = () => {
    if (!editingCell) return;
    const { tier, catName, sub } = editingCell;
    const raw = cellValue.replace(/[^0-9.]/g, '');
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
    setEditingCell(null);
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
          const v = parseFloat(plan[tier]?.[planKey(cat.name, sub)] || '0');
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
              <Text style={[styles.catTotal, { color: catOverBudget ? colors.rose : catTotal > 0 || catActual > 0 ? palette.text : palette.text + '55', fontWeight: catOverBudget ? '700' : 'normal' }]}>
                {showActuals && catActual > 0 && catTotal > 0
                  ? `$${fmt(catActual)} / $${fmt(catTotal)}`
                  : catTotal > 0
                  ? `$${fmt(catTotal)}`
                  : showActuals && catActual > 0
                  ? `$${fmt(catActual)}`
                  : '—'}
              </Text>
              <Text style={[styles.catChevron, { color: palette.text }]}>{isExpanded ? '∨' : '›'}</Text>
            </TouchableOpacity>

            {/* Always-visible filled subcategories when collapsed */}
            {!isExpanded && filledSubs.map(sub => {
              const val = plan[tier]?.[planKey(cat.name, sub)] || '';
              const actual = showActuals ? (monthlyActual[planKey(cat.name, sub)] || 0) : 0;
              const budget = parseFloat(val) || 0;
              const matchingBills = isRealistic ? bills.filter(b => b.category === cat.name && b.subcategory === sub) : [];
              const hasBills = matchingBills.length > 0;
              const billsSubTotal = hasBills ? matchingBills.reduce((s, b) => s + b.amount, 0) : 0;
              const displayBudget = hasBills ? billsSubTotal : budget;
              const overBudget = showActuals && !isIncomeCat(cat.name) && actual > 0 && actual > displayBudget;
              return (
                <TouchableOpacity
                  key={sub}
                  style={historyStyles.summaryRow}
                  onPress={() => {
                    if (hasBills) { setBillToEdit(null); setBillsVisible(true); }
                    else openCell(tier, cat.name, sub);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={historyStyles.summarySubcat}>{sub}</Text>
                  {hasBills && <Text style={{ fontSize: 12, color: palette.text, marginRight: 4 }}>↻</Text>}
                  <Text style={[historyStyles.summaryRowAmount, { color: overBudget ? colors.rose : palette.text, fontWeight: overBudget ? '700' : 'normal' }]}>
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
              );
            })}

            {/* Category-level budget cap row */}
            {isExpanded && !isIncomeCat(cat.name) && (
              <TouchableOpacity
                style={styles.subRow}
                onPress={() => openCatBudget(tier, cat.name)}
                activeOpacity={0.7}
              >
                <Text style={[styles.subName, { fontStyle: 'italic', color: colors.textMid }]}>Budget cap</Text>
                <Text style={[styles.subAmount, { color: catBudget ? palette.text : colors.textLight }]}>
                  {catBudget ? `$${fmt(catBudget)}` : 'tap to set'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Expanded: all subcategories for editing */}
            {isExpanded && cat.subcategories.map(sub => {
              const val = plan[tier]?.[planKey(cat.name, sub)] || '';
              const actual = showActuals ? (monthlyActual[planKey(cat.name, sub)] || 0) : 0;
              const budget = parseFloat(val) || 0;
              const overBudget = showActuals && !isIncomeCat(cat.name) && actual > 0 && budget > 0 && actual > budget;
              const hasBill = isRealistic && bills.some(b => b.category === cat.name && b.subcategory === sub);
              const actualColor = overBudget ? colors.rose : palette.text;
              return (
                <TouchableOpacity
                  key={sub}
                  style={styles.subRow}
                  onPress={() => openCell(tier, cat.name, sub)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.subName}>{sub}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {hasBill && <Text style={{ fontSize: 12, color: val ? palette.text : colors.bill }}>↻</Text>}
                    {showActuals && actual > 0 && (
                      <Text style={[styles.subAmount, { color: actualColor, fontWeight: overBudget ? '700' : 'normal' }]}>${fmt(actual)}</Text>
                    )}
                    {showActuals && actual > 0 && val ? (
                      <Text style={{ fontSize: 11, color: colors.textLight }}>/</Text>
                    ) : null}
                    <Text style={[styles.subAmount, { color: val ? (showActuals && actual > 0 ? colors.textLight : palette.text) : colors.textLight }]}>
                      {val ? `$${fmt(parseFloat(val))}` : showActuals && actual > 0 ? '' : 'tap to enter'}
                    </Text>
                  </View>
                </TouchableOpacity>
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
              <Text style={styles.modalSub}>{editingCell.sub ?? 'Budget cap'}</Text>
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
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[layout.modalBtn, { backgroundColor: colors.surfaceMuted, flex: 1 }]} onPress={() => setEditingCell(null)}>
                  <Text style={{ color: colors.textMid, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[layout.modalBtn, { backgroundColor: tintColor, flex: 2 }]} onPress={commitCell}>
                  <Text style={{ color: colors.surface, fontWeight: '600' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

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
      <TouchableOpacity onPress={nextViewMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} disabled={isCurrentViewMonth}>
        <Text style={{ fontSize: 20, color: isCurrentViewMonth ? colors.borderMuted : colors.textLight }}>›</Text>
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
        <View style={styles.planHeaderLinks}>
          <TouchableOpacity onPress={() => setInfoModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.infoIcon}>ⓘ</Text>
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

      <ManageCategoriesModal
        visible={manageModal}
        categories={categories}
        onSave={(cats) => { onUpdateCategories(cats); setManageModal(false); }}
        onClose={() => setManageModal(false)}
      />

      <Modal visible={infoModal} transparent animationType="fade" onRequestClose={() => setInfoModal(false)}>
        <TouchableOpacity style={styles.infoOverlay} activeOpacity={1} onPress={() => setInfoModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.infoSheet} onPress={() => {}}>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 24, paddingBottom: 8 }}
            >
              {/* ── Donation ─────────────────────────────────── */}
              <Text style={styles.infoTitle}>Support this app</Text>
              <Text style={styles.infoBody}>
                God is in the Numbers will always be free and ad-free. If it's helped you, consider supporting the work to get it into the App Store:
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://ko-fi.com/nextrightthing')}>
                <Text style={styles.infoLink}>ko-fi.com/nextrightthing →</Text>
              </TouchableOpacity>

              {/* ── Connections divider ──────────────────────── */}
              <View style={{ height: 0.5, backgroundColor: colors.border, marginVertical: 20 }} />

              <Text style={[styles.infoTitle, { marginBottom: 4 }]}>Sponsors & PRG</Text>
              <Text style={[styles.infoBody, { marginBottom: 16 }]}>
                Share your numbers with your sponsor or Pressure Relief Group — or view theirs.
              </Text>

              {/* Share code */}
              {connections?.loading && !connections?.shareCode ? (
                <ActivityIndicator color={colors.rose} style={{ marginVertical: 16 }} />
              ) : connections?.shareCode ? (
                <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 10, color: colors.textLight, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
                    Your share code
                  </Text>
                  <Text selectable style={{ fontSize: 30, fontWeight: '700', color: colors.textDark, letterSpacing: 8, marginBottom: 14 }}>
                    {connections.shareCode}
                  </Text>
                  <TouchableOpacity
                    style={{ backgroundColor: colors.rose, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 }}
                    onPress={handleCopyCode}
                  >
                    <Text style={{ color: colors.surface, fontWeight: '600', fontSize: 14 }}>
                      {copied ? 'Copied!' : 'Copy code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {connections?.viewerCount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, color: colors.textMid }}>
                    {connections.viewerCount} {connections.viewerCount === 1 ? 'person' : 'people'} can see your data
                  </Text>
                  <TouchableOpacity onPress={handleRegenerate} disabled={regenerating}>
                    <Text style={{ fontSize: 13, color: colors.roseMuted }}>
                      {regenerating ? 'Generating…' : 'Revoke all'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Enter a code */}
              <Text style={{ fontSize: 10, color: colors.textLight, letterSpacing: 3, textTransform: 'uppercase', marginTop: 8, marginBottom: 8 }}>
                Enter someone's code
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.surface, borderRadius: 10,
                  paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 20, fontWeight: '700', color: colors.textDark,
                  letterSpacing: 6, textAlign: 'center', marginBottom: 8, outlineWidth: 0,
                }}
                value={codeInput}
                onChangeText={t => {
                  setJoinError('');
                  setCodeInput(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                }}
                placeholder="ABC123"
                placeholderTextColor={colors.textLight}
                autoCapitalize="characters"
                maxLength={6}
              />
              <TextInput
                style={{
                  backgroundColor: colors.surface, borderRadius: 10,
                  paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 16, color: colors.textDark,
                  marginBottom: 8, outlineWidth: 0,
                }}
                value={nicknameInput}
                onChangeText={setNicknameInput}
                placeholder="Label (e.g. My Sponsor)"
                placeholderTextColor={colors.textLight}
              />
              {joinError ? (
                <Text style={{ fontSize: 13, color: '#c0392b', marginBottom: 8 }}>{joinError}</Text>
              ) : null}
              <TouchableOpacity
                style={{
                  backgroundColor: colors.rose, borderRadius: 10,
                  paddingVertical: 12, alignItems: 'center', marginBottom: 16,
                  opacity: joining || codeInput.length < 6 ? 0.45 : 1,
                }}
                onPress={handleJoin}
                disabled={joining || codeInput.length < 6}
              >
                <Text style={{ color: colors.surface, fontWeight: '600', fontSize: 15 }}>
                  {joining ? 'Connecting…' : 'Connect'}
                </Text>
              </TouchableOpacity>

              {/* Viewing list */}
              {connections?.viewing?.length > 0 && (
                <>
                  <Text style={{ fontSize: 10, color: colors.textLight, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
                    People I'm viewing
                  </Text>
                  {connections.viewing.map(conn => (
                    <View
                      key={conn.uid}
                      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 8 }}
                    >
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.textDark }}>{conn.nickname}</Text>
                      <TouchableOpacity
                        style={{ backgroundColor: colors.roseLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 }}
                        onPress={() => { setInfoModal(false); onViewUser?.(conn); }}
                      >
                        <Text style={{ fontSize: 13, color: colors.rose, fontWeight: '600' }}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => Alert.alert('Remove connection', `Stop viewing ${conn.nickname}'s data?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => connections.stopViewing(conn.uid) },
                        ])}
                      >
                        <Text style={{ fontSize: 16, color: colors.textLight }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.infoDismiss, { padding: 24, paddingTop: 12 }]}
              onPress={() => setInfoModal(false)}
            >
              <Text style={styles.infoDismissText}>Close</Text>
            </TouchableOpacity>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
