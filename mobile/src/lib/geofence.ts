import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { BASE_URL } from './api';

const TASK = 'btp-geofence-task';
const ACTIVE_KEY = 'btp_active_assignment';
let started = false;

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('btp_token') : null;
  }
  try { return await SecureStore.getItemAsync('btp_token'); } catch { return null; }
}

// Background location task: posts each fix to the server, which geofence-checks it.
TaskManager.defineTask(TASK, async ({ data, error }: { data?: { locations?: Location.LocationObject[] }; error?: unknown }) => {
  if (error || !data?.locations?.length) return;
  const loc = data.locations[data.locations.length - 1];
  const token = await getToken();
  if (!token) return;
  let assignmentId: string | null = null;
  try { assignmentId = await SecureStore.getItemAsync(ACTIVE_KEY); } catch { /* ignore */ }
  try {
    await fetch(`${BASE_URL}/location/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        assignment_id: assignmentId ?? undefined,
      }),
    });
  } catch { /* offline — drop this fix */ }
});

/** Begin background geofence tracking for an active assignment. */
export async function startGeofence(assignmentId: string): Promise<void> {
  if (Platform.OS === 'web') return; // background tracking is native-only
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return;
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') return; // user declined "Always" — foreground ping still covers it

    try { await SecureStore.setItemAsync(ACTIVE_KEY, assignmentId); } catch { /* ignore */ }

    const running = await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false);
    if (running) { started = true; return; }

    await Location.startLocationUpdatesAsync(TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60_000,
      distanceInterval: 50,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Patrol active',
        notificationBody: 'Sharing your location with command for the assigned zone.',
      },
    });
    started = true;
  } catch {
    // task-manager unavailable (e.g. Expo Go) — foreground ping in the detail screen still works
  }
}

export async function stopGeofence(): Promise<void> {
  if (Platform.OS === 'web' || !started) return;
  try {
    const running = await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false);
    if (running) await Location.stopLocationUpdatesAsync(TASK);
  } catch { /* ignore */ }
  started = false;
}
