import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export async function checkForUpdates() {
  try {
    const update = await check();
    if (update) {
      const confirmed = window.confirm(
        `TradeBoard ${update.version} is available. Update now?`,
      );
      if (confirmed) {
        await update.downloadAndInstall();
        await relaunch();
      }
    }
  } catch (e) {
    console.error("Update check failed:", e);
  }
}
