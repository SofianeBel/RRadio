use std::sync::mpsc::{sync_channel, Receiver, SyncSender, TrySendError};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use serde::{Deserialize, Serialize};

const DEFAULT_APP_ID: &str = "1346077556094009384";
const ERROR_BACKOFF_DURATION: Duration = Duration::from_secs(8);

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
    Update(DiscordActivityPayload),
    Clear,
}

static SENDER: Mutex<Option<SyncSender<DiscordCommand>>> = Mutex::new(None);

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

fn worker_loop(rx: Receiver<DiscordCommand>) {
    let mut client: Option<DiscordIpcClient> = None;
    let mut current_app_id: Option<String> = None;
    let mut last_error_time: Option<Instant> = None;

    while let Ok(cmd) = rx.recv() {
        // Drain any pending queue items to keep only the latest state
        let mut latest_cmd = cmd;
        while let Ok(next) = rx.try_recv() {
            latest_cmd = next;
        }

        match latest_cmd {
            DiscordCommand::Clear => {
                if let Some(ref mut c) = client {
                    let _ = c.clear_activity();
                    let _ = c.close();
                }
                client = None;
                current_app_id = None;
            }
            DiscordCommand::Update(payload) => {
                if !payload.enabled {
                    if let Some(ref mut c) = client {
                        let _ = c.clear_activity();
                        let _ = c.close();
                    }
                    client = None;
                    current_app_id = None;
                    continue;
                }

                // If in error backoff period, do not hammer the IPC pipe
                if let Some(err_time) = last_error_time {
                    if err_time.elapsed() < ERROR_BACKOFF_DURATION {
                        continue;
                    }
                }

                let target_app_id = payload
                    .application_id
                    .as_deref()
                    .map(|s| s.trim())
                    .filter(|s| !s.is_empty())
                    .unwrap_or(DEFAULT_APP_ID);

                // If target app_id changed, close existing client
                if let Some(ref active_id) = current_app_id {
                    if active_id != target_app_id {
                        if let Some(ref mut c) = client {
                            let _ = c.close();
                        }
                        client = None;
                        current_app_id = None;
                    }
                }

                // Attempt to connect if no client
                if client.is_none() {
                    let mut new_client = DiscordIpcClient::new(target_app_id);
                    if let Err(err) = new_client.connect() {
                        eprintln!("Discord RPC connect error (backoff 8s): {}", err);
                        last_error_time = Some(Instant::now());
                        client = None;
                        current_app_id = None;
                        continue;
                    }
                    client = Some(new_client);
                    current_app_id = Some(target_app_id.to_string());
                }
                // Build activity payload (Listening vs Playing)
                let act_type = match payload.activity_type.as_deref() {
                    Some("playing") => activity::ActivityType::Playing,
                    _ => activity::ActivityType::Listening,
                };
                let mut activity = activity::Activity::new().activity_type(act_type);

                if let Some(ref details) = payload.details {
                    if !details.trim().is_empty() {
                        activity = activity.details(details);
                    }
                }

                if let Some(ref state) = payload.state {
                    if !state.trim().is_empty() {
                        activity = activity.state(state);
                    }
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
                    if !large_text.trim().is_empty() {
                        assets = assets.large_text(large_text);
                        has_assets = true;
                    }
                }
                if let Some(ref small_image) = payload.small_image {
                    if !small_image.trim().is_empty() {
                        assets = assets.small_image(small_image);
                        has_assets = true;
                    }
                }
                if let Some(ref small_text) = payload.small_text {
                    if !small_text.trim().is_empty() {
                        assets = assets.small_text(small_text);
                        has_assets = true;
                    }
                }
                if has_assets {
                    activity = activity.assets(assets);
                }

                if let (Some(ref label), Some(ref url)) = (&payload.button_label, &payload.button_url) {
                    if !label.trim().is_empty() && !url.trim().is_empty() {
                        let button = activity::Button::new(label, url);
                        activity = activity.buttons(vec![button]);
                    }
                }

                if let Some(ref mut c) = client {
                    if let Err(err) = c.set_activity(activity) {
                        eprintln!("Discord RPC set_activity error (resetting, backoff 8s): {}", err);
                        let _ = c.close();
                        client = None;
                        current_app_id = None;
                        last_error_time = Some(Instant::now());
                    } else {
                        last_error_time = None;
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
        match tx.try_send(DiscordCommand::Update(payload)) {
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
