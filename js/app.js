const K = window.KIOSK;
const $ = (s) => document.querySelector(s);
const splash = $("#splash");
const idleWarning = $("#idle-warning");
const idleCountdown = $("#idle-countdown");
// Two kiosks: the 2nd-floor screen opens index.html?kiosk=2
const kioskParam = new URLSearchParams(location.search).get("kiosk");
if (kioskParam && K.config.kioskNodes[kioskParam]) K.config.kioskNodeId = K.config.kioskNodes[kioskParam];

const TABS = [
    { id: "map", label: "Find a Room", description: "Explore the building map and get step-by-step directions.", icon: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m4.5 8 7-3 9 3 7-3v19l-7 3-9-3-7 3z"/><path d="M11.5 5v19m9-16v19"/><path d="M16 10.5a3.3 3.3 0 0 1 3.3 3.3c0 2.3-3.3 5.3-3.3 5.3s-3.3-3-3.3-5.3a3.3 3.3 0 0 1 3.3-3.3z"/><circle cx="16" cy="13.8" r=".8"/></svg>`, render: renderMap },
    { id: "directory", label: "People & Offices", description: "Look up business faculty, staff, and office locations.", icon: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="11" r="4"/><path d="M4.5 25v-2a7.5 7.5 0 0 1 15 0v2z"/><path d="M21 7.5a4 4 0 0 1 0 7.5m2 3a6 6 0 0 1 4.5 5.8V25h-5"/></svg>`, render: renderDirectory },
    { id: "schedule", label: "Class Schedule", description: "See what classes are meeting in Ka Lama today.", icon: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="7.5" width="22" height="20" rx="4"/><path d="M10 4.5v6m12-6v6M5 13h22"/><path d="m11 20 3 3 7-7"/></svg>`, render: renderSchedule },
    { id: "events", label: "Events & News", description: "Find campus announcements, activities, and updates.", icon: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 13h4l10-6v18l-10-6H7a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"/><path d="M11 19 13 27h5l-2-5m9-10a7 7 0 0 1 0 10"/></svg>`, render: renderEvents },
    { id: "campus", label: "Campus Guide", description: "Explore campus buildings and get walking directions.", icon: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m4 12 12-7 12 7v2H4zM6.5 14v12m19-12v12M4 27h24"/><path d="M11 17h3v3h-3zm7 0h3v3h-3zm-7 6h3v3h-3zm7 0h3v3h-3z"/></svg>`, render: renderCampus },
];

// ---------- state ----------
const DAYS = ["Su", "M", "T", "W", "Th", "F", "Sa"];
const state = {
    tab: "home",
    floor: 1,
    selected: null,       // selected room id
    route: null,          // array of nodes
    day: DAYS[new Date().getDay()],
};
const tabHistory = [];
let menuTransitioning = false;
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
    const view = $("#view");
    if (tab === "home") {
        delete view.dataset.section;
        renderHome(view);
    } else {
        view.dataset.section = tab;
        renderSection(tab, view);
    }
    makeQRs();
    view.scrollTop = 0;
    resetIdle();
}

function renderSection(tab, el) {
    const section = TABS.find((item) => item.id === tab);
    section.render(el);
    el.insertAdjacentHTML("afterbegin", `<div class="page-toolbar">
        <button type="button" class="home-button" data-action="home">
            <span class="home-button-icon" aria-hidden="true">⌂</span>
            <span>Main menu</span>
        </button>
        <span class="page-breadcrumb">
            <span class="section-mark" aria-hidden="true">${section.icon}</span>
            <span>UHMC</span><span aria-hidden="true">/</span>${section.label}
        </span>
    </div>`);
}

async function transitionTo(tab) {
    if (menuTransitioning) return;
    const view = $("#view");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        go(tab);
        return;
    }

    menuTransitioning = true;
    const fadeOut = view.animate([
        { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0)" },
        { opacity: 0, transform: "translateY(-8px) scale(.99)", filter: "blur(2px)" },
    ], { duration: 130, easing: "ease-in", fill: "forwards" });
    await fadeOut.finished;
    fadeOut.cancel();
    go(tab);
    const fadeIn = view.animate([
        { opacity: 0, transform: "translateY(12px) scale(.99)", filter: "blur(2px)" },
        { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0)" },
    ], { duration: 260, easing: "cubic-bezier(.2,.75,.3,1)", fill: "both" });
    await fadeIn.finished;
    fadeIn.cancel();
    menuTransitioning = false;
}

$("#view").addEventListener("click", (e) => {
    const button = e.target.closest("button[data-tab], button[data-action='home']");
    if (!button || menuTransitioning) return;
    e.preventDefault();
    e.stopPropagation();
    if (button.dataset.action === "home") {
        tabHistory.length = 0;
        transitionTo("home");
        return;
    }
    if (button.dataset.tab === "map") { state.route = null; state.selected = null; }
    transitionTo(button.dataset.tab);
});

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
const hawaiiTimePartsFormat = new Intl.DateTimeFormat("en-US", {
    weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23", timeZone: "Pacific/Honolulu",
});
const splashClockFormat = new Intl.DateTimeFormat("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "Pacific/Honolulu",
});

