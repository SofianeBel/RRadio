use std::sync::mpsc::{sync_channel, Receiver, RecvTimeoutError, SyncSender, TrySendError};
use std::sync::Mutex;
use std::time::Duration;
use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

const DEFAULT_APP_ID: &str = "1544561243615002624";
const RETRY_DELAY: Duration = Duration::from_secs(8);
// Discord rejects the whole activity when a text field is outside 2..=128 chars
const MAX_TEXT_CHARS: usize = 128;

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct DiscordActivityPayload {
    pub enabled: bool,
    pub application_id: Option<String>,
    pub details: Option<String>,
    pub state: Option<String>,
    pub activity_type: Option<String>,
    pub large_image: Option<String>,
    pub large_text: Option<String>,
    pub small_image: Option<String>,
    pub small_text: Option<String>,
    pub start_timestamp: Option<i64>,
    pub end_timestamp: Option<i64>,
    pub button_label: Option<String>,
    pub button_url: Option<String>,
}

enum DiscordCommand {
    Update(Box<DiscordActivityPayload>),
    Clear,
}

static SENDER: Mutex<Option<SyncSender<DiscordCommand>>> = Mutex::new(None);
// Last rejection from Discord, shown in Settings so a dead presence is never silent
static LAST_ERROR: Mutex<Option<String>> = Mutex::new(None);

fn set_last_error(error: Option<String>) {
    if let Some(ref e) = error {
        eprintln!("Discord RPC error (retry in 8s): {}", e);
    }
    match LAST_ERROR.lock() {
        Ok(mut g) => *g = error,
        Err(p) => *p.into_inner() = error,
    }
}

pub fn init_discord_worker() {
    let mut guard = match SENDER.lock() {
        Ok(g) => g,
        Err(p) => p.into_inner(),
    };
    if guard.is_some() {
        return;
    }

    let (tx, rx) = sync_channel::<DiscordCommand>(4);
    *guard = Some(tx);

    let _ = std::thread::Builder::new()
        .name("discord-rpc-worker".into())
        .spawn(move || {
            worker_loop(rx);
        });
}

/// Discord answers every command. A CLOSE frame (bad client ID) or an ERROR event
/// (invalid field) means the activity was rejected even though the write succeeded.
fn read_reply(client: &mut DiscordIpcClient) -> Result<(), String> {
    let (op, reply) = client
        .recv()
        .map_err(|e| format!("No reply from Discord: {}", e))?;
    let message = if op == 2 {
        reply.get("message")
    } else if reply.get("evt").and_then(Value::as_str) == Some("ERROR") {
        reply.pointer("/data/message")
    } else {
        return Ok(());
    };
    Err(message
        .and_then(Value::as_str)
        .unwrap_or("Rejected by Discord")
        .to_string())
}

fn connect(app_id: &str) -> Result<DiscordIpcClient, String> {
    let mut client = DiscordIpcClient::new(app_id);
    client
        .connect_ipc()
        .map_err(|e| format!("Discord is not running: {}", e))?;
    // Own handshake: the crate's connect() discards Discord's answer, so a bad client ID looked like success
    client
        .send(json!({ "v": 1, "client_id": app_id }), 0)
        .map_err(|e| e.to_string())?;
    read_reply(&mut client).map_err(|e| format!("{} (application ID {})", e, app_id))?;
    Ok(client)
}

fn clamp_text(field: &mut Option<String>) {
    *field = field.take().and_then(|s| {
        let s = s.trim();
        if s.chars().count() < 2 {
            return None;
        }
        Some(s.chars().take(MAX_TEXT_CHARS).collect())
    });
}

fn disconnect(client: &mut Option<DiscordIpcClient>, current_app_id: &mut Option<String>) {
    if let Some(ref mut c) = client {
        let _ = c.clear_activity();
        let _ = c.close();
    }
    *client = None;
    *current_app_id = None;
}

