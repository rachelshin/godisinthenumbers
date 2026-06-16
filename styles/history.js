// styles/history.js
import { StyleSheet, Platform } from 'react-native';
import { colors, type } from './shared';

const web = Platform.OS === 'web';

export default StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.surface,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  summaryEyebrow: {
    fontSize: type.xs,
    color: colors.textLight,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: type.xxl,
    fontWeight: '300',
    color: colors.textDark,
    letterSpacing: 1,
    marginBottom: 14,
  },

  // ── Toggle ───────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: colors.surface,
  },
  toggleLabel: {
    fontSize: type.sm,
    color: colors.textLight,
    fontWeight: '500',
  },
  toggleLabelActive: {
    color: colors.rose,
    fontWeight: '600',
  },

  // ── Summary view ─────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
    marginTop: 20,
  },
  sectionName: {
    flex: 1,
    fontSize: type.sm,
    fontWeight: '700',
    color: colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionTotal: {
    fontSize: type.sm,
    fontWeight: '700',
    color: colors.rose,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
    gap: 8,
  },
  summarySubcat: {
    flex: 1,
    fontSize: type.sm,
    color: colors.textMid,
  },
  summaryNote: {
    fontSize: type.xs,
    color: colors.textLight,
    fontStyle: 'italic',
    marginRight: 4,
  },
  summaryRowAmount: {
    fontSize: type.sm,
    color: colors.textDark,
    fontWeight: '500',
  },

  // ── Entries view ─────────────────────────────────────────
  entry: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  entryAmount: {
    fontSize: type.md,
    fontWeight: '600',
    color: colors.textDark,
  },
  entryNote: {
    fontSize: type.sm,
    color: colors.textMid,
    marginBottom: 4,
    lineHeight: 20,
  },
  entryDate: {
    fontSize: type.xs,
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  catPill: {
    backgroundColor: colors.roseLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  catPillLabel: {
    fontSize: type.xs,
    color: colors.rose,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    color: colors.textLight,
    fontSize: 22,
    lineHeight: 26,
    paddingLeft: 8,
  },
  editHint: {
    fontSize: type.xs,
    color: colors.roseMuted,
    fontWeight: '500',
    paddingLeft: 8,
    alignSelf: 'center',
  },

  // ── Edit sheet ───────────────────────────────────────────
  editBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(45, 40, 40, 0.4)',
  },
  editSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '80%',
    ...(web && { maxWidth: 480, width: '100%', alignSelf: 'center' }),
  },
  editSheetTitle: {
    fontSize: type.lg,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  editSheetSub: {
    fontSize: type.sm,
    color: colors.textLight,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  editAmountInput: {
    fontSize: 42,
    fontWeight: '300',
    color: colors.textDark,
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderColor: colors.borderMuted,
    paddingBottom: 10,
    marginBottom: 28,
    letterSpacing: 2,
    outlineWidth: 0,
  },
  optional: {
    color: colors.textLight,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '400',
    fontSize: type.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.roseLight,
    borderColor: colors.rose,
  },
  chipLabel: {
    fontSize: type.sm,
    color: colors.textMid,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: colors.rose,
    fontWeight: '600',
  },

  // ── Inline category/subcategory picker ───────────────────
  selectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  selectionPillCategory: {
    fontSize: type.xs,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  selectionPillSub: {
    fontSize: type.base,
    color: colors.rose,
    fontWeight: '600',
  },
  selectionPillChevron: {
    fontSize: type.lg,
    color: colors.textLight,
  },
  pickerList: {
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: colors.surface,
  },
  pickerRowActive: {
    backgroundColor: colors.roseLight,
  },
  pickerRowLabel: {
    flex: 1,
    fontSize: type.base,
    color: colors.textDark,
    fontWeight: '500',
  },
  pickerRowLabelActive: {
    color: colors.rose,
    fontWeight: '600',
  },
  pickerRowChevron: {
    fontSize: type.lg,
    color: colors.textLight,
  },
  pickerBack: {
    marginBottom: 12,
  },
  pickerBackLabel: {
    fontSize: type.base,
    color: colors.rose,
    fontWeight: '600',
  },
  // ── Month link ───────────────────────────────────────────
  monthLink: {
    marginTop: 10,
  },
  monthLinkText: {
    fontSize: type.xs,
    color: colors.textLight,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },

  // ── Month header ─────────────────────────────────────────
  monthHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
    position: 'relative',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  shareBtn: {
    position: 'absolute',
    top: 14,
    right: 20,
  },
  monthBackBtn: {},
  monthBackLabel: {
    fontSize: type.sm,
    color: colors.rose,
    fontWeight: '600',
  },
  exportIcon: {
    fontSize: type.lg,
    color: colors.textLight,
    fontWeight: '300',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  monthNavArrow: {
    fontSize: type.xl,
    color: colors.textMid,
    paddingHorizontal: 8,
  },
  monthNavLabel: {
    fontSize: type.md,
    fontWeight: '600',
    color: colors.textDark,
  },
  monthTotalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  monthTotalCell: {
    alignItems: 'center',
  },
  monthTotalNum: {
    fontSize: type.sm,
    fontWeight: '600',
    color: colors.textDark,
  },
  monthTotalLabel: {
    fontSize: type.xs,
    color: colors.textLight,
    marginTop: 1,
    letterSpacing: 0.3,
  },
  monthTotalOp: {
    fontSize: type.sm,
    color: colors.textLight,
    marginBottom: 12,
  },

  // ── Calendar ─────────────────────────────────────────────
  calendarWrap: {
    padding: 16,
    paddingBottom: 8,
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: type.xs,
    color: colors.textLight,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1.5,
  },
  calendarCellSelected: {
    backgroundColor: colors.rose,
  },
  calendarDayNum: {
    fontSize: 12,
    color: colors.textDark,
    fontWeight: '500',
  },
  calendarDayToday: {
    color: colors.rose,
    fontWeight: '700',
  },
  calendarDaySelected: {
    color: colors.surface,
    fontWeight: '700',
  },
  calendarDayAmount: {
    fontSize: 8,
    color: colors.textMid,
    marginTop: 1,
  },

  // ── Day detail ───────────────────────────────────────────
  dayDetail: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  dayDetailTitle: {
    fontSize: type.sm,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dayDetailEmpty: {
    fontSize: type.sm,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  dayDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  dayDetailNote: {
    flex: 1,
    fontSize: type.xs,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  dayDetailAmount: {
    fontSize: type.sm,
    fontWeight: '600',
    color: colors.textDark,
    marginLeft: 'auto',
  },

  // ── Bills in calendar day detail ─────────────────────────────
  billsDayLabel: {
    fontSize: type.xs,
    color: colors.bill,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  billsDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  billsDayName: {
    flex: 1,
    fontSize: type.sm,
    color: colors.textDark,
    fontWeight: '500',
  },
  billsDayCat: {
    fontSize: type.sm,
    color: colors.textLight,
    marginRight: 10,
  },
  billsDayAmount: {
    fontSize: type.sm,
    color: colors.bill,
    fontWeight: '600',
  },
});