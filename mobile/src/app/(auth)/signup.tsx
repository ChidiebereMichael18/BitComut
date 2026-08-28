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
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@/components/ui/icon';
import { COUNTRIES, Country } from '@/constants/universities';
import { useAuth } from '@/context/auth-context';

export default function SignupScreen() {
  const isDark = useColorScheme() === 'dark';
  const { signup } = useAuth();

  const BG     = isDark ? '#070C07' : '#FFFFFF';
  const SURF   = isDark ? '#0E150E' : '#F6F6F6';
  const CARD   = isDark ? '#131A13' : '#F0F0F0';
  const BORDER = isDark ? '#1C271C' : '#E4E4E4';
  const TEXT   = isDark ? '#F0F0F0' : '#0D0D0D';
  const MUTED  = isDark ? '#4E644E' : '#6B7280';
  const INPUT  = isDark ? '#0E150E' : '#F6F6F6';
  const GREEN  = '#1B7F3B';
  const DANGER = isDark ? '#EF4444' : '#DC2626';
  const PH     = isDark ? '#2A3A2A' : '#C0C8C0';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Default to Rwanda (Kigali)
  const [university, setUniversity] = useState('');
  const [studentId, setStudentId] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showUniPicker, setShowUniPicker] = useState(false);
  const [uniSearch, setUniSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredUnis = selectedCountry.universities.filter((u: string) =>
    u.toLowerCase().includes(uniSearch.toLowerCase()),
  );

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !university || !studentId.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
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
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={BG} />

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountryPicker(false)}>
        <View style={[s.modal, { backgroundColor: SURF }]}>
          <View style={[s.modalHeader, { borderBottomColor: BORDER }]}>
            <Text style={[s.modalTitle, { color: TEXT }]}>Select Country</Text>
            <Pressable onPress={() => setShowCountryPicker(false)}>
              <Text style={[s.modalDone, { color: GREEN }]}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.modalList}>
            {COUNTRIES.map((c: Country) => (
              <Pressable
                key={c.id}
                style={[
                  s.modalItem,
                  { borderBottomColor: BORDER },
                  selectedCountry.id === c.id && { backgroundColor: CARD },
                ]}
                onPress={() => {
                  setSelectedCountry(c);
                  setUniversity('');
                  setShowCountryPicker(false);
                }}>
                <Text style={[s.modalItemTxt, { color: TEXT }]}>
                  {c.flag}  {c.name}
                </Text>
                {selectedCountry.id === c.id && <Ionicons name="checkmark" size={18} color={GREEN} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* University Search Modal */}
      <Modal
        visible={showUniPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUniPicker(false)}>
        <View style={[s.modal, { backgroundColor: SURF }]}>
          <View style={[s.modalHeader, { borderBottomColor: BORDER }]}>
            <Text style={[s.modalTitle, { color: TEXT }]}>Select University ({selectedCountry.name})</Text>
            <Pressable onPress={() => setShowUniPicker(false)}>
              <Text style={[s.modalDone, { color: GREEN }]}>Done</Text>
            </Pressable>
          </View>
          <View style={[s.modalSearch, { backgroundColor: INPUT, borderColor: BORDER }]}>
            <Ionicons name="search-outline" size={16} color={MUTED} />
            <TextInput
              style={[s.modalSearchInput, { color: TEXT }]}
              placeholder={`Search ${selectedCountry.name} universities...`}
              placeholderTextColor={PH}
              value={uniSearch}
              onChangeText={setUniSearch}
              autoFocus
            />
          </View>
          <ScrollView contentContainerStyle={s.modalList}>
            {filteredUnis.map((u: string) => (
              <Pressable
                key={u}
                style={[
                  s.modalItem,
                  { borderBottomColor: BORDER },
                  university === u && { backgroundColor: CARD },
                ]}
                onPress={() => {
                  setUniversity(u);
                  setUniSearch('');
                  setShowUniPicker(false);
                }}>
                <Text style={[s.modalItemTxt, { color: TEXT }]}>{u}</Text>
                {university === u && <Ionicons name="checkmark" size={18} color={GREEN} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.kbav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Back button */}
            <Pressable style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={MUTED} />
            </Pressable>

            {/* Header */}
            <View style={s.head}>
              <Text style={[s.title, { color: TEXT }]}>Create Account</Text>
              <Text style={[s.sub, { color: MUTED }]}>Enter your country and student details to get started.</Text>
            </View>

            {/* Form */}
            <View style={[s.card, { backgroundColor: SURF, borderColor: BORDER }]}>
              {error ? (
                <View style={[s.errBox, { borderColor: DANGER }]}>
                  <Text style={[s.errTxt, { color: DANGER }]}>{error}</Text>
                </View>
              ) : null}

              {/* Name */}
              <View style={s.field}>
                <Text style={[s.label, { color: MUTED }]}>Full Name</Text>
                <TextInput
                  style={[s.input, { backgroundColor: INPUT, borderColor: BORDER, color: TEXT }]}
                  placeholder="e.g. Jean-Paul Habimana"
                  placeholderTextColor={PH}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View style={s.field}>
                <Text style={[s.label, { color: MUTED }]}>Email Address</Text>
                <TextInput
                  style={[s.input, { backgroundColor: INPUT, borderColor: BORDER, color: TEXT }]}
                  placeholder="your@email.com"
                  placeholderTextColor={PH}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={s.field}>
                <Text style={[s.label, { color: MUTED }]}>Password</Text>
                <View style={[s.inputRow, { backgroundColor: INPUT, borderColor: BORDER }]}>
                  <TextInput
                    style={[s.inputFlex, { color: TEXT }]}
                    placeholder="Min. 8 characters"
                    placeholderTextColor={PH}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={MUTED} />
                  </Pressable>
                </View>
              </View>

              {/* Country Selector */}
              <View style={s.field}>
                <Text style={[s.label, { color: MUTED }]}>Country</Text>
                <Pressable
                  style={[s.uniBtn, { backgroundColor: INPUT, borderColor: BORDER }]}
                  onPress={() => setShowCountryPicker(true)}>
                  <Text style={[s.uniBtnTxt, { color: TEXT }]}>
                    {selectedCountry.flag}  {selectedCountry.name}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={MUTED} />
                </Pressable>
              </View>

              {/* University Selector */}
              <View style={s.field}>
                <Text style={[s.label, { color: MUTED }]}>University ({selectedCountry.name})</Text>
                <Pressable
                  style={[s.uniBtn, { backgroundColor: INPUT, borderColor: BORDER }]}
                  onPress={() => setShowUniPicker(true)}>
                  <Text style={[s.uniBtnTxt, { color: university ? TEXT : PH }]} numberOfLines={1}>
                    {university || `Select university in ${selectedCountry.name}`}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={MUTED} />
                </Pressable>
              </View>

              {/* Student ID */}
              <View style={s.field}>
                <Text style={[s.label, { color: MUTED }]}>Student ID / Matric No.</Text>
                <TextInput
                  style={[s.input, { backgroundColor: INPUT, borderColor: BORDER, color: TEXT }]}
                  placeholder="e.g. CMU/2024/CS/0189"
                  placeholderTextColor={PH}
                  value={studentId}
                  onChangeText={setStudentId}
                  autoCapitalize="characters"
                />
              </View>

              {/* Submit CTA */}
              <Pressable
                style={({ pressed }: { pressed: boolean }) => [s.btn, { backgroundColor: GREEN, opacity: loading ? 0.8 : pressed ? 0.85 : 1 }]}
                onPress={handleSignup}
                disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnTxt}>Create Account</Text>}
              </Pressable>
            </View>

            {/* Footer link */}
            <View style={s.footer}>
              <Text style={[s.footerTxt, { color: MUTED }]}>Already have an account? </Text>
              <Pressable onPress={() => router.replace('/(auth)/login')}>
                <Text style={[s.footerLink, { color: TEXT }]}>Sign in</Text>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  kbav: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, gap: 18, justifyContent: 'center' },

  backBtn: { width: 36, height: 36, justifyContent: 'center' },

  head: { gap: 6 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  sub:   { fontSize: 14, lineHeight: 20 },

  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 20, gap: 14 },
  errBox: { padding: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  errTxt: { fontSize: 13, fontWeight: '500' },

  field: { gap: 5 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },

  input: { height: 50, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 15 },
  inputRow: { height: 50, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  inputFlex: { flex: 1, fontSize: 15 },
  eyeBtn: { paddingLeft: 10 },

  uniBtn: { height: 50, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  uniBtnTxt: { fontSize: 15, flex: 1 },

  btn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  btnTxt: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerTxt: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },

  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalDone: { fontSize: 15, fontWeight: '600' },
  modalSearch: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, paddingHorizontal: 12, height: 44, borderRadius: 10, borderWidth: 1 },
  modalSearchInput: { flex: 1, fontSize: 15 },
  modalList: { paddingBottom: 40 },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalItemTxt: { fontSize: 15, flex: 1 },
});
