// screens/SavingsGoalsScreen.js
import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { colors, type } from '../styles/shared';
import layout from '../styles/layout';

const SAVINGS_COLOR = '#1A7A6A';

export default function SavingsGoalsScreen({ categories, purchases, savingsGoals, onUpdateSavingsGoals, onBack }) {
  const [editingSub, setEditingSub] = useState(null);
  const [savedValue, setSavedValue] = useState('');
  const [goalValue, setGoalValue]   = useState('');
  const goalInputRef = useRef(null);

  const savingsCat    = categories.find(c => c.name === 'Savings');
  const subcategories = savingsCat?.subcategories ?? [];

  const allSavingsPurchases = useMemo(() =>
    purchases.filter(p => p.category === 'Savings' && p.amount > 0),
    [purchases]
  );

  const subData = useMemo(() =>
    subcategories.map(sub => {
      const totalSaved   = allSavingsPurchases
        .filter(p => p.subcategory === sub)
        .reduce((sum, p) => sum + p.amount, 0);
      const resetOffset  = savingsGoals[sub]?.resetOffset ?? 0;
      const displaySaved = totalSaved - resetOffset;
      const goal         = savingsGoals[sub]?.goal ?? 0;
      const progress     = goal > 0 ? Math.min(1, displaySaved / goal) : 1;
      const complete     = goal > 0 && displaySaved >= goal;
      return { sub, totalSaved, displaySaved, goal, progress, complete };
    }),
    [subcategories, allSavingsPurchases, savingsGoals]
  );

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const openEdit = (sub, currentDisplaySaved, currentGoal) => {
    setEditingSub(sub);
    setSavedValue(currentDisplaySaved !== 0 ? currentDisplaySaved.toString() : '');
    setGoalValue(currentGoal > 0 ? currentGoal.toString() : '');
  };

  const commitEdit = () => {
    if (!editingSub) return;
    const goal = parseFloat(goalValue.replace(/[^0-9.]/g, '')) || 0;
    const newDisplaySaved = parseFloat(savedValue.replace(/[^0-9.]/g, '')) || 0;

    // Compute resetOffset so that displaySaved = totalSaved - resetOffset = newDisplaySaved
    const totalSaved  = allSavingsPurchases
      .filter(p => p.subcategory === editingSub)
      .reduce((sum, p) => sum + p.amount, 0);
    const resetOffset = totalSaved - newDisplaySaved;

    onUpdateSavingsGoals({
      ...savingsGoals,
      [editingSub]: { goal, resetOffset },
    });
    setEditingSub(null);
  };

  return (
    <View style={layout.screen}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 0.5, borderColor: colors.border,
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface,
      }}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ fontSize: type.sm, color: colors.rose, fontWeight: '600' }}>‹ Plan</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: type.sm, fontWeight: '700', letterSpacing: 0.5, color: colors.textDark }}>
          Savings Goals
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={layout.scroll} contentContainerStyle={[layout.scrollContent, { paddingTop: 20 }]}>
        {subcategories.length === 0 && (
          <Text style={{ textAlign: 'center', color: colors.textLight, fontSize: type.sm, fontStyle: 'italic', marginTop: 40, lineHeight: 22 }}>
            Add subcategories to the Savings category{'\n'}via Edit categories in the Spending Plan.
          </Text>
        )}

        {subData.map(({ sub, displaySaved, goal, progress, complete }) => (
          <TouchableOpacity
            key={sub}
            style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 10 }}
            onPress={() => openEdit(sub, displaySaved, goal)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ flex: 1, fontSize: type.base, fontWeight: '600', color: colors.textDark }}>{sub}</Text>
              {complete && (
                <Text style={{ fontSize: type.xs, color: SAVINGS_COLOR, fontWeight: '600', letterSpacing: 0.5 }}>REACHED ✓</Text>
              )}
            </View>

            <View style={{ height: 8, backgroundColor: colors.surfaceMuted, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
              <View style={{
                height: 8,
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: SAVINGS_COLOR,
                borderRadius: 4,
                opacity: complete ? 1 : 0.65,
              }} />
            </View>

            <Text style={{ fontSize: type.sm, color: colors.textMid }}>
              ${fmt(displaySaved)}
              {goal > 0
                ? <Text style={{ color: colors.textLight }}>{' / $'}{fmt(goal)}</Text>
                : <Text style={{ color: colors.textLight, fontStyle: 'italic' }}> / no goal</Text>
              }
            </Text>
          </TouchableOpacity>
        ))}

        {subcategories.length > 0 && (
          <Text style={{ fontSize: type.xs, color: colors.textLight, textAlign: 'center', fontStyle: 'italic', marginTop: 4, lineHeight: 18 }}>
            Add or remove savings goals via Edit categories{'\n'}in the Spending Plan.
          </Text>
        )}
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={!!editingSub} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={layout.modalOverlay}
        >
          <View style={layout.modalBox}>
            <Text style={{ fontSize: type.lg, fontWeight: '600', color: colors.textDark, textAlign: 'center', marginBottom: 20 }}>
              {editingSub}
            </Text>

            <Text style={{ fontSize: type.xs, color: colors.textLight, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
              Saved so far
            </Text>
            <TextInput
              style={{
                fontSize: 32, fontWeight: '300', color: colors.textDark,
                textAlign: 'center', borderBottomWidth: 1.5,
                borderColor: colors.borderMuted, paddingBottom: 8,
                marginBottom: 20, letterSpacing: 1, outlineWidth: 0,
              }}
              value={savedValue}
              onChangeText={setSavedValue}
              keyboardType="decimal-pad"
              placeholder=""
              placeholderTextColor={colors.textLight}
              returnKeyType="next"
              onSubmitEditing={() => goalInputRef.current?.focus()}
            />

            <Text style={{ fontSize: type.xs, color: colors.textLight, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
              Goal
            </Text>
            <TextInput
              ref={goalInputRef}
              style={{
                fontSize: 32, fontWeight: '300', color: colors.textDark,
                textAlign: 'center', borderBottomWidth: 1.5,
                borderColor: colors.borderMuted, paddingBottom: 8,
                marginBottom: 24, letterSpacing: 1, outlineWidth: 0,
              }}
              value={goalValue}
              onChangeText={setGoalValue}
              keyboardType="decimal-pad"
              placeholder=""
              placeholderTextColor={colors.textLight}
              returnKeyType="done"
              onSubmitEditing={commitEdit}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[layout.modalBtn, { backgroundColor: colors.surfaceMuted, flex: 1 }]}
                onPress={() => setEditingSub(null)}
              >
                <Text style={{ color: colors.textMid, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[layout.modalBtn, { backgroundColor: SAVINGS_COLOR, flex: 2 }]}
                onPress={commitEdit}
              >
                <Text style={{ color: colors.surface, fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
