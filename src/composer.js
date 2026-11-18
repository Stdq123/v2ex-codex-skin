import { readSession, writeSession } from "./settings.js";
import { escape, icon } from "./ui.js";
import { newTopicPath } from "./v2ex.js";

export const composerPlaceholder = "和 Codex 一起工作";

const formats = {
  bold: ["加粗", "**", "**", "粗体"],
  italic: ["斜体", "*", "*", "斜体"],
  heading: ["标题", "\n## ", "\n", "标题"],
  strike: ["删除线", "~~", "~~", "文本"],
  link: ["插入链接", "[", "](https://)", "链接文字"],
  quote: ["引用", "\n> ", "\n", "引用"],
  code: ["代码块", "\n```\n", "\n```\n", "代码"],
  bullets: ["无序列表", "\n- ", "", "列表项"],
  numbers: ["有序列表", "\n1. ", "", "列表项"],
};
const plainFormats = {
  at: ["提及用户", "@", " ", "用户名"],
  link: ["插入网址", "", " ", "https://"],
  quote: ["引用文本", "\n> ", "\n", "引用"],
};

function formatMenu(commands) {
  return Object.entries(commands)
    .filter(([name]) => name !== "at")
    .map(([name, [label]]) => `<button type="button" data-compose-format="${name}">${icon(name)}${label}</button>`)
    .join("");
}

