import { escape, icon, link } from "./ui.js";

const groups = [
  ["账号", [
    ["profile", "通用", "gear"],
    ["social", "个人资料", "person"],
    ["avatar", "头像", "pencil"],
    ["crypto", "加密货币", "branch"],
  ]],
  ["访问", [
    ["password", "密码", "lock"],
    ["invite", "邀请码", "inbox"],
    ["tokens", "个人访问令牌", "command"],
    ["2fa", "2FA", "lock"],
  ]],
  ["社区", [
    ["block", "屏蔽", "filter"],
    ["privacy", "隐私", "bookmark"],
  ]],
].map(([label, entries]) => ({
  label,
  entries: entries.map(([id, name, glyph]) => ({ id, name, glyph, path: `/settings/${id}` })),
}));

const entries = new Map(groups.flatMap(group => group.entries.map(entry => [entry.path, entry])));

export function accountSettingFor(pathname) {
  const path = pathname.replace(/\/$/, "");
  return entries.get(path === "/settings" ? "/settings/profile" : path);
}

export function accountSettingsSidebar(setting, href) {
  return `<div class="vcx-account-sidebar-header">
    <h2>设置</h2>
    <label class="vcx-search-field vcx-account-search">
      ${icon("search")}<input type="search" aria-label="搜索设置分类" placeholder="搜索设置" autocomplete="off" spellcheck="false">
    </label>
  </div>
  <div class="vcx-sidebar-body">
    <nav class="vcx-account-navigation" aria-label="设置分类">
      ${groups.map(group => `<section class="vcx-account-group vcx-nav-section">
        <h2>${escape(group.label)}</h2>
        <div class="vcx-nav">${group.entries.map(entry => link(href(entry.path), entry.name, entry.glyph,
          `data-account-setting="${entry.id}"${entry.id === setting.id ? ' aria-current="page"' : ""}`,
        )).join("")}</div>
      </section>`).join("")}
    </nav>
    <p class="vcx-account-no-results" role="status" hidden>没有匹配的设置分类</p>
  </div>`;
}

function hideNativeMenu(main, url) {
  for (const region of main.querySelectorAll("#Tabs, .tabs, .settings-tabs, .settings-nav, .header, .cell, .inner, nav")) {
    if (region.querySelector("form, input, button, select, textarea, .problem, [role='alert']")) continue;
    const links = [...region.querySelectorAll("a[href]")];
    const settings = links.filter(anchor => anchor.origin === url.origin && accountSettingFor(anchor.pathname));
    if (settings.length >= 3 && links.every(anchor => settings.includes(anchor) || (anchor.origin === url.origin && anchor.pathname === "/"))) {
      region.classList.add("vcx-account-native-menu");
    }
  }
}

function groupProfileFields(table) {
  const rows = [...table.rows];
  if (table.tBodies.length !== 1 || rows.some(row => row.cells.length !== 2 || [...row.cells].some(cell => cell.colSpan !== 1 || cell.rowSpan !== 1))) return;
  const firstPreference = rows.findIndex(row => row.cells[1].querySelector('select, input[type="radio"], input[type="checkbox"]'));
  if (firstPreference < 1) return;

  table.classList.add("vcx-account-profile-table");
  table.closest(".box")?.classList.add("vcx-account-profile-box");
  for (const row of rows) {
    const [label, content] = row.cells;
    if (!label.textContent.trim() && !label.firstElementChild && content.querySelector("small, .gray, .fade") && !content.querySelector("input, select, textarea, button")) {
      row.classList.add("vcx-account-note-row");
    }
  }
  for (const [name, fields] of [["账号信息", rows.slice(0, firstPreference)], ["站点偏好", rows.slice(firstPreference)]]) {
    const row = document.createElement("tr");
    row.className = "vcx-account-section-title";
    const label = document.createElement("h2");
    label.textContent = name;
    const cell = row.insertCell();
    cell.colSpan = 2;
    cell.append(label);
    fields[0].before(row);
    fields[0].classList.add("vcx-account-card-first");
    fields.at(-1).classList.add("vcx-account-card-last");
  }
}

function arrangeFields(main, setting) {
  for (const table of main.querySelectorAll("form table")) {
    if (table.querySelector("th") || ![...table.rows].every(row => row.cells.length <= 2)) continue;
    if ([...table.rows].some(row => row.cells[1]?.querySelector("input, select, textarea, button"))) {
      table.classList.add("vcx-account-field-table");
      if (setting.id === "profile") groupProfileFields(table);
    }
  }
  if (setting.id !== "profile" && setting.id !== "privacy") return;
  for (const field of main.querySelectorAll('input[type="checkbox"]')) {
    const row = field.closest("tr, .cell, .privacy-settings-form > div");
    if (row?.querySelectorAll('input[type="checkbox"]').length !== 1) continue;
    const wrapper = field.closest(".onoffswitch");
    if (!wrapper) {
      field.classList.add("vcx-account-switch");
      continue;
    }
    const label = field.nextElementSibling;
    if (field.parentElement !== wrapper || !label?.matches("label:has(.frame, .switch)")) continue;
    wrapper.classList.add("vcx-account-native-switch");
    const name = row.cells?.[0]?.textContent.trim();
    if (name && !label.textContent.trim() && !field.hasAttribute("aria-label") && !field.hasAttribute("aria-labelledby")) {
      field.setAttribute("aria-label", name);
    }
  }
}

export function mountAccountSettings(page, sidebar) {
  const { main, setting, url } = page;
  hideNativeMenu(main, url);
  arrangeFields(main, setting);
  const nativeHeading = main.querySelector(":scope > .box > .page-content-header");
  if (nativeHeading && !nativeHeading.querySelector("a, button, input, [role='button']")) {
    nativeHeading.classList.add("vcx-account-native-heading");
  }
  const heading = document.createElement("header");
  heading.className = "vcx-account-heading";
  const title = document.createElement("h1");
  title.textContent = setting.name;
  heading.append(title);
  main.classList.add("vcx-account-page");
  main.prepend(heading);

  const search = sidebar.querySelector(".vcx-account-search input");
  const sections = [...sidebar.querySelectorAll(".vcx-account-group")];
  const empty = sidebar.querySelector(".vcx-account-no-results");
  function filter() {
    const query = search.value.trim().toLowerCase();
    let matches = 0;
    for (const section of sections) {
      const items = [...section.querySelectorAll("[data-account-setting]")];
      for (const item of items) {
        const label = `${item.dataset.accountSetting} ${item.lastElementChild.textContent}`.toLowerCase();
        item.hidden = !label.includes(query);
        if (!item.hidden) matches++;
      }
      section.hidden = items.every(item => item.hidden);
    }
    empty.hidden = matches > 0;
  }
  search.addEventListener("input", filter);
  search.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !search.value) return;
    event.preventDefault();
    search.value = "";
    filter();
  });
  return search;
}
