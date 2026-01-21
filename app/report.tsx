import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, Platform, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Paperclip, Camera, Send } from 'lucide-react-native';

export default function ReportIssueScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('Issue report');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<{ uri: string } | null>(null);

  const ImagePicker = (() => { try { return require('react-native-image-picker'); } catch { return null; } })();

  const pickImage = async (from: 'camera' | 'library') => {
    if (!ImagePicker) {
      Alert.alert('Missing dependency', 'Install react-native-image-picker to add screenshots.');
      return;
    }
    try {
      const { launchCamera, launchImageLibrary } = ImagePicker as any;
      const fn = from === 'camera' ? launchCamera : launchImageLibrary;
      const res = await fn({ mediaType: 'photo', includeBase64: false });
      const uri = res?.assets?.[0]?.uri;
      if (uri) setAttachment({ uri });
    } catch (e) {
      console.warn('pick error', e);
    }
  };

  const send = async () => {
    const email = 'vocadoo.app@gmail.com';
    const full = `${message}\n\n— sent from Vocadoo`;
    if (attachment?.uri) {
      try {
        await Share.share({ message: `${subject}\n\n${full}`, url: attachment.uri });
        return;
      } catch (e) {
        console.warn('share failed', e);
      }
    }
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(full)}`;
    try {
      const { Linking } = require('react-native');
      await Linking.openURL(mailto);
    } catch (e) {
      Alert.alert('Unable to open email', 'Copy the email address and send manually: ' + email);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}><ArrowLeft size={22} color="#111827" /></TouchableOpacity>
        <Text style={styles.title}>Report an Issue</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.label}>Subject</Text>
        <TextInput value={subject} onChangeText={setSubject} style={styles.input} placeholder="Subject" placeholderTextColor="#6B7280" />

        <Text style={styles.label}>Message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          style={[styles.input, { height: 140, textAlignVertical: 'top' }]}
          multiline
          placeholder="Describe the problem. Steps to reproduce are very helpful."
          placeholderTextColor="#6B7280"
        />

        <View style={styles.row}>
          <TouchableOpacity style={styles.attachBtn} onPress={() => pickImage('library')}>
            <Paperclip size={18} color="#0D3B4A" />
            <Text style={styles.attachText}>Attach from library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.attachBtn, { marginLeft: 10 }]} onPress={() => pickImage('camera')}>
            <Camera size={18} color="#0D3B4A" />
            <Text style={styles.attachText}>Take a photo</Text>
          </TouchableOpacity>
        </View>

        {attachment?.uri && (
          <View style={{ marginTop: 12 }}>
            <Image source={{ uri: attachment.uri }} style={{ width: '100%', height: 200, borderRadius: 12 }} />
          </View>
        )}

        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Send size={18} color="#0D3B4A" />
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
  iconBtn: { padding: 6 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  label: { marginTop: 10, color: '#2D4A66', fontWeight: '700' },
  input: { marginTop: 6, backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8, color: '#111827' },
  row: { flexDirection: 'row', marginTop: 12 },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#B6E0E2', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  attachText: { color: '#0D3B4A', fontWeight: '700' },
  sendBtn: { alignSelf: 'flex-end', marginTop: 16, backgroundColor: '#B6E0E2', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  sendText: { color: '#0D3B4A', fontWeight: '800' },
});
