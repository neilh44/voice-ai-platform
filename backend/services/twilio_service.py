from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.rest import Client
import os
import json
import sqlite3

class TwilioService:
    def __init__(self):
        self.client = None
    
    def get_client(self, account_sid, auth_token):
        """Initialize Twilio client with the provided credentials"""
        return Client(account_sid, auth_token)
    
    def get_user_twilio_config(self, user_id):
        """Get Twilio configuration for a user"""
        conn = sqlite3.connect('voiceai.db')
        conn.row_factory = sqlite3.Row
        config = conn.execute('SELECT twilio_config FROM user_config WHERE user_id = ?', (user_id,)).fetchone()
        conn.close()
        
        if not config:
            return None
            
        return json.loads(config['twilio_config'])
    
    def make_outbound_call(self, twilio_config, to_number, callback_url):
        """Initiate an outbound call using Twilio"""
        # Initialize Twilio client with user's credentials
        client = self.get_client(twilio_config.get('accountSid'), twilio_config.get('authToken'))
        
        # Make the outbound call
        call = client.calls.create(
            url=callback_url,
            to=to_number,
            from_=twilio_config.get('phoneNumber'),
            status_callback=callback_url.replace('outbound-call', 'call/status')
        )
        
        return call.sid

    def handle_outbound_call(self, user_id, call_sid):
        """Generate TwiML for an outbound call when answered"""
        # Get the user's script for outbound greeting
        conn = sqlite3.connect('voiceai.db')
        conn.row_factory = sqlite3.Row
        script = conn.execute('SELECT script_content FROM scripts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', (user_id,)).fetchone()
        conn.close()
        
        # Set a default outbound greeting
        greeting = "Hello, this is an automated call from our AI assistant. How can I help you today?"
        
        if script:
            # Parse the script to get the outbound greeting
            script_content = json.loads(script['script_content'])
            greeting = script_content.get('outboundGreeting', greeting)
        
        # Generate the TwiML response
        return self.generate_twiml_response(greeting)
    
    
    def generate_twiml_response(self, message, gather_speech=True):
        """Generate TwiML response for Twilio"""
        response = VoiceResponse()
        
        # Add the spoken message
        response.say(message)
        
        # If we want to gather the caller's response
        if gather_speech:
            # Make sure this action URL matches the endpoint in your Flask app
            gather = Gather(
                input='speech',
                action='/api/webhook/voice',  # Should match your Flask route
                method='POST',
                speechTimeout='auto',
                speechModel='phone_call',
                enhanced=True
            )
            response.append(gather)
            
            # If no input is received after gather completes, say goodbye and hang up
            response.say("I didn't receive any input. Goodbye.")
            response.hangup()
        else:
            # If we don't want to gather speech (e.g., ending the call)
            response.hangup()
                
        return str(response)

    def start_conversation(self, user_id, call_sid, from_number, to_number):
        """Start a conversation when a call comes in"""
        # Get the user's script for initial greeting
        conn = sqlite3.connect('voiceai.db')
        conn.row_factory = sqlite3.Row
        script = conn.execute('SELECT script_content FROM scripts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', (user_id,)).fetchone()
        conn.close()
        
        # Set a default greeting if no script is found
        greeting = "Hello, thank you for calling. How can I assist you today?"
        
        if script:
            # Parse the script to get the initial greeting
            script_content = json.loads(script['script_content'])
            greeting = script_content.get('greeting', greeting)
        
        # Generate the TwiML response
        return self.generate_twiml_response(greeting)
    
    def send_sms_confirmation(self, user_id, to_number, message):
        """Send an SMS confirmation for scheduled appointments"""
        # Get the user's Twilio configuration
        twilio_config = self.get_user_twilio_config(user_id)
        
        if not twilio_config:
            return False
            
        # Initialize the Twilio client
        client = self.get_client(twilio_config.get('accountSid'), twilio_config.get('authToken'))
        
        # Send the SMS
        try:
            client.messages.create(
                body=message,
                from_=twilio_config.get('phoneNumber'),
                to=to_number
            )
            return True
        except Exception as e:
            print(f"Error sending SMS: {e}")
            return False
