import { mount, prepareSkin } from "./app.js";
import { restoreTopicDraft } from "./composer.js";
import { loadSettings, readSession, writeSession } from "./settings.js";
import { bindTopicFrame, createTopicNavigation, signalTopicReady, topicFrameSelector } from "./topic-navigation.js";
import { describePage, routeFor, withDefaultTab } from "./v2ex.js";

const parameter = "v2ex-codex";

function run(url, route, disabled, settings, frame) {
  const main = document.getElementById("Main");
  if (!document.getElementById("Wrapper") || !main || !document.getElementById("Top")) return;
  const page = describePage(main, route, url);
  if (!page) return;

  if (disabled) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "启用 Codex 皮肤";
    button.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2000;padding:8px 12px;border:1px solid #71747b;border-radius:8px;background:#252628;color:#f0f0f0;font:13px system-ui;cursor:pointer";
    button.addEventListener("click", () => {
      writeSession("disabled", false);
      url.searchParams.delete(parameter);
      location.replace(url.href);
    });
    document.body.append(button);
    return;
  }

  const original = new URL(url);
  original.searchParams.set(parameter, "off");
  const navigation = frame ? bindTopicFrame(frame) : page.kind === "list" ? createTopicNavigation() : null;
  mount(page, {
    href: path => new URL(path, url).href,
    original: original.href,
    settings,
    navigateTopic: navigation?.open,
    historyTarget: frame ? window.parent.history : history,
    onOriginal: () => {
      writeSession("disabled", true);
      (frame ? window.parent.location : location).assign(original.href);
    },
  });
}

function start(frame) {
  const url = new URL(location.href);
  const route = routeFor(url);
  if (frame && route?.kind !== "topic") return;
  const disabled = url.searchParams.get(parameter) === "off" || readSession("disabled") === true;
  const restoreDraft = !disabled && /^\/new(?:\/[\w-]+)?\/?$/i.test(url.pathname);
  if (!route && !restoreDraft) return;

  const settings = route && !disabled ? loadSettings() : null;
  const waitingForSite = document.readyState === "loading" ||
    (document.readyState === "interactive" && performance.getEntriesByType("navigation")[0]?.domContentLoadedEventStart === 0);
  let rootObserver;
  let revealPage;
  if (settings && waitingForSite) {
    if (document.documentElement) {
      revealPage = prepareSkin(settings);
    } else {
      rootObserver = new MutationObserver(() => {
        if (!document.documentElement) return;
        rootObserver.disconnect();
        revealPage = prepareSkin(settings);
      });
      rootObserver.observe(document, { childList: true });
    }
  }

  const destination = settings ? withDefaultTab(url) : url;
  if (destination !== url) {
    location.replace(destination.href);
    return;
  }

  function finish() {
    rootObserver?.disconnect();
    try {
      if (restoreDraft) restoreTopicDraft(url.pathname);
      if (route) run(url, route, disabled, settings, frame);
    } finally {
      revealPage?.();
      if (frame) signalTopicReady(frame);
    }
  }

  if (waitingForSite) {
    // Let V2EX bind its own controls before rearranging them.
    document.addEventListener("DOMContentLoaded", () => setTimeout(finish, 0), { once: true });
  } else if (document.readyState === "interactive") {
    setTimeout(finish, 0);
  } else {
    finish();
  }
}

if (/(^|\.)v2ex\.com$/i.test(location.hostname)) {
  const frame = window.frameElement;
  if (window.parent === window || frame?.matches(topicFrameSelector)) start(frame);
}
