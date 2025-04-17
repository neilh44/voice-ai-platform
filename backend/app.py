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


# Service imports
from services.twilio_service import TwilioService
from services.llm_service import LLMService
from services.deepgram_service import DeepgramService
from services.knowledge_service import KnowledgeService

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

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


if __name__ == '__main__':
    app.run(debug=True)
