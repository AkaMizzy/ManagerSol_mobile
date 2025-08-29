import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import API_CONFIG from '../app/config/api';

interface ImageCarouselProps {
  images: { id: string; photo: string; uploaded_at: string }[];
  style?: any;
}

const { width } = Dimensions.get('window');

export default function ImageCarousel({ images, style }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const openFullScreen = (index: number) => {
    setFullScreenIndex(index);
    setFullScreenVisible(true);
  };

  const closeFullScreen = () => {
    setFullScreenVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Main Image Display */}
      <View style={styles.imageContainer}>
        <TouchableOpacity
          onPress={() => openFullScreen(currentIndex)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: `${API_CONFIG.BASE_URL}${images[currentIndex].photo}` }}
            style={styles.image}
            contentFit="cover"
            transition={300}

          />
        </TouchableOpacity>
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <TouchableOpacity
              style={[styles.navButton, styles.leftButton]}
              onPress={goToPrevious}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.navButton, styles.rightButton]}
              onPress={goToNext}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Image Counter */}
      {images.length > 1 && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>
      )}

      {/* Thumbnail Indicators */}
      {images.length > 1 && (
        <View style={styles.thumbnailContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailScroll}
          >
            {images.map((image, index) => (
              <TouchableOpacity
                key={image.id}
                style={[
                  styles.thumbnail,
                  index === currentIndex && styles.activeThumbnail
                ]}
                onPress={() => goToImage(index)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: `${API_CONFIG.BASE_URL}${image.photo}` }}
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Full Screen Modal */}
      <Modal
        visible={fullScreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreen}
      >
        <SafeAreaView style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeFullScreen}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.fullScreenCounter}>
              {fullScreenIndex + 1} / {images.length}
            </Text>
          </View>
          
          <View style={styles.fullScreenImageContainer}>
            <Image
              source={{ uri: `${API_CONFIG.BASE_URL}${images[fullScreenIndex].photo}` }}
              style={styles.fullScreenImage}
              contentFit="contain"
            />
          </View>
          
          {images.length > 1 && (
            <View style={styles.fullScreenThumbnails}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.fullScreenThumbnailScroll}
              >
                {images.map((image, index) => (
                  <TouchableOpacity
                    key={image.id}
                    style={[
                      styles.fullScreenThumbnail,
                      index === fullScreenIndex && styles.fullScreenActiveThumbnail
                    ]}
                    onPress={() => setFullScreenIndex(index)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: `${API_CONFIG.BASE_URL}${image.photo}` }}
                      style={styles.fullScreenThumbnailImage}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftButton: {
    left: 12,
  },
  rightButton: {
    right: 12,
  },
  counterContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailContainer: {
    marginTop: 12,
  },
  thumbnailScroll: {
    paddingHorizontal: 4,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: '#007AFF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  // Full Screen Modal Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 8,
  },
  fullScreenCounter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fullScreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenThumbnails: {
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullScreenThumbnailScroll: {
    paddingHorizontal: 20,
  },
  fullScreenThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  fullScreenActiveThumbnail: {
    borderColor: '#007AFF',
  },
  fullScreenThumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
