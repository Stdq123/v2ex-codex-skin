import { accountSettingsSidebar } from "./account-settings.js";
import { codePanel } from "./code-panel.js";
import { escape, icon, iconButton, link } from "./ui.js";
import { defaultProject, newTopicPath, projects } from "./v2ex.js";

function iconLink(href, glyph, name, extra = "") {
  return `<a class="vcx-icon-button" href="${escape(href)}" title="${escape(name)}" aria-label="${escape(name)}" ${extra}>${icon(glyph)}</a>`;
}

function threadLinks(items, page, href) {
  return items.filter(item => /^\d+$/.test(item?.id) && typeof item.title === "string").map(item =>
    link(href(`/t/${item.id}`), item.title, "", `data-topic="${item.id}" title="${escape(item.title)}"${item.id === page.id ? ' aria-current="page"' : ""}`),
  ).join("");
}

function projectTree(page, href, groups) {
  const section = page.tab || new URL(page.back || page.path, page.url).searchParams.get("tab") || defaultProject.slug;
  const visibleCount = 6;
  const showAll = projects.findIndex(project => project.slug === section) >= visibleCount;
  return projects.map(({ slug, name, file, path }, index) => {
    const open = section === slug;
    const extra = index >= visibleCount;
    const branch = `vcx-project-${slug}`;
    const children = Array.isArray(groups[slug]) ? threadLinks(groups[slug], page, href) : "";
    return `<div ${extra ? 'data-extra-project' : ""}${extra && !showAll ? ' hidden' : ""}>
      <a class="vcx-action vcx-project" href="${escape(href(path))}" ${slug === page.tab ? 'aria-current="page"' : ""}>
        <span data-folder="${slug}">${icon(open ? "folderOpen" : "folder")}</span><span>${escape(name)}</span><code>${file}</code>
      </a>
      <div class="vcx-project-threads" id="${branch}" ${open ? "" : "hidden"}>${children || link(href(path), "查看话题")}</div>
      <button class="vcx-action vcx-tree-toggle" type="button" data-action="project" data-project="${slug}" aria-controls="${branch}" aria-expanded="${open}">${open ? "收起 ↑" : "展开显示 ↓"}</button>
    </div>`;
  }).join("") + `<button class="vcx-action vcx-projects-toggle" type="button" data-action="projects" aria-expanded="${showAll}">${showAll ? "收起" : "展开显示"}</button>`;
}

export function shell(page, { href, original, recent, groups, account, topics }) {
  const thread = page.kind === "topic";
  const writing = page.kind === "new";
  const settingsPage = page.kind === "settings";
  const simpleContext = writing || settingsPage;
  const context = thread ? page.nodeName || "话题" : page.name;
  const contextPath = thread && page.node ? `/go/${page.node}` : page.path;
  const contextLabel = simpleContext ? `<span aria-current="page">${escape(context)}</span>`
    : `<a href="${escape(href(contextPath))}" title="${escape(context)}">${escape(context)}</a>`;
  const summary = thread ? `${page.name} · ${page.floors || "–"} 楼` : page.kind === "list" ? `全部线程 · ${topics.length || "–"}` : "全部节点";
  const newTopic = href(newTopicPath(page));
  const messages = href(account.signedIn ? "/notifications" : account.path);
  const favorites = href(account.signedIn ? "/my/topics" : account.path);
  const pins = topics.filter(topic => topic.pinned).slice(0, 5);
  const latest = recent.length ? recent.slice(0, 4) : topics.slice(0, 4);

  return `
    <nav class="vcx-strip" aria-label="工作区工具">
      ${iconLink(href(defaultProject.path), "home", "首页", settingsPage ? "" : 'data-active')}
      ${iconLink(href("/recent"), "clock", "近期活动")}
      ${iconLink(messages, "at", "我的消息")}
      ${iconLink(href("/planes"), "grid", "节点目录")}
      <span class="vcx-flex"></span>
      ${account.signedIn || settingsPage ? iconLink(href("/settings"), "person", "账户设置", settingsPage ? 'aria-current="page" data-active' : "") : ""}
      ${iconButton("settings", "gear", "皮肤设置")}
    </nav>
    <button class="vcx-scrim" type="button" data-action="scrim" tabindex="-1" aria-hidden="true"></button>
    <aside class="vcx-sidebar" id="vcx-sidebar" aria-label="${settingsPage ? "账户设置" : "V2EX 导航"}">
      <div class="vcx-window-actions">
        ${iconButton("sidebar", "sidebar", "切换侧栏", 'aria-controls="vcx-sidebar"')}
        ${iconButton("back", "left", "后退")}${iconButton("forward", "right", "前进")}
        <span class="vcx-flex"></span>
        ${iconButton("theme", "moon", "切换明暗主题")}
      </div>
      ${settingsPage ? accountSettingsSidebar(page.setting, href) : `<header class="vcx-side-header">
        <a class="vcx-brand" href="${escape(href(defaultProject.path))}">Codex ${icon("down")}</a>
        <div class="vcx-brand-actions">
          ${iconButton("search", "search", "搜索（Ctrl / ⌘ + K）", 'aria-haspopup="dialog"')}
          ${iconLink(messages, "bell", "通知")}
        </div>
      </header>
      <div class="vcx-sidebar-body">
        <nav class="vcx-nav vcx-primary" aria-label="话题入口">
          ${link(newTopic, "新话题", "pencil", writing ? 'aria-current="page"' : "")}
          ${link(href(defaultProject.path), "话题", "layers", thread || page.kind === "list" ? 'aria-current="page"' : "")}
          ${link(favorites, "我的收藏", "bookmark")}
          ${link(messages, "我的消息", "inbox")}
          ${link(href("/?tab=hot"), "热门话题", "hot")}
          ${link(href("/recent"), "近期活动", "clock")}
          <button class="vcx-action vcx-muted-action" type="button" data-action="more" aria-haspopup="dialog">${icon("more")}<span>更多</span></button>
        </nav>
        ${pins.length ? `<section class="vcx-nav-section"><h2>置顶</h2><div class="vcx-nav">${threadLinks(pins, page, href)}</div></section>` : ""}
        <section class="vcx-nav-section" aria-labelledby="vcx-project-label">
          <h2 id="vcx-project-label">项目</h2>
          <nav class="vcx-nav" aria-label="V2EX 分区">${projectTree(page, href, groups)}</nav>
        </section>
        ${latest.length ? `<section class="vcx-nav-section" aria-labelledby="vcx-recent-label">
          <h2 id="vcx-recent-label">最近</h2>
          <nav class="vcx-nav" aria-label="最近话题">${threadLinks(latest, page, href)}</nav>
        </section>` : ""}
      </div>`}
    </aside>
    <header class="vcx-topbar">
      ${iconButton("sidebar", "sidebar", settingsPage ? "设置分类" : "切换侧栏", 'aria-controls="vcx-sidebar"')}
      ${iconLink(href(page.back || defaultProject.path), "folder", page.back ? "返回话题列表" : "返回项目首页")}
      <div class="vcx-crumb">
        ${contextLabel}
        ${simpleContext ? "" : `<span class="vcx-crumb-sep" aria-hidden="true">/</span><span class="vcx-context" title="${escape(summary)}">${escape(summary)}</span>`}
        ${thread && page.floors ? `<button class="vcx-floor" type="button" data-action="floors" aria-label="选择楼层" aria-haspopup="dialog">1 / ${page.floors}</button>` : ""}
      </div>
      <span class="vcx-flex"></span>
      <div class="vcx-top-actions">
        ${settingsPage ? "" : iconButton("panel", "panel", "切换代码面板", 'aria-controls="vcx-code" aria-pressed="false"')}
        ${iconLink(original, "external", "在原站布局打开", 'target="_blank" rel="noopener"')}
        ${iconButton("more", "dots", "更多操作", 'aria-haspopup="dialog"')}
      </div>
    </header>
    ${codePanel(thread ? "topics" : context)}
    <dialog class="vcx-dialog" id="vcx-dialog" lang="zh-CN" aria-labelledby="vcx-dialog-title"></dialog>
    <div class="vcx-toast" role="status" aria-live="polite" hidden></div>`;
}

