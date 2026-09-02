use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize, WebviewWindow};
pub mod oauth;
pub mod discord;

static IS_OVERLAY_OPEN: AtomicBool = AtomicBool::new(false);
fn configure_pure_overlay_window(hwnd_raw: isize, enable_click_through: bool) {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::Graphics::Dwm::DwmExtendFrameIntoClientArea;
    use windows::Win32::UI::Controls::MARGINS;
    use windows::Win32::UI::WindowsAndMessaging::{
        GetWindowLongW, SetWindowLongW, SetWindowPos,
        GWL_EXSTYLE, GWL_STYLE,
        HWND_TOPMOST, SWP_FRAMECHANGED, SWP_NOMOVE, SWP_NOSIZE,
        WS_BORDER, WS_CAPTION, WS_EX_LAYERED, WS_EX_TOOLWINDOW, WS_EX_TOPMOST, WS_EX_TRANSPARENT,
        WS_POPUP, WS_THICKFRAME, WS_VISIBLE,
    };

    let hwnd = HWND(hwnd_raw as *mut _);
    unsafe {
        // 1. Strip WS_CAPTION, WS_BORDER, WS_THICKFRAME to completely remove any non-client title bar
        let style = GetWindowLongW(hwnd, GWL_STYLE);
        let new_style = (style & !(WS_CAPTION.0 as i32 | WS_BORDER.0 as i32 | WS_THICKFRAME.0 as i32))
            | (WS_POPUP.0 as i32)
            | (WS_VISIBLE.0 as i32);
        SetWindowLongW(hwnd, GWL_STYLE, new_style);

        // 2. Apply WS_EX_TOOLWINDOW + WS_EX_TOPMOST + WS_EX_LAYERED + click-through
        let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
        let mut new_ex_style = ex_style
            | (WS_EX_TOOLWINDOW.0 as i32)
            | (WS_EX_TOPMOST.0 as i32)
            | (WS_EX_LAYERED.0 as i32);

        if enable_click_through {
            new_ex_style |= WS_EX_TRANSPARENT.0 as i32;
        } else {
            new_ex_style &= !(WS_EX_TRANSPARENT.0 as i32);
        }

        SetWindowLongW(hwnd, GWL_EXSTYLE, new_ex_style);

        // 3. Extend frame into client area with -1 margins
        // This is the official Microsoft Win32 API solution to completely eliminate
        // the classic fallback title bar and non-client borders upon focus loss
        let margins = MARGINS {
            cxLeftWidth: -1,
            cxRightWidth: -1,
            cyTopHeight: -1,
            cyBottomHeight: -1,
        };
        let _ = DwmExtendFrameIntoClientArea(hwnd, &margins);

        // 4. Force DWM to update frame geometry
        let _ = SetWindowPos(
            hwnd,
            HWND_TOPMOST,
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_FRAMECHANGED,
        );
    }
}

#[tauri::command]
fn set_window_visibility(window: WebviewWindow, visible: bool) -> Result<(), String> {
    eprintln!("RUST: set_window_visibility visible={}", visible);
    IS_OVERLAY_OPEN.store(visible, Ordering::SeqCst);
    if visible {
        let _ = window.show();
        #[cfg(target_os = "windows")]
        {
            use windows::Win32::Foundation::HWND;
            use windows::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_SHOWNOACTIVATE};
            if let Ok(hwnd_raw) = window.hwnd() {
                let hwnd = HWND(hwnd_raw.0 as *mut _);
                unsafe {
                    let _ = ShowWindow(hwnd, SW_SHOWNOACTIVATE);
                }
            }
        }
    } else {
        let _ = window.hide();
    }
    Ok(())
}

