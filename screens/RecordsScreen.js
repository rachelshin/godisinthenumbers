// screens/MonthScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import { colors } from '../styles/shared';
import layout from '../styles/layout';
import styles from '../styles/history';
import { CATEGORY_COLORS, INCOME_COLOR, BDA_CATEGORY_COLORS, BDA_INCOME_COLOR } from '../styles/numbers';
import EditEntrySheet from '../components/EditEntrySheet';
import AddEntrySheet from '../components/AddEntrySheet';

// ─── Helpers ─────────────────────────────────────────────────

function formatAmount(item) {
  const neg = !item.income && item.amount < 0;
  const prefix = item.income ? '+' : neg ? '-' : '';
  return `${prefix}$${Math.abs(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


function groupBySubcategory(purchases, categories) {
  const subMap = {};
  purchases.forEach(p => {
    const key = p.category + '\x00' + (p.subcategory || p.category);
    if (!subMap[key]) subMap[key] = { category: p.category, subcategory: p.subcategory || p.category, total: 0, income: p.income, items: [] };
    subMap[key].total += p.amount;
    subMap[key].items.push(p);
  });
  return Object.values(subMap);
}

function getCatColor(categories, catName, colorArray) {
  const index = categories.findIndex(c => c.name === catName);
  return colorArray[(index >= 0 ? index : 0) % colorArray.length];
}

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfWeek(year, month) { return new Date(year, month, 1).getDay(); }

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

// ─── Month View ───────────────────────────────────────────────

const toDateStr = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function RecordsView({ purchases, categories, onMonthView, mode, bills = [], onUpdate, onDelete, onAdd, onUpdateCategories, sobriety = { history: {} }, onUpdateSobriety }) {
  const activeCategoryColors = mode === 'business' ? BDA_CATEGORY_COLORS : CATEGORY_COLORS;
  const activeIncomeColor = mode === 'business' ? BDA_INCOME_COLOR : INCOME_COLOR;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [editing, setEditing] = useState(null);
  const [addVisible, setAddVisible] = useState(false);
  const [subDetailGroup, setSubDetailGroup] = useState(null);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const monthPurchases = useMemo(() =>
    purchases.filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }),
  [purchases, year, month]);

  const monthSpending = useMemo(() => monthPurchases.filter(p => !p.income).reduce((s, p) => s + p.amount, 0), [monthPurchases]);
  const monthIncome   = useMemo(() => monthPurchases.filter(p => p.income).reduce((s, p) => s + p.amount, 0), [monthPurchases]);
  const monthNet      = monthIncome - monthSpending;

  React.useEffect(() => {
    onMonthView({ purchases: monthPurchases, year, month, monthName: MONTH_NAMES[month] });
  }, [year, month, purchases, onMonthView]);

  const { dailyTotals, dailyIncome, catDailyTotals } = useMemo(() => {
    const totals = {}, income = {}, catTotals = {};
    purchases.forEach(p => {
      const d = new Date(p.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const day = d.getDate();
      if (p.income) {
        income[day] = (income[day] || 0) + p.amount;
      } else {
        totals[day] = (totals[day] || 0) + p.amount;
        if (!catTotals[day]) catTotals[day] = {};
        catTotals[day][p.category] = (catTotals[day][p.category] || 0) + p.amount;
      }
    });
    return { dailyTotals: totals, dailyIncome: income, catDailyTotals: catTotals };
  }, [purchases, year, month]);

  const dailyDominantCat = useMemo(() => {
    const result = {};
    Object.entries(catDailyTotals).forEach(([day, cats]) => {
      result[+day] = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0];
    });
    return result;
  }, [catDailyTotals]);

  const daysInMonth = getDaysInMonth(year, month);

  const { billsByDay, enteredBillIds, dailyPendingBillTotal } = useMemo(() => {
    const byDay = {};
    bills.forEach(bill => {
      if (bill.dayOfMonth <= daysInMonth) {
        if (!byDay[bill.dayOfMonth]) byDay[bill.dayOfMonth] = [];
        byDay[bill.dayOfMonth].push(bill);
      }
    });
    const entered = new Set(
      purchases
        .filter(p => p.billId && new Date(p.date).getMonth() === month && new Date(p.date).getFullYear() === year)
        .map(p => p.billId)
    );
    const pendingTotals = {};
    Object.entries(byDay).forEach(([d, bs]) => {
      const total = bs.filter(b => !entered.has(b.id)).reduce((s, b) => s + b.amount, 0);
      if (total > 0) pendingTotals[+d] = total;
    });
    return { billsByDay: byDay, enteredBillIds: entered, dailyPendingBillTotal: pendingTotals };
  }, [bills, purchases, month, year, daysInMonth]);

  const dayBills = useMemo(() =>
    selectedDay ? (billsByDay[selectedDay] || []).filter(b => !enteredBillIds.has(b.id)) : [],
  [selectedDay, billsByDay, enteredBillIds]);

  const firstDay = getFirstDayOfWeek(year, month);
  const cells = useMemo(() => {
    const arr = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [firstDay, daysInMonth]);

  const dayPurchases = useMemo(() =>
    selectedDay
      ? purchases.filter(p => {
          const d = new Date(p.date);
          return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
        })
      : [],
  [selectedDay, purchases, year, month]);

  const groupedDayPurchases = useMemo(() => groupBySubcategory(dayPurchases, categories), [dayPurchases, categories]);

  const selectedDateStr = selectedDay ? toDateStr(year, month, selectedDay) : null;
  const dayAnswer = selectedDateStr ? ((sobriety.history || {})[selectedDateStr] || null) : null;
  const handleDaySobriety = (answer) => {
    if (!selectedDateStr) return;
    const newHistory = { ...(sobriety.history || {}), [selectedDateStr]: answer };
    onUpdateSobriety({ history: newHistory });
  };

  return (
    <View style={layout.screen}>
      <View style={styles.monthHeader}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.monthNavArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthNavLabel}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.monthNavArrow}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.monthTotalsRow}>
          <View style={styles.monthTotalCell}>
            <Text style={[styles.monthTotalNum, { color: activeIncomeColor.text }]}>
              ${monthIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.monthTotalLabel}>In</Text>
          </View>
          <Text style={styles.monthTotalOp}>−</Text>
          <View style={styles.monthTotalCell}>
            <Text style={styles.monthTotalNum}>
              ${monthSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.monthTotalLabel}>Out</Text>
          </View>
          <Text style={styles.monthTotalOp}>=</Text>
          <View style={styles.monthTotalCell}>
            <Text style={styles.monthTotalNum}>
              {monthNet >= 0 ? '+' : '−'}${Math.abs(monthNet).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.monthTotalLabel}>Net</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={styles.calendarWrap}>
          <View style={styles.calendarRow}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={styles.calendarDayLabel}>{d}</Text>
            ))}
          </View>
          {Array.from({ length: cells.length / 7 }, (_, week) => (
            <View key={week} style={styles.calendarRow}>
              {cells.slice(week * 7, week * 7 + 7).map((day, i) => {
                if (!day) return <View key={i} style={styles.calendarCell} />;
                const total = dailyTotals[day];
                const dominantCat = dailyDominantCat[day];
                const palette = dominantCat ? getCatColor(categories, dominantCat, activeCategoryColors) : null;
                const isToday = isCurrentMonth && day === now.getDate();
                const isSelected = day === selectedDay;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.calendarCell,
                      palette && { backgroundColor: palette.bg },
                      isSelected && styles.calendarCellSelected,
                    ]}
                    onPress={() => setSelectedDay(day === selectedDay ? null : day)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.calendarDayNum,
                      isToday && styles.calendarDayToday,
                      isSelected && styles.calendarDaySelected,
                    ]}>{day}</Text>
                    {total ? (
                      <Text style={[styles.calendarDayAmount, { color: isSelected ? colors.surface : (palette?.text ?? colors.textMid) }]}>
                        ${total >= 1000 ? `${(total/1000).toFixed(1)}k` : total >= 100 ? Math.round(total) : total.toFixed(0)}
                      </Text>
                    ) : null}
                    {dailyIncome[day] ? (
                      <Text style={[styles.calendarDayAmount, { color: isSelected ? colors.surface : INCOME_COLOR.text }]}>
                        +${dailyIncome[day] >= 1000 ? `${(dailyIncome[day]/1000).toFixed(1)}k` : dailyIncome[day] >= 100 ? Math.round(dailyIncome[day]) : dailyIncome[day].toFixed(0)}
                      </Text>
                    ) : null}
                    {dailyPendingBillTotal[day] ? (
                      <Text style={[styles.calendarDayAmount, { color: isSelected ? colors.surface : colors.bill }]}>
                        ↻${dailyPendingBillTotal[day] >= 1000 ? `${(dailyPendingBillTotal[day]/1000).toFixed(1)}k` : dailyPendingBillTotal[day] >= 100 ? Math.round(dailyPendingBillTotal[day]) : dailyPendingBillTotal[day].toFixed(0)}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {selectedDay && (
          <View style={styles.dayDetail}>
            <Text style={styles.dayDetailTitle}>{MONTH_NAMES[month]} {selectedDay}</Text>

            {mode !== 'business' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: colors.textLight, fontStyle: 'italic' }}>Sober this day?</Text>
                <TouchableOpacity
                  onPress={() => handleDaySobriety('yes')}
                  style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: dayAnswer === 'yes' ? colors.rose : colors.surfaceMuted }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '500', color: dayAnswer === 'yes' ? colors.surface : colors.textMid }}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDaySobriety('no')}
                  style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: colors.surfaceMuted }}
                >
                  <Text style={{ fontSize: 12, fontWeight: dayAnswer === 'no' ? '500' : '400', color: dayAnswer === 'no' ? colors.textMid : colors.textLight }}>No</Text>
                </TouchableOpacity>
              </View>
            )}

            {dayBills.length > 0 && (
              <>
                <Text style={styles.billsDayLabel}>Bills due</Text>
                {dayBills.map(bill => (
                  <View key={bill.id} style={styles.billsDayRow}>
                    <Text style={styles.billsDayName}>{bill.name}</Text>
                    <Text style={styles.billsDayCat}>{bill.category}</Text>
                    <Text style={styles.billsDayAmount}>
                      ${bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {groupedDayPurchases.length === 0 && dayBills.length === 0 && (
              <Text style={styles.dayDetailEmpty}>No entries recorded.</Text>
            )}

            {groupedDayPurchases.length > 0 && (
              <>
                <Text style={styles.billsDayLabel}>Spending</Text>
                {groupedDayPurchases.map(group => {
                  const c = getCatColor(categories, group.category, activeCategoryColors);
                  const single = group.items.length === 1;
                  return (
                    <TouchableOpacity
                      key={group.category + '\x00' + group.subcategory}
                      style={styles.dayDetailRow}
                      onPress={single ? () => setEditing(group.items[0]) : () => setSubDetailGroup(group)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.catPill, { backgroundColor: c.bg }]}>
                        <Text style={[styles.catPillLabel, { color: c.text }]}>{group.subcategory}</Text>
                      </View>
                      {single && group.items[0].note ? <Text style={styles.dayDetailNote}>{group.items[0].note}</Text> : null}
                      <Text style={[styles.dayDetailAmount, group.income && { color: activeIncomeColor.text }]}>
                        {group.income ? '+' : group.total < 0 ? '-' : ''}${Math.abs(group.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <Text style={styles.editHint}>Edit</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
            <TouchableOpacity
              style={[layout.ghostButton, { marginTop: 8 }]}
              onPress={() => setAddVisible(true)}
            >
              <Text style={[layout.ghostButtonText, { color: colors.textMid }]}>+ Add entry</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      <Modal visible={!!subDetailGroup} transparent animationType="slide" onRequestClose={() => setSubDetailGroup(null)}>
        <View style={styles.editBackdrop}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setSubDetailGroup(null)} />
          <View style={styles.editSheet}>
            <Text style={styles.editSheetTitle}>{subDetailGroup?.subcategory}</Text>
            <Text style={styles.editSheetSub}>{subDetailGroup?.category}</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
              {subDetailGroup?.items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.dayDetailRow}
                  onPress={() => { setEditing(item); setSubDetailGroup(null); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dayDetailNote, { flex: 1, color: item.note ? colors.textMid : colors.textLight }]}>
                    {item.note || '—'}
                  </Text>
                  <Text style={[styles.dayDetailAmount, subDetailGroup.income && { color: activeIncomeColor.text }]}>
                    {formatAmount(item)}
                  </Text>
                  <Text style={styles.editHint}>Edit</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <EditEntrySheet
        item={editing}
        categories={categories}
        activeCategoryColors={activeCategoryColors}
        activeIncomeColor={activeIncomeColor}
        onSave={onUpdate}
        onDelete={onDelete}
        onClose={() => setEditing(null)}
      />
      <AddEntrySheet
        visible={addVisible}
        date={selectedDay ? new Date(year, month, selectedDay, 12, 0, 0).toISOString() : null}
        categories={categories}
        activeCategoryColors={activeCategoryColors}
        activeIncomeColor={activeIncomeColor}
        onAdd={onAdd}
        onUpdateCategories={onUpdateCategories}
        onClose={() => setAddVisible(false)}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function RecordsScreen({ mode, purchases, categories, onMonthView, bills, onUpdate, onDelete, onAdd, onUpdateCategories, sobriety, onUpdateSobriety }) {
  return (
    <RecordsView
      mode={mode}
      purchases={purchases}
      categories={categories}
      onMonthView={onMonthView}
      bills={bills}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onAdd={onAdd}
      onUpdateCategories={onUpdateCategories}
      sobriety={sobriety}
      onUpdateSobriety={onUpdateSobriety}
    />
  );
}
