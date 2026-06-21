import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { useAuth } from '@/lib/auth';
import { request } from '@/lib/api';
import type { Station } from '@/lib/queries';
import { colors, gradients, radius, spacing, type } from '@/lib/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', number: '', police_station: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Station picker (public list, fetched pre-auth)
  const [stations, setStations] = useState<Station[]>([]);
  const [stationQuery, setStationQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => {
    request<Station[]>('/stations/master').then(setStations).catch(() => setStations([]));
  }, []);
  const stationMatches = useMemo(() => {
    const q = stationQuery.trim().toLowerCase();
    const list = q ? stations.filter((s) => s.name.toLowerCase().includes(q)) : stations;
    return list.slice(0, 8);
  }, [stations, stationQuery]);

  function set(key: keyof typeof form) {
    return (val: string) => setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleRegister() {
    if (!form.name || !form.email || !form.number || !form.police_station) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <LinearGradient colors={gradients.navy} style={styles.bg}>
        <SafeAreaView style={styles.center}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color={colors.risk.low} />
          </View>
          <Text style={styles.doneTitle}>Registration submitted</Text>
          <Text style={styles.doneSub}>
            Your request is pending admin approval. You'll receive login credentials by email once approved.
          </Text>
          <Button
            title="Back to Sign in"
            icon="arrow-back-outline"
            variant="outline"
            onPress={() => router.replace('/(auth)/login')}
            style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradients.navy} style={styles.bg}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
          >
            <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color={colors.white} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="person-add" size={26} color={colors.accent} />
              </View>
              <Text style={styles.heading}>Create account</Text>
              <Text style={styles.sub}>Submit your details for admin approval</Text>

              <Field label="Full name" icon="person-outline" value={form.name} onChangeText={set('name')} placeholder="Ravi Kumar" />
              <Field
                label="Email"
                icon="mail-outline"
                value={form.email}
                onChangeText={set('email')}
                placeholder="you@btp.karnataka.gov.in"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="Mobile number"
                icon="call-outline"
                value={form.number}
                onChangeText={set('number')}
                placeholder="9876543210"
                keyboardType="phone-pad"
              />
              {/* Searchable police-station picker */}
              <Field
                label="Police station"
                icon="business-outline"
                value={pickerOpen ? stationQuery : form.police_station}
                onChangeText={(v) => { setStationQuery(v); setPickerOpen(true); setForm((f) => ({ ...f, police_station: '' })); }}
                onFocus={() => setPickerOpen(true)}
                placeholder="Search your station…"
              />
              {pickerOpen && stationMatches.length > 0 && (
                <View style={styles.dropdown}>
                  {stationMatches.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => { setForm((f) => ({ ...f, police_station: s.name })); setStationQuery(''); setPickerOpen(false); }}
                      style={styles.dropdownItem}
                    >
                      <Ionicons name="location-outline" size={15} color={colors.accent} />
                      <Text style={styles.dropdownText} numberOfLines={1}>{s.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {form.police_station ? (
                <View style={styles.selectedChip}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.risk.low} />
                  <Text style={styles.selectedText}>{form.police_station}</Text>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.risk.critical} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Button title="Submit registration" icon="send-outline" onPress={handleRegister} loading={loading} style={{ marginTop: spacing.xs }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backText: {
    ...type.bodyStrong,
    color: colors.white,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heading: {
    ...type.h1,
    color: colors.text,
  },
  sub: {
    ...type.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    marginTop: 2,
  },
  dropdown: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dropdownText: { ...type.body, color: colors.text, flex: 1 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  selectedText: { ...type.caption, color: colors.risk.low, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.risk.critical + '12',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...type.caption,
    color: colors.risk.critical,
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.risk.low + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  doneTitle: {
    ...type.h1,
    color: colors.white,
    textAlign: 'center',
  },
  doneSub: {
    ...type.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
  },
});
