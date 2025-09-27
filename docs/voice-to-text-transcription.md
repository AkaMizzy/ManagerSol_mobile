# Voice-to-Text Transcription in Qualisol Expo App

## 📌 Overview
In the Qualisol Expo application, users can take pictures, record voice notes, capture their location, and add comments when creating a new `qualiphoto` entry.

The **goal** of this feature is to allow the application to **transcribe recorded voice notes into text** and automatically insert the result into the `comment` field and can be editable, avoiding the need for writing the comment

---

## 🔹 Chosen Solution
We decided to use the **`react-native-voice`** community package, which provides free speech-to-text functionality by leveraging the **device’s built-in speech recognition** (Google Speech on Android, Siri/Dictation on iOS).

This solution was chosen because:
- ✅ It’s free (no cloud subscription required).
- ✅ Works offline/online depending on the device OS.
- ✅ Supports multiple languages (French, Arabic, English, etc.).
- ✅ Easy to integrate into our Expo managed workflow using development builds.

---

## 🔹 Database Impact
No schema changes are needed.  
- The **transcribed text will be stored directly in the existing `comment` column** of the `qualiphoto` table.

---

## 🔹 Installation

1. Install the package:
```bash
npm install @react-native-voice/voice
```

2. Prebuild the Expo project (required for native module):
```bash
npx expo prebuild
```

3. Rebuild the development client:
```bash
npx expo run:android
# or
npx expo run:ios
```

---

## 🔹 Workflow for Users

1. User records a voice note (already implemented with `expo-av`).  
2. A **“Transcribe Voice Note” button** appears in the creation modal.  
3. When clicked, the app will run **speech-to-text recognition**.  
4. The recognized text will **auto-fill the comment field**.  
5. User can **edit the comment manually** if needed before saving.  
6. When saving, the `comment` field is stored in the backend along with photo, location, and voice file.

---

## 🔹 Implementation

### Example Component: `VoiceComment.tsx`
This component manages the comment input and provides a button to transcribe the latest voice note.

```tsx
import React, { useState, useEffect } from "react";
import { Button, TextInput, View } from "react-native";
import Voice from "@react-native-voice/voice";

export default function VoiceComment() {
  const [comment, setComment] = useState("");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Handle speech recognition results
    Voice.onSpeechResults = (event) => {
      if (event.value) {
        setComment(event.value[0]); // take the first recognized result
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      setIsListening(true);
      await Voice.start("fr-FR"); // set to "en-US", "ar-MA", etc. depending on the app’s language
    } catch (e) {
      console.error("Error starting voice recognition:", e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error("Error stopping voice recognition:", e);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        placeholder="Comment"
        value={comment}
        onChangeText={setComment}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          borderRadius: 6,
          marginBottom: 10,
        }}
      />

      {isListening ? (
        <Button title="Stop Transcription" onPress={stopListening} />
      ) : (
        <Button title="Transcribe Voice Note" onPress={startListening} />
      )}
    </View>
  );
}
```

---

## 🔹 Integration with Creation Modal

In the `QualiphotoCreationModal.tsx`, replace your current `TextInput` for comment with the `VoiceComment` component:

```tsx
import VoiceComment from "./VoiceComment";

// Inside your modal JSX:
<VoiceComment />
```

This ensures the transcription text is always stored in the comment field.

---

## 🔹 Notes for Developers
- Ensure microphone permissions are handled (`expo-av` already requires this).  
- Test on both Android & iOS since recognition behavior may differ.  
- Default language is set via `Voice.start("fr-FR")` → change depending on user locale.  
- Users can still edit the auto-filled comment manually.  
- No backend changes are required except ensuring the `comment` field is properly saved.

---

## ✅ Conclusion
With this implementation, we achieve a **free, device-based voice-to-text transcription system** that integrates seamlessly into the `qualiphoto` creation flow. It allows users to record a voice note and quickly convert it into a written comment, enhancing usability without requiring additional infrastructure costs.
