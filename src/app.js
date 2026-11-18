import style from "./skin.css";
import nativeStyle from "./native.css";
import readerStyle from "./reader.css";
import newTopicStyle from "./new-topic.css";
import accountSettingsStyle from "./account-settings.css";
import notificationsStyle from "./notifications.css";
import glyphs from "./assets/icons.woff2";
import inter from "./assets/inter-latin.woff2";
import { mountAccountSettings } from "./account-settings.js";
import { example } from "./code-panel.js";
import { mountComposer } from "./composer.js";
import { createDialogs } from "./dialogs.js";
import { mountNewTopic } from "./new-topic.js";
import { setupReader } from "./reader.js";
import { loadSettings, readSession, writeLocal, writeSession } from "./settings.js";
import { dialogHeader, helpDialog, moreDialog, settingsDialog, shell } from "./shell.js";
import { escape, icon } from "./ui.js";
import { accountLink, decorateNative, listingFor, previousSelection, projectThreads, readTopics, recentTopics, rememberListing } from "./v2ex.js";

const darkPreference = "(prefers-color-scheme: dark)";
let stylesInstalled = false;

function installCss() {
  if (stylesInstalled) return;
  const css = `${style}\n${nativeStyle}\n${readerStyle}\n${newTopicStyle}\n${accountSettingsStyle}\n${notificationsStyle}`;
  if ("adoptedStyleSheets" in document && "replaceSync" in CSSStyleSheet.prototype) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  } else {
    const tag = document.createElement("style");
    tag.textContent = css;
    (document.head || document.documentElement).append(tag);
  }
  document.fonts.add(new FontFace("V2EX Codex Icons", `url(${glyphs})`));
  document.fonts.add(new FontFace("V2EX Codex UI", `url(${inter})`, { weight: "100 900" }));
  stylesInstalled = true;
}

function setThemeClass(root, theme, systemDark) {
  const dark = theme === "system" ? systemDark : theme === "dark";
  root.classList.toggle("vcx-dark", dark);
  return dark;
}

export function prepareSkin(settings) {
  const root = document.documentElement;
  installCss();
  setThemeClass(root, settings.theme, matchMedia(darkPreference).matches);
  root.classList.add("vcx-starting");
  return () => {
    root.classList.remove("vcx-starting");
    if (!root.classList.contains("vcx")) root.classList.remove("vcx-dark");
  };
}