export function dialogHeader(title) {
  return `<div class="vcx-dialog-header"><h2 id="vcx-dialog-title">${escape(title)}</h2>${iconButton("close", "close", "关闭")}</div>`;
}

const hotkeys = [
  ["K / J", "选择下一帖 / 上一帖"],
  ["Enter", "打开选中的帖子"],
  ["V", "完整预览"],
  ["C", "复制原帖链接"],
  ["B", "切换到代码工作区"],
  ["Ctrl / ⌘ + K", "搜索本页话题和分区"],
  ["Esc", "关闭弹窗或退出预览"],
];

export function helpDialog() {
  return `${dialogHeader("键盘快捷键")}<div class="vcx-dialog-body vcx-keys">${hotkeys.map(([key, label]) => `<div><span>${label}</span><kbd>${key}</kbd></div>`).join("")}</div>`;
}

export function moreDialog(href, account, canRead, focus) {
  const options = [
    ...(canRead ? [["preview", "expand", focus ? "退出完整预览（V）" : "完整预览（V）"], ["copy", "copy", "复制原帖链接（C）"]] : []),
    ["boss", "terminal", "切换到代码工作区（B）"],
    ["help", "command", "键盘快捷键"],
    ["settings", "gear", "settings.json"],
  ];
  return `${dialogHeader("更多操作")}<div class="vcx-dialog-body vcx-nav">${options.map(([action, glyph, text]) =>
    `<button class="vcx-action" type="button" data-action="${action}">${icon(glyph)}<span>${text}</span></button>`,
  ).join("")}${link(href("/settings"), "账户设置", "gear")}${link(href(account.path), account.name, "person")}</div>`;
}

export function settingsDialog(settings, demo) {
  return `${dialogHeader("settings.json")}
    <div class="vcx-dialog-body vcx-settings">
      <label>配色<select data-setting="theme">
        ${[["system", "跟随系统"], ["light", "浅色"], ["dark", "深色"]].map(([value, label]) => `<option value="${value}"${value === settings.theme ? " selected" : ""}>${label}</option>`).join("")}
      </select></label>
      <label><span>Images<small>显示正文和回复中的图片</small></span><input type="checkbox" role="switch" data-setting="images"${settings.images ? " checked" : ""}></label>
      <label>代码面板<select data-setting="codePanel">
        ${[["auto", "宽屏显示"], ["on", "显示"], ["off", "隐藏"]].map(([value, label]) => `<option value="${value}"${value === settings.codePanel ? " selected" : ""}>${label}</option>`).join("")}
      </select></label>
      ${demo ? "" : '<button class="vcx-button" data-action="original" type="button">切回原站布局</button>'}
    </div>`;
}

