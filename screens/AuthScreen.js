// screens/AuthScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { auth, googleProvider } from '../data/firebase';
import {
  signInWithPopup, signInWithRedirect,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInAnonymously,
} from 'firebase/auth';
import { colors } from '../styles/shared';

const web = Platform.OS === 'web';

// A curated selection from the category palette
const PALETTE = [
  '#7B3FA0', // violet
  '#2E7D3A', // green
  '#C0621A', // orange
  '#1A5C9E', // blue
  '#A03030', // coral
  '#1A7A5E', // emerald
  '#9E6E1A', // amber
  '#A01E5C', // pink
];

const ERROR_MESSAGES = {
  'auth/user-not-found':       'No account found with that email.',
  'auth/wrong-password':       'Incorrect password.',
  'auth/invalid-credential':   'Email or password is incorrect.',
  'auth/invalid-email':        'Please enter a valid email address.',
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/weak-password':        'Password must be at least 6 characters.',
  'auth/too-many-requests':    'Too many attempts. Please try again later.',
};

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        setLoading(false);
        Alert.alert('', 'Could not sign in with Google. Please try again.');
      }
    }
  };

  const handleEmailAuth = async () => {
    const trimEmail = email.trim();
    if (!trimEmail || !password) {
      Alert.alert('', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, trimEmail, password);
      } else {
        await createUserWithEmailAndPassword(auth, trimEmail, password);
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('', ERROR_MESSAGES[e.code] || 'Something went wrong. Please try again.');
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (e) {
      setLoading(false);
      Alert.alert('', 'Could not continue as guest. Please try again.');
    }
  };

  const toggleMode = () => {
    setAuthMode(m => m === 'signin' ? 'signup' : 'signin');
    setPassword('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.container}
    >
      <ScrollView
        style={s.scrollOuter}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.paletteRow}>
          {PALETTE.map((color, i) => (
            <View key={i} style={[s.paletteDot, { backgroundColor: color }]} />
          ))}
        </View>

        <Text style={s.title}>God is in the Numbers</Text>
        <Text style={s.tagline}>
          Track your personal and business spending{'\n'}and build a spending plan
        </Text>

        <View style={s.card}>
          <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={loading} activeOpacity={0.75}>
            <Text style={s.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerLabel}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TextInput
            style={[s.input, { marginBottom: 0 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textLight}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity style={s.primaryBtn} onPress={handleEmailAuth} disabled={loading} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>
              {loading ? 'Please wait…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.switchRow} onPress={toggleMode} disabled={loading}>
          <Text style={s.switchText}>
            {authMode === 'signin'
              ? "Don't have an account?  Create one"
              : 'Already have an account?  Sign in'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.guestRow} onPress={handleGuest} disabled={loading}>
          <Text style={s.guestText}>Continue as Guest</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: web ? '#e6ded6' : colors.bg,
    ...(web && { alignItems: 'center' }),
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  scrollOuter: {
    width: '100%',
    backgroundColor: colors.bg,
    ...(web && { maxWidth: 480, alignSelf: 'center' }),
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 26,
  },
  paletteDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    opacity: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.textDark,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.3,
    marginBottom: 36,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 20,
  },
  googleBtn: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'center',
    marginBottom: 18,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textDark,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 13,
    fontSize: 15,
    color: colors.textDark,
    marginBottom: 10,
    outlineWidth: 0,
  },
  primaryBtn: {
    backgroundColor: colors.textDark,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.surface,
  },
  switchRow: {
    alignItems: 'center',
  },
  switchText: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  guestRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  guestText: {
    fontSize: 12,
    color: colors.textLight,
    textDecorationLine: 'underline',
  },
});
