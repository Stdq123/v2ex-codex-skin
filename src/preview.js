import { mount } from "./app.js";
import { escape } from "./ui.js";
import { defaultProject, describePage, routeFor, withDefaultTab } from "./v2ex.js";

const site = "https://www.v2ex.com";
const demoUrl = new URL(location.href);
const path = demoUrl.searchParams.get("page") || "/";
const requested = withDefaultTab(new URL(/^\/(?![/\\])/.test(path) ? path : "/", site));
const url = routeFor(requested) ? requested : new URL(defaultProject.path, site);
const route = routeFor(url);

const topics = [
  ["programmer", "程序员", "把周报工具迁到 Rust 后，有几处取舍想聊聊", "northloop", 23],
  ["python", "Python", "一个只有标准库的日志检索工具", "suzume", 15],
  ["create", "分享创造", "做了个能离线用的读书标注器", "songbook", 31],
  ["openai", "OpenAI", "整理了几条让 Codex 少走弯路的项目约定", "branchkit", 46],
  ["claude", "Claude", "在长任务里怎么安排 Claude Code 的上下文？", "codefield", 18],
  ["apple", "Apple", "旧款 Mac mini 还有哪些值得尝试的用途？", "carbon", 34],
  ["qna", "问与答", "你们会怎么归档几年没动过的项目？", "bytegarden", 28],
  ["cloud", "云计算", "两台小主机的备份方案，跑了三个月后的记录", "evening", 12],
  ["opensource", "开源软件", "一个可直接读 SQLite 文件的桌面工具", "sqlnotes", 9],
  ["linux", "Linux", "在家给旧笔记本换了个轻量的桌面环境", "logbook", 17],
  ["games", "游戏", "周末做了个三分钟就能通关的小游戏", "driftwood", 11],
  ["macos", "macOS", "分享一下我用了一年的窗口管理配置", "papertrail", 8],
  ["jobs", "酷工作", "想找个同伴一起维护一个小型开源项目", "wavelet", 5],
  ["deals", "交易", "想找一块二手的低功耗迷你主机", "steady", 4],
  ["city", "城市", "周末有哪些适合写代码的地方？", "folding", 14],
  ["r2", "R2", "试着给几年的日志做分层存储", "reservoir", 3],
].map(([node, name, title, author, replies], index) => ({ id: 90000001 + index, node, name, title, author, replies }));

const sections = {
  creative: ["create", "opensource"], play: ["games"], apple: ["apple", "macos"], jobs: ["jobs"],
  deals: ["deals"], city: ["city"], qna: ["qna"], r2: ["r2"],
};

function mappedHref(path) {
  const target = new URL(path, url);
  if (target.origin !== site || !routeFor(target)) return target.href;
  const link = new URL(demoUrl);
  link.searchParams.set("page", target.pathname + target.search + target.hash);
  return link.href;
}

function row(topic, index) {
  const path = `/t/${topic.id}`;
  return `<div class="cell item"><table><tbody><tr>
    <td></td><td></td>
    <td><span class="item_title"><a href="${path}">${escape(topic.title)}</a></span><div class="sep5"></div>
      <span class="topic_info"><a class="node" href="/go/${topic.node}">${topic.name}</a> · <strong><a href="/member/${topic.author}">${topic.author}</a></strong> · <time>${index * 5 + 3} 分钟前</time></span></td>
    <td><a class="count_livid" href="${path}#reply${topic.replies}" aria-label="${topic.replies} 条回复">${topic.replies}</a></td>
  </tr></tbody></table></div>`;
}

function list() {
  const filtered = route.node ? topics.filter(topic => topic.node === route.node)
    : sections[route.tab] ? topics.filter(topic => sections[route.tab].includes(topic.node))
    : route.tab === "hot" ? [...topics].sort((a, b) => b.replies - a.replies) : topics;
  const nodeName = filtered[0]?.name || route.node;
  const nodeHeader = `<div class="box node-header"><div class="cell page-content-header"><h1>${escape(nodeName)}</h1></div></div>`;
  const tabs = topics.slice(0, 7).map(topic => `<a href="/go/${topic.node}">${topic.name}</a>`).join("");
  return `${route.node ? nodeHeader : ""}<div class="box">${route.tab ? `<div id="Tabs"></div><nav id="SecondaryTabs" aria-label="分区节点">${tabs}</nav>` : ""}${filtered.map(row).join("") || '<p>这个节点暂时没有示例帖子。</p>'}</div>`;
}

