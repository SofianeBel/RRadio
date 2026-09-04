use rand::Rng;
use sha2::{Digest, Sha256};
use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Manager};

static CANCEL_OAUTH: AtomicBool = AtomicBool::new(false);

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct OAuthSuccessPayload {
    #[serde(rename = "accessToken")]
    pub access_token: String,
    #[serde(rename = "refreshToken")]
    pub refresh_token: Option<String>,
    #[serde(rename = "expiresAt")]
    pub expires_at: u64,
    #[serde(rename = "userName")]
    pub user_name: Option<String>,
    #[serde(rename = "userEmail")]
    pub user_email: Option<String>,
    #[serde(rename = "userAvatar")]
    pub user_avatar: Option<String>,
}

#[derive(serde::Deserialize, Debug)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: Option<u64>,
}

#[derive(serde::Deserialize, Debug)]
struct UserInfoResponse {
    name: Option<String>,
    email: Option<String>,
    picture: Option<String>,
}

#[cfg(target_os = "windows")]
pub fn lower_window_for_oauth(app_handle: &tauri::AppHandle) {
    if let Some(main_win) = app_handle.get_webview_window("main") {
        if let Ok(hwnd_raw) = main_win.hwnd() {
            use windows::Win32::Foundation::HWND;
            use windows::Win32::UI::WindowsAndMessaging::{
                GetWindowLongW, SetWindowLongW, SetWindowPos, GWL_EXSTYLE,
                HWND_NOTOPMOST, HWND_BOTTOM, SWP_NOMOVE, SWP_NOSIZE, SWP_NOACTIVATE, SWP_FRAMECHANGED,
                WS_EX_TOPMOST, AllowSetForegroundWindow, ASFW_ANY,
            };
            let hwnd = HWND(hwnd_raw.0 as *mut _);
            unsafe {
                let _ = AllowSetForegroundWindow(ASFW_ANY);
                let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
                SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style & !(WS_EX_TOPMOST.0 as i32));
                let _ = SetWindowPos(
                    hwnd,
                    HWND_NOTOPMOST,
                    0, 0, 0, 0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_FRAMECHANGED | SWP_NOACTIVATE,
                );
                let _ = SetWindowPos(
                    hwnd,
                    HWND_BOTTOM,
                    0, 0, 0, 0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
                );
            }
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn lower_window_for_oauth(_app_handle: &tauri::AppHandle) {}

#[cfg(target_os = "windows")]
fn restore_window_now(app_handle: &tauri::AppHandle) {
    if let Some(main_win) = app_handle.get_webview_window("main") {
        let _ = main_win.unminimize();
        let _ = main_win.show();
        let _ = main_win.set_focus();
        let _ = main_win.set_always_on_top(true);

        if let Ok(hwnd_raw) = main_win.hwnd() {
            use windows::Win32::Foundation::HWND;
            use windows::Win32::UI::WindowsAndMessaging::{
                GetForegroundWindow, GetWindowThreadProcessId, BringWindowToTop,
                SetForegroundWindow, SetWindowPos, ShowWindow, SwitchToThisWindow,
                GetWindowLongW, SetWindowLongW, GWL_EXSTYLE,
                HWND_TOPMOST, SWP_NOMOVE, SWP_NOSIZE, SWP_SHOWWINDOW, SWP_FRAMECHANGED,
                WS_EX_TOPMOST, WS_EX_NOACTIVATE, SW_SHOW,
            };
            use windows::Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId};

            crate::configure_pure_overlay_window(hwnd_raw.0 as isize, false);

            let hwnd = HWND(hwnd_raw.0 as *mut _);
            unsafe {
                let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
                let new_ex = (ex_style | (WS_EX_TOPMOST.0 as i32)) & !(WS_EX_NOACTIVATE.0 as i32);
                SetWindowLongW(hwnd, GWL_EXSTYLE, new_ex);

                let _ = SetWindowPos(
                    hwnd,
                    HWND_TOPMOST,
                    0, 0, 0, 0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW | SWP_FRAMECHANGED,
                );

                let _ = ShowWindow(hwnd, SW_SHOW);
                let _ = BringWindowToTop(hwnd);

                let fg_hwnd = GetForegroundWindow();
                let fg_thread = GetWindowThreadProcessId(fg_hwnd, None);
                let cur_thread = GetCurrentThreadId();

                if fg_thread != 0 && fg_thread != cur_thread {
                    let _ = AttachThreadInput(cur_thread, fg_thread, true);
                    let _ = BringWindowToTop(hwnd);
                    let _ = SetForegroundWindow(hwnd);
                    SwitchToThisWindow(hwnd, true);
                    let _ = AttachThreadInput(cur_thread, fg_thread, false);
                } else {
                    let _ = BringWindowToTop(hwnd);
                    let _ = SetForegroundWindow(hwnd);
                    SwitchToThisWindow(hwnd, true);
                }
            }
        }
    }
}

#[cfg(target_os = "windows")]
pub fn restore_window_after_oauth(app_handle: &tauri::AppHandle) {
    restore_window_now(app_handle);
    let app_clone = app_handle.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(300));
        restore_window_now(&app_clone);
    });
}

