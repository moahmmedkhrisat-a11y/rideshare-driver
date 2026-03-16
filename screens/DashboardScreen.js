import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import * as Location from 'expo-location';

export default function DashboardScreen({ route }) {
  const { authData } = route.params;
  const [socket, setSocket] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [pendingTrips, setPendingTrips] = useState([]);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();

    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Driver connected to backend');
      // Start emitting location if we have it
      if (location) {
          newSocket.emit('driver_update_location', {
              driverId: authData.user.id,
              lat: location.latitude,
              lng: location.longitude
          });
      }
    });

    newSocket.on('new_trip_request', (trip) => {
        setPendingTrips(prev => [...prev, trip]);
        Alert.alert('New Trip Request', 'A new rider is looking for a driver!');
    });

    newSocket.on('trip_status_updated', (trip) => {
      // If we accepted this trip, or another driver accepted a trip we were looking at
      if (trip.driverId === authData.user.id) {
          setActiveTrip(trip);
      } else {
          // Remove from pending if someone else took it
          setPendingTrips(prev => prev.filter(t => t.tripId !== trip.tripId));
      }
    });

    return () => newSocket.close();
  }, []);

  const acceptTrip = (tripId) => {
    if (!socket) return;
    socket.emit('accept_trip', {
      tripId: tripId,
      driverId: authData.user.id
    });
    // Optimistically remove from pending
    setPendingTrips(prev => prev.filter(t => t.tripId !== tripId));
  };

  if (activeTrip && activeTrip.status === 'accepted') {
      return (
          <View style={styles.activeContainer}>
              <Text style={styles.title}>Active Trip</Text>
              <Text style={styles.detail}>Rider ID: {activeTrip.riderId}</Text>
              <Text style={styles.detail}>Pickup: {activeTrip.pickup.lat}, {activeTrip.pickup.lng}</Text>
              <Text style={styles.detail}>Dropoff: {activeTrip.dropoff.lat}, {activeTrip.dropoff.lng}</Text>
              
              <View style={styles.footer}>
                 <Text style={styles.warning}>Drive safely to the pickup location. Map navigation would go here.</Text>
              </View>
          </View>
      );
  }

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Available Trips</Text>
        <ScrollView style={styles.list}>
            {pendingTrips.length === 0 ? (
                <Text style={styles.empty}>No riding requests at the moment. Wait here.</Text>
            ) : (
                pendingTrips.map((trip) => (
                    <View key={trip.tripId} style={styles.card}>
                        <Text style={styles.cardTitle}>Trip #{trip.tripId.slice(-4)}</Text>
                        <Text>Pickup: {trip.pickup.lat.toFixed(4)}, {trip.pickup.lng.toFixed(4)}</Text>
                        <TouchableOpacity style={styles.acceptButton} onPress={() => acceptTrip(trip.tripId)}>
                            <Text style={styles.acceptButtonText}>Accept Trip</Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  activeContainer: { flex: 1, backgroundColor: '#e6ffe6', padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2e8b57' },
  detail: { fontSize: 16, marginBottom: 10 },
  warning: { color: '#666', fontStyle: 'italic', marginTop: 40, textAlign: 'center' },
  list: { flex: 1 },
  empty: { textAlign: 'center', color: '#999', marginTop: 50 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  acceptButton: { backgroundColor: '#2e8b57', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  acceptButtonText: { color: '#fff', fontWeight: 'bold' }
});
