import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppLogo } from '@/components/ui/app-logo';
import { Ionicons } from '@/components/ui/icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  icon: 'flash' | 'school' | 'shield-checkmark';
  highlight: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    step: '01 / INSTANT PAYMENTS',
    title: 'Pay African Tuition\nwith Bitcoin & Lightning',
    subtitle: 'Settle university fees instantly from anywhere in the world with real-time Lightning Network settlements and zero wire delays.',
    icon: 'flash',
    highlight: 'Lightning⚡ Fast',
  },
  {
    id: '2',
    step: '02 / KIGALI & AFRICA',
    title: 'Integrated with Top\nAfrican Universities',
    subtitle: 'Direct fee payment support for Kigali institutions (CMU Africa, UR, ALU, AUCA, ULK) and top universities across Kenya, Nigeria & Ghana.',
    icon: 'school',
    highlight: 'Accredited Institutions',
  },
  {
    id: '3',
    step: '03 / SECURE RECEIPTS',
    title: 'Locked Rates &\nVerifiable Proof',
    subtitle: 'Lock real-time exchange rates before confirming and generate instant official PDF payment receipts for your bursar\'s office.',
    icon: 'shield-checkmark',
    highlight: 'Official Verification',
  },
];

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const handleScroll = (e: any) => {
    const slideSize = e?.nativeEvent?.layoutMeasurement?.width || (SCREEN_WIDTH - 48);
    const offset = e?.nativeEvent?.contentOffset?.x || 0;
    const index = Math.round(offset / slideSize);
    if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      router.push('/(auth)/signup');
    }
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070C07" />
      <SafeAreaView style={s.safe}>

        {/* Top Bar */}
        <View style={s.topBar}>
          <View style={s.brand}>
            <AppLogo size={34} bg="#1B7F3B" color="#FFFFFF" />
            <Text style={s.brandName}>BitComut</Text>
          </View>

          <Pressable style={s.skipBtn} onPress={() => router.push('/(auth)/signup')}>
            <Text style={s.skipTxt}>Skip</Text>
          </Pressable>
        </View>

        {/* Slide Progress Bar Indicators */}
        <View style={s.progressRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                s.progressBar,
                i === activeIndex ? s.progressBarActive : s.progressBarInactive,
              ]}
            />
          ))}
        </View>

        {/* Carousel List */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item: Slide) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }: { item: Slide }) => (
            <View style={s.slide}>
              {/* Graphic Card */}
              <View style={s.graphicCard}>
                <View style={s.iconWrapper}>
                  <Ionicons name={item.icon} size={36} color="#1B7F3B" />
                </View>
                <View style={s.pill}>
                  <Text style={s.pillTxt}>{item.highlight}</Text>
                </View>
              </View>

              {/* Text Info */}
              <View style={s.textBlock}>
                <Text style={s.stepTag}>{item.step}</Text>
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.subtitle}>{item.subtitle}</Text>
              </View>
            </View>
          )}
        />

        {/* Bottom Actions */}
        <View style={s.bottom}>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [s.primaryBtn, pressed && { opacity: 0.85 }]}
            onPress={handleNext}>
            <Text style={s.primaryBtnTxt}>
              {activeIndex === SLIDES.length - 1 ? 'Create Account' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>

          <View style={s.loginRow}>
            <Text style={s.loginSub}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={s.loginLink}>Log in</Text>
            </Pressable>
          </View>
        </View>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C07',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#131A13',
  },
  skipTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4E644E',
  },

  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#1B7F3B',
  },
  progressBarInactive: {
    backgroundColor: '#1C271C',
  },

  slide: {
    width: SCREEN_WIDTH - 48,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  graphicCard: {
    height: 240,
    borderRadius: 24,
    backgroundColor: '#0E150E',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1C271C',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#131A13',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1C271C',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#131A13',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1C271C',
  },
  pillTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B7F3B',
    letterSpacing: 0.5,
  },

  textBlock: {
    gap: 10,
    marginTop: 20,
  },
  stepTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B7F3B',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8A9E8C',
    lineHeight: 22,
  },

  bottom: {
    gap: 16,
    marginTop: 10,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#1B7F3B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginSub: {
    fontSize: 14,
    color: '#4E644E',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
