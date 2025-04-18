import requests

# Your Sutra API key
SUTRA_API_KEY = "sutra_Qd2BxV3XwNAgZY_UVMmOEqmHTbDLPWCu46Luc3jAxtTRg1YQsEPJB0fnIJww"

# API endpoint
API_URL = "https://api.two.ai/v2/chat/completions"

# Conversation history or message to send
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "भारत की राजधानी क्या है?"}
]

# Payload with the SUTRA-V2 model
payload = {
    "model": "sutra-v2",  # Make sure this matches Sutra's spec
    "messages": messages,
    "temperature": 0.7
}

# Headers with the authorization token
headers = {
    "Authorization": f"Bearer {SUTRA_API_KEY}",
    "Content-Type": "application/json"
}

# Send the request
response = requests.post(API_URL, json=payload, headers=headers)

# Handle the response
if response.status_code == 200:
    response_data = response.json()
    print("Assistant:", response_data["choices"][0]["message"]["content"])
else:
    print("Error:", response.status_code)
    print(response.text)
