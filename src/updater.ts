import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

type ToastCallback = (msg: string) => void;
type PromptCallback = (version: string, onConfirm: () => void) => void;

let toastCallback: ToastCallback | null = null;
let promptCallback: PromptCallback | null = null;

export function onToast(cb: ToastCallback) {
  toastCallback = cb;
}

export function onUpdatePrompt(cb: PromptCallback) {
  promptCallback = cb;
}

function showToast(msg: string) {
  if (toastCallback) toastCallback(msg);
}

export async function checkForUpdates(manual = false) {
  let update: Update | null = null;
  try {
    showToast("Checking for updates...");
    update = await check();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Update check failed:", msg);
    if (manual) {
      showToast(`Update failed: ${msg}`);
    } else {
      showToast("");
    }
    return;
  }

  if (!update) {
    if (manual) {
      showToast("You're on the latest version.");
    } else {
      showToast("");
    }
    return;
  }

  showToast("");

  const doUpdate = async () => {
    try {
      showToast("Downloading update...");
      await update.downloadAndInstall();
      showToast("Restarting...");
      await relaunch();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast(`Download failed: ${msg}`);
    }
  };

  if (promptCallback) {
    promptCallback(update.version, doUpdate);
  } else {
    await doUpdate();
  }
}
