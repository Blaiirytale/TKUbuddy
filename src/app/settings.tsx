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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout } from '../api/client';
import Avatar from '../components/Avatar';
import { ThemeColors, THEMES } from '../constants/colors';
import { useProfile } from '../context/ProfileContext';
import { FONT_SIZES, FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';

type IconName = ComponentProps<typeof Ionicons>['name'];

const MAX_NAME_LENGTH = 30;

const LANGUAGE_LABELS = { en: 'English', zh: '中文' };

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { displayName, setDisplayName, photoUri, setPhotoUri, language, setLanguage, student } =
    useProfile();
  const { colors, theme, setThemeId, fontSizeId, setFontSizeId } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // the name pop-up: whether it's open, and the text being typed
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  // the background (theme) picker: whether it's open
  const [choosingTheme, setChoosingTheme] = useState(false);

  // ---------- DISPLAY NAME ----------
  function openNameEditor() {
    setNameDraft(displayName);
    setEditingName(true);
  }

  function closeNameEditor() {
    setEditingName(false);
  }

  function saveName() {
    const trimmed = nameDraft.trim();
    // an empty name goes back to the registered name
    setDisplayName(trimmed || student?.name_zh || '');
    setEditingName(false);
  }

  // ---------- PROFILE PICTURE ----------
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
        onPress: async () => {
          try {
            await logout();
            if (router.canDismiss()) router.dismissAll();
            router.replace('/login');
          } catch (error) {
            Alert.alert('Error', 'Could not log out. Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.white} />
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
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </Pressable>

            <Pressable onPress={openNameEditor} style={styles.nameRow} hitSlop={8}>
              <Text style={styles.name}>{displayName}</Text>
              <Ionicons name="pencil" size={16} color={colors.muted} />
            </Pressable>
            <Text style={styles.studentId}>{student?.student_id ?? ''}</Text>

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
            <SettingsRow
              icon="color-palette-outline"
              label="Background"
              value={theme.name}
              onPress={() => setChoosingTheme(true)}
            />
            <View style={styles.divider} />

            {/* FONT SIZE: three buttons side by side */}
            <View style={styles.fontBlock}>
              <View style={styles.fontHeader}>
                <View style={styles.rowIcon}>
                  <Ionicons name="text-outline" size={20} color={colors.white} />
                </View>
                <Text style={styles.rowLabel}>Font size</Text>
              </View>

              <View style={styles.segment}>
                {FONT_SIZES.map((option) => {
                  const active = option.id === fontSizeId;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setFontSizeId(option.id)}
                      style={[styles.segmentItem, active && styles.segmentItemActive]}
                    >
                      {/* each "Aa" is drawn at its own size, as a preview */}
                      <Text
                        style={[
                          styles.segmentLetters,
                          { fontSize: Math.round(18 * option.scale) },
                          active && styles.segmentTextActive,
                        ]}
                      >
                        Aa
                      </Text>
                      <Text style={[styles.segmentLabel, active && styles.segmentTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fontPreview}>This is how text looks in TKUBuddy.</Text>
            </View>
          </View>

          {/* LOG OUT */}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.white} />
            <Text style={styles.logoutText}>LOG OUT</Text>
          </Pressable>

          <Text style={styles.version}>TKUBuddy v1.0 (prototype)</Text>
        </ScrollView>
      </SafeAreaView>

      {/* BACKGROUND (THEME) PICKER: slides up from the bottom */}
      <Modal
        visible={choosingTheme}
        transparent
        animationType="slide"
        onRequestClose={() => setChoosingTheme(false)}
      >
        <View style={styles.backdropBottom}>
          {/* tapping the dark area closes the picker */}
          <Pressable style={styles.flex} onPress={() => setChoosingTheme(false)} />

          <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Background</Text>
            <Text style={styles.modalHint}>Pick a color combination. It changes the whole app.</Text>

            <View style={styles.themeGrid}>
              {THEMES.map((t) => {
                const active = t.id === theme.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setThemeId(t.id)}
                    style={[styles.themeOption, active && styles.themeOptionActive]}
                  >
                    {/* a tiny preview drawn in that theme's own colors */}
                    <View style={[styles.themePreview, { backgroundColor: t.colors.background }]}>
                      <View style={[styles.previewCard, { backgroundColor: t.colors.card }]}>
                        <View style={styles.previewTrack}>
                          <View style={[styles.previewFill, { backgroundColor: t.colors.coral }]} />
                        </View>
                        <View style={styles.previewDots}>
                          <View style={[styles.previewDot, { backgroundColor: t.colors.coral }]} />
                          <View style={[styles.previewDot, { backgroundColor: t.colors.teal }]} />
                          <View style={[styles.previewDot, { backgroundColor: t.colors.gold }]} />
                        </View>
                      </View>
                      {active && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={14} color={colors.white} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.themeName}>{t.name}</Text>
                    <Text style={styles.themeDescription} numberOfLines={1}>
                      {t.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setChoosingTheme(false)}
              style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
            >
              <Text style={styles.doneText}>DONE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* DISPLAY NAME POP-UP */}
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
              placeholder={student?.name_zh ?? 'Display name'}
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
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveName}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.saveButton,
                  pressed && styles.pressed,
                ]}
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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

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
        <Ionicons name={icon} size={20} color={colors.white} />
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

      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

// styles are built from the current theme colors and font size
const makeStyles = (colors: ThemeColors, fs: FontScaler) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { color: colors.white, fontSize: fs(22), fontWeight: 'bold' },
  content: { padding: 24, paddingTop: 8, paddingBottom: 48 },

  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
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
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  name: { color: colors.white, fontSize: fs(22), fontWeight: 'bold' },
  studentId: { color: colors.muted, fontSize: fs(14), marginTop: 2, marginBottom: 12 },
  link: { color: colors.link, fontSize: fs(14), textDecorationLine: 'underline' },
  removeLink: { color: colors.coral, fontSize: fs(13), marginTop: 8 },

  sectionTitle: {
    color: colors.white,
    fontSize: fs(13),
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { backgroundColor: colors.card, borderRadius: 16, marginBottom: 24, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.cardLight, marginLeft: 60 },

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
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, color: colors.white, fontSize: fs(16) },
  rowValue: { color: colors.muted, fontSize: fs(14), maxWidth: 130 },
  soonBadge: {
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soonText: { color: colors.gold, fontSize: fs(10), fontWeight: 'bold' },
  dimmed: { opacity: 0.6 },
  pressed: { opacity: 0.7 },

  // font size
  fontBlock: { paddingVertical: 14, paddingHorizontal: 16 },
  fontHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  segment: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.cardLight,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 58,
    paddingBottom: 6,
    borderRadius: 10,
  },
  segmentItemActive: { backgroundColor: colors.coral },
  segmentLetters: { color: colors.white, fontWeight: 'bold' },
  segmentLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  segmentTextActive: { color: colors.white },
  fontPreview: { color: colors.muted, fontSize: fs(14), marginTop: 12, textAlign: 'center' },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.coral,
    marginTop: 8,
  },
  logoutText: { color: colors.white, fontSize: fs(16), fontWeight: 'bold', letterSpacing: 1 },
  version: {
    color: colors.white,
    opacity: 0.6,
    fontSize: fs(12),
    textAlign: 'center',
    marginTop: 20,
  },

  // background picker (bottom sheet)
  backdropBottom: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.cardLight,
    marginBottom: 14,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  themeOption: {
    width: '48%',
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: { borderColor: colors.white },
  themePreview: {
    height: 74,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'flex-end',
  },
  previewCard: { borderRadius: 8, padding: 8 },
  previewTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  previewFill: { width: '70%', height: '100%', borderRadius: 4 },
  previewDots: { flexDirection: 'row', gap: 5, marginTop: 6 },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: { color: colors.white, fontSize: fs(14), fontWeight: 'bold', marginTop: 8 },
  themeDescription: { color: colors.muted, fontSize: fs(11), marginTop: 1 },
  doneButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  doneText: { color: colors.white, fontSize: fs(15), fontWeight: 'bold', letterSpacing: 1 },

  // display name pop-up
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 24 },
  modalTitle: { color: colors.white, fontSize: fs(20), fontWeight: 'bold' },
  modalHint: { color: colors.muted, fontSize: fs(13), marginTop: 4, marginBottom: 16 },
  modalInput: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    fontSize: fs(16),
    color: '#222222',
  },
  counter: {
    alignSelf: 'flex-end',
    color: colors.muted,
    fontSize: fs(12),
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
  cancelButton: { backgroundColor: colors.cardLight },
  saveButton: { backgroundColor: colors.coral },
  modalButtonText: { color: colors.white, fontSize: fs(15), fontWeight: 'bold' },
});
