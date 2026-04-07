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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Update check failed:", msg);
    if (manual) {
      window.alert(`Update check failed:\n${msg}`);
    }
  }
}
