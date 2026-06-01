// styles/plan.js
import { StyleSheet } from 'react-native';
import { colors, type } from './shared';

export default StyleSheet.create({
  tierRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: colors.bg,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  tierBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  tierEyebrow: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  tierLabel: {
    fontSize: type.sm,
    fontWeight: '600',
  },
  tierTotal: {
    fontSize: type.sm,
    fontWeight: '700',
    marginTop: 3,
  },
  tierIntro: {
    fontSize: type.base,
    color: colors.textMid,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
    lineHeight: 22,
  },

  // ── Plan screen header ────────────────────────────────────
  planHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: colors.bg,
  },
  planHeaderLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  altLinkText: {
    fontSize: type.xs,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  planTitle: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.textDark,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },

  // ── Alternate plan sub-screen header ─────────────────────
  altHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  altBackLabel: {
    fontSize: type.sm,
    color: colors.rose,
    fontWeight: '600',
  },
  altTierLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: type.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  altTotal: {
    fontSize: type.sm,
    fontWeight: '600',
  },

  // ── Category rows ────────────────────────────────────────
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  catName: {
    flex: 1,
    fontSize: type.base,
    color: colors.textDark,
    fontWeight: '600',
  },
  catTotal: {
    fontSize: type.base,
    fontWeight: '500',
    marginRight: 10,
  },
  catChevron: {
    fontSize: type.base,
    color: colors.textLight,
    width: 14,
    textAlign: 'center',
  },

  // ── Subcategory rows ─────────────────────────────────────
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 0,
  },
  subName: {
    flex: 1,
    fontSize: type.sm,
    color: colors.textMid,
  },
  subAmount: {
    fontSize: type.sm,
    fontWeight: '500',
  },

  // ── Total row ────────────────────────────────────────────
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    flex: 1,
    fontSize: type.md,
    fontWeight: '700',
    color: colors.textDark,
  },
  totalAmount: {
    fontSize: type.md,
    fontWeight: '700',
  },

  // ── Edit modal ───────────────────────────────────────────
  modalSub: {
    fontSize: type.lg,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalCat: {
    fontSize: type.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  modalAmountInput: {
    fontSize: 40,
    fontWeight: '300',
    color: colors.textDark,
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderColor: colors.borderMuted,
    paddingBottom: 10,
    marginBottom: 24,
    letterSpacing: 2,
    outlineWidth: 0,
  },

  // ── Info icon ─────────────────────────────────────────────
  infoIcon: {
    fontSize: 15,
    color: colors.textLight,
    lineHeight: 20,
  },

  // ── Info modal ────────────────────────────────────────────
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  infoSheet: {
    backgroundColor: colors.bg,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 10,
  },
  infoBody: {
    fontSize: 14,
    color: colors.textMid,
    lineHeight: 21,
    marginBottom: 14,
  },
  infoLink: {
    fontSize: 14,
    color: colors.rose,
    fontWeight: '500',
    marginBottom: 20,
    textDecorationLine: 'underline',
  },
  infoDismiss: {
    alignSelf: 'flex-end',
  },
  infoDismissText: {
    fontSize: 14,
    color: colors.textLight,
  },
});