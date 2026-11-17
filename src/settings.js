import defaults from "../settings.json";

const prefix = "v2ex-codex:";

export function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(prefix + key)); }
  catch { return null; }
}

export function writeLocal(key, value) {
  try { localStorage.setItem(prefix + key, JSON.stringify(value)); }
  catch { /* The setting remains active on this page. */ }
}

export function readSession(key) {
  try { return JSON.parse(sessionStorage.getItem(prefix + key)); }
  catch { return null; }
}

export function writeSession(key, value) {
  try { sessionStorage.setItem(prefix + key, JSON.stringify(value)); }
  catch { /* Navigation works without tab storage. */ }
}

export function loadSettings() {
  const saved = readLocal("settings") || {};
  const theme = saved.theme ?? defaults.theme;
  const codePanel = saved.codePanel ?? defaults.codePanel;
  return {
    theme: ["system", "light", "dark"].includes(theme) ? theme : defaults.theme,
    images: (saved.images ?? defaults.images) === true,
    codePanel: ["auto", "on", "off"].includes(codePanel) ? codePanel : defaults.codePanel,
  };
}
