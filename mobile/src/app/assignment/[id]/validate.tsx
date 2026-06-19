import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAssignment, useSubmitValidation } from '@/lib/queries';
import { colors, radius, riskColor, shadow, spacing, type } from '@/lib/theme';

const SEVERITY_OPTIONS = ['none', 'low', 'medium', 'high'] as const;
type Severity = (typeof SEVERITY_OPTIONS)[number];
const SEVERITY_COLOR: Record<Severity, string> = {
  none: colors.textMuted,
  low: riskColor('low'),
  medium: riskColor('medium'),
  high: riskColor('high'),
};

export default function ValidateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: assignment } = useAssignment(id);
  const submit = useSubmitValidation();

  const [hasCongestion, setHasCongestion] = useState(false);
  const [severity, setSeverity] = useState<Severity>('none');
  const [vehicleType, setVehicleType] = useState('');
  const [count, setCount] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    if (!assignment) return;
    const body: Parameters<typeof submit.mutate>[0] = {
      assignment_id: assignment.id,
      cell_id: assignment.cell_id,
      has_congestion: hasCongestion,
      ...(hasCongestion && severity !== 'none' ? { congestion_severity: severity } : {}),
      ...(vehicleType.trim() ? { dominant_vehicle_type: vehicleType.trim() } : {}),
      ...(count.trim() && !isNaN(parseInt(count)) ? { vehicle_count_approx: parseInt(count) } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    submit.mutate(body, {
      onSuccess: () => {
        Alert.alert('Report submitted', 'Field report saved. Assignment marked completed.', [
          { text: 'Done', onPress: () => router.replace('/(tabs)') },
        ]);
      },
      onError: (e) => Alert.alert('Error', e.message),
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScreenHeader title="Field Report" subtitle="Record your on-ground findings" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Congestion</Text>
            <Pressable style={styles.toggleRow} onPress={() => setHasCongestion((v) => !v)}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: (hasCongestion ? colors.risk.high : colors.risk.low) + '14' }]}>
                  <Ionicons name={hasCongestion ? 'car-sport' : 'checkmark-circle'} size={20} color={hasCongestion ? colors.risk.high : colors.risk.low} />
                </View>
                <Text style={styles.toggleLabel}>Congestion observed</Text>
              </View>
              <View style={[styles.switch, hasCongestion && styles.switchOn]}>
                <View style={[styles.knob, hasCongestion && styles.knobOn]} />
              </View>
            </Pressable>

            {hasCongestion && (
              <>
                <Text style={styles.subLabel}>Severity</Text>
                <View style={styles.chips}>
                  {SEVERITY_OPTIONS.map((s) => {
                    const active = severity === s;
                    const c = SEVERITY_COLOR[s];
                    return (
                      <Pressable
                        key={s}
                        style={[styles.chip, active && { backgroundColor: c + '18', borderColor: c }]}
                        onPress={() => setSeverity(s)}
                      >
                        <Text style={[styles.chipText, active && { color: c }]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Traffic details</Text>
            <Field label="Dominant vehicle type" icon="bus-outline" value={vehicleType} onChangeText={setVehicleType} placeholder="e.g. two-wheeler, auto, bus" />
            <Field label="Approximate vehicle count" icon="calculator-outline" value={count} onChangeText={setCount} placeholder="e.g. 120" keyboardType="number-pad" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Field
              label="Additional observations"
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything notable about the zone…"
              multiline
              numberOfLines={4}
              style={{ minHeight: 90, textAlignVertical: 'top', paddingTop: spacing.sm }}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Submit field report" icon="checkmark-done" onPress={handleSubmit} loading={submit.isPending} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
  },
  cardTitle: { ...type.h3, color: colors.text, marginBottom: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleIcon: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { ...type.bodyStrong, color: colors.text },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.borderStrong,
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: colors.accent },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white, ...shadow.sm },
  knobOn: { alignSelf: 'flex-end' },
  subLabel: { ...type.label, color: colors.text, marginTop: spacing.sm },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  chipText: { ...type.label, color: colors.textMuted },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