#[cfg(not(target_os = "windows"))]
pub fn restore_window_after_oauth(_app_handle: &tauri::AppHandle) {}

pub fn open_system_browser(url: &str) {
    #[cfg(target_os = "windows")]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        let wide_url: Vec<u16> = OsStr::new(url).encode_wide().chain(std::iter::once(0)).collect();
        let wide_open: Vec<u16> = OsStr::new("open").encode_wide().chain(std::iter::once(0)).collect();
        unsafe {
            let h_inst = windows::Win32::UI::Shell::ShellExecuteW(
                windows::Win32::Foundation::HWND(std::ptr::null_mut()),
                windows::core::PCWSTR(wide_open.as_ptr()),
                windows::core::PCWSTR(wide_url.as_ptr()),
                windows::core::PCWSTR(std::ptr::null()),
                windows::core::PCWSTR(std::ptr::null()),
                windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL,
            );
            if (h_inst.0 as isize) <= 32 {
                let _ = std::process::Command::new("rundll32")
                    .args(["url.dll,FileProtocolHandler", url])
                    .spawn();
            }
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = std::process::Command::new("xdg-open").arg(url).spawn();
    }
}

/// Cancels any in-flight OAuth loopback listener
pub fn cancel_oauth_flow(app_handle: tauri::AppHandle) {
    CANCEL_OAUTH.store(true, Ordering::SeqCst);
    eprintln!("Signaled CANCEL_OAUTH = true");
    restore_window_after_oauth(&app_handle);
    if let Some(main_win) = app_handle.get_webview_window("main") {
        let _ = main_win.emit("google_oauth_cancelled", "Connexion annulée par l'utilisateur.");
    }
}

