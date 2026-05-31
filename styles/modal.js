// styles/modal.js
import { StyleSheet } from 'react-native';
import { colors, type } from './shared';

export default StyleSheet.create({
  // ── Category rows ────────────────────────────────────────
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
    gap: 8,
  },
  catName: {
    flex: 1,
    fontSize: type.base,
    color: colors.textDark,
    fontWeight: '500',
  },
  actionBtn: {
    paddingHorizontal: 4,
  },
  editText: {
    color: colors.textLight,
    fontSize: type.sm,
  },
  inlineInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
    borderBottomWidth: 1,
    borderColor: colors.rose,
    paddingBottom: 2,
    fontWeight: '500',
    outlineWidth: 0,
  },
  catCount: {
    fontSize: type.sm,
    color: colors.textLight,
  },
  removeText: {
    color: colors.roseMuted,
    fontSize: type.sm,
  },

  // ── Subcategory rows ─────────────────────────────────────
  subList: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    marginBottom: 4,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  subName: {
    flex: 1,
    fontSize: type.sm,
    color: colors.textMid,
  },
  removeSmall: {
    fontSize: 18,
    color: colors.textLight,
    lineHeight: 20,
    paddingLeft: 8,
  },

  // ── Add row ──────────────────────────────────────────────
  addSubRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  addSubInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    color: colors.textDark,
    backgroundColor: colors.surface,
    outlineWidth: 0,
  },
  addSubBtn: {
    backgroundColor: colors.roseLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addSubBtnLabel: {
    color: colors.rose,
    fontWeight: '600',
    fontSize: type.sm,
  },
});