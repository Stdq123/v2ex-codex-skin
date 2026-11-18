import { readerIcons, replyActivity } from "./reader-activity.js";
import { relativeTime } from "./v2ex.js";

const topicReportLabel = /^(?:(?:报告|举报)这个主题|你已对本主题进行了报告|Report this topic|You have already reported this topic)[。.!！]?$/i;

function hideTopicReport(main) {
  const reportLink = 'a[href*="/report/topic/"], [onclick*="/report/topic/"]';
  for (const element of main.querySelectorAll(`:scope > .box, a, button, ${reportLink}`)) {
    if (element.closest(".topic_content, .reply_content, #topic-replies")) continue;
    if (!element.matches(reportLink) && !topicReportLabel.test(element.textContent.trim())) continue;
    element.hidden = true;
    const spacer = element.previousElementSibling;
    if (element.parentElement === main && spacer?.matches(".sep20")) spacer.hidden = true;
  }
}

function postActions(url, copy) {
  const actions = document.createElement("div");
  actions.className = "vcx-turn-actions";
  const link = document.createElement("button");
  link.type = "button";
  link.innerHTML = `${readerIcons.link}<span>复制链接</span>`;
  link.addEventListener("click", () => copy(url, "链接已复制"));
  actions.append(link);
  return actions;
}

function layoutOriginalPost(main, createActions) {
  const heading = main.querySelector(".header h1, h1");
  const header = heading?.closest(".header");
  const box = header?.closest(".box");
  if (!box) return heading;

  box.classList.add("vcx-native-topic");
  const content = box.querySelector(":scope > .topic_content, :scope > :is(.cell, .inner) .topic_content");
  const original = content?.closest(".vcx-native-topic > :is(.cell, .inner)") || content || document.createElement("div");
  if (content) heading.classList.add("vcx-visually-hidden");
  else original.append(heading);
  original.classList.add("vcx-original-post", "vcx-post-bubble");
  header.before(original);

  const footer = document.createElement("div");
  footer.className = "vcx-turn-footer";
  const byline = document.createElement("div");
  byline.className = "vcx-turn-byline";
  byline.innerHTML = '<span class="vcx-post-dot" aria-hidden="true"></span>';
  const author = header.querySelector("small.gray");
  const date = author?.querySelector("time, span[title]");
  if (date) date.textContent = relativeTime(date);
  if (author) {
    author.prepend("楼主 · ");
    const views = author.lastChild;
    if (views?.nodeType === Node.TEXT_NODE) {
      views.textContent = views.textContent.replace(/([\d,]+)\s*(?:views?|次(?:阅读|点击))\s*$/i, "阅读 $1");
    }
    byline.append(author);
  } else {
    byline.append("楼主");
  }

  const actions = createActions();
  const toolbar = box.querySelector(":scope > .topic_buttons");
  toolbar?.querySelector('a[href*="/favorite/topic/"], a[href*="/unfavorite/topic/"]')
    ?.insertAdjacentHTML("afterbegin", readerIcons.bookmark);
  toolbar?.querySelector('[onclick*="thankTopic("]')?.insertAdjacentHTML("afterbegin", readerIcons.like);
  const stats = toolbar?.querySelector(".topic_stats");
  if (stats) {
    if (author?.textContent.includes("阅读 ")) stats.hidden = true;
    else byline.append(stats);
  }
  const votes = header.querySelector(".votes");
  if (votes) actions.prepend(votes);
  if (toolbar) actions.prepend(toolbar);
  footer.append(byline, actions);
  header.classList.add("vcx-op-meta");
  header.append(footer);

  for (const supplement of box.querySelectorAll(":scope > .subtle:has(.topic_content)")) {
    supplement.classList.add("vcx-post-bubble");
  }
  return original;
}

