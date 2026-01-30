#!/bin/bash

# 1. Start SSH Tunnel in Background
echo "Starting SSH Tunnel..."
pkill -f "ssh -R 80:localhost:8000" # Kill old tunnel
nohup ssh -R 80:localhost:8000 nokey@localhost.run > tunnel.log 2>&1 &
TUNNEL_PID=$!

# 2. Wait for URL to appear in log
echo "Waiting for URL generation..."
sleep 3
# Extract URL (looking for https:// something .lhr.life or typical localhost.run output)
NEW_URL=$(grep -o 'https://[^ ]*\.lhr\.life' tunnel.log | head -n 1)

if [ -z "$NEW_URL" ]; then
    echo "Failed to grab URL. Retrying with broader pattern..."
    sleep 2
    NEW_URL=$(grep -o 'https://[^ ]*\.lhr\.life' tunnel.log | head -n 1)
fi

if [ -z "$NEW_URL" ]; then
    echo "ERROR: Could not find tunnel URL in logs."
    cat tunnel.log
    exit 1
fi

echo "Tunnel Live at: $NEW_URL"

# 3. Update .env file
ENV_FILE=".env"
KEY="PUBLIC_TUNNEL_URL"

# Check if key exists
if grep -q "^$KEY=" "$ENV_FILE"; then
    # Helper to escape slashes for sed
    ESCAPED_URL=$(printf '%s\n' "$NEW_URL" | sed -e 's/[\/&]/\\&/g')
    # Replace existing line
    sed -i "s/^$KEY=.*/$KEY=$ESCAPED_URL/" "$ENV_FILE"
else
    # Append if missing
    echo "$KEY=$NEW_URL" >> "$ENV_FILE"
fi

echo "Updated $ENV_FILE with new URL."
echo "You can now run: python3 manage.py runserver"
