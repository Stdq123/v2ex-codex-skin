import { accountSettingFor } from "./account-settings.js";
import { readSession, writeSession } from "./settings.js";
import { icon, iconButton } from "./ui.js";

export const projects = [
  ["all", "全部"], ["tech", "技术"], ["creative", "创意"], ["play", "好玩"], ["apple", "Apple"],
  ["jobs", "酷工作"], ["deals", "交易"], ["city", "城市"], ["qna", "问与答"],
  ["hot", "最热"], ["r2", "R2"],
].map(([slug, name]) => ({ slug, name, file: `${slug}.ts`, path: `/?tab=${slug}` }));

export const defaultProject = projects.find(project => project.slug === "all");

export function withDefaultTab(url) {
  if (url.pathname !== "/" || url.searchParams.get("tab")) return url;
  const target = new URL(url);
  target.searchParams.set("tab", defaultProject.slug);
  return target;
}

export function routeFor(url) {
  const { pathname, searchParams } = url;
  if (pathname === "/") {
    const tab = searchParams.get("tab") || defaultProject.slug;
    const project = projects.find(project => project.slug === tab);
    return project && { kind: "list", name: project.name, file: project.file, tab };
  }
  if (pathname === "/recent") return { kind: "list", name: "最新", file: "recent.ts" };
  if (pathname === "/planes") return { kind: "directory", name: "节点目录", file: "nodes.ts" };
  const node = pathname.match(/^\/go\/([\w-]+)\/?$/i);
  if (node) return { kind: "list", name: node[1], file: `${node[1]}.ts`, node: node[1] };
  const topic = pathname.match(/^\/t\/(\d+)\/?$/);
  if (topic) return { kind: "topic", id: topic[1], file: `#${topic[1]}` };
  const newTopic = pathname.match(/^\/new(?:\/([\w-]+))?\/?$/i);
  if (newTopic || /^\/write\/?$/.test(pathname)) {
    const slug = newTopic ? newTopic[1] : searchParams.get("node");
    return { kind: "new", name: "新话题", node: /^[\w-]+$/.test(slug || "") ? slug : undefined };
  }
  const setting = accountSettingFor(pathname);
  if (setting) return { kind: "settings", setting, name: setting.name };
  return null;
}

