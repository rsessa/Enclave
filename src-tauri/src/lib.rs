#[tauri::command]
fn launch_structura(app_handle: tauri::AppHandle, window: tauri::Window) -> Result<(), String> {
    use std::process::Command;
    
    // Auto-tiling: Enclave occupies the left half of the screen
    if let Ok(Some(monitor)) = window.current_monitor() {
        let size = monitor.size();
        let half_width = size.width / 2;
        let full_height = size.height;
        let _ = window.set_size(tauri::PhysicalSize::new(half_width, full_height));
        let _ = window.set_position(tauri::PhysicalPosition::new(0, 0));
    }

    // Get path to current executable
    let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
    
    // Find Structura-Portable.exe in the same folder
    let mut structura_path = current_exe.clone();
    structura_path.set_file_name("Structura-Portable.exe");
    
    if !structura_path.exists() {
        return Err(format!("No se encontró Structura-Portable.exe en: {:?}", structura_path));
    }

    // Launch detached
    Command::new(structura_path)
        .arg("--enclave-mode")
        .spawn()
        .map_err(|e| format!("Error al lanzar Structura: {}", e))?;
        
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![launch_structura])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Start the background thread for the Inboxes
      let app_handle = app.handle().clone();
      std::thread::spawn(move || {
        use std::time::Duration;
        use tauri::Emitter;

        let inbox_path = std::path::Path::new("C:\\scripts\\DataAnalisis\\inbox.html");
        let diagram_path = std::path::Path::new("C:\\scripts\\DataAnalisis\\inbox_diagram.svg");

        loop {
            // Priority 1: Check inbox.html (Can be PowerShell Table OR New Structura Diagram)
            if inbox_path.exists() {
                if let Ok(content) = std::fs::read_to_string(inbox_path) {
                    if std::fs::remove_file(inbox_path).is_ok() {
                        let _ = app_handle.emit("inbox-data-received", content);
                        
                        // If this was a new Structura export, it likely also 
                        // created a compatibility SVG. We delete it silently to prevent duplicates.
                        if diagram_path.exists() {
                            let _ = std::fs::remove_file(diagram_path);
                        }
                    }
                }
            } else if diagram_path.exists() {
                // Priority 2: Check SVG Diagram Inbox (Old Structura version compatibility)
                if let Ok(content) = std::fs::read_to_string(diagram_path) {
                    if std::fs::remove_file(diagram_path).is_ok() {
                        let _ = app_handle.emit("inbox-diagram-received", content);
                    }
                }
            }
            std::thread::sleep(Duration::from_secs(1));
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
