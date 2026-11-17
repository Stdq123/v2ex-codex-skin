import { escape, icon, iconButton } from "./ui.js";

export const example = `// 给话题索引加一层带过期时间的本地缓存
// 只在读取时淘汰过期记录，刷新由调用方控制

use std::collections::HashMap;
use std::hash::Hash;
use std::time::{Duration, Instant};

struct Entry<V> {
    value: V,
    expires_at: Instant,
}

pub struct Cache<K, V> {
    entries: HashMap<K, Entry<V>>,
    ttl: Duration,
}

impl<K: Eq + Hash, V> Cache<K, V> {
    pub fn new(ttl: Duration) -> Self {
        Self {
            entries: HashMap::new(),
            ttl,
        }
    }

    pub fn insert(&mut self, key: K, value: V) {
        let expires_at = Instant::now() + self.ttl;
        self.entries
            .insert(key, Entry { value, expires_at });
    }

    pub fn get(&self, key: &K) -> Option<&V> {
        let entry = self.entries.get(key)?;
        let is_fresh = entry.expires_at > Instant::now();
        is_fresh.then_some(&entry.value)
    }

    pub fn prune(&mut self) -> usize {
        let now = Instant::now();
        let before = self.entries.len();
        self.entries
            .retain(|_, entry| entry.expires_at > now);
        before - self.entries.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn retrieves_cached_value() {
        let mut cache = Cache::new(Duration::from_secs(30));
        cache.insert("workspace", 42);
        assert_eq!(cache.get(&"workspace"), Some(&42));
    }
}`;

function syntax(line) {
  if (line.trimStart().startsWith("//")) return `<span class="vcx-syntax-comment">${escape(line)}</span>`;
  const tokens = /"[^"\n]*"|\b(?:use|struct|pub|impl|fn|let|mut|self|mod|super)\b|\b(?:Duration|Instant|Entry|Cache|HashMap|Hash|Self|Eq|Option|Some|usize|K|V)\b|\b\d+\b/g;
  let html = "";
  let end = 0;
  for (const token of line.matchAll(tokens)) {
    const value = token[0];
    const kind = value.startsWith('"') ? "string" : /^(?:[A-Z]|usize|\d)/.test(value) ? "type" : "keyword";
    html += `${escape(line.slice(end, token.index))}<span class="vcx-syntax-${kind}">${escape(value)}</span>`;
    end = token.index + value.length;
  }
  return html + escape(line.slice(end));
}

const lines = example.split("\n");
const listing = lines.map((line, index) => `<span class="vcx-line"><span class="vcx-line-number" aria-hidden="true">${index + 1}</span>${syntax(line)}</span>`).join("\n");
const change = lines.findIndex(line => line.includes("let is_fresh"));
const diff = [
  ["hunk", `@@ -${change - 1},6 +${change - 1},7 @@ impl<K: Eq + Hash, V> Cache<K, V> {`],
  ["context", ` ${lines[change - 2]}`],
  ["context", ` ${lines[change - 1]}`],
  ["removed", "-        Some(&entry.value)"],
  ["added", `+${lines[change]}`],
  ["added", `+${lines[change + 1]}`],
  ...lines.slice(change + 2, change + 5).map(line => ["context", ` ${line}`]),
].map(([kind, line]) => `<span class="vcx-diff-${kind}">${escape(line)}</span>`).join("\n");

export function codePanel(context) {
  return `<aside class="vcx-code" id="vcx-code" aria-label="代码面板" hidden>
    <div class="vcx-editor-tabs">
      <div class="vcx-editor-tab"><span class="vcx-rust-icon" aria-hidden="true">RS</span><span>lib.rs</span>${iconButton("panel", "close", "关闭代码面板", 'data-normal')}</div>
      ${iconButton("boss", "plus", "打开代码工作区（B）", 'data-normal')}
      <div class="vcx-editor-buttons">
        ${iconButton("boss", "expand", "最大化代码工作区（B）", 'data-normal')}
        ${iconButton("copy-code", "copy", "复制代码")}
        ${iconButton("panel", "sidebar", "收起代码面板", 'data-normal')}
        ${iconButton("boss", "left", "返回 V2EX 阅读区", 'data-work-only aria-keyshortcuts="B"')}
      </div>
    </div>
    <div class="vcx-editor-path">
      <div class="vcx-editor-breadcrumbs" data-normal><span>v2ex</span><span aria-hidden="true">›</span><span>${escape(context)}</span><span aria-hidden="true">›</span><span>engine</span><span aria-hidden="true">›</span><strong>lib.rs</strong></div>
      <span data-work-only>workspace › src › lib.rs</span>
      <div class="vcx-editor-switch" role="group" aria-label="代码面板显示方式" data-normal>
        <button type="button" data-action="editor-view" data-view="code" aria-pressed="true">代码</button>
        <button type="button" data-action="editor-view" data-view="diff" aria-pressed="false">diff</button>
      </div>
      <span class="vcx-editor-language">Rust</span>
    </div>
    <pre tabindex="0" data-editor-view="code" aria-label="lib.rs"><code>${listing}</code></pre>
    <pre tabindex="0" data-editor-view="diff" aria-label="lib.rs 的 diff" hidden><code>${diff}</code></pre>
  </aside>`;
}
