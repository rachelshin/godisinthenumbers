// screens/SavingsGoalsScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { colors, type } from '../styles/shared';
import layout from '../styles/layout';

const SAVINGS_COLOR = '#1A7A6A';
const SAVINGS_BG    = '#D0EAE4';

export default function SavingsGoalsScreen({ categories, purchases, savingsGoals, onUpdateSavingsGoals, onBack }) {
  const [editingSub, setEditingSub]   = useState(null);
  const [goalValue, setGoalValue]     = useState('');

  const savingsCat     = categories.find(c => c.name === 'Savings');
  const subcategories  = savingsCat?.subcategories ?? [];

  const allSavingsPurchases = useMemo(() =>
    purchases.filter(p => p.category === 'Savings' && p.amount > 0),
    [purchases]
  );

  const subData = useMemo(() =>
    subcategories.map(sub => {
      const totalSaved = allSavingsPurchases
        .filter(p => p.subcategory === sub)
        .reduce((sum, p) => sum + p.amount, 0);
      const resetOffset  = savingsGoals[sub]?.resetOffset ?? 0;
      const displaySaved = Math.max(0, totalSaved - resetOffset);
      const goal         = savingsGoals[sub]?.goal ?? 0;
      const progress     = goal > 0 ? Math.min(1, displaySaved / goal) : 1;
      const complete     = goal > 0 && displaySaved >= goal;
      return { sub, totalSaved, displaySaved, goal, progress, complete };
    }),
    [subcategories, allSavingsPurchases, savingsGoals]
  );

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const openEdit = (sub, currentGoal) => {
    setEditingSub(sub);
    setGoalValue(currentGoal > 0 ? currentGoal.toString() : '');
  };

  const commitGoal = () => {
    if (!editingSub) return;
    const raw  = goalValue.replace(/[^0-9.]/g, '');
    const goal = parseFloat(raw) || 0;
    onUpdateSavingsGoals({
      ...savingsGoals,
      [editingSub]: { ...(savingsGoals[editingSub] ?? {}), goal },
    });
    setEditingSub(null);
  };

  const resetProgress = (sub, totalSaved) => {
    Alert.alert(
      'Reset progress?',
      `This sets the displayed saved amount to $0 for "${sub}". Your spending records are not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () =>
          onUpdateSavingsGoals({
            ...savingsGoals,
            [sub]: { ...(savingsGoals[sub] ?? {}), resetOffset: totalSaved },
          })
        },
      ]
    );
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

        {subData.map(({ sub, totalSaved, displaySaved, goal, progress, complete }) => (
          <TouchableOpacity
            key={sub}
            style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 10 }}
            onPress={() => openEdit(sub, goal)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ flex: 1, fontSize: type.base, fontWeight: '600', color: colors.textDark }}>{sub}</Text>
              {complete && (
                <Text style={{ fontSize: type.xs, color: SAVINGS_COLOR, fontWeight: '600', letterSpacing: 0.5 }}>REACHED ✓</Text>
              )}
            </View>

            {/* Progress bar */}
            <View style={{ height: 8, backgroundColor: colors.surfaceMuted, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
              <View style={{
                height: 8,
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: SAVINGS_COLOR,
                borderRadius: 4,
                opacity: complete ? 1 : 0.65,
              }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: type.sm, color: colors.textMid }}>
                ${fmt(displaySaved)}
                {goal > 0
                  ? <Text style={{ color: colors.textLight }}>{' / $'}{fmt(goal)}</Text>
                  : <Text style={{ color: colors.textLight, fontStyle: 'italic' }}> / no goal</Text>
                }
              </Text>
              {displaySaved > 0 && (
                <TouchableOpacity
                  onPress={() => resetProgress(sub, totalSaved)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={{ fontSize: type.xs, color: colors.textLight, fontStyle: 'italic' }}>reset to $0</Text>
                </TouchableOpacity>
              )}
            </View>

            {goal === 0 && (
              <Text style={{ fontSize: type.xs, color: colors.textLight, fontStyle: 'italic', marginTop: 6 }}>
                tap to set a goal
              </Text>
            )}
          </TouchableOpacity>
        ))}

        {subcategories.length > 0 && (
          <Text style={{ fontSize: type.xs, color: colors.textLight, textAlign: 'center', fontStyle: 'italic', marginTop: 4, lineHeight: 18 }}>
            Add or remove savings goals via Edit categories{'\n'}in the Spending Plan.
          </Text>
        )}
      </ScrollView>

      {/* Goal edit modal */}
      <Modal visible={!!editingSub} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={layout.modalOverlay}
        >
          <View style={layout.modalBox}>
            <Text style={{ fontSize: type.lg, fontWeight: '600', color: colors.textDark, textAlign: 'center', marginBottom: 4 }}>
              {editingSub}
            </Text>
            <Text style={{ fontSize: type.sm, color: colors.textLight, textAlign: 'center', marginBottom: 20 }}>
              Savings goal
            </Text>
            <TextInput
              style={{
                fontSize: 40, fontWeight: '300', color: colors.textDark,
                textAlign: 'center', borderBottomWidth: 1.5,
                borderColor: colors.borderMuted, paddingBottom: 10,
                marginBottom: 24, letterSpacing: 2, outlineWidth: 0,
              }}
              value={goalValue}
              onChangeText={setGoalValue}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textLight}
              autoFocus
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
                onPress={commitGoal}
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
