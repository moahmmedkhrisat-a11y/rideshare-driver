import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import * as Location from 'expo-location';
import { LangContext } from '../App';

const openGoogleMaps = (lat, lng) => {
  const url = `google.navigation:q=${lat},${lng}&mode=d`;
  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    } else {
      // Fallback to web Google Maps
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
    }
  });
};

export default function DashboardScreen({ route }) {
  const { authData } = route.params;
  const { t, lang, setLang } = useContext(LangContext);
  const socketRef = useRef(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [pendingTrips, setPendingTrips] = useState([]);
  const [locationReady, setLocationReady] = useState(false);

  useEffect(() => {
    let locationInterval = null;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.alert, t.locationPerm);
        return;
      }
      setLocationReady(true);

      locationInterval = setInterval(async () => {
        try {
          let loc = await Location.getCurrentPositionAsync({});
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('driver_update_location', {
              driverId: authData.user.id,
              lat: loc.coords.latitude,
              lng: loc.coords.longitude
            });
          }
        } catch (e) { console.log('Location error', e); }
      }, 10000);
    })();

    const newSocket = io(API_URL);
    socketRef.current = newSocket;

    newSocket.on('new_trip_request', (trip) => {
      setPendingTrips(prev => [...prev, trip]);
      Alert.alert(t.newTripAlert, t.riderNeeds);
    });

    newSocket.on('trip_status_updated', (trip) => {
      if (trip.driverId === authData.user.id) {
        setActiveTrip(trip);
      } else {
        setPendingTrips(prev => prev.filter(x => x.tripId !== trip.tripId));
      }
    });

    newSocket.on('trip_accepted_by_other', (data) => {
      setPendingTrips(prev => prev.filter(x => x.tripId !== data.tripId));
    });

    return () => {
      newSocket.close();
      socketRef.current = null;
      if (locationInterval) clearInterval(locationInterval);
    };
  }, []);

  const acceptTrip = (tripId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('accept_trip', { tripId, driverId: authData.user.id });
    setPendingTrips(prev => prev.filter(x => x.tripId !== tripId));
  };

  if (activeTrip && activeTrip.status === 'accepted') {
    return (
      <View style={styles.activeContainer}>
        <Text style={styles.activeIcon}>✅</Text>
        <Text style={styles.title}>{t.activeTrip2}</Text>
        <View style={styles.tripInfoCard}>
          <Text style={styles.detail}>{t.riderNum}: {activeTrip.riderId}</Text>
          {activeTrip.pickup && <Text style={styles.detail}>{t.pickupPoint}: {activeTrip.pickup.lat?.toFixed(4)}, {activeTrip.pickup.lng?.toFixed(4)}</Text>}
          {activeTrip.dropoff && <Text style={styles.detail}>{t.dropoffPoint}: {activeTrip.dropoff.lat?.toFixed(4)}, {activeTrip.dropoff.lng?.toFixed(4)}</Text>}
        </View>
        <Text style={styles.warning}>{t.driveSafely}</Text>
        {activeTrip.pickup && (
          <TouchableOpacity
            style={styles.googleMapsButton}
            onPress={() => openGoogleMaps(activeTrip.pickup.lat, activeTrip.pickup.lng)}
          >
            <Text style={styles.googleMapsText}>🗺️ {lang === 'ar' ? 'افتح في خرائط جوجل' : 'Navigate in Google Maps'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.completeButton} onPress={() => setActiveTrip(null)}>
          <Text style={styles.completeButtonText}>{t.completeTrip}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t.availableTrips}</Text>
        <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
          <Text style={styles.langText}>{t.switchLang}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerRow}>
        <View style={[styles.statusDot, locationReady ? styles.dotGreen : styles.dotRed]} />
        <Text style={styles.gpsLabel}>{locationReady ? 'GPS' : 'No GPS'}</Text>
      </View>

      <ScrollView style={styles.list}>
        {pendingTrips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🕐</Text>
            <Text style={styles.empty}>{t.noTrips}</Text>
            <Text style={styles.emptyHint}>{t.waitHere}</Text>
          </View>
        ) : (
          pendingTrips.map((trip) => (
            <View key={trip.tripId} style={styles.card}>
              <Text style={styles.cardTitle}>{t.trip} #{trip.tripId.slice(-4)}</Text>
              <Text style={styles.cardDetail}>{t.pickup}: {trip.pickup.lat.toFixed(4)}, {trip.pickup.lng.toFixed(4)}</Text>
              <TouchableOpacity style={styles.acceptButton} onPress={() => acceptTrip(trip.tripId)}>
                <Text style={styles.acceptButtonText}>{t.acceptTrip}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  activeContainer: { flex: 1, backgroundColor: '#f0fff0', padding: 20, justifyContent: 'center', alignItems: 'center' },
  activeIcon: { fontSize: 50, marginBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  langBtn: { backgroundColor: '#eee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  langText: { fontSize: 13, fontWeight: '600', color: '#333' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  gpsLabel: { fontSize: 12, color: '#999' },
  dotGreen: { backgroundColor: '#34c759' },
  dotRed: { backgroundColor: '#ff3b30' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2e8b57' },
  tripInfoCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '100%', marginBottom: 20, elevation: 3 },
  detail: { fontSize: 16, marginBottom: 10, textAlign: 'center' },
  warning: { color: '#666', fontStyle: 'italic', textAlign: 'center', marginBottom: 15 },
  googleMapsButton: { backgroundColor: '#4285F4', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12 },
  googleMapsText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  completeButton: { backgroundColor: '#2e8b57', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  completeButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  list: { flex: 1 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  empty: { textAlign: 'center', color: '#999', fontSize: 18, marginBottom: 8 },
  emptyHint: { textAlign: 'center', color: '#bbb', fontSize: 14 },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 15, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  cardDetail: { fontSize: 14, color: '#666', marginBottom: 12, textAlign: 'center' },
  acceptButton: { backgroundColor: '#2e8b57', padding: 14, borderRadius: 10, alignItems: 'center' },
  acceptButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
