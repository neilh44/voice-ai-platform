from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import uuid
import sqlite3
import json
from datetime import datetime
from twilio.twiml.voice_response import VoiceResponse
from services.twilio_routes import twilio_bp


# Service imports
from services.twilio_service import TwilioService
from services.llm_service import LLMService
from services.deepgram_service import DeepgramService
from services.knowledge_service import KnowledgeService

import logging
logger = logging.getLogger(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

 # Register the Twilio blueprint
app.register_blueprint(twilio_bp)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx', 'csv', 'json'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database setup
def get_db_connection():
    conn = sqlite3.connect('voiceai.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    with open('schema.sql') as f:
        conn.executescript(f.read())
    conn.close()

# Initialize database tables if they don't exist
init_db()

# Helper functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize services
twilio_service = TwilioService()
llm_service = LLMService()
deepgram_service = DeepgramService()
knowledge_service = KnowledgeService()

# Routes
@app.route('/api/user/config', methods=['POST'])
def save_user_config():
    data = request.json
    
    # Extract configuration data
    user_id = data.get('userId')
    twilio_config = data.get('twilioConfig', {})
    llm_config = data.get('llmConfig', {})
    deepgram_config = data.get('deepgramConfig', {})
    
    # Validate required fields
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    # Save to database
    conn = get_db_connection()
    conn.execute(
        """
        INSERT OR REPLACE INTO user_config 
        (user_id, twilio_config, llm_config, deepgram_config) 
        VALUES (?, ?, ?, ?)
        """, 
        (user_id, json.dumps(twilio_config), json.dumps(llm_config), json.dumps(deepgram_config))
    )
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Configuration saved successfully"})

@app.route('/api/user/config/<user_id>', methods=['GET'])
def get_user_config(user_id):
    conn = get_db_connection()
    config = conn.execute('SELECT * FROM user_config WHERE user_id = ?', (user_id,)).fetchone()
    conn.close()
    
    if not config:
        return jsonify({"error": "Configuration not found"}), 404
        
    return jsonify({
        "userId": config['user_id'],
        "twilioConfig": json.loads(config['twilio_config']),
        "llmConfig": json.loads(config['llm_config']),
        "deepgramConfig": json.loads(config['deepgram_config'])
    })

@app.route('/api/knowledge/upload', methods=['POST'])
def upload_knowledge_base():
    # Check if user ID is provided
    user_id = request.form.get('userId')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    # Check if file is provided
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        # Create a unique filename
        filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{unique_id}_{filename}")
        
        # Save the file
        file.save(file_path)
        
        # Process and store in knowledge base
        kb_name = request.form.get('kbName', 'Default Knowledge Base')
        
        # Parse the file and extract knowledge
        knowledge_service.process_document(file_path, user_id, kb_name)
        
        # Save metadata to database
        conn = get_db_connection()
        conn.execute(
            """
            INSERT INTO knowledge_base 
            (user_id, kb_name, file_path, original_filename, created_at) 
            VALUES (?, ?, ?, ?, ?)
            """, 
            (user_id, kb_name, file_path, filename, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True, 
            "message": "Knowledge base uploaded and processed",
            "filename": filename,
            "kbName": kb_name
        })
    
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/scripts', methods=['POST'])
def save_script():
    data = request.json
    
    # Extract script data
    user_id = data.get('userId')
    script_name = data.get('scriptName')
    script_content = data.get('scriptContent')
    
    # Validate required fields
    if not all([user_id, script_name, script_content]):
        return jsonify({"error": "All fields are required"}), 400
    
    # Save to database
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO scripts
        (user_id, script_name, script_content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_id, script_name, script_content, datetime.now().isoformat(), datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Script saved successfully"})

@app.route('/api/scripts/<user_id>', methods=['GET'])
def get_scripts(user_id):
    conn = get_db_connection()
    scripts = conn.execute('SELECT * FROM scripts WHERE user_id = ?', (user_id,)).fetchall()
    conn.close()
    
    result = []
    for script in scripts:
        result.append({
            "id": script['id'],
            "scriptName": script['script_name'],
            "scriptContent": script['script_content'],
            "createdAt": script['created_at'],
            "updatedAt": script['updated_at']
        })
        
    return jsonify(result)

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    data = request.json
    
    # Extract appointment data
    user_id = data.get('userId')
    customer_name = data.get('customerName')
    customer_phone = data.get('customerPhone')
    appointment_date = data.get('appointmentDate')
    appointment_time = data.get('appointmentTime')
    notes = data.get('notes', '')
    
    # Validate required fields
    if not all([user_id, customer_name, customer_phone, appointment_date, appointment_time]):
        return jsonify({"error": "Required fields are missing"}), 400
    
    # Save to database
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO appointments
        (user_id, customer_name, customer_phone, appointment_date, appointment_time, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, customer_name, customer_phone, appointment_date, appointment_time, notes, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    
    # Send confirmation via Twilio (optional)
    
    return jsonify({"success": True, "message": "Appointment scheduled successfully"})

@app.route('/api/appointments/<user_id>', methods=['GET'])
def get_appointments(user_id):
    conn = get_db_connection()
    appointments = conn.execute('SELECT * FROM appointments WHERE user_id = ?', (user_id,)).fetchall()
    conn.close()
    
    result = []
    for appointment in appointments:
        result.append({
            "id": appointment['id'],
            "customerName": appointment['customer_name'],
            "customerPhone": appointment['customer_phone'],
            "appointmentDate": appointment['appointment_date'],
            "appointmentTime": appointment['appointment_time'],
            "notes": appointment['notes'],
            "createdAt": appointment['created_at']
        })
        
    return jsonify(result)


@app.route('/api/webhook/call', methods=['POST'])
def handle_incoming_call():
    """Handle incoming Twilio voice calls"""
    # Extract call data from Twilio's request
    call_sid = request.form.get('CallSid')
    from_number = request.form.get('From')
    to_number = request.form.get('To')
    
    # Get user configuration based on the Twilio number
    conn = get_db_connection()
    user = conn.execute(
        'SELECT user_id FROM user_config WHERE json_extract(twilio_config, "$.phoneNumber") = ?', 
        (to_number,)
    ).fetchone()
    
    if not user:
        # If no user is configured for this number, return generic message
        return twilio_service.generate_twiml_response("This phone number is not configured properly. Goodbye.", gather_speech=False)
    
    user_id = user['user_id']
    
    # Initialize call context using the LLM service
    llm_service.initialize_call_context(call_sid, user_id, from_number)
    
    # Start the conversation with the AI
    response = twilio_service.start_conversation(user_id, call_sid, from_number, to_number)
    
    conn.close()
    return response

@app.route('/api/webhook/call/status', methods=['POST'])
def handle_call_status():
    """Handle Twilio call status callbacks"""
    call_sid = request.form.get('CallSid')
    call_status = request.form.get('CallStatus')
    
    # Log the call status
    print(f"Call {call_sid} status: {call_status}")
    
    # If call ended, clean up any resources
    if call_status in ['completed', 'busy', 'failed', 'no-answer', 'canceled']:
        # Clean up any session data
        pass
    
    return '', 204

@app.route('/api/webhook/voice', methods=['POST'])
def handle_voice_input():
    """Process voice input from a call in progress"""
    call_sid = request.form.get('CallSid')
    speech_result = request.form.get('SpeechResult')
    
    # Process the speech with the LLM
    response_text = llm_service.process_user_input(call_sid, speech_result)
    
    # Convert response to speech and return TwiML
    return twilio_service.generate_twiml_response(response_text)

@app.route('/api/webhook/outbound-call', methods=['POST'])
def handle_outbound_call():
    """Handle outbound calls when answered"""
    # Extract call data from Twilio's request
    call_sid = request.form.get('CallSid')
    from_number = request.form.get('From')  # This will be your Twilio number
    to_number = request.form.get('To')      # The number being called
    
    # Debug log
    print(f"Outbound call webhook received: From={from_number}, To={to_number}, CallSid={call_sid}")
    
    # Get the first available user configuration
    conn = get_db_connection()
    user = conn.execute('SELECT user_id FROM user_config LIMIT 1').fetchone()
    conn.close()
    
    if not user:
        # If no user configuration exists at all
        return twilio_service.generate_twiml_response(
            "No configuration found. Please set up the system first. Goodbye.",
            gather_speech=False
        )
    
    user_id = user['user_id']
    print(f"Using configuration for user {user_id}")
    
    # Initialize call context
    llm_service.initialize_call_context(call_sid, user_id, to_number)
    
    # Use a default greeting for all outbound calls
    response = VoiceResponse()
    
    # Gather speech input
    gather = response.gather(
        input='speech',
        action='/api/webhook/voice',
        method='POST',
        speechTimeout='auto',
        speechModel='phone_call'
    )
    
    # Initial greeting inside the gather
    gather.say("Hello, this is an AI assistant calling. How can I help you today?", voice='Polly.Joanna')
    
    # If no input is received after the gather completes
    response.say("I didn't hear anything. Goodbye.", voice='Polly.Joanna')
    response.hangup()
    
    return str(response)


@app.route('/api/calls/outbound', methods=['POST'])
def make_outbound_call():
    """Initiate an outbound call to a phone number"""
    data = request.json
    
    # Extract required data
    user_id = data.get('userId')
    to_number = data.get('toNumber')
    
    if not user_id or not to_number:
        return jsonify({"error": "User ID and phone number are required"}), 400
    
    # Get user's Twilio configuration
    conn = get_db_connection()
    config = conn.execute('SELECT twilio_config FROM user_config WHERE user_id = ?', (user_id,)).fetchone()
    conn.close()
    
    if not config:
        return jsonify({"error": "User configuration not found"}), 404
    
    twilio_config = json.loads(config['twilio_config'])
    
    # Initiate the call
    try:
        call_sid = twilio_service.make_outbound_call(
            twilio_config,
            to_number,
            f"https://{request.headers.get('Host')}/api/webhook/outbound-call"
        )
        
        return jsonify({
            "success": True,
            "message": "Call initiated successfully",
            "callSid": call_sid
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/webhook/speech', methods=['POST'])
def handle_speech():
    # Get speech input
    speech_result = request.values.get('SpeechResult', '')
    call_sid = request.values.get('CallSid', '')
    
    print(f"Speech received: {speech_result}")
    
    # Process with LLM service
    llm_response = llm_service.process_user_input(call_sid, speech_result)
    
    # Create TwiML response
    response = VoiceResponse()
    gather = response.gather(
        input='speech',
        action='/api/webhook/speech',
        method='POST',
        speechTimeout='auto',
        speechModel='phone_call'
    )
    
    # Have AI respond
    gather.say(llm_response, voice='Polly.Joanna')
    
    return str(response)

def process_with_llm(user_input):
    # This is a placeholder for your actual LLM integration
    # You would call your LLM service here
    return f"I understood you said: {user_input}. How can I help with that?"


# Add these routes to app.py

@app.route('/api/dashboard/summary/<user_id>', methods=['GET', 'OPTIONS'])
def get_dashboard_summary(user_id):
    """Get dashboard summary data for a user"""
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response

    try:
        # Check if user exists
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM user_config WHERE user_id = ?', (user_id,)).fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get user configuration details
        twilio_config = json.loads(user['twilio_config'])
        llm_config = json.loads(user['llm_config'])
        deepgram_config = json.loads(user['deepgram_config'])
        
        # Check if configurations are properly set up
        twilioConfigured = ('accountSid' in twilio_config and 
                           'authToken' in twilio_config and 
                           'phoneNumber' in twilio_config)
        
        llmConfigured = ('provider' in llm_config and 
                         'model' in llm_config and 
                         'apiKey' in llm_config)
        
        deepgramConfigured = ('apiKey' in deepgram_config)
        
        # Get knowledge base count
        kb_count = conn.execute(
            'SELECT COUNT(*) as count FROM knowledge_base WHERE user_id = ?', 
            (user_id,)
        ).fetchone()['count']
        
        # Get script count
        script_count = conn.execute(
            'SELECT COUNT(*) as count FROM scripts WHERE user_id = ?', 
            (user_id,)
        ).fetchone()['count']
        
        # Get call statistics
        today = datetime.now().strftime('%Y-%m-%d')
        month_start = datetime.now().strftime('%Y-%m-01')
        
        calls_today = conn.execute(
            """
            SELECT COUNT(*) as count FROM active_calls 
            WHERE user_id = ? AND DATE(started_at) = ?
            """,
            (user_id, today)
        ).fetchone()['count']
        
        calls_this_month = conn.execute(
            """
            SELECT COUNT(*) as count FROM active_calls 
            WHERE user_id = ? AND DATE(started_at) >= ?
            """,
            (user_id, month_start)
        ).fetchone()['count']
        
        # Get appointment statistics
        appointments_today = conn.execute(
            """
            SELECT COUNT(*) as count FROM appointments 
            WHERE user_id = ? AND appointment_date = ?
            """,
            (user_id, today)
        ).fetchone()['count']
        
        upcoming_appointments = conn.execute(
            """
            SELECT COUNT(*) as count FROM appointments 
            WHERE user_id = ? AND (
                appointment_date > ? OR 
                (appointment_date = ? AND appointment_time > ?)
            )
            """,
            (user_id, today, today, datetime.now().strftime('%H:%M'))
        ).fetchone()['count']
        
        # Get recent calls
        recent_calls = conn.execute(
            """
            SELECT 
                call_sid as id, 
                started_at as startedAt, 
                completed_at, 
                status as outcome, 
                context
            FROM active_calls 
            WHERE user_id = ? 
            ORDER BY started_at DESC LIMIT 5
            """,
            (user_id,)
        ).fetchall()
        
        # Format recent calls
        formatted_calls = []
        for call in recent_calls:
            call_dict = dict(call)
            
            # Parse the context to get more information
            context_data = json.loads(call_dict['context'])
            
            # Calculate duration if call is completed
            duration = None
            if call_dict['completed_at']:
                start_time = datetime.fromisoformat(call_dict['startedAt'])
                end_time = datetime.fromisoformat(call_dict['completed_at'])
                duration = (end_time - start_time).total_seconds()
            
            formatted_calls.append({
                'id': call_dict['id'],
                'startedAt': call_dict['startedAt'],
                'duration': duration or 0,
                'outcome': call_dict['outcome'],
                'fromNumber': context_data.get('customer_number', 'Unknown')
            })
        
        # Get recent appointments
        recent_appointments = conn.execute(
            """
            SELECT 
                id, 
                customer_name as customerName, 
                customer_phone as customerPhone, 
                appointment_date as appointmentDate, 
                appointment_time as appointmentTime, 
                notes, 
                created_at as createdAt
            FROM appointments 
            WHERE user_id = ? 
            ORDER BY appointment_date ASC, appointment_time ASC 
            LIMIT 5
            """,
            (user_id,)
        ).fetchall()
        
        # Format recent appointments
        formatted_appointments = [dict(appointment) for appointment in recent_appointments]
        
        # Assemble the dashboard summary
        summary = {
            'configurationComplete': twilioConfigured and llmConfigured,
            'twilioConfigured': twilioConfigured,
            'llmConfigured': llmConfigured,
            'deepgramConfigured': deepgramConfigured,
            'callsToday': calls_today,
            'callsThisMonth': calls_this_month,
            'appointmentsToday': appointments_today,
            'upcomingAppointments': upcoming_appointments,
            'knowledgeBaseCount': kb_count,
            'scriptCount': script_count,
            'recentCalls': formatted_calls,
            'recentAppointments': formatted_appointments
        }
        
        conn.close()
        
        # Return the dashboard summary
        response = jsonify(summary)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        logger.error(f"Error getting dashboard summary: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500



# Enhanced Twilio Call Logs with Transcriptions and Recordings

from twilio.rest import Client
import os
from datetime import datetime, timedelta
import json

@app.route('/api/call-logs/<username>', methods=['GET'])
def get_call_logs(username):
    try:
        # Get Twilio credentials from environment variables
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        
        if not account_sid or not auth_token:
            logging.error("Twilio credentials not set in environment variables")
            return jsonify({"error": "Twilio credentials not configured"}), 500
        
        # Initialize Twilio client
        client = Client(account_sid, auth_token)
        
        # Get calls from the past 30 days (adjust as needed)
        date_filter = datetime.now() - timedelta(days=30)
        date_str = date_filter.strftime('%Y-%m-%d')
        
        # Query Twilio API for calls
        calls_data = client.calls.list(start_time_after=date_str)
        
        # Transform Twilio call data to match your frontend expectations
        calls = []
        for call in calls_data:
            # Extract phone number with proper formatting
            phone_number = call.to if call.direction == 'outbound-api' else call.from_
            
            # Calculate duration in seconds
            duration = int(call.duration) if call.duration else 0
            
            # Map Twilio call status to your app's status format
            status_map = {
                'queued': 'queued',
                'ringing': 'ringing',
                'in-progress': 'in-progress',
                'completed': 'completed',
                'busy': 'failed',
                'failed': 'failed',
                'no-answer': 'failed',
                'canceled': 'failed'
            }
            status = status_map.get(call.status, call.status)
            
            # Format created timestamp
            created_at = call.date_created.strftime('%Y-%m-%dT%H:%M:%S') if call.date_created else ''
            
            # Build call record
            call_record = {
                'id': call.sid,
                'phone_number': phone_number,
                'created_at': created_at,
                'status': status,
                'duration': str(duration),
                'recording_url': '',
                'transcript': '',
                'notes': ''
            }
            
            # Try to get recording and transcription if available
            try:
                # Get recordings for this call
                recordings = client.recordings.list(call_sid=call.sid)
                
                if recordings:
                    # Get the latest recording
                    recording = recordings[0]
                    
                    # Set the recording URL
                    # Using the .mp3 format for broader compatibility
                    call_record['recording_url'] = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Recordings/{recording.sid}.mp3"
                    
                    # Get transcriptions for this recording
                    transcriptions = client.transcriptions.list(recording_sid=recording.sid)
                    
                    if transcriptions:
                        # Get the latest transcription
                        transcription = transcriptions[0]
                        
                        # Fetch the transcription text
                        transcription_text = client.transcriptions(transcription.sid).fetch().transcription_text
                        
                        # Set the transcript
                        call_record['transcript'] = transcription_text
            except Exception as e:
                logging.error(f"Error getting recording/transcription for call {call.sid}: {str(e)}")
            
            # Get any notes from your database if you store them
            try:
                conn = sqlite3.connect('voice_ai.db')
                cursor = conn.cursor()
                
                # Check if notes table exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='call_notes'")
                if cursor.fetchone():
                    cursor.execute("SELECT notes FROM call_notes WHERE call_sid = ?", (call.sid,))
                    note_row = cursor.fetchone()
                    
                    if note_row:
                        call_record['notes'] = note_row[0]
                
                conn.close()
            except Exception as e:
                logging.error(f"Error fetching notes for call {call.sid}: {str(e)}")
            
            calls.append(call_record)
        
        logging.info(f"Retrieved {len(calls)} calls with recordings and transcriptions from Twilio for user {username}")
        return jsonify(calls)
        
    except Exception as e:
        logging.error(f"Error getting Twilio call logs: {str(e)}")
        
        # For development/testing, return sample data if Twilio API fails
        sample_calls = [
            {
                'id': 'CA123456789012345678901234567890ab',
                'phone_number': '+1234567890',
                'created_at': '2025-04-17T10:30:00',
                'status': 'completed',
                'duration': '120',
                'recording_url': 'https://example.com/recording1.mp3',
                'transcript': 'Hello, this is a sample transcription of the first call. I\'m interested in learning more about your services.',
                'notes': 'Follow up next week'
            },
            {
                'id': 'CA098765432109876543210987654321ba',
                'phone_number': '+0987654321',
                'created_at': '2025-04-16T14:45:00',
                'status': 'completed',
                'duration': '180',
                'recording_url': 'https://example.com/recording2.mp3',
                'transcript': 'Yes, I would like to schedule a demo of your premium plan. What times are available next week?',
                'notes': 'Client interested in premium plan'
            },
            {
                'id': 'CA567890123456789012345678901234cd',
                'phone_number': '+1122334455',
                'created_at': '2025-04-15T09:15:00',
                'status': 'failed',
                'duration': '0',
                'recording_url': '',
                'transcript': '',
                'notes': 'Call failed to connect'
            }
        ]
        logging.info("Error communicating with Twilio. Returning sample call data as fallback")
        return jsonify(sample_calls)

# Endpoint to save notes for a call
@app.route('/api/call-notes', methods=['POST'])
def save_call_notes():
    try:
        data = request.json
        call_sid = data.get('call_sid')
        notes = data.get('notes')
        
        if not call_sid or not notes:
            return jsonify({"error": "Missing call_sid or notes"}), 400
            
        conn = sqlite3.connect('voice_ai.db')
        cursor = conn.cursor()
        
        # Create call_notes table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS call_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                call_sid TEXT NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert or update notes
        cursor.execute('''
            INSERT INTO call_notes (call_sid, notes)
            VALUES (?, ?)
            ON CONFLICT(call_sid) DO UPDATE SET notes = ?
        ''', (call_sid, notes, notes))
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Notes saved successfully"})
        
    except Exception as e:
        logging.error(f"Error saving call notes: {str(e)}")
        return jsonify({"error": str(e)}), 500


# Add these Flask endpoints to handle recording and transcription webhooks

@app.route('/api/webhook/recording-status', methods=['POST'])
def recording_status_webhook():
    """Handle recording status callback from Twilio"""
    try:
        # Extract data from the request
        call_sid = request.form.get('CallSid')
        recording_sid = request.form.get('RecordingSid')
        recording_url = request.form.get('RecordingUrl')
        recording_status = request.form.get('RecordingStatus')
        
        logging.info(f"Recording status update: {recording_status} for call {call_sid}")
        
        # Store recording information in the database
        if recording_status == 'completed':
            conn = sqlite3.connect('voiceai.db')
            cursor = conn.cursor()
            
            # Create recordings table if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS recordings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    call_sid TEXT NOT NULL,
                    recording_sid TEXT NOT NULL,
                    recording_url TEXT,
                    duration INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Insert the recording info
            cursor.execute('''
                INSERT INTO recordings (call_sid, recording_sid, recording_url)
                VALUES (?, ?, ?)
            ''', (call_sid, recording_sid, recording_url))
            
            conn.commit()
            conn.close()
            
            logging.info(f"Stored recording information for call {call_sid}")
        
        # Always return a success response to Twilio
        return '', 204
        
    except Exception as e:
        logging.error(f"Error handling recording status: {str(e)}")
        return '', 500

@app.route('/api/webhook/transcription', methods=['POST'])
def transcription_webhook():
    """Handle transcription callback from Twilio"""
    try:
        # Extract data from the request
        call_sid = request.form.get('CallSid')
        recording_sid = request.form.get('RecordingSid')
        transcription_sid = request.form.get('TranscriptionSid')
        transcription_text = request.form.get('TranscriptionText')
        transcription_status = request.form.get('TranscriptionStatus')
        
        logging.info(f"Transcription status: {transcription_status} for call {call_sid}")
        
        # Store transcription information in the database if complete
        if transcription_status == 'completed' and transcription_text:
            conn = sqlite3.connect('voiceai.db')
            cursor = conn.cursor()
            
            # Create transcriptions table if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transcriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    call_sid TEXT NOT NULL,
                    recording_sid TEXT NOT NULL,
                    transcription_sid TEXT NOT NULL,
                    transcription_text TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Insert the transcription info
            cursor.execute('''
                INSERT INTO transcriptions 
                (call_sid, recording_sid, transcription_sid, transcription_text)
                VALUES (?, ?, ?, ?)
            ''', (call_sid, recording_sid, transcription_sid, transcription_text))
            
            conn.commit()
            conn.close()
            
            logging.info(f"Stored transcription for call {call_sid}")
        
        # Always return a success response to Twilio
        return '', 204
        
    except Exception as e:
        logging.error(f"Error handling transcription: {str(e)}")
        return '', 500

    
# Knowledge Base Endpoints
@app.route('/api/knowledge/<user_id>', methods=['GET'])
def get_knowledge_bases(user_id):
    """Get all knowledge bases for a user"""
    try:
        conn = get_db_connection()
        knowledge_bases = conn.execute(
            """
            SELECT 
                id,
                kb_name as kbName,
                original_filename as originalFilename,
                created_at as createdAt
            FROM knowledge_base 
            WHERE user_id = ? 
            ORDER BY created_at DESC
            """,
            (user_id,)
        ).fetchall()
        conn.close()
        
        # Format response
        result = []
        for kb in knowledge_bases:
            result.append(dict(kb))
            
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error getting knowledge bases: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/knowledge/<int:knowledge_base_id>', methods=['DELETE'])
def delete_knowledge_base(knowledge_base_id):
    """Delete a knowledge base"""
    try:
        conn = get_db_connection()
        
        # Get file path before deletion to remove the file
        kb = conn.execute('SELECT file_path FROM knowledge_base WHERE id = ?', (knowledge_base_id,)).fetchone()
        
        if not kb:
            return jsonify({"error": "Knowledge base not found"}), 404
            
        # Delete from database
        conn.execute('DELETE FROM knowledge_base WHERE id = ?', (knowledge_base_id,))
        conn.commit()
        conn.close()
        
        # Delete file if exists
        file_path = kb['file_path']
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted knowledge base file: {file_path}")
        
        return jsonify({"success": True, "message": "Knowledge base deleted successfully"})
    except Exception as e:
        logger.error(f"Error deleting knowledge base: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

# Script Management
@app.route('/api/scripts/<int:script_id>', methods=['DELETE'])
def delete_script(script_id):
    """Delete a script"""
    try:
        conn = get_db_connection()
        
        # Check if script exists
        script = conn.execute('SELECT * FROM scripts WHERE id = ?', (script_id,)).fetchone()
        
        if not script:
            return jsonify({"error": "Script not found"}), 404
            
        # Delete from database
        conn.execute('DELETE FROM scripts WHERE id = ?', (script_id,))
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Script deleted successfully"})
    except Exception as e:
        logger.error(f"Error deleting script: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

# Appointment Management
@app.route('/api/appointments/<int:appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    """Delete an appointment"""
    try:
        conn = get_db_connection()
        
        # Check if appointment exists
        appointment = conn.execute('SELECT * FROM appointments WHERE id = ?', (appointment_id,)).fetchone()
        
        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404
            
        # Delete from database
        conn.execute('DELETE FROM appointments WHERE id = ?', (appointment_id,))
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Appointment deleted successfully"})
    except Exception as e:
        logger.error(f"Error deleting appointment: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

# Authentication Endpoints
@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    data = request.json
    
    # Extract login data
    username = data.get('username') or data.get('email')
    password = data.get('password')
    
    # Validate required fields
    if not username or not password:
        return jsonify({"error": "Username/email and password are required"}), 400
    
    try:
        # In a real application, you would verify against a users table
        # For this demo, we'll just check if the user exists in user_config
        conn = get_db_connection()
        user = conn.execute('SELECT user_id FROM user_config WHERE user_id = ?', (username,)).fetchone()
        conn.close()
        
        if not user:
            # For simplicity, if the user doesn't exist, create a basic config
            default_config = {
                'userId': username,
                'twilioConfig': {},
                'llmConfig': {},
                'deepgramConfig': {}
            }
            save_user_config_internal(default_config)
            
            logger.info(f"Created new user: {username}")
            
            # Generate a mock token (in a real app, use JWT)
            token = f"demo_token_{username}_{int(datetime.now().timestamp())}"
            
            return jsonify({
                "success": True,
                "message": "New user created",
                "token": token,
                "user": {
                    "id": username,
                    "username": username
                }
            })
        
        # For demo purposes, any password is accepted
        # In a real app, you would verify the password hash
        
        # Generate a mock token (in a real app, use JWT)
        token = f"demo_token_{username}_{int(datetime.now().timestamp())}"
        
        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user['user_id'],
                "username": user['user_id']
            }
        })
        
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return jsonify({"error": f"Authentication error: {str(e)}"}), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    data = request.json
    
    # Extract registration data
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    # Validate required fields
    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    
    try:
        # Check if user already exists
        conn = get_db_connection()
        existing_user = conn.execute('SELECT user_id FROM user_config WHERE user_id = ?', (username,)).fetchone()
        conn.close()
        
        if existing_user:
            return jsonify({"error": "Username already exists"}), 400
        
        # In a real app, you would hash the password and store user data
        # For this demo, we'll just create a basic user config
        
        default_config = {
            'userId': username,
            'twilioConfig': {},
            'llmConfig': {},
            'deepgramConfig': {}
        }
        save_user_config_internal(default_config)
        
        # Generate a mock token (in a real app, use JWT)
        token = f"demo_token_{username}_{int(datetime.now().timestamp())}"
        
        return jsonify({
            "success": True,
            "message": "Registration successful",
            "token": token,
            "user": {
                "id": username,
                "username": username,
                "email": email
            }
        })
        
    except Exception as e:
        logger.error(f"Error during registration: {str(e)}")
        return jsonify({"error": f"Registration error: {str(e)}"}), 500

# Helper function for user config (used by auth endpoints)
def save_user_config_internal(config_data):
    """Internal function to save user config"""
    user_id = config_data.get('userId')
    twilio_config = config_data.get('twilioConfig', {})
    llm_config = config_data.get('llmConfig', {})
    deepgram_config = config_data.get('deepgramConfig', {})
    
    conn = get_db_connection()
    conn.execute(
        """
        INSERT OR REPLACE INTO user_config 
        (user_id, twilio_config, llm_config, deepgram_config) 
        VALUES (?, ?, ?, ?)
        """, 
        (user_id, json.dumps(twilio_config), json.dumps(llm_config), json.dumps(deepgram_config))
    )
    conn.commit()
    conn.close()
    
    return True    
    


if __name__ == '__main__':
    app.run(debug=True)