export function topicId(path) {
  return path?.match(/^\/t\/(\d+)(?:[?#]|$)/)?.[1] ?? null;
}

function label(element) {
  return element?.textContent.trim().replace(/\s+/g, " ") || "";
}

export function relativeTime(element) {
  if (!element) return "";
  const timestamp = element.dateTime || element.title;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.valueOf())) return label(element);
  const minutes = Math.max(0, Math.floor((Date.now() - date.valueOf()) / 60000));
  if (minutes === 0) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  if (date.getFullYear() === new Date().getFullYear()) return `${date.getMonth() + 1}-${date.getDate()}`;
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function newTopicPath(page) {
  return page.node ? `/new/${encodeURIComponent(page.node)}` : "/new";
}

export function describePage(main, route, url) {
  const page = { ...route, path: url.pathname + url.search, url, main };
  if (page.kind === "topic") {
    const title = main.querySelector(".header h1, h1");
    if (!title) return null;
    page.name = label(title);
    const node = title.closest(".header")?.querySelector('a[href^="/go/"]');
    page.node = node?.getAttribute("href")?.match(/^\/go\/([\w-]+)\/?$/)?.[1];
    page.nodeName = label(node);
    page.back = listingFor(page.id)?.path || defaultProject.path;
    return page;
  }

  if (page.kind === "new") {
    page.back = page.node ? `/go/${page.node}` : defaultProject.path;
    return page;
  }
  if (page.kind === "settings") return page;

  if (page.node) {
    const header = main.querySelector(".node-header, .box-title");
    if (!header) return null;
    const title = header.querySelector(".node-title, .page-content-header h1, .node-name");
    const browserTitle = main.ownerDocument.title.match(/^V2EX\s*[›»]\s*(.+)$/);
    page.name = label(title) || browserTitle?.[1] || page.name;
  } else if (page.tab && !main.querySelector("#Tabs, .item_title")) {
    return null;
  } else if (!main.querySelector(".box")) {
    return null;
  }
  return page;
}

function rowLayout(row, anchor, url) {
  const info = row.querySelector(".topic_info");
  const nodeLink = info?.querySelector('a[href^="/go/"]');
  const userLinks = info?.querySelectorAll('a[href^="/member/"]');
  const authorLink = userLinks?.[0];
  const latestAuthor = userLinks?.[userLinks.length - 1];
  const time = info?.querySelector("time, .ago, span[title]");
  const timestamp = relativeTime(time);
  const count = row.querySelector(".count_livid, .count_orange");
  const pinned = row.matches(".item-pinned, .sticky") || Boolean(row.querySelector(".fa-thumb-tack, .fa-thumbtack"));
  const node = label(nodeLink);
  const author = label(authorLink);
  const title = label(anchor);
  const table = anchor.closest("table");

  const dot = document.createElement("span");
  dot.className = pinned ? "vcx-row-pin" : "vcx-row-dot";
  dot.setAttribute("aria-hidden", "true");
  if (pinned) dot.innerHTML = icon("pin");

  const texts = document.createElement("div");
  texts.className = "vcx-row-texts";
  const titleWrap = anchor.closest(".item_title");
  if (!anchor.title) anchor.title = title;
  texts.append(titleWrap);
  const sub = document.createElement("div");
  sub.className = "vcx-row-sub";
  if (nodeLink) sub.append(nodeLink);
  if (latestAuthor) {
    if (sub.childElementCount) sub.append(" · ");
    latestAuthor.textContent = "@" + label(latestAuthor);
    sub.append(latestAuthor);
  }
  if (sub.childElementCount) texts.append(sub);

  const meta = document.createElement("div");
  meta.className = "vcx-row-meta";
  const replies = document.createElement("span");
  replies.className = "vcx-row-replies";
  const replyCount = /^\d+$/.test(label(count)) ? label(count) : "0";
  if (count) {
    count.textContent = `${replyCount} 回复`;
    count.setAttribute("aria-label", `${replyCount} 条回复`);
    replies.append(count);
  } else replies.textContent = "0 回复";
  meta.append(replies);
  if (pinned || timestamp) {
    const date = document.createElement("span");
    date.className = "vcx-row-time";
    date.textContent = pinned ? "置顶" : timestamp;
    if (!pinned && time?.title) date.title = time.title;
    meta.append(date);
  }
  const layout = document.createElement("div");
  layout.className = "vcx-row-layout";
  layout.append(dot, texts, meta);
  if (table && row.contains(table)) table.replaceWith(layout);
  else row.replaceChildren(layout);
  row.classList.add("vcx-native-row");
  const id = topicId(new URL(anchor.getAttribute("href"), url).pathname);
  row.dataset.vcxTopic = id;
  return { id, row, anchor, title, node, author, pinned };
}

export function readTopics(main, url) {
  const seen = new Set();
  const topics = [];
  for (const anchor of main.querySelectorAll(".item_title a[href]")) {
    const href = new URL(anchor.getAttribute("href"), url);
    const id = href.origin === url.origin && topicId(href.pathname);
    const row = anchor.closest(".item, #TopicsNode .cell");
    if (!id || seen.has(id) || !row || !anchor.closest(".item_title")) continue;
    seen.add(id);
    topics.push(rowLayout(row, anchor, url));
  }
  return topics;
}

function storedListing() {
  const listing = readSession("listing");
  return typeof listing?.path === "string" && /^\/(?![/\\])/.test(listing.path) && Array.isArray(listing.ids)
    ? listing
    : null;
}

export function listingFor(id) {
  const listing = storedListing();
  return listing?.ids.includes(id) ? listing : null;
}

export function rememberListing(path, topics, selected) {
  if (topics.length) writeSession("listing", { path, ids: topics.map(topic => topic.id), selected });
}

export function previousSelection(path) {
  const listing = storedListing();
  return listing?.path === path ? listing.selected : null;
}

export function recentTopics(page) {
  const saved = readSession("recent");
  const recent = Array.isArray(saved) ? saved.filter(item => /^\d+$/.test(item?.id) && typeof item.title === "string") : [];
  if (page.kind !== "topic") return recent.slice(0, 6);
  const updated = [{ id: page.id, title: page.name }, ...recent.filter(item => item.id !== page.id)].slice(0, 6);
  writeSession("recent", updated);
  return updated;
}

export function projectThreads(page, topics) {
  const stored = readSession("projects");
  const groups = stored && typeof stored === "object" ? stored : {};
  if (page.tab && topics.length) {
    groups[page.tab] = topics.slice(0, 4).map(({ id, title }) => ({ id, title }));
    writeSession("projects", groups);
  }
  return groups;
}

export function accountLink(document) {
  const account = document.querySelector('#Top a[href^="/member/"]');
  if (account) return { path: account.getAttribute("href"), name: label(account) || "个人主页", signedIn: true };
  const signIn = [...document.querySelectorAll("#Top a[href]")].find(anchor => {
    const url = new URL(anchor.href);
    return url.protocol === "https:" && /(^|\.)v2ex\.com$/i.test(url.hostname) && url.pathname === "/signin";
  });
  return { path: signIn?.href || "/signin", name: "登录", signedIn: false };
}

export function decorateNative(page, href, topics) {
  const { main, kind } = page;
  if (kind === "list") {
    const list = main.querySelector(".item_title")?.closest(".box") || main.querySelector(".box:last-of-type");
    if (!list) return;
    list.classList.add("vcx-native-list");
    const head = document.createElement("div");
    head.className = "vcx-list-head";
    const title = document.createElement("div");
    title.className = "vcx-list-title";
    title.innerHTML = iconButton("filters", "filter", "筛选话题", 'aria-expanded="false" aria-controls="vcx-list-filters"');
    const heading = document.createElement("h1");
    heading.textContent = page.name;
    title.append(heading);
    const newTopic = document.createElement("a");
    newTopic.href = href(newTopicPath(page));
    newTopic.className = "vcx-button";
    newTopic.innerHTML = `${icon("plus")}<span>新话题</span>`;
    head.append(title, newTopic);

    const filters = document.createElement("nav");
    filters.id = "vcx-list-filters";
    filters.setAttribute("aria-label", "筛选话题");
    filters.hidden = true;
    const shortcuts = [["/recent", "最新"], ["/?tab=hot", "最热"], [defaultProject.path, defaultProject.name], ["/planes", "节点目录"]];
    for (const [path, label] of shortcuts) {
      const anchor = document.createElement("a");
      anchor.href = href(path);
      anchor.textContent = label;
      if (page.path === path) anchor.setAttribute("aria-current", "page");
      filters.append(anchor);
    }
    for (const anchor of list.querySelectorAll("#SecondaryTabs a")) {
      anchor.href = href(anchor.getAttribute("href"));
      filters.append(anchor);
    }
    title.querySelector("button").addEventListener("click", event => {
      filters.hidden = !filters.hidden;
      event.currentTarget.setAttribute("aria-expanded", String(!filters.hidden));
    });

    const description = document.createElement("div");
    description.className = "vcx-list-description";
    description.textContent = `共 ${topics.length} 个已加载话题`;
    const nodeHeader = main.querySelector(".node-header, .box-title");
    nodeHeader?.classList.add("vcx-native-node-head");
    (nodeHeader && nodeHeader.parentElement === list.parentElement ? nodeHeader : list).before(head, filters, description);
  }
}
