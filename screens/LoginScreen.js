import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { LangContext } from '../App';

export default function LoginScreen({ route }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { t, lang, setLang } = useContext(LangContext);
  const { setAuthData } = route.params;

  const handleAuth = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert(t.error, t.fillAll);
      return;
    }
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const payload = isLogin ? { phone, password } : { phone, password, role: 'driver' };
      const response = await axios.post(`${API_URL}${endpoint}`, payload);
      if (isLogin) {
        if (response.data.user.role !== 'driver') {
          Alert.alert(t.denied, t.driverOnly);
          return;
        }
        setAuthData(response.data);
      } else {
        Alert.alert(t.driverSignupSuccess, t.driverSignupPending);
        setIsLogin(true);
      }
    } catch (error) {
      Alert.alert(t.error, error.response?.data?.error || t.authFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
        <Text style={styles.langText}>{t.switchLang}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t.driverTitle}</Text>
      <Text style={styles.subtitle}>{t.subtitle}</Text>

      <TextInput style={styles.input} placeholder={t.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textAlign={lang === 'ar' ? 'right' : 'left'} placeholderTextColor="#aaa" />
      <TextInput style={styles.input} placeholder={t.password} value={password} onChangeText={setPassword} secureTextEntry textAlign={lang === 'ar' ? 'right' : 'left'} placeholderTextColor="#aaa" />

      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isLogin ? t.login : t.applyDriver}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>{isLogin ? t.wantDrive : t.approved}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8f9fa' },
  langBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: '#eee', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  langText: { fontSize: 14, fontWeight: '600', color: '#333' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 5, textAlign: 'center', color: '#2e8b57' },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#888', marginBottom: 40 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, backgroundColor: '#fff' },
  button: { backgroundColor: '#2e8b57', padding: 16, borderRadius: 10, alignItems: 'center', elevation: 2 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#2e8b57', fontSize: 16 },
});