#[tauri::command]
fn set_click_through(window: WebviewWindow, enable: bool) -> Result<(), String> {
    window
        .set_ignore_cursor_events(enable)
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::WindowsAndMessaging::{GetWindowLongW, SetWindowLongW, GWL_EXSTYLE, WS_EX_TRANSPARENT};
        if let Ok(hwnd_raw) = window.hwnd() {
            let hwnd = HWND(hwnd_raw.0 as *mut _);
            unsafe {
                let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
                let new_ex = if enable {
                    ex_style | (WS_EX_TRANSPARENT.0 as i32)
                } else {
                    ex_style & !(WS_EX_TRANSPARENT.0 as i32)
                };
                SetWindowLongW(hwnd, GWL_EXSTYLE, new_ex);
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn set_settings_window_mode(window: WebviewWindow, is_settings_open: bool, is_radio_open: bool) -> Result<(), String> {
    eprintln!("RUST: set_settings_window_mode is_settings={} is_radio={}", is_settings_open, is_radio_open);
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let screen_size = monitor.size();
        if is_settings_open {
            let _ = window.set_size(PhysicalSize::new(screen_size.width, screen_size.height));
            let _ = window.set_position(PhysicalPosition::new(0, 0));
            let _ = window.show();
            let _ = window.set_ignore_cursor_events(false);
        } else if is_radio_open {
            let _ = window.set_size(PhysicalSize::new(screen_size.width, 340));
            let _ = window.set_position(PhysicalPosition::new(0, 0));
            let _ = window.show();
            let _ = window.set_ignore_cursor_events(false);
        } else {
            let _ = window.hide();
            let _ = window.set_ignore_cursor_events(true);
        }
    }

    Ok(())
}
#[tauri::command]
fn start_google_oauth(app_handle: tauri::AppHandle, client_id: String, client_secret: String) -> Result<(), String> {
    oauth::start_oauth_flow(app_handle, client_id, client_secret)
}
#[tauri::command]
fn cancel_google_oauth(app_handle: tauri::AppHandle) -> Result<(), String> {
    oauth::cancel_oauth_flow(app_handle);
    Ok(())
}


pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Initial window setup (starts hidden by default)
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let screen_size = monitor.size();
                    let _ = window.set_size(PhysicalSize::new(screen_size.width, 340));
                    let _ = window.set_position(PhysicalPosition::new(0, 0));
                }

                let _ = window.set_ignore_cursor_events(true);
                let _ = window.hide();

                #[cfg(target_os = "windows")]
                {
                    if let Ok(hwnd_raw) = window.hwnd() {
                        configure_pure_overlay_window(hwnd_raw.0 as isize, true);
                    }
                }
            }

            // System Tray Icon with Menu
            let toggle_item = MenuItem::with_id(app, "toggle", "Afficher / Masquer (F8 / Alt+V)", true, None::<&str>)?;
            let mute_item = MenuItem::with_id(app, "mute", "Couper / Activer le son (F9 / Alt+M)", true, None::<&str>)?;
            let settings_item = MenuItem::with_id(app, "settings", "Paramètres (Settings / F10)", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quitter GTA 6 Radio", true, None::<&str>)?;

            let tray_menu = Menu::with_items(app, &[&toggle_item, &mute_item, &settings_item, &quit_item])?;

            let tray_builder = if let Some(icon) = app.default_window_icon() {
                TrayIconBuilder::new().icon(icon.clone())
            } else {
                TrayIconBuilder::new()
            };

            let _tray = tray_builder
                .menu(&tray_menu)
                .tooltip("GTA 6 Radio Overlay (Vice City)")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "settings" => {
                            let _ = app.emit("global_open_settings", ());
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        "toggle" => {
                            let _ = app.emit("global_overlay_toggle", ());
                        }
                        "mute" => {
                            let _ = app.emit("global_mute_toggle", ());
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        let _ = app.emit("global_overlay_toggle", ());
                    }
                })
                .build(app)?;

            // Native Windows RegisterHotKey Thread
            #[cfg(target_os = "windows")]
            {
                let hotkey_handle = app.handle().clone();
                std::thread::spawn(move || {
                    use windows::Win32::Foundation::HWND;
                    use windows::Win32::UI::Input::KeyboardAndMouse::{
                        RegisterHotKey, MOD_NOREPEAT,
                        VK_F6, VK_F7, VK_F8, VK_F9, VK_F10,
                    };
                    use windows::Win32::UI::WindowsAndMessaging::{GetMessageW, MSG, WM_HOTKEY};

                    const HOTKEY_F8: i32 = 101;
                    const HOTKEY_F9: i32 = 102;
                    const HOTKEY_ALTV: i32 = 103;
                    const HOTKEY_ALTM: i32 = 104;
                    const HOTKEY_F10: i32 = 105;
                    const HOTKEY_F7: i32 = 106;
                    const HOTKEY_ALTO: i32 = 107;
                    const HOTKEY_F6: i32 = 108;
                    unsafe {
                        let r_f8 = RegisterHotKey(HWND(std::ptr::null_mut()), HOTKEY_F8, MOD_NOREPEAT, VK_F8.0 as u32);
                        let r_f9 = RegisterHotKey(HWND(std::ptr::null_mut()), HOTKEY_F9, MOD_NOREPEAT, VK_F9.0 as u32);
                        let r_f10 = RegisterHotKey(HWND(std::ptr::null_mut()), HOTKEY_F10, MOD_NOREPEAT, VK_F10.0 as u32);
                        let r_f7 = RegisterHotKey(HWND(std::ptr::null_mut()), HOTKEY_F7, MOD_NOREPEAT, VK_F7.0 as u32);
                        let r_f6 = RegisterHotKey(HWND(std::ptr::null_mut()), HOTKEY_F6, MOD_NOREPEAT, VK_F6.0 as u32);
                        eprintln!("HOTKEYS: F8={:?}, F9={:?}, F10={:?}, F7={:?}, F6={:?}", r_f8, r_f9, r_f10, r_f7, r_f6);
                        let mut msg = MSG::default();
                        while GetMessageW(&mut msg, HWND(std::ptr::null_mut()), 0, 0).as_bool() {
                            if msg.message == WM_HOTKEY {
                                eprintln!("WM_HOTKEY received: {}", msg.wParam.0);
                                match msg.wParam.0 as i32 {
                                    HOTKEY_F8 | HOTKEY_ALTV => {
                                    if let Some(main_win) = hotkey_handle.get_webview_window("main") {
                                        let is_open = IS_OVERLAY_OPEN.load(Ordering::SeqCst);
                                        if is_open {
                                            IS_OVERLAY_OPEN.store(false, Ordering::SeqCst);
                                            let _ = main_win.hide();
                                            let _ = main_win.emit("global_overlay_hide", ());
                                        } else {
                                            IS_OVERLAY_OPEN.store(true, Ordering::SeqCst);
                                            let _ = main_win.show();
                                            let _ = main_win.emit("global_overlay_show", ());
                                        }
                                    }
                                }
                                HOTKEY_F9 | HOTKEY_ALTM => {
                                        if let Some(main_win) = hotkey_handle.get_webview_window("main") {
                                            let _ = main_win.emit("global_mute_toggle", ());
                                        }
                                    }
                                    HOTKEY_F10 => {
                                        if let Some(main_win) = hotkey_handle.get_webview_window("main") {
                                            let _ = main_win.show();
                                            let _ = main_win.emit("global_open_settings", ());
                                        }
                                    }
                                    HOTKEY_F7 | HOTKEY_ALTO => {
                                        if let Some(main_win) = hotkey_handle.get_webview_window("main") {
                                            let _ = main_win.emit("global_mode_toggle", ());
                                        }
                                    }
                                    HOTKEY_F6 => {
                                        if let Some(main_win) = hotkey_handle.get_webview_window("main") {
                                            let _ = main_win.emit("global_seek_end", ());
                                        }
                                    }
                                    _ => {}
                                }
                            }
                        }
                    }
                });
            }

            let hold_handle = app.handle().clone();
            std::thread::spawn(move || {
                let is_alt_down = Arc::new(AtomicBool::new(false));
                let is_q_active = Arc::new(AtomicBool::new(false));

                let callback = move |event: rdev::Event| {
                    match event.event_type {
                        rdev::EventType::KeyPress(key) => {
                            if IS_OVERLAY_OPEN.load(Ordering::SeqCst) {
                                match key {
                                    rdev::Key::KeyD | rdev::Key::RightArrow => {
                                        let _ = hold_handle.emit("global_nav_next", ());
                                    }
                                    rdev::Key::KeyA | rdev::Key::LeftArrow => {
                                        let _ = hold_handle.emit("global_nav_prev", ());
                                    }
                                    rdev::Key::Return => {
                                        let _ = hold_handle.emit("global_nav_confirm", ());
                                    }
                                    rdev::Key::Escape => {
                                        let _ = hold_handle.emit("global_nav_back", ());
                                    }
                                    rdev::Key::Unknown(code) => {
                                        if code == 32 || code == 0x20 {
                                            let _ = hold_handle.emit("global_nav_next", ());
                                        } else if code == 30 || code == 0x1E {
                                            let _ = hold_handle.emit("global_nav_prev", ());
                                        } else if code == 28 || code == 0x1C {
                                            let _ = hold_handle.emit("global_nav_confirm", ());
                                        } else if code == 1 || code == 0x01 {
                                            let _ = hold_handle.emit("global_nav_back", ());
                                        }
                                    }
                                    _ => {}
                                }
                            }

                            match key {
                                rdev::Key::Alt | rdev::Key::AltGr => {
                                    is_alt_down.store(true, Ordering::SeqCst);
                                }
                                rdev::Key::KeyQ | rdev::Key::KeyA => {
                                    if is_alt_down.load(Ordering::SeqCst) {
                                        if !is_q_active.swap(true, Ordering::SeqCst) {
                                            let _ = hold_handle.emit("global_overlay_show", ());
                                        }
                                    }
                                }
                                _ => {}
                            }
                        }
                        rdev::EventType::KeyRelease(key) => {
                            match key {
                                rdev::Key::Alt | rdev::Key::AltGr => {
                                    is_alt_down.store(false, Ordering::SeqCst);
                                    if is_q_active.swap(false, Ordering::SeqCst) {
                                        let _ = hold_handle.emit("global_overlay_hide", ());
                                    }
                                }
                                rdev::Key::KeyQ | rdev::Key::KeyA => {
                                    if is_q_active.swap(false, Ordering::SeqCst) {
                                        let _ = hold_handle.emit("global_overlay_hide", ());
                                    }
                                }
                                _ => {}
                            }
                        }
                        _ => {}
                    }
                };

                if let Err(error) = rdev::listen(callback) {
                    eprintln!("Global hook listener error: {:?}", error);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_click_through,
            set_settings_window_mode,
            set_window_visibility,
            start_google_oauth,
            cancel_google_oauth,
            discord::update_discord_activity,
            discord::clear_discord_activity
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
