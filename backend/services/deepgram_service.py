import os
import json
import requests
import sqlite3

class DeepgramService:
    def __init__(self):
        pass
    
    def get_user_deepgram_config(self, user_id):
        """Get Deepgram configuration for a user"""
        conn = sqlite3.connect('voiceai.db')
        conn.row_factory = sqlite3.Row
        config = conn.execute('SELECT deepgram_config FROM user_config WHERE user_id = ?', (user_id,)).fetchone()
        conn.close()
        
        if not config:
            return None
            
        return json.loads(config['deepgram_config'])
    
    def transcribe_audio(self, user_id, audio_data):
        """Transcribe audio using Deepgram API"""
        config = self.get_user_deepgram_config(user_id)
        
        if not config or 'apiKey' not in config:
            return "No valid Deepgram configuration found."
        
        headers = {
            "Authorization": f"Token {config['apiKey']}",
            "Content-Type": "audio/wav"  # Adjust based on actual audio format
        }
        
        url = "https://api.deepgram.com/v1/listen"
        params = {
            "model": config.get('model', 'nova'),
            "language": config.get('language', 'en-US'),
            "smart_format": "true",
            "diarize": "false"
        }
        
        try:
            response = requests.post(url, headers=headers, params=params, data=audio_data)
            if response.status_code == 200:
                result = response.json()
                return result['results']['channels'][0]['alternatives'][0]['transcript']
            else:
                return f"Error: {response.status_code} - {response.text}"
        except Exception as e:
            return f"Exception during transcription: {str(e)}"
    
    def text_to_speech(self, user_id, text):
        """Convert text to speech using Deepgram API"""
        config = self.get_user_deepgram_config(user_id)
        
        if not config or 'apiKey' not in config:
            return None
        
        headers = {
            "Authorization": f"Token {config['apiKey']}",
            "Content-Type": "application/json"
        }
        
        url = "https://api.deepgram.com/v1/speak"
        data = {
            "text": text,
            "voice": config.get('voice', 'aura'),
            "language": config.get('language', 'en-US')
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                return response.content  # Return audio bytes
            else:
                print(f"TTS Error: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"TTS Exception: {str(e)}")
            return None
