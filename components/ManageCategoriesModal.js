// components/ManageCategoriesModal.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, ScrollView, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { colors, type } from '../styles/shared';
import layout from '../styles/layout';
import styles from '../styles/modal';
import { DEFAULT_CATEGORIES } from '../data/constants';

export default function ManageCategoriesModal({ visible, categories, onSave, onClose }) {
  const [list, setList] = useState([]);
  const [expandedCat, setExpandedCat] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [newSubName, setNewSubName] = useState('');

  // Editing state — { type: 'category' | 'subcategory', catId, subIndex, value }
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (visible) {
      setList(categories.map(c => ({ ...c, subcategories: [...c.subcategories] })));
      setEditing(null);
      setExpandedCat(null);
    }
  }, [visible]);

  // ── Category actions ─────────────────────────────────────
  const startEditCat = (cat) => {
    setEditing({ type: 'category', catId: cat.id, value: cat.name });
  };

  const commitEditCat = () => {
    if (!editing || editing.type !== 'category') return;
    const name = editing.value.trim();
    if (!name) return;
    setList(prev => prev.map(c => c.id === editing.catId ? { ...c, name } : c));
    setEditing(null);
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name || list.find(c => c.name === name)) return;
    setList(prev => [...prev, { id: Date.now().toString(), name, subcategories: [] }]);
    setNewCatName('');
  };

  const removeCategory = (id) => {
    Alert.alert('Remove category?', 'This will remove the category and all its subcategories.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setList(prev => prev.filter(c => c.id !== id));
        if (expandedCat === id) setExpandedCat(null);
        if (editing?.catId === id) setEditing(null);
      }},
    ]);
  };

  // ── Subcategory actions ──────────────────────────────────
  const startEditSub = (catId, subIndex, current) => {
    setEditing({ type: 'subcategory', catId, subIndex, value: current });
  };

  const commitEditSub = () => {
    if (!editing || editing.type !== 'subcategory') return;
    const name = editing.value.trim();
    if (!name) return;
    setList(prev => prev.map(c => {
      if (c.id !== editing.catId) return c;
      const subs = [...c.subcategories];
      subs[editing.subIndex] = name;
      return { ...c, subcategories: subs };
    }));
    setEditing(null);
  };

  const addSubcategory = (catId) => {
    const name = newSubName.trim();
    if (!name) return;
    setList(prev => prev.map(c =>
      c.id === catId ? { ...c, subcategories: [...c.subcategories, name] } : c
    ));
    setNewSubName('');
  };

  const removeSubcategory = (catId, subIndex) => {
    setList(prev => prev.map(c =>
      c.id === catId
        ? { ...c, subcategories: c.subcategories.filter((_, i) => i !== subIndex) }
        : c
    ));
    if (editing?.catId === catId && editing?.subIndex === subIndex) setEditing(null);
  };

  const isEditingCat = (catId) => editing?.type === 'category' && editing.catId === catId;
  const isEditingSub = (catId, subIndex) =>
    editing?.type === 'subcategory' && editing.catId === catId && editing.subIndex === subIndex;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={layout.modalOverlay}>
        <View style={[layout.modalBox, { maxHeight: '88%', width: '94%' }]}>
          <Text style={layout.modalTitle}>Edit categories</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '75%' }}>
            {list.map(cat => (
              <View key={cat.id}>
                {/* Category row */}
                <View style={styles.catRow}>
                  {isEditingCat(cat.id) ? (
                    <TextInput
                      style={styles.inlineInput}
                      value={editing.value}
                      onChangeText={v => setEditing({ ...editing, value: v })}
                      onSubmitEditing={commitEditCat}
                      onBlur={commitEditCat}
                      returnKeyType="done"
                    />
                  ) : (
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                    >
                      <Text style={styles.catName}>{cat.name}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => startEditCat(cat)} style={styles.actionBtn}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeCategory(cat.id)} style={styles.actionBtn}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>

                {/* Subcategories */}
                {expandedCat === cat.id && (
                  <View style={styles.subList}>
                    {cat.subcategories.map((sub, subIndex) => (
                      <View key={subIndex} style={styles.subRow}>
                        {isEditingSub(cat.id, subIndex) ? (
                          <TextInput
                            style={styles.inlineInput}
                            value={editing.value}
                            onChangeText={v => setEditing({ ...editing, value: v })}
                            onSubmitEditing={commitEditSub}
                            onBlur={commitEditSub}
                                  returnKeyType="done"
                          />
                        ) : (
                          <Text style={styles.subName}>{sub}</Text>
                        )}
                        <TouchableOpacity
                          onPress={() => startEditSub(cat.id, subIndex, sub)}
                          style={styles.actionBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeSubcategory(cat.id, subIndex)}
                          style={styles.actionBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.removeSmall}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* Add subcategory */}
                    <View style={styles.addSubRow}>
                      <TextInput
                        style={styles.addSubInput}
                        value={newSubName}
                        onChangeText={setNewSubName}
                        placeholder="Add subcategory…"
                        placeholderTextColor={colors.textLight}
                        returnKeyType="done"
                        onSubmitEditing={() => addSubcategory(cat.id)}
                      />
                      <TouchableOpacity style={styles.addSubBtn} onPress={() => addSubcategory(cat.id)}>
                        <Text style={styles.addSubBtnLabel}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Add category */}
            <View style={[styles.addSubRow, { marginTop: 12 }]}>
              <TextInput
                style={styles.addSubInput}
                value={newCatName}
                onChangeText={setNewCatName}
                placeholder="New category…"
                placeholderTextColor={colors.textLight}
                returnKeyType="done"
                onSubmitEditing={addCategory}
              />
              <TouchableOpacity style={styles.addSubBtn} onPress={addCategory}>
                <Text style={styles.addSubBtnLabel}>Add</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={{ alignSelf: 'center', paddingVertical: 10, marginTop: 8 }}
            onPress={() => {
              Alert.alert(
                'Reset to defaults?',
                'This will restore the original DA categories and subcategories. Your spending history and plan amounts won\'t be affected.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', style: 'destructive', onPress: () => {
                    setList(DEFAULT_CATEGORIES.map(c => ({ ...c, subcategories: [...c.subcategories] })));
                    setExpandedCat(null);
                    setEditing(null);
                  }},
                ]
              );
            }}
          >
            <Text style={{ fontSize: type.xs, color: colors.textLight, fontStyle: 'italic' }}>
              reset to defaults
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity
              style={[layout.modalBtn, { backgroundColor: colors.surfaceMuted, flex: 1 }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.textMid, fontWeight: '500', fontSize: type.sm }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[layout.modalBtn, { backgroundColor: colors.rose, flex: 2 }]}
              onPress={() => onSave(list)}
            >
              <Text style={{ color: colors.surface, fontWeight: '600', fontSize: type.sm }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}