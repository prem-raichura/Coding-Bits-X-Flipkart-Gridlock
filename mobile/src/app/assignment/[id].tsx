import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PatrolMap, updateUserLocation } from '@/components/PatrolMap';
import { RiskBadge } from '@/components/RiskBadge';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusPill } from '@/components/StatusPill';
import { useAssignment, useOpenAssignment } from '@/lib/queries';
import { colors, radius, shadow, spacing, type } from '@/lib/theme';

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: assignment, isLoading, error } = useAssignment(id);
  const openAssignment = useOpenAssignment();
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const mapRef = useRef<WebView | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          setUserLat(latitude);
          setUserLng(longitude);
          updateUserLocation(mapRef, latitude, longitude);
        }
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScreenHeader title="Assignment" onBack={() => router.back()} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !assignment) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScreenHeader title="Assignment" onBack={() => router.back()} />
        <EmptyState icon="warning-outline" title="Failed to load" subtitle={error?.message} />
      </SafeAreaView>
    );
  }

  const { id: assignmentId, cell, status, validation } = assignment;

  function handleOpen() {
    Alert.alert('Open assignment', 'Mark this assignment as active and start your patrol?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open',
        onPress: () => openAssignment.mutate(assignmentId, { onError: (e) => Alert.alert('Error', e.message) }),
      },
    ]);
  }

  function handleNavigate() {
    if (cell.latitude == null || cell.longitude == null) {
      Alert.alert('No coordinates', 'This zone has no GPS coordinates set.');
      return;
    }
    const url = `maps://?q=${cell.latitude},${cell.longitude}`;
    const fallback = `geo:${cell.latitude},${cell.longitude}`;
    Linking.canOpenURL(url).then((can) => Linking.openURL(can ? url : fallback));
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScreenHeader
        title={`Zone ${cell.h3_index.slice(-6).toUpperCase()}`}
        subtitle="Patrol assignment"
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapWrap}>
          <PatrolMap lat={cell.latitude} lng={cell.longitude} risk={cell.risk_level} userLat={userLat} userLng={userLng} />
          <View style={styles.mapOverlay}>
            <RiskBadge level={cell.risk_level} />
            <StatusPill status={status} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zone details</Text>
          <View style={styles.grid}>
            <InfoTile icon="warning" color={colors.risk.high} label="Predicted" value={cell.predicted_violations?.toString() ?? 'N/A'} sub="violations" />
            <InfoTile icon="time" color={colors.status.active} label="Window" value={cell.prediction_window} sub="forecast" />
            <InfoTile icon="grid" color={colors.primary} label="Resolution" value={`Res-${cell.h3_resolution}`} sub="H3 cell" />
            <InfoTile
              icon="location"
              color={colors.risk.low}
              label="Coords"
              value={cell.latitude != null ? cell.latitude.toFixed(3) : 'N/A'}
              sub={cell.longitude != null ? cell.longitude.toFixed(3) : '—'}
            />
          </View>
        </View>

        {(assignment.time_limit || assignment.opened_at) && (
          <View style={styles.section}>
            <View style={styles.timeline}>
              {assignment.opened_at && (
                <TimelineRow icon="play-circle" label="Opened" value={format(new Date(assignment.opened_at), 'dd MMM yyyy, HH:mm')} />
              )}
              {assignment.time_limit && (
                <TimelineRow icon="hourglass" label="Deadline" value={format(new Date(assignment.time_limit), 'dd MMM yyyy, HH:mm')} last />
              )}
            </View>
          </View>
        )}

        {status === 'completed' && validation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Field report</Text>
            <View style={styles.reportCard}>
              <ReportRow icon="car-sport" label="Congestion" value={validation.has_congestion ? 'Yes' : 'No'}
                badge={validation.has_congestion ? colors.risk.high : colors.risk.low} />
              {validation.congestion_severity && <ReportRow icon="speedometer" label="Severity" value={cap(validation.congestion_severity)} />}
              {validation.dominant_vehicle_type && <ReportRow icon="bus" label="Dominant vehicle" value={validation.dominant_vehicle_type} />}
              {validation.vehicle_count_approx != null && <ReportRow icon="calculator" label="Vehicle count" value={validation.vehicle_count_approx.toString()} />}
              {validation.notes && <ReportRow icon="document-text" label="Notes" value={validation.notes} />}
              <ReportRow icon="checkmark-circle" label="Submitted" value={format(new Date(validation.submitted_at), 'dd MMM, HH:mm')} last />
            </View>
          </View>
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      {(status === 'pending' || status === 'active') && (
        <View style={styles.footer}>
          {status === 'pending' && (
            <Button title="Open assignment" icon="play" onPress={handleOpen} loading={openAssignment.isPending} />
          )}
          {status === 'active' && (
            <View style={styles.footerRow}>
              <Button title="Navigate" icon="navigate" variant="outline" onPress={handleNavigate} style={{ flex: 1 }} />
              <Button
                title="Submit report"
                icon="clipboard"
                onPress={() => router.push(`/assignment/${assignmentId}/validate` as never)}
                style={{ flex: 1.3 }}
              />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function InfoTile({ icon, color, label, value, sub }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string; sub: string }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: color + '14' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
    </View>
  );
}

function TimelineRow({ icon, label, value, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View style={[tlStyles.row, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={tlStyles.label}>{label}</Text>
      <Text style={tlStyles.value}>{value}</Text>
    </View>
  );
}

function ReportRow({ icon, label, value, last, badge }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean; badge?: string }) {
  return (
    <View style={[tlStyles.row, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={tlStyles.label}>{label}</Text>
      {badge ? (
        <View style={[tlStyles.badge, { backgroundColor: badge + '18' }]}>
          <Text style={[tlStyles.badgeText, { color: badge }]}>{value}</Text>
        </View>
      ) : (
        <Text style={[tlStyles.value, { flex: 1 }]}>{value}</Text>
      )}
    </View>
  );
}

const tlStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { ...type.body, color: colors.textMuted },
  value: { ...type.bodyStrong, color: colors.text, flex: 1, textAlign: 'right' },
  badge: { marginLeft: 'auto', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { ...type.label, fontSize: 12 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: spacing.md },
  mapWrap: {
    margin: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
  mapOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  sectionTitle: { ...type.h3, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '47.8%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 3,
    ...shadow.sm,
  },
  tileIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tileLabel: { ...type.micro, color: colors.textFaint, fontSize: 10 },
  tileValue: { ...type.h3, color: colors.text },
  tileSub: { ...type.caption, color: colors.textMuted },
  timeline: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  reportCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
});
