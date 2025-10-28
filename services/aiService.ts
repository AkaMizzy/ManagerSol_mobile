import API_CONFIG from '@/app/config/api';

const enhanceText = async (text: string, token: string): Promise<string> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/ai/enhance-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to enhance text');
  }

  const data = await response.json();
  return data.enhancedText;
};

const transcribeAudio = async (audioUri: string, token: string): Promise<string> => {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: `recording-${Date.now()}.m4a`,
    type: 'audio/m4a',
  } as any);

  const response = await fetch(`${API_CONFIG.BASE_URL}/api/ai/transcribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to transcribe audio');
  }

  const data = await response.json();
  return data.transcription;
};

const aiService = {
  enhanceText,
  transcribeAudio,
};

export default aiService;
