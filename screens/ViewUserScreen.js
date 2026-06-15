// screens/ViewUserScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, type } from '../styles/shared';
import layout from '../styles/layout';
import historyStyles from '../styles/history';
import { CATEGORY_COLORS, INCOME_COLOR } from '../styles/numbers';

// ── Helpers ──────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

const toDateStr = (d) => {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const calDateStr = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

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

function fmt(amount) {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  if (v >= 100)  return `${Math.round(v)}`;
  return `${v.toFixed(0)}`;
}

function getDaysInMonth(y, m)  { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfWeek(y, m) { return new Date(y, m, 1).getDay(); }

function getCatColor(categories, catName) {
  const idx = categories.findIndex(c => c.name === catName);
  return CATEGORY_COLORS[(idx >= 0 ? idx : 0) % CATEGORY_COLORS.length];
}

function groupBySubcategory(purchases) {
  const map = {};
  purchases.forEach(p => {
    const key = p.category + '\x00' + (p.subcategory || p.category);
    if (!map[key]) map[key] = { category: p.category, subcategory: p.subcategory || p.category, total: 0, income: p.income, items: [] };
    map[key].total += p.amount;
    map[key].items.push(p);
  });
  return Object.values(map);
}

// ── Main screen ──────────────────────────────────────────────

export default function ViewUserScreen({ connection, onClose, loadUserData, onRemoveConnection }) {
  const insets = useSafeAreaInsets();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState('Today');

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear]       = useState(now.getFullYear());
  const [calMonth, setCalMonth]     = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await loadUserData(connection.uid);
        setData(d);
      } catch {
        setError('Could not load their data — they may have revoked access or disabled sharing.');
      } finally {
        setLoading(false);
      }
    })();
  }, [connection.uid]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
    setSelectedDay(null);
  };

  // ── Derived calendar data ────────────────────────────────

  const calData = useMemo(() => {
    if (!data) return null;
    const { purchases, bills = [], categories = [] } = data;
    const daysInMonth  = getDaysInMonth(calYear, calMonth);
    const firstDay     = getFirstDayOfWeek(calYear, calMonth);

    // Daily aggregates
    const dailyTotals = {}, dailyIncome = {}, catDailyTotals = {};
    purchases.forEach(p => {
      const d = new Date(p.date);
      if (d.getFullYear() !== calYear || d.getMonth() !== calMonth) return;
      const day = d.getDate();
      if (p.income) {
        dailyIncome[day] = (dailyIncome[day] || 0) + p.amount;
      } else {
        dailyTotals[day] = (dailyTotals[day] || 0) + p.amount;
        if (!catDailyTotals[day]) catDailyTotals[day] = {};
        catDailyTotals[day][p.category] = (catDailyTotals[day][p.category] || 0) + p.amount;
      }
    });

    const dailyDominantCat = {};
    Object.entries(catDailyTotals).forEach(([day, cats]) => {
      dailyDominantCat[+day] = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0];
    });

    // Bills
    const billsByDay = {};
    bills.forEach(bill => {
      if (bill.dayOfMonth <= daysInMonth) {
        if (!billsByDay[bill.dayOfMonth]) billsByDay[bill.dayOfMonth] = [];
        billsByDay[bill.dayOfMonth].push(bill);
      }
    });
    const enteredBillIds = new Set(
      purchases
        .filter(p => p.billId && new Date(p.date).getMonth() === calMonth && new Date(p.date).getFullYear() === calYear)
        .map(p => p.billId)
    );
    const dailyPendingBillTotal = {};
    Object.entries(billsByDay).forEach(([d, bs]) => {
      const total = bs.filter(b => !enteredBillIds.has(b.id)).reduce((s, b) => s + b.amount, 0);
      if (total > 0) dailyPendingBillTotal[+d] = total;
    });

    // Grid cells
    const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) cells.push(null);

    // Month totals
    const monthPurchases = purchases.filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === calYear && d.getMonth() === calMonth;
    });
    const monthSpending = monthPurchases.filter(p => !p.income).reduce((s, p) => s + p.amount, 0);
    const monthIncome   = monthPurchases.filter(p => p.income).reduce((s, p) => s + p.amount, 0);

    return {
      cells, daysInMonth, dailyTotals, dailyIncome, dailyDominantCat,
      dailyPendingBillTotal, billsByDay, enteredBillIds,
      monthSpending, monthIncome, categories,
    };
  }, [data, calYear, calMonth]);

  const dayPurchases = useMemo(() => {
    if (!data || !selectedDay) return [];
    return data.purchases.filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === selectedDay;
    });
  }, [data, selectedDay, calYear, calMonth]);

  const dayBills = useMemo(() => {
    if (!calData || !selectedDay) return [];
    return (calData.billsByDay[selectedDay] || []).filter(b => !calData.enteredBillIds.has(b.id));
  }, [calData, selectedDay]);

  const groupedDay = useMemo(() => groupBySubcategory(dayPurchases), [dayPurchases]);

  // ── Loading / error states ───────────────────────────────

  if (loading) {
    return (
      <View style={[layout.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.rose} />
        <Text style={{ fontSize: type.sm, color: colors.textLight, marginTop: 12 }}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[layout.centered, { paddingTop: insets.top, paddingHorizontal: 32 }]}>
        <Text style={{ fontSize: type.base, color: colors.textMid, textAlign: 'center', lineHeight: 24, marginBottom: 28 }}>
          {error}
        </Text>
        <TouchableOpacity style={layout.secondaryButton} onPress={onClose}>
          <Text style={layout.secondaryButtonText}>Go back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={layout.ghostButton} onPress={onRemoveConnection}>
          <Text style={layout.ghostButtonText}>Remove this connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { purchases, plan, sobriety, bankBalance, categories } = data;
  const today      = new Date();
  const todayStr   = toDateStr(today);
  const streak     = computeStreak(sobriety?.history);
  const todayAnswer = (sobriety?.history || {})[todayStr] || null;

  const todayPurchases = purchases.filter(
    p => new Date(p.date).toDateString() === today.toDateString()
  );
  const todaySpending = todayPurchases.filter(p => !p.income).reduce((s, p) => s + p.amount, 0);
  const todayIncome   = todayPurchases.filter(p => p.income).reduce((s, p) => s + p.amount, 0);

  const monthStart    = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthSpendingMap = {};
  purchases
    .filter(p => !p.income && new Date(p.date) >= monthStart && new Date(p.date) <= today)
    .forEach(p => {
      const key = p.subcategory ? `${p.category} > ${p.subcategory}` : p.category;
      monthSpendingMap[key] = (monthSpendingMap[key] || 0) + p.amount;
    });

  const realisticPlan = plan?.Realistic || {};
  const planKeys = Object.keys(realisticPlan).filter(k => parseFloat(realisticPlan[k]) > 0);

  const isCurrentCalMonth = calYear === now.getFullYear() && calMonth === now.getMonth();

  // Selected day sobriety
  const selectedDateStr = selectedDay ? calDateStr(calYear, calMonth, selectedDay) : null;
  const selectedDayAnswer = selectedDateStr ? ((sobriety?.history || {})[selectedDateStr] || null) : null;

  // ── Render ───────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: colors.bg,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderColor: colors.border,
      }}>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ width: 44 }}
        >
          <Text style={{ fontSize: 22, color: colors.rose, lineHeight: 28 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: type.md, fontWeight: '600', color: colors.textDark }}>
            {connection.nickname}
          </Text>
          <Text style={{ fontSize: type.xs, color: colors.textLight, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>
            Read only
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Tab bar */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 0.5, borderColor: colors.border }}>
        {['Today', 'Plan', 'Records'].map(t => (
          <TouchableOpacity
            key={t}
            style={{
              flex: 1,
              paddingVertical: 13,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: activeTab === t ? colors.rose : 'transparent',
            }}
            onPress={() => setActiveTab(t)}
          >
            <Text style={{
              fontSize: type.xs,
              fontWeight: activeTab === t ? '700' : '500',
              color: activeTab === t ? colors.rose : colors.textLight,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── RECORDS TAB — own layout with sticky month header ── */}
      {activeTab === 'Records' && calData && (
        <View style={{ flex: 1 }}>
          {/* Month header */}
          <View style={historyStyles.monthHeader}>
            <View style={historyStyles.monthNav}>
              <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={historyStyles.monthNavArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={historyStyles.monthNavLabel}>{MONTH_NAMES[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={historyStyles.monthNavArrow}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={historyStyles.monthTotalsRow}>
              <View style={historyStyles.monthTotalCell}>
                <Text style={[historyStyles.monthTotalNum, { color: INCOME_COLOR.text }]}>
                  ${fmt(calData.monthIncome)}
                </Text>
                <Text style={historyStyles.monthTotalLabel}>In</Text>
              </View>
              <Text style={historyStyles.monthTotalOp}>−</Text>
              <View style={historyStyles.monthTotalCell}>
                <Text style={historyStyles.monthTotalNum}>${fmt(calData.monthSpending)}</Text>
                <Text style={historyStyles.monthTotalLabel}>Out</Text>
              </View>
              <Text style={historyStyles.monthTotalOp}>=</Text>
              <View style={historyStyles.monthTotalCell}>
                <Text style={historyStyles.monthTotalNum}>
                  {calData.monthIncome - calData.monthSpending >= 0 ? '+' : '−'}
                  ${fmt(Math.abs(calData.monthIncome - calData.monthSpending))}
                </Text>
                <Text style={historyStyles.monthTotalLabel}>Net</Text>
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
            {/* Calendar grid */}
            <View style={historyStyles.calendarWrap}>
              <View style={historyStyles.calendarRow}>
                {DAY_LABELS.map((d, i) => (
                  <Text key={i} style={historyStyles.calendarDayLabel}>{d}</Text>
                ))}
              </View>
              {Array.from({ length: calData.cells.length / 7 }, (_, week) => (
                <View key={week} style={historyStyles.calendarRow}>
                  {calData.cells.slice(week * 7, week * 7 + 7).map((day, i) => {
                    if (!day) return <View key={i} style={historyStyles.calendarCell} />;
                    const total        = calData.dailyTotals[day];
                    const dominantCat  = calData.dailyDominantCat[day];
                    const palette      = dominantCat ? getCatColor(calData.categories, dominantCat) : null;
                    const isToday      = isCurrentCalMonth && day === now.getDate();
                    const isSelected   = day === selectedDay;
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          historyStyles.calendarCell,
                          palette && { backgroundColor: palette.bg },
                          isSelected && historyStyles.calendarCellSelected,
                        ]}
                        onPress={() => setSelectedDay(day === selectedDay ? null : day)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          historyStyles.calendarDayNum,
                          isToday    && historyStyles.calendarDayToday,
                          isSelected && historyStyles.calendarDaySelected,
                        ]}>
                          {day}
                        </Text>
                        {total ? (
                          <Text style={[historyStyles.calendarDayAmount, { color: isSelected ? colors.surface : (palette?.text ?? colors.textMid) }]}>
                            ${fmtShort(total)}
                          </Text>
                        ) : null}
                        {calData.dailyIncome[day] ? (
                          <Text style={[historyStyles.calendarDayAmount, { color: isSelected ? colors.surface : INCOME_COLOR.text }]}>
                            +${fmtShort(calData.dailyIncome[day])}
                          </Text>
                        ) : null}
                        {calData.dailyPendingBillTotal[day] ? (
                          <Text style={[historyStyles.calendarDayAmount, { color: isSelected ? colors.surface : colors.bill }]}>
                            ↻${fmtShort(calData.dailyPendingBillTotal[day])}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Day detail */}
            {selectedDay && (
              <View style={historyStyles.dayDetail}>
                <Text style={historyStyles.dayDetailTitle}>
                  {MONTH_NAMES[calMonth]} {selectedDay}
                </Text>

                {/* Sobriety — read-only */}
                {selectedDayAnswer && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, color: colors.textLight, fontStyle: 'italic' }}>Sober this day:</Text>
                    <View style={{
                      paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
                      backgroundColor: selectedDayAnswer === 'yes' ? colors.rose : colors.surfaceMuted,
                    }}>
                      <Text style={{
                        fontSize: 12, fontWeight: '500',
                        color: selectedDayAnswer === 'yes' ? colors.surface : colors.textMid,
                      }}>
                        {selectedDayAnswer === 'yes' ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Bills due */}
                {dayBills.length > 0 && (
                  <>
                    <Text style={historyStyles.billsDayLabel}>Bills due</Text>
                    {dayBills.map(bill => (
                      <View key={bill.id} style={historyStyles.billsDayRow}>
                        <Text style={historyStyles.billsDayName}>{bill.name}</Text>
                        <Text style={historyStyles.billsDayCat}>{bill.category}</Text>
                        <Text style={historyStyles.billsDayAmount}>
                          ${fmt(bill.amount)}
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                {groupedDay.length === 0 && dayBills.length === 0 && (
                  <Text style={historyStyles.dayDetailEmpty}>No entries recorded.</Text>
                )}

                {/* Spending */}
                {groupedDay.length > 0 && (
                  <>
                    <Text style={historyStyles.billsDayLabel}>Spending</Text>
                    {groupedDay.map(group => {
                      const c = getCatColor(calData.categories, group.category);
                      return (
                        <View
                          key={group.category + '\x00' + group.subcategory}
                          style={historyStyles.dayDetailRow}
                        >
                          <View style={[historyStyles.catPill, { backgroundColor: c.bg }]}>
                            <Text style={[historyStyles.catPillLabel, { color: c.text }]}>
                              {group.subcategory}
                            </Text>
                          </View>
                          {group.items.length === 1 && group.items[0].note && group.items[0].note !== '↻ recurring' ? (
                            <Text style={historyStyles.dayDetailNote}>{group.items[0].note}</Text>
                          ) : null}
                          <Text style={[historyStyles.dayDetailAmount, group.income && { color: INCOME_COLOR.text }]}>
                            {group.income ? '+' : group.total < 0 ? '−' : ''}${fmt(Math.abs(group.total))}
                          </Text>
                        </View>
                      );
                    })}
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* ── TODAY + PLAN TABS — shared scrollview ── */}
      {activeTab !== 'Records' && (
        <ScrollView
          style={layout.scroll}
          contentContainerStyle={{ padding: 20, paddingBottom: 64 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── TODAY TAB ─────────────────────────────────── */}
          {activeTab === 'Today' && (
            <>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={[layout.card, { flex: 1, alignItems: 'center', paddingVertical: 22, marginBottom: 0 }]}>
                  <Text style={{ fontSize: type.xs, color: colors.textLight, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                    Days
                  </Text>
                  <Text style={{ fontSize: 36, fontWeight: '700', color: colors.textDark, lineHeight: 42 }}>
                    {streak}
                  </Text>
                  <Text style={{ fontSize: type.xs, marginTop: 6, color: todayAnswer === 'yes' ? '#5a9e6b' : todayAnswer === 'no' ? '#c0392b' : colors.textLight }}>
                    {todayAnswer === 'yes' ? '✓ today' : todayAnswer === 'no' ? '✗ today' : '— today'}
                  </Text>
                </View>
                <View style={[layout.card, { flex: 1, alignItems: 'center', paddingVertical: 22, marginBottom: 0 }]}>
                  <Text style={{ fontSize: type.xs, color: colors.textLight, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                    In the bank
                  </Text>
                  <Text style={{ fontSize: type.lg, fontWeight: '700', color: colors.textDark }}>
                    {bankBalance?.amount != null ? `$${fmt(Number(bankBalance.amount))}` : '—'}
                  </Text>
                </View>
              </View>

              <View style={[layout.card, { marginBottom: 12 }]}>
                <Text style={{ fontSize: type.xs, color: colors.textLight, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                  Spent today
                </Text>
                <Text style={{ fontSize: 32, fontWeight: '700', color: colors.textDark }}>
                  ${fmt(todaySpending)}
                </Text>
                {todayIncome > 0 && (
                  <Text style={{ fontSize: type.sm, color: '#5a9e6b', marginTop: 4, fontWeight: '500' }}>
                    +${fmt(todayIncome)} income
                  </Text>
                )}
              </View>

              {todayPurchases.filter(p => !p.income).length > 0 ? (
                <View style={layout.card}>
                  <Text style={{ fontSize: type.xs, color: colors.textLight, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
                    Today's entries
                  </Text>
                  {todayPurchases.filter(p => !p.income).map((p, i) => (
                    <View
                      key={p.id}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        paddingVertical: 8,
                        borderTopWidth: i === 0 ? 0 : 0.5,
                        borderColor: colors.border,
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={{ fontSize: type.sm, color: colors.textDark, fontWeight: '500' }}>
                          {p.subcategory || p.category}
                        </Text>
                        {p.note && p.note !== '↻ recurring' && (
                          <Text style={{ fontSize: type.xs, color: colors.textLight, marginTop: 2 }}>{p.note}</Text>
                        )}
                      </View>
                      <Text style={{ fontSize: type.sm, color: colors.textDark, fontWeight: '600' }}>
                        ${fmt(p.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: type.sm, color: colors.textLight, textAlign: 'center', fontStyle: 'italic', marginTop: 12 }}>
                  No entries recorded today.
                </Text>
              )}
            </>
          )}

          {/* ── PLAN TAB ──────────────────────────────────── */}
          {activeTab === 'Plan' && (
            <>
              <Text style={[layout.sectionLabel, { marginTop: 0 }]}>
                {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · Realistic plan
              </Text>

              {planKeys.length === 0 ? (
                <Text style={{ fontSize: type.sm, color: colors.textLight, textAlign: 'center', fontStyle: 'italic', marginTop: 24 }}>
                  No spending plan set.
                </Text>
              ) : (
                planKeys.map(key => {
                  const budget = parseFloat(realisticPlan[key]) || 0;
                  const actual = monthSpendingMap[key] || 0;
                  const over   = actual > budget;
                  const pct    = budget > 0 ? Math.min(actual / budget, 1) : 0;
                  return (
                    <View key={key} style={[layout.card, { marginBottom: 8 }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <Text style={{ fontSize: type.sm, color: colors.textDark, fontWeight: '500', flex: 1, paddingRight: 12 }}>
                          {key}
                        </Text>
                        <Text style={{
                          fontSize: type.sm,
                          fontWeight: over ? '700' : '500',
                          color: over ? '#c0392b' : colors.textMid,
                        }}>
                          ${actual.toFixed(0)} / ${budget.toFixed(0)}
                        </Text>
                      </View>
                      <View style={{ height: 4, backgroundColor: colors.bg, borderRadius: 2 }}>
                        <View style={{
                          height: 4,
                          borderRadius: 2,
                          width: `${pct * 100}%`,
                          backgroundColor: over ? '#c0392b' : colors.rose,
                        }} />
                      </View>
                    </View>
                  );
                })
              )}

              {planKeys.length > 0 && (
                <View style={[layout.card, { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }]}>
                  <Text style={{ fontSize: type.sm, color: colors.textDark, fontWeight: '600' }}>Total spent this month</Text>
                  <Text style={{ fontSize: type.sm, color: colors.textDark, fontWeight: '700' }}>
                    ${fmt(Object.values(monthSpendingMap).reduce((s, v) => s + v, 0))}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
