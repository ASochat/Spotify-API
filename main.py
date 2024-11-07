from dotenv import load_dotenv
import requests
import os
import base64
import json

load_dotenv()

client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')

def get_token():
    auth_string = client_id + ':' + client_secret
    auth_bytes = auth_string.encode('utf-8')
    auth_base64 = str(base64.b64encode(auth_bytes),'utf-8')

    url = "https://accounts.spotify.com/api/token"
    headers = {
        'Authorization': f'Basic {auth_base64}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    data = {
        'grant_type': 'client_credentials'
    }

    response = requests.post(url, headers=headers, data=data)
    json_response = json.loads(response.content)
    token = json_response['access_token']
    return token




token = get_token()
print(token)