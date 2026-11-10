const K = window.KIOSK;
const $ = (s) => document.querySelector(s);
const splash = $("#splash");
const idleWarning = $("#idle-warning");
const idleCountdown = $("#idle-countdown");
// Two kiosks: the 2nd-floor screen opens index.html?kiosk=2
const kioskParam = new URLSearchParams(location.search).get("kiosk");
if (kioskParam && K.config.kioskNodes[kioskParam]) K.config.kioskNodeId = K.config.kioskNodes[kioskParam];

const TABS = [
    { id: "map", label: "Map", icon: "🗺️", render: renderMap },
    { id: "directory", label: "Directory", icon: "👥", render: renderDirectory },
    { id: "schedule", label: "Classes", icon: "📅", render: renderSchedule },
    { id: "events", label: "Events", icon: "🎉", render: renderEvents },
    { id: "campus", label: "Campus", icon: "🌴", render: renderCampus },
];

// ---------- state ----------
const DAYS = ["Su", "M", "T", "W", "Th", "F", "Sa"];
const state = {
    tab: "map",
    floor: 1,
    selected: null,       // selected room id
    route: null,          // array of nodes
    day: DAYS[new Date().getDay()],
};
const tabHistory = [];
const IDLE_WARNING_MS = 15_000;
let idleTimer;
let idleWarningTimer;
let idleCountdownTimer;

// ---------- data helpers ----------
const roomById = (id) => K.rooms.find((r) => r.id === id);
const nodeById = Object.fromEntries(K.nodes.map((n) => [n.id, n]));
// make links two-way (and catch typos in data.js)
K.nodes.forEach((n) => n.links.forEach((l) => {
    if (!nodeById[l]) return console.error("Bad link:", n.id, "->", l);
    if (!nodeById[l].links.includes(n.id)) nodeById[l].links.push(n.id);
}));
K.rooms.forEach((r) => { if (!nodeById[r.node]) console.error("Room", r.id, "has bad node", r.node); });
const kioskFloor = () => nodeById[K.config.kioskNodeId].floor;
state.floor = kioskFloor();   // start on this kiosk's own floor

function findRoute(fromId, toId) {
    const dist = { [fromId]: 0 }, prev = {}, todo = new Set([fromId]);
    while (todo.size) {
        const u = [...todo].sort((a, b) => dist[a] - dist[b])[0];
        todo.delete(u);
        if (u === toId) break;
        for (const v of nodeById[u].links) {
            const a = nodeById[u], b = nodeById[v];
            const d = dist[u] + Math.hypot(a.x - b.x, a.y - b.y) + (a.floor !== b.floor ? 150 : 0);
            if (dist[v] === undefined || d < dist[v]) { dist[v] = d; prev[v] = u; todo.add(v); }
        }
    }
    if (dist[toId] === undefined) return null;
    const path = [];
    for (let n = toId; n; n = prev[n]) path.unshift(nodeById[n]);
    return path;
}

function showRoute(roomId) {
    const room = roomById(roomId);
    if (!room) return;
    state.selected = roomId;
    state.route = findRoute(K.config.kioskNodeId, room.node);
    state.floor = kioskFloor();
    go("map");
}

// ---------- shell ----------
function go(tab, addToHistory = true) {
    if (addToHistory && state.tab !== tab) tabHistory.push(state.tab);
    state.tab = tab;
    const t = TABS.find((x) => x.id === tab);
    t.render($("#view"));
    document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    makeQRs();
    $("#view").scrollTop = 0;
    resetIdle();
}

function buildTabs() {
    $("#tabs").innerHTML = `<button type="button" data-action="back" aria-label="Go back">
        <span class="ico">←</span>Back</button>` + TABS.map((t) =>
        `<button data-tab="${t.id}"><span class="ico">${t.icon}</span>${t.label}</button>`).join("");
    $("#tabs").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        if (b.dataset.action === "back") return goBack();
        if (b.dataset.tab === "map") { state.route = null; state.selected = null; }
        go(b.dataset.tab);
    });
}

function makeQRs() {
    document.querySelectorAll("[data-qr]").forEach((el) => {
        el.innerHTML = "";
        if (window.QRCode) new QRCode(el, { text: el.dataset.qr, width: 360, height: 360 });
        else el.textContent = "(QR unavailable offline)";
    });
}

let onlineClockOffsetMs = 0;
const hawaiiClockFormat = new Intl.DateTimeFormat("en-US", {
    weekday: "short", hour: "numeric", minute: "2-digit",
    timeZone: "Pacific/Honolulu", timeZoneName: "short",
});
const splashClockFormat = new Intl.DateTimeFormat("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "Pacific/Honolulu",
});

