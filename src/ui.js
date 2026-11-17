const glyphs = {
  sidebar: 0xf45f,
  panel: 0xf45e,
  search: 0xf52a,
  gear: 0xf3e5,
  folder: 0xf3d7,
  down: 0xf282,
  left: 0xf284,
  right: 0xf285,
  external: 0xf1c5,
  code: 0xf2c6,
  terminal: 0xf5c3,
  sun: 0xf5a2,
  moon: 0xf497,
  grid: 0xf3fc,
  layers: 0xf45b,
  clock: 0xf292,
  hot: 0xf7f6,
  new: 0xf4ca,
  plus: 0xf64d,
  list: 0xf479,
  copy: 0xf759,
  close: 0xf659,
  expand: 0xf14a,
  branch: 0xf69d,
  person: 0xf4d7,
  command: 0xf2cf,
  home: 0xf425,
  at: 0xf152,
  bell: 0xf18a,
  bookmark: 0xf1a2,
  inbox: 0xf42d,
  dots: 0xf5d4,
  more: 0xf5d3,
  filter: 0xf3e1,
  pin: 0xf4ed,
  send: 0xf148,
  pencil: 0xf4cb,
  bold: 0xf5f0,
  italic: 0xf5f4,
  strike: 0xf5f5,
  heading: 0xf5f2,
  link: 0xf470,
  quote: 0xf6b0,
  bullets: 0xf478,
  numbers: 0xf475,
  eye: 0xf341,
  plusCircle: 0xf4f9,
  chat: 0xf264,
  folderOpen: 0xf3d8,
  lock: 0xf47b,
};

export function icon(name) {
  return `<span class="vcx-icon" aria-hidden="true">&#${glyphs[name]};</span>`;
}

const escapes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => escapes[char]);
}

export function link(href, label, glyph = "", extra = "") {
  return `<a class="vcx-action" href="${escape(href)}" ${extra}>${glyph ? icon(glyph) : ""}<span>${escape(label)}</span></a>`;
}

export function iconButton(action, glyph, label, extra = "") {
  return `<button type="button" class="vcx-icon-button" data-action="${action}" title="${escape(label)}" aria-label="${escape(label)}" ${extra}>${icon(glyph)}</button>`;
}