export function mount(page, {
  href, original, onOriginal, demo = false, settings = loadSettings(),
  navigateTopic = url => location.assign(url), historyTarget = history,
}) {
  const root = document.documentElement;
  const wrapper = document.getElementById("Wrapper");
  const scroller = wrapper.querySelector(".content") || wrapper;
  const small = matchMedia("(max-width: 900px)");
  const wide = matchMedia("(min-width: 1180px)");
  const systemDark = matchMedia(darkPreference);
  const topics = page.kind === "list" ? readTopics(page.main, page.url) : [];
  const account = accountLink(document);
  const reader = page.kind === "topic" ? setupReader(page, { href, copy }) : null;
  const wrapperContents = document.createElement("div");
  wrapperContents.className = "vcx-chrome";
  wrapperContents.lang = "zh-CN";
  wrapperContents.innerHTML = shell(page, {
    href, original, recent: recentTopics(page), groups: projectThreads(page, topics), account, topics, demo,
  });
  document.body.prepend(wrapperContents);
  installCss();
  decorateNative(page, href, topics);
  if (page.kind === "new") mountNewTopic(page, { href, demo });
  const composer = mountComposer(page, { href, account, demo, copy });
  if (page.main.tagName !== "MAIN") page.main.setAttribute("role", "main");

  const sidebar = document.getElementById("vcx-sidebar");
  const settingsSearch = page.kind === "settings" ? mountAccountSettings(page, sidebar) : null;
  const strip = wrapperContents.querySelector(".vcx-strip");
  const panel = document.getElementById("vcx-code");
  const bar = wrapperContents.querySelector(".vcx-topbar");
  const toast = wrapperContents.querySelector(".vcx-toast");
  const dialog = document.getElementById("vcx-dialog");
  const dialogs = createDialogs(dialog, topics, href);
  const themeButton = wrapperContents.querySelector('[data-action="theme"]');
  const floorButton = bar.querySelector('[data-action="floors"]');
  const panelButton = bar.querySelector('[data-action="panel"]');
  const sidebarButtons = wrapperContents.querySelectorAll('[data-action="sidebar"]');

  const restoredSelection = topics.findIndex(topic => topic.id === previousSelection(page.path));
  let selected = Math.max(0, restoredSelection);
  let mobileSidebar = false;
  let desktopSidebar = true;
  let mobilePanel = null;
  let editorView = "code";
  let boss = false;
  let focus = page.kind === "topic" && readSession("preview") === page.id;
  let lastScroll = 0;
  let toastTimer;
  let titleBeforeBoss;
  let previousFocus;

  if (focus) writeSession("preview", null);
  if (restoredSelection >= 0) selectTopic(selected);
  root.dataset.vcxPage = page.kind;
  root.classList.add("vcx");
  sync();

  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2300);
  }

  function sync() {
    const dark = setThemeClass(root, settings.theme, systemDark.matches);
    const navVisible = !boss && (small.matches ? mobileSidebar : desktopSidebar);
    const codeVisible = boss || (panelButton !== null && !focus && (wide.matches ? settings.codePanel !== "off" : mobilePanel ?? settings.codePanel === "on"));
    const overlay = !boss && ((small.matches && navVisible) || (!wide.matches && codeVisible));

    root.classList.toggle("vcx-boss", boss);
    root.classList.toggle("vcx-focused", focus && !boss);
    root.classList.toggle("vcx-sidebar-open", navVisible);
    root.classList.toggle("vcx-panel-open", codeVisible);
    root.classList.toggle("vcx-overlay", overlay);
    root.dataset.vcxImages = settings.images ? "on" : "off";

    themeButton.innerHTML = icon(dark ? "sun" : "moon");
    themeButton.setAttribute("aria-label", dark ? "切换到浅色主题" : "切换到深色主题");
    sidebar.hidden = !navVisible;
    strip.hidden = !navVisible;
    panel.hidden = !codeVisible;
    if (composer) composer.hidden = focus;
    wrapper.inert = boss || overlay;
    bar.inert = overlay;
    for (const button of sidebarButtons) button.setAttribute("aria-expanded", navVisible);
    panelButton?.setAttribute("aria-pressed", codeVisible);
    syncEditor();
  }

  function syncEditor() {
    const view = boss ? "code" : editorView;
    for (const button of panel.querySelectorAll('[data-action="editor-view"]')) {
      button.setAttribute("aria-pressed", button.dataset.view === view);
    }
    for (const content of panel.querySelectorAll("[data-editor-view]")) content.hidden = content.dataset.editorView !== view;
  }

  function saveSettings() {
    writeLocal("settings", settings);
    sync();
  }

  function selectTopic(index, keyboard = false) {
    const topic = topics[index];
    if (!topic) return;
    topics[selected]?.row.classList.remove("vcx-selected");
    topics[selected]?.anchor.removeAttribute("aria-current");
    selected = index;
    topic.row.classList.add("vcx-selected");
    topic.anchor.setAttribute("aria-current", "true");
    if (keyboard) {
      topic.anchor.focus({ preventScroll: true });
      topic.row.scrollIntoView({ block: "nearest" });
    }
  }

  function openTopic(id, full = false) {
    if (!/^\d+$/.test(id)) return;
    rememberListing(page.path, topics, id);
    writeSession("preview", full ? id : null);
    navigateTopic(href(`/t/${id}`));
  }

  function move(step) {
    if (topics.length) {
      const index = selected + step;
      if (topics[index]) selectTopic(index, true);
      else notify(step > 0 ? "已到本页末尾" : "已到本页开头");
      return;
    }
    if (page.kind !== "topic") return;
    const listing = listingFor(page.id);
    if (!listing) return notify("从话题列表打开后即可连续切换");
    const next = listing.ids[listing.ids.indexOf(page.id) + step];
    if (next) openTopic(next, focus);
    else notify(step > 0 ? "已到本页末尾" : "已到本页开头");
  }

  function preview() {
    if (topics[selected]) return openTopic(topics[selected].id, true);
    if (!reader) return;
    focus = !focus;
    if (focus) mobilePanel = false;
    sync();
  }

  function toggleBoss() {
    boss = !boss;
    if (boss) {
      previousFocus = document.activeElement;
      dialogs.close(false);
      lastScroll = scroller.scrollTop;
      titleBeforeBoss = document.title;
      document.title = "lib.rs — Codex";
      toast.hidden = true;
      mobileSidebar = false;
      sync();
      panel.querySelector("pre:not([hidden])").focus({ preventScroll: true });
      return;
    }
    document.title = titleBeforeBoss;
    sync();
    if (previousFocus?.isConnected && !previousFocus.closest("[hidden], [inert]")) previousFocus.focus({ preventScroll: true });
    scroller.scrollTop = lastScroll;
  }

  function togglePanel() {
    const open = panel.hidden;
    focus = false;
    mobileSidebar = false;
    if (wide.matches) {
      settings.codePanel = open ? "on" : "off";
      saveSettings();
    } else {
      mobilePanel = open;
      sync();
      if (open) panel.querySelector("pre:not([hidden])").focus({ preventScroll: true });
      else panelButton.focus({ preventScroll: true });
    }
  }

  function toggleSidebar() {
    if (small.matches) {
      mobileSidebar = !mobileSidebar;
      mobilePanel = false;
    } else desktopSidebar = !desktopSidebar;
    sync();
    if (small.matches) {
      const target = mobileSidebar
        ? sidebar.querySelector('.vcx-brand, .vcx-account-navigation [aria-current="page"]:not([hidden])') || sidebar.querySelector('[data-action="sidebar"]')
        : bar.querySelector('[data-action="sidebar"]');
      target.focus({ preventScroll: true });
    }
    if (!small.matches && sidebar.hidden) bar.querySelector('[data-action="sidebar"]').focus({ preventScroll: true });
  }

  function closeOverlay() {
    if (small.matches && mobileSidebar) return toggleSidebar();
    if (!wide.matches && !panel.hidden) togglePanel();
  }

  async function copy(text, success) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement("textarea");
      field.className = "vcx-copy-field";
      field.value = text;
      const active = document.activeElement;
      document.body.append(field);
      field.select();
      let copied = false;
      try { copied = document.execCommand("copy"); } catch { /* Clipboard was denied. */ }
      field.remove();
      active?.focus({ preventScroll: true });
      if (!copied) return notify("无法访问剪贴板");
    }
    if (!boss || success === "代码已复制") notify(success);
  }

  function copyTopic() {
    const id = topics[selected]?.id || page.id;
    if (id) copy(new URL(`/t/${id}`, page.url).href, "已复制原帖链接");
  }

  function toggleProject(button) {
    const slug = button.dataset.project;
    const branch = document.getElementById(button.getAttribute("aria-controls"));
    branch.hidden = !branch.hidden;
    button.setAttribute("aria-expanded", String(!branch.hidden));
    button.textContent = branch.hidden ? "展开显示 ↓" : "收起 ↑";
    sidebar.querySelector(`[data-folder="${slug}"]`).innerHTML = icon(branch.hidden ? "folder" : "folderOpen");
  }

  function toggleProjects(button) {
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? "收起" : "展开显示";
    for (const project of sidebar.querySelectorAll("[data-extra-project]")) project.hidden = !open;
  }

  function showFloors() {
    const floors = [{ index: -1, label: "1 楼 · 楼主" }, ...reader.floors()];
    dialogs.open(`${dialogHeader("选择楼层")}<div class="vcx-dialog-body vcx-floor-list">${floors.map(({ index, label }) =>
      `<button type="button" class="vcx-action" data-action="jump-floor" data-index="${index}"><span>${escape(label)}</span></button>`,
    ).join("")}</div>`);
  }

  const actions = {
    sidebar: toggleSidebar,
    panel: togglePanel,
    scrim: closeOverlay,
    back: () => historyTarget.back(),
    forward: () => historyTarget.forward(),
    settings: () => dialogs.open(settingsDialog(settings, demo)),
    help: () => dialogs.open(helpDialog()),
    more: () => dialogs.open(moreDialog(href, account, topics.length > 0 || Boolean(reader), focus)),
    floors: showFloors,
    "jump-floor": button => {
      const index = Number(button.dataset.index);
      dialogs.close(false);
      const floor = reader.jump(index);
      if (floor) floorButton.textContent = `${floor} / ${page.floors}`;
    },
    projects: toggleProjects,
    project: toggleProject,
    search: settingsSearch ? () => {
      if (dialog.open) dialogs.close(false);
      if (sidebar.hidden) toggleSidebar();
      settingsSearch.focus({ preventScroll: true });
    } : dialogs.search,
    close: () => dialogs.close(),
    boss: toggleBoss,
    theme: () => { settings.theme = root.classList.contains("vcx-dark") ? "light" : "dark"; saveSettings(); },
    original: onOriginal,
    preview: () => { dialogs.close(); preview(); },
    copy: () => { dialogs.close(); copyTopic(); },
    "copy-code": () => copy(example, "代码已复制"),
    "editor-view": button => { editorView = button.dataset.view; syncEditor(); },
  };

  wrapperContents.addEventListener("click", event => {
    const trigger = event.target.closest("[data-action]");
    if (trigger) actions[trigger.dataset.action]?.(trigger);
    const result = event.target.closest("a[data-topic]");
    if (result) rememberListing(page.path, topics, result.dataset.topic);
  });
  dialog.addEventListener("change", event => {
    const setting = event.target.dataset.setting;
    if (!setting) return;
    settings[setting] = setting === "images" ? event.target.checked : event.target.value;
    if (setting === "codePanel") {
      mobilePanel = null;
      if (!wide.matches && settings.codePanel === "on") mobileSidebar = false;
    }
    saveSettings();
  });

  page.main.addEventListener("click", event => {
    if (focus && event.target.closest('[onclick*="replyOne("]')) {
      focus = false;
      sync();
    }
  }, { capture: true });

  page.main.addEventListener("click", event => {
    const control = event.target.closest("a, button, input, select, textarea");
    if (control && !control.closest(".item_title")) return;
    const row = event.target.closest(".vcx-native-row");
    const topic = row && topics.find(item => item.row === row);
    if (!topic || event.defaultPrevented) return;
    rememberListing(page.path, topics, topic.id);
    if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openTopic(topic.id);
  });

  function keydown(event) {
    if (event.defaultPrevented || event.isComposing || event.altKey) return;
    const key = event.key.toLowerCase();
    const element = event.target;
    const editing = element.matches?.("input, textarea, select") || element.isContentEditable;
    let action;
    if (key === "k" && (event.ctrlKey || event.metaKey) && !boss) action = actions.search;
    else if (event.ctrlKey || event.metaKey || event.shiftKey) return;
    else if (key === "escape" && dialog.open) action = () => dialogs.close();
    else if (!editing && key === "b" && !event.repeat) action = toggleBoss;
    else if (key === "escape" && root.classList.contains("vcx-overlay")) action = closeOverlay;
    else if (dialog.open || boss || editing || root.classList.contains("vcx-overlay")) return;
    else if (key === "escape" && focus) action = preview;
    else if (key === "k" || key === "j") action = () => move(key === "k" ? 1 : -1);
    else if (key === "v" && !event.repeat) action = preview;
    else if (key === "c" && !event.repeat && !getSelection()?.toString()) action = copyTopic;
    else if (key === "enter" && topics[selected] && !event.repeat && !element.closest?.("a, button, summary")) {
      action = () => openTopic(topics[selected].id);
    }
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    action();
  }

  document.addEventListener("keydown", keydown, true);
  small.addEventListener("change", () => { mobileSidebar = false; sync(); });
  wide.addEventListener("change", () => { mobilePanel = null; sync(); });
  systemDark.addEventListener("change", sync);
}
