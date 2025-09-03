# Manifolder Detail Implementation - Complete Documentation

## Overview
This document summarizes the complete implementation of the dynamic input answering feature for manifolder sessions. The feature allows users to answer questions dynamically based on their type, with support for various input types including text, numbers, dates, GPS coordinates, file uploads, and voice recordings.

## Feature Summary
- **Backend**: Complete API routes for CRUD operations on manifolder details
- **Frontend**: Interactive accordion-style question display with dynamic input rendering
- **Database**: `manifolder_detail` table integration with `task_element` questions
- **File Support**: Images, documents, videos, and audio files
- **GPS Support**: Interactive map selection using OpenStreetMap
- **Voice Support**: Audio recording and playback functionality

## Database Schema

### `manifolder_detail` Table
```sql
CREATE TABLE manifolder_detail (
  id VARCHAR(36) PRIMARY KEY,
  id_manifolder VARCHAR(36) NOT NULL,
  id_task_element VARCHAR(36) NOT NULL,
  answer_text TEXT,
  answer_file VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_manifolder) REFERENCES manifolder(id),
  FOREIGN KEY (id_task_element) REFERENCES task_element(id)
);
```

### `task_element` Table (Existing)
```sql
-- Key columns used for manifolder questions
id VARCHAR(36) PRIMARY KEY,
title VARCHAR(255) NOT NULL,
description TEXT,
type ENUM('text', 'number', 'file', 'photo', 'video', 'date', 'boolean', 'GPS', 'voice'),
context VARCHAR(50) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

## Backend Implementation

### File: `backend/routes/manifolderDetailRoutes.js`

#### Key Features:
1. **File Upload Support**: Comprehensive multer configuration supporting:
   - Images: JPG, PNG, GIF, WebP
   - Documents: PDF, Word, Excel, TXT
   - Videos: MP4, AVI, MOV, WMV, FLV, WebM, MKV, 3GP, M4V, QuickTime
   - Audio: MP3, M4A, WAV, AAC, OGG, WebM, AMR

2. **API Endpoints**:
   - `GET /manifolder-details/questions/:manifolderId` - Fetch questions for a manifolder
   - `POST /manifolder-details/answers` - Submit answers (supports transactions)
   - `GET /manifolder-details/answers/:manifolderId` - Retrieve existing answers
   - `PUT /manifolder-details/answers/:answerId` - Update specific answer
   - `DELETE /manifolder-details/answers/:answerId` - Delete specific answer
   - `POST /manifolder-details/upload-file` - Upload files for file-type questions
   - `GET /manifolder-details/file/:filename` - Serve uploaded files

3. **Security Features**:
   - Authentication middleware
   - Company-based access control
   - File type validation
   - File size limits (100MB for videos, 25MB for others)

#### Storage Strategy:
- **Text/Number/Boolean/Date**: Stored in `answer_text` column
- **File/Photo/Video/Voice**: Stored in `answer_file` column (file path)
- **GPS**: Stored in `latitude` and `longitude` columns

### File: `backend/index.js`
- Added `manifolderDetailRoutes` import and registration
- Routes accessible at `/manifolder-details/*`

## Frontend Implementation

### TypeScript Types (`types/manifolder.ts`)

```typescript
export type QuestionType = 'text' | 'number' | 'date' | 'boolean' | 'file' | 'photo' | 'video' | 'GPS' | 'voice';

export interface ManifolderQuestion {
  id: string;
  title: string;
  description?: string | null;
  type: QuestionType;
  context: string;
  created_at: string;
  updated_at: string;
  required: boolean;
  options?: any | null;
  placeholder?: string | null;
}

export interface ManifolderAnswer {
  id: string;
  questionId: string;
  value: any;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
}
```

### Service Layer (`services/manifolderService.ts`)

#### Key Methods:
- `getManifolderQuestions(manifolderId, token)` - Fetch questions from backend
- `submitManifolderAnswers(payload, token)` - Submit answers
- `getManifolderAnswers(manifolderId, token)` - Retrieve existing answers
- `updateManifolderAnswer(answerId, payload, token)` - Update answers
- `uploadManifolderFile(manifolderId, questionId, file, token)` - Upload files
- `getFileUrl(filename)` - Construct file URLs

### Main Tab Component (`app/(tabs)/manifolder.tsx`)

#### Features:
- Two-view system: 'list' (manifolder list) and 'questions' (question answering)
- Manifolder selection workflow
- Integration with `ManifolderQuestions` component
- Safe area handling for tab bar compatibility

### Question Management (`components/ManifolderQuestions.tsx`)

#### Features:
- Fetches and displays questions dynamically
- Loads existing answers on component mount
- Handles answer submission with validation
- File upload integration
- Progress tracking (answered vs total questions)
- Submit button with proper positioning

### Question Display (`components/QuestionAccordion.tsx`)

#### Features:
- Accordion-style expandable questions
- Smooth animations using React Native Animated API
- Dynamic input rendering based on question type
- Support for all question types:
  - **Text**: Multiline TextInput
  - **Number**: Numeric TextInput
  - **Boolean**: Switch component
  - **Date**: DateTimePickerModal
  - **GPS**: MapSelector component
  - **File/Photo/Video**: FileUploader component
  - **Voice**: VoiceRecorder component

### Specialized Components

#### MapSelector (`components/MapSelector.tsx`)
- OpenStreetMap integration via WebView
- Interactive location selection
- Mini-map preview with full-screen modal
- GPS coordinate handling

#### FileUploader (`components/FileUploader.tsx`)
- Support for images, documents, and videos
- Gallery and camera access
- Document picker integration
- File preview with metadata display
- Multiple upload methods

#### VoiceRecorder (`components/VoiceRecorder.tsx`)
- Audio recording using expo-av
- Playback controls
- Timer display
- Microphone permission handling
- M4A file format support

## Question Types Supported

### 1. Text (`text`)
- **Input**: Multiline TextInput
- **Storage**: `answer_text` column
- **Validation**: None (optional)

### 2. Number (`number`)
- **Input**: Numeric TextInput with keyboard
- **Storage**: `answer_text` column (as string)
- **Validation**: Numeric parsing

### 3. Boolean (`boolean`)
- **Input**: Switch component
- **Storage**: `answer_text` column ('true'/'false')
- **Display**: Yes/No labels

### 4. Date (`date`)
- **Input**: DateTimePickerModal
- **Storage**: `answer_text` column (YYYY-MM-DD format)
- **Display**: Formatted date string

### 5. GPS (`GPS`)
- **Input**: Interactive map via WebView
- **Storage**: `latitude` and `longitude` columns
- **Features**: Location selection, clear location

### 6. File (`file`)
- **Input**: Document picker
- **Storage**: `answer_file` column (file path)
- **Supported**: PDF, Word, Excel, TXT

### 7. Photo (`photo`)
- **Input**: Image picker (gallery/camera)
- **Storage**: `answer_file` column (file path)
- **Supported**: JPG, PNG, GIF, WebP

### 8. Video (`video`)
- **Input**: Video picker (gallery/camera)
- **Storage**: `answer_file` column (file path)
- **Supported**: MP4, AVI, MOV, WMV, FLV, WebM, MKV, 3GP, M4V, QuickTime

### 9. Voice (`voice`)
- **Input**: Voice recorder
- **Storage**: `answer_file` column (file path)
- **Supported**: MP3, M4A, WAV, AAC, OGG, WebM, AMR
- **Features**: Recording, playback, timer

## UI/UX Features

### Accordion Design
- Collapsed state shows only question title
- Smooth expand/collapse animations
- Chevron rotation indicator
- Consistent spacing and typography

### File Handling
- File preview with thumbnails
- File metadata display (name, size)
- Upload progress feedback
- Error handling for unsupported files

### GPS Integration
- Mini-map preview in collapsed state
- Full-screen map for location selection
- Clear location functionality
- Coordinate display

### Voice Recording
- Recording interface with timer
- Playback controls
- Visual feedback during recording
- Audio file management

## Technical Challenges Solved

### 1. Backend Route Prefix Issue
- **Problem**: 404 errors due to missing `/manifolder-details` prefix
- **Solution**: Added prefix to all routes in `manifolderDetailRoutes.js`

### 2. Database Schema Mismatch
- **Problem**: Backend querying non-existent columns (`required`, `options`, `placeholder`)
- **Solution**: Updated queries to match actual schema and added default values

### 3. File Upload Validation
- **Problem**: iPhone video MIME types not supported
- **Solution**: Added comprehensive MIME type support including QuickTime formats

### 4. Voice Upload Support
- **Problem**: Backend rejecting 'voice' type for file uploads
- **Solution**: Added 'voice' to `fileTypes` validation array

### 5. UI Layout Issues
- **Problem**: Submit button hidden by custom tab bar
- **Solution**: Implemented SafeAreaView with proper padding and positioning

### 6. Tab Bar Layout
- **Problem**: 7 tabs not fitting properly in custom tab bar
- **Solution**: Reduced icon sizes, font sizes, and adjusted padding

## Dependencies Added

### Backend
- `multer` - File upload handling
- `path` and `fs` - File system operations

### Frontend
- `expo-av` - Audio recording and playback
- `expo-image-picker` - Image and video selection
- `expo-document-picker` - Document selection
- `react-native-modal-datetime-picker` - Date picker
- `react-native-webview` - Map integration

## File Structure

```
ManagerSol/
├── app/
│   └── (tabs)/
│       └── manifolder.tsx
├── components/
│   ├── QuestionAccordion.tsx
│   ├── ManifolderQuestions.tsx
│   ├── MapSelector.tsx
│   ├── FileUploader.tsx
│   ├── VoiceRecorder.tsx
│   └── CustomTabBar.tsx
├── services/
│   └── manifolderService.ts
├── types/
│   └── manifolder.ts
└── MANIFOLDER_DETAIL_IMPLEMENTATION.md

MangerSol/backend/
├── routes/
│   └── manifolderDetailRoutes.js
├── uploads/
│   └── manifolder/
└── index.js
```

## Usage Workflow

1. **User selects a manifolder** from the list view
2. **Questions are loaded** dynamically from `task_element` with `context = 'manifolder'`
3. **User expands questions** by tapping on them
4. **User provides answers** using appropriate input components
5. **Files are uploaded immediately** when selected
6. **User submits all answers** using the submit button
7. **Answers are stored** in the `manifolder_detail` table
8. **User returns to list view** to select another manifolder

## Future Enhancements

1. **Question Ordering**: Add `ordre` column support for question sequencing
2. **Required Field Validation**: Implement proper required field handling
3. **Question Options**: Support for multiple choice questions
4. **Bulk Operations**: Upload multiple files at once
5. **Offline Support**: Cache questions and answers for offline use
6. **Answer Templates**: Pre-fill common answers
7. **Export Functionality**: Export manifolder details to PDF/Excel
8. **Real-time Collaboration**: Multiple users working on same manifolder

## Testing Checklist

- [x] Backend routes respond correctly
- [x] File uploads work for all supported types
- [x] GPS location selection functions properly
- [x] Voice recording and playback works
- [x] UI animations are smooth
- [x] Submit button is always visible
- [x] Tab bar layout accommodates all tabs
- [x] Error handling works for invalid inputs
- [x] File size limits are enforced
- [x] Authentication and authorization work correctly

## Conclusion

This implementation provides a comprehensive solution for dynamic question answering in manifolder sessions. The system supports all major input types, provides excellent user experience with smooth animations and intuitive interfaces, and maintains data integrity through proper validation and error handling. The modular design allows for easy extension and maintenance of the feature.
