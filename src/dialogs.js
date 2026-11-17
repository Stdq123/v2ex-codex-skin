import { dialogHeader } from "./shell.js";
import { escape, icon, link } from "./ui.js";
import { projects } from "./v2ex.js";

export function createDialogs(dialog, topics, href) {
  let opener;

  function close(restore = true) {
    if (!dialog.open) return;
    dialog.close();
    dialog.replaceChildren();
    if (restore) opener?.focus({ preventScroll: true });
    opener = null;
  }

  function open(markup) {
    close();
    opener = document.activeElement;
    dialog.innerHTML = markup;
    dialog.showModal();
  }

  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) close();
  });

  function search() {
    open(`${dialogHeader("搜索")}
      <form class="vcx-search-form" role="search">
        <label class="vcx-search-field">${icon("search")}<input type="search" aria-label="搜索本页话题和分区" placeholder="搜索本页话题和分区" autofocus></label>
        <div class="vcx-search-results" aria-label="搜索结果"></div>
      </form>`);
    const field = dialog.querySelector("input");
    const results = dialog.querySelector(".vcx-search-results");

    function render() {
      const query = field.value.trim().toLowerCase();
      const matches = topics.filter(topic => [topic.title, topic.node, topic.author]
        .some(text => text.toLowerCase().includes(query))).slice(0, 12);
      const sections = projects.filter(project => [project.name, project.file]
        .some(text => text.toLowerCase().includes(query)));
      results.innerHTML = `${matches.length ? `<div class="vcx-search-label">本页话题</div>${matches.map(topic =>
        link(href(`/t/${topic.id}`), topic.title, "layers", `data-topic="${topic.id}" title="${escape(topic.title)}"`),
      ).join("")}` : ""}${sections.length ? `<div class="vcx-search-label">项目</div>${sections.map(project =>
        link(href(project.path), `${project.name} · ${project.file}`, "folder"),
      ).join("")}` : ""}${matches.length || sections.length ? "" : '<p class="vcx-empty">当前页面未找到匹配项。</p>'}`;
    }

    field.addEventListener("input", render);
    field.addEventListener("keydown", event => {
      if (event.key === "ArrowDown" && results.firstElementChild) {
        event.preventDefault();
        results.querySelector("a")?.focus();
      }
    });
    dialog.querySelector("form").addEventListener("submit", event => {
      event.preventDefault();
      results.querySelector("a")?.click();
    });
    render();
    field.focus();
  }

  return { open, close, search };
}
