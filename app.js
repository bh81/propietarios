// Casacol Owner Dashboard — plain ES module, no build step.
// Data comes from Supabase (RLS enforces owner <-> segment access) or, with
// ?demo=1 in the URL, from the embedded sample dataset below (no network).
import { SUPABASE_URL, SUPABASE_ANON_KEY, STORAGE_BUCKET } from "./config.js";

const DEMO = new URLSearchParams(location.search).get("demo") === "1";
const SUPABASE_ESM = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* ============================== i18n ============================== */
const STR = {
  es: {
    brand_sub: "Portal de Propietarios", sign_out: "Salir",
    login_title: "Acceda a su panel",
    login_intro: "Sin contraseñas. Use únicamente el correo electrónico que tiene registrado con nosotros: le enviaremos un enlace de acceso de un solo uso, válido por 60 minutos.",
    email_label: "Correo electrónico", email_ph: "su@correo.com",
    send_link: "Enviar enlace de acceso",
    sent_msg: "Si su correo está en nuestra base de datos, ya le enviamos el enlace de acceso — recuerde que es válido por 60 minutos. Revise su bandeja de entrada (y el correo no deseado).",
    or_code: "o ingrese con un código", otp_label: "Código de 6 dígitos",
    verify_code: "Entrar",
    otp_hint: "Si su correo no muestra el enlace, use el código de 6 dígitos que llega en el mismo mensaje.",
    otp_bad: "Código no válido o vencido. Pida un enlace nuevo e inténtelo de nuevo.",
    privacy: "Aviso de privacidad (Ley 1581 de 2012 — Habeas Data): su correo se usa únicamente para identificarlo y darle acceso a los documentos de su(s) unidad(es). Puede solicitar la revocación de este acceso en cualquier momento escribiendo a la administración.",
    segment_label: "Unidad", loading: "Cargando…",
    nav_home: "Inicio", nav_docs: "Documentos", nav_payments: "Pagos",
    footer_note: "Loma Verde — Administración de propietarios. Los valores están en pesos colombianos (COP).",
    latest_month: "Último mes publicado",
    pool_share: "Su participación — total rental pool monthly sales",
    pool_building: "Total rental pool monthly sales del edificio",
    total_expenses: "Total gastos", net: "Ingreso neto", saldo: "Saldo final",
    paid: "Pagado", pending: "Pendiente",
    view_statement: "Ver informe del mes (PDF)",
    no_data: "Todavía no hay meses publicados para esta unidad.",
    closed_note: "Esta unidad cambió de propietario: su historial quedó cerrado y visible solo para consulta.",
    hotel_title_suffix: "este mes", month_label: "Mes",
    no_insights: "No hay cifras del hotel publicadas para este mes.",
    docs_title: "Documentos",
    col_month: "Mes/Año", col_report: "Informe mensual PDF", col_fevp: "Facturas Siigo PDF", col_tax: "Documentos tributarios PDF",
    doc_statement: "Informe mensual", doc_annex: "Anexo de gastos",
    pay_title: "Pagos", pay_proof: "Comprobante",
    not_linked: "Su cuenta aún no está vinculada a un propietario. Escriba a la administración para activar su acceso.",
    demo_toast: "Demo: la descarga está deshabilitada.",
    participation: "Participación",
  },
  en: {
    brand_sub: "Owner Portal", sign_out: "Sign out",
    login_title: "Access your dashboard",
    login_intro: "No passwords. Use only the email address you have on file with us — we will send you a single-use access link, good for 60 minutes.",
    email_label: "Email address", email_ph: "you@email.com",
    send_link: "Send access link",
    sent_msg: "If your email is in our database, we have sent you the access link — remember it is good for 60 minutes. Check your inbox (and spam folder).",
    or_code: "or sign in with a code", otp_label: "6-digit code",
    verify_code: "Sign in",
    otp_hint: "If your mail app hides the link, use the 6-digit code from the same message.",
    otp_bad: "Invalid or expired code. Request a new link and try again.",
    privacy: "Privacy notice (Law 1581 of 2012 — Habeas Data): your email is used only to identify you and give you access to your unit's documents. You may request removal of this access at any time by writing to the administration.",
    segment_label: "Unit", loading: "Loading…",
    nav_home: "Home", nav_docs: "Documents", nav_payments: "Payments",
    footer_note: "Loma Verde — Owner Administration. All amounts are in Colombian pesos (COP).",
    latest_month: "Latest published month",
    pool_share: "Your share — total rental pool monthly sales",
    pool_building: "Building total rental pool monthly sales",
    total_expenses: "Total expenses", net: "Net income", saldo: "Final balance",
    paid: "Paid", pending: "Pending",
    view_statement: "View this month's report (PDF)",
    no_data: "No months have been published for this unit yet.",
    closed_note: "This unit changed ownership: its history is closed and remains visible for reference only.",
    hotel_title_suffix: "this month", month_label: "Month",
    no_insights: "No hotel figures have been published for this month.",
    docs_title: "Documents",
    col_month: "Month/Year", col_report: "Monthly report PDF", col_fevp: "Siigo invoices PDF", col_tax: "Tax documents PDF",
    doc_statement: "Monthly report", doc_annex: "Expense annex",
    pay_title: "Payments", pay_proof: "Proof of payment",
    not_linked: "Your account is not linked to an owner yet. Please write to the administration to activate your access.",
    demo_toast: "Demo: downloads are disabled.",
    participation: "Ownership share",
  },
};
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
};
let LANG = store.get("od_lang") || "es";
const t = (k) => (STR[LANG] && STR[LANG][k]) || STR.es[k] || k;

