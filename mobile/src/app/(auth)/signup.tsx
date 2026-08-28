import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@/components/ui/icon';
import { AppLogo } from '@/components/ui/app-logo';
import { COUNTRIES, Country } from '@/constants/universities';
import { useAuth } from '@/context/auth-context';

const BRAND_GREEN = '#386635'; // Forest Green

export default function SignupScreen() {
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [university, setUniversity] = useState('Digital Art University (DAU)');
  const [studentId, setStudentId] = useState('DAU-2024-8841');

  const [countryModal, setCountryModal] = useState(false);
  const [uniModal, setUniModal] = useState(false);
  const [uniSearch, setUniSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredUnis = selectedCountry.universities.filter((u) =>
    u.toLowerCase().includes(uniSearch.toLowerCase()),
  );

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !university || !studentId.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signup({
        name,
        email,
        password,
        country: selectedCountry.name,
        university,
        studentId,
      });
      router.replace('/(main)');
    } catch {
      setError('Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Country Selection Modal */}
      <Modal visible={countryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCountryModal(false)}>
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Country</Text>
            <Pressable onPress={() => setCountryModal(false)}>
              <Text style={s.modalDone}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.modalList}>
            {COUNTRIES.map((c) => (
              <Pressable
                key={c.id}
                style={[
                  s.modalItem,
                  selectedCountry.id === c.id && s.modalItemActive,
                ]}
                onPress={() => {
                  setSelectedCountry(c);
                  setUniversity('');
                  setCountryModal(false);
                }}>
                <Text style={s.modalItemTxt}>{c.flag}  {c.name}</Text>
                {selectedCountry.id === c.id && <Ionicons name="checkmark" size={18} color={BRAND_GREEN} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* University Selection Modal */}
      <Modal visible={uniModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setUniModal(false)}>
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select University ({selectedCountry.name})</Text>
            <Pressable onPress={() => setUniModal(false)}>
              <Text style={s.modalDone}>Done</Text>
            </Pressable>
          </View>
          <View style={s.modalSearch}>
            <Ionicons name="search-outline" size={16} color="#667766" />
            <TextInput
              style={s.modalSearchInput}
              placeholder={`Search in ${selectedCountry.name}...`}
              placeholderTextColor="#99A899"
              value={uniSearch}
              onChangeText={setUniSearch}
              autoFocus
            />
          </View>
          <ScrollView contentContainerStyle={s.modalList}>
            {filteredUnis.map((u) => (
              <Pressable
                key={u}
                style={[
                  s.modalItem,
                  university === u && s.modalItemActive,
                ]}
                onPress={() => {
                  setUniversity(u);
                  setUniSearch('');
                  setUniModal(false);
                }}>
                <Text style={s.modalItemTxt}>{u}</Text>
                {university === u && <Ionicons name="checkmark" size={18} color={BRAND_GREEN} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.kbav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* Back Button & Top Logo */}
            <View style={s.topNav}>
              <Pressable
                style={s.backBtn}
                onPress={() => router.replace('/(auth)/login')}>
                <Ionicons name="arrow-back" size={22} color="#334433" />
              </Pressable>
              <AppLogo size={38} bg={BRAND_GREEN} color="#FFFFFF" useImage />
            </View>

            {/* Title Block */}
            <View style={s.head}>
              <Text style={s.title}>Create Account 🎓</Text>
              <Text style={s.sub}>Join BitComut Africa to pay tuition fees seamlessly with Bitcoin.</Text>
            </View>

            {/* Form Card */}
            <View style={s.card}>
              {error ? (
                <View style={s.errBox}>
                  <Text style={s.errTxt}>{error}</Text>
                </View>
              ) : null}

              {/* Full Name */}
              <View style={s.field}>
                <Text style={s.label}>Full Name</Text>
                <TextInput
                  style={s.input}
                  placeholder="Jean-Paul Habimana"
                  placeholderTextColor="#99A899"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Email */}
              <View style={s.field}>
                <Text style={s.label}>Email Address</Text>
                <TextInput
                  style={s.input}
                  placeholder="student@university.edu"
                  placeholderTextColor="#99A899"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Country */}
              <View style={s.field}>
                <Text style={s.label}>Country</Text>
                <Pressable style={s.selectorBtn} onPress={() => setCountryModal(true)}>
                  <Text style={s.selectorTxt}>{selectedCountry.flag}  {selectedCountry.name}</Text>
                  <Ionicons name="chevron-down" size={16} color="#667766" />
                </Pressable>
              </View>

              {/* University */}
              <View style={s.field}>
                <Text style={s.label}>University</Text>
                <Pressable style={s.selectorBtn} onPress={() => setUniModal(true)}>
                  <Text style={[s.selectorTxt, !university && s.phTxt]}>
                    {university || `Select university in ${selectedCountry.name}`}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#667766" />
                </Pressable>
              </View>

              {/* Student Record / ID Number */}
              <View style={s.field}>
                <Text style={s.label}>Student Record / ID Number</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. DAU-2024-8841"
                  placeholderTextColor="#99A899"
                  value={studentId}
                  onChangeText={setStudentId}
                  autoCapitalize="characters"
                />
              </View>

              {/* Password */}
              <View style={s.field}>
                <Text style={s.label}>Password</Text>
                <View style={s.inputRow}>
                  <TextInput
                    style={s.inputFlex}
                    placeholder="Create a password"
                    placeholderTextColor="#99A899"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#667766" />
                  </Pressable>
                </View>
              </View>

              {/* Primary CTA */}
              <Pressable
                style={({ pressed }) => [s.btn, { opacity: loading ? 0.8 : pressed ? 0.88 : 1 }]}
                onPress={handleSignup}
                disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.btnTxt}>Create Account</Text>}
              </Pressable>
            </View>

            {/* Footer */}
            <View style={s.footer}>
              <Text style={s.footerTxt}>Already have an account? </Text>
              <Pressable onPress={() => router.replace('/(auth)/login')}>
                <Text style={s.footerLink}>Sign In</Text>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure White
  },
  safe: {
    flex: 1,
  },
  kbav: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 18,
  },

  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F4F6F4',
  },

  head: {
    gap: 6,
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A2E1A',
    letterSpacing: -0.6,
  },
  sub: {
    fontSize: 14,
    color: '#556955',
    lineHeight: 20,
  },

  card: {
    backgroundColor: '#F8FAF8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E8E5',
    padding: 20,
    gap: 14,
  },
  errBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },

  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#445544',
    letterSpacing: 0.3,
  },

  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E8E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A2E1A',
  },
  selectorBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E8E5',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  selectorTxt: {
    flex: 1,
    fontSize: 15,
    color: '#1A2E1A',
  },
  phTxt: {
    color: '#99A899',
  },

  inputRow: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E8E5',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputFlex: {
    flex: 1,
    fontSize: 15,
    color: '#1A2E1A',
  },
  eyeBtn: {
    paddingLeft: 10,
  },

  btn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  footerTxt: {
    fontSize: 14,
    color: '#667766',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_GREEN,
  },

  // Modal
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E8E5',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  modalDone: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_GREEN,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E8E5',
    backgroundColor: '#F8FAF8',
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A2E1A',
  },
  modalList: {
    paddingBottom: 40,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E8E5',
  },
  modalItemActive: {
    backgroundColor: '#F4F8F4',
  },
  modalItemTxt: {
    fontSize: 15,
    color: '#1A2E1A',
    flex: 1,
  },
});
