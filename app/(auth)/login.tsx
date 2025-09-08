import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../../components/CustomAlert';

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

    console.log('Starting login process...');
    const result = await login(form.email, form.password);
    console.log('Login result:', result);
    
    if (result.success) {
      console.log('Login successful, post-login loading will begin...');
      showAlert('success', 'Login Successful!', 'Welcome to QualiSol. Redirecting to your workspace...');
      // Navigation will be handled by AuthWrapper after loading screen
    } else {
      console.log('Login failed:', result.error);
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
        <View style={styles.content}>
          {/* Background Gradient Effect */}
          <View style={styles.backgroundGradient} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoGradient}>
                <View style={styles.logo}> 
                  <Image
                    source={require('../../assets/images/icon.png')}
                    style={styles.logoImage}
                    contentFit="contain"
                  />
                </View>
              </View>
            </View>
            <Text style={styles.title}>Qualisol</Text>
            <Text style={styles.subtitle}>
              {/* Professional construction management for your teams */}
            </Text>
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
                  size={20}
                  color={focusedField === 'email' ? '#FF6B35' : '#6B7280'}
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
                  size={20}
                  color={focusedField === 'password' ? '#FF6B35' : '#6B7280'}
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
                    size={20}
                    color={focusedField === 'password' ? '#FF6B35' : '#6B7280'}
                  />
                </TouchableOpacity>
              </View>
            </View>

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

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Vous n&apos;avez pas de compte?{' '}
              </Text>
              <Text style={styles.footerLink}>Contactez votre administrateur</Text>
            
            <Text style={[styles.footerText, { marginTop: 70, fontSize: 12, }]}>
            <Text style={{color: '#FF6B35',fontSize: 15 }}> QualiSol </Text> ©{new Date().getFullYear()}-{new Date().getFullYear() + 1}. Tous droits réservés.
            </Text>
            <Text style={{color: '#FF6B35'}}>www.muntadaacom.com</Text>
          </View>
        </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    minHeight: height * 0.9,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFC',
    opacity: 0.8,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.03,
    paddingBottom: 10,
  },
  logoContainer: {
    marginBottom: 15,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoImage: {
    width: '85%',
    height: '85%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF6B35',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35'
  },
  inputWrapperFocused: {
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop:20,
    marginLeft: 170,
  },
  forgotPasswordText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 100,
    paddingTop: 20,
    marginBottom:-80,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    fontWeight: '600',
  },
});
