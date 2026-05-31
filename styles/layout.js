// styles/layout.js
import { StyleSheet } from 'react-native';
import { colors, type } from './shared';

export default StyleSheet.create({

  // ── Containers ──────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 56,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },

  // ── Typography ──────────────────────────────────────────────
  eyebrow: {
    fontSize: type.xs,
    color: colors.textLight,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: type.xl,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: type.base,
    color: colors.textMid,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: type.xs,
    color: colors.textLight,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 24,
  },
  date: {
    fontSize: type.sm,
    color: colors.textLight,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 32,
  },

  // ── Buttons ─────────────────────────────────────────────────
  primaryButton: {
    backgroundColor: colors.rose,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: type.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: colors.rose,
    fontSize: type.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  ghostButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  ghostButtonText: {
    fontSize: type.sm,
    color: colors.roseMuted,
    textAlign: 'center',
  },

  // ── Cards ───────────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    width: '100%',
  },
  cardText: {
    fontSize: type.base,
    color: colors.textDark,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Text input ───────────────────────────────────────────────
  textBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 14,
    fontSize: 16,
    color: colors.textDark,
    minHeight: 100,
    textAlignVertical: 'top',
    width: '100%',
    marginBottom: 16,
    outlineWidth: 0,
  },

  // ── Modals ───────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 40, 40, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '88%',
  },
  modalTitle: {
    fontSize: type.md,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

});