function layoutTopicTags(original, replies) {
  if (!original?.classList.contains("vcx-original-post") || !replies) return;

  const tagLink = "a.tag[href^='/tag/']";
  const emptySummary = replies.querySelector(`:scope > #no-comments-yet ~ .box:has(> .inner :is(.fa-tags, ${tagLink}))`);
  emptySummary?.classList.add("vcx-reply-summary");
  const tags = replies.querySelectorAll(`:is(.vcx-reply-summary, .reply-threads > .cell:first-child:not([id])) ${tagLink}`);
  if (!tags.length) return;

  let nav = original.querySelector(":scope > .vcx-topic-tags");
  if (!nav) {
    nav = document.createElement("nav");
    nav.className = "vcx-topic-tags";
    nav.setAttribute("aria-label", "话题标签");
    original.append(nav);
  }
  for (const tag of tags) {
    tag.classList.remove("tag");
    const name = tag.textContent.trim();
    tag.textContent = name.startsWith("#") ? name : `#${name}`;
  }
  nav.replaceChildren(...tags);
}

function layoutReply(row, index, topicId, createActions) {
  const content = row.querySelector(".reply_content");
  if (!content || row.classList.contains("vcx-turn")) return;
  const column = content.parentElement;
  const header = column.querySelector(":scope > .flex-one-row");
  const controls = column.querySelector(":scope > .fr");
  const author = header?.querySelector("strong") || column.querySelector(":scope > strong");
  const date = header?.querySelector("time, .ago") || column.querySelector(":scope > :is(time, .ago)");
  const thanks = header?.querySelector(".small.fade:has(img)") || column.querySelector(":scope > .small.fade:has(img)");
  const number = header?.querySelector(".no") || controls?.querySelector(".no") || column.querySelector(":scope > .no");
  const replyNumber = Number(number?.textContent);
  if (number) number.hidden = true;
  row.dataset.vcxFloor = replyNumber ? replyNumber + 1 : index + 2;
  const replyId = Number(row.id.slice(2)) || replyNumber || index + 1;
  const { floorIcon, thinking, lines } = replyActivity(topicId, replyId);

  const footer = document.createElement("div");
  footer.className = "vcx-turn-footer vcx-reply-meta";
  const byline = document.createElement("div");
  byline.className = "vcx-turn-byline";
  byline.innerHTML = floorIcon;
  byline.append(`${row.dataset.vcxFloor} 楼`);
  if (author) byline.append("·", author);
  if (date) {
    date.textContent = relativeTime(date);
    byline.append("·", date);
  }
  if (thanks) {
    thanks.classList.add("vcx-reply-thanks");
    thanks.title = `${thanks.textContent.trim()} 次感谢`;
    thanks.insertAdjacentHTML("afterbegin", readerIcons.like);
    byline.append(thanks);
  }

  const actions = createActions(row.id);
  for (const group of [header, controls]) {
    if (!group) continue;
    group.classList.add("vcx-native-reply-actions");
    actions.prepend(group);
  }
  for (const [handler, label, glyph] of [["replyOne", "回复", "reply"], ["thankReply", "感谢", "like"], ["ignoreReply", "隐藏", "noentry"]]) {
    const control = actions.querySelector(`[onclick*="${handler}("]`);
    if (!control) continue;
    control.classList.add("vcx-reply-action");
    control.insertAdjacentHTML("afterbegin", readerIcons[glyph]);
    if (!control.textContent.trim()) control.append(label);
  }
  footer.append(byline, actions);
  content.after(...lines, footer);
  const spacer = content.previousElementSibling;
  if (spacer?.matches(".sep5")) spacer.hidden = true;
  content.before(thinking);
  row.classList.add("vcx-turn");
}

function layoutQuotes(main) {
  for (const quote of main.querySelectorAll(":is(.topic_content, .reply_content) blockquote:not(.vcx-quote-body)")) {
    const details = document.createElement("details");
    details.className = "vcx-quote";
    const summary = document.createElement("summary");
    summary.innerHTML = `${readerIcons.quote}<span>引用</span>${readerIcons.chevronRightSm}`;
    quote.classList.add("vcx-quote-body");
    quote.before(details);
    details.append(summary, quote);
  }
}

