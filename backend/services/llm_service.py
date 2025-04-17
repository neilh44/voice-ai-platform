import os
import json
import sqlite3
import httpx
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMService:
    def __init__(self):
        self.active_calls = {}  # Store active call contexts
        # Use environment variable for Groq API key
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            print("Warning: GROQ_API_KEY not found in environment variables")
    
    def get_user_llm_config(self, user_id):
        """Get LLM configuration for a user"""
        conn = sqlite3.connect('voiceai.db')
        conn.row_factory = sqlite3.Row
        config = conn.execute('SELECT llm_config FROM user_config WHERE user_id = ?', (user_id,)).fetchone()
        conn.close()
        
        if not config:
            return {"provider": "groq", "model": "llama3-8b-8192"}
            
        return json.loads(config['llm_config'])
    
    def get_call_context(self, call_sid):
        """Get the context for an active call"""
        if call_sid not in self.active_calls:
            # Retrieve call data from database if available
            conn = sqlite3.connect('voiceai.db')
            conn.row_factory = sqlite3.Row
            call_data = conn.execute('SELECT * FROM active_calls WHERE call_sid = ?', (call_sid,)).fetchone()
            conn.close()
            
            if call_data:
                self.active_calls[call_sid] = {
                    'user_id': call_data['user_id'],
                    'conversation_history': json.loads(call_data['conversation_history']),
                    'context': json.loads(call_data['context'])
                }
            else:
                # If not found, return None
                return None
                
        return self.active_calls.get(call_sid)
    
    def initialize_call_context(self, call_sid, user_id, customer_number):
        """Initialize context for a new call"""
        context = {
            'user_id': user_id,
            'customer_number': customer_number,
            'conversation_history': [],
            'context': {
                'has_appointment': False,
                'appointment_details': {},
                'customer_name': None,
                'customer_needs': [],
                'call_start_time': datetime.now().isoformat()
            }
        }
        
        self.active_calls[call_sid] = context
        
        # Save to database
        conn = sqlite3.connect('voiceai.db')
        conn.execute(
            """
            INSERT INTO active_calls
            (call_sid, user_id, conversation_history, context, started_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (call_sid, user_id, json.dumps([]), json.dumps(context['context']), context['context']['call_start_time'])
        )
        conn.commit()
        conn.close()
        
        return context
    
    def update_call_context(self, call_sid, user_input, ai_response):
        """Update the conversation history for a call"""
        context = self.get_call_context(call_sid)
        if not context:
            return
            
        # Add to conversation history
        context['conversation_history'].append({
            'role': 'user',
            'content': user_input,
            'timestamp': datetime.now().isoformat()
        })
        
        context['conversation_history'].append({
            'role': 'assistant',
            'content': ai_response,
            'timestamp': datetime.now().isoformat()
        })
        
        # Update database
        conn = sqlite3.connect('voiceai.db')
        conn.execute(
            """
            UPDATE active_calls
            SET conversation_history = ?, context = ?, updated_at = ?
            WHERE call_sid = ?
            """,
            (
                json.dumps(context['conversation_history']),
                json.dumps(context['context']),
                datetime.now().isoformat(),
                call_sid
            )
        )
        conn.commit()
        conn.close()
    
    def process_user_input(self, call_sid, user_input):
        """Process user voice input with LLM"""
        context = self.get_call_context(call_sid)
        if not context:
            return "I'm sorry, there seems to be an issue with this call. Please try again later."
            
        user_id = context['user_id']
        llm_config = self.get_user_llm_config(user_id)
        
        # Force Groq as the provider with llama3-8b-8192 model
        llm_config['provider'] = 'groq'
        llm_config['model'] = 'llama3-8b-8192'
        
        # Get relevant knowledge base content
        conn = sqlite3.connect('voiceai.db')
        conn.row_factory = sqlite3.Row
        knowledge_bases = conn.execute('SELECT * FROM knowledge_base WHERE user_id = ?', (user_id,)).fetchall()
        conn.close()
        
        knowledge_context = ""
        for kb in knowledge_bases:
            # In a real implementation, you would do vector search or similar
            # For simplicity, we're just appending knowledge base names
            knowledge_context += f"Knowledge from: {kb['kb_name']}\n"
        
        # Get the script for this user
        conn = sqlite3.connect('voiceai.db')
        conn.row_factory = sqlite3.Row
        script = conn.execute('SELECT script_content FROM scripts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', (user_id,)).fetchone()
        conn.close()
        
        script_content = {}
        if script:
            script_content = json.loads(script['script_content'])
        
        # Build the prompt for the LLM
        system_prompt = f"""
        You are an AI assistant handling a phone call. Your goal is to be helpful, concise, and natural in your conversation.
        
        Here's relevant information from the knowledge base:
        {knowledge_context}
        
        Script guidance:
        {json.dumps(script_content, indent=2)}
        
        If the caller wants to schedule an appointment, collect the following information:
        1. Their full name
        2. Preferred date and time
        3. Any specific notes or requirements
        
        Keep your responses brief and conversational, as this is for a phone call.
        """
        
        # Convert conversation history to the format expected by the LLM
        messages = [{"role": "system", "content": system_prompt}]
        
        for message in context['conversation_history'][-10:]:  # Only use last 10 messages for context
            messages.append({
                "role": message['role'],
                "content": message['content']
            })
        
        # Add the current user input
        messages.append({"role": "user", "content": user_input})
        
        # Use Groq API for all requests
        groq_api_key = llm_config.get('apiKey') or self.groq_api_key
        
        if not groq_api_key:
            print("No Groq API key found in configuration or environment")
            return "I'm sorry, the AI service is not properly configured. Please check your GROQ_API_KEY in the .env file."
            
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama3-8b-8192",
            "messages": messages,
            "max_tokens": 150,  # Keep responses concise for voice
            "temperature": 0.7
        }
        
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    response_data = response.json()
                    ai_response = response_data['choices'][0]['message']['content']
                else:
                    print(f"Error from Groq API: {response.status_code}, {response.text}")
                    ai_response = "I'm sorry, I couldn't process your request at this time."
        except Exception as e:
            print(f"Exception when calling Groq API: {str(e)}")
            ai_response = "I'm sorry, I encountered an error while processing your request."
        
        # Check for appointment scheduling intent
        if "appointment" in user_input.lower() or "schedule" in user_input.lower():
            # Update context to indicate appointment scheduling is in progress
            context['context']['has_appointment'] = True
        
        # Update the call context with this interaction
        self.update_call_context(call_sid, user_input, ai_response)
        
        return ai_response
    
    def finalize_call(self, call_sid):
        """Clean up after a call has ended"""
        if call_sid in self.active_calls:
            # Extract any important information from the call
            context = self.active_calls[call_sid]
            
            # Check if an appointment was scheduled
            if context.get('context', {}).get('has_appointment', False):
                appointment_details = context.get('context', {}).get('appointment_details', {})
                
                # Save the appointment to the database if information is complete
                if appointment_details.get('customer_name') and appointment_details.get('date') and appointment_details.get('time'):
                    conn = sqlite3.connect('voiceai.db')
                    conn.execute(
                        """
                        INSERT INTO appointments
                        (user_id, customer_name, customer_phone, appointment_date, appointment_time, notes, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            context.get('user_id'),
                            appointment_details.get('customer_name'),
                            context.get('customer_number'),
                            appointment_details.get('date'),
                            appointment_details.get('time'),
                            appointment_details.get('notes', ''),
                            datetime.now().isoformat()
                        )
                    )
                    conn.commit()
                    conn.close()
            
            # Update call status in database
            conn = sqlite3.connect('voiceai.db')
            conn.execute(
                """
                UPDATE active_calls
                SET status = 'completed', completed_at = ?
                WHERE call_sid = ?
                """,
                (datetime.now().isoformat(), call_sid)
            )
            conn.commit()
            conn.close()
            
            # Remove from active calls dictionary
            del self.active_calls[call_sid]
            
        return True