
import requests
import json

url = "http://127.0.0.1:8000/api/orders/push/test/"
payload = {"token_number": 10}

try:
    print(f"Sending POST to {url} with {payload}")
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}")
    try:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except:
        print("Response Text:")
        print(response.text)
        
except Exception as e:
    print(f"Connection Failed: {e}")
    print("Is the server running on port 8000?")