/* ============================ formatting ============================ */
const moneyFmt = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const numFmt = new Intl.NumberFormat("es-CO");
const money = (v) => moneyFmt.format(Number(v) || 0);
const num = (v) => numFmt.format(Number(v) || 0);
function pct(v) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(Number(v) || 0) + "%";
}
const MONTHS = {
  es: ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
};
function monthName(period) { // "2026-09"
  const [y, m] = String(period).split("-");
  const name = (MONTHS[LANG] || MONTHS.es)[parseInt(m, 10) - 1] || m;
  return `${name} ${y}`;
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ============================ demo data ============================ */
// Loma Verde, Apartment 208, owner Gonzalo Castro Hernandez, Sep 2026.
const DEMO_DATA = {
  owners: [{ id: "own-demo", property_id: "prop-lv", full_name: "Gonzalo Castro Hernandez",
             doc_type: "CC", doc_number: "70064646", email: "demo@casacol.co", language: "es" }],
  properties: [{ id: "prop-lv", name: "Loma Verde", legal_entity: "LOMA VERDE CASACOL S.A.S.", nit: "901379394" }],
  segments: [{ id: "seg-208", owner_id: "own-demo", unit_label: "Apartamento 208",
               participation: 100, active_from: "2026-01-01", active_to: null }],
  summaries: [
    { id: "sum-2026-09", segment_id: "seg-208", period: "2026-09", pool_sales_share: 4896259,
      total_expenses: 3932421, net: 963838, saldo_final: 0, payment_status: "paid",
      payment_note: "6 oct 2026 · ACH · Doc. A727024" },
    { id: "sum-2026-08", segment_id: "seg-208", period: "2026-08", pool_sales_share: 7027571,
      total_expenses: 4363726, net: 2663845, saldo_final: 0, payment_status: "paid",
      payment_note: "Sep 2026 · ACH" },
  ],
  documents: [
    { id: "doc-st-09", segment_id: "seg-208", period: "2026-09", type: "statement",
      title: "Informe mensual — septiembre 2026", storage_path: "#" },
    { id: "doc-an-09", segment_id: "seg-208", period: "2026-09", type: "annex",
      title: "Anexo de gastos — septiembre 2026", storage_path: "#" },
    { id: "doc-fv-09", segment_id: "seg-208", period: "2026-09", type: "fevp",
      title: "FEVP FV-5-31465", storage_path: "#" },
    { id: "doc-st-08", segment_id: "seg-208", period: "2026-08", type: "statement",
      title: "Informe mensual — agosto 2026", storage_path: "#" },
  ],
  insights: [
    { id: "ins-2026-09", property_id: "prop-lv", period: "2026-09",
      headline_metrics: [
        { label: { es: "Ocupación", en: "Occupancy" }, value: 64.9, format: "percent" },
        { label: { es: "Tarifa promedio (ADR)", en: "Average rate (ADR)" }, value: 318392, format: "money" },
        { label: { es: "RevPAR", en: "RevPAR" }, value: 206576, format: "money" },
        { label: { es: "Llegadas", en: "Arrivals" }, value: 236, format: "number" },
        { label: { es: "Reservas activas", en: "Active reservations" }, value: 269, format: "number" },
        { label: { es: "Total rental pool monthly sales", en: "Total rental pool monthly sales" }, value: 278686026, format: "money" },
      ],
      charts: {
        channels: { type: "bar", unit: "percent", title: { es: "Mezcla de canales", en: "Channel mix" },
          data: [ { label: "Booking.com", value: 33.9 }, { label: "Walk-In", value: 25.3 },
                  { label: "WhatsApp", value: 14.2 }, { label: "Expedia", value: 8.1 },
                  { label: "Airbnb", value: 6.9 }, { label: "Website", value: 6.0 },
                  { label: "Owners", value: 5.5 }, { label: "Other", value: 0.2 } ] },
        composition: { type: "donut", unit: "count", title: { es: "¿Quiénes viajan?", en: "Who is traveling?" },
          data: [ { label: { es: "Pareja", en: "Couple" }, value: 172 }, { label: { es: "Grupo", en: "Group" }, value: 48 },
                  { label: { es: "Solo", en: "Solo" }, value: 36 }, { label: { es: "Familia", en: "Family" }, value: 13 } ] },
        origin: { type: "donut", unit: "count", title: { es: "Origen de los huéspedes (noches-huésped)", en: "Guest origin (guest nights)" },
          data: [ { label: { es: "Internacional", en: "International" }, value: 1435 },
                  { label: { es: "Nacional", en: "Domestic" }, value: 698 } ] },
        length_of_stay: { type: "bar", unit: "count", title: { es: "Duración de la estadía (reservas)", en: "Length of stay (reservations)" },
          data: [ { label: "1–2", value: 82 }, { label: "3–5", value: 110 },
                  { label: "6–13", value: 57 }, { label: "14+", value: 20 } ] },
        trend: { type: "trend", title: { es: "El año en curso", en: "Year to date" },
          data: [ { period: "2026-01", income: 717021771, occupancy: 83.9 }, { period: "2026-02", income: 497022272, occupancy: 84.5 },
                  { period: "2026-03", income: 509733482, occupancy: 75.1 }, { period: "2026-04", income: 407304473, occupancy: 69.2 },
                  { period: "2026-05", income: 420524983, occupancy: 71.6 }, { period: "2026-06", income: 391074149, occupancy: 72.7 },
                  { period: "2026-07", income: 437751339, occupancy: 73.4 }, { period: "2026-08", income: 576434000, occupancy: 82.1 },
                  { period: "2026-09", income: 337374204, occupancy: 64.9 } ] },
      } },
  ],
};

/* ============================== state ============================== */
const state = {
  sb: null, user: null, owners: [], properties: [], segments: [],
  segmentId: null, summaries: [], documents: [], insights: [],
  insightPeriod: null, loggedLogin: false,
};
const $ = (id) => document.getElementById(id);

function currentSegment() { return state.segments.find((s) => s.id === state.segmentId) || null; }
function ownerOf(seg) { return state.owners.find((o) => o.id === (seg && seg.owner_id)) || state.owners[0] || null; }
function propertyOf(owner) { return state.properties.find((p) => p.id === (owner && owner.property_id)) || null; }

function toast(msg) {
  const el = $("toast"); el.textContent = msg; el.hidden = false;
  clearTimeout(toast._h); toast._h = setTimeout(() => { el.hidden = true; }, 3200);
}
function showLoading(on) { $("loading").hidden = !on; }

/* ============================ access log ============================ */
async function logAccess(action, documentId) {
  if (DEMO || !state.sb || !state.user) return; // best effort only
  try {
    const owner = ownerOf(currentSegment());
    await state.sb.from("access_log").insert({
      auth_user_id: state.user.id, owner_id: owner ? owner.id : null,
      action, document_id: documentId || null,
    });
  } catch (_) { /* never block the UI on logging */ }
}

/* ============================== auth ============================== */
async function initSupabase() {
  if (DEMO) return null;
  const { createClient } = await import(SUPABASE_ESM);
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, detectSessionInUrl: true },
  });
}

