import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RADIUS_KEY, DEFAULT_RADIUS } from './Settings';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAthF2hGgMDjU9ip9T_jzBiJifp2N8E6w0';
const DEFAULT_COORDS = { lat: 37.78825, lng: -122.4324 };
const PIN_KEY = 'daily_pin';

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

export default function MapScreen() {
  const [center, setCenter] = useState(null);
  const [pinInfo, setPinInfo] = useState(null);
  const [polylinePath, setPolylinePath] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const getRadius = async () => {
    const val = await AsyncStorage.getItem(RADIUS_KEY);
    return val !== null ? parseFloat(val) : DEFAULT_RADIUS;
  };

  const loadSavedPin = async () => {
    try {
      const saved = await AsyncStorage.getItem(PIN_KEY);
      if (saved) {
        const { date, pin, distance, duration, path } = JSON.parse(saved);
        if (date === getTodayString()) {
          setPinInfo({ pin, distance, duration });
          setPolylinePath(path ?? null);
          return true;
        }
      }
    } catch (e) {}
    return false;
  };

  const dropPin = async (currentCenter) => {
    const loc = currentCenter || center;
    if (!loc) return;
    setSearching(true);
    setSearchError(null);

    const radius = await getRadius();

    // Radius 0 — just pin current location
    if (radius === 0) {
      setPinInfo({ pin: loc, distance: '0 mi', duration: '0 min' });
      setPolylinePath(null);
      await AsyncStorage.setItem(PIN_KEY, JSON.stringify({
        date: getTodayString(),
        pin: loc,
        distance: '0 mi',
        duration: '0 min',
        path: null,
      }));
      setSearching(false);
      return;
    }

    const targetMeters = radius * 1609.34;
    const toleranceMeters = 0.25 * 1609.34;
    const bearing = Math.random() * 2 * Math.PI;

    function pointAtBearingAndMiles(miles) {
      const R = 3958.8;
      const d = miles / R;
      const φ1 = (loc.lat * Math.PI) / 180;
      const λ1 = (loc.lng * Math.PI) / 180;
      const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(bearing));
      const λ2 = λ1 + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2));
      return {
        lat: (φ2 * 180) / Math.PI,
        lng: ((λ2 * 180) / Math.PI + 540) % 360 - 180,
      };
    }

    const getRoute = async (destination) => {
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: loc.lat, longitude: loc.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          travelMode: 'WALK',
          computeAlternativeRoutes: false,
        }),
      });
      const data = await response.json();
      if (!data.routes || data.routes.length === 0) throw new Error('No routes found');
      return data.routes[0];
    };

    let found = false;
    let guessMiles = radius * 1.15;

    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = pointAtBearingAndMiles(guessMiles);
      try {
        const route = await getRoute(candidate);
        const actualMeters = route.distanceMeters;
        const durationSecs = parseInt(route.duration.replace('s', ''), 10);
        const durationText = `${Math.round(durationSecs / 60)} min`;
        const distanceMiles = (actualMeters / 1609.34).toFixed(2);
        const diffMeters = actualMeters - targetMeters;

        if (Math.abs(diffMeters) <= toleranceMeters) {
          const path = decodePolyline(route.polyline.encodedPolyline);
          setPolylinePath(path);
          setPinInfo({ pin: candidate, distance: `${distanceMiles} mi`, duration: durationText });
          await AsyncStorage.setItem(PIN_KEY, JSON.stringify({
            date: getTodayString(),
            pin: candidate,
            distance: `${distanceMiles} mi`,
            duration: durationText,
            path,
          }));
          found = true;
          break;
        }

        const diffMiles = diffMeters / 1609.34;
        guessMiles = Math.max(0.1, guessMiles - diffMiles * 0.7);
      } catch (e) {
        guessMiles = Math.max(0.1, guessMiles * 0.95);
      }
    }

    if (!found) {
      setSearchError('Could not find a route within ±0.25 mi after 10 attempts. Try a different radius in Settings.');
    }

    setSearching(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const hasSavedPin = await loadSavedPin();
        const { status } = await Location.requestForegroundPermissionsAsync();
        let coords;
        if (status !== 'granted') {
          setLocationError('Location access denied. Showing default location.');
          coords = DEFAULT_COORDS;
        } else {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        }
        setCenter(coords);
        setLoading(false);
        if (!hasSavedPin) await dropPin(coords);
      } catch (e) {
        setLocationError('Could not get location.');
        setCenter(DEFAULT_COORDS);
        setLoading(false);
        await dropPin(DEFAULT_COORDS);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('./waddl/Prettier/New_name.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#29412c" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      ) : (
        <>
          {locationError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{locationError}</Text>
            </View>
          )}

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.dropBtn, searching && styles.dropBtnDisabled]}
              onPress={() => dropPin()}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#e4e1d3" />
              ) : (
                <View style={styles.dropBtnContent}>
                  <Image
                    source={require('./waddl/Prettier/Flip.png')}
                    style={styles.flipImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.dropBtnText}>
                    {pinInfo ? 'Find New Destination' : 'Find Destination'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {pinInfo && (
              <View style={styles.routeInfo}>
                <Text style={styles.routeInfoText}>🗺 {pinInfo.distance} away</Text>
                <Text style={styles.routeInfoText}>⏱ {pinInfo.duration}</Text>
              </View>
            )}

            {searchError && <Text style={styles.searchError}>{searchError}</Text>}
          </View>

          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: center.lat,
              longitude: center.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            <Marker coordinate={{ latitude: center.lat, longitude: center.lng }} title="You are here" />
            {pinInfo && (
              <Marker
                coordinate={{ latitude: pinInfo.pin.lat, longitude: pinInfo.pin.lng }}
                title="Your destination"
                pinColor="green"
              />
            )}
            {polylinePath && (
              <Polyline coordinates={polylinePath} strokeColor="#29412c" strokeWidth={4} />
            )}
          </MapView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e4e1d3' },
  header: {
    backgroundColor: '#29412c',
    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: { height: 90, width: 240 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 16, fontFamily: 'LilitaOne_400Regular', color: '#666' },
  errorBanner: { backgroundColor: '#fff3cd', paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#ffc107' },
  errorText: { color: '#856404', fontSize: 13, fontFamily: 'LilitaOne_400Regular' },
  controls: { backgroundColor: '#e4e1d3', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#d0cdb8', gap: 10 },
  dropBtn: { backgroundColor: '#29412c', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  dropBtnDisabled: { backgroundColor: '#aaa' },
  dropBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flipImage: { width: 24, height: 24 },
  dropBtnText: { color: '#e4e1d3', fontFamily: 'LilitaOne_400Regular', fontSize: 15 },
  routeInfo: { flexDirection: 'row', gap: 16 },
  routeInfoText: { fontSize: 13, fontFamily: 'LilitaOne_400Regular', color: '#333' },
  searchError: { fontSize: 12, fontFamily: 'LilitaOne_400Regular', color: '#c00' },
  map: { flex: 1, width: '100%' },
});