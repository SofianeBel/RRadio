import subprocess
import time
import ctypes
import os
from PIL import ImageGrab

user32 = ctypes.windll.user32

VK_MENU = 0x12     # Alt
VK_Q = 0x51        # Q
VK_V = 0x56        # V
VK_M = 0x4D        # M
VK_F8 = 0x77       # F8
VK_F9 = 0x78       # F9
VK_F10 = 0x79      # F10 (Settings)
VK_ESCAPE = 0x1B   # Esc
KEYEVENTF_KEYUP = 0x0002

def press_key(vk):
    user32.keybd_event(vk, 0, 0, 0)
    time.sleep(0.05)
    user32.keybd_event(vk, 0, KEYEVENTF_KEYUP, 0)
    time.sleep(0.1)

def capture_screen(filename):
    os.makedirs("extracted_frames/test_results", exist_ok=True)
    screen = ImageGrab.grab()
    path = f"extracted_frames/test_results/{filename}.png"
    screen.save(path)
    print(f"Captured full screen: {path}")
    return path

def main():
    print("=== STARTING GTA 6 OVERLAY & SETTINGS TEST HARNESS ===")
    
    subprocess.run(["taskkill", "/IM", "rradio.exe", "/F"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.5)

    exe_path = r"D:\RRadio\src-tauri\target\debug\rradio.exe"
    print(f"Launching: {exe_path}")
    proc = subprocess.Popen([exe_path])
    time.sleep(2.5)

    try:
        # Test 1: Press F8 (Open Radio HUD)
        print("\n[TEST 1] Pressing F8 (Toggle Overlay)...")
        press_key(VK_F8)
        time.sleep(0.8)
        capture_screen("10_radio_hud_open")

        # Test 2: Press F10 (Open GTA 6 Settings Menu)
        print("\n[TEST 2] Pressing F10 (Open GTA 6 Settings Menu)...")
        press_key(VK_F10)
        time.sleep(0.8)
        capture_screen("11_settings_menu_open")

        # Test 3: Press Escape (Close Settings Menu)
        print("\n[TEST 3] Pressing Escape (Close Settings Menu)...")
        press_key(VK_ESCAPE)
        time.sleep(0.8)
        capture_screen("12_after_escape_close")

        print("\n=== SETTINGS AUTOMATED TESTS COMPLETED SUCCESSFULLY ===")
    finally:
        print("Stopping rradio.exe...")
        proc.terminate()
        time.sleep(0.5)

if __name__ == "__main__":
    main()