async function requestAccessByToken(token) {
  // Statement-email button: the signed token identifies the segment; the
  // Edge Function verifies it and emails the one-time link to the registered
  // address. Same confirmation shown either way.
  try {
    await fetch(SUPABASE_URL + "/functions/v1/request-access", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ token }),
    });
  } catch (_) { /* same message shown regardless */ }
  $("login-sent").textContent = t("sent_msg");
  $("login-sent").hidden = false;
}

async function requestLink(email) {
  // Anti-enumeration: the UI shows the same confirmation either way.
  try {
    if (!state.sb) state.sb = await initSupabase();
    await state.sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + location.pathname },
    });
  } catch (_) { /* same message shown regardless */ }
  $("login-sent").textContent = t("sent_msg");
  $("login-sent").hidden = false;
}


/* ============================ data load ============================ */
async function loadAll() {
  showLoading(true);
  try {
    if (DEMO) {
      state.owners = DEMO_DATA.owners; state.properties = DEMO_DATA.properties;
      state.segments = DEMO_DATA.segments; state.summaries = DEMO_DATA.summaries;
      state.documents = DEMO_DATA.documents; state.insights = DEMO_DATA.insights;
    } else {
      const uid = state.user.id;
      const { data: links } = await state.sb.from("owner_users")
        .select("owner_id").eq("auth_user_id", uid);
      const ownerIds = (links || []).map((r) => r.owner_id);
      if (!ownerIds.length) { $("fatal").textContent = t("not_linked"); $("fatal").hidden = false; return; }
      const [ownersRes, segRes] = await Promise.all([
        state.sb.from("owners").select("*").in("id", ownerIds),
        state.sb.from("segments").select("*").in("owner_id", ownerIds)
          .order("active_from", { ascending: false }),
      ]);
      state.owners = ownersRes.data || [];
      state.segments = segRes.data || [];
      const propIds = [...new Set(state.owners.map((o) => o.property_id))];
      if (propIds.length) {
        const { data: props } = await state.sb.from("properties").select("*").in("id", propIds);
        state.properties = props || [];
      }
      // Default segment: an active one first, else the most recent.
      const first = state.segments.find((s) => !s.active_to) || state.segments[0];
      state.segmentId = first ? first.id : null;
      await loadSegmentData();
    }
    if (DEMO && !state.segmentId) state.segmentId = state.segments[0].id;
    // Owner language preference wins over the stored toggle, once.
    const pref = state.owners[0] && state.owners[0].language;
    if (pref && !store.get("od_lang_user_set")) { LANG = pref; applyI18n(); }
    if (!state.loggedLogin) { state.loggedLogin = true; logAccess("login"); }
    renderShell();
    route();
  } finally { showLoading(false); }
}

