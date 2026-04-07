use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let check_updates = MenuItemBuilder::new("Check for Updates...")
        .id("check_updates")
        .build(app)?;

      let app_submenu = SubmenuBuilder::new(app, "TradeBoard")
        .item(&check_updates)
        .separator()
        .quit()
        .build()?;

      let edit_submenu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;

      let menu = MenuBuilder::new(app)
        .item(&app_submenu)
        .item(&edit_submenu)
        .build()?;

      app.set_menu(menu)?;

      app.on_menu_event(move |app_handle, event| {
        if event.id() == "check_updates" {
          let _ = app_handle.emit("menu-check-updates", ());
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
