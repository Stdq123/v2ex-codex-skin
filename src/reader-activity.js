import { escape } from "./ui.js";

// 阅读区图标与模拟活动素材沿用 source/linuxdo-codex.user.js。
export const readerIcons = {
  search: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
  branch: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="8" r="2.4"/><path d="M6 8.4v7.2"/><path d="M18 10.4c0 4-4 3.6-7 4.6"/></svg>`,
  clock: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>`,
  folder: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>`,
  bookmark: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  check: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  quote: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 20l1.2-5.3A8.5 8.5 0 1 1 21 11.5z"/></svg>`,
  copy: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`,
  reply: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`,
  like: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>`,
  link: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>`,
  terminal: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><polyline points="7 9 10 12 7 15"/><path d="M12.5 15H17"/></svg>`,
  file: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v5h5"/><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/></svg>`,
  globe: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.7 2.6 4 5.7 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.7-4-9s1.3-6.4 4-9Z"/></svg>`,
  noentry: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/></svg>`,
  chevronRightSm: `<svg aria-hidden="true" class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>`,
};

const FLOOR_ICONS = ["check", "branch", "terminal", "file", "globe", "clock"];
const RUN_LINES = [
  ["terminal", "Running command", true],
  ["file", "Reading file", false],
  ["search", "Searching codebase", false],
  ["folder", "Listing directory", false],
  ["check", "Applied changes", false],
  ["globe", "Fetched page", false],
  ["branch", "Pushed commits", false],
  [null, "Reconnecting", false]
];
const RUN_CMDS = [
  "cargo build --release", "npm run build", "pytest -q tests/cache",
  "go test ./...", "git diff --stat", "ls src/", "make lint",
  "npm test -- --filter=auth", "cargo test --release", "go vet ./...",
  "docker compose up -d", "kubectl get pods -n prod", "curl -sI https://linux.do"
];

/* 英文思考语料（参考 cli 皮肤 decorationForPost 的素材池） */
const THINK_OPENERS = [
  "Okay, let me think through this properly.",
  "Alright, reading the post again — the claim hinges on one assumption.",
  "So the question is essentially about trade-offs, not correctness.",
  "Hmm, this is more subtle than it first looks.",
  "The framing is plausible but incomplete — let me reason about why.",
  "Let me unpack what's actually being claimed here before reacting.",
  "Interesting — the symptom and the cause are probably two different things.",
  "Before agreeing, I want to check the failure mode this implies.",
  "First instinct: this is a config issue masquerading as a bug.",
  "Let me separate the diagnosis from the proposed fix.",
  "There's a decent argument on both sides here, which is worth admitting up front.",
  "The subject line promises one thing; the body asks another.",
  "I've seen this pattern before — it usually ends up being permissions.",
  "Reproducing it locally would settle half of this thread instantly.",
  "I'm going to hold off on an opinion until the key numbers are clear."
];
const THINK_MIDS = [
  "The most likely explanation is resource contention, not the code path itself.",
  "If the numbers hold under a controlled benchmark, the conclusion is solid; if not, it's measurement noise.",
  "There are two ways to verify this: profile it under load, or bisect the change.",
  "I should distinguish between what the author measured and what they inferred.",
  "The failure mode only shows up under load, which is exactly why it's easy to miss.",
  "Correlation is doing a lot of work in that argument — worth pointing out gently.",
  "The simple approach probably wins here; the clever one just moves the complexity.",
  "Backwards compatibility matters more than elegance in this specific case.",
  "Queueing delay would explain the tail latency better than throughput.",
  "The connection pooling detail probably matters more than the language choice.",
  "Caching is the obvious lever, but it only helps if the read path is actually hot.",
  "The version pin matters here — half of these reports turn out to be a dependency bump.",
  "This smells like an ordering problem: the cleanup runs before the flush.",
  "In practice the config default wins; nobody reads the docs that deeply.",
  "A single metric won't settle this — I'd want p50 and p99 side by side.",
  "The author's fix works, but it trades one race condition for a subtler one.",
  "If this were reproducible in CI, it would already be closed. That absence is itself a signal.",
  "The right comparison isn't between these two tools, but with the baseline you already trust.",
  "There's a naming collision lurking in there — prod and dev are using different feature flags.",
  "Retry logic usually hides the real fault; the first failure is the honest one.",
  "The throughput story looks good, but the memory graph tells a different one.",
  "I'd rather recommend the boring solution that survives a teammate leaving.",
  "Cache invalidation is the unstated dependency in this whole argument.",
  "The diff is small, but the semantics around the null case changed.",
  "Reaching for an abstraction here just relocates the special cases.",
  "Log noise is suspicious: healthy systems fail quietly, not chatty.",
  "The author is right about the symptom, wrong about the mechanism.",
  "That timing is too uniform to be network jitter — looks scheduled.",
  "Concurrent writers would explain both errors, and a transaction would fix both.",
  "The benchmark lacks a warm-up phase, so the interpreter jit is skewing the first numbers.",
  "Idempotency handles the retry storm better than a tighter timeout ever will.",
  "This passes in tests because tests never exercise the actual cross-origin path.",
  "The dependency was pinned a year ago; the latest release fixed exactly this.",
  "Two callers assume the same global — that's the actual coupling, not the shared file.",
  "I can't confirm the root cause without the request headers.",
  "Better to narrow the scope than to guess at infrastructure.",
  "The proposal optimizes clean-up but leaves the cold-start path untouched.",
  "Feature flags are the part that usually ages the worst in these codebases."
];
const THINK_CLOSERS = [
  "Let me structure the reply around the one number that matters.",
  "I'll keep it short and ask the question that actually needs answering.",
  "I should avoid sounding dismissive — the work is genuinely good.",
  "Okay, writing it out step by step is the right move here.",
  "One concrete suggestion beats three abstract ones. Going with that.",
  "I'll agree with the direction, then flag the one thing that could bite later.",
  "Better to leave a question than a lecture — keeping the reply to two points.",
  "Let me lead with the concrete number, then the caveat.",
  "I'll ask for the reproduction steps before committing to a diagnosis.",
  "Wrapping up with the fix I'd actually ship, not the one that sounds smart.",
  "I'll point at the trade-off and let them decide — it's their system.",
  "Closing with a single question keeps the thread productive.",
  "I'll keep the tone neutral; the claim is fine, the evidence is thin.",
  "That's enough analysis — the practical next step is obvious."
];

function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildThinking(random) {
  const seconds = 2 + Math.floor(random() * 46);
  const pick = pool => pool[Math.floor(random() * pool.length)];
  const sentences = [pick(THINK_OPENERS)];
  if (random() < 0.65) sentences.push(pick(THINK_MIDS));
  if (random() < 0.6) sentences.push(pick(THINK_CLOSERS));

  const details = document.createElement("details");
  details.className = "vcx-think";
  details.lang = "en";
  details.open = true;
  details.innerHTML = `<summary class="vcx-think-head" title="模拟思考"><span class="vcx-think-star" aria-hidden="true">✻</span><span>Worked for ${seconds}s</span><span class="vcx-think-chev" aria-hidden="true"></span></summary>
    <div class="vcx-think-body">${escape(sentences.join("\n\n"))}</div>`;
  return details;
}

export function replyActivity(topicId, replyId) {
  const floorRandom = mulberry32(Math.imul(replyId, 2246822519) ^ Number(topicId));
  const floorIcon = readerIcons[FLOOR_ICONS[Math.floor(floorRandom() * FLOOR_ICONS.length)]];
  const random = mulberry32(Math.imul(replyId + 1, 2654435761) ^ Number(topicId));
  const thinking = buildThinking(random);
  const lines = [];

  const count = random() < 0.22 ? 2 : 1;
  const used = new Set();
  for (let index = 0; index < count; index++) {
    let choice = Math.floor(random() * RUN_LINES.length);
    if (used.has(choice)) choice = (choice + 1) % RUN_LINES.length;
    used.add(choice);
    const [glyph, label, withCommand] = RUN_LINES[choice];
    const text = glyph ? label : `${label} ${1 + Math.floor(random() * 4)}/${2 + Math.floor(random() * 4)}`;
    const command = withCommand ? RUN_CMDS[Math.floor(random() * RUN_CMDS.length)] : "";
    const line = document.createElement("div");
    line.className = "vcx-runline";
    line.lang = "en";
    line.title = "模拟活动";
    line.innerHTML = `${readerIcons[glyph] || ""}<span>${text}</span>${command ? `<code>${escape(command)}</code>` : ""}`;
    lines.push(line);
  }
  return { floorIcon, thinking, lines };
}

