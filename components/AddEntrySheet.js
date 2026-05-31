// components/AddEntrySheet.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Modal, Alert,
} from 'react-native';
import { colors } from '../styles/shared';
import layout from '../styles/layout';
import historyStyles from '../styles/history';
import numberStyles from '../styles/numbers';
import ManageCategoriesModal from './ManageCategoriesModal';

const isIncome = (cat) => cat?.name === 'Income' || cat?.name === 'Revenue';

export default function AddEntrySheet({ visible, date, categories, activeCategoryColors, activeIncomeColor, onAdd, onUpdateCategories, onClose, initialCategory = null, initialCategoryIndex = 0 }) {
  const [step, setStep] = useState('category');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isRefund, setIsRefund] = useState(false);
  const [manageVisible, setManageVisible] = useState(false);
  const formScrollRef = useRef(null);

  useEffect(() => {
    if (visible) {
      if (initialCategory != null) {
        setStep('form');
        setSelectedCategory(initialCategory);
        setSelectedCategoryIndex(initialCategoryIndex);
      } else {
        setStep('category');
        setSelectedCategory(null);
        setSelectedCategoryIndex(0);
      }
      setSelectedSubcategory(null);
      setAmount('');
      setNote('');
      setIsRefund(false);
    } else {
      formScrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [visible]);

  useEffect(() => {
    if (step === 'form') {
      formScrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [step]);

  const selectCategory = (cat, index) => {
    setSelectedCategory(cat);
    setSelectedCategoryIndex(index);
    setSelectedSubcategory(null);
    setStep('form');
  };

  const close = () => {
    onClose();
  };

  const submit = () => {
    const amt = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(amt) || amt <= 0) { Alert.alert('', 'Please enter an amount.'); return; }
    if (!selectedSubcategory) { Alert.alert('', 'Please choose a subcategory.'); return; }
    const finalAmt = (isRefund && !isIncome(selectedCategory)) ? -amt : amt;
    onAdd({
      id: Date.now().toString(),
      date: date,
      amount: finalAmt,
      category: selectedCategory.name,
      subcategory: selectedSubcategory,
      note: note.trim(),
      income: isIncome(selectedCategory),
    });
    close();
  };

  const palette = activeCategoryColors[selectedCategoryIndex % activeCategoryColors.length];

  return (
    <>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={historyStyles.editBackdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
        <View style={historyStyles.editSheet}>
          {step === 'category' ? (
            <>
              <Text style={historyStyles.editSheetTitle}>Add entry — choose category</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {categories.map((cat, index) => {
                  const c = activeCategoryColors[index % activeCategoryColors.length];
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[historyStyles.pickerRow, { backgroundColor: c.bg, marginBottom: 6 }]}
                      onPress={() => selectCategory(cat, index)}
                      activeOpacity={0.75}
                    >
                      <Text style={[historyStyles.pickerRowLabel, { color: c.text }]}>{cat.name}</Text>
                      <Text style={[historyStyles.pickerRowChevron, { color: c.text }]}>›</Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity style={[layout.ghostButton, { marginTop: 8 }]} onPress={close}>
                  <Text style={layout.ghostButtonText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </>
          ) : (
            <>
              <Text style={[historyStyles.editSheetTitle, { color: palette.text }]}>
                {isIncome(selectedCategory) ? '+ ' : ''}{selectedCategory?.name}
              </Text>
              <ScrollView
                ref={formScrollRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 }}>
                  <Text style={[layout.sectionLabel, { marginTop: 0, marginBottom: 0 }]}>Amount</Text>
                  {!isIncome(selectedCategory) && (
                    <TouchableOpacity onPress={() => setIsRefund(r => !r)}>
                      <Text style={{ fontSize: 11, color: isRefund ? colors.rose : colors.textLight, fontStyle: 'italic', letterSpacing: 0.3 }}>
                        {isRefund ? '↩ refund' : 'refund?'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={historyStyles.editAmountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder=""
                  placeholderTextColor={colors.textLight}
                />

                <Text style={layout.sectionLabel}>Subcategory</Text>
                <View style={numberStyles.chipWrap}>
                  {selectedCategory?.subcategories.map(sub => {
                    const isActive = selectedSubcategory === sub;
                    return (
                      <TouchableOpacity
                        key={sub}
                        style={[numberStyles.chip, isActive && { backgroundColor: palette.bg, borderColor: palette.text }]}
                        onPress={() => setSelectedSubcategory(sub)}
                      >
                        <Text style={[numberStyles.chipLabel, isActive && { color: palette.text, fontWeight: '600' }]}>
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity onPress={() => setManageVisible(true)} style={numberStyles.editCategoriesLink}>
                  <Text style={numberStyles.editCategoriesLinkText}>edit categories & subcategories</Text>
                </TouchableOpacity>

                <Text style={layout.sectionLabel}>
                  Note <Text style={numberStyles.optional}>(optional)</Text>
                </Text>
                <TextInput
                  style={[layout.textBox, { minHeight: 60 }]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="What was this for?"
                  placeholderTextColor={colors.textLight}
                  multiline
                />

                <TouchableOpacity style={[layout.primaryButton, { backgroundColor: palette.text }]} onPress={submit}>
                  <Text style={layout.primaryButtonText}>Record this number</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[layout.ghostButton, { marginTop: 4 }]} onPress={() => setStep('category')}>
                  <Text style={layout.ghostButtonText}>‹ Change category</Text>
                </TouchableOpacity>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>

    <ManageCategoriesModal
      visible={manageVisible}
      categories={categories}
      onSave={(cats) => {
        onUpdateCategories(cats);
        if (selectedCategory) {
          const refreshed = cats.find(c => c.name === selectedCategory.name);
          if (refreshed) setSelectedCategory(refreshed);
        }
        setManageVisible(false);
      }}
      onClose={() => setManageVisible(false)}
    />
    </>
  );
}