async function loadSegmentData() {
  const seg = currentSegment(); if (!seg) return;
  const owner = ownerOf(seg);
  const [sumRes, docRes, insRes] = await Promise.all([
    state.sb.from("month_summaries").select("*").eq("segment_id", seg.id)
      .order("period", { ascending: false }),
    state.sb.from("documents").select("*").eq("segment_id", seg.id)
      .order("period", { ascending: false }),
    owner ? state.sb.from("property_month_insights").select("*")
      .eq("property_id", owner.property_id).order("period", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  state.summaries = sumRes.data || [];
  state.documents = docRes.data || [];
  state.insights = insRes.data || [];
  state.insightPeriod = state.insights.length ? state.insights[0].period : null;
}

/* ============================ downloads ============================ */
async function download(doc) {
  if (DEMO || !doc.storage_path || doc.storage_path === "#") { toast(t("demo_toast")); return; }
  try {
    const { data, error } = await state.sb.storage.from(STORAGE_BUCKET)
      .createSignedUrl(doc.storage_path, 60);
    if (error || !data || !data.signedUrl) throw new Error("sign");
    logAccess("download", doc.id);
    window.open(data.signedUrl, "_blank", "noopener");
  } catch (_) { toast(t("demo_toast")); }
}

/* ============================== charts ============================== */
const PALETTE = ["#1E4634", "#C2A14D", "#2F6B4F", "#D9CEA8", "#8A968C", "#5C6B5E"];
const locLabel = (l) => (l && typeof l === "object") ? (l[LANG] || l.es || l.en || "") : String(l ?? "");

function chartValue(v, unit) {
  if (unit === "percent") return pct(v);
  if (unit === "money") return money(v);
  return num(v);
}
function barChart(chart) {
  const data = (chart.data || []).filter((d) => d && isFinite(Number(d.value)));
  if (!data.length) return "";
  const max = Math.max(...data.map((d) => Number(d.value))) || 1;
  return data.map((d, i) => {
    const w = Math.max(1.5, (Number(d.value) / max) * 100);
    return `<div class="bar-row"><span>${esc(locLabel(d.label))}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${w}%;background:${PALETTE[i % PALETTE.length]}"></span></span>
      <span class="bar-val">${esc(chartValue(d.value, chart.unit))}</span></div>`;
  }).join("");
}
function donutChart(chart) {
  const data = (chart.data || []).filter((d) => d && Number(d.value) > 0);
  if (!data.length) return "";
  const total = data.reduce((a, d) => a + Number(d.value), 0);
  const R = 52, C = 2 * Math.PI * R;
  let acc = 0;
  const segs = data.map((d, i) => {
    const frac = Number(d.value) / total;
    const seg = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${PALETTE[i % PALETTE.length]}"
      stroke-width="24" stroke-dasharray="${(frac * C).toFixed(2)} ${C.toFixed(2)}"
      stroke-dashoffset="${(-acc * C).toFixed(2)}" transform="rotate(-90 70 70)"/>`;
    acc += frac; return seg;
  }).join("");
  const legend = data.map((d, i) =>
    `<li><span class="swatch" style="background:${PALETTE[i % PALETTE.length]}"></span>${esc(locLabel(d.label))} · <b>${esc(chartValue(d.value, chart.unit))}</b> (${pct(Number(d.value) / total * 100)})</li>`).join("");
  return `<div class="donut-flex"><svg width="140" height="140" viewBox="0 0 140 140" role="img">${segs}
    <text x="70" y="66" text-anchor="middle" font-size="17" font-weight="800" fill="#1E4634">${esc(num(total))}</text>
    <text x="70" y="84" text-anchor="middle" font-size="9" fill="#5C6B5E">${esc(chart.unit === "money" ? "COP" : "")}</text></svg>
    <ul class="legend">${legend}</ul></div>`;
}
function trendChart(chart) {
  const data = (chart.data || []).filter((d) => d && isFinite(Number(d.income)));
  if (!data.length) return "";
  const W = 640, H = 190, base = 160, top = 18;
  const max = Math.max(...data.map((d) => Number(d.income))) || 1;
  const bw = W / data.length;
  const bars = data.map((d, i) => {
    const h = (Number(d.income) / max) * (base - top);
    return `<rect x="${(i * bw + bw * 0.22).toFixed(1)}" y="${(base - h).toFixed(1)}" width="${(bw * 0.56).toFixed(1)}"
      height="${h.toFixed(1)}" rx="3" fill="${i === data.length - 1 ? "#1E4634" : "#2F6B4F"}"/>`;
  }).join("");
  const pts = data.map((d, i) => {
    const x = i * bw + bw / 2;
    const y = isFinite(Number(d.occupancy)) ? base - (Number(d.occupancy) / 100) * (base - top) : null;
    return y === null ? "" : `${x.toFixed(1)},${y.toFixed(1)}`;
  }).filter(Boolean).join(" ");
  const labels = data.map((d, i) =>
    `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="10" fill="#5C6B5E">${esc(String(d.period || "").slice(5))}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">${bars}
    ${pts ? `<polyline points="${pts}" fill="none" stroke="#C2A14D" stroke-width="2.5"/>` : ""}${labels}</svg>
    <p class="muted small">${esc(LANG === "en" ? "Bars: monthly revenue (COP) · Gold line: occupancy %" : "Barras: ingresos del mes (COP) · Línea dorada: ocupación %")}</p>`;
}
function renderChart(chart) {
  if (!chart || typeof chart !== "object") return "";
  let body = "";
  try {
    if (chart.type === "bar") body = barChart(chart);
    else if (chart.type === "donut") body = donutChart(chart);
    else if (chart.type === "trend") body = trendChart(chart);
  } catch (_) { body = ""; }
  if (!body) return "";
  const title = chart.title ? `<h3>${esc(locLabel(chart.title))}</h3>` : "";
  return `<div class="card chart-card">${title}${body}</div>`;
}

/* ============================== views ============================== */
function figCard(label, value, sub) {
  return `<div class="fig"><div class="fig-label">${esc(label)}</div>
    <div class="fig-value">${esc(value)}</div>${sub ? `<div class="fig-sub">${esc(sub)}</div>` : ""}</div>`;
}
function hotelTitle() { const seg = currentSegment(); const prop = propertyOf(ownerOf(seg)); return `${(prop && prop.name) || "Loma Verde"} ${t("hotel_title_suffix")}`; }
function renderHotel() {
  const el = $("view-hotel");
  if (!state.insights.length) { el.innerHTML = `<h2>${esc(hotelTitle())}</h2><div class="empty-state">${esc(t("no_insights"))}</div>`; return; }
  const periods = state.insights.map((i) => i.period);
  if (!periods.includes(state.insightPeriod)) state.insightPeriod = periods[0];
  const ins = state.insights.find((i) => i.period === state.insightPeriod);
  let metrics = "";
  const hm = ins.headline_metrics;
  if (Array.isArray(hm)) {
    const keep = hm.filter((m) => !/revpar|llegadas|arrivals/i.test(`${(m.label && m.label.es) || ""} ${(m.label && m.label.en) || ""}`));
    metrics = keep.map((m) => figCard(locLabel(m.label), formatMetric(m))).join("");
  } else if (hm && typeof hm === "object") {
    metrics = Object.entries(hm).map(([k, v]) =>
      figCard(k.replace(/_/g, " "), (typeof v === "object" && v !== null) ? formatMetric(v) : String(v))).join("");
  }
  const order = ["channels", "composition", "origin", "length_of_stay", "trend"];
  const charts = ins.charts || {};
  const keys = [...order.filter((k) => charts[k]), ...Object.keys(charts).filter((k) => !order.includes(k))];
  const chartsHtml = keys.map((k) => renderChart(charts[k])).join("");
  el.innerHTML = `
    <h2>${esc(hotelTitle())}</h2>
    <label for="insight-month">${esc(t("month_label"))}</label>
    <select id="insight-month" style="max-width:260px">${periods.map((p) =>
      `<option value="${esc(p)}" ${p === state.insightPeriod ? "selected" : ""}>${esc(monthName(p))}</option>`).join("")}</select>
    ${metrics ? `<div class="fig-grid">${metrics}</div>` : ""}
    ${chartsHtml || `<div class="empty-state">${esc(t("no_insights"))}</div>`}`;
  $("insight-month").addEventListener("change", (e) => { state.insightPeriod = e.target.value; renderHotel(); });
}

const DOC_COLS = [
  ["statement", "annex"],
  ["fevp"],
  ["retention_cert", "income_cert", "other"],
];
function docLabel(d) {
  if (d.type === "statement") return d.title || t("doc_statement");
  if (d.type === "annex") return d.title || t("doc_annex");
  return d.title || d.type;
}
function renderDocumentos() {
  const el = $("view-documentos");
  const docs = state.documents.filter((d) => d.type !== "payment_proof");
  if (!docs.length) { el.innerHTML = `<h2>${esc(t("docs_title"))}</h2><div class="empty-state">${esc(t("no_data"))}</div>`; return; }
  const periods = [...new Set(docs.map((d) => d.period))].sort().reverse();
  const years = [...new Set(periods.map((p) => p.slice(0, 4)))].sort().reverse();
  let rows = "";
  for (const y of years) {
    rows += `<tr class="year-row"><td colspan="4">${esc(y)}</td></tr>`;
    for (const p of periods.filter((x) => x.startsWith(y))) {
      const cells = DOC_COLS.map((types) => {
        const cell = docs.filter((d) => d.period === p && types.includes(d.type));
        if (!cell.length) return `<span class="empty-cell">—</span>`;
        return cell.map((d) => `<a href="#" class="doc-link" data-doc="${esc(d.id)}">⬇ ${esc(docLabel(d))}</a>`).join("");
      });
      rows += `<tr><td><b>${esc(monthName(p))}</b></td><td>${cells[0]}</td><td>${cells[1]}</td><td>${cells[2]}</td></tr>`;
    }
  }
  el.innerHTML = `<h2>${esc(t("docs_title"))}</h2>
    <div class="table-wrap"><table class="matrix"><thead><tr>
      <th>${esc(t("col_month"))}</th><th>${esc(t("col_report"))}</th><th>${esc(t("col_fevp"))}</th><th>${esc(t("col_tax"))}</th>
    </tr></thead><tbody>${rows}</tbody></table></div>`;
  el.querySelectorAll("[data-doc]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const doc = state.documents.find((d) => d.id === a.getAttribute("data-doc"));
    if (doc) download(doc);
  }));
}

function renderPagos() {
  const el = $("view-pagos");
  if (!state.summaries.length) { el.innerHTML = `<h2>${esc(t("pay_title"))}</h2><div class="empty-state">${esc(t("no_data"))}</div>`; return; }
  const rows = state.summaries.map((s) => {
    const proofs = state.documents.filter((d) => d.period === s.period && d.type === "payment_proof");
    const proofLinks = proofs.map((d) =>
      `<a href="#" class="doc-link" data-doc="${esc(d.id)}">⬇ ${esc(d.title || t("pay_proof"))}</a>`).join("");
    return `<div class="pay-row"><div><b>${esc(monthName(s.period))}</b>${proofLinks}</div>
      <div style="text-align:right"><div class="pay-amt">${esc(money(s.net))}</div></div></div>`;
  }).join("");
  el.innerHTML = `<h2>${esc(t("pay_title"))}</h2><div class="card">${rows}</div>`;
  el.querySelectorAll("[data-doc]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const doc = state.documents.find((d) => d.id === a.getAttribute("data-doc"));
    if (doc) download(doc);
  }));
}