function tick() {
    const now = new Date(Date.now() + onlineClockOffsetMs);
    $("#clock").textContent = hawaiiClockFormat.format(now);
    $("#splash-clock").textContent = splashClockFormat.format(now);
}

async function syncOnlineClock() {
    const requestStartedAt = Date.now();
    const url = new URL(location.href);
    url.searchParams.set("_clock_sync", String(requestStartedAt));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(url, {
            method: "HEAD",
            cache: "no-store",
            signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Clock sync returned HTTP ${response.status}`);

        const serverTime = Date.parse(response.headers.get("Date") || "");
        if (!Number.isFinite(serverTime)) throw new Error("Clock sync response had no valid Date header");

        const receivedAt = Date.now();
        onlineClockOffsetMs = serverTime + (receivedAt - requestStartedAt) / 2 - receivedAt;
        tick();
    } catch (error) {
        console.warn("Online clock sync failed; continuing with the device clock.", error);
    } finally {
        clearTimeout(timeout);
    }
}

function hideIdleWarning() {
    idleWarning.hidden = true;
    idleWarning.setAttribute("aria-hidden", "true");
}

function clearIdleTimers() {
    clearTimeout(idleTimer);
    clearTimeout(idleWarningTimer);
    clearInterval(idleCountdownTimer);
}

function showIdleWarning() {
    if (!splash.hidden) return;
    idleWarning.hidden = false;
    idleWarning.setAttribute("aria-hidden", "false");
    idleCountdown.textContent = String(IDLE_WARNING_MS / 1000);
    idleWarning.querySelector("#idle-stay").focus({ preventScroll: true });

    const deadline = Date.now() + IDLE_WARNING_MS;
    idleCountdownTimer = setInterval(() => {
        idleCountdown.textContent = String(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 1000);
    idleTimer = setTimeout(showSplash, IDLE_WARNING_MS);
}

function resetIdle() {
    clearIdleTimers();
    hideIdleWarning();
    if (!splash.hidden) return;
    const duration = K.config.idleSeconds * (state.tab === "campus" ? 3 : 1) * 1000;
    idleWarningTimer = setTimeout(showIdleWarning, Math.max(0, duration - IDLE_WARNING_MS));
}

function showSplash() {
    clearIdleTimers();
    hideIdleWarning();
    document.body.classList.remove("kiosk-active");
    state.route = null;
    state.selected = null;
    state.floor = kioskFloor();
    state.day = DAYS[new Date().getDay()];
    tabHistory.length = 0;
    splash.hidden = false;
    splash.classList.remove("is-exiting");
    document.body.classList.add("splash-active");
    go("map", false);
    startSplashRotation();
}

function goBack() {
    if (state.tab === "map") {
        showSplash();
        return;
    }
    go(tabHistory.pop() || "map", false);
}

// ---------- views ----------
const fmtTime = (t) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };

function renderMap(el) {
    const f = K.floors[state.floor];
    const rooms = K.rooms.filter((r) => r.floor === state.floor);
    const kiosk = nodeById[K.config.kioskNodeId];
    const sel = state.selected && roomById(state.selected);

    // route points on this floor (+ the room center at the end if the room is on this floor)
    const pts = state.route ? state.route.filter((n) => n.floor === state.floor).map((n) => [n.x, n.y]) : [];
    if (state.route && sel && sel.floor === state.floor) pts.push([sel.x + sel.w / 2, sel.y + sel.h / 2]);

    let stepsText;
    if (state.route && sel) {
        const crosses = sel.floor !== kioskFloor();
        stepsText = `Route to <b>${sel.id}</b>` +
            (crosses ? ` — take the stairs to floor ${sel.floor}, then follow the orange path.` : ` — follow the orange path.`);
    } else if (sel) {
        stepsText = "";
    } else {
        stepsText = "Tap a room to see details and directions.";
    }

    const people = sel ? K.directory.filter((p) => p.room === sel.id) : [];
    const detail = sel ? `<div class="detail"><b>Room ${sel.id}</b> · ${sel.name}
      ${people.map((p) => `<div class="sub">${p.name}${p.phone ? " · " + p.phone : ""}${p.email ? " · " + p.email : ""}</div>`).join("")}
    </div>` : "";

    el.innerHTML = `
    <h2>Building Map</h2>
    <div class="row">
      <button class="btn ${state.floor === 1 ? "on" : "alt"}" data-floor="1">1st Floor</button>
      <button class="btn ${state.floor === 2 ? "on" : "alt"}" data-floor="2">2nd Floor</button>
    </div>
    <div class="mapwrap">
      <svg class="map" viewBox="0 0 ${f.w} ${f.h}">
        <image href="${f.img}" x="0" y="0" width="${f.w}" height="${f.h}"/>
        ${rooms.map((r) => {
        const fs = Math.max(9, Math.min(15, r.w * 0.3, r.h * 0.45));
        return `<g data-room="${r.id}">
            <rect class="room ${r.id === state.selected ? "sel" : ""}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="3"/>
            <text class="rlabel" font-size="${fs}" x="${r.x + r.w / 2}" y="${r.y + r.h / 2}">${r.label || r.id}</text>
          </g>`;
    }).join("")}
        ${pts.length > 1 ? `<polyline class="path" points="${pts.map((p) => p.join(",")).join(" ")}"/>` : ""}
        ${kiosk.floor === state.floor ? `<circle class="you" cx="${kiosk.x}" cy="${kiosk.y}" r="11"/>
          <text class="youlabel" x="${kiosk.x}" y="${kiosk.y + 32}">YOU ARE HERE</text>` : ""}
      </svg>
    </div>
    ${detail}
    <div class="steps">${stepsText}</div>
    ${sel ? `<button class="btn" data-route="${sel.id}">How do I get here?</button>` : ""}`;

    el.onclick = (e) => {
        const fl = e.target.closest("[data-floor]");
        if (fl) { state.floor = +fl.dataset.floor; return renderMap(el); }
        const r = e.target.closest("[data-room]");
        if (r) { state.selected = r.dataset.room; state.route = null; state.floor = roomById(state.selected).floor; return renderMap(el); }
        const g = e.target.closest("[data-route]");
        if (g) showRoute(g.dataset.route);
    };
}

function renderDirectory(el) {
    el.innerHTML = `<h2>Directory</h2>
    <input type="search" id="q" placeholder="Search name, title, or room…">
    <div id="list"></div>`;
    const formatPhone = (phone) => {
        let digits = phone.replace(/\D/g, "");
        if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
        if (digits.length === 7) digits = `808${digits}`;
        if (digits.length !== 10) return phone;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    };
    const draw = (q = "") => {
        q = q.toLowerCase();
        $("#list").innerHTML = K.directory
            .filter((p) => `${p.name} ${p.title} ${p.room}`.toLowerCase().includes(q))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => `<div class="card directory-card">
          <div class="directory-info"><div class="main">${p.name}</div>
          <div class="directory-meta"><span class="sub">${p.title}</span><span class="directory-room">Room ${p.room}</span></div>
          ${p.phone || p.email ? `<div class="sub directory-contact">${[p.phone && formatPhone(p.phone), p.email].filter(Boolean).join(" · ")}</div>` : ""}</div>
          <button class="btn" data-route="${p.room}">Show me</button></div>`).join("")
            || `<div class="sub">No matches.</div>`;
    };
    draw();
    $("#q").addEventListener("input", (e) => draw(e.target.value));
    el.onclick = (e) => { const g = e.target.closest("[data-route]"); if (g) showRoute(g.dataset.route); };
}

function renderSchedule(el) {
    const items = K.schedule.filter((c) => c.days.includes(state.day)).sort((a, b) => a.start.localeCompare(b.start));
    el.innerHTML = `<h2>Class Schedule</h2>
    <div class="row">${["M", "T", "W", "Th", "F"].map((d) =>
        `<button class="btn ${state.day === d ? "on" : "alt"}" data-day="${d}">${d}</button>`).join("")}</div>
    ${items.map((c) => `<div class="card">
        <div><div class="main">${c.course}${c.instructor ? " — " + c.instructor : ""}</div>
        <div class="sub">${fmtTime(c.start)} – ${fmtTime(c.end)} · Room ${c.room}</div></div>
        <button class="btn" data-route="${c.room}">Show me</button></div>`).join("")
        || `<div class="sub">No classes in this building on that day.</div>`}`;
    el.onclick = (e) => {
        const d = e.target.closest("[data-day]");
        if (d) { state.day = d.dataset.day; return renderSchedule(el); }
        const g = e.target.closest("[data-route]");
        if (g) showRoute(g.dataset.route);
    };
}

function qrBlock(label, url, caption) {
    return `<div class="qrbox"><h2>${label}</h2><div class="qr" data-qr="${url.replace(/&/g, "&amp;")}"></div><div class="url">${caption || url}</div></div>`;
}

// ----- Cafeteria: mock menu on top, QR to the full menu below -----
let menuDay = null;
function renderCafeteria(el) {
    const days = Object.keys(K.menu.days);
    const d = menuDay || (days.includes(state.day) ? state.day : days[0]);
    const names = { M: "Mon", T: "Tue", W: "Wed", Th: "Thu" };
    el.innerHTML = `<h2>Cafeteria Menu</h2>
      <div class="row">${days.map((x) =>
        `<button class="btn ${x === d ? "on" : "alt"}" data-menuday="${x}">${names[x] || x}</button>`).join("")}</div>
      ${K.menu.days[d].map((s) => `<div class="card"><div>
          <div class="main">${s.station}</div><div class="sub">${s.items.join(" · ")}</div></div></div>`).join("")}
      <div class="sub" style="font-size:26px">${K.menu.hours} · ${K.menu.note}</div>` +
        qrBlock("Full weekly menu", K.config.cafeteriaUrl);
    el.onclick = (e) => {
        const b = e.target.closest("[data-menuday]");
        if (b) { menuDay = b.dataset.menuday; renderCafeteria(el); makeQRs(); }
    };
}

function renderEvents(el) {
    el.innerHTML = `<h2>Events</h2><div class="sub" style="font-size:30px">Scan to see current and upcoming events.</div>` +
        qrBlock("Events & Internet Commons", K.config.eventsUrl);
    el.onclick = null;
}

// ----- Campus: pick a building, scan the QR, get walking directions on your phone -----
let campusDest = null;
function mapsUrl(b) {
    // No origin is given on purpose: the phone fills in "your location".
    const dest = (b.lat != null && b.lng != null)
        ? `${b.lat},${b.lng}`
        : encodeURIComponent(`${b.search || b.name}, ${K.config.campusAddress}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
}

function renderCampus(el) {
    const sel = K.campusBuildings.find((b) => b.id === campusDest);
    const map = K.config.campusMapEmbedUrl
        ? `<iframe class="gmap" src="${K.config.campusMapEmbedUrl}" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer-when-downgrade" loading="lazy"></iframe>`
        : "";
    el.innerHTML = `<h2>Campus Map</h2>${map}
      <div class="sub" style="font-size:30px;margin-bottom:20px">Where do you want to go? Pick a building, then scan the code with your phone to get walking directions.</div>
      <div class="row">${K.campusBuildings.map((b) =>
        `<button class="btn ${b.id === campusDest ? "on" : "alt"}" data-dest="${b.id}">${b.name}</button>`).join("")}</div>
      ${sel ? qrBlock(`Directions to ${sel.name}`, mapsUrl(sel), "Scan with your phone camera. Walking directions open from wherever you are.") : ""}
      ${qrBlock("Full campus map", K.config.campusMapUrl)}`;
    el.onclick = (e) => {
        const b = e.target.closest("[data-dest]");
        if (b) { campusDest = b.dataset.dest; renderCampus(el); makeQRs(); }
    };
  }

// ---------- boot ----------
$("#building-name").textContent = `${K.config.buildingName} Building`;
buildTabs();
tick();
setInterval(tick, 30000);
syncOnlineClock();
setInterval(syncOnlineClock, 15 * 60 * 1000);
resetIdle();
go("map");

const splashSlides = [...splash.querySelectorAll(".splash-slide")];
let activeSplashSlide = 0;
let splashRotationTimer;

function enterKiosk() {
    if (splash.hidden || splash.classList.contains("is-exiting")) return;
    clearInterval(splashRotationTimer);
    splash.classList.add("is-exiting");
    setTimeout(() => {
        splash.hidden = true;
        document.body.classList.remove("splash-active");
        document.body.classList.add("kiosk-active");
        resetIdle();
    }, 850);
}

$("#splash-enter").addEventListener("click", enterKiosk);

function startSplashRotation() {
    clearInterval(splashRotationTimer);
    splashRotationTimer = setInterval(() => {
        if (splash.hidden || splash.classList.contains("is-exiting")) return;
        splashSlides[activeSplashSlide].classList.remove("is-active");
        activeSplashSlide = (activeSplashSlide + 1) % splashSlides.length;
        splashSlides[activeSplashSlide].classList.add("is-active");
    }, 4000);
}

startSplashRotation();
idleWarning.querySelector("#idle-stay").addEventListener("click", resetIdle);
["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
        if (event.target instanceof Element && event.target.closest("#idle-warning")) return;
        resetIdle();
    }, { passive: true });
});