function layoutSnippets(main, copy) {
  for (const pre of main.querySelectorAll(".topic_content pre, .reply_content pre")) {
    if (pre.parentElement.classList.contains("vcx-snippet")) continue;
    const code = pre.querySelector("code");
    const language = code?.className.match(/\b(?:language|lang)-([\w#+-]+)/)?.[1] || "代码";
    const frame = document.createElement("div");
    frame.className = "vcx-snippet";
    const header = document.createElement("div");
    header.className = "vcx-snippet-header";
    const label = document.createElement("span");
    label.textContent = language;
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `${readerIcons.copy}复制`;
    button.addEventListener("click", () => copy((code || pre).textContent, "代码已复制"));
    header.append(label, button);
    pre.tabIndex = 0;
    pre.before(frame);
    frame.append(header, pre);
  }
}

export function setupReader(page, { href, copy }) {
  const { main, url } = page;
  hideTopicReport(main);
  const replies = main.querySelector("#topic-replies");
  const emptyNotice = replies?.querySelector(":scope > #no-comments-yet");
  if (emptyNotice) emptyNotice.textContent = "暂无回复";
  const createActions = (id = "") => {
    const path = id ? url.pathname + url.search + "#" + id : url.pathname;
    return postActions(href(path), copy);
  };
  const original = layoutOriginalPost(main, createActions);
  const summary = replies?.querySelector(".reply-threads > .cell:first-child:not([id])");
  if (summary) {
    const total = summary.textContent.match(/(\d[\d,]*)\s*(?:repl(?:y|ies)|条回复)/i)?.[1]?.replaceAll(",", "");
    if (total) page.floors = Number(total) + 1;
    summary.classList.add("vcx-reply-summary");
    summary.parentElement.append(summary);
  }
  let rows = [];

  function sync() {
    layoutTopicTags(original, replies);
    const owners = new Set();
    for (const content of replies?.querySelectorAll(".reply_content") || []) {
      const row = content.closest("[id^='r_']");
      if (row && replies.contains(row)) owners.add(row);
    }
    rows = [...owners];
    for (const [index, row] of rows.entries()) {
      layoutReply(row, index, page.id, createActions);
    }
    layoutQuotes(main);
    layoutSnippets(main, copy);

    for (const image of main.querySelectorAll(".topic_content img, .reply_content img")) {
      if (image.classList.contains("emoji") || image.dataset.vcxImage) continue;
      const picture = image.closest("picture") || image;
      if (picture.dataset.vcxImage) continue;
      picture.dataset.vcxImage = "true";
      const note = document.createElement("span");
      note.className = "vcx-image-note";
      note.textContent = "[图片已隐藏]";
      picture.before(note);
    }
  }

  function revealLinkedReply(hash) {
    if (!hash.startsWith("#r_")) return;
    const target = document.getElementById(hash.slice(1));
    if (!target || !rows.includes(target)) return;
    target.scrollIntoView({ block: "start" });
  }
  window.addEventListener("hashchange", () => revealLinkedReply(location.hash));
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      sync();
    });
  }).observe(main, { childList: true, subtree: true });

  sync();
  if (url.hash) requestAnimationFrame(() => revealLinkedReply(url.hash));
  if (!page.floors && original) page.floors = rows.length + 1;
  return {
    floors() {
      return rows.map((row, index) => {
        const author = row.querySelector(".vcx-reply-meta strong")?.textContent.trim() || "";
        return { index, label: `${row.dataset.vcxFloor || index + 2} 楼${author ? ` · ${author}` : ""}` };
      });
    },
    jump(index) {
      const target = index < 0 ? original : rows[index];
      if (!target) return;
      target.scrollIntoView({ block: "start" });
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      return index < 0 ? 1 : Number(target.dataset.vcxFloor) || index + 2;
    },
  };
}
