// screens/ConnectionsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, type } from '../styles/shared';
import layout from '../styles/layout';

export default function ConnectionsScreen({ connections }) {
  const insets = useSafeAreaInsets();
  const {
    shareCode, viewing, viewerCount, loading,
    loadConnections, regenerateCode, joinByCode, stopViewing, loadUserData,
    user, onViewUser,
  } = connections;

  const [codeInput, setCodeInput]         = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [joining, setJoining]             = useState(false);
  const [copied, setCopied]               = useState(false);
  const [regenerating, setRegenerating]   = useState(false);
  const [joinError, setJoinError]         = useState('');

  useEffect(() => { loadConnections(); }, [loadConnections]);

  const handleCopy = useCallback(async () => {
    if (!shareCode) return;
    if (Platform.OS === 'web') {
      try { await navigator.clipboard?.writeText(shareCode); } catch {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareCode]);

  const handleJoin = useCallback(async () => {
    if (codeInput.length < 6) return;
    setJoining(true);
    setJoinError('');
    try {
      await joinByCode(codeInput, nicknameInput);
      setCodeInput('');
      setNicknameInput('');
    } catch (e) {
      const msg =
        e.message === 'own'       ? "That's your own code."
        : e.message === 'already' ? "You're already connected to this person."
        : e.message === 'not_found' ? "Code not found. Check for typos and try again."
        : "Something went wrong. Please try again.";
      setJoinError(msg);
    } finally {
      setJoining(false);
    }
  }, [codeInput, nicknameInput, joinByCode]);

  const handleRegenerate = useCallback(() => {
    const count = viewerCount;
    Alert.alert(
      'Generate new code',
      count > 0
        ? `This will disconnect all ${count} ${count === 1 ? 'person' : 'people'} currently viewing your data. They'll need to enter your new code to reconnect.`
        : 'Generate a new share code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate new code', style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            try { await regenerateCode(); } catch {}
            setRegenerating(false);
          },
        },
      ]
    );
  }, [viewerCount, regenerateCode]);

  if (user?.isAnonymous) {
    return (
      <View style={[layout.centered, { paddingTop: insets.top }]}>
        <Text style={layout.eyebrow}>Connections</Text>
        <Text style={[layout.subtitle, { marginTop: 12, paddingHorizontal: 32 }]}>
          Create an account to share your numbers with your sponsor or PRG members.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={layout.scroll}
      contentContainerStyle={[layout.scrollContent, { paddingTop: insets.top + 16 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Your share code ─────────────────────────────────── */}
      <Text style={layout.eyebrow}>Your share code</Text>
      <Text style={{ fontSize: type.sm, color: colors.textLight, textAlign: 'center', marginBottom: 16, lineHeight: 20 }}>
        Share this with your sponsor or PRG members so they can view your numbers.
      </Text>

      {loading && !shareCode ? (
        <ActivityIndicator color={colors.rose} style={{ marginVertical: 32 }} />
      ) : (
        <View style={[layout.card, { alignItems: 'center', paddingVertical: 28 }]}>
          <Text
            selectable
            style={{ fontSize: 38, fontWeight: '700', color: colors.textDark, letterSpacing: 10, marginBottom: 20 }}
          >
            {shareCode}
          </Text>
          <TouchableOpacity
            style={[layout.primaryButton, { marginBottom: 0, width: 'auto', paddingHorizontal: 32 }]}
            onPress={handleCopy}
          >
            <Text style={layout.primaryButtonText}>{copied ? 'Copied!' : 'Copy code'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {viewerCount > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 4 }}>
          <Text style={{ fontSize: type.sm, color: colors.textMid }}>
            {viewerCount} {viewerCount === 1 ? 'person' : 'people'} can see your data
          </Text>
          <TouchableOpacity onPress={handleRegenerate} disabled={regenerating}>
            <Text style={{ fontSize: type.sm, color: colors.roseMuted }}>
              {regenerating ? 'Generating…' : 'Revoke all'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Enter a code ────────────────────────────────────── */}
      <Text style={[layout.sectionLabel, { marginTop: 28 }]}>Enter someone's code</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16 }}>
        <TextInput
          style={{
            backgroundColor: colors.bg,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 22,
            fontWeight: '700',
            color: colors.textDark,
            letterSpacing: 8,
            textAlign: 'center',
            marginBottom: 10,
            outlineWidth: 0,
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
            backgroundColor: colors.bg,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            color: colors.textDark,
            marginBottom: 10,
            outlineWidth: 0,
          }}
          value={nicknameInput}
          onChangeText={setNicknameInput}
          placeholder="Label (e.g. My Sponsor, Rachel PRG)"
          placeholderTextColor={colors.textLight}
        />
        {joinError ? (
          <Text style={{ fontSize: type.sm, color: '#c0392b', marginBottom: 10, textAlign: 'center' }}>
            {joinError}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[layout.primaryButton, { marginBottom: 0, opacity: joining || codeInput.length < 6 ? 0.45 : 1 }]}
          onPress={handleJoin}
          disabled={joining || codeInput.length < 6}
        >
          <Text style={layout.primaryButtonText}>{joining ? 'Connecting…' : 'Connect'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── People I'm viewing ──────────────────────────────── */}
      {viewing.length > 0 && (
        <>
          <Text style={[layout.sectionLabel, { marginTop: 28 }]}>People I'm viewing</Text>
          {viewing.map(conn => (
            <View key={conn.uid} style={[layout.card, { flexDirection: 'row', alignItems: 'center' }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: type.base, fontWeight: '600', color: colors.textDark }}>
                  {conn.nickname}
                </Text>
                <Text style={{ fontSize: type.xs, color: colors.textLight, marginTop: 2 }}>
                  Connected {new Date(conn.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: colors.roseLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8 }}
                onPress={() => onViewUser(conn, loadUserData)}
              >
                <Text style={{ fontSize: type.sm, color: colors.rose, fontWeight: '600' }}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() =>
                  Alert.alert(
                    'Remove connection',
                    `Stop viewing ${conn.nickname}'s data?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => stopViewing(conn.uid) },
                    ]
                  )
                }
              >
                <Text style={{ fontSize: type.base, color: colors.textLight, paddingHorizontal: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {viewing.length === 0 && !loading && (
        <Text style={{ fontSize: type.sm, color: colors.textLight, textAlign: 'center', marginTop: 16, fontStyle: 'italic', lineHeight: 22 }}>
          Enter a code above to start viewing your sponsor's{'\n'}or PRG members' numbers.
        </Text>
      )}
    </ScrollView>
  );
}
