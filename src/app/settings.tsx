import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ComponentProps, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import { Colors } from '../constants/colors';
import { useProfile } from '../context/ProfileContext';

type IconName = ComponentProps<typeof Ionicons>['name'];


const REGISTERED_NAME = 'Pramesti';
const STUDENT_ID = '411000001';
const MAX_NAME_LENGTH = 30;

const LANGUAGE_LABELS = { en: 'English', zh: '中文' };

export default function SettingsScreen() {
  const router = useRouter();
  const { displayName, setDisplayName, photoUri, setPhotoUri, language, setLanguage } =
    useProfile();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  function openNameEditor() {
    setNameDraft(displayName); // start with the current name
    setEditingName(true);
  }

  function closeNameEditor() {
    setEditingName(false);
  }

  function saveName() {
    const trimmed = nameDraft.trim();

    setDisplayName(trimmed || REGISTERED_NAME);
    setEditingName(false);
  }

  
  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access in your phone settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access in your phone settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  function handleChangePhoto() {
    Alert.alert('Profile picture', 'Choose a new photo', [
      { text: 'Choose from library', onPress: pickFromLibrary },
      { text: 'Take a photo', onPress: takePhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  // ---------- LANGUAGE ----------
  function handleLanguage() {
    Alert.alert('Language', 'Choose the app language', [
      { text: 'English', onPress: () => setLanguage('en') },
      { text: '中文', onPress: () => setLanguage('zh') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  // ---------- LOG OUT ----------
  function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          // BACKEND TODO: clear the saved login token here.
          if (router.canDismiss()) router.dismissAll();
          router.replace('/login');
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* PROFILE CARD */}
          <View style={styles.profileCard}>
            <Pressable onPress={handleChangePhoto}>
              <Avatar size={96} />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color={Colors.white} />
              </View>
            </Pressable>

            {/* tap the name to edit it */}
            <Pressable onPress={openNameEditor} style={styles.nameRow} hitSlop={8}>
              <Text style={styles.name}>{displayName}</Text>
              <Ionicons name="pencil" size={16} color={Colors.muted} />
            </Pressable>
            <Text style={styles.studentId}>{STUDENT_ID}</Text>

            <Pressable onPress={handleChangePhoto} hitSlop={8}>
              <Text style={styles.link}>Change photo</Text>
            </Pressable>
            {photoUri ? (
              <Pressable onPress={() => setPhotoUri(null)} hitSlop={8}>
                <Text style={styles.removeLink}>Remove photo</Text>
              </Pressable>
            ) : null}
          </View>

          {/* GENERAL */}
          <Text style={styles.sectionTitle}>GENERAL</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="person-outline"
              label="Display name"
              value={displayName}
              onPress={openNameEditor}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="language-outline"
              label="Language"
              value={LANGUAGE_LABELS[language]}
              onPress={handleLanguage}
            />
            <View style={styles.divider} />
            <SettingsRow icon="notifications-outline" label="Notifications" comingSoon />
          </View>

          {/* DISPLAY */}
          <Text style={styles.sectionTitle}>DISPLAY</Text>
          <View style={styles.card}>
            <SettingsRow icon="color-palette-outline" label="Background" comingSoon />
            <View style={styles.divider} />
            <SettingsRow icon="text-outline" label="Font size" comingSoon />
          </View>

          {/* LOG OUT */}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.white} />
            <Text style={styles.logoutText}>LOG OUT</Text>
          </Pressable>

          <Text style={styles.version}>TKUBuddy v1.0 (prototype)</Text>
        </ScrollView>
      </SafeAreaView>

      {}
      <Modal
        visible={editingName}
        transparent
        animationType="fade"
        onRequestClose={closeNameEditor}
      >
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Display name</Text>
            <Text style={styles.modalHint}>This is how your name appears in TKUBuddy.</Text>

            <TextInput
              style={styles.modalInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder={REGISTERED_NAME}
              placeholderTextColor="#9A948D"
              maxLength={MAX_NAME_LENGTH}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <Text style={styles.counter}>
              {nameDraft.length}/{MAX_NAME_LENGTH}
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={closeNameEditor}
                style={({ pressed }) => [styles.modalButton, styles.cancelButton, pressed && styles.pressed]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveName}
                style={({ pressed }) => [styles.modalButton, styles.saveButton, pressed && styles.pressed]}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ---------- ONE ROW IN A SETTINGS CARD ----------
type RowProps = {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  comingSoon?: boolean;
};

function SettingsRow({ icon, label, value, onPress, comingSoon = false }: RowProps) {
  function handlePress() {
    if (comingSoon) {
      Alert.alert(label, 'This feature is coming soon!');
    } else {
      onPress?.();
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, comingSoon && styles.dimmed]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={Colors.white} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>

      {comingSoon ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>SOON</Text>
        </View>
      ) : value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  content: { padding: 24, paddingTop: 8, paddingBottom: 48 },

  profileCard: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.card,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  name: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  studentId: { color: Colors.muted, fontSize: 14, marginTop: 2, marginBottom: 12 },
  link: { color: Colors.link, fontSize: 14, textDecorationLine: 'underline' },
  removeLink: { color: Colors.coral, fontSize: 13, marginTop: 8 },

  sectionTitle: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: Colors.cardLight, marginLeft: 60 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, color: Colors.white, fontSize: 16 },
  rowValue: { color: Colors.muted, fontSize: 14, maxWidth: 130 },
  soonBadge: {
    backgroundColor: Colors.cardLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soonText: { color: Colors.gold, fontSize: 10, fontWeight: 'bold' },
  dimmed: { opacity: 0.6 },
  pressed: { opacity: 0.7 },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.coral,
    marginTop: 8,
  },
  logoutText: { color: Colors.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  version: { color: Colors.white, opacity: 0.6, fontSize: 12, textAlign: 'center', marginTop: 20 },

  // pop-up
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)', // dark see-through layer behind the pop-up
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
  modalHint: { color: Colors.muted, fontSize: 13, marginTop: 4, marginBottom: 16 },
  modalInput: {
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#222222',
  },
  counter: {
    alignSelf: 'flex-end',
    color: Colors.muted,
    fontSize: 12,
    marginTop: 6,
    marginRight: 8,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { backgroundColor: Colors.cardLight },
  saveButton: { backgroundColor: Colors.coral },
  modalButtonText: { color: Colors.white, fontSize: 15, fontWeight: 'bold' },
});
