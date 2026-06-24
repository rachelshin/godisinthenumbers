// components/InfoModal.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Modal, Linking, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { colors } from '../styles/shared';
import styles from '../styles/plan';

export default function InfoModal({ visible, onClose, connections, user, onSignOut, onLinkGoogle, onLinkEmail, onSignInEmail, onViewUser }) {
  const isGuest = user?.isAnonymous === true;

  const [codeInput, setCodeInput]         = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [joining, setJoining]             = useState(false);
  const [joinError, setJoinError]         = useState('');
  const [regenerating, setRegenerating]   = useState(false);

  const [linkMode, setLinkMode]         = useState('create'); // 'create' | 'signin'
  const [linkEmail, setLinkEmail]       = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linking, setLinking]           = useState(false);
  const [linkError, setLinkError]       = useState('');

  const [iosPWAKeyboard, setIosPWAKeyboard] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (!window.navigator?.standalone || !window.visualViewport) return;
    const onResize = () =>
      setIosPWAKeyboard(Math.max(0, window.innerHeight - window.visualViewport.height));
    window.visualViewport.addEventListener('resize', onResize);
    return () => window.visualViewport.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (visible) connections?.loadConnections();
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setLinkMode('create');
      setLinkEmail('');
      setLinkPassword('');
      setLinkError('');
    }
  }, [visible]);

  const handleJoin = async () => {
    if (codeInput.length < 6) return;
    setJoining(true);
    setJoinError('');
    try {
      await connections.joinByCode(codeInput, nicknameInput);
      setCodeInput('');
      setNicknameInput('');
    } catch (e) {
      setJoinError(
        e.message === 'own'       ? "That's your own code."
        : e.message === 'already' ? "Already connected to this person."
        : e.message === 'not_found' ? "Code not found. Check for typos."
        : "Something went wrong. Try again."
      );
    } finally {
      setJoining(false);
    }
  };

  const handleRegenerate = () => {
    const count = connections?.viewerCount || 0;
    Alert.alert(
      'Generate new code',
      count > 0
        ? `This will disconnect all ${count} ${count === 1 ? 'person' : 'people'} currently viewing your data.`
        : 'Generate a new share code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate new code', style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            try { await connections.regenerateCode(); } catch {}
            setRegenerating(false);
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    if (isGuest) {
      onClose();
      onSignOut?.();
      return;
    }
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of your account?')) {
        onClose();
        onSignOut?.();
      }
      return;
    }
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { onClose(); onSignOut?.(); } },
    ]);
  };

  const handleLinkGooglePress = async () => {
    setLinking(true);
    setLinkError('');
    try {
      await onLinkGoogle?.();
    } catch {
      setLinkError('Could not link Google account. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  const handleEmailPress = async () => {
    if (!linkEmail.trim() || !linkPassword) {
      setLinkError('Please enter your email and password.');
      return;
    }
    setLinking(true);
    setLinkError('');
    try {
      if (linkMode === 'signin') {
        await onSignInEmail?.(linkEmail, linkPassword);
      } else {
        await onLinkEmail?.(linkEmail, linkPassword);
      }
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'An account with that email already exists.',
        'auth/user-not-found':       'No account found with that email.',
        'auth/wrong-password':       'Incorrect password.',
        'auth/invalid-credential':   'Email or password is incorrect.',
        'auth/invalid-email':        'Please enter a valid email address.',
        'auth/weak-password':        'Password must be at least 6 characters.',
        'auth/too-many-requests':    'Too many attempts. Please try again later.',
      };
      setLinkError(msgs[e.code] || 'Something went wrong. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.infoOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.infoSheet, { paddingBottom: iosPWAKeyboard }]} onPress={() => {}}>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, paddingBottom: 8 }}
          >
            {/* ── Donation ─────────────────────────────────── */}
            <Text style={styles.infoTitle}>Support this app</Text>
            <Text style={styles.infoBody}>
              God is in the Numbers will always be free and ad-free. If it's helped you, consider supporting the work to get it into the App Store:
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://ko-fi.com/nextrightthing')}>
              <Text style={styles.infoLink}>ko-fi.com/nextrightthing →</Text>
            </TouchableOpacity>

            <View style={{ height: 0.5, backgroundColor: colors.border, marginVertical: 20 }} />

            {isGuest ? (
              /* ── Guest: Create Account ───────────────────── */
              <>
                <Text style={[styles.infoTitle, { marginBottom: 4 }]}>
                  {linkMode === 'create' ? 'Create an account' : 'Sign in'}
                </Text>
                {linkMode === 'create' && (
                  <Text style={[styles.infoBody, { marginBottom: 16 }]}>
                    Your data is saved. Create an account to access it from any device — everything carries over automatically.
                  </Text>
                )}

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.bg,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 14,
                    alignItems: 'center',
                    marginBottom: 16,
                    opacity: linking ? 0.5 : 1,
                  }}
                  onPress={handleLinkGooglePress}
                  disabled={linking}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: colors.textDark }}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 }}>
                  <View style={{ flex: 1, height: 0.5, backgroundColor: colors.border }} />
                  <Text style={{ fontSize: 12, color: colors.textLight, fontStyle: 'italic' }}>or</Text>
                  <View style={{ flex: 1, height: 0.5, backgroundColor: colors.border }} />
                </View>

                <TextInput
                  style={{
                    backgroundColor: colors.surface, borderRadius: 10,
                    borderWidth: 1, borderColor: colors.borderMuted,
                    paddingHorizontal: 14, paddingVertical: 12,
                    fontSize: 16, color: colors.textDark,
                    marginBottom: 10, outlineWidth: 0,
                  }}
                  value={linkEmail}
                  onChangeText={t => { setLinkError(''); setLinkEmail(t); }}
                  placeholder="Email"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!linking}
                />
                <TextInput
                  style={{
                    backgroundColor: colors.surface, borderRadius: 10,
                    borderWidth: 1, borderColor: colors.borderMuted,
                    paddingHorizontal: 14, paddingVertical: 12,
                    fontSize: 16, color: colors.textDark,
                    marginBottom: 10, outlineWidth: 0,
                  }}
                  value={linkPassword}
                  onChangeText={t => { setLinkError(''); setLinkPassword(t); }}
                  placeholder="Password"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry
                  editable={!linking}
                />

                {linkError ? (
                  <Text style={{ fontSize: 13, color: '#c0392b', marginBottom: 8 }}>{linkError}</Text>
                ) : null}

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.textDark, borderRadius: 10,
                    paddingVertical: 13, alignItems: 'center',
                    opacity: linking ? 0.5 : 1,
                  }}
                  onPress={handleEmailPress}
                  disabled={linking}
                >
                  <Text style={{ color: colors.surface, fontWeight: '600', fontSize: 15 }}>
                    {linking ? 'Please wait…' : linkMode === 'create' ? 'Create Account' : 'Sign In'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ alignItems: 'center', marginTop: 14 }}
                  onPress={() => { setLinkMode(m => m === 'create' ? 'signin' : 'create'); setLinkError(''); }}
                  disabled={linking}
                >
                  <Text style={{ fontSize: 13, color: colors.textLight, fontStyle: 'italic' }}>
                    {linkMode === 'create' ? 'Already have an account?  Sign in' : "Don't have an account?  Create one"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── Signed-in: Connections ──────────────────── */
              <>
                <Text style={[styles.infoTitle, { marginBottom: 4 }]}>Sponsors & PRG</Text>
                <Text style={[styles.infoBody, { marginBottom: 16 }]}>
                  Share your numbers with your sponsor or Pressure Relief Group — or view theirs.
                </Text>

                {/* Share code */}
                {connections?.loading && !connections?.shareCode ? (
                  <ActivityIndicator color={colors.rose} style={{ marginVertical: 16 }} />
                ) : connections?.shareCode ? (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 10, color: colors.textLight, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
                      Your share code
                    </Text>
                    <TextInput
                      value={connections.shareCode}
                      editable={false}
                      selectTextOnFocus
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        fontSize: 28,
                        fontWeight: '700',
                        color: colors.textDark,
                        letterSpacing: 10,
                        textAlign: 'center',
                        outlineWidth: 0,
                      }}
                    />
                  </View>
                ) : null}

                {connections?.viewerCount > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 13, color: colors.textMid }}>
                      {connections.viewerCount} {connections.viewerCount === 1 ? 'person' : 'people'} can see your data
                    </Text>
                    <TouchableOpacity onPress={handleRegenerate} disabled={regenerating}>
                      <Text style={{ fontSize: 13, color: colors.roseMuted }}>
                        {regenerating ? 'Generating…' : 'Revoke all'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Enter a code */}
                <Text style={{ fontSize: 10, color: colors.textLight, letterSpacing: 3, textTransform: 'uppercase', marginTop: 8, marginBottom: 8 }}>
                  Enter someone's code
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surface, borderRadius: 10,
                    paddingHorizontal: 14, paddingVertical: 10,
                    fontSize: 20, fontWeight: '700', color: colors.textDark,
                    letterSpacing: 6, textAlign: 'center', marginBottom: 8, outlineWidth: 0,
                  }}
                  value={codeInput}
                  onChangeText={t => {
                    setJoinError('');
                    setCodeInput(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                  }}
                  placeholder="ABC123"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="characters"
                  maxLength={6}
                />
                <TextInput
                  style={{
                    backgroundColor: colors.surface, borderRadius: 10,
                    paddingHorizontal: 14, paddingVertical: 10,
                    fontSize: 16, color: colors.textDark,
                    marginBottom: 8, outlineWidth: 0,
                  }}
                  value={nicknameInput}
                  onChangeText={setNicknameInput}
                  placeholder="Label (e.g. My Sponsor)"
                  placeholderTextColor={colors.textLight}
                />
                {joinError ? (
                  <Text style={{ fontSize: 13, color: '#c0392b', marginBottom: 8 }}>{joinError}</Text>
                ) : null}
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.rose, borderRadius: 10,
                    paddingVertical: 12, alignItems: 'center', marginBottom: 16,
                    opacity: joining || codeInput.length < 6 ? 0.45 : 1,
                  }}
                  onPress={handleJoin}
                  disabled={joining || codeInput.length < 6}
                >
                  <Text style={{ color: colors.surface, fontWeight: '600', fontSize: 15 }}>
                    {joining ? 'Connecting…' : 'Connect'}
                  </Text>
                </TouchableOpacity>

                {/* Viewing list */}
                {connections?.viewing?.length > 0 && (
                  <>
                    <Text style={{ fontSize: 10, color: colors.textLight, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
                      People I'm viewing
                    </Text>
                    {connections.viewing.map(conn => (
                      <View
                        key={conn.uid}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 8 }}
                      >
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.textDark }}>{conn.nickname}</Text>
                        <TouchableOpacity
                          style={{ backgroundColor: colors.roseLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 }}
                          onPress={() => { onClose(); onViewUser?.(conn); }}
                        >
                          <Text style={{ fontSize: 13, color: colors.rose, fontWeight: '600' }}>View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          onPress={() => Alert.alert('Remove connection', `Stop viewing ${conn.nickname}'s data?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Remove', style: 'destructive', onPress: () => connections.stopViewing(conn.uid) },
                          ])}
                        >
                          <Text style={{ fontSize: 16, color: colors.textLight }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}

            {/* ── Sign out / Back to sign in ────────────────── */}
            <View style={{ height: 0.5, backgroundColor: colors.border, marginVertical: 20 }} />
            <TouchableOpacity
              style={{
                borderWidth: 1, borderColor: colors.borderMuted, borderRadius: 10,
                paddingVertical: 12, alignItems: 'center',
              }}
              onPress={handleSignOut}
            >
              <Text style={{ color: colors.textMid, fontWeight: '600', fontSize: 15 }}>
                {isGuest ? 'Back to sign in' : 'Sign out'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={[styles.infoDismiss, { padding: 24, paddingTop: 12 }]}
            onPress={onClose}
          >
            <Text style={styles.infoDismissText}>Close</Text>
          </TouchableOpacity>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