fn apply_activity(
    client: &mut Option<DiscordIpcClient>,
    current_app_id: &mut Option<String>,
    payload: &DiscordActivityPayload,
) -> Result<(), String> {
    let target_app_id = payload
        .application_id
        .as_deref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .unwrap_or(DEFAULT_APP_ID);

    if client.is_none() || current_app_id.as_deref() != Some(target_app_id) {
        disconnect(client, current_app_id);
        *client = Some(connect(target_app_id)?);
        *current_app_id = Some(target_app_id.to_string());
    }

    // Build activity payload (Listening vs Playing)
    let act_type = match payload.activity_type.as_deref() {
        Some("playing") => activity::ActivityType::Playing,
        _ => activity::ActivityType::Listening,
    };
    let mut activity = activity::Activity::new().activity_type(act_type);

    if let Some(ref details) = payload.details {
        activity = activity.details(details);
    }
    if let Some(ref state) = payload.state {
        activity = activity.state(state);
    }

    let mut timestamps = activity::Timestamps::new();
    let mut has_timestamp = false;
    if let Some(start) = payload.start_timestamp {
        timestamps = timestamps.start(start);
        has_timestamp = true;
    }
    if let Some(end) = payload.end_timestamp {
        timestamps = timestamps.end(end);
        has_timestamp = true;
    }
    if has_timestamp {
        activity = activity.timestamps(timestamps);
    }

    let mut assets = activity::Assets::new();
    let mut has_assets = false;
    if let Some(ref large_image) = payload.large_image {
        if !large_image.trim().is_empty() {
            assets = assets.large_image(large_image);
            has_assets = true;
        }
    }
    if let Some(ref large_text) = payload.large_text {
        assets = assets.large_text(large_text);
        has_assets = true;
    }
    if let Some(ref small_image) = payload.small_image {
        if !small_image.trim().is_empty() {
            assets = assets.small_image(small_image);
            has_assets = true;
        }
    }
    if let Some(ref small_text) = payload.small_text {
        assets = assets.small_text(small_text);
        has_assets = true;
    }
    if has_assets {
        activity = activity.assets(assets);
    }

    if let (Some(ref label), Some(ref url)) = (&payload.button_label, &payload.button_url) {
        if !label.trim().is_empty() && !url.trim().is_empty() {
            activity = activity.buttons(vec![activity::Button::new(label, url)]);
        }
    }

    let c = client.as_mut().ok_or("Not connected to Discord")?;
    let result = c
        .set_activity(activity)
        .map_err(|e| e.to_string())
        .and_then(|_| read_reply(c));
    if result.is_err() {
        // Reconnect on the next attempt rather than reuse a pipe in an unknown state
        disconnect(client, current_app_id);
    }
    result
}

fn worker_loop(rx: Receiver<DiscordCommand>) {
    let mut client: Option<DiscordIpcClient> = None;
    let mut current_app_id: Option<String> = None;
    // A failed update is kept and retried, so the presence appears as soon as
    // Discord starts instead of waiting for the next song change.
    let mut pending: Option<DiscordCommand> = None;

    loop {
        let cmd = match pending.take() {
            Some(retry) => match rx.recv_timeout(RETRY_DELAY) {
                Ok(newer) => newer,
                Err(RecvTimeoutError::Timeout) => retry,
                Err(RecvTimeoutError::Disconnected) => break,
            },
            None => match rx.recv() {
                Ok(cmd) => cmd,
                Err(_) => break,
            },
        };

        // Drain any pending queue items to keep only the latest state
        let mut latest_cmd = cmd;
        while let Ok(next) = rx.try_recv() {
            latest_cmd = next;
        }

        match latest_cmd {
            DiscordCommand::Clear => disconnect(&mut client, &mut current_app_id),
            DiscordCommand::Update(mut payload) => {
                if !payload.enabled {
                    disconnect(&mut client, &mut current_app_id);
                    set_last_error(None);
                    continue;
                }
                for field in [
                    &mut payload.details,
                    &mut payload.state,
                    &mut payload.large_text,
                    &mut payload.small_text,
                ] {
                    clamp_text(field);
                }
                match apply_activity(&mut client, &mut current_app_id, &payload) {
                    Ok(()) => set_last_error(None),
                    Err(e) => {
                        set_last_error(Some(e));
                        pending = Some(DiscordCommand::Update(payload));
                    }
                }
            }
        }
    }
}

#[tauri::command]
pub fn update_discord_activity(payload: DiscordActivityPayload) -> Result<(), String> {
    init_discord_worker();
    let guard = match SENDER.lock() {
        Ok(g) => g,
        Err(p) => p.into_inner(),
    };
    if let Some(ref tx) = *guard {
        match tx.try_send(DiscordCommand::Update(Box::new(payload))) {
            Ok(_) => {}
            Err(TrySendError::Full(_)) => {
                // Queue full, worker will process latest on next cycle
            }
            Err(TrySendError::Disconnected(_)) => {}
        }
    }
    Ok(())
}

#[tauri::command]
pub fn clear_discord_activity() -> Result<(), String> {
    init_discord_worker();
    let guard = match SENDER.lock() {
        Ok(g) => g,
        Err(p) => p.into_inner(),
    };
    if let Some(ref tx) = *guard {
        let _ = tx.try_send(DiscordCommand::Clear);
    }
    Ok(())
}

/// Why the presence is not showing, or None when the last update reached Discord.
#[tauri::command]
pub fn get_discord_status() -> Option<String> {
    match LAST_ERROR.lock() {
        Ok(g) => g.clone(),
        Err(p) => p.into_inner().clone(),
    }
}

#[cfg(test)]
mod tests {
    use super::clamp_text;

    #[test]
    fn clamp_text_keeps_discord_limits() {
        let mut long = Some("é".repeat(200));
        clamp_text(&mut long);
        assert_eq!(long.unwrap().chars().count(), 128);

        let mut short = Some(" X ".to_string());
        clamp_text(&mut short);
        assert_eq!(short, None);

        let mut ok = Some("  Billie Jean  ".to_string());
        clamp_text(&mut ok);
        assert_eq!(ok.as_deref(), Some("Billie Jean"));
    }
}