pub fn start_oauth_flow(
    app_handle: tauri::AppHandle,
    client_id: String,
    client_secret: Option<String>,
) -> Result<(), String> {
    let clean_client_id = client_id.trim().to_string();

    if clean_client_id.is_empty() {
        return Err("Aucun ID client Google public n'est configuré dans cette version.".to_string());
    }

    CANCEL_OAUTH.store(false, Ordering::SeqCst);

    // 1. Generate PKCE code_verifier and code_challenge (RFC 7636)
    let (code_verifier, code_challenge) = generate_pkce();

    // 2. Bind to dynamic loopback port (port 0 = OS picks free port)
    let listener = TcpListener::bind("127.0.0.1:0")
        .map_err(|e| format!("Impossible de démarrer le serveur local d'authentification: {}", e))?;

    // Enable non-blocking mode so the loop can check cancellation and timeouts
    listener
        .set_nonblocking(true)
        .map_err(|e| format!("Erreur configuration socket: {}", e))?;

    let dynamic_port = listener
        .local_addr()
        .map_err(|e| format!("Erreur lecture port assigné: {}", e))?
        .port();

    let redirect_uri = format!("http://127.0.0.1:{}", dynamic_port);

    // 3. Build Google OAuth URL with PKCE for Desktop Applications
    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&code_challenge={}&code_challenge_method=S256&access_type=offline&prompt=consent",
        urlencoding(&clean_client_id),
        urlencoding(&redirect_uri),
        urlencoding(&code_challenge)
    );

    // 4. Temporarily lower RRadio window priority so system browser appears in foreground
    lower_window_for_oauth(&app_handle);

    // 5. Open default system browser with ShellExecuteW
    open_system_browser(&auth_url);

    let c_id = Arc::new(clean_client_id);
    let c_secret = Arc::new(client_secret);
    let c_verifier = Arc::new(code_verifier);
    let redirect_uri_clone = redirect_uri.clone();

    // 5. Background thread loop with 90-second timeout and robust multi-request handling
    thread::spawn(move || {
        eprintln!("OAuth loopback server listening on {} (timeout: 90s)", redirect_uri_clone);

        let start_time = Instant::now();
        let timeout = Duration::from_secs(90);
        let mut captured_code: Option<String> = None;

        while start_time.elapsed() < timeout {
            if CANCEL_OAUTH.load(Ordering::SeqCst) {
                eprintln!("OAuth loopback cancelled by user.");
                restore_window_after_oauth(&app_handle);
                return;
            }

            match listener.accept() {
                Ok((mut stream, _)) => {
                    let _ = stream.set_nonblocking(false);
                    let mut buffer = [0u8; 8192];
                    let n = stream.read(&mut buffer).unwrap_or(0);
                    let request = String::from_utf8_lossy(&buffer[..n]);

                    let (code, error) = parse_query_params(&request);

                    if let Some(err) = error {
                        eprintln!("Google OAuth returned error: {}", err);
                        let html_denied = r#"<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>RRadio - Connexion Annulée</title></head>
<body style="background:#0b0b0e;color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:60px 20px;margin:0;">
    <div style="max-width:480px;margin:40px auto;background:#15171e;padding:40px;border-radius:24px;border:1px solid rgba(239,68,68,0.4);box-shadow:0 15px 40px rgba(0,0,0,0.8);">
        <h1 style="color:#ef4444;margin:0 0 12px;font-size:24px;letter-spacing:1px;font-weight:900;">Connexion Non Autorisée</h1>
        <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">L'autorisation a été annulée ou refusée dans Google. Aucune modification n'a été effectuée.</p>
        <div style="display:inline-block;padding:12px 24px;background:rgba(239,68,68,0.15);color:#fca5a5;border-radius:12px;font-weight:bold;font-size:13px;border:1px solid rgba(239,68,68,0.4);">
            Vous pouvez fermer cet onglet et réessayer dans RRadio.
        </div>
    </div>
</body>
</html>"#;
                        let http_reply = format!(
                            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                            html_denied.len(),
                            html_denied
                        );
                        let _ = stream.write_all(http_reply.as_bytes());
                        let _ = stream.flush();

                        if let Some(main_win) = app_handle.get_webview_window("main") {
                            let _ = main_win.emit(
                                "google_oauth_error",
                                format!("Autorisation annulée ou refusée ({})", err),
                            );
                        }
                        restore_window_after_oauth(&app_handle);
                        return;
                    }

                    if let Some(auth_code) = code {
                        // Found valid authorization code! Send success page to browser and exit loop
                        let html_response = r#"<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>RRadio - Connexion Réussie</title></head>
<body style="background:#0b0b0e;color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:60px 20px;margin:0;">
    <div style="max-width:480px;margin:40px auto;background:#15171e;padding:40px;border-radius:24px;border:1px solid rgba(255,42,133,0.3);box-shadow:0 15px 40px rgba(0,0,0,0.8);">
        <h1 style="color:#FF2A85;margin:0 0 12px;font-size:24px;letter-spacing:1px;font-weight:900;">RRadio - Connexion Réussie !</h1>
        <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">Votre compte Google est désormais authentifié avec votre overlay GTA 6.</p>
        <div style="display:inline-block;padding:12px 24px;background:rgba(0,229,255,0.15);color:#00E5FF;border-radius:12px;font-weight:bold;font-size:13px;border:1px solid rgba(0,229,255,0.4);">
            Vous pouvez fermer cet onglet et retourner dans votre jeu.
        </div>
    </div>
</body>
</html>"#;
                        let http_reply = format!(
                            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                            html_response.len(),
                            html_response
                        );
                        let _ = stream.write_all(http_reply.as_bytes());
                        let _ = stream.flush();

                        captured_code = Some(auth_code);
                        restore_window_after_oauth(&app_handle);
                        break;
                    }

                    // Preflight request, favicon or empty socket: respond 204 and continue listening
                    let _ = stream.write_all(b"HTTP/1.1 204 No Content\r\nConnection: close\r\n\r\n");
                    let _ = stream.flush();
                }
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(Duration::from_millis(100));
                }
                Err(e) => {
                    eprintln!("OAuth accept error: {:?}", e);
                    break;
                }
            }
        }

        // Check if we captured an authorization code
        let code = match captured_code {
            Some(c) => c,
            None => {
                if !CANCEL_OAUTH.load(Ordering::SeqCst) {
                    eprintln!("OAuth loopback server timed out after 90s.");
                    if let Some(main_win) = app_handle.get_webview_window("main") {
                        let _ = main_win.emit(
                            "google_oauth_error",
                            "Délai de connexion dépassé (90s) ou fenêtre fermée. Veuillez réessayer.",
                        );
                    }
                }
                restore_window_after_oauth(&app_handle);
                return;
            }
        };

        // 6. Exchange code for tokens at Google OAuth Token Endpoint
        eprintln!("Exchanging OAuth code for tokens with PKCE...");

        let mut form_data: Vec<(&str, &str)> = vec![
            ("client_id", c_id.as_str()),
            ("code", code.as_str()),
            ("code_verifier", c_verifier.as_str()),
            ("redirect_uri", redirect_uri_clone.as_str()),
            ("grant_type", "authorization_code"),
        ];

        if let Some(ref sec) = *c_secret {
            let clean_sec = sec.trim();
            if !clean_sec.is_empty() {
                form_data.push(("client_secret", clean_sec));
            }
        }

        let token_res = ureq::post("https://oauth2.googleapis.com/token")
            .send_form(&form_data);

        match token_res {
            Ok(resp) => {
                let text = match resp.into_string() {
                    Ok(t) => t,
                    Err(e) => {
                        eprintln!("Failed to read Google token response body: {:?}", e);
                        if let Some(main_win) = app_handle.get_webview_window("main") {
                            let _ = main_win.emit("google_oauth_error", "Impossible de lire la réponse de Google.");
                        }
                        restore_window_after_oauth(&app_handle);
                        return;
                    }
                };

                let tokens: TokenResponse = match serde_json::from_str(&text) {
                    Ok(t) => t,
                    Err(e) => {
                        eprintln!("Failed to parse Google token JSON: {:?}. Body: {}", e, text);
                        if let Some(main_win) = app_handle.get_webview_window("main") {
                            let _ = main_win.emit("google_oauth_error", format!("Réponse Google invalide: {}", e));
                        }
                        restore_window_after_oauth(&app_handle);
                        return;
                    }
                };

                let expires_at = (SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs())
                    + tokens.expires_in.unwrap_or(3600);

                // Fetch user profile info
                let mut user_name = None;
                let mut user_email = None;
                let mut user_avatar = None;

                let info_res = ureq::get("https://www.googleapis.com/oauth2/v3/userinfo")
                    .set("Authorization", &format!("Bearer {}", tokens.access_token))
                    .call();

                if let Ok(info_resp) = info_res {
                    if let Ok(info) = info_resp.into_json::<UserInfoResponse>() {
                        user_name = info.name;
                        user_email = info.email;
                        user_avatar = info.picture;
                    }
                }

                let payload = OAuthSuccessPayload {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_at,
                    user_name,
                    user_email,
                    user_avatar,
                };

                eprintln!("Google OAuth successful! Logged in as: {:?}", payload.user_email);

                if let Some(main_win) = app_handle.get_webview_window("main") {
                    let _ = main_win.emit("google_oauth_success", payload);
                }
            }
            Err(err) => {
                let err_msg = match err {
                    ureq::Error::Status(code, resp) => {
                        let body = resp.into_string().unwrap_or_default();
                        eprintln!("Google token exchange error (HTTP {}): {}", code, body);
                        format!("Erreur Google HTTP {}: {}", code, body)
                    }
                    ureq::Error::Transport(t) => {
                        eprintln!("Google token network error: {:?}", t);
                        format!("Erreur réseau Google: {}", t)
                    }
                };
                if let Some(main_win) = app_handle.get_webview_window("main") {
                    let _ = main_win.emit("google_oauth_error", err_msg);
                }
            }
        }
        restore_window_after_oauth(&app_handle);
    });

    Ok(())
}