function tick() {
    const now = new Date(Date.now() + onlineClockOffsetMs);
    $("#clock").textContent = hawaiiClockFormat.format(now);
    $("#splash-clock").textContent = splashClockFormat.format(now);
    renderClassStatus();
}

function renderClassStatus() {
    const panel = $("#class-status");
    if (!panel) return;

    const parts = Object.fromEntries(hawaiiTimePartsFormat.formatToParts(new Date(Date.now() + onlineClockOffsetMs))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]));
    const day = { Sun: "Su", Mon: "M", Tue: "T", Wed: "W", Thu: "Th", Fri: "F", Sat: "Sa" }[parts.weekday];
    const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute) + Number(parts.second) / 60;
    const parseMinutes = (time) => {
        const [hour, minute] = time.split(":").map(Number);
        return hour * 60 + minute;
    };
    const active = [];
    const upcoming = [];

    K.schedule.filter((course) => course.days.includes(day)).forEach((course) => {
        const start = parseMinutes(course.start);
        const end = parseMinutes(course.end);
        if (start <= currentMinutes && currentMinutes < end) active.push(course);
        else if (start > currentMinutes && start - currentMinutes <= 30) upcoming.push(course);
    });

    const formatMinutes = (minutes) => {
        const hour = Math.floor(minutes / 60);
        return `${((hour + 11) % 12) + 1}:${String(minutes % 60).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
    };
    const rows = (courses, kind) => {
        if (!courses.length) return `<p class="class-status-empty">${kind === "active" ? "No classes in session" : "Nothing starting soon"}</p>`;
        return courses.slice(0, 6).map((course) => {
            const start = parseMinutes(course.start);
            const end = parseMinutes(course.end);
            const detail = kind === "active"
                ? `Until ${formatMinutes(end)}`
                : `${formatMinutes(start)} · ${Math.ceil(start - currentMinutes)}m`;
            return `<div class="class-status-item">
                <strong>${course.course}</strong>
                <small>Room ${course.room} · ${detail}</small>
            </div>`;
        }).join("") + (courses.length > 6 ? `<p class="class-status-more">+${courses.length - 6} more</p>` : "");
    };

    panel.innerHTML = `<section class="class-status-group">
        <h3><span class="class-status-dot is-live"></span>In session</h3>${rows(active, "active")}
    </section>
    <section class="class-status-group is-upcoming">
        <h3><span class="class-status-dot is-soon"></span>Starting soon</h3>${rows(upcoming, "upcoming")}
    </section>`;
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
    go("home", false);
}

// ---------- views ----------
const fmtTime = (t) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };

function renderHome(el) {
    const menus = TABS.map((item) => `
        <button type="button" class="menu-card menu-card-${item.id}" data-tab="${item.id}">
            <span class="menu-icon" aria-hidden="true">${item.icon}</span>
            <span class="menu-card-copy">
                <span class="menu-card-title">${item.label}</span>
                <span class="menu-card-description">${item.description}</span>
            </span>
        </button>`).join("");

    el.innerHTML = `
    <section class="home-screen" aria-label="Kiosk main menu">
        <div class="home-heading">
            <p class="home-kicker">WELCOME TO KA LAMA</p>
            <h2>How can we help?</h2>
            <p>Choose a place or service to get started.</p>
        </div>
        <div class="menu-grid">${menus}</div>
    </section>`;
}

function renderMap(el) {
    const f = K.floors[state.floor];
    const rooms = K.rooms.filter((r) => r.floor === state.floor);
    const kiosk = nodeById[K.config.kioskNodeId];
    const sel = state.selected && roomById(state.selected);

    // route points on this floor (+ the room center at the end if the room is on this floor)
    const pts = state.route ? state.route.filter((n) => n.floor === state.floor).map((n) => [n.x, n.y]) : [];
    if (state.route && sel && sel.floor === state.floor) pts.push([sel.x + sel.w / 2, sel.y + sel.h / 2]);
    const destination = pts.length ? pts[pts.length - 1] : null;

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
    <section class="map-search" aria-labelledby="room-search-title">
      <div class="map-search-copy">
        <p class="map-search-kicker">ROOMS & OFFICES</p>
        <h2 id="room-search-title">Find a room</h2>
        <p>Search by room number, office, or person.</p>
      </div>
      <label class="sr-only" for="room-search">Search by room number, office, or person</label>
      <input type="search" id="room-search" placeholder="Try “103” or a person’s name" autocomplete="off" aria-controls="room-results">
      <div id="room-results" class="room-results" aria-live="polite"></div>
    </section>
    <div class="row floor-controls" role="group" aria-label="Choose a floor">
      <button type="button" class="btn ${state.floor === 1 ? "on" : "alt"}" data-floor="1" aria-pressed="${state.floor === 1}">1st Floor</button>
      <button type="button" class="btn ${state.floor === 2 ? "on" : "alt"}" data-floor="2" aria-pressed="${state.floor === 2}">2nd Floor</button>
    </div>
    <div class="mapwrap">
      <div class="map-frame-heading">
        <div class="map-frame-title">
          <span class="map-floor-number" aria-hidden="true">${state.floor}</span>
          <span><strong>Ka Lama Building</strong><small>Floor ${state.floor} · Tap a room for details</small></span>
        </div>
        <div class="map-legend" aria-label="Map key">
          <span><i class="legend-room"></i>Room</span>
          <span><i class="legend-selected"></i>Selected</span>
          ${state.route ? `<span><i class="legend-route"></i>Route</span>` : ""}
          <span><i class="legend-kiosk"></i>Kiosk · Floor ${kiosk.floor}</span>
        </div>
      </div>
      <svg class="map" role="group" aria-label="Ka Lama floor ${state.floor} map" viewBox="0 0 ${f.w} ${f.h}">
        <image href="${f.img}" x="0" y="0" width="${f.w}" height="${f.h}"/>
        ${rooms.map((r) => {
        const fs = Math.max(9, Math.min(15, r.w * 0.3, r.h * 0.45));
        const type = /restroom/i.test(r.name) ? "restroom" : /classroom|lab/i.test(r.name) ? "classroom" : "office";
        const selected = r.id === state.selected;
        return `<g data-room="${r.id}" role="button" tabindex="0" aria-label="Room ${r.id}, ${r.name}, floor ${r.floor}" aria-pressed="${selected}">
            <rect class="room room-${type} ${selected ? "sel" : ""}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="3"/>
            <text class="rlabel" font-size="${fs}" x="${r.x + r.w / 2}" y="${r.y + r.h / 2}">${r.label || r.id}</text>
          </g>`;
    }).join("")}
        ${pts.length > 1 ? `<polyline class="path-underlay" points="${pts.map((p) => p.join(",")).join(" ")}"/>
          <polyline class="path" points="${pts.map((p) => p.join(",")).join(" ")}"/>
          <circle class="route-destination-halo" cx="${destination[0]}" cy="${destination[1]}" r="17"/>
          <circle class="route-destination" cx="${destination[0]}" cy="${destination[1]}" r="8"/>` : ""}
        ${kiosk.floor === state.floor ? `<g class="kiosk-marker" aria-label="Kiosk location">
          <circle class="kiosk-halo" cx="${kiosk.x}" cy="${kiosk.y}" r="24"/>
          <circle class="you" cx="${kiosk.x}" cy="${kiosk.y}" r="13"/>
          <path class="kiosk-center" d="M${kiosk.x - 4} ${kiosk.y}l3 3 6-7"/>
          <rect class="youlabel-bg" x="${kiosk.x - 80}" y="${kiosk.y + 18}" width="160" height="24" rx="12"/>
          <text class="youlabel" x="${kiosk.x}" y="${kiosk.y + 33}">KIOSK · YOU ARE HERE</text>
        </g>` : ""}
      </svg>
    </div>
    <div class="map-overview">
      <div class="class-status-panel" id="class-status" aria-live="polite"></div>
    </div>
    ${detail}
    <div class="steps">${stepsText}</div>
    ${sel ? `<button class="btn" data-route="${sel.id}">How do I get here?</button>` : ""}`;

    renderClassStatus();
    const searchInput = $("#room-search");
    const searchResults = $("#room-results");
    const normalizeSearch = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ʻ‘’']/g, "").toLowerCase();
    searchInput.addEventListener("input", () => {
        const query = normalizeSearch(searchInput.value.trim());
        if (!query) {
            searchResults.replaceChildren();
            return;
        }

        const matches = K.rooms.map((room) => {
            const people = K.directory.filter((person) => person.room === room.id);
            const searchable = normalizeSearch(`${room.id} ${room.name} ${people.map((person) => `${person.name} ${person.title}`).join(" ")}`);
            return { room, people, searchable };
        }).filter(({ searchable }) => searchable.includes(query)).slice(0, 8);

        searchResults.innerHTML = matches.map(({ room, people }) =>
            `<button type="button" class="room-result" data-search-room="${room.id}">
                <span class="room-result-title">Room ${room.id} · ${room.name}</span>
                <span class="room-result-sub">${people.length
                ? people.map((person) => person.name).join(", ")
                : `Floor ${room.floor}`}</span>
            </button>`).join("") || `<p class="room-result-empty">No matches. Try a room number or a shorter search.</p>`;
    });

    const selectRoom = (roomId) => {
        state.selected = roomId;
        state.route = null;
        state.floor = roomById(roomId).floor;
        renderSection("map", el);
    };

    el.onclick = (e) => {
        const fl = e.target.closest("[data-floor]");
        if (fl) { state.floor = +fl.dataset.floor; return renderSection("map", el); }
        const result = e.target.closest("[data-search-room]");
        if (result) {
            return selectRoom(result.dataset.searchRoom);
        }
        const r = e.target.closest("[data-room]");
        if (r) return selectRoom(r.dataset.room);
        const g = e.target.closest("[data-route]");
        if (g) showRoute(g.dataset.route);
    };
    el.onkeydown = (e) => {
        const room = e.target.closest("[data-room]");
        if (room && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            selectRoom(room.dataset.room);
        }
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
    ${items.map((c) => `<div class="card schedule-card">
        <div class="schedule-info"><div class="main">${c.course}${c.instructor ? ` <span class="schedule-instructor">— ${c.instructor}</span>` : ""}</div>
        <div class="schedule-meta"><span class="sub">${fmtTime(c.start)} – ${fmtTime(c.end)}</span><span class="schedule-room">Room ${c.room}</span></div></div>
        <button class="btn" data-route="${c.room}">Show me</button></div>`).join("")
        || `<div class="sub">No classes in this building on that day.</div>`}`;
    el.onclick = (e) => {
        const d = e.target.closest("[data-day]");
        if (d) { state.day = d.dataset.day; return renderSection("schedule", el); }
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
const CAMPUS_MAP_MIN_ZOOM = 12;
const CAMPUS_MAP_MAX_ZOOM = 20;
let campusMapZoom = Math.min(CAMPUS_MAP_MAX_ZOOM, Math.max(
    CAMPUS_MAP_MIN_ZOOM,
    Number(new URL(K.config.campusMapEmbedUrl, window.location.href).searchParams.get("z")) || 17
));
function campusMapEmbedUrl() {
    const url = new URL(K.config.campusMapEmbedUrl, window.location.href);
    url.searchParams.set("z", String(campusMapZoom));
    return url.toString();
}

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
        ? `<div class="campus-map-frame">
            <iframe class="gmap" src="${campusMapEmbedUrl()}" title="Google map of the UH Maui College campus" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer-when-downgrade" loading="lazy"></iframe>
            <div class="campus-map-zoom" role="group" aria-label="Map zoom controls">
              <button type="button" class="campus-map-zoom-in" data-map-zoom="in" aria-label="Zoom in" ${campusMapZoom >= CAMPUS_MAP_MAX_ZOOM ? "disabled" : ""}>+</button>
              <button type="button" class="campus-map-zoom-out" data-map-zoom="out" aria-label="Zoom out" ${campusMapZoom <= CAMPUS_MAP_MIN_ZOOM ? "disabled" : ""}>−</button>
              <span class="sr-only" aria-live="polite">Map zoom level ${campusMapZoom}</span>
            </div>
          </div>`
        : "";
    el.innerHTML = `<h2>Campus Map</h2>${map}
      <div class="sub" style="font-size:30px;margin-bottom:20px">Where do you want to go? Pick a building, then scan the code with your phone to get walking directions.</div>
      <div class="row">${K.campusBuildings.map((b) =>
        `<button class="btn ${b.id === campusDest ? "on" : "alt"}" data-dest="${b.id}">${b.name}</button>`).join("")}</div>
      ${sel ? qrBlock(`Directions to ${sel.name}`, mapsUrl(sel), "Scan with your phone camera. Walking directions open from wherever you are.") : ""}
      ${qrBlock("Full campus map", K.config.campusMapUrl)}`;
    el.onclick = (e) => {
        const zoom = e.target.closest("[data-map-zoom]");
        if (zoom) {
            campusMapZoom = Math.min(CAMPUS_MAP_MAX_ZOOM, Math.max(
                CAMPUS_MAP_MIN_ZOOM,
                campusMapZoom + (zoom.dataset.mapZoom === "in" ? 1 : -1)
            ));
            renderSection("campus", el);
            makeQRs();
            return;
        }
        const b = e.target.closest("[data-dest]");
        if (b) { campusDest = b.dataset.dest; renderSection("campus", el); makeQRs(); }
    };
  }

// ---------- boot ----------
$("#building-name").textContent = `${K.config.buildingName} Building`;
tick();
setInterval(tick, 30000);
syncOnlineClock();
setInterval(syncOnlineClock, 15 * 60 * 1000);
resetIdle();
go("home");

function enterKiosk() {
    if (splash.hidden || splash.classList.contains("is-exiting")) return;
    document.body.classList.add("kiosk-active");
    void splash.offsetWidth;
    splash.classList.add("is-exiting");
    setTimeout(() => {
        splash.hidden = true;
        document.body.classList.remove("splash-active");
        resetIdle();
    }, 850);
}

$("#splash-enter").addEventListener("click", enterKiosk);
idleWarning.querySelector("#idle-stay").addEventListener("click", resetIdle);
["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
        if (event.target instanceof Element && event.target.closest("#idle-warning")) return;
        resetIdle();
    }, { passive: true });
});