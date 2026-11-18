const textFiles = ".txt,.md,.markdown,text/plain,text/markdown";
const imageFiles = "image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp";

function fileAction(menu, label, types, select) {
  const field = document.createElement("input");
  field.type = "file";
  field.accept = types;
  field.hidden = true;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", () => {
    menu.open = false;
    menu.querySelector("summary").focus({ preventScroll: true });
    field.click();
  });
  field.addEventListener("change", () => {
    const file = field.files[0];
    field.value = "";
    if (file) select(file);
  });
  menu.querySelector(".vcx-topic-file-menu").append(button, field);
  return button;
}

export function bindTopicFiles(menu, editor, { demo, isMarkdown, status }) {
  let busy = false;
  const report = message => { status.textContent = message; };
  const summary = menu.querySelector("summary");
  menu.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !menu.open) return;
    event.preventDefault();
    menu.open = false;
    summary.focus({ preventScroll: true });
  });
  document.addEventListener("pointerdown", event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });

  const upload = window.initImageDragDropUpload;
  if (!demo && typeof upload === "function" && typeof DataTransfer === "function") {
    // V2EX uses its drop handler for validation, upload and existing images.
    const zone = document.createElement("div");
    const imageButton = fileAction(menu, "上传图片到 V2EX", imageFiles, file => {
      if (busy) { report("请等当前文件处理完成"); return; }
      try {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        zone.dispatchEvent(new DragEvent("drop", { cancelable: true, dataTransfer: transfer }));
      } catch {
        report("无法读取所选图片");
      }
    });
    function insertImage(result) {
      const source = result?.url_o;
      if (typeof source !== "string" || !/^(?:https?:)?\/\//i.test(source)) {
        report("图库未返回图片链接");
        return;
      }
      const url = source.startsWith("//") ? `https:${source}` : source;
      const escaped = url.replaceAll("(", "%28").replaceAll(")", "%29");
      editor.insert(isMarkdown() ? `\n![](${escaped})\n` : `\n${url}\n`);
      report("图片已插入正文");
    }
    upload({
      zone,
      onUploadStart: () => {
        busy = true;
        imageButton.disabled = true;
        report("正在上传图片…");
      },
      onUploadSuccess: insertImage,
      onDuplicate: insertImage,
      onUploadError: message => report(message || "图片上传失败"),
      onAllComplete: () => {
        busy = false;
        imageButton.disabled = false;
      },
    });
  }

  fileAction(menu, "导入文本或 Markdown", textFiles, async file => {
    if (busy) { report("请等当前文件处理完成"); return; }
    if (!/\.(?:txt|md|markdown)$/i.test(file.name) && !file.type.startsWith("text/")) {
      report("请选择文本或 Markdown 文件");
      return;
    }
    busy = true;
    try {
      const content = await file.text();
      if (!content) { report("所选文件没有文本"); return; }
      editor.insert(content);
      report("文本已插入正文");
    } catch {
      report("无法读取所选文本文件");
    } finally {
      busy = false;
    }
  });
  return () => busy;
}
