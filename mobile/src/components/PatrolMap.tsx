import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { riskColor } from '@/lib/theme';
import { EmptyState } from './EmptyState';

interface Props {
  lat: number | null;
  lng: number | null;
  risk: string;
  userLat?: number | null;
  userLng?: number | null;
}

function buildHTML(lat: number, lng: number, risk: string, userLat?: number | null, userLng?: number | null) {
  const zoneColor = riskColor(risk);
  const userMarker =
    userLat != null && userLng != null
      ? `L.circleMarker([${userLat}, ${userLng}], {radius:8,color:'#1D4ED8',fillColor:'#3B82F6',fillOpacity:0.9,weight:2}).addTo(map).bindPopup('Your location');`
      : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;padding:0;width:100%;height:100%;}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', {zoomControl:true, attributionControl:false});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  var zone = L.circle([${lat}, ${lng}], {
    radius: 450,
    color: '${zoneColor}',
    fillColor: '${zoneColor}',
    fillOpacity: 0.12,
    dashArray: '6 8',
    weight: 2.5,
  }).addTo(map);

  L.circleMarker([${lat}, ${lng}], {
    radius: 5,
    color: '${zoneColor}',
    fillColor: '${zoneColor}',
    fillOpacity: 1,
    weight: 2,
  }).addTo(map).bindPopup('Zone centroid');

  ${userMarker}

  map.fitBounds(zone.getBounds(), {padding:[24,24]});

  window.addEventListener('message', function(e) {
    try {
      var d = JSON.parse(e.data);
      if (d.type === 'location') {
        if (window._userMarker) { window._userMarker.setLatLng([d.lat, d.lng]); }
        else { window._userMarker = L.circleMarker([d.lat,d.lng],{radius:8,color:'#1D4ED8',fillColor:'#3B82F6',fillOpacity:0.9,weight:2}).addTo(map); }
      }
    } catch(err){}
  });
  document.addEventListener('message', function(e) {
    window.dispatchEvent(new MessageEvent('message', {data: e.data}));
  });
</script>
</body>
</html>`;
}

export function PatrolMap({ lat, lng, risk, userLat, userLng }: Props) {
  const webViewRef = useRef<WebView>(null);

  if (lat == null || lng == null) {
    return (
      <View style={styles.placeholder}>
        <EmptyState icon="location-outline" title="Zone coordinates unavailable" subtitle="Location data not set for this patrol zone." />
      </View>
    );
  }

  const html = buildHTML(lat, lng, risk, userLat, userLng);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        scrollEnabled={false}
      />
    </View>
  );
}

export function updateUserLocation(webViewRef: React.RefObject<WebView | null>, lat: number, lng: number) {
  webViewRef.current?.postMessage(JSON.stringify({ type: 'location', lat, lng }));
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    overflow: 'hidden',
    borderRadius: 0,
  },
  webview: {
    flex: 1,
  },
  placeholder: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
