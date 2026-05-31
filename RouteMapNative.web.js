import React from 'react';
import { View, Image, Text, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyAthF2hGgMDjU9ip9T_jzBiJifp2N8E6w0';

export default function RouteMapNative({ route }) {
  if (!route || route.length === 0) {
    return (
      <View style={styles.noRoute}>
        <Text style={styles.noRouteText}>No route attached to this photo</Text>
      </View>
    );
  }

  // Downsample to max 50 points so the URL stays under the limit
  const step = Math.ceil(route.length / 50);
  const sampled = route.filter((_, i) => i % step === 0);

  const pathParam = sampled
    .map(p => `${p.lat ?? p.latitude},${p.lng ?? p.longitude}`)
    .join('|');

  const first = route[0];
  const last = route[route.length - 1];
  const firstCoord = `${first.lat ?? first.latitude},${first.lng ?? first.longitude}`;
  const lastCoord = `${last.lat ?? last.latitude},${last.lng ?? last.longitude}`;

  const mapWidth = Math.round(SCREEN_WIDTH - 64);
  const mapHeight = Math.round(mapWidth * 1.5);

  const url =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?size=${mapWidth}x${mapHeight}` +
    `&path=color:0x29412cff|weight:4|${pathParam}` +
    `&markers=color:green|label:A|${firstCoord}` +
    `&markers=color:red|label:B|${lastCoord}` +
    `&key=${GOOGLE_MAPS_API_KEY}`;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: url }}
        style={[styles.map, { width: mapWidth, height: mapHeight }]}
        resizeMode="cover"
      />
      <Text style={styles.routeTitle}>Your Route</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  map: { borderRadius: 12 },
  routeTitle: { color: 'white', fontSize: 20, fontFamily: 'LilitaOne_400Regular' },
  noRoute: { alignItems: 'center', paddingTop: 40 },
  noRouteText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontFamily: 'LilitaOne_400Regular' },
});