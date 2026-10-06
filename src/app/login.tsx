import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

const APP_NAME = 'TKUBuddy';

export default function LoginScreen() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  //try animation
  const wiggle = useRef(new Animated.Value(0)).current;   // logo tilt left n right
  const logoScale = useRef(new Animated.Value(1)).current;
  const sheetY = useRef(new Animated.Value(400)).current; // 400px down

  // one animation value PER LETTER, all starting at 0 (resting position)
  const letterY = useRef(APP_NAME.split('').map(() => new Animated.Value(0))).current;

  const logoLoop = useRef<Animated.CompositeAnimation | null>(null);
  const lettersLoop = useRef<Animated.CompositeAnimation | null>(null);

  const rotate = wiggle.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  // logo: tilt right, left, right, back to the middle
  function wiggleOnce(duration: number) {
    return Animated.sequence([
      Animated.timing(wiggle, { toValue: 1, duration, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -1, duration: duration * 2, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 1, duration: duration * 2, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration, useNativeDriver: true }),
    ]);
  }

  // letters: each one jumps up, then bounces back down
  function bounceLetters() {
    return Animated.stagger(
      80, // start the next letter 80ms after the previous one
      letterY.map((y) =>
        Animated.sequence([
          Animated.timing(y, {
            toValue: -14, // move up 14px (negative = up)
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(y, {
            toValue: 0, // back down
            duration: 350,
            easing: Easing.bounce, // little bounce when it lands
            useNativeDriver: true,
          }),
        ])
      )
    );
  }

  useEffect(() => {
    // panel slides up when the screen opens
    Animated.timing(sheetY, {
      toValue: 0,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // logo wiggles every 2 seconds
    logoLoop.current = Animated.loop(
      Animated.sequence([wiggleOnce(120), Animated.delay(2000)])
    );
    logoLoop.current.start();

    // letters bounce one by one, rest 1.5 seconds, repeat
    lettersLoop.current = Animated.loop(
      Animated.sequence([bounceLetters(), Animated.delay(1500)])
    );
    lettersLoop.current.start();

    // stop everything when leaving the screen
    return () => {
      logoLoop.current?.stop();
      lettersLoop.current?.stop();
    };
  }, []);

  function handleLogin() {
    // BACKEND TODO: check the student ID and password here before continuing.

    logoLoop.current?.stop();
    lettersLoop.current?.stop();

    // logo wiggles + bounces and letters do one last wave, THEN go to the homepage
    Animated.parallel([
      wiggleOnce(80),
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
      bounceLetters(),
    ]).start(() => router.replace('/home'));
  }

  function handleForgotPassword() {
    Alert.alert(
      'Forgot password',
      'Please reset your password through the TKU student portal, or contact the IT center.'
    );
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* TOP: wiggling logo, welcome, bouncing letters */}
          <SafeAreaView edges={['top']} style={styles.hero}>
            <Animated.Image
              source={require('../../assets/app-images/tku_logo.png')}
              style={[styles.logo, { transform: [{ rotate }, { scale: logoScale }] }]}
            />
            <Text style={styles.welcome}>WELCOME TO</Text>

            {/* each letter is its own animated text, side by side */}
            <View style={styles.lettersRow}>
              {APP_NAME.split('').map((letter, i) => (
                <Animated.Text
                  key={i}
                  style={[styles.appName, { transform: [{ translateY: letterY[i] }] }]}
                >
                  {letter}
                </Animated.Text>
              ))}
            </View>
          </SafeAreaView>

          {/* BOTTOM: login panel that slides up */}
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
            <Text style={styles.title}>LOGIN</Text>

            <Text style={styles.label}>Student ID</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={studentId}
                onChangeText={setStudentId}
                keyboardType="number-pad"
                maxLength={9}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#6B655F"
                />
              </Pressable>
            </View>

            <Pressable onPress={handleForgotPassword} style={styles.forgot} hitSlop={8}>
              <Text style={styles.link}>Forgot Password?</Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
              <Text style={styles.buttonText}>LOG IN</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 48,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  welcome: { color: Colors.white, fontSize: 20, letterSpacing: 1 },
  lettersRow: {
    flexDirection: 'row', // letters side by side, like a normal word
    marginTop: 8,
  },
  appName: { color: Colors.white, fontSize: 22 },
  sheet: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.sheet,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 48,
  },
  title: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  label: {
    alignSelf: 'flex-start',
    color: Colors.white,
    fontSize: 14,
    marginBottom: 6,
    marginLeft: 14,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    paddingHorizontal: 18,
    marginBottom: 18,
    borderRadius: 24,
    backgroundColor: Colors.white,
  },
  input: { flex: 1, fontSize: 16, color: '#222222' },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 28,
  },
  link: {
    color: Colors.link,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});