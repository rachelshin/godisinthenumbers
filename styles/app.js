// styles/app.js
import { StyleSheet, Platform } from 'react-native';
import { colors, type } from './shared';

const web = Platform.OS === 'web';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: web ? '#e6ded6' : colors.bg,
    ...(web && { alignItems: 'center' }),
  },
  // On web/desktop, constrain the app to a centered phone-width column.
  appColumn: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.bg,
    ...(web && {
      maxWidth: 480,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
    }),
  },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: type.xl,
    fontWeight: '300',
    color: colors.textLight,
    letterSpacing: 4,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSide: {
    width: 72,
  },
  headerTitle: {
    flex: 1,
    fontSize: 26,
    fontWeight: '300',
    color: colors.textDark,
    letterSpacing: 2,
    textAlign: 'center',
  },
  headerShareBtn: {
    width: 72,
    alignItems: 'flex-end',
  },
  headerShareLabel: {
    fontSize: type.sm,
    color: colors.rose,
    fontWeight: '600',
  },
  headerSignOut: {
    fontSize: type.sm,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingBottom: 18,
    paddingTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  tabLabel: {
    fontSize: type.xs,
    color: colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.rose,
    fontWeight: '700',
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.rose,
  },
  authBar: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderColor: colors.border,
  },
  authBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authEmail: {
    fontSize: 11,
    color: colors.textLight,
    fontStyle: 'italic',
    flex: 1,
    marginRight: 12,
  },
  authAction: {
    fontSize: 11,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  authPrompt: {
    fontSize: 11,
    color: colors.textLight,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'center',
  },
});