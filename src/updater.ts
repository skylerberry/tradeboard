import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

// Shared state for the toast UI
type ToastCallback = (msg: string) => void;
let toastCallback: ToastCallback | null = null;

export function onToast(cb: ToastCallback) {
  toastCallback = cb;
}

function showToast(msg: string) {
  if (toastCallback) toastCallback(msg);
}

export async function checkForUpdates(manual = false) {
  try {
    showToast("Checking for updates...");
    const update = await check();
    if (update) {
      showToast(`Update ${update.version} available!`);
      const confirmed = window.confirm(
        `TradeBoard ${update.version} is available. Update now?`,
      );
      if (confirmed) {
        showToast("Downloading update...");
        await update.downloadAndInstall();
        await relaunch();
      } else {
        showToast("");
      }
    } else if (manual) {
      showToast("You're on the latest version.");
    } else {
      showToast("");
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Update check failed:", msg);
    if (manual) {
      showToast(`Update failed: ${msg}`);
    }
  }
}
