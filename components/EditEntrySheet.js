// components/EditEntrySheet.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Modal, Alert,
} from 'react-native';
import { colors } from '../styles/shared';
import layout from '../styles/layout';
import historyStyles from '../styles/history';
import numberStyles from '../styles/numbers';

function getCatColor(categories, catName, colorArray) {
  const index = categories.findIndex(c => c.name === catName);
  return colorArray[(index >= 0 ? index : 0) % colorArray.length];
}

export default function EditEntrySheet({ item, categories, activeCategoryColors, activeIncomeColor, onSave, onDelete, onClose }) {
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSubcategory, setEditSubcategory] = useState('');
  const [editNote, setEditNote] = useState('');
  const [pickerStep, setPickerStep] = useState('idle');
  const [pickerCategory, setPickerCategory] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isRefund, setIsRefund] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (item) {
      setEditAmount(Math.abs(item.amount).toString());
      setIsRefund(item.amount < 0 && !item.income);
      setEditCategory(item.category || '');
      setEditSubcategory(item.subcategory || '');
      setEditNote(item.note || '');
      setPickerStep('idle');
      setPickerCategory(null);
      setConfirmingDelete(false);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [item?.id]);

  const close = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setPickerStep('idle');
    setPickerCategory(null);
    setConfirmingDelete(false);
    onClose();
  };

  const save = () => {
    const amt = parseFloat(editAmount.replace(/[^0-9.]/g, ''));
    if (isNaN(amt) || amt <= 0) { Alert.alert('', 'Please enter a valid amount.'); return; }
    const finalAmt = (isRefund && !item.income) ? -amt : amt;
    onSave({ ...item, amount: finalAmt, category: editCategory, subcategory: editSubcategory, note: editNote.trim() });
    close();
  };

  const pickCategory = (cat) => { setPickerCategory(cat); setPickerStep('subcategory'); };
  const pickSubcategory = (sub) => {
    setEditCategory(pickerCategory.name);
    setEditSubcategory(sub);
    setPickerStep('idle');
    setPickerCategory(null);
  };

  const c = getCatColor(categories, editCategory, activeCategoryColors);

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={close} onShow={() => scrollRef.current?.scrollTo({ y: 0, animated: false })}>
      <View style={historyStyles.editBackdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
        <View style={historyStyles.editSheet}>
          <Text style={historyStyles.editSheetTitle}>Edit entry</Text>
          <Text style={historyStyles.editSheetSub}>{item?.subcategory || item?.category}</Text>
          <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 }}>
              <Text style={[layout.sectionLabel, { marginTop: 0, marginBottom: 0 }]}>Amount</Text>
              {!item?.income && (
                <TouchableOpacity onPress={() => setIsRefund(r => !r)}>
                  <Text style={{ fontSize: 11, color: isRefund ? colors.rose : colors.textLight, fontStyle: 'italic', letterSpacing: 0.3 }}>
                    {isRefund ? '↩ refund' : 'refund?'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={historyStyles.editAmountInput}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="decimal-pad"
              placeholder=""
              placeholderTextColor={colors.textLight}
            />

            <Text style={layout.sectionLabel}>Category & subcategory</Text>
            {pickerStep === 'idle' && (
              <TouchableOpacity
                style={[historyStyles.selectionPill, { backgroundColor: c.bg, borderColor: c.bg }]}
                onPress={() => setPickerStep('category')}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[historyStyles.selectionPillCategory, { color: c.text }]}>{editCategory}</Text>
                  <Text style={[historyStyles.selectionPillSub, { color: c.text }]}>{editSubcategory || 'tap to choose'}</Text>
                </View>
                <Text style={[historyStyles.selectionPillChevron, { color: c.text }]}>›</Text>
              </TouchableOpacity>
            )}
            {pickerStep === 'category' && (
              <View style={historyStyles.pickerList}>
                {categories.map((cat, index) => {
                  const pc = activeCategoryColors[index % activeCategoryColors.length];
                  return (
                    <TouchableOpacity key={cat.id} style={[historyStyles.pickerRow, { backgroundColor: pc.bg }]} onPress={() => pickCategory(cat)}>
                      <Text style={[historyStyles.pickerRowLabel, { color: pc.text }]}>{cat.name}</Text>
                      <Text style={[historyStyles.pickerRowChevron, { color: pc.text }]}>›</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {pickerStep === 'subcategory' && pickerCategory && (() => {
              const pc = getCatColor(categories, pickerCategory.name, activeCategoryColors);
              return (
                <View>
                  <TouchableOpacity style={historyStyles.pickerBack} onPress={() => setPickerStep('category')}>
                    <Text style={[historyStyles.pickerBackLabel, { color: pc.text }]}>‹ {pickerCategory.name}</Text>
                  </TouchableOpacity>
                  <View style={numberStyles.chipWrap}>
                    {pickerCategory.subcategories.map(sub => (
                      <TouchableOpacity key={sub} style={[numberStyles.chip, { backgroundColor: pc.bg, borderColor: pc.text }]} onPress={() => pickSubcategory(sub)}>
                        <Text style={[numberStyles.chipLabel, { color: pc.text }]}>{sub}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })()}

            <Text style={layout.sectionLabel}>
              Note <Text style={numberStyles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[layout.textBox, { minHeight: 60 }]}
              value={editNote}
              onChangeText={setEditNote}
              placeholder="What was this for?"
              placeholderTextColor={colors.textLight}
              multiline
            />

            <TouchableOpacity style={[layout.primaryButton, { backgroundColor: c.text }]} onPress={save}>
              <Text style={layout.primaryButtonText}>Save changes</Text>
            </TouchableOpacity>

            {confirmingDelete ? (
              <TouchableOpacity
                style={[layout.ghostButton, { marginTop: 4 }]}
                onPress={() => { onDelete(item?.id); close(); }}
              >
                <Text style={[layout.ghostButtonText, { color: colors.roseMuted }]}>Tap again to confirm removal</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[layout.ghostButton, { marginTop: 4 }]}
                onPress={() => setConfirmingDelete(true)}
              >
                <Text style={[layout.ghostButtonText, { color: colors.textLight }]}>Delete this entry</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
