import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export async function checkForUpdates(manual = false) {
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
    } else if (manual) {
      window.alert("You're on the latest version.");
    }
  } catch (e) {
    console.error("Update check failed:", e);
    if (manual) {
      window.alert("Could not check for updates. Are you online?");
    }
  }
}