/* ============================== shell ============================== */
function applyI18n() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.getAttribute("data-i18n")); });
  document.querySelectorAll("[data-i18n-ph]").forEach((n) => { n.setAttribute("placeholder", t(n.getAttribute("data-i18n-ph"))); });
  $("lang-es").classList.toggle("active", LANG === "es");
  $("lang-en").classList.toggle("active", LANG === "en");
}
function renderShell() {
  const seg = currentSegment(); const owner = ownerOf(seg); const prop = propertyOf(owner);
  if (owner) $("owner-name").textContent = owner.full_name;
  if (owner && seg) {
    $("owner-meta").textContent =
      `${prop ? prop.name + " · " : ""}${seg.unit_label} · ${t("participation")} ${num(seg.participation)}%`;
  }
  const box = $("segment-box");
  if (state.segments.length > 1) {
    box.hidden = false;
    $("segment-select").innerHTML = state.segments.map((s) => {
      const o = ownerOf(s); const p = propertyOf(o);
      return `<option value="${esc(s.id)}" ${s.id === state.segmentId ? "selected" : ""}>${esc((p ? p.name + " — " : "") + s.unit_label)}</option>`;
    }).join("");
  } else box.hidden = true;
  const closed = $("closed-note");
  if (seg && seg.active_to) { closed.textContent = t("closed_note"); closed.hidden = false; }
  else closed.hidden = true;
}
const ROUTES = { hotel: renderHotel, documentos: renderDocumentos, pagos: renderPagos };
function route() {
  if ($("view-app").hidden) return;
  const name = (location.hash || "#/hotel").replace("#/", "").split("?")[0];
  const key = ROUTES[name] ? name : "hotel";
  for (const k of Object.keys(ROUTES)) $("view-" + k).hidden = k !== key;
  document.querySelectorAll("#tabs a").forEach((a) =>
    a.classList.toggle("active", a.getAttribute("data-route") === key));
  ROUTES[key]();
}
function showApp() { $("view-login").hidden = true; $("view-app").hidden = false; $("signout-btn").hidden = false; }
function showLogin() { $("view-app").hidden = true; $("view-login").hidden = false; $("signout-btn").hidden = true; }

