// screens/BillsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, KeyboardAvoidingView,
  Platform, StyleSheet,
} from 'react-native';
import { colors, type } from '../styles/shared';
import layout from '../styles/layout';

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function BillsScreen({ categories, bills, onAdd, onUpdate, onDelete, onBack, initialEditBill, viewMonth, viewYear }) {
  const now = new Date();
  const activeViewMonth = viewMonth ?? now.getMonth();
  const activeViewYear  = viewYear  ?? now.getFullYear();
  const monthKey = `${activeViewYear}-${String(activeViewMonth + 1).padStart(2, '0')}`;
  const monthLabel = MONTH_NAMES[activeViewMonth];
  const [formVisible, setFormVisible]           = useState(false);
  const [editingBill, setEditingBill]           = useState(null);
  const [name, setName]                         = useState('');
  const [category, setCategory]                 = useState('');
  const [subcategory, setSubcategory]           = useState('');
  const [amount, setAmount]                     = useState('');
  const [dayOfMonth, setDayOfMonth]             = useState(1);
  const [pickingCategory, setPickingCategory]   = useState(false);
  const [pickingSubcategory, setPickingSubcategory] = useState(false);
  const [pickingDay, setPickingDay]             = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const availableSubcategories = categories.find(c => c.name === category)?.subcategories || [];

  useEffect(() => {
    if (initialEditBill) openEdit(initialEditBill);
  }, []);

  const openAdd = () => {
    setEditingBill(null);
    setName(''); setCategory(''); setSubcategory(''); setAmount(''); setDayOfMonth(1);
    setFormVisible(true);
  };

  const openEdit = (bill) => {
    setEditingBill(bill);
    setName(bill.name);
    setCategory(bill.category);
    setSubcategory(bill.subcategory || '');
    setAmount(bill.amount.toString());
    setDayOfMonth(bill.dayOfMonth);
    setFormVisible(true);
  };

  const closeForm = () => { setFormVisible(false); setEditingBill(null); setConfirmingDelete(false); };

  const save = () => {
    const trimName = name.trim();
    const amt = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!trimName) return Alert.alert('', 'Please enter a bill name.');
    if (!category) return Alert.alert('', 'Please choose a category.');
    if (!subcategory) return Alert.alert('', 'Please choose a subcategory.');
    if (isNaN(amt) || amt <= 0) return Alert.alert('', 'Please enter an amount.');
    const bill = {
      id: editingBill?.id ?? Date.now().toString(),
      name: trimName,
      category,
      subcategory,
      amount: amt,
      dayOfMonth,
    };
    editingBill ? onUpdate(bill) : onAdd(bill);
    closeForm();
  };


  const toggleSkip = (bill) => {
    const skipped = bill.skippedMonths || [];
    const wasSkipped = skipped.includes(monthKey);
    onUpdate({ ...bill, skippedMonths: wasSkipped ? skipped.filter(m => m !== monthKey) : [...skipped, monthKey] });
  };

  const totalMonthly = bills
    .filter(b => !b.skippedMonths?.includes(monthKey))
    .reduce((s, b) => s + b.amount, 0);

  return (
    <View style={layout.screen}>

      <View style={s.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.back}>‹ Plan</Text>
        </TouchableOpacity>
        <Text style={s.title}>Recurring Bills</Text>
        <TouchableOpacity onPress={openAdd} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.addBtn}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {bills.length > 0 && (
        <View style={s.totalBar}>
          <Text style={s.totalBarLabel}>monthly total</Text>
          <Text style={s.totalBarAmount}>
            ${totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        {bills.length === 0 ? (
          <Text style={s.empty}>No recurring bills yet.{'\n'}Tap + Add to get started.</Text>
        ) : [...bills].sort((a, b) => a.dayOfMonth - b.dayOfMonth).map(bill => {
          const isSkipped = bill.skippedMonths?.includes(monthKey);
          return (
            <View key={bill.id} style={s.billRow}>
              <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => openEdit(bill)} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.billName, isSkipped && { color: colors.textLight }]}>{bill.name}</Text>
                  <Text style={s.billMeta}>{bill.subcategory || bill.category} · due {ordinal(bill.dayOfMonth)}</Text>
                </View>
                <Text style={[s.billAmount, isSkipped && { color: colors.textLight, textDecorationLine: 'line-through' }]}>
                  ${bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleSkip(bill)} hitSlop={{ top: 10, bottom: 10, left: 12, right: 4 }} style={{ paddingLeft: 14 }}>
                <Text style={{ fontSize: 11, color: isSkipped ? colors.roseMuted : colors.textLight }}>
                  {isSkipped ? `↩ ${monthLabel}` : `skip ${monthLabel}`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Add / Edit form */}
      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={closeForm}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(45,40,40,0.3)' }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeForm} />
            <View style={s.sheet}>
              <Text style={s.sheetTitle}>{editingBill ? 'Edit Bill' : 'New Recurring Bill'}</Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                <Text style={layout.sectionLabel}>Bill name</Text>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Rent, Netflix, Internet"
                  placeholderTextColor={colors.textLight}
                />

                <Text style={layout.sectionLabel}>Category</Text>
                <TouchableOpacity style={s.pickerRow} onPress={() => setPickingCategory(true)}>
                  <Text style={[s.pickerText, !category && { color: colors.textLight }]}>
                    {category || 'Choose category'}
                  </Text>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>

                {category && availableSubcategories.length > 0 && (
                  <>
                    <Text style={layout.sectionLabel}>Subcategory</Text>
                    <TouchableOpacity style={s.pickerRow} onPress={() => setPickingSubcategory(true)}>
                      <Text style={[s.pickerText, !subcategory && { color: colors.textLight }]}>
                        {subcategory || 'Choose subcategory'}
                      </Text>
                      <Text style={s.chevron}>›</Text>
                    </TouchableOpacity>
                  </>
                )}

                <Text style={layout.sectionLabel}>Amount</Text>
                <TextInput
                  style={s.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder=""
                  placeholderTextColor={colors.textLight}
                />

                <Text style={layout.sectionLabel}>Due every month on the</Text>
                <TouchableOpacity style={s.pickerRow} onPress={() => setPickingDay(true)}>
                  <Text style={s.pickerText}>{ordinal(dayOfMonth)}</Text>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  <TouchableOpacity style={[layout.modalBtn, { backgroundColor: colors.surfaceMuted, flex: 1 }]} onPress={closeForm}>
                    <Text style={{ color: colors.textMid, fontWeight: '500' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[layout.modalBtn, { backgroundColor: colors.bill, flex: 2 }]} onPress={save}>
                    <Text style={{ color: colors.surface, fontWeight: '600' }}>Save</Text>
                  </TouchableOpacity>
                </View>

                {editingBill && (
                  confirmingDelete ? (
                    <TouchableOpacity
                      style={[layout.ghostButton, { marginTop: 4 }]}
                      onPress={() => { onDelete(editingBill.id); closeForm(); }}
                    >
                      <Text style={[layout.ghostButtonText, { color: colors.roseMuted }]}>Tap again to confirm removal</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[layout.ghostButton, { marginTop: 4 }]}
                      onPress={() => setConfirmingDelete(true)}
                    >
                      <Text style={[layout.ghostButtonText, { color: colors.textLight }]}>Remove this bill</Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Subcategory picker */}
      <Modal visible={pickingSubcategory} transparent animationType="slide" onRequestClose={() => setPickingSubcategory(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(45,40,40,0.3)' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setPickingSubcategory(false)} />
          <View style={[s.sheet, { maxHeight: '65%' }]}>
            <Text style={s.sheetTitle}>Subcategory</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {availableSubcategories.map(sub => (
                <TouchableOpacity
                  key={sub}
                  style={s.optionRow}
                  onPress={() => { setSubcategory(sub); setPickingSubcategory(false); }}
                >
                  <Text style={[s.optionText, subcategory === sub && { color: colors.bill, fontWeight: '600' }]}>
                    {sub}
                  </Text>
                  {subcategory === sub && <Text style={{ color: colors.bill }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category picker */}
      <Modal visible={pickingCategory} transparent animationType="slide" onRequestClose={() => setPickingCategory(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(45,40,40,0.3)' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setPickingCategory(false)} />
          <View style={[s.sheet, { maxHeight: '65%' }]}>
            <Text style={s.sheetTitle}>Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={s.optionRow}
                  onPress={() => { setCategory(cat.name); setSubcategory(''); setPickingCategory(false); }}
                >
                  <Text style={[s.optionText, category === cat.name && { color: colors.bill, fontWeight: '600' }]}>
                    {cat.name}
                  </Text>
                  {category === cat.name && <Text style={{ color: colors.bill }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Day picker */}
      <Modal visible={pickingDay} transparent animationType="slide" onRequestClose={() => setPickingDay(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(45,40,40,0.3)' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setPickingDay(false)} />
          <View style={[s.sheet, { maxHeight: '65%' }]}>
            <Text style={s.sheetTitle}>Due on the…</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {DAYS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={s.optionRow}
                  onPress={() => { setDayOfMonth(d); setPickingDay(false); }}
                >
                  <Text style={[s.optionText, dayOfMonth === d && { color: colors.bill, fontWeight: '600' }]}>
                    {ordinal(d)}
                  </Text>
                  {dayOfMonth === d && <Text style={{ color: colors.bill }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  back:   { fontSize: type.base, color: colors.bill },
  title:  { fontSize: type.md, fontWeight: '600', color: colors.textDark },
  addBtn: { fontSize: type.base, color: colors.bill, fontWeight: '500' },

  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  totalBarLabel: {
    fontSize: type.xs,
    color: colors.textLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  totalBarAmount: {
    fontSize: type.lg,
    fontWeight: '300',
    color: colors.bill,
    letterSpacing: 0.5,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  billName:   { fontSize: type.base, color: colors.textDark, fontWeight: '500' },
  billMeta:   { fontSize: type.sm, color: colors.textLight, marginTop: 2 },
  billAmount: { fontSize: type.base, color: colors.bill, fontWeight: '500' },

  empty: {
    textAlign: 'center',
    color: colors.textLight,
    fontStyle: 'italic',
    fontSize: type.sm,
    marginTop: 48,
    lineHeight: 22,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  sheetTitle: {
    fontSize: type.md,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 14,
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 16,
    outlineWidth: 0,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 14,
    marginBottom: 16,
  },
  pickerText: { flex: 1, fontSize: 16, color: colors.textDark },
  chevron:    { fontSize: type.lg, color: colors.textLight },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  optionText: { flex: 1, fontSize: type.base, color: colors.textDark },
});
