# Preview Mechanism Implementation Guide

## Overview
This document outlines the implementation of a comprehensive preview mechanism for the Manifolder Questions feature. The system allows users to preview various media types (images, videos, documents, and voice recordings) directly from question cards without needing to expand the full question.

## Features Implemented

### 1. Media Type Support
- **Images**: JPG, JPEG, PNG, GIF, WEBP
- **Videos**: MP4, MOV, AVI, MKV
- **Documents**: PDF, DOC, DOCX, TXT, XLS, XLSX
- **Audio**: MP3, WAV, M4A, AAC, OGG

### 2. Preview Button Integration
- Eye icon (👁️) appears on question cards when media is available
- Positioned on the right side of the question header
- Only visible when media content is detected
- Non-intrusive design that doesn't interfere with accordion functionality

## Technical Implementation

### Files Modified

#### 1. `components/PreviewModal.tsx` (New File)
**Purpose**: Reusable modal component for displaying media previews

**Key Features**:
- Full-screen modal with dark background
- Header with title and close button
- Dynamic content rendering based on media type
- Custom audio player for voice recordings
- File opening functionality for documents

**Media Type Handlers**:
```typescript
// Image Preview
- Uses expo-image for optimized image display
- Full-screen view with contain fit
- Smooth transitions

// Video Preview  
- Uses expo-av Video component
- Native video controls
- Full-screen playback

// Document Preview
- Shows document icon and filename
- "Open Document" button using React Native Linking
- Opens in appropriate app or browser

// Voice Preview
- Custom audio player with always-visible controls
- Play/pause button with real-time state
- Progress bar with seek functionality
- Time display (current/total)
```

**Audio Player Implementation**:
```typescript
// State Management
const [sound, setSound] = useState<Audio.Sound | null>(null);
const [isPlaying, setIsPlaying] = useState(false);
const [duration, setDuration] = useState(0);
const [position, setPosition] = useState(0);

// Audio Loading
const loadAudio = async () => {
  const { sound: audioSound } = await Audio.Sound.createAsync(
    { uri: mediaUrl },
    { shouldPlay: false },
    onPlaybackStatusUpdate
  );
  setSound(audioSound);
};

// Playback Controls
const handlePlayPause = async () => {
  if (isPlaying) {
    await sound.pauseAsync();
  } else {
    await sound.playAsync();
  }
};

// Seek Functionality
const handleSeek = async (value: number) => {
  await sound.setPositionAsync(value);
};
```

#### 2. `components/QuestionAccordion.tsx` (Modified)
**Changes Made**:
- Added media detection logic
- Integrated preview button
- Extended file type support
- Added preview modal integration

**Media Detection Functions**:
```typescript
// Check if question has previewable media
const hasPreviewableMedia = () => {
  if (!value) return false;
  
  if (typeof value === 'object' && value.path) {
    const path = value.path.toLowerCase();
    return path.includes('.jpg') || path.includes('.jpeg') || 
           path.includes('.png') || path.includes('.gif') || 
           path.includes('.webp') || path.includes('.mp4') || 
           path.includes('.mov') || path.includes('.avi') || 
           path.includes('.mkv') || path.includes('.pdf') || 
           path.includes('.doc') || path.includes('.docx') ||
           path.includes('.txt') || path.includes('.xls') || 
           path.includes('.xlsx') || path.includes('.mp3') || 
           path.includes('.wav') || path.includes('.m4a') ||
           path.includes('.aac') || path.includes('.ogg');
  }
  return false;
};

// Get media type and URL for preview
const getPreviewMedia = () => {
  if (!value || typeof value !== 'object' || !value.path) return null;
  
  const path = value.path.toLowerCase();
  const isImage = path.includes('.jpg') || path.includes('.jpeg') || 
                  path.includes('.png') || path.includes('.gif') || 
                  path.includes('.webp');
  const isVideo = path.includes('.mp4') || path.includes('.mov') || 
                  path.includes('.avi') || path.includes('.mkv');
  const isFile = path.includes('.pdf') || path.includes('.doc') || 
                 path.includes('.docx') || path.includes('.txt') || 
                 path.includes('.xls') || path.includes('.xlsx');
  const isVoice = path.includes('.mp3') || path.includes('.wav') || 
                  path.includes('.m4a') || path.includes('.aac') || 
                  path.includes('.ogg');
  
  const baseUrl = API_CONFIG.BASE_URL;
  const fullUrl = `${baseUrl}${value.path}`;
  
  if (isImage) return { type: 'image' as const, url: fullUrl };
  if (isVideo) return { type: 'video' as const, url: fullUrl };
  if (isFile) return { type: 'file' as const, url: fullUrl };
  if (isVoice) return { type: 'voice' as const, url: fullUrl };
  
  return null;
};
```

