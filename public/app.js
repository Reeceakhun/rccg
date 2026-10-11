(() => {
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = u => /^https?:\/\//i.test(u || "") ? u : "#";
const fdate = d => { const x = new Date(d + "T12:00:00"); return isNaN(x) ? esc(d) : x.toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" }); };
const api = async (path, method = "GET", body) => {
  const r = await fetch("/api" + path, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined, credentials: "same-origin" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
};
let C = null, authed = false, adminLoaded = false, tab = "Verse of the Month", flash = "", flashErr = false;
const dir = () => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.address);
const apple = () => "https://maps.apple.com/?q=" + encodeURIComponent(C.address);

function player(u) {
  u = u || "";
  const m = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  if (m) return `<iframe loading="lazy" allowfullscreen title="Sermon video" src="https://www.youtube-nocookie.com/embed/${m[1]}"></iframe>`;
  if (/\.(mp3|m4a|wav|ogg)(\?|$)/i.test(u)) return `<audio controls preload="none" src="${esc(safeUrl(u))}"></audio>`;
  return u ? `<a class="btn alt sm" target="_blank" rel="noopener" href="${esc(safeUrl(u))}">Watch / Listen</a>` : "";
}
const head = (t, s) => `<div class="hd"><h2>${t}</h2>${s ? `<p class="mut">${s}</p>` : ""}</div>`;
function contactCards() {
  const s = C.social || {};
  return `<div class="card"><h3>Visit</h3><p>${esc(C.address)}</p><a class="btn sm" target="_blank" rel="noopener" href="${esc(dir())}">Google Maps</a> <a class="btn sm ghost" target="_blank" rel="noopener" href="${esc(apple())}">Apple Maps</a></div>
<div class="card r"><h3>Reach Us</h3><p>📞 <a href="tel:${esc((C.phone || "").replace(/[^+\d]/g, ""))}">${esc(C.phone)}</a><br>✉️ <a href="mailto:${esc(C.email)}">${esc(C.email)}</a></p></div>
<div class="card g"><h3>Follow</h3><p>${["facebook", "youtube", "instagram"].filter(k => s[k]).map(k => `<a target="_blank" rel="noopener" href="${esc(safeUrl(s[k]))}">${k[0].toUpperCase() + k.slice(1)}</a>`).join(" · ")}</p></div>`;
}
const verseText = () => C.verseText ? `<blockquote>“${esc(C.verseText)}”</blockquote><cite>— ${esc(C.verseRef)}</cite>` : "";
const verseBanner = () => C.verseText ? `<section class="verse"><div class="wrap"><div class="verse-card"><span class="label">📖 ${esc(C.verseMonth ? "Bible Verse for " + C.verseMonth : "Bible Verse of the Month")}</span>${verseText()}</div></div></section>` : "";
const pages = {
  home: () => `<div class="hero"><div class="wrap"><p style="letter-spacing:.15em;text-transform:uppercase;font-size:.85rem">${esc(C.tagline)}</p><h1>${esc(C.name)}</h1><p>${esc(C.welcome)}</p><a class="btn" href="#contact">Join Us This Sunday</a></div></div>
${verseBanner()}
<section class="alt"><div class="wrap">${head("Service Times", "Come as you are — there is a seat for you.")}<div class="grid">${C.times.map((t, i) => `<div class="card ${i % 2 ? "r" : ""}"><h3>${esc(t.label)}</h3><div class="big">${esc(t.when)}</div></div>`).join("")}<div class="card g"><h3>Online Stream</h3><p class="mut">Can't make it in person? Join us live.</p><a class="btn alt sm" target="_blank" rel="noopener" href="${esc(safeUrl(C.stream))}">Watch Online</a></div></div></div></section>
<section><div class="wrap">${head("Find Us")}<div class="grid">${contactCards()}</div></div></section>`,
  about: () => `<section><div class="wrap">${head("About Us")}<p style="max-width:720px;font-size:1.1rem;white-space:pre-line">${esc(C.about)}</p></div></section>
<section class="alt"><div class="wrap">${head("Our Leadership", "Meet the shepherds and servants of our house.")}<div class="grid">${C.leaders.map(l => `<div class="card"><div class="avatar">${esc((l.name || "?")[0])}</div><h3>${esc(l.name)}</h3><span class="tag">${esc(l.title)}</span><p>${esc(l.bio)}</p></div>`).join("")}</div></div></section>`,
  ministries: () => `<section><div class="wrap">${head("Community & Ministries", "There is a place for you to learn, grow and serve.")}<div class="grid">${C.ministries.map((m, i) => `<div class="card ${["", "r", "g"][i % 3]}"><h3>${esc(m.t)}</h3><p>${esc(m.d)}</p></div>`).join("")}</div></div></section>`,
  media: () => {
    const ev = [...C.events].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return `<section><div class="wrap">${head("Upcoming Events")}<div class="grid">${ev.map(e => `<div class="card r"><span class="tag">${esc(e.tag || "Event")}</span><h3 style="margin-top:.5rem">${esc(e.title)}</h3><div class="mut"><b>${e.date ? fdate(e.date) : ""}</b></div><p>${esc(e.desc)}</p></div>`).join("") || "<p class='mut'>No upcoming events yet.</p>"}</div></div></section>
<section class="alt"><div class="wrap">${head("Sermons & Media")}<p><a class="btn alt" target="_blank" rel="noopener" href="${esc(safeUrl(C.stream))}">Live Stream</a></p><div class="grid">${C.sermons.map(s => `<div class="card media"><h3>${esc(s.title)}</h3><p class="mut">${esc(s.speaker)}${s.date ? " · " + fdate(s.date) : ""}</p>${player(s.url)}</div>`).join("") || "<p class='mut'>Sermons will appear here soon.</p>"}</div></div></section>`;
  },
  give: () => `<section><div class="wrap">${head("Give", "God loves a cheerful giver.")}<div class="grid"><div class="card r"><h3>Online Giving</h3><p>${esc(C.give)}</p>${C.giveLink ? `<a class="btn" target="_blank" rel="noopener" href="${esc(safeUrl(C.giveLink))}">Give Securely</a>` : "<p class='mut'>Online portal link coming soon.</p>"}</div><div class="card g"><h3>Bank Transfer</h3><p style="white-space:pre-line">${esc(C.giveBank)}</p></div></div></div></section>`,
  contact: () => `<section><div class="wrap">${head("Contact & Location")}<div class="grid">${contactCards()}</div></div></section>`
};

/* ---------- admin ---------- */
const tabs = ["Verse of the Month", "Service & Contact", "Text", "Events", "Sermons", "Team & Ministries", "Security"];
const get = p => p.split(".").reduce((o, k) => o?.[k], C);
const set = (p, v) => { const ks = p.split("."), l = ks.pop(); ks.reduce((o, k) => o[k], C)[l] = v; };
const inp = (l, p, t) => `<label>${l}</label>${t ? `<textarea data-p="${p}">${esc(get(p))}</textarea>` : `<input data-p="${p}" value="${esc(get(p))}">`}`;
const list = (arr, fields, title) => `<h3>${title}</h3>${C[arr].map((x, i) => `<div class="item"><div class="row">${fields.map(([k, l, ta]) => `<div class="${ta ? "full" : ""}">${inp(l, arr + "." + i + "." + k, ta)}</div>`).join("")}</div><button class="btn ghost sm" style="margin-top:.7rem" data-del="${arr}:${i}">Remove</button></div>`).join("")}<button class="btn alt sm" data-add="${arr}">+ Add</button>`;
const blanks = { times: { label: "", when: "" }, events: { title: "", date: "", tag: "Event", desc: "" }, sermons: { title: "", speaker: "", date: "", url: "" }, leaders: { name: "", title: "", bio: "" }, ministries: { t: "", d: "" } };
const adminTabs = {
  "Verse of the Month": () => "<h3>Bible Verse of the Month</h3><p class='mut'>Shown prominently on the home page, and as a banner on every other page.</p>" + inp("Month label (e.g. November 2026)", "verseMonth") + inp("Verse text", "verseText", 1) + inp("Reference (e.g. Psalm 23:1, KJV)", "verseRef"),
  "Service & Contact": () => list("times", [["label", "Service name"], ["when", "Day & time"]], "Service Times") + "<h3 style='margin-top:2rem'>Contact & Address</h3>" + inp("Address", "address") + `<div class="row">${inp("Phone", "phone")}${inp("Email", "email")}</div>` + inp("Online stream URL", "stream") + `<div class="row">${inp("Facebook URL", "social.facebook")}${inp("YouTube URL", "social.youtube")}${inp("Instagram URL", "social.instagram")}</div>`,
  "Text": () => inp("Church name", "name") + inp("Tagline", "tagline") + inp("Welcome message (home hero)", "welcome", 1) + inp("About text", "about", 1) + inp("Giving message", "give", 1) + inp("Online giving portal link", "giveLink") + inp("Bank transfer details", "giveBank", 1),
  "Events": () => list("events", [["title", "Title"], ["date", "Date (YYYY-MM-DD)"], ["tag", "Tag"], ["desc", "Description", 1]], "Events"),
  "Sermons": () => "<p class='mut'>Paste a YouTube link or a direct .mp3 URL.</p>" + list("sermons", [["title", "Title"], ["speaker", "Speaker"], ["date", "Date (YYYY-MM-DD)"], ["url", "Video / audio URL"]], "Sermons"),
  "Team & Ministries": () => list("leaders", [["name", "Name"], ["title", "Title"], ["bio", "Bio", 1]], "Leadership") + "<div style='height:2rem'></div>" + list("ministries", [["t", "Ministry"], ["d", "Description", 1]], "Ministries"),
  "Security": () => `<h3>Admin password</h3><p>The admin password is stored as a private setting on your Vercel project, not in the website itself.</p><p>To change it: open your project on vercel.com &rarr; <b>Settings &rarr; Environment Variables</b> &rarr; edit <code>ADMIN_PASSWORD</code> &rarr; then <b>redeploy</b>. Everyone (including you) will be signed out and must log in with the new password.</p>`
};
function adminShell(inner) { $("#app").innerHTML = `<section><div class="wrap">${head("Admin Portal")}<div id="ab">${inner}</div></div></section>`; return $("#ab"); }

async function adminView() {
  try { authed = (await api("/admin/session")).authed; } catch { authed = false; }
  if (!authed) {
    const b = adminShell(`<form class="login card" id="lf"><h3>Admin Login</h3><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required><button class="btn" style="margin-top:1rem;width:100%" type="submit">Sign in</button><p id="le" class="mut" role="alert"></p></form>`);
    $("#lf").onsubmit = async e => {
      e.preventDefault();
      try { await api("/admin/login", "POST", { password: $("#pw").value }); adminView(); }
      catch (x) { $("#le").textContent = x.message; }
    };
    return;
  }
  if (!adminLoaded) { try { C = await api("/admin/content"); adminLoaded = true; } catch (x) { flash = x.message; flashErr = true; } }
  const b = adminShell(`<div class="tabs">${tabs.map(t => `<button class="${t === tab ? "on" : ""}" data-tab="${t}">${t}</button>`).join("")}<button style="margin-left:auto" id="out">Log out</button></div>${flash ? `<div class="msg ${flashErr ? "err" : ""}" role="status">${esc(flash)}</div>` : ""}<div>${adminTabs[tab]()}</div>${tab === "Security" ? "" : `<p style="margin-top:2rem"><button class="btn" id="save">Save changes</button></p>`}`);
  flash = ""; flashErr = false;
  b.oninput = e => { const p = e.target.dataset?.p; if (p) set(p, e.target.value); };
  b.onclick = async e => {
    const t = e.target.dataset, id = e.target.id;
    try {
      if (t.tab) { tab = t.tab; adminView(); }
      else if (t.add) { C[t.add].push({ ...blanks[t.add] }); renderAdminOnly(); }
      else if (t.del) { const [k, i] = t.del.split(":"); C[k].splice(+i, 1); renderAdminOnly(); }
      else if (id === "out") { await api("/admin/logout", "POST"); adminLoaded = false; adminView(); }
      else if (id === "save") { C = await api("/admin/content", "PUT", C); flash = "Saved — changes are live."; adminView(); }
    } catch (x) { flash = x.message; flashErr = true; if (/Not signed in/.test(x.message)) adminView(); else renderAdminOnly(); }
  };
}
// Re-render the admin panel using the in-memory draft (no refetch, keeps unsaved edits).
function renderAdminOnly() {
  const b = $("#ab"); if (!b) return;
  b.innerHTML = `<div class="tabs">${tabs.map(t => `<button class="${t === tab ? "on" : ""}" data-tab="${t}">${t}</button>`).join("")}<button style="margin-left:auto" id="out">Log out</button></div>${flash ? `<div class="msg ${flashErr ? "err" : ""}" role="status">${esc(flash)}</div>` : ""}<div>${adminTabs[tab]()}</div>${tab === "Security" ? "" : `<p style="margin-top:2rem"><button class="btn" id="save">Save changes</button></p>`}`;
  flash = ""; flashErr = false;
}

/* ---------- shell ---------- */
const links = [["home", "Home"], ["about", "About & Leadership"], ["ministries", "Ministries"], ["media", "Media & Events"], ["give", "Give"], ["contact", "Contact"]];
async function render() {
  const r = (location.hash || "#home").slice(1);
  if (!C || r !== "admin" || !authed) { try { C = await api("/content"); } catch { $("#app").innerHTML = `<section><div class="wrap"><p class="msg err">Could not load content. Please refresh.</p></div></section>`; return; } }
  document.title = C.name;
  $("#bn").textContent = C.name;
  $("#nav").innerHTML = links.map(([k, l]) => `<a href="#${k}" class="${r === k ? "on" : ""}">${l}</a>`).join("");
  $("#top").innerHTML = `Next service: <b>${esc(C.times[0]?.when || "")}</b> · <a href="${esc(dir())}" target="_blank" rel="noopener">Get directions →</a>`;
  $("#ft").innerHTML = `© ${new Date().getFullYear()} ${esc(C.name)} · ${esc(C.address)}`;
  if (r === "admin") { adminView(); return; }
  adminLoaded = false;
  const page = pages[r] ? r : "home";
  $("#app").innerHTML = (page !== "home" && C.verseText ? `<a class="vstrip" href="#home"><span class="wrap">📖 <b>${esc(C.verseMonth || "Verse of the Month")}:</b> “${esc(C.verseText)}” — ${esc(C.verseRef)}</span></a>` : "") + pages[page]();
  scrollTo(0, 0);
}
addEventListener("hashchange", render);
render();
})();