function bindFormatting(container, field, commands) {
  container.addEventListener("click", event => {
    const button = event.target.closest("[data-compose-format]");
    const command = commands[button?.dataset.composeFormat];
    if (!command) return;
    const [, before, after, sample] = command;
    const { selectionStart: start, selectionEnd: end, value } = field;
    const inserted = value.slice(start, end) || sample;
    field.setRangeText(before + inserted + after, start, end, "end");
    field.focus({ preventScroll: true });
    if (start === end) field.setSelectionRange(start + before.length, start + before.length + inserted.length);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function mountReplyForm(wrap, card, field) {
  const form = field?.form;
  if (!form) return null;
  const box = field.closest("#reply-box") || form;
  const outer = form.contains(box) ? form : box;
  const inner = outer === form ? box : form;
  if (!outer.contains(inner)) return null;

  const submit = [...form.elements].find(control => control.type === "submit" || control.type === "image");
  const target = outer.querySelector("#reply-parent");
  const problem = outer.querySelector(".problem");
  const spacer = outer.previousElementSibling;
  if (outer.parentElement?.id === "Main" && spacer?.matches(".sep20")) spacer.hidden = true;
  outer.classList.add("vcx-reply-shell");
  inner.classList.add("vcx-reply-shell");
  if (outer !== inner) outer.append(inner);
  for (const property of ["height", "min-height", "max-height"]) field.style.removeProperty(property);
  card.querySelector("textarea").replaceWith(field);
  if (target) card.prepend(target);
  if (problem) card.prepend(problem);
  inner.append(card);
  wrap.append(outer);
  return { form, submit };
}

export function mountComposer(page, { href, account, demo, copy }) {
  if (page.kind !== "list" && page.kind !== "topic") return null;
  const { main, url, path, id } = page;
  const reply = page.kind === "topic";
  const key = reply ? `draft:${id}` : "draft:new";
  const commands = reply ? plainFormats : formats;
  const newTopic = reply ? null : newTopicPath(page);
  const toolLabel = reply ? "回复工具" : "发帖工具";
  const wrap = document.createElement("div");
  wrap.className = "vcx-composer-wrap";
  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-label", reply ? "回复编辑器" : "新话题编辑器");
  document.getElementById("Wrapper").append(wrap);

  const card = document.createElement("div");
  card.className = "vcx-reply-card";
  card.innerHTML = `<textarea></textarea>
    ${reply ? "" : '<pre class="vcx-compose-preview" aria-label="草稿预览" tabindex="0" hidden></pre>'}
    <div class="vcx-reply-bar">
      <details class="vcx-reply-tools">
        <summary class="vcx-reply-icon" aria-label="${toolLabel}" title="${toolLabel}">${icon("plus")}</summary>
        <div class="vcx-reply-menu" role="group" aria-label="${toolLabel}">
          ${formatMenu(commands)}
          ${reply ? "" : `<button type="button" data-compose-preview aria-pressed="false">${icon("eye")}预览草稿</button>`}
        </div>
      </details>
      ${reply
        ? `<button class="vcx-reply-mention" type="button" data-compose-format="at" aria-label="提及用户" title="提及用户">${icon("at")}<span>提及</span></button>`
        : `<a class="vcx-reply-icon" href="${escape(href(newTopic))}" title="新话题" aria-label="新话题">${icon("pencil")}</a>`}
      <span class="vcx-flex"></span>
      <a class="vcx-reply-signin" aria-label="登录后回复" title="登录后回复" hidden>${icon("lock")}<span>登录后回复</span></a>
      <span class="vcx-reply-model" title="GPT-6.1 Sol Max">
        <span class="vcx-reply-model-name">GPT-6.1 Sol <span class="vcx-reply-model-effort">Max</span></span>${icon("down")}
      </span>
      <button class="vcx-reply-icon" type="button" data-reply-copy aria-label="复制草稿" title="复制草稿">${icon("copy")}</button>
      <button class="vcx-reply-send" type="button" data-reply-send>${icon("send")}</button>
    </div>`;

  const original = reply ? main.querySelector("textarea#reply_content") : null;
  const native = mountReplyForm(wrap, card, original);
  if (!native) {
    if (original) (original.closest("#reply-box") || original).hidden = true;
    wrap.append(card);
  }
  const field = card.querySelector("textarea");
  field.classList.add("vcx-reply-input");
  field.rows = 1;
  field.placeholder = composerPlaceholder;
  field.setAttribute("aria-label", reply ? "回复内容" : "新话题草稿");

  const tools = card.querySelector(".vcx-reply-tools");
  const send = card.querySelector("[data-reply-send]");
  const copyDraft = card.querySelector("[data-reply-copy]");
  const signIn = card.querySelector(".vcx-reply-signin");
  const preview = card.querySelector(".vcx-compose-preview");
  const previewButton = card.querySelector("[data-compose-preview]");
  const needsSignIn = reply && !native && !demo && !account.signedIn;
  if (needsSignIn) {
    const destination = new URL("/signin", url);
    destination.searchParams.set("next", path);
    signIn.href = destination.href;
    signIn.hidden = false;
  }
  const label = native ? "发送回复" : needsSignIn ? "登录后回复" : newTopic && !demo ? "前往原站发布" : "复制草稿";
  send.setAttribute("aria-label", label);
  send.title = `${label}（Ctrl / ⌘ + Enter）`;
  copyDraft.hidden = reply && !native && !needsSignIn;

  function sync() {
    const empty = !field.value.trim();
    field.toggleAttribute("data-vcx-empty", empty);
    copyDraft.disabled = empty;
    send.disabled = empty || field.matches(":disabled") || Boolean(native?.submit?.matches(":disabled"));
    if (previewButton) previewButton.disabled = empty && preview.hidden;
  }
  bindFormatting(card, field, commands);
  field.addEventListener("input", () => {
    if (!native) writeSession(key, field.value || null);
    if (preview && !preview.hidden) preview.textContent = field.value;
    sync();
  });
  field.addEventListener("focus", () => queueMicrotask(sync));
  if (native) {
    main.addEventListener("click", event => {
      if (event.target.closest('[onclick*="replyOne("]')) requestAnimationFrame(sync);
    }, { capture: true });
    if (native.submit) new MutationObserver(sync).observe(native.submit, { attributeFilter: ["disabled"] });
  }
  const saved = readSession(key);
  if (field.value && !field.value.trim()) field.value = "";
  if (!field.value && typeof saved === "string" && saved.trim()) {
    field.value = saved;
    if (native) {
      field.dispatchEvent(new Event("input", { bubbles: true }));
      writeSession(key, null);
    }
  }

  document.addEventListener("pointerdown", event => {
    if (tools.open && !tools.contains(event.target)) tools.open = false;
  });
  tools.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !tools.open) return;
    tools.open = false;
    tools.querySelector("summary").focus();
  });
  tools.addEventListener("click", event => {
    if (event.target.closest("[data-compose-format]")) tools.open = false;
  });
  previewButton?.addEventListener("click", () => {
    preview.textContent = field.value;
    preview.hidden = !preview.hidden;
    field.hidden = !preview.hidden;
    previewButton.setAttribute("aria-pressed", String(!preview.hidden));
    tools.open = false;
    (preview.hidden ? field : preview).focus({ preventScroll: true });
    sync();
  });
  copyDraft.addEventListener("click", () => copy(field.value, "草稿已复制"));
  send.addEventListener("click", () => {
    if (native?.submit) native.submit.click();
    else if (native) native.form.requestSubmit();
    else if (needsSignIn) location.assign(signIn.href);
    else if (newTopic && !demo) {
      writeSession("compose-transfer", { path: newTopic, text: field.value });
      location.assign(href(newTopic));
    } else copy(field.value, "草稿已复制");
  });
  field.addEventListener("keydown", event => {
    if (event.key !== "Enter" || event.isComposing || event.repeat || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    sync();
    send.click();
  });
  sync();
  return wrap;
}

