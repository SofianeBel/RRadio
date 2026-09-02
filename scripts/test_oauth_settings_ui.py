import subprocess
import time
import os
import ctypes
from PIL import ImageGrab

user32 = ctypes.windll.user32
VK_F8 = 0x77

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

def main():
    print("=== TESTING OAUTH SETTINGS & SECURITY UI ===")
    os.makedirs("extracted_frames/test_results/oauth_ui", exist_ok=True)

    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    time.sleep(0.5)

    exe_path = os.path.abspath("src-tauri/target/debug/rradio.exe")
    proc = subprocess.Popen([exe_path])
    time.sleep(2.5)

    try:
        # 1. Open HUD
        print("[1] Opening HUD (F8)...")
        press(VK_F8, delay=1.0)

        # 2. Click Settings Gear
        print("[2] Clicking Settings Gear at (1444, 52)...")
        click(1444, 52, delay=1.2)

        # 3. Click SERVICES STREAMING tab at (1164, 240)
        print("[3] Clicking SERVICES STREAMING tab at (1164, 240)...")
        click(1164, 240, delay=1.0)

        im1 = ImageGrab.grab()
        im1.save("extracted_frames/test_results/oauth_ui/1_services_tab_with_oauth_fields.png")
        print("Captured 1_services_tab_with_oauth_fields.png")

        # 4. Click "Se connecter avec Google" without Client ID to trigger validation prompt
        # In dialog, button is at (cx + 320, cy - 140)
        cx = user32.GetSystemMetrics(0) // 2
        cy = user32.GetSystemMetrics(1) // 2
        btn_connect_x = cx + 240
        btn_connect_y = cy - 110
        print(f"[4] Clicking Connect button at ({btn_connect_x}, {btn_connect_y})...")
        click(btn_connect_x, btn_connect_y, delay=0.8)

        im2 = ImageGrab.grab()
        im2.save("extracted_frames/test_results/oauth_ui/2_oauth_error_validation_prompt.png")
        print("Captured 2_oauth_error_validation_prompt.png")

        print("=== OAUTH SETTINGS TEST COMPLETED SUCCESSFULLY ===")

    finally:
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