const comments = [
  [34, "tabstop", "<p>我会把读取时的错误也打进日志，哪一行有问题比较容易回找。</p>"],
  [41, "redbranch", "<blockquote><p>用相同的日志比了下前后两版，想听听有没有我漏掉的边界情况。</p></blockquote><p>大文件上差别应该很明显，有对照跑过同一份输入吗？</p>"],
  [60, "northloop", "<p>跑了几次。我用 <code>BufReader</code> 逐行读取，接下来会固定输入文件和运行参数。</p><pre><code class='lang-rust'>let reader = BufReader::new(input);\nfor line in reader.lines() {\n    process(line?)?;\n}</code></pre>"],
  [70, "library", "<p>不妨把解析和输出拆开，之后可以复用同一套读取逻辑。</p>"],
  [75, "sunrise", "<p>这个写法也适合在旧机器上处理本地日志。</p>"],
  [80, "frame", "<p>要是打包发布的话，记得带个可运行的最小例子。</p>"],
];

function thread() {
  const topic = topics.find(item => String(item.id) === route.id) || topics[0];
  return `<article class="box">
    <div class="header"><div class="flex-one-row"><a href="/go/${topic.node}">${topic.name}</a></div><h1>${escape(topic.title)}</h1><small class="gray"><a href="/member/${topic.author}">${topic.author}</a> · 12 分钟前 · 173 次阅读</small></div>
    <div class="cell"><div class="topic_content"><p>这次先把读取和处理拆开了。<br>用相同的日志比了下前后两版，想听听有没有我漏掉的边界情况。</p></div></div>
  </article>
  <div class="sep20"></div>
  <section id="topic-replies" aria-label="回复"><div class="box reply-threads reply-threads-off">
    <div class="cell"><div class="fr"><a class="tag" href="/tag/Rust">Rust</a><a class="tag" href="/tag/日志处理">日志处理</a></div><span class="gray">${comments.length} 条回复</span></div>
    ${comments.map(([id, author, body], index) => `<div class="cell" id="r_${id}">
      <div class="flex-one-row"><div class="flex-one-row"><strong><a href="/member/${author}">${author}</a></strong><time>${11 - index} 分钟前</time></div><div class="flex-one-row"><span class="no">${index + 1}</span></div></div>
      <div class="sep5"></div><div class="reply_content">${body}</div>
    </div>`).join("")}
  </div></section>`;
}

function directory() {
  return `<div class="box"><div class="header"><h1>节点目录</h1></div>${topics.map(topic => `<div class="cell"><a href="/go/${topic.node}">${topic.name}</a></div>`).join("")}</div>`;
}

function newTopic() {
  const nodes = topics.map(({ node, name }) => `<option value="${node}" ${route.node === node ? "selected" : ""}>${escape(name)}</option>`).join("");
  return `<div class="box">
    <div class="header"><h1>新话题</h1></div>
    <form>
      <div class="cell"><label for="topic_title">标题</label><input id="topic_title" name="title" type="text"></div>
      <div class="cell"><label for="topic_content">正文</label><textarea id="topic_content" name="content"></textarea></div>
      <div class="cell"><label for="nodes">节点</label> <select id="nodes" name="node"><option value="">选择节点</option>${nodes}</select></div>
      <div class="inner"><button type="submit" disabled>发布话题</button> <small>离线预览</small></div>
    </form>
  </div>`;
}

function accountSettings() {
  const url = new URL(route.setting.path, site);
  const online = `<a class="vcx-button vcx-account-open" href="${escape(url.href)}" target="_blank" rel="noopener">打开账户设置</a>`;
  if (route.setting.id !== "profile") {
    return `<div class="box"><div class="cell">登录后可查看此分类的账户设置。</div><div class="inner">${online}</div></div>`;
  }
  return `<div class="box">
    <form class="inner"><table><tbody>
      <tr><td>用户名</td><td>示例账号</td></tr>
      <tr><td><label for="demo-language">站点语言</label></td><td><select id="demo-language"><option>简体中文</option><option>English</option></select></td></tr>
      <tr><td><label for="demo-appearance">夜间模式</label></td><td><select id="demo-appearance"><option>跟随系统</option><option>深色</option><option>浅色</option></select></td></tr>
      <tr><td><label for="demo-notifications">站内通知</label></td><td><input id="demo-notifications" type="checkbox" checked></td></tr>
    </tbody></table></form>
    <div class="cell_ops">${online}</div>
  </div>`;
}

const renderPage = { list, directory, topic: thread, new: newTopic, settings: accountSettings };
document.body.innerHTML = `<div id="Top"></div><div id="Wrapper"><div class="content"><main id="Main">${renderPage[route.kind]()}</main></div></div>`;
const main = document.getElementById("Main");
main.querySelector("form")?.addEventListener("submit", event => event.preventDefault());
main.addEventListener("click", event => {
  const anchor = event.target.closest("a[href^='/']");
  if (anchor) anchor.href = mappedHref(anchor.getAttribute("href"));
});
mount(describePage(main, route, url), { href: mappedHref, original: site, demo: true });
