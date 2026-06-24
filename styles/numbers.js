// styles/numbers.js
import { StyleSheet, Platform } from 'react-native';
import { colors, type } from './shared';

const web = Platform.OS === 'web';

// More saturated pastel palette — joyful but still soft
export const INCOME_COLOR = { bg: '#FEFAE0', text: '#8B6914' }; // warm gold — Income only

export const CATEGORY_COLORS = [
  INCOME_COLOR,                                                    // Income
  { bg: '#EDD9F0', text: '#7B3FA0' }, // violet          — Spiritual
  { bg: '#D6EDD9', text: '#2E7D3A' }, // fresh green     — Housing
  { bg: '#FDEBD0', text: '#C0621A' }, // warm orange     — Food
  { bg: '#D4E6F5', text: '#1A5C9E' }, // sky blue        — Transportation
  { bg: '#F5D9D6', text: '#A03030' }, // coral red       — Clothing
  { bg: '#D6F0EA', text: '#1A7A5E' }, // emerald mint    — Personal Care
  { bg: '#E8D6F5', text: '#5C2EA0' }, // deep purple     — Health Care
  { bg: '#F5EDD6', text: '#9E6E1A' }, // golden amber    — Dependent Care
  { bg: '#D6EEF5', text: '#1A6E8C' }, // ocean teal      — Entertainment
  { bg: '#E8F5D6', text: '#4A7A1A' }, // lime green      — Education
  { bg: '#F5D6E8', text: '#A01E5C' }, // hot pink        — Vacations
  { bg: '#D6E0F5', text: '#1A3A9E' }, // cobalt          — Personal Business
  { bg: '#F5E0D6', text: '#9E4A1A' }, // burnt sienna    — Gifts
  { bg: '#DCF5D6', text: '#2A7A1A' }, // grass green     — Investments
  { bg: '#E8D6F0', text: '#6A1A9E' }, // indigo          — Taxes
  { bg: '#FFF0D6', text: '#A06800' }, // marigold gold   — Debt Repayment
  { bg: '#D0EAE4', text: '#1A7A6A' }, // sea green       — Savings
];

// Deeper pastels for the spending plan — same palette, more saturated, still calm
export const PLAN_CATEGORY_COLORS = CATEGORY_COLORS.map(c => ({ bg: c.text + '66', text: c.text }));

// ── BDA (Business) palette — cooler gem tones, still whimsical ──
export const BDA_INCOME_COLOR = { bg: '#D0EDE0', text: '#1A6B45' }; // jade — Revenue only

export const BDA_CATEGORY_COLORS = [
  BDA_INCOME_COLOR,                                                    // Revenue
  { bg: '#CDE0F5', text: '#1A4A8C' }, // cornflower      — Cost of Goods
  { bg: '#DCDAF5', text: '#4535A0' }, // periwinkle      — Payroll & Contractors
  { bg: '#CDEAF0', text: '#1A6080' }, // aqua teal       — Facilities
  { bg: '#F0CEE8', text: '#8C1A6B' }, // orchid          — Marketing & Sales
  { bg: '#D0D8F0', text: '#2A3A9E' }, // slate blue      — Technology
  { bg: '#D4ECD0', text: '#2A6B2A' }, // sage            — Professional Services
  { bg: '#F0E8CC', text: '#8C6A1A' }, // warm sand       — Travel & Transport
  { bg: '#CCE0F0', text: '#1A4A80' }, // sky             — Office & Admin
  { bg: '#EAD0F5', text: '#6A1A90' }, // soft amethyst   — Education & Training
  { bg: '#D0EEE8', text: '#1A6B60' }, // seafoam         — Insurance
  { bg: '#CCDAF0', text: '#1A3880' }, // deep blue       — Banking & Finance
  { bg: '#F0D0D4', text: '#8C1A25' }, // dusty mauve     — Taxes
  { bg: '#EDE5D8', text: '#6B5030' }, // warm stone      — Debt Repayment
  { bg: '#D8F0D4', text: '#2A7A1A' }, // lime            — Investments & Savings
  { bg: '#CCEAF5', text: '#1A5878' }, // ice blue        — Owner's Draw
  { bg: '#F0D0EE', text: '#8C1A88' }, // violet          — Miscellaneous
];

export const BDA_PLAN_CATEGORY_COLORS = BDA_CATEGORY_COLORS.map(c => ({ bg: c.text + '66', text: c.text }));

export default StyleSheet.create({
  promptRow: {
    marginBottom: 20,
  },
  prompt: {
    fontSize: type.md,
    color: colors.textMid,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
  editCategoriesLink: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  editCategoriesLinkText: {
    fontSize: type.xs,
    color: colors.textLight,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },

  // ── Section headers ──────────────────────────────────────
  sectionHeading: {
    fontSize: type.xs,
    color: colors.textLight,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 10,
  },

  // ── Category list ────────────────────────────────────────
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: type.base,
    fontWeight: '700',
  },
  categoryChevron: {
    fontSize: type.lg,
    opacity: 0.6,
  },
  kindNote: {
    textAlign: 'center',
    fontSize: type.sm,
    color: colors.textLight,
    marginTop: 16,
    fontStyle: 'italic',
  },
  // ── Bank balance ─────────────────────────────────────────
  eyebrowTagline: {
    textAlign: 'center',
    fontSize: type.xs,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.textLight,
    marginBottom: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  sobrietyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  balanceRow: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: type.xs,
    color: colors.textLight,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: '300',
    color: colors.textDark,
    letterSpacing: 0.5,
    width: '100%',
    textAlign: 'center',
  },
  balanceStaleBadge: {
    fontSize: type.xs,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  balancePlaceholder: {
    fontSize: type.base,
    color: colors.textLight,
    fontStyle: 'italic',
  },

  // ── Bottom sheet modal ───────────────────────────────────
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(45, 40, 40, 0.4)',
  },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '80%',
    ...(web && { maxWidth: 480, width: '100%', alignSelf: 'center' }),
  },
  sheetTitle: {
    fontSize: type.xl,
    fontWeight: '700',
    marginBottom: 20,
  },

  // ── Amount input ─────────────────────────────────────────
  amountInput: {
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

  // ── Subcategory chips ────────────────────────────────────
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
  chipLabel: {
    fontSize: type.sm,
    color: colors.textMid,
    fontWeight: '500',
  },
  optional: {
    color: colors.textLight,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '400',
    fontSize: type.xs,
  },

  // ── Bills due today section ──────────────────────────────────
  billsDueSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderColor: colors.border,
  },
  billsDueLabel: {
    fontSize: type.xs,
    color: colors.bill,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  billsDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  billsDueName:   { flex: 1, fontSize: type.base, color: colors.textDark, fontWeight: '500' },
  billsDueCat:    { fontSize: type.sm, color: colors.textLight, marginRight: 12 },
  billsDueAmount: { fontSize: type.base, color: colors.bill, fontWeight: '500' },
});