async function onSession(session) {
  if (!session || !session.user) return;
  state.user = session.user;
  showApp();
  await loadAll();
}

/* ============================== init ============================== */
async function init() {
  applyI18n();
  $("demo-badge").hidden = !DEMO;
  const prefill = new URLSearchParams(location.search).get("email");
  if (prefill) $("email").value = prefill;

  $("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (DEMO) { showApp(); await loadAll(); return; }
    await requestLink($("email").value.trim());
  });

  $("lang-es").addEventListener("click", () => setLang("es"));
  $("lang-en").addEventListener("click", () => setLang("en"));
  $("segment-select").addEventListener("change", async (e) => {
    state.segmentId = e.target.value;
    state.insightPeriod = null;
    if (!DEMO) { showLoading(true); try { await loadSegmentData(); } finally { showLoading(false); } }
    else {
      state.summaries = DEMO_DATA.summaries.filter((s) => s.segment_id === state.segmentId);
      state.documents = DEMO_DATA.documents.filter((d) => d.segment_id === state.segmentId);
    }
    renderShell(); route();
  });
  $("signout-btn").addEventListener("click", async () => {
    if (!DEMO && state.sb) { try { await state.sb.auth.signOut(); } catch (_) {} }
    state.user = null; state.loggedLogin = false; showLogin();
  });
  window.addEventListener("hashchange", route);

  if (DEMO) { showApp(); await loadAll(); return; }
  try {
    state.sb = await initSupabase();
    const { data } = await state.sb.auth.getSession();
    if (data && data.session) { await onSession(data.session); return; }
  } catch (err) { console.error("Supabase boot failed:", err); }
  showLogin();
  const tok = new URLSearchParams(location.search).get("t");
  if (tok) requestAccessByToken(tok);
  if (state.sb) state.sb.auth.onAuthStateChange((_evt, session) => {
    if (session && (!state.user || state.user.id !== session.user.id)) onSession(session);
  });
}
function setLang(l) {
  LANG = l;
  store.set("od_lang", l);
  store.set("od_lang_user_set", "1");
  applyI18n();
  if (!$("view-app").hidden && state.segments.length) { renderShell(); route(); }
}
init();
