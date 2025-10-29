import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../../components/CustomAlert';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';

interface LoginForm {
  email: string;
  password: string;
}

interface AlertState {
  visible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });
  const [isForgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);

  // Watch for authentication changes - navigation will be handled by AuthWrapper
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Login successful, post-login loading will begin...');
    }
  }, [isAuthenticated]);

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInputFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleInputBlur = () => {
    setFocusedField(null);
  };

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }));
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      showAlert('error', 'Missing Information', 'Please fill in all fields to continue.');
      return;
    }

    const result = await login(form.email, form.password);
    
    if (result.success) {
      showAlert('success', 'Login Successful!', 'Welcome to QualiSol. Redirecting to your workspace...');
    } else {
      showAlert('error', 'Login Failed', result.error || 'Invalid credentials. Please check your email and password.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.mainContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../../assets/images/icon.png')}
                    style={styles.logoImage}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.title}>QualiSol</Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Identifiant</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'email' && styles.inputWrapperFocused
                  ]}>
                    <Ionicons
                      name="person-outline"
                      size={22}
                      color={focusedField === 'email' ? '#f87b1b' : '#6B7280'}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter l'identifiant"
                      placeholderTextColor="#9CA3AF"
                      value={form.email}
                      onChangeText={(value) => handleInputChange('email', value)}
                      onFocus={() => handleInputFocus('email')}
                      onBlur={handleInputBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputWrapperFocused
                  ]}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={22}
                      color={focusedField === 'password' ? '#f87b1b' : '#6B7280'}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter le mot de passe"
                      placeholderTextColor="#9CA3AF"
                      value={form.password}
                      onChangeText={(value) => handleInputChange('password', value)}
                      onFocus={() => handleInputFocus('password')}
                      onBlur={handleInputBlur}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color={focusedField === 'password' ? '#f87b1b' : '#6B7280'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => setForgotPasswordModalVisible(true)}
                >
                  <Text style={styles.forgotPasswordText}>Mot de passe oublié?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Se connecter</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Vous n&apos;avez pas de compte?{' '}
                <Link href="/register" style={styles.footerLink}>
                  Créer un compte
                </Link>
              </Text>
              <Text style={styles.copyrightText}>
                <Text style={styles.copyrightBrand}>QualiSol</Text> ©{new Date().getFullYear()}. Tous droits réservés.
              </Text>
              <Text style={styles.websiteText}>www.muntadaacom.com</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Custom Alert */}
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
        duration={alert.type === 'success' ? 2000 : 4000}
      />

      <ForgotPasswordModal
        visible={isForgotPasswordModalVisible}
        onClose={() => setForgotPasswordModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#11224e',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#f87b1b',
  },
  logoImage: {
    width: '75%',
    height: '75%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f87b1b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f87b1b',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f87b1b',
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: '#f87b1b',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#11224e',
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: '#f87b1b',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#f87b1b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f87b1b',
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#f87b1b',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  footerLink: {
    color: '#f87b1b',
    fontWeight: '600',
  },
  copyrightText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
  copyrightBrand: {
    fontWeight: 'bold',
    color: '#11224e',
  },
  websiteText: {
    fontSize: 14,
    color: '#f87b1b',
    fontWeight: '600',
    marginTop: 4,
  }
});
