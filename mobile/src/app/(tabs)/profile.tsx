import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { useMe, useRegisterPushToken } from '@/lib/queries';
import { getExpoPushToken } from '@/lib/push';
import { colors, gradients, radius, shadow, spacing, type } from '@/lib/theme';

export default function ProfileScreen() {
  const { logout, token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const registerToken = useRegisterPushToken();

  useEffect(() => {
    if (!token) return;
    getExpoPushToken()
      .then((t) => {
        if (t) registerToken.mutate(t);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View style={styles.safe}>
      <LinearGradient colors={gradients.header} style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{me?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{me?.name ?? '—'}</Text>
        <View style={styles.usernamePill}>
          <Ionicons name="shield-checkmark" size={13} color={colors.accent} />
          <Text style={styles.username}>@{me?.username ?? '—'}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Row icon="mail-outline" label="Email" value={me?.email} />
          <Row icon="call-outline" label="Mobile" value={me?.number} />
          <Row icon="business-outline" label="Police station" value={me?.police_station} />
          <Row icon="ribbon-outline" label="Role" value={me?.role ? me.role.charAt(0).toUpperCase() + me.role.slice(1) : undefined} />
          <Row
            icon="ellipse"
            label="Status"
            value={me?.is_active ? 'Active' : 'Inactive'}
            valueColor={me?.is_active ? colors.risk.low : colors.risk.critical}
            last
          />
        </View>

        <View style={styles.notice}>
          <Ionicons name="notifications-outline" size={16} color={colors.textMuted} />
          <Text style={styles.noticeText}>Push notifications are registered for this device.</Text>
        </View>

        <Button title="Sign out" icon="log-out-outline" variant="danger" onPress={handleLogout} />
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  valueColor,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  valueColor?: string;
  last?: boolean;
}) {
  return (
    <View style={[rowStyles.row, last && { borderBottomWidth: 0 }]}>
      <View style={rowStyles.left}>
        <Ionicons name={icon} size={18} color={colors.textMuted} />
        <Text style={rowStyles.label}>{label}</Text>
      </View>
      <Text style={[rowStyles.value, valueColor && { color: valueColor }]} numberOfLines={1}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...type.body, color: colors.textMuted },
  value: { ...type.bodyStrong, color: colors.text, maxWidth: '55%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  hero: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadow.md,
  },
  avatarText: { fontSize: 38, fontWeight: '800', color: colors.primary },
  name: { ...type.h1, color: colors.white },
  usernamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  username: { ...type.caption, color: colors.white },
  content: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: { ...type.caption, color: colors.textMuted, flex: 1 },
});