**Preview Button Integration**:
```typescript
// In the question header JSX
<View style={styles.headerActions}>
  {/* Preview Button */}
  {hasPreviewableMedia() && (
    <Pressable
      style={styles.previewButton}
      onPress={handlePreviewPress}
      accessibilityRole="button"
      accessibilityLabel="Preview media"
    >
      <Ionicons 
        name="eye-outline" 
        size={16} 
        color="#8E8E93" 
      />
    </Pressable>
  )}
  
  {/* Chevron */}
  <Animated.View style={[styles.chevronContainer, {...}]}>
    <Text style={styles.chevron}>▼</Text>
  </Animated.View>
</View>

// Preview Modal Integration
<PreviewModal
  visible={showPreview}
  onClose={() => setShowPreview(false)}
  mediaUrl={previewMedia?.url}
  mediaType={previewMedia?.type}
  title={question.title}
/>
```

**New Styles Added**:
```typescript
headerActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
previewButton: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#F2F2F7',
  justifyContent: 'center',
  alignItems: 'center',
},
```

## UI/UX Design Decisions

### 1. Preview Button Design
- **Size**: 32x32px circular button
- **Icon**: Eye outline (👁️) from Ionicons
- **Color**: Light gray (#8E8E93) for subtle appearance
- **Background**: Light gray (#F2F2F7) for contrast
- **Position**: Right side of question header, before chevron

### 2. Modal Design
- **Background**: Dark overlay (rgba(0, 0, 0, 0.9))
- **Animation**: Fade in/out transition
- **Header**: Semi-transparent with title and close button
- **Content**: Centered with appropriate sizing

### 3. Audio Player Design
- **Container**: Semi-transparent white background
- **Play Button**: 48x48px circular red button
- **Progress Bar**: Thin bar with red fill
- **Time Display**: White text showing current/total time
- **Layout**: Organized spacing with proper padding

## Technical Challenges Solved

### 1. Audio Player Controls Visibility
**Problem**: Native video controls were hidden until tapped
**Solution**: Created custom audio player using expo-av Audio API
- Always-visible controls
- Custom play/pause button
- Real-time progress tracking
- Seek functionality

### 2. File Opening Functionality
**Problem**: Documents needed to open in appropriate apps
**Solution**: Implemented React Native Linking API
- Checks if URL can be opened directly
- Falls back to browser if needed
- Error handling with user-friendly alerts

### 3. Media Type Detection
**Problem**: Need to detect various file types accurately
**Solution**: Comprehensive file extension checking
- Case-insensitive matching
- Support for multiple extensions per type
- Graceful fallback for unsupported types

## Dependencies Added/Modified

### New Imports
```typescript
// PreviewModal.tsx
import { Audio, ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { Linking, Alert } from 'react-native';

// QuestionAccordion.tsx
import API_CONFIG from '@/app/config/api';
import PreviewModal from './PreviewModal';
```

### Existing Dependencies Used
- `expo-av`: Audio and video playback
- `expo-image`: Optimized image display
- `@expo/vector-icons`: Icons (Ionicons)
- `react-native`: Core components and APIs

## Testing Considerations

### 1. Media Type Testing
- Test with various file formats
- Verify preview button appears correctly
- Check URL construction for different file types

### 2. Audio Player Testing
- Test play/pause functionality
- Verify progress bar updates
- Check seek functionality
- Test with different audio formats

### 3. File Opening Testing
- Test document opening on different devices
- Verify fallback to browser works
- Check error handling for unsupported files

### 4. UI/UX Testing
- Verify preview button positioning
- Check modal animations
- Test accessibility features
- Verify responsive design

## Future Enhancements

### 1. Additional Media Types
- Support for more document formats
- Additional audio/video codecs
- Archive file preview (ZIP, RAR)

### 2. Enhanced Audio Player
- Volume control
- Playback speed adjustment
- Audio visualization
- Download functionality

### 3. Improved File Handling
- File size display
- File type icons
- Preview thumbnails for documents
- Offline file access

### 4. Performance Optimizations
- Lazy loading for large files
- Image compression
- Caching mechanisms
- Progressive loading

## Code Quality Standards

### 1. TypeScript Implementation
- Proper type definitions
- Interface declarations
- Type safety for media types

### 2. Error Handling
- Graceful fallbacks for unsupported files
- User-friendly error messages
- Proper cleanup of audio resources

### 3. Accessibility
- Proper accessibility labels
- Keyboard navigation support
- Screen reader compatibility

### 4. Performance
- Efficient media detection
- Proper resource cleanup
- Optimized re-renders

## Deployment Notes

### 1. Backend Requirements
- Ensure file upload endpoints support all media types
- Verify file serving URLs are accessible
- Check CORS configuration for file access

### 2. Frontend Deployment
- Verify all dependencies are included
- Test on both iOS and Android
- Check bundle size impact


## Conclusion

The preview mechanism implementation provides a comprehensive solution for media preview in the Manifolder Questions feature. The system supports multiple media types, provides intuitive user controls, and maintains high performance standards. The custom audio player solves the visibility issue with native controls, while the file opening functionality ensures documents can be accessed appropriately.

The implementation follows React Native best practices, includes proper error handling, and maintains accessibility standards. The modular design allows for easy extension and maintenance of the preview functionality.
