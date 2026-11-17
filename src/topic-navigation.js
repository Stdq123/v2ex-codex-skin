import { routeFor } from "./v2ex.js";

export const topicFrameSelector = "iframe[data-vcx-topic-frame]";
const readyEvent = "v2ex-codex:topic-ready";
const openEvent = "v2ex-codex:open-page";
const hashEvent = "v2ex-codex:topic-hash";

function topicUrl(value) {
  const url = new URL(value, location.href);
  return url.origin === location.origin && url.searchParams.get("v2ex-codex") !== "off" &&
    routeFor(url)?.kind === "topic" ? url : null;
}

function sameTabLink(event) {
  if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return null;
  const anchor = event.target.closest("a[href]");
  return anchor && (!anchor.target || anchor.target === "_self") && !anchor.hasAttribute("download") ? anchor : null;
}

export function bindTopicFrame(frame) {
  const open = href => frame.dispatchEvent(new CustomEvent(openEvent, { detail: href }));
  const form = document.getElementById("reply_content")?.form;
  if (form && !form.target) form.target = "_top";

  document.addEventListener("click", event => {
    const anchor = sameTabLink(event);
    if (!anchor) return;
    const url = new URL(anchor.href, location.href);
    if (url.protocol !== "https:" && url.protocol !== "http:") return;
    if (url.origin !== location.origin) {
      anchor.target = "_top";
      return;
    }
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    event.preventDefault();
    open(url.href);
  });
  window.addEventListener("hashchange", () => frame.dispatchEvent(new Event(hashEvent)));
  return { open };
}

export function signalTopicReady(frame) {
  frame.dispatchEvent(new Event(readyEvent));
}

export function createTopicNavigation() {
  const listHref = location.href;
  const listTitle = document.title;
  let pending;
  let cached;
  let visible = null;
  let listContents;
  let previousFocus;

  function cancelPending() {
    if (!pending) return;
    clearTimeout(pending.timeout);
    pending.frame.remove();
    pending = null;
  }

  function setFrameVisible(entry, show) {
    entry.frame.classList.toggle("vcx-topic-frame-visible", show);
    entry.frame.inert = !show;
    if (show) entry.frame.removeAttribute("aria-hidden");
    else entry.frame.setAttribute("aria-hidden", "true");
  }

  function showPage(entry) {
    if (visible === entry) return;
    if (visible) setFrameVisible(visible, false);
    if (entry) {
      if (!visible) {
        previousFocus = document.activeElement;
        document.querySelector(".vcx-dialog[open]")?.close();
        listContents = [...document.querySelectorAll("#Wrapper, .vcx-chrome")].map(node => [node, node.inert]);
        for (const [node] of listContents) node.inert = true;
      }
      document.title = entry.title;
      setFrameVisible(entry, true);
      entry.frame.contentWindow.focus();
    } else {
      for (const [node, inert] of listContents) node.inert = inert;
      document.title = listTitle;
      previousFocus?.focus({ preventScroll: true });
    }
    visible = entry;
  }

  function showTopic(entry, push) {
    if (push && entry.href !== location.href) history.pushState({ vcxTopic: true }, "", entry.href);
    else if (entry.href !== location.href) history.replaceState(history.state, "", entry.href);
    showPage(entry);
  }

  function open(value, push = true) {
    const url = topicUrl(value);
    if (!url) {
      location.assign(value);
      return;
    }
    if (pending?.href === url.href && pending.push === push) return;
    cancelPending();
    if (cached?.href === url.href) {
      showTopic(cached, push);
      return;
    }

    const frame = document.createElement("iframe");
    frame.className = "vcx-topic-frame";
    frame.dataset.vcxTopicFrame = "";
    frame.title = "话题详情";
    setFrameVisible({ frame }, false);
    const entry = { frame, href: url.href, title: "", push };

    function fallback() {
      if (pending !== entry) return;
      cancelPending();
      if (push) location.assign(url.href);
      else location.reload();
    }

    frame.addEventListener(readyEvent, () => {
      const doc = frame.contentDocument;
      if (doc?.documentElement?.dataset.vcxPage !== "topic" || !topicUrl(doc.URL)) {
        fallback();
        return;
      }
      entry.href = doc.URL;
      entry.title = doc.title;
      if (pending !== entry) {
        if (visible === entry) {
          history.replaceState(history.state, "", entry.href);
          document.title = entry.title;
        }
        return;
      }
      clearTimeout(entry.timeout);
      pending = null;
      const previous = cached;
      cached = entry;
      showTopic(entry, push);
      previous?.frame.remove();
    });

    frame.addEventListener(openEvent, event => {
      if (visible !== entry) return;
      const target = new URL(event.detail, entry.href);
      if (target.origin !== location.origin) return;
      if (target.href === listHref) {
        cancelPending();
        history.pushState(null, "", target.href);
        showPage(null);
      } else open(target.href);
    });

    frame.addEventListener(hashEvent, () => {
      if (visible !== entry) return;
      const href = frame.contentDocument?.URL;
      if (!href || !topicUrl(href)) return;
      entry.href = href;
      history.replaceState(history.state, "", href);
    });

    frame.addEventListener("load", () => {
      if (pending !== entry) return;
      clearTimeout(entry.timeout);
      entry.timeout = setTimeout(fallback, 3000);
    });
    pending = entry;
    entry.timeout = setTimeout(fallback, 15000);
    frame.src = url.href;
    document.body.append(frame);
  }

  document.addEventListener("click", event => {
    const anchor = sameTabLink(event);
    const url = anchor && topicUrl(anchor.href);
    if (!url) return;
    event.preventDefault();
    open(url.href);
  });
  window.addEventListener("popstate", event => {
    if (event.state?.vcxTopic && topicUrl(location.href)) open(location.href, false);
    else {
      cancelPending();
      showPage(null);
    }
  });
  return { open };
}
