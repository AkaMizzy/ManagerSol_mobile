import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEPS = [
  { id: 1, title: 'Informations sur l’entreprise' },
  { id: 2, title: 'Coordonnées & Secteur' },
  { id: 3, title: 'Informations Bancaires & Légales' },
  { id: 4, title: 'Création de votre compte' },
];

type FormData = {
  [key: string]: string;
};

interface Country {
  name: string;
  flag: string;
}

// Reusable LabeledInput component
const LabeledInput = ({ label, ...props }: TextInputProps & { label: string }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput style={styles.input} placeholderTextColor="#9CA3AF" {...props} />
  </View>
);

export default function OldRegisterScreen() {
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [logo, setLogo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isCountryModalVisible, setCountryModalVisible] = useState(false);
  const [isCityModalVisible, setCityModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetchingCities, setIsFetchingCities] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/flag/images');
        const data = await response.json();
        if (!data.error) {
          setCountries(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch countries:", error);
        // Optionally, show an alert to the user
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const selectedCountry = formData.pays;
    if (selectedCountry) {
      const fetchCities = async () => {
        setIsFetchingCities(true);
        try {
          const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country: selectedCountry })
          });
          const data = await response.json();
          if (!data.error) {
            setCities(data.data);
          } else {
            setCities([]);
          }
        } catch (error) {
          console.error("Failed to fetch cities:", error);
          setCities([]);
        } finally {
            setIsFetchingCities(false);
        }
      };
      fetchCities();
    } else {
      setCities([]);
    }
  }, [formData.pays]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'pays') {
      // Reset city when country changes
      setFormData(prev => ({ ...prev, [field]: value, ville: '' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };
  
  const pickImage = async (setImage: React.Dispatch<React.SetStateAction<ImagePicker.ImagePickerAsset | null>>) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const nextStep = () => {
    // Add validation logic here before proceeding
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
        handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSubmit = async () => {
    const finalFormData = new FormData();
    
    Object.keys(formData).forEach(key => {
        finalFormData.append(key, formData[key]);
    });
    
    if (logo) {
      const logoFile = {
        uri: logo.uri,
        name: logo.uri.split('/').pop(),
        type: 'image/jpeg', // or other image types
      } as any;
      finalFormData.append('logo', logoFile);
    }

    if (photo) {
        const photoFile = {
          uri: photo.uri,
          name: photo.uri.split('/').pop(),
          type: 'image/jpeg',
        } as any;
        finalFormData.append('photo', photoFile);
    }

    const result = await register(finalFormData);
    if (result.success) {
        Alert.alert('Succès', 'Votre compte a été créé avec succès.');
        router.replace('/');
    } else {
        Alert.alert('Erreur', result.error || 'Une erreur est survenue lors de l’inscription.');
    }
  };

  const handleSelectCountry = (country: Country) => {
    handleInputChange('pays', country.name);
    setCountryModalVisible(false);
    setSearchQuery('');
  };

  const handleSelectCity = (city: string) => {
    handleInputChange('ville', city);
    setCityModalVisible(false);
    setSearchQuery('');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Informations Générales</Text>
            <LabeledInput label="Titre de l'entreprise" placeholder="ex: QualiSol Inc." value={formData.company_title || ''} onChangeText={(v) => handleInputChange('company_title', v)} />
            <LabeledInput label="Description" placeholder="Une brève description de votre entreprise" multiline value={formData.company_description || ''} onChangeText={(v) => handleInputChange('company_description', v)} />
            <LabeledInput label="Email de l'entreprise" placeholder="contact@entreprise.com" keyboardType="email-address" value={formData.company_email || ''} onChangeText={(v) => handleInputChange('company_email', v)} />
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Pays</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setCountryModalVisible(true)}>
                <Text style={styles.dropdownText}>{formData.pays || 'Sélectionner un pays'}</Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ville</Text>
              <TouchableOpacity 
                style={[styles.dropdown, !formData.pays && styles.dropdownDisabled]} 
                onPress={() => formData.pays && setCityModalVisible(true)}
                disabled={!formData.pays || isFetchingCities}
              >
                <Text style={styles.dropdownText}>{isFetchingCities ? 'Chargement...' : formData.ville || 'Sélectionner une ville'}</Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(setLogo)}>
              <Text style={styles.imagePickerText}>{logo ? 'Changer le logo' : 'Sélectionner un logo'}</Text>
            </TouchableOpacity>
            {logo && <Image source={{ uri: logo.uri }} style={styles.previewImage} />}
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Coordonnées (Secteur)</Text>
            <LabeledInput label="Téléphone 1 " placeholder="05 XX XX XX XX" keyboardType="phone-pad" value={formData.sector_phone1 || ''} onChangeText={(v) => handleInputChange('sector_phone1', v)} />
            <LabeledInput label="Téléphone 2 " placeholder="Optionnel" keyboardType="phone-pad" value={formData.sector_phone2 || ''} onChangeText={(v) => handleInputChange('sector_phone2', v)} />
            <LabeledInput label="Site web " placeholder="www.entreprise.com" value={formData.sector_website || ''} onChangeText={(v) => handleInputChange('sector_website', v)} />
            <LabeledInput label="Email 2" placeholder="Optionnel" keyboardType="email-address" value={formData.sector_email2 || ''} onChangeText={(v) => handleInputChange('sector_email2', v)} />
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>Informations Bancaires & Légales</Text>
            <LabeledInput label="Nom de la banque" placeholder="Nom de votre banque" value={formData.bank_name || ''} onChangeText={(v) => handleInputChange('bank_name', v)} />
            <LabeledInput label="RIB" placeholder="Numéro de Relevé d'Identité Bancaire" value={formData.rib_number || ''} onChangeText={(v) => handleInputChange('rib_number', v)} />
            <LabeledInput label="Numéro RC" placeholder="Numéro du Registre de Commerce" value={formData.rc_number || ''} onChangeText={(v) => handleInputChange('rc_number', v)} />
            <LabeledInput label="Numéro IF" placeholder="Identifiant Fiscal" value={formData.if_number || ''} onChangeText={(v) => handleInputChange('if_number', v)} />
            <LabeledInput label="Numéro ICE" placeholder="Identifiant Commun de l'Entreprise" value={formData.ice_number || ''} onChangeText={(v) => handleInputChange('ice_number', v)} />
            <LabeledInput label="Numéro de patente" placeholder="Numéro de patente" value={formData.patente_number || ''} onChangeText={(v) => handleInputChange('patente_number', v)} />
            <LabeledInput label="Numéro CNSS" placeholder="Numéro de la Caisse Nationale de Sécurité Sociale" value={formData.cnss_number || ''} onChangeText={(v) => handleInputChange('cnss_number', v)} />
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>Votre Compte</Text>
            <LabeledInput label="Prénom" placeholder="Votre prénom" value={formData.user_firstname || ''} onChangeText={(v) => handleInputChange('user_firstname', v)} />
            <LabeledInput label="Nom" placeholder="Votre nom de famille" value={formData.user_lastname || ''} onChangeText={(v) => handleInputChange('user_lastname', v)} />
            <LabeledInput label="Email" placeholder="Votre email de connexion" keyboardType="email-address" value={formData.user_email || ''} onChangeText={(v) => handleInputChange('user_email', v)} />
            <LabeledInput label="Téléphone" keyboardType="phone-pad" placeholder="Votre numéro de téléphone" value={formData.user_phone1 || ''} onChangeText={(v) => handleInputChange('user_phone1', v)} />
            <LabeledInput label="Mot de passe" placeholder="Créez un mot de passe sécurisé" secureTextEntry value={formData.user_password || ''} onChangeText={(v) => handleInputChange('user_password', v)} />
            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(setPhoto)}>
                <Text style={styles.imagePickerText}>{photo ? 'Changer la photo' : 'Sélectionner une photo'}</Text>
            </TouchableOpacity>
            {photo && <Image source={{ uri: photo.uri }} style={styles.previewImage} />}
          </View>
        );
      default:
        return null;
    }
  };

  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCities = cities.filter(city => 
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#11224E" />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.header}>
            <Image
                source={require('../../assets/images/icon.png')}
                style={styles.logoImage}
                contentFit="contain"
            />
            <Text style={styles.title}>Créer un compte</Text>
          </View>
          
          {/* Stepper */}
          <View style={styles.stepperContainer}>
            {STEPS.map((step, index) => (
              <View key={step.id} style={styles.step}>
                <View
                  style={[
                    styles.stepIndicator,
                    currentStep > index + 1 && styles.stepIndicatorCompleted,
                    currentStep === index + 1 && styles.stepIndicatorActive,
                  ]}
                >
                    {currentStep > index + 1 ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : (
                        <Text style={[styles.stepNumber, currentStep === index + 1 && styles.stepNumberActive]}>{step.id}</Text>
                    )}
                </View>
                <Text style={[styles.stepLabel, currentStep === index + 1 && styles.stepLabelActive]}>
                  {step.title}
                </Text>
                {index < STEPS.length - 1 && <View style={styles.connector} />}
              </View>
            ))}
          </View>

          <View style={styles.formContainer}>{renderStep()}</View>

          <View style={styles.navigation}>
            {currentStep > 1 && (
              <TouchableOpacity style={[styles.navButton, styles.prevButton]} onPress={prevStep}>
                <Text style={styles.navButtonText}>Précédent</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={nextStep} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.navButtonText}>{currentStep === STEPS.length ? 'Terminer' : 'Suivant'}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Modal */}
      <Modal visible={isCountryModalVisible} animationType="slide" onRequestClose={() => setCountryModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.modalContentContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un pays</Text>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un pays..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={countries.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.countryItem} onPress={() => handleSelectCountry(item)}>
                  <Image source={{ uri: item.flag }} style={styles.flag} />
                  <Text style={styles.countryName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* City Modal */}
      <Modal visible={isCityModalVisible} animationType="slide" onRequestClose={() => setCityModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
            <View style={styles.modalContentContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Sélectionner une ville</Text>
                    <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher une ville..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <FlatList
                    data={cities.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                    <TouchableOpacity style={styles.cityItem} onPress={() => handleSelectCity(item)}>
                        <Text style={styles.cityName}>{item}</Text>
                    </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyListText}>Aucune ville trouvée ou le pays n&apos;a pas de villes répertoriées.</Text>}
                />
            </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoImage: {
        width: 80,
        height: 80,
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#11224e',
    },
    stepperContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    step: {
        alignItems: 'center',
        flex: 1,
        position: 'relative',
    },
    stepIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#D1D5DB',
    },
    stepIndicatorActive: {
        backgroundColor: '#f87b1b',
        borderColor: '#f87b1b',
    },
    stepIndicatorCompleted: {
        backgroundColor: '#11224e',
        borderColor: '#11224e',
    },
    stepNumber: {
        color: '#6B7280',
        fontWeight: 'bold',
    },
    stepNumberActive: {
        color: '#FFFFFF',
    },
    stepLabel: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 8,
        color: '#6B7280',
        fontWeight: '500',
    },
    stepLabelActive: {
        color: '#f87b1b',
        fontWeight: 'bold',
    },
    connector: {
        position: 'absolute',
        top: 15,
        left: '50%',
        right: '-50%',
        height: 2,
        backgroundColor: '#D1D5DB',
        zIndex: -1,
    },
    formContainer: {
        marginBottom: 24,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#11224e',
        marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#11224e',
      marginBottom: 8,
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        borderColor: '#D1D5DB',
        borderWidth: 1,
    },
    dropdown: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      borderRadius: 8,
      padding: 16,
      borderColor: '#D1D5DB',
      borderWidth: 1,
    },
    dropdownText: {
      fontSize: 16,
      color: '#11224e',
    },
    dropdownDisabled: {
        backgroundColor: '#E5E7EB',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#11224e',
    },
    searchInput: {
        margin: 16,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        borderColor: '#D1D5DB',
        borderWidth: 1,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    flagImage: {
        width: 30,
        height: 20,
        marginRight: 12,
        borderRadius: 3,
    },
    imagePicker: {
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    previewImage: {
      width: 100,
      height: 100,
      borderRadius: 8,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#D1D5DB',
    },
    imagePickerText: {
        color: '#11224e',
        fontWeight: '500',
    },
    navigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    navButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
    },
    prevButton: {
        backgroundColor: '#6B7280',
        marginRight: 8,
    },
    nextButton: {
        backgroundColor: '#f87b1b',
        marginLeft: 8,
    },
    navButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    modalContainer: {
      flex: 1,
      paddingTop: 50,
      paddingHorizontal: 20,
      backgroundColor: '#FFF',
    },
    modalContentContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    flag: {
      width: 30,
      height: 20,
      marginRight: 12,
      borderRadius: 3,
    },
    countryName: {
      fontSize: 16,
    },
    cityItem: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    cityName: {
      fontSize: 16,
    },
    emptyListText: {
      textAlign: 'center',
      marginTop: 20,
      color: '#6B7280',
    },
    navHeader: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 5,
      width: '100%',
    },
    backButton: {
      alignSelf: 'flex-start',
      padding: 5,
    },
});
