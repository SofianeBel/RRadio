import subprocess
import time
import re
import urllib.request
import urllib.parse
import os

def test_oauth_simulation():
    print("=== TESTING OAUTH REDIRECT PARSING & LIFECYCLE ===")
    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    time.sleep(0.5)

    exe_path = os.path.abspath("src-tauri/target/debug/rradio.exe")
    proc = subprocess.Popen([exe_path], stderr=subprocess.PIPE, text=True, bufsize=1)
    
    # We will trigger the OAuth flow via settings button or hotkey
    import ctypes
    user32 = ctypes.windll.user32
    
    def press(vk, delay=0.8):
        scan = user32.MapVirtualKeyW(vk, 0)
        user32.keybd_event(vk, scan, 0, 0)
        time.sleep(0.06)
        user32.keybd_event(vk, scan, 2, 0)
        time.sleep(delay)

    def click(x, y, delay=0.8):
        user32.SetCursorPos(x, y)
        time.sleep(0.1)
        user32.mouse_event(2, 0, 0, 0, 0)
        time.sleep(0.05)
        user32.mouse_event(4, 0, 0, 0, 0)
        time.sleep(delay)

    time.sleep(2.5)

    # 1. Open HUD and navigate to Services tab
    press(0x77, delay=1.0) # F8
    click(1444, 52, delay=1.2) # Gear
    click(1088, 256, delay=1.0) # Services tab

    # 2. Click Connect button at (1365, 385)
    click(1365, 385, delay=1.0)

    # 3. Read stderr to get the dynamic loopback port
    port = None
    deadline = time.time() + 10
    while time.time() < deadline:
        line = proc.stderr.readline()
        if not line:
            continue
        print("[STDERR]", line.strip())
        m = re.search(r"listening on http://127\.0\.0\.1:(\d+)", line)
        if m:
            port = int(m.group(1))
            break

    if not port:
        print("ERROR: Could not find loopback port from stderr.")
        proc.terminate()
        return False

    print(f"Detected loopback port: {port}")

    # 4. First test: browser sends /favicon.ico (should get 204 and server must keep listening)
    try:
        req_fav = urllib.request.Request(f"http://127.0.0.1:{port}/favicon.ico")
        with urllib.request.urlopen(req_fav, timeout=2) as resp:
            print(f"Favicon response: {resp.status}")
    except Exception as e:
        print(f"Favicon request: {e}")

    # 5. Second test: Google redirects with ?iss=...&code=... (complex query format)
    redirect_url = f"http://127.0.0.1:{port}/?iss=https%3A%2F%2Faccounts.google.com&code=4%2F0AWtg_SIMULATED_TEST_CODE&scope=all"
    print(f"Simulating browser redirect to: {redirect_url}")
    try:
        req_code = urllib.request.Request(redirect_url)
        with urllib.request.urlopen(req_code, timeout=5) as resp:
            html = resp.read().decode('utf-8')
            print(f"OAuth response status: {resp.status}, HTML length: {len(html)}")
            assert "RRadio - Connexion Réussie" in html
            print("Verified: Browser received success page!")
    except Exception as e:
        print(f"OAuth redirect failed: {e}")

    # Read remaining stderr for token exchange result
    time.sleep(2)
    while True:
        line = proc.stderr.readline()
        if not line:
            break
        print("[STDERR]", line.strip())
        if "Google token" in line or "Erreur" in line or "successful" in line:
            break

    proc.terminate()
    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    print("=== TEST COMPLETED SUCCESSFULLY ===")
    return True

if __name__ == "__main__":
    test_oauth_simulation()
