import { composerPlaceholder } from "./composer.js";
import { readSession, writeSession } from "./settings.js";
import { bindTopicFiles } from "./topic-files.js";
import { icon } from "./ui.js";
import { newTopicPath } from "./v2ex.js";

const nativeRow = ".cell, .inner, .dock_area, .header";
const activeControl = 'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea:not([hidden], .vcx-topic-editor-source), [contenteditable], #topic_preview, .problem, #error_message';

function notifyInput(field) {
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

function bodyEditor(main) {
  const field = main.querySelector('textarea#topic_content, textarea[name="content"]');
  const widget = main.querySelector(".CodeMirror");
  const mirror = widget?.CodeMirror;
  if (mirror) {
    field?.classList.add("vcx-topic-editor-source");
    mirror.getInputField?.()?.setAttribute("aria-label", "正文");
    if (mirror.getOption?.("placeholder") !== undefined) {
      mirror.setOption("placeholder", composerPlaceholder);
    } else {
      const syncPlaceholder = () => {
        if (mirror.getValue()) delete widget.dataset.vcxPlaceholder;
        else widget.dataset.vcxPlaceholder = composerPlaceholder;
      };
      mirror.on?.("change", syncPlaceholder);
      syncPlaceholder();
    }
    return {
      element: widget,
      value: () => mirror.getValue(),
      write: text => mirror.setValue(text),
      insert: text => mirror.replaceSelection(text, "end"),
      focus: () => mirror.focus(),
      refresh: () => mirror.refresh?.(),
    };
  }
  if (!field || field.hidden || field.style.display === "none") return null;
  field.rows = 2;
  field.placeholder = composerPlaceholder;
  field.setAttribute("aria-label", "正文");
  return {
    element: field,
    value: () => field.value,
    write(text) { field.value = text; notifyInput(field); },
    insert(text) {
      field.setRangeText(text, field.selectionStart, field.selectionEnd, "end");
      notifyInput(field);
    },
    focus: () => field.focus(),
  };
}

function syntaxValue(host) {
  return host.querySelector('#select_syntax, select[name="syntax"], input[name="syntax"]:checked')?.value;
}

function restoreDraft(page, host, title, editor) {
  const pending = readSession("compose-transfer");
  if (pending?.path !== newTopicPath(page) || typeof pending.text !== "string") return null;
  const switching = typeof pending.title === "string";
  if (!switching && !pending.text.trim()) return null;

  function restore() {
    if (switching) {
      title.value = pending.title;
      notifyInput(title);
      const select = host.querySelector('#select_syntax, select[name="syntax"]');
      const syntax = select ? [...select.options].find(option => option.value === pending.syntax)
        : [...host.querySelectorAll('input[name="syntax"][type="radio"]')].find(field => field.value === pending.syntax);
      if (syntax) {
        if (select) select.value = syntax.value;
        else syntax.checked = true;
        (select || syntax).dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    editor.write(pending.text);
    writeSession("compose-transfer", null);
    if (!switching && readSession("draft:new") === pending.text) writeSession("draft:new", null);
  }

  const body = editor.value();
  const hasDraft = (body && body !== pending.text) || (switching && title.value && title.value !== pending.title);
  if (!hasDraft) {
    restore();
    return null;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.className = "vcx-restore-topic-draft";
  button.textContent = switching ? "载入切换前的草稿" : "载入列表草稿";
  button.addEventListener("click", () => {
    restore();
    button.remove();
    editor.focus();
  });
  return button;
}

function fixedNodeSelect(page, change, report) {
  const select = document.createElement("select");
  select.setAttribute("aria-label", "选择节点");
  const current = page.node || "";
  const nodeLink = current && [...page.main.querySelectorAll('a[href^="/go/"]')].find(link => link.pathname === `/go/${current}`);
  select.append(new Option(nodeLink?.textContent?.trim() || current || "选择节点", current));
  let loading = false;
  async function load() {
    if (loading || select.options.length > 1) return;
    loading = true;
    try {
      const nodes = window.fetchNodeList ? await window.fetchNodeList() : await fetch("/api/nodes/list.json?fields=name,title&sort_by=topics&reverse=1").then(response => response.json());
      if (!Array.isArray(nodes)) throw new Error("Missing nodes");
      const options = document.createDocumentFragment();
      for (const { name, title } of nodes) {
        if (typeof name !== "string" || !/^[\w-]+$/.test(name)) continue;
        if (name === current) select.options[0].text = title || name;
        else options.append(new Option(title || name, name));
      }
      select.append(options);
    } catch {
      report("节点加载失败，请重新打开节点选择");
    } finally {
      loading = false;
    }
  }
  select.addEventListener("focus", load);
  select.addEventListener("change", () => {
    if (select.value !== current && !change(select.value)) select.value = current;
  });
  void load();
  return select;
}

function followPreview(preview, main) {
  if (!preview) return;
  let observer;
  let timeout;
  preview.addEventListener("click", () => {
    const reveal = () => {
      const panel = main.querySelector("#topic_preview");
      if (!panel?.textContent.trim() && !panel?.querySelector("img, iframe")) return;
      if (!panel.getClientRects().length) return;
      observer.disconnect();
      clearTimeout(timeout);
      panel.scrollIntoView({ block: "nearest" });
    };
    observer?.disconnect();
    clearTimeout(timeout);
    observer = new MutationObserver(reveal);
    observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "style"] });
    timeout = setTimeout(() => observer.disconnect(), 8000);
  }, { capture: true });
}

export function mountNewTopic(page, { href, demo }) {
  const { main } = page;
  const title = main.querySelector('input#topic_title, textarea#topic_title, input[name="title"]:not([type="hidden"]), textarea[name="title"]');
  const editor = title && bodyEditor(main);
  if (!title || !editor) return;

  const box = title.closest(".box");
  const form = title.form || editor.element.form;
  const host = form || box || main;
  const node = main.querySelector('select#nodes, select[name="node"], select[name="node_name"]');
  const syntax = main.querySelector('#select_syntax, select[name="syntax"]');
  const publish = main.querySelector('[onclick*="publishTopic("], [data-action="publish"]')
    || [...(form?.elements || host.querySelectorAll("button, input"))].find(control => control.type === "submit");
  const preview = main.querySelector('#preview-button, [onclick*="previewTopic"], [data-action="preview"]');

  const layout = document.createElement("div");
  layout.className = "vcx-new-topic";
  layout.innerHTML = `<div class="vcx-topic-title"><label class="vcx-visually-hidden">话题标题</label></div>
    <section class="vcx-topic-card" aria-label="发帖编辑器">
      <header class="vcx-topic-context">
        <span class="vcx-topic-site">${icon("layers")}<span>V2EX</span></span>
        <div class="vcx-topic-node">${icon("folder")}</div>
      </header>
      <div class="vcx-topic-body"></div>
      <div class="vcx-topic-toolbar">
        <details class="vcx-topic-files">
          <summary aria-label="添加文件" title="添加文件">${icon("plus")}</summary>
          <div class="vcx-topic-file-menu"></div>
        </details>
        <div class="vcx-topic-actions"></div>
      </div>
      <div class="vcx-topic-feedback"><div class="vcx-topic-status" role="status"></div></div>
    </section>`;
  const status = layout.querySelector(".vcx-topic-status");
  const report = message => { status.textContent = message; };
  const rows = new Set();
  function move(control, region) {
    if (!control) return;
    const row = control.closest(nativeRow);
    if (row && !row.contains(host)) rows.add(row);
    layout.querySelector(region).append(control);
  }

  title.id ||= "vcx-topic-title";
  title.placeholder = "输入话题标题";
  if (title.tagName === "TEXTAREA") title.rows = 1;
  layout.querySelector("label").htmlFor = title.id;
  move(title, ".vcx-topic-title");
  move(editor.element, ".vcx-topic-body");
  for (const action of [syntax, preview, publish]) move(action, ".vcx-topic-actions");
  publish?.classList.add("vcx-topic-publish");
  for (const notice of main.querySelectorAll(".problem, #error_message")) move(notice, ".vcx-topic-feedback");

  const busy = bindTopicFiles(layout.querySelector(".vcx-topic-files"), editor, {
    demo, status,
    isMarkdown: () => /^(1|markdown)$/i.test(syntaxValue(host) ?? (/^\/write\/?$/.test(page.url.pathname) ? "markdown" : "0")),
  });
  if (node && !node.disabled) {
    // Keep the rendered Select2 control beside its native select, when present.
    const widget = node.nextElementSibling?.matches(".select2-container") ? node.nextElementSibling : null;
    if (!node.hasAttribute("aria-label")) node.setAttribute("aria-label", "选择节点");
    move(node, ".vcx-topic-node");
    move(widget, ".vcx-topic-node");
  } else {
    const select = fixedNodeSelect(page, next => {
      if (busy()) { report("请等文件处理完成再切换节点"); return false; }
      const path = newTopicPath({ node: next });
      const titleText = title.value;
      const text = editor.value();
      writeSession("compose-transfer", titleText || text ? { path, title: titleText, text, syntax: syntaxValue(host) } : null);
      const saved = readSession("compose-transfer");
      if ((titleText || text) && (saved?.path !== path || saved.title !== titleText || saved.text !== text)) {
        report("草稿无法保存，请复制内容后再切换节点");
        return false;
      }
      location.assign(href(path));
      return true;
    }, report);
    layout.querySelector(".vcx-topic-node").append(select);
  }

  const guardPublish = event => {
    if (!busy()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    report("文件处理完成后即可发布");
  };
  form?.addEventListener("submit", guardPublish, true);
  publish?.addEventListener("click", guardPublish, true);

  for (const row of rows) if (!row.querySelector(activeControl)) row.hidden = true;
  const header = box?.querySelector(":scope > .header");
  if (header && !header.querySelector('button, input, a[href]:not([href="/"], [href^="/go/"])')) header.hidden = true;
  box?.classList.add("vcx-new-topic-box");
  main.classList.add("vcx-new-topic-page");
  host.prepend(layout);
  if (!demo) {
    const draft = restoreDraft(page, host, title, editor);
    if (draft) layout.querySelector(".vcx-topic-actions").prepend(draft);
  }
  if (editor.refresh) requestAnimationFrame(editor.refresh);
  followPreview(preview, main);
}
