import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Mail, ChevronRight } from 'lucide-react-native';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import { supabase, localSignOutHard } from '../../lib/supabase';
import { LANGUAGES_WITH_FLAGS } from '../../lib/languages';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_BASE_URL } from '../../lib/appConfig';
import NotificationService, { ReminderFrequency } from '../../services/NotificationService';

export default function SettingsScreen() {
  const router = useRouter();
  const themeName = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const isLight = themeName === 'light';
  const { user, setUser } = useAppStore();
  const colors = getTheme(themeName);

  // Language selection state (reuse options from Profile)
  const [showLang, setShowLang] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  // Use centralized catalog (>=150 languages)
  const langs = useMemo(() => LANGUAGES_WITH_FLAGS, []);
  const filteredLangs = useMemo(() => langs.filter(l => `${l.name} ${l.code}`.toLowerCase().includes(langSearch.toLowerCase())), [langs, langSearch]);

  const userLangs = useAppStore(s => s.languagePreferences);

  // Reminders settings
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyFreq, setNotifyFreq] = useState<ReminderFrequency>(1);
  const [startH, setStartH] = useState<number>(10);
  const [endH, setEndH] = useState<number>(22);
  useEffect(() => {
    (async () => {
      const s = await NotificationService.getSettings();
      setNotifyEnabled(s.enabled);
      setNotifyFreq(s.freq);
      if (s.startH != null) setStartH(s.startH);
      if (s.endH != null) setEndH(s.endH);
    })();
  }, []);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and erase data on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                if (token && BACKEND_BASE_URL) {
                  const resp = await fetch(`${BACKEND_BASE_URL.replace(/\/$/, '')}/api/delete-account`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                  if (!resp.ok) console.warn('[Delete] backend returned', resp.status);
                }
              } catch {}
              await localSignOutHard();
              await AsyncStorage.clear();
            } catch {}
            setUser(null);
            Alert.alert('Account Deleted', 'Your account and data have been removed.');
            try { router.replace('/'); } catch {}
          }
        }
      ]
    );
  };

  const formatDate = (date?: Date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';

  return (
    <SafeAreaView style={[styles.container, isLight && { backgroundColor: colors.background }] }>
      <View style={[styles.header, isLight && styles.headerLight]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={isLight ? '#111827' : '#fff'} />
        </TouchableOpacity>
        <Text style={[styles.title, isLight && styles.titleLight]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enable Notifications button only */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={async () => {
            const next = !notifyEnabled;
            setNotifyEnabled(next);
            await NotificationService.enable(next);
            if (next) {
              const s = await NotificationService.getSettings();
              await NotificationService.scheduleWindow(s.freq, s.startH || 10, s.endH || 22);
              // Open the OS settings to let the user allow notifications
              try { await NotificationService.openSystemNotificationSettings(); } catch {}
            }
          }}
          style={[styles.enableBanner, isLight && styles.enableBannerLight]}
        >
          <Text style={[styles.enableBannerText, isLight && styles.enableBannerTextLight]}>
            {notifyEnabled ? 'Disable Notifications' : 'Enable Notifications'}
          </Text>
        </TouchableOpacity>

        {/* Window controls */}
        <View style={[styles.windowCard, isLight && styles.windowCardLight]}>
          <Text style={[styles.windowTitle, isLight && styles.windowTitleLight]}>Reminders for the Journal words</Text>
          {/* How many */}
          <View style={styles.windowRow}>
            <Text style={[styles.windowLabel, isLight && styles.windowLabelLight]}>How many?</Text>
            <View style={styles.windowControls}>
              <TouchableOpacity style={[styles.circleBtn, isLight && styles.circleBtnLight]} onPress={async () => {
                const n = Math.max(1, (notifyFreq as number) - 1) as ReminderFrequency;
                setNotifyFreq(n);
                await NotificationService.setSettings({ freq: n });
                if (notifyEnabled) await NotificationService.scheduleWindow(n, startH, endH);
              }}>
                <Text style={[styles.circleText, isLight && styles.circleTextLight]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.windowValue, isLight && styles.windowValueLight]}>{notifyFreq}</Text>
              <TouchableOpacity style={[styles.circleBtn, isLight && styles.circleBtnLight]} onPress={async () => {
                const n = Math.min(5, (notifyFreq as number) + 1) as ReminderFrequency;
                setNotifyFreq(n);
                await NotificationService.setSettings({ freq: n });
                if (notifyEnabled) await NotificationService.scheduleWindow(n, startH, endH);
              }}>
                <Text style={[styles.circleText, isLight && styles.circleTextLight]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Starts */}
          <View style={styles.windowRow}>
            <Text style={[styles.windowLabel, isLight && styles.windowLabelLight]}>Starts at</Text>
            <View style={styles.windowControls}>
              <TouchableOpacity style={[styles.circleBtn, isLight && styles.circleBtnLight]} onPress={async () => {
                const h = Math.max(0, startH - 1);
                setStartH(h);
                await NotificationService.setSettings({ startH: h });
                if (notifyEnabled) await NotificationService.scheduleWindow(notifyFreq, h, endH);
              }}>
                <Text style={[styles.circleText, isLight && styles.circleTextLight]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.windowValue, isLight && styles.windowValueLight]}>{String(startH).padStart(2,'0')}:00</Text>
              <TouchableOpacity style={[styles.circleBtn, isLight && styles.circleBtnLight]} onPress={async () => {
                const h = Math.min(23, startH + 1);
                setStartH(h);
                await NotificationService.setSettings({ startH: h });
                if (notifyEnabled) await NotificationService.scheduleWindow(notifyFreq, h, endH);
              }}>
                <Text style={[styles.circleText, isLight && styles.circleTextLight]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ends */}
          <View style={styles.windowRow}>
            <Text style={[styles.windowLabel, isLight && styles.windowLabelLight]}>Ends at</Text>
            <View style={styles.windowControls}>
              <TouchableOpacity style={[styles.circleBtn, isLight && styles.circleBtnLight]} onPress={async () => {
                const h = Math.max(0, endH - 1);
                setEndH(h);
                await NotificationService.setSettings({ endH: h });
                if (notifyEnabled) await NotificationService.scheduleWindow(notifyFreq, startH, h);
              }}>
                <Text style={[styles.circleText, isLight && styles.circleTextLight]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.windowValue, isLight && styles.windowValueLight]}>{String(endH).padStart(2,'0')}:00</Text>
              <TouchableOpacity style={[styles.circleBtn, isLight && styles.circleBtnLight]} onPress={async () => {
                const h = Math.min(23, endH + 1);
                setEndH(h);
                await NotificationService.setSettings({ endH: h });
                if (notifyEnabled) await NotificationService.scheduleWindow(notifyFreq, startH, h);
              }}>
                <Text style={[styles.circleText, isLight && styles.circleTextLight]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Theme */}
        <View style={[styles.card, isLight && styles.cardLight]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.label, isLight && styles.labelLight]}>Theme</Text>
            <TouchableOpacity
              onPress={async () => {
                const newTheme = themeName === 'dark' ? 'light' : 'dark';
                // Save directly to AsyncStorage
                try {
                  await AsyncStorage.setItem('@engniter.theme', newTheme);
                  // Verify it was saved
                  const verify = await AsyncStorage.getItem('@engniter.theme');
                  Alert.alert('Theme Saved', `Saved: ${newTheme}\nVerified: ${verify}`);
                } catch (e: any) {
                  Alert.alert('Save Error', e?.message || 'Unknown error');
                }
                // Update store
                toggleTheme();
              }}
              style={[styles.toggle, isLight && styles.toggleLight, themeName === 'light' && styles.toggleActive]}
            >
              <Text style={[styles.toggleText, isLight && styles.toggleTextLight]}>{themeName === 'light' ? 'Light' : 'Dark'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Translations */}
        <View style={[styles.card, isLight && styles.cardLight]}>
          <Text style={[styles.label, isLight && styles.labelLight]}>Translations</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {userLangs.map(code => (
              <View key={code} style={[styles.chip, isLight ? styles.chipLight : styles.chipDark]}>
                <Text style={[styles.chipText, isLight && { color: '#111827' }]}>{code.toUpperCase()}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={() => setShowLang(true)} style={[styles.actionSmall, isLight && styles.actionSmallLight]}>
              <Text style={[styles.actionSmallText, isLight && { color: '#111827' }]}>Change</Text>
            </TouchableOpacity>
            {!!userLangs.length && (
              <TouchableOpacity onPress={async () => { await useAppStore.getState().setLanguagePreferences([]); }} style={[styles.actionSmall, isLight && styles.actionSmallLight]}>
                <Text style={[styles.actionSmallText, isLight && { color: '#111827' }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Account Info */}
        <View style={[styles.card, isLight && styles.cardLight]}>
          <View style={styles.infoRow}><Mail size={18} color={isLight ? '#6B7280' : '#8a8a8a'} /><Text style={[styles.infoKey, isLight && styles.infoKeyLight]}>Email</Text><Text style={[styles.infoVal, isLight && styles.infoValLight]}>{user?.email ?? 'Not provided'}</Text></View>
          <View style={styles.infoRow}><Calendar size={18} color={isLight ? '#6B7280' : '#8a8a8a'} /><Text style={[styles.infoKey, isLight && styles.infoKeyLight]}>Joined</Text><Text style={[styles.infoVal, isLight && styles.infoValLight]}>{formatDate(user?.createdAt)}</Text></View>
        </View>

        {/* Danger zone */}
        <View style={[styles.card, isLight && styles.cardLight]}>
          <Text style={[styles.label, isLight && styles.labelLight]}>Danger Zone</Text>
          <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language modal simple */}
      {showLang && (
        <View style={styles.modalOverlay}>
          <View style={[styles.langModal, isLight && styles.langModalLight]}>
            <Text style={[styles.modalTitle, isLight && styles.modalTitleLight]}>Choose Language</Text>
            <View style={[styles.searchBox, isLight && styles.searchBoxLight]}>
              <TextInput
                value={langSearch}
                onChangeText={setLangSearch}
                placeholder="Search e.g., Spanish, es"
                placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
                style={[styles.searchInputField, { color: isLight ? '#111827' : '#E5E7EB' }]}
                autoCorrect
                spellCheck
                autoCapitalize="none"
                autoComplete="off"

              />
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {filteredLangs.map(l => (
                <TouchableOpacity key={l.code} style={[styles.langRow, isLight ? styles.langRowLight : styles.langRowDark]} onPress={async () => { await useAppStore.getState().setLanguagePreferences([l.code]); setShowLang(false); }}>
                  <Text style={{ color: isLight ? '#111827' : '#E5E7EB' }}>{l.flag} {l.name} ({l.code.toUpperCase()})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowLang(false)} style={[styles.actionSmall, { alignSelf: 'flex-end', marginTop: 10, backgroundColor: '#F8B070' }]}>
              <Text style={[styles.actionSmallText]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121315' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerLight: { },
  backButton: { padding: 8 },
  title: { fontSize: 16, fontWeight: '800', color: '#E5E7EB' },
  titleLight: { color: '#111827' },
  content: { flex: 1, padding: 20 },
  enableBanner: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16 },
  enableBannerLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  enableBannerText: { color: '#E5E7EB', fontWeight: '800' },
  enableBannerTextLight: { color: '#111827' },
  windowCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12, marginBottom: 16 },
  windowCardLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  windowTitle: { color: '#E5E7EB', fontWeight: '800', marginBottom: 4 },
  windowTitleLight: { color: '#111827' },
  windowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)' },
  windowLabel: { color: '#E5E7EB', fontWeight: '600' },
  windowLabelLight: { color: '#111827' },
  windowControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  circleBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  circleBtnLight: { borderColor: '#9CA3AF' },
  circleText: { color: '#E5E7EB', fontSize: 18, fontWeight: '800' },
  circleTextLight: { color: '#374151' },
  windowValue: { color: '#E5E7EB', fontWeight: '800', minWidth: 54, textAlign: 'center' },
  windowValueLight: { color: '#111827' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardLight: { backgroundColor: '#FFFFFF' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#E5E7EB', fontWeight: '700', fontSize: 13 },
  labelLight: { color: '#111827' },
  toggle: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#2A3033', borderWidth: 1, borderColor: '#364147' },
  toggleLight: { backgroundColor: '#E9E6E0', borderColor: '#D7D3CB' },
  toggleActive: { backgroundColor: 'rgba(248,176,112,0.18)', borderColor: 'rgba(248,176,112,0.45)' },
  toggleText: { color: '#E5E7EB', fontWeight: '700' },
  toggleTextLight: { color: '#111827' },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#2A2F33' },
  chipLight: { backgroundColor: '#E9E6E0' },
  chipDark: { backgroundColor: '#2A2F33' },
  chipText: { color: '#FFFFFF', fontWeight: '700' },
  actionSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#2A2F33' },
  actionSmallLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5DED3' },
  actionSmallText: { color: '#FFFFFF', fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  infoKey: { color: '#9CA3AF', marginLeft: 10, fontSize: 12, width: 80 },
  infoKeyLight: { color: '#6B7280' },
  infoVal: { color: '#E5E7EB', flex: 1, textAlign: 'right' },
  infoValLight: { color: '#111827' },
  helper: { color: '#9CA3AF', marginTop: 2 },
  helperLight: { color: '#6B7280' },
  freqChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#2A2F33', borderWidth: 1, borderColor: '#364147' },
  freqChipLight: { backgroundColor: '#E9E6E0', borderColor: '#D7D3CB' },
  freqChipActive: { backgroundColor: 'rgba(248,176,112,0.18)', borderColor: 'rgba(248,176,112,0.45)' },
  freqChipText: { color: '#E5E7EB', fontWeight: '700' },
  deleteBtn: {
    marginTop: 10,
    backgroundColor: '#EF9797',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  deleteText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  langModal: { width: '86%', backgroundColor: '#2C2C2C', borderRadius: 16, padding: 14 },
  langModalLight: { backgroundColor: '#FFFFFF' },
  modalTitle: { color: '#E5E7EB', fontWeight: '800', marginBottom: 6 },
  modalTitleLight: { color: '#111827' },
  searchBox: { marginTop: 6, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#1F2629', borderWidth: 1, borderColor: '#2A3033', flexDirection: 'row', alignItems: 'center' },
  searchBoxLight: { backgroundColor: '#FFFFFF', borderColor: '#E5DED3' },
  searchInputField: { flex: 1, height: 36, fontSize: 14 },
  langRow: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginTop: 6 },
  langRowLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5DED3' },
  langRowDark: { backgroundColor: '#1F2629', borderWidth: 1, borderColor: '#2A3033' },
});
