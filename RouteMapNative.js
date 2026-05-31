import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RouteMapNative({ route }) {
  const lats = route.map(p => p.latitude ?? p.lat);
  const lngs = route.map(p => p.longitude ?? p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const region = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.4),
    longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.4),
  };
  const coords = route.map(p => ({ latitude: p.latitude ?? p.lat, longitude: p.longitude ?? p.lng }));

  return (
    <>
      <MapView style={styles.nativeMap} region={region} scrollEnabled={false} zoomEnabled={false}>
        <Polyline coordinates={coords} strokeColor="#29412c" strokeWidth={4} />
        <Marker coordinate={coords[0]} pinColor="green" />
        <Marker coordinate={coords[coords.length - 1]} pinColor="red" />
      </MapView>
      <Text style={styles.routeTitle}>Your Route</Text>
    </>
  );
}

const styles = StyleSheet.create({
  nativeMap: { width: SCREEN_WIDTH - 64, height: (SCREEN_WIDTH - 64) * 1.5, borderRadius: 12 },
  routeTitle: { color: 'white', fontSize: 20, fontFamily: 'LilitaOne_400Regular' },
});