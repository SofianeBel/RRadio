import subprocess
import time
import os
import ctypes
from PIL import ImageGrab

user32 = ctypes.windll.user32

VK_F8 = 0x77
VK_F10 = 0x79
VK_ESCAPE = 0x1B

KEYEVENTF_KEYUP = 0x0002

def press_key(vk, delay=0.6):
    scan = user32.MapVirtualKeyW(vk, 0)
    user32.keybd_event(vk, scan, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(vk, scan, KEYEVENTF_KEYUP, 0)
    time.sleep(delay)

def main():
    subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)
    time.sleep(0.5)

    exe_path = os.path.abspath("src-tauri/target/debug/rradio.exe")
    proc = subprocess.Popen([exe_path])
    time.sleep(2.5)

    try:
        print("Pressing F8...")
        press_key(VK_F8, delay=0.8)

        print("Pressing F10...")
        press_key(VK_F10, delay=1.0)

        im = ImageGrab.grab()
        im.save("extracted_frames/test_results/test_settings_dialog_direct.png")
        print("Saved test_settings_dialog_direct.png")

    finally:
        proc.terminate()
        subprocess.run("taskkill /IM rradio.exe /F", shell=True, capture_output=True)

if __name__ == "__main__":
    main()
