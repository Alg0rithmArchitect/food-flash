from django.apps import AppConfig


class OrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'orders'

    def ready(self):
        import orders.signals
        import os
        import threading
        import subprocess
        import re
        from django.conf import settings
        
        # Define the tunnel function
        def start_ssh_tunnel():
            # Command to forward port 8000 to localhost.run
            # -o StrictHostKeyChecking=no: Auto-accept host key
            # -o ServerAliveInterval=60: Keep connection alive
            # -R 80:localhost:8000: Forward remote port 80 to local 8000
            cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=60", "-R", "80:localhost:8000", "nokey@localhost.run"]
            
            print("🚀 Starting SSH Tunnel (localhost.run)...")
            try:
                # Run SSH process
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT, # Merge stderr to stdout
                    text=True,
                    bufsize=1 # Line buffered
                )
                
                # Monitor output for URL
                for line in process.stdout:
                    # Look for https link in output
                    # Output format: "Connect to https://xyz.lhr.life ..."
                    match = re.search(r'(https://[a-zA-Z0-9-]+\.lhr\.life)', line)
                    if match:
                        public_url = match.group(1)
                        settings.PUBLIC_TUNNEL_URL = public_url
                        print(f"✅ SSH Tunnel Active: {public_url}")
                        # Keep process running, but we don't need to parse anymore. 
                        # In a real app we might want to keep monitoring for disconnects, 
                        # but for this simple use case, just letting it run is fine.
                        # We can break or continue consuming output to prevent buffer fill
                    
            except Exception as e:
                print(f"⚠️ SSH Tunnel failed: {e}")

        # Check if running as main server (avoid reloader dupes)
        if os.environ.get('RUN_MAIN') == 'true':
            # Start in background thread
            t = threading.Thread(target=start_ssh_tunnel)
            t.daemon = True # Kill thread if main process dies
            t.start()
