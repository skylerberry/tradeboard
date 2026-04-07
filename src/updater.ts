import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";

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
    const currentVersion = await getVersion();
    showToast(`Checking... (current: ${currentVersion})`);
    update = await check();
    if (update) {
      showToast(`Found update: ${update.version}`);
    } else {
      showToast(manual ? `v${currentVersion} is the latest.` : "");
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Update check failed:", msg);
    showToast(manual ? `Update failed: ${msg}` : "");
    return;
  }

  if (!update) return;

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
