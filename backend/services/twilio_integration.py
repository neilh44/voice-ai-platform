# twilio_integration.py
from flask import Blueprint, jsonify, current_app, request
from twilio.rest import Client
import os
from datetime import datetime, timedelta
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blueprint for Twilio routes
twilio_bp = Blueprint('twilio', __name__, url_prefix='/api/twilio')

def get_twilio_client():
    """Get a Twilio client instance using environment variables or config."""
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID') or current_app.config.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN') or current_app.config.get('TWILIO_AUTH_TOKEN')
    
    if not account_sid or not auth_token:
        raise ValueError("Twilio credentials not found")
    
    return Client(account_sid, auth_token)

@twilio_bp.route('/stats/<user_id>', methods=['GET'])
def get_twilio_stats(user_id):
    """Get Twilio statistics for dashboard."""
    try:
        client = get_twilio_client()
        
        # Get current date info
        today = datetime.now().strftime('%Y-%m-%d')
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
        
        # Fetch calls from today
        today_calls = client.calls.list(
            start_time_after=datetime.fromisoformat(today),
            limit=100
        )
        calls_today = len(today_calls)
        
        # Fetch calls from this month
        month_calls = client.calls.list(
            start_time_after=datetime.fromisoformat(month_start),
            limit=1000  # Adjust as needed
        )
        calls_this_month = len(month_calls)
        
        # Get recent calls (last 5)
        recent_calls = client.calls.list(limit=5)
        formatted_recent_calls = []
        
        for call in recent_calls:
            formatted_recent_calls.append({
                'sid': call.sid,
                'from': call.from_,
                'to': call.to,
                'status': call.status,
                'direction': call.direction,
                'duration': call.duration or 0,
                'startTime': call.start_time.isoformat() if call.start_time else None,
                'endTime': call.end_time.isoformat() if call.end_time else None,
                'price': call.price or '0'
            })
        
        # Check if we have configuration data for the user
        # In a real implementation, this would be stored in a config table
        # Here we'll mock this data
        
        # Get recordings
        recordings = []
        for call in recent_calls[:2]:  # Get recordings for first two calls
            try:
                call_recordings = client.recordings.list(call_sid=call.sid)
                for recording in call_recordings:
                    recordings.append({
                        'sid': recording.sid,
                        'duration': recording.duration,
                        'url': f"https://api.twilio.com/2010-04-01/Accounts/{client.account_sid}/Recordings/{recording.sid}.mp3"
                    })
            except Exception as e:
                logger.error(f"Error fetching recordings for call {call.sid}: {str(e)}")
        
        # Check if any phone numbers are configured
        phone_numbers = client.incoming_phone_numbers.list(limit=20)
        
        # Generate response
        response = {
            'accountConfigured': len(phone_numbers) > 0,
            'llmConfigured': True,  # Mock data
            'deepgramConfigured': True,  # Mock data
            'calls': {
                'today': calls_today,
                'month': calls_this_month
            },
            'recentCalls': formatted_recent_calls,
            'recordings': recordings,
            'appointments': {
                'today': 0,  # Mock data
                'upcoming': 0  # Mock data
            },
            'recentAppointments': [],  # Mock data
            'knowledgeBaseCount': 1,  # Mock data
            'scriptCount': 1  # Mock data
        }
        
        return jsonify(response), 200
        
    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        return jsonify({
            'error': str(e),
            'details': 'Twilio credentials not properly configured'
        }), 400
        
    except Exception as e:
        logger.error(f"Error getting Twilio stats: {str(e)}")
        return jsonify({
            'error': f"Failed to get Twilio stats: {str(e)}"
        }), 500

# Add mock endpoint for testing without Twilio credentials
@twilio_bp.route('/mock-stats/<user_id>', methods=['GET'])
def get_mock_twilio_stats(user_id):
    """Get mock Twilio statistics for testing."""
    try:
        # Generate mock timestamp
        now = datetime.now()
        yesterday = now - timedelta(days=1)
        
        mock_data = {
            'accountConfigured': True,
            'llmConfigured': True,
            'deepgramConfigured': True,
            'calls': {
                'today': 3,
                'month': 12
            },
            'recentCalls': [
                {
                    'sid': 'CA1234567890abcdef1234567890abcdef',
                    'from': '+15551234567',
                    'to': '+15559876543',
                    'status': 'completed',
                    'direction': 'inbound',
                    'duration': 125,
                    'startTime': (now - timedelta(hours=2)).isoformat(),
                    'endTime': (now - timedelta(hours=2, minutes=-2, seconds=-5)).isoformat(),
                    'price': '-0.0075'
                },
                {
                    'sid': 'CA2345678901abcdef2345678901abcdef',
                    'from': '+15552345678',
                    'to': '+15559876543',
                    'status': 'completed',
                    'direction': 'inbound',
                    'duration': 83,
                    'startTime': yesterday.isoformat(),
                    'endTime': (yesterday + timedelta(minutes=1, seconds=23)).isoformat(),
                    'price': '-0.0050'
                },
                {
                    'sid': 'CA3456789012abcdef3456789012abcdef',
                    'from': '+15553456789',
                    'to': '+15559876543',
                    'status': 'no-answer',
                    'direction': 'inbound',
                    'duration': 0,
                    'startTime': (yesterday - timedelta(days=1)).isoformat(),
                    'endTime': None,
                    'price': '0'
                }
            ],
            'recordings': [
                {
                    'sid': 'RE1234567890abcdef1234567890abcdef',
                    'duration': 125,
                    'url': 'https://example.com/recording1.mp3'
                },
                {
                    'sid': 'RE2345678901abcdef2345678901abcdef',
                    'duration': 83,
                    'url': 'https://example.com/recording2.mp3'
                }
            ],
            'appointments': {
                'today': 1,
                'upcoming': 3
            },
            'recentAppointments': [
                {
                    'id': 'apt-1',
                    'customerName': 'John Smith',
                    'phoneNumber': '+15551234567',
                    'appointmentDate': now.strftime('%Y-%m-%d'),
                    'appointmentTime': '14:30:00'
                },
                {
                    'id': 'apt-2',
                    'customerName': 'Jane Doe',
                    'phoneNumber': '+15552345678',
                    'appointmentDate': (now + timedelta(days=1)).strftime('%Y-%m-%d'),
                    'appointmentTime': '10:00:00'
                },
                {
                    'id': 'apt-3',
                    'customerName': 'Alice Johnson',
                    'phoneNumber': '+15553456789',
                    'appointmentDate': (now + timedelta(days=2)).strftime('%Y-%m-%d'),
                    'appointmentTime': '16:15:00'
                }
            ],
            'knowledgeBaseCount': 2,
            'scriptCount': 3
        }
        
        return jsonify(mock_data), 200
        
    except Exception as e:
        logger.error(f"Error generating mock data: {str(e)}")
        return jsonify({
            'error': f"Failed to generate mock data: {str(e)}"
        }), 500