fn urlencoding(input: &str) -> String {
    let mut out = String::new();
    for b in input.bytes() {
        match b {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char);
            }
            _ => {
                out.push_str(&format!("%{:02X}", b));
            }
        }
    }
    out
}

fn url_decode(input: &str) -> String {
    let mut bytes = Vec::new();
    let mut chars = input.bytes();
    while let Some(b) = chars.next() {
        match b {
            b'%' => {
                let h1 = chars.next();
                let h2 = chars.next();
                if let (Some(c1), Some(c2)) = (h1, h2) {
                    let hex = [c1, c2];
                    if let Ok(s) = std::str::from_utf8(&hex) {
                        if let Ok(val) = u8::from_str_radix(s, 16) {
                            bytes.push(val);
                            continue;
                        }
                    }
                    bytes.push(b'%');
                    bytes.push(c1);
                    bytes.push(c2);
                } else {
                    bytes.push(b'%');
                }
            }
            b'+' => bytes.push(b' '),
            other => bytes.push(other),
        }
    }
    String::from_utf8_lossy(&bytes).to_string()
}

fn parse_query_params(request: &str) -> (Option<String>, Option<String>) {
    let first_line = match request.lines().next() {
        Some(l) => l,
        None => return (None, None),
    };

    let parts: Vec<&str> = first_line.split_whitespace().collect();
    if parts.len() < 2 {
        return (None, None);
    }
    let target = parts[1];

    let query_str = match target.find('?') {
        Some(idx) => &target[idx + 1..],
        None => return (None, None),
    };

    let mut code = None;
    let mut error = None;

    for pair in query_str.split('&') {
        if let Some((k, v)) = pair.split_once('=') {
            let decoded_val = url_decode(v);
            if k == "code" {
                code = Some(decoded_val);
            } else if k == "error" {
                error = Some(decoded_val);
            }
        }
    }

    (code, error)
}

