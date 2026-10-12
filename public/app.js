(() => {
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = u => /^https?:\/\//i.test(u || "") ? u : "#";
const paras = s => esc(s).split(/\n\s*\n/).filter(Boolean).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
const fmt = (d, o) => { const x = new Date(d + "T12:00:00"); return isNaN(x) ? null : x.toLocaleDateString("en-GB", o); };
const todayStr = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; };
const api = async (path, method = "GET", body) => {
  const r = await fetch("/api" + path, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined, credentials: "same-origin", cache: "no-cache" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
};
const P = {
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5 5"/>',
  gift: '<rect x="3" y="9" width="18" height="11" rx="1"/><path d="M12 9v11M3 13h18"/><path d="M12 9c-2-4-6-3-5 0 .5 1.5 3 1 5 0zm0 0c2-4 6-3 5 0-.5 1.5-3 1-5 0z"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;

let C = null, authed = false, adminLoaded = false, dirty = false, tab = "Verse of the Month", flash = "", flashErr = false;
const dir = () => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.address);
const apple = () => "https://maps.apple.com/?q=" + encodeURIComponent(C.address);
const city = () => (C.tagline || "").split("·")[0].trim();
const ext = 'target="_blank" rel="noopener"';

function player(u) {
  u = u || "";
  const m = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  if (m) return `<iframe loading="lazy" allowfullscreen title="Sermon video" src="https://www.youtube-nocookie.com/embed/${m[1]}"></iframe>`;
  if (/\.(mp3|m4a|wav|ogg)(\?|$)/i.test(u)) return `<audio controls preload="none" src="${esc(safeUrl(u))}"></audio>`;
  return u ? `<a class="btn blue sm" ${ext} href="${esc(safeUrl(u))}">${ic("play")} Watch / Listen</a>` : "";
}
const head = (eyebrow, title, sub) => `<div class="sh"><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ""}</div>`;
const pagehead = (eyebrow, title, sub) => `<div class="pagehead"><div class="wrap"><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ""}</div></div>`;

const timeCard = t => {
  const online = /online|remote|zoom|stream/i.test(t.note || "");
  return `<article class="tc"><div class="icobox ${online ? "g" : "r"}">${ic(online ? "play" : "clock")}</div><div><h3>${esc(t.label)}</h3><p class="when">${esc(t.when)}</p><div class="acts">${t.note ? `<span class="pill ${online ? "" : "r"}">${esc(t.note)}</span>` : ""}${t.link ? `<a class="more" ${ext} href="${esc(safeUrl(t.link))}">Join online →</a>` : ""}</div></div></article>`;
};
const locCard = () => `<article class="tc"><div class="icobox">${ic("pin")}</div><div><h3>Visit us</h3><p style="margin:.1rem 0 .6rem;font-weight:500">${esc(C.address)}</p><div class="acts"><a class="btn blue sm" ${ext} href="${esc(dir())}">Directions</a><a class="more" ${ext} href="${esc(apple())}">Apple Maps</a></div></div></article>`;
const verseBanner = () => C.verseText ? `<section class="verse"><div class="wrap"><div class="vcard"><span class="q" aria-hidden="true">“</span><span class="vlabel">${ic("book")} ${esc(C.verseMonth ? "Bible Verse for " + C.verseMonth : "Bible Verse of the Month")}</span><blockquote>“${esc(C.verseText)}”</blockquote><cite>${esc(C.verseRef)}</cite></div></div></section>` : "";
const upcoming = () => C.events.filter(e => !e.date || e.date >= todayStr()).sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));
const evCard = e => {
  const day = e.date && fmt(e.date, { day: "numeric" }), mon = e.date && fmt(e.date, { month: "short" });
  const full = e.date && fmt(e.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `<article class="card hover event">${day ? `<div class="dbadge"><span>${esc(mon)}</span><b>${esc(day)}</b></div>` : ""}<div><span class="pill r">${esc(e.tag || "Event")}</span><h3>${esc(e.title)}</h3>${full ? `<p class="meta">${esc(full)}</p>` : ""}<p>${esc(e.desc)}</p></div></article>`;
};
const liveBand = () => C.stream ? `<section class="tight"><div class="wrap"><div class="live"><div><h3 style="font-size:1.6rem">Can’t join us in person?</h3><p>Watch our services and teachings on YouTube, wherever you are.</p></div><a class="btn ghost" ${ext} href="${esc(safeUrl(C.stream))}">${ic("play")} Watch on YouTube</a></div></div></section>` : "";
const contactBits = () => {
  const s = C.social || {}, yt = s.youtube || C.stream;
  const social = [["facebook", s.facebook], ["youtube", yt], ["instagram", s.instagram]].filter(x => x[1]);
  return { social, reach: C.phone || C.email };
};
const contactCards = () => {
  const { social, reach } = contactBits();
  return `<div class="card top-b"><div class="icobox">${ic("pin")}</div><h3>Visit us</h3><p>${esc(C.address)}</p><div class="cta" style="margin:0"><a class="btn blue sm" ${ext} href="${esc(dir())}">Google Maps</a><a class="btn line sm" ${ext} href="${esc(apple())}">Apple Maps</a></div></div>
  <div class="card top-r"><div class="icobox r">${ic("clock")}</div><h3>Service times</h3>${C.times.map(t => `<p style="margin-bottom:.6rem"><b>${esc(t.label)}</b><br>${esc(t.when)}${t.note ? ` · <span class="mut">${esc(t.note)}</span>` : ""}${t.link ? `<br><a ${ext} href="${esc(safeUrl(t.link))}">Join link</a>` : ""}</p>`).join("")}</div>
  ${reach ? `<div class="card top-g"><div class="icobox g">${ic("phone")}</div><h3>Get in touch</h3>${C.phone ? `<p>${ic("phone")} <a href="tel:${esc(C.phone.replace(/[^+\d]/g, ""))}">${esc(C.phone)}</a></p>` : ""}${C.email ? `<p>${ic("mail")} <a href="mailto:${esc(C.email)}">${esc(C.email)}</a></p>` : ""}</div>` : ""}
  ${social.length ? `<div class="card top-b"><div class="icobox">${ic("link")}</div><h3>Follow &amp; watch</h3><p>${social.map(([k, u]) => `<a ${ext} href="${esc(safeUrl(u))}">${k[0].toUpperCase() + k.slice(1)}</a>`).join(" &nbsp;·&nbsp; ")}</p></div>` : ""}`;
};

const pages = {
  home: () => `<div class="hero"><div class="wrap"><span class="eyebrow">${esc(C.tagline)}</span><h1>${esc(C.name)}</h1><p class="lead">${esc(C.welcome)}</p><div class="cta"><a class="btn" href="#contact">Join Us This Sunday</a>${C.stream ? `<a class="btn ghost" ${ext} href="${esc(safeUrl(C.stream))}">${ic("play")} Watch Online</a>` : ""}</div></div></div>
<div class="strip"><div class="wrap"><div class="grid">${C.times.map(timeCard).join("")}${locCard()}</div></div></div>
${verseBanner()}
${upcoming().length ? `<section><div class="wrap">${head("What’s on", "Upcoming events")}<div class="grid two">${upcoming().slice(0, 3).map(evCard).join("")}</div><p style="margin-top:1.6rem"><a class="btn line" href="#media">All events &amp; media</a></p></div></section>` : ""}
${liveBand()}
<section class="alt"><div class="wrap">${head("Plan your visit", "Find us in " + (city().split(",")[0] || "town"), "You are welcome just as you are. Here is how to reach us.")}<div class="grid">${contactCards()}</div></div></section>`,

  about: () => `${pagehead("About us", "Who we are", "A branch of The Redeemed Christian Church of God in " + (city().split(",")[0] || "your city"))}
<section><div class="wrap" style="max-width:780px;font-size:1.1rem">${paras(C.about)}</div></section>
${C.leaders.length ? `<section class="alt"><div class="wrap">${head("Leadership", "Meet our shepherds", "The pastors and servants who care for our church family.")}<div class="grid">${C.leaders.map(l => `<div class="card hover"><div class="avatar">${esc((l.name || "?").trim()[0] || "?")}</div><h3>${esc(l.name)}</h3><span class="pill">${esc(l.title)}</span><p style="margin-top:.8rem">${esc(l.bio)}</p></div>`).join("")}</div></div></section>` : ""}`,

  ministries: () => `${pagehead("Community & ministries", "Grow. Serve. Belong.", "There is a place for you to learn, grow and serve.")}
<section><div class="wrap"><div class="grid">${C.ministries.map((m, i) => `<div class="card hover ${["top-b", "top-r", "top-g"][i % 3]}"><div class="icobox ${["", "r", "g"][i % 3]}">${ic(["book", "heart", "users"][i % 3])}</div><h3>${esc(m.t)}</h3><p>${esc(m.d)}</p></div>`).join("")}</div></div></section>
<section class="tight alt"><div class="wrap"><div class="live"><div><h3 style="font-size:1.6rem">Want to get involved?</h3><p>We would love to meet you. Join us at a service and speak to any of our team.</p></div><a class="btn ghost" href="#contact">Visit us</a></div></div></section>`,

  media: () => `${pagehead("Media & events", "Gather with us", "Upcoming events, sermons and live streams.")}
<section><div class="wrap">${head("Calendar", "Upcoming events")}${upcoming().length ? `<div class="grid two">${upcoming().map(evCard).join("")}</div>` : `<div class="empty">No upcoming events right now. Please check back soon.</div>`}</div></section>
<section class="alt"><div class="wrap">${head("Watch & listen", "Sermons & media")}${C.sermons.length ? `<div class="grid">${C.sermons.map(s => `<div class="card media"><h3>${esc(s.title)}</h3><p class="mut" style="font-size:.92rem">${esc(s.speaker)}${s.date && fmt(s.date, {}) ? " · " + fmt(s.date, { day: "numeric", month: "long", year: "numeric" }) : ""}</p>${player(s.url)}</div>`).join("")}</div>` : `<div class="empty">Sermons will appear here soon.${C.stream ? ` In the meantime, visit our <a ${ext} href="${esc(safeUrl(C.stream))}">YouTube channel</a>.` : ""}</div>`}</div></section>
${liveBand()}`,

  give: () => `${pagehead("Give", "Give with a cheerful heart", "Every gift helps us serve God and our community.")}
<section><div class="wrap"><div style="max-width:760px;font-size:1.08rem;margin-bottom:2.2rem">${paras(C.give)}</div><div class="grid two">
<div class="card top-r"><div class="icobox r">${ic("gift")}</div><h3>Offering</h3><div class="pre">${paras(C.giveOffering)}</div></div>
<div class="card top-b"><div class="icobox">${ic("heart")}</div><h3>${esc(C.giveProjectTitle || "Church Project")}</h3><div class="pre">${paras(C.giveProject)}</div></div>
<div class="card blik" style="grid-column:1/-1"><div class="icobox r">${ic("phone")}</div><h3>Give by BLIK</h3><span class="mut">BLIK phone number</span>${C.blikNumber ? `<div class="num"><b id="blik">${esc(C.blikNumber)}</b><button class="btn line sm" data-copy="${esc(C.blikNumber)}">${ic("copy")} Copy number</button></div>` : `<p class="mut" style="margin:.4rem 0 1rem"><i>The BLIK number will be added here soon.</i></p>`}${C.blikNote ? `<p class="mut" style="margin:0">${esc(C.blikNote)}</p>` : ""}</div>
${C.giveBank ? `<div class="card top-g"><div class="icobox g">${ic("card")}</div><h3>Bank transfer</h3><p class="pre">${esc(C.giveBank)}</p></div>` : ""}
${C.giveLink ? `<div class="card top-g"><div class="icobox g">${ic("link")}</div><h3>Give online</h3><p>Use our secure online giving page.</p><a class="btn" ${ext} href="${esc(safeUrl(C.giveLink))}">Give securely</a></div>` : ""}
</div></div></section>`,

  contact: () => `${pagehead("Contact", "We’d love to see you", "Come and worship with us in " + (city().split(",")[0] || "town") + ".")}
<section><div class="wrap"><div class="grid">${contactCards()}</div></div></section>${liveBand()}`
};
const routes = { home: "Home", about: "About & Leadership", ministries: "Ministries", media: "Media & Events", contact: "Contact", give: "Give" };

/* ---------- admin ---------- */
const tabs = ["Verse of the Month", "Services & Contact", "Text", "Giving", "Events", "Sermons", "Team & Ministries", "Security"];
const get = p => p.split(".").reduce((o, k) => o?.[k], C);
const set = (p, v) => { const ks = p.split("."), l = ks.pop(); ks.reduce((o, k) => o[k], C)[l] = v; };
const f = (l, p, o = {}) => `<div class="${o.full ? "full" : ""}"><label for="f-${p}">${l}</label>${o.ta ? `<textarea id="f-${p}" data-p="${p}" rows="${o.rows || 4}">${esc(get(p))}</textarea>` : `<input id="f-${p}" data-p="${p}" value="${esc(get(p))}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ""}>`}${o.hint ? `<small class="mut">${o.hint}</small>` : ""}</div>`;
const list = (arr, fields, noun) => (C[arr].length ? "" : `<p class="mut">Nothing here yet.</p>`) + C[arr].map((x, i) => `<div class="item"><div class="ih"><b>${noun} ${i + 1}</b><div class="acts"><button class="btn line sm" data-move="${arr}:${i}:-1" aria-label="Move up">↑</button><button class="btn line sm" data-move="${arr}:${i}:1" aria-label="Move down">↓</button><button class="btn danger sm" data-del="${arr}:${i}">Remove</button></div></div><div class="fgrid">${fields.map(([k, l, o]) => f(l, arr + "." + i + "." + k, o)).join("")}</div></div>`).join("") + `<button class="btn blue sm" data-add="${arr}">+ Add ${noun.toLowerCase()}</button>`;
const blanks = { times: { label: "", when: "", note: "", link: "" }, events: { title: "", date: "", tag: "Event", desc: "" }, sermons: { title: "", speaker: "", date: "", url: "" }, leaders: { name: "", title: "", bio: "" }, ministries: { t: "", d: "" } };
const panels = {
  "Verse of the Month": () => `<h3>Bible verse of the month</h3><p class="hint">Shown in a large banner on the home page and as a strip at the top of every other page.</p><div class="fgrid">${f("Month label", "verseMonth", { ph: "November 2026" })}${f("Reference", "verseRef", { ph: "Psalm 23:1 (KJV)" })}${f("Verse text", "verseText", { ta: 1, full: 1, rows: 4 })}</div>`,
  "Services & Contact": () => `<h3>Service times</h3><p class="hint">Add a join link for online services (shown as “Join online”).</p>${list("times", [["label", "Service name"], ["when", "Day &amp; time", { ph: "Sundays · 1:00 PM" }], ["note", "Label", { ph: "In person / Online" }], ["link", "Join link (optional)", { full: 1 }]], "Service")}<div class="sep"></div><h3>Address &amp; contact</h3><div class="fgrid">${f("Address", "address", { full: 1 })}${f("Phone (optional)", "phone")}${f("Email (optional)", "email")}${f("YouTube stream / channel", "stream", { full: 1 })}${f("YouTube link (footer &amp; contact)", "social.youtube")}${f("Facebook (optional)", "social.facebook")}${f("Instagram (optional)", "social.instagram")}</div>`,
  "Text": () => `<h3>Page text</h3><div class="fgrid">${f("Church name", "name")}${f("Tagline", "tagline")}${f("Welcome message (home page)", "welcome", { ta: 1, full: 1 })}${f("About us", "about", { ta: 1, full: 1, rows: 8, hint: "Leave a blank line between paragraphs." })}</div>`,
  "Giving": () => `<h3>Giving page</h3><p class="hint">Fields left empty are hidden, except Offering, Project and BLIK, which always show.</p><div class="fgrid">${f("Introduction", "give", { ta: 1, full: 1 })}${f("Offering details", "giveOffering", { ta: 1, full: 1 })}${f("Project name", "giveProjectTitle", { ph: "Church Project" })}<div></div>${f("Project details", "giveProject", { ta: 1, full: 1 })}${f("BLIK phone number", "blikNumber", { ph: "e.g. 600 000 000" })}<div></div>${f("BLIK instructions", "blikNote", { ta: 1, full: 1, rows: 3 })}${f("Bank transfer details (optional)", "giveBank", { ta: 1, full: 1, rows: 3 })}${f("Online giving link (optional)", "giveLink", { full: 1 })}</div>`,
  "Events": () => `<h3>Events</h3><p class="hint">Past events are hidden from the site automatically.</p>${list("events", [["title", "Title"], ["date", "Date (YYYY-MM-DD)", { ph: "2026-12-24" }], ["tag", "Tag", { ph: "Special Service" }], ["desc", "Description", { ta: 1, full: 1, rows: 3 }]], "Event")}`,
  "Sermons": () => `<h3>Sermons &amp; media</h3><p class="hint">Paste a YouTube link or a direct .mp3 link.</p>${list("sermons", [["title", "Title"], ["speaker", "Speaker"], ["date", "Date (YYYY-MM-DD)"], ["url", "Video / audio link", { full: 1 }]], "Sermon")}`,
  "Team & Ministries": () => `<h3>Leadership</h3><p class="hint">Pastors and key staff shown on the About page.</p>${list("leaders", [["name", "Name"], ["title", "Title"], ["bio", "Short bio", { ta: 1, full: 1, rows: 3 }]], "Leader")}<div class="sep"></div><h3>Ministries</h3>${list("ministries", [["t", "Ministry"], ["d", "Description", { ta: 1, full: 1, rows: 3 }]], "Ministry")}`,
  "Security": () => `<h3>Admin password</h3><p>The admin password is stored as a private setting on your Vercel project, not in the website.</p><p>To change it: open your project on vercel.com &rarr; <b>Settings &rarr; Environment Variables</b> &rarr; edit <code>ADMIN_PASSWORD</code> &rarr; then <b>redeploy</b>. Everyone, including you, will be signed out.</p><div class="sep"></div><h3>Reset content</h3><p>Replace everything on the site with the original starter content (RCCG Grace Parish details). This cannot be undone.</p><button class="btn danger sm" id="reset">Reset to starter content</button>`
};
const adminBody = () => `<div class="tabs" role="tablist">${tabs.map(t => `<button role="tab" aria-selected="${t === tab}" class="${t === tab ? "on" : ""}" data-tab="${t}">${t}</button>`).join("")}</div>${flash ? `<div class="msg ${flashErr ? "err" : ""}" role="status">${esc(flash)}</div>` : ""}<div class="panel">${panels[tab]()}</div><div class="savebar"><span class="st ${dirty ? "dirty" : ""}" id="st">${dirty ? "Unsaved changes" : "All changes saved"}</span><span style="display:flex;gap:.5rem"><button class="btn danger sm" id="out">Log out</button>${tab === "Security" ? "" : `<button class="btn" id="save">Save changes</button>`}</span></div>`;
const adminShell = inner => { $("#app").innerHTML = `<section class="tight"><div class="wrap"><div class="admin" id="ab">${inner}</div></div></section>`; return $("#ab"); };
const refreshAdmin = () => { const b = $("#ab"); if (b) { b.innerHTML = adminBody(); flash = ""; flashErr = false; } };
addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

async function adminView() {
  try { authed = (await api("/admin/session")).authed; } catch { authed = false; }
  if (!authed) {
    adminShell(`<div class="panel login"><div class="icobox" style="margin:0 auto 1rem">${ic("lock")}</div><h3>Admin login</h3><p class="hint">Sign in to edit the website.</p><form id="lf"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required><button class="btn" style="width:100%;margin-top:1.2rem" type="submit">Sign in</button><p id="le" class="msg err" role="alert" hidden style="margin:1rem 0 0"></p></form></div>`);
    $("#lf").onsubmit = async e => {
      e.preventDefault(); const le = $("#le"); le.hidden = true;
      try { await api("/admin/login", "POST", { password: $("#pw").value }); adminView(); }
      catch (x) { le.textContent = x.message; le.hidden = false; }
    };
    return;
  }
  if (!adminLoaded) { try { C = await api("/admin/content"); adminLoaded = true; } catch (x) { flash = x.message; flashErr = true; } }
  const b = adminShell(adminBody()); flash = ""; flashErr = false;
  b.oninput = e => { const p = e.target.dataset?.p; if (p) { set(p, e.target.value); dirty = true; const st = $("#st"); st.textContent = "Unsaved changes"; st.className = "st dirty"; } };
  b.onclick = async e => {
    const el = e.target.closest("button"); if (!el) return;
    const t = el.dataset, id = el.id;
    try {
      if (t.tab) { tab = t.tab; refreshAdmin(); }
      else if (t.add) { C[t.add].push({ ...blanks[t.add] }); dirty = true; refreshAdmin(); }
      else if (t.del) { const [k, i] = t.del.split(":"); if (confirm("Remove this item?")) { C[k].splice(+i, 1); dirty = true; refreshAdmin(); } }
      else if (t.move) { const [k, i, d] = t.move.split(":"); const a = C[k], i1 = +i, i2 = i1 + +d; if (i2 >= 0 && i2 < a.length) { [a[i1], a[i2]] = [a[i2], a[i1]]; dirty = true; refreshAdmin(); } }
      else if (id === "out") { if (dirty && !confirm("You have unsaved changes. Log out anyway?")) return; await api("/admin/logout", "POST"); dirty = false; adminLoaded = false; adminView(); }
      else if (id === "reset") { if (confirm("Replace ALL site content with the starter content? This cannot be undone.")) { C = await api("/admin/reset", "POST", {}); dirty = false; flash = "Site content was reset to the starter content."; refreshAdmin(); } }
      else if (id === "save") { el.disabled = true; el.textContent = "Saving…"; C = await api("/admin/content", "PUT", C); dirty = false; flash = "Saved. Your changes are now live."; refreshAdmin(); }
    } catch (x) { flash = x.message; flashErr = true; if (/Not signed in/.test(x.message)) { adminLoaded = false; adminView(); } else refreshAdmin(); }
  };
}

/* ---------- shell ---------- */
async function render() {
  const r = (location.hash || "#home").slice(1), route = routes[r] ? r : (r === "admin" ? "admin" : "home");
  if (route === "admin") { if (!C) { try { C = await api("/content"); } catch {} } }
  else { adminLoaded = false; try { C = await api("/content"); } catch { if (!C) { $("#app").innerHTML = `<section><div class="wrap"><p class="msg err">Could not load content. Please refresh.</p></div></section>`; return; } } }
  if (!C) { $("#app").innerHTML = `<section><div class="wrap"><p class="msg err">Could not load content. Please refresh.</p></div></section>`; return; }
  const place = city().split(",")[0];
  document.title = route === "home" || route === "admin" ? `${C.name}${place ? ", " + place : ""}` : `${routes[route]} | ${C.name}`;
  $("#bn").textContent = C.name; $("#bs").textContent = place;
  $("#nav").innerHTML = Object.entries(routes).filter(([k]) => k !== "give").map(([k, l]) => `<a href="#${k}" ${route === k ? 'aria-current="page"' : ""}>${l}</a>`).join("") + `<a class="give" href="#give" ${route === "give" ? 'aria-current="page"' : ""}>Give</a>`;
  $("#nav").classList.remove("open"); $("#menu").setAttribute("aria-expanded", "false");
  $("#top").innerHTML = `${C.times[0] ? `Next service: <b>${esc(C.times[0].when)}</b> · ` : ""}<a href="${esc(dir())}" ${ext}>Get directions →</a>`;
  const s = C.social || {}, yt = s.youtube || C.stream;
  $("#ft").innerHTML = `<div class="wrap"><div class="fg"><div><div class="fbrand">${esc(C.name)}</div><p>${esc(C.tagline)}</p><p>${esc(C.address)}</p></div><div><h4>Explore</h4><ul>${Object.entries(routes).map(([k, l]) => `<li><a href="#${k}">${l}</a></li>`).join("")}</ul></div><div><h4>Connect</h4><ul>${C.times.map(t => `<li>${esc(t.label)}: ${esc(t.when)}</li>`).join("")}${C.phone ? `<li><a href="tel:${esc(C.phone.replace(/[^+\d]/g, ""))}">${esc(C.phone)}</a></li>` : ""}${C.email ? `<li><a href="mailto:${esc(C.email)}">${esc(C.email)}</a></li>` : ""}${yt ? `<li><a ${ext} href="${esc(safeUrl(yt))}">YouTube</a></li>` : ""}${s.facebook ? `<li><a ${ext} href="${esc(safeUrl(s.facebook))}">Facebook</a></li>` : ""}${s.instagram ? `<li><a ${ext} href="${esc(safeUrl(s.instagram))}">Instagram</a></li>` : ""}</ul></div></div><div class="fb"><span>© ${new Date().getFullYear()} ${esc(C.name)}. A branch of The Redeemed Christian Church of God.</span><a href="#admin">Admin</a></div></div>`;
  if (route === "admin") { adminView(); return; }
  const strip = route !== "home" && C.verseText ? `<a class="vstrip" href="#home"><span class="wrap">${ic("book")}<span class="t"><b>${esc(C.verseMonth || "Verse of the Month")}:</b> “${esc(C.verseText)}” — ${esc(C.verseRef)}</span></span></a>` : "";
  $("#app").innerHTML = strip + pages[route]();
  scrollTo(0, 0);
}
$("#menu").onclick = () => { const o = $("#nav").classList.toggle("open"); $("#menu").setAttribute("aria-expanded", String(o)); };
$("#skip").onclick = e => { e.preventDefault(); $("#main").focus(); };
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-copy]"); if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.copy); const o = b.innerHTML; b.textContent = "Copied ✓"; setTimeout(() => (b.innerHTML = o), 1800); } catch {}
});
addEventListener("hashchange", render);
render();
})();
