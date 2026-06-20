import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { riskColor } from '@/lib/theme';
import { EmptyState } from './EmptyState';

interface Props {
  lat: number | null;
  lng: number | null;
  risk: string;
  userLat?: number | null;
  userLng?: number | null;
}

export function PatrolMap({ lat, lng, risk }: Props) {
  if (lat == null || lng == null) {
    return (
      <View style={styles.placeholder}>
        <EmptyState icon="location-outline" title="Zone coordinates unavailable" subtitle="Location data not set for this patrol zone." />
      </View>
    );
  }

  const color = riskColor(risk);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Circle
          center={{ latitude: lat, longitude: lng }}
          radius={450}
          strokeColor={color}
          strokeWidth={2}
          fillColor={color + '1F'}
          lineDashPattern={[6, 8]}
        />
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          title="Zone centroid"
          pinColor={color}
        />
      </MapView>
    </View>
  );
}

// Native map gets live location via showsUserLocation; no postMessage needed.
export function updateUserLocation(_ref: unknown, _lat: number, _lng: number) {}

const styles = StyleSheet.create({
  container: {
    height: 280,
    overflow: 'hidden',
  },
  placeholder: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