fn base64url_encode(input: &[u8]) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let mut result = String::new();
    let mut i = 0;
    while i < input.len() {
        let b0 = input[i] as usize;
        let b1 = if i + 1 < input.len() { input[i + 1] as usize } else { 0 };
        let b2 = if i + 2 < input.len() { input[i + 2] as usize } else { 0 };

        result.push(CHARSET[(b0 >> 2) & 0x3F] as char);
        result.push(CHARSET[((b0 << 4) | (b1 >> 4)) & 0x3F] as char);
        if i + 1 < input.len() {
            result.push(CHARSET[((b1 << 2) | (b2 >> 6)) & 0x3F] as char);
        }
        if i + 2 < input.len() {
            result.push(CHARSET[b2 & 0x3F] as char);
        }
        i += 3;
    }
    result
}

fn generate_pkce() -> (String, String) {
    let mut random_bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut random_bytes);
    let verifier = base64url_encode(&random_bytes);
    let hash = Sha256::digest(verifier.as_bytes());
    let challenge = base64url_encode(&hash);
    (verifier, challenge)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_query_with_iss_prefix() {
        let req = "GET /?iss=https%3A%2F%2Faccounts.google.com&code=4%2F0AWtg_xyz&scope=all HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n";
        let (code, error) = parse_query_params(req);
        assert_eq!(code, Some("4/0AWtg_xyz".to_string()));
        assert_eq!(error, None);
    }

    #[test]
    fn test_parse_query_standard() {
        let req = "GET /?code=4%2F0AWtg_123&scope=https%3A%2F%2Fwww.googleapis.com HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n";
        let (code, error) = parse_query_params(req);
        assert_eq!(code, Some("4/0AWtg_123".to_string()));
        assert_eq!(error, None);
    }

    #[test]
    fn test_parse_query_error() {
        let req = "GET /?error=access_denied&error_description=User+denied HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n";
        let (code, error) = parse_query_params(req);
        assert_eq!(code, None);
        assert_eq!(error, Some("access_denied".to_string()));
    }

    #[test]
    fn test_url_decoding() {
        assert_eq!(url_decode("4%2F0AWtg"), "4/0AWtg");
        assert_eq!(url_decode("hello+world%21"), "hello world!");
    }

    #[test]
    fn test_pkce_generation() {
        let (verifier, challenge) = generate_pkce();
        assert_eq!(verifier.len(), 43);
        assert_eq!(challenge.len(), 43);
        // Must only contain URL-safe characters
        assert!(verifier.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_' || c == '~' || c == '.'));
        assert!(challenge.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_' || c == '~' || c == '.'));
    }
}
