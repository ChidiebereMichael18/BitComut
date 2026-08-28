import { Ionicons } from '@/components/ui/icon';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
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

import { COUNTRIES, Country } from '@/constants/universities';
import { usePayment } from '@/context/payment-context';

const FEE_TYPES = [
  { label: '2024/25 Tuition Fees', amount: 350000 },
  { label: 'Accommodation Levy', amount: 65000 },
  { label: 'Faculty Development Fee', amount: 25000 },
  { label: 'Library & Tech Levy', amount: 12500 },
];

export default function PayScreen() {
  const { setPaymentDetails, btcRate } = usePayment();

  const BG     = '#FFFFFF';
  const SURF   = '#F8FAF8';
  const CARD   = '#F0F4F0';
  const BORDER = '#E5E8E5';
  const TEXT   = '#1A2E1A';
  const MUTED  = '#6B7A6B';
  const INPUT  = '#F8FAF8';
  const GREEN  = '#386635';
  const BTC    = '#F59E0B';
  const PH     = '#99A899';

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Default to Rwanda (Kigali)
  const [university, setUniversity] = useState('');
  const [studentId, setStudentId] = useState('');
  const [selectedFee, setSelectedFee] = useState<typeof FEE_TYPES[0] | null>(null);

  const [countryModal, setCountryModal] = useState(false);
  const [uniModal, setUniModal] = useState(false);
  const [uniSearch, setUniSearch] = useState('');

  const filteredUnis = selectedCountry.universities.filter((u) =>
    u.toLowerCase().includes(uniSearch.toLowerCase()),
  );

  const btcEquiv = selectedFee ? (selectedFee.amount / btcRate).toFixed(6) : '—';

  const canProceed1 = !!university;
  const canProceed2 = !!selectedFee && studentId.trim().length > 0;

  const handlePay = () => {
    if (!selectedFee || !university) return;
    setPaymentDetails(university, studentId, selectedFee.amount, 'NGN');
    router.push('/(payment)/method');
  };

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Country Modal */}
      <Modal visible={countryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCountryModal(false)}>
        <View style={[s.modal, { backgroundColor: SURF }]}>
          <View style={[s.modalHeader, { borderBottomColor: BORDER }]}>
            <Text style={[s.modalTitle, { color: TEXT }]}>Select Country</Text>
            <Pressable onPress={() => setCountryModal(false)}>
              <Text style={[s.modalDone, { color: GREEN }]}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.modalList}>
            {COUNTRIES.map((c) => (
              <Pressable
                key={c.id}
                style={[
                  s.modalItem,
                  { borderBottomColor: BORDER },
                  selectedCountry.id === c.id && { backgroundColor: CARD },
                ]}
                onPress={() => {
                  setSelectedCountry(c);
                  setUniversity(''); // Reset selected university on country change
                  setCountryModal(false);
                }}>
                <Text style={[s.modalItemTxt, { color: TEXT }]}>{c.flag}  {c.name}</Text>
                {selectedCountry.id === c.id && <Ionicons name="checkmark" size={18} color={GREEN} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* University Modal */}
      <Modal visible={uniModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setUniModal(false)}>
        <View style={[s.modal, { backgroundColor: SURF }]}>
          <View style={[s.modalHeader, { borderBottomColor: BORDER }]}>
            <Text style={[s.modalTitle, { color: TEXT }]}>Select University ({selectedCountry.name})</Text>
            <Pressable onPress={() => setUniModal(false)}>
              <Text style={[s.modalDone, { color: GREEN }]}>Done</Text>
            </Pressable>
          </View>
          <View style={[s.modalSearch, { backgroundColor: INPUT, borderColor: BORDER }]}>
            <Ionicons name="search-outline" size={16} color={MUTED} />
            <TextInput
              style={[s.modalSearchInput, { color: TEXT }]}
              placeholder={`Search ${selectedCountry.name}...`}
              placeholderTextColor={PH}
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
                  { borderBottomColor: BORDER },
                  university === u && { backgroundColor: CARD },
                ]}
                onPress={() => { setUniversity(u); setUniSearch(''); setUniModal(false); }}>
                <Text style={[s.modalItemTxt, { color: TEXT }]}>{u}</Text>
                {university === u && <Ionicons name="checkmark" size={18} color={GREEN} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: BORDER }]}>
          <Pressable
            style={s.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)'))}>
            <Ionicons name="arrow-back" size={22} color={TEXT} />
          </Pressable>
          <Text style={[s.headerTitle, { color: TEXT }]}>Pay Tuition & Fees</Text>
          <Text style={[s.headerStep, { color: MUTED }]}>Step {step} of 2</Text>
        </View>

        {/* Progress bar */}
        <View style={[s.progressTrack, { backgroundColor: CARD }]}>
          <View style={[s.progressFill, { backgroundColor: GREEN, width: step === 1 ? '50%' : '100%' }]} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 1 ? (
            /* ── STEP 1: Country & University ── */
            <>
              <Text style={[s.stepLabel, { color: TEXT }]}>Select Country & University</Text>
              <Text style={[s.stepSub, { color: MUTED }]}>
                Pick the country first to load its accredited higher education institutions.
              </Text>

              {/* Country selector */}
              <View style={s.field}>
                <Text style={[s.fieldLabel, { color: MUTED }]}>Country</Text>
                <Pressable
                  style={[s.selectorBtn, { backgroundColor: SURF, borderColor: BORDER }]}
                  onPress={() => setCountryModal(true)}>
                  <Text style={[s.selectorTxt, { color: TEXT }]}>
                    {selectedCountry.flag}  {selectedCountry.name}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={MUTED} />
                </Pressable>
              </View>

              {/* University Selector */}
              <View style={s.field}>
                <Text style={[s.fieldLabel, { color: MUTED }]}>University ({selectedCountry.name})</Text>
                <Pressable
                  style={[
                    s.selectorBtn,
                    { backgroundColor: SURF, borderColor: university ? GREEN : BORDER },
                  ]}
                  onPress={() => setUniModal(true)}>
                  <Ionicons name="school-outline" size={20} color={university ? GREEN : MUTED} />
                  <Text style={[s.selectorTxt, { color: university ? TEXT : PH }]} numberOfLines={1}>
                    {university || `Select university in ${selectedCountry.name}`}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={MUTED} />
                </Pressable>
              </View>

              {/* Quick list for selected country */}
              <Text style={[s.orLabel, { color: MUTED }]}>Universities in {selectedCountry.name}</Text>
              <View style={[s.quickList, { backgroundColor: SURF, borderColor: BORDER }]}>
                {selectedCountry.universities.map((u, i) => (
                  <Pressable
                    key={u}
                    style={[
                      s.quickItem,
                      { borderBottomColor: BORDER },
                      i === selectedCountry.universities.length - 1 && s.quickItemLast,
                      university === u && { backgroundColor: CARD },
                    ]}
                    onPress={() => setUniversity(u)}>
                    <Text style={[s.quickItemTxt, { color: TEXT }]}>{u}</Text>
                    {university === u
                      ? <Ionicons name="checkmark-circle" size={18} color={GREEN} />
                      : <Ionicons name="ellipse-outline" size={18} color={MUTED} />
                    }
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[s.btn, { backgroundColor: canProceed1 ? GREEN : CARD, opacity: canProceed1 ? 1 : 0.5 }]}
                onPress={() => canProceed1 && setStep(2)}
                disabled={!canProceed1}>
                <Text style={[s.btnTxt, { color: canProceed1 ? '#FFF' : MUTED }]}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={canProceed1 ? '#FFF' : MUTED} />
              </Pressable>
            </>
          ) : (
            /* ── STEP 2: Details + Fee ── */
            <>
              <Pressable style={s.backRow} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={18} color={MUTED} />
                <Text style={[s.backTxt, { color: MUTED }]}>Change university</Text>
              </Pressable>

              {/* Selected university chip */}
              <View style={[s.selectedChip, { backgroundColor: SURF, borderColor: BORDER }]}>
                <Ionicons name="school" size={18} color={GREEN} />
                <Text style={[s.selectedChipTxt, { color: TEXT }]} numberOfLines={1}>{university}</Text>
              </View>

              {/* Student ID */}
              <View style={s.field}>
                <Text style={[s.fieldLabel, { color: MUTED }]}>Student ID / Matric No.</Text>
                <TextInput
                  style={[s.input, { backgroundColor: INPUT, borderColor: BORDER, color: TEXT }]}
                  placeholder="e.g. CMU/2024/CS/0189"
                  placeholderTextColor={PH}
                  value={studentId}
                  onChangeText={setStudentId}
                  autoCapitalize="characters"
                />
              </View>

              {/* Fee type */}
              <View style={s.field}>
                <Text style={[s.fieldLabel, { color: MUTED }]}>Select fee type</Text>
                <View style={[s.feeList, { backgroundColor: SURF, borderColor: BORDER }]}>
                  {FEE_TYPES.map((fee, i) => {
                    const selected = selectedFee?.label === fee.label;
                    return (
                      <Pressable
                        key={fee.label}
                        style={[
                          s.feeItem,
                          { borderBottomColor: BORDER },
                          i === FEE_TYPES.length - 1 && s.feeItemLast,
                          selected && { backgroundColor: CARD },
                        ]}
                        onPress={() => setSelectedFee(fee)}>
                        <View style={s.feeItemLeft}>
                          <Text style={[s.feeItemLabel, { color: TEXT }]}>{fee.label}</Text>
                          <Text style={[s.feeItemAmt, { color: MUTED }]}>₦{fee.amount.toLocaleString()}</Text>
                        </View>
                        {selected
                          ? <Ionicons name="checkmark-circle" size={20} color={GREEN} />
                          : <Ionicons name="ellipse-outline" size={20} color={MUTED} />
                        }
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Summary */}
              {selectedFee && (
                <View style={[s.summary, { backgroundColor: SURF, borderColor: BORDER }]}>
                  <Row label="You pay" value={`₦${selectedFee.amount.toLocaleString()}`} TEXT={TEXT} MUTED={MUTED} bold />
                  <View style={[s.summaryDivider, { backgroundColor: BORDER }]} />
                  <Row label="BTC equivalent" value={`${btcEquiv} BTC`} TEXT={BTC} MUTED={MUTED} />
                </View>
              )}

              <Pressable
                style={[s.btn, { backgroundColor: canProceed2 ? GREEN : CARD, opacity: canProceed2 ? 1 : 0.5 }]}
                onPress={handlePay}
                disabled={!canProceed2}>
                <Text style={[s.btnTxt, { color: canProceed2 ? '#FFF' : MUTED }]}>Choose Payment Method</Text>
                <Ionicons name="arrow-forward" size={18} color={canProceed2 ? '#FFF' : MUTED} />
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Row({ label, value, TEXT, MUTED, bold }: any) {
  return (
    <View style={s.summaryRow}>
      <Text style={[s.summaryLabel, { color: MUTED }]}>{label}</Text>
      <Text style={[s.summaryValue, { color: TEXT, fontWeight: bold ? '700' : '500' }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6F4', marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  headerStep: { fontSize: 13 },

  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden', marginHorizontal: 20 },
  progressFill: { height: '100%', borderRadius: 2 },

  stepLabel: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  stepSub: { fontSize: 14, lineHeight: 20, marginTop: -4 },

  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },

  selectorBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  selectorTxt: { flex: 1, fontSize: 15 },

  orLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginTop: 4 },

  quickList: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  quickItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  quickItemLast: { borderBottomWidth: 0 },
  quickItemTxt: { fontSize: 14, flex: 1 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backTxt: { fontSize: 14 },

  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  selectedChipTxt: { fontSize: 14, fontWeight: '600', flex: 1 },

  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },

  feeList: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  feeItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  feeItemLast: { borderBottomWidth: 0 },
  feeItemLeft: { flex: 1, gap: 2 },
  feeItemLabel: { fontSize: 14, fontWeight: '600' },
  feeItemAmt: { fontSize: 13 },

  summary: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 15 },
  summaryDivider: { height: StyleSheet.hairlineWidth },

  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 14, marginTop: 4 },
  btnTxt: { fontSize: 16, fontWeight: '700' },

  // Modal
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
