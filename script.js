let shows = JSON.parse(localStorage.getItem("shows")) || [];
let viewDate = new Date();
const PRESET_COLORS = [
  "#007aff",
  "#ff3b30",
  "#34c759",
  "#ff9500",
  "#af52de",
  "#5856d6",
  "#ff2d55",
  "#a2845e",
];

/* --- INICIALIZAÇÃO --- */
function init() {
  renderColorPresets();
  renderCalendar();
  checkAndNotify();
  setupPWA();
}

/* --- FUNÇÃO CORRETORA DE DATA --- */
function getLocalDateString() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
}

/* --- CALENDÁRIO --- */
function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  document.getElementById("currentMonthDisplay").innerText =
    viewDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  grid.innerHTML = "";

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = getLocalDateString();

  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(
      Object.assign(document.createElement("div"), {
        className: "day other-month",
      }),
    );
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const offset = dateObj.getTimezoneOffset() * 60000;
    const dateStr = new Date(dateObj.getTime() - offset)
      .toISOString()
      .split("T")[0];

    const dayShows = shows.filter((s) => s.date === dateStr);

    const el = document.createElement("div");
    el.className = "day";
    if (todayStr === dateStr) el.classList.add("today");

    const labelsHtml = dayShows
      .map(
        (s) => `
            <div class="day-artist-label" style="border-left-color:${s.color || "#007aff"};">${s.artist}</div>
        `,
      )
      .join("");

    el.innerHTML = `<span class="day-number">${d}</span><div style="width:100%; display:flex; flex-direction:column; gap:2px;">${labelsHtml}</div>`;
    el.onclick = () =>
      dayShows.length
        ? openDetailsModal(dateStr, dayShows)
        : openFormModal(dateStr);
    grid.appendChild(el);
  }
}

/* --- MODAIS --- */
function openFormModal(date = "") {
  document.getElementById("showForm").reset();
  document.getElementById("editingId").value = "";
  document.getElementById("formTitle").innerText = "NOVO SHOW";
  if (date) document.getElementById("showDate").value = date;
  const firstColor = PRESET_COLORS[0];
  const firstEl = document.querySelector(
    `.color-option[data-color="${firstColor}"]`,
  );
  selectEventColor(firstColor, firstEl);
  document.getElementById("formModal").style.display = "flex";
}

function openDetailsModal(dateStr, dayShows) {
  const list = document.getElementById("detailsList");
  const dateObj = new Date(dateStr + "T00:00:00");
  document.getElementById("detailsDateTitle").innerText =
    dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });

  list.innerHTML =
    dayShows
      .map(
        (s) => `
        <div style="background:#2c2c2e; border-left:5px solid ${s.color}; padding:15px; border-radius:12px; margin-bottom:15px;">
            <h3 style="color:#fff; margin-bottom:5px;">${s.artist}</h3>
            <p style="color:#aaa; font-size:0.9em; margin-bottom:5px;">📍 ${s.venue}</p>
            <p style="color:#aaa; font-size:0.9em; margin-bottom:10px;">⏰ ${s.startTime} - ${s.endTime}</p>
            <p style="color:#34c759; font-weight:bold; font-size:1.1em; margin-bottom:15px;">R$ ${s.value}</p>
            
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <a href="https://waze.com/ul?q=${encodeURIComponent(s.venue)}&navigate=yes" target="_blank" class="btn-primary" 
                   style="padding:10px; margin:0; background:#33ccff; color:#000; text-decoration:none; display:flex; align-items:center; justify-content:center; flex:1; font-size:0.9em;">
                   🚗 Waze
                </a>
                
                <button class="btn-primary" style="padding:10px; margin:0; background:#444; flex:1; font-size:0.9em;" onclick="editShow(${s.id})">✏️ Editar</button>
                <button class="btn-primary" style="padding:10px; margin:0; background:#5856d6; flex:1; font-size:0.9em;" onclick="duplicateShow(${s.id})">📑 Copiar</button>
                <button class="btn-primary" style="padding:10px; margin:0; background:var(--danger); flex:1; font-size:0.9em;" onclick="deleteShow(${s.id})">🗑️</button>
            </div>
        </div>
    `,
      )
      .join("") +
    `<button class="btn-primary" onclick="closeModal('detailsModal'); openFormModal('${dateStr}')">+ Novo Show</button>`;

  document.getElementById("detailsModal").style.display = "flex";
}

function duplicateShow(id) {
  const s = shows.find((x) => x.id === id);
  if (!s) return;
  closeModal("detailsModal");
  openFormModal();
  document.getElementById("formTitle").innerText = "DUPLICAR SHOW";
  document.getElementById("artistName").value = s.artist;
  document.getElementById("venueName").value = s.venue;
  document.getElementById("startTime").value = s.startTime;
  document.getElementById("endTime").value = s.endTime;
  document.getElementById("showValue").value = s.value;
  document.getElementById("notes").value = s.notes;
  document.getElementById("nfDate").value = s.nfDate;
  document.getElementById("paymentDate").value = s.paymentDate;
  document.getElementById("showDate").value = s.date;
  const colorEl = document.querySelector(
    `.color-option[data-color="${s.color}"]`,
  );
  selectEventColor(s.color, colorEl);
  alert("Dados copiados! Escolha a NOVA DATA e salve.");
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

/* --- FINANCEIRO --- */
function openStatsModal() {
  const cm = viewDate.getMonth(),
    cy = viewDate.getFullYear();
  const monthName = viewDate.toLocaleDateString("pt-BR", { month: "long" });
  const mShows = shows.filter((s) => {
    const d = new Date(s.date + "T00:00:00");
    return d.getMonth() === cm && d.getFullYear() === cy;
  });
  const mTotal = mShows.reduce((a, b) => a + b.value, 0);
  const yShows = shows.filter((s) => new Date(s.date).getFullYear() === cy);
  const yTotal = yShows.reduce((a, b) => a + b.value, 0);

  document.getElementById("statsDisplay").innerHTML = `
        <div style="background:#f8f9fa; padding:20px; border-radius:16px; text-align:center; margin-bottom:15px">
            <h3 style="color:#7f8c8d; font-size:0.8em; text-transform:uppercase;">Em ${monthName}</h3>
            <h1 style="color:#2c3e50; font-size:2.5em; font-weight:800; margin:5px 0">R$ ${mTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h1>
            <p style="font-size:0.8em; color:#999">${mShows.length} shows</p>
        </div>
        <div style="background:#000; border:1px solid #333; padding:20px; border-radius:16px; text-align:center;">
            <h3 style="color:#aaa; font-size:0.8em; text-transform:uppercase;">Ano de ${cy}</h3>
            <h2 style="color:#34c759; font-size:2.2em; font-weight:800; margin:5px 0">R$ ${yTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h2>
            <p style="font-size:0.8em; color:#555">${yShows.length} shows</p>
        </div>`;
  document.getElementById("statsModal").style.display = "flex";
}

/* --- CRUD --- */
document.getElementById("showForm").onsubmit = function (e) {
  e.preventDefault();
  const id = document.getElementById("editingId").value;
  const data = {
    id: id ? parseInt(id) : Date.now(),
    date: document.getElementById("showDate").value,
    nfDate: document.getElementById("nfDate").value,
    paymentDate: document.getElementById("paymentDate").value,
    artist: document.getElementById("artistName").value,
    venue: document.getElementById("venueName").value,
    startTime: document.getElementById("startTime").value,
    endTime: document.getElementById("endTime").value,
    value: parseFloat(document.getElementById("showValue").value) || 0,
    notes: document.getElementById("notes").value,
    color: document.getElementById("eventColor").value,
  };
  if (id) {
    shows[shows.findIndex((s) => s.id == id)] = data;
  } else {
    shows.push(data);
  }
  localStorage.setItem("shows", JSON.stringify(shows));
  closeModal("formModal");
  renderCalendar();
  checkAndNotify();
};

function editShow(id) {
  const s = shows.find((x) => x.id === id);
  closeModal("detailsModal");
  openFormModal();
  document.getElementById("editingId").value = s.id;
  document.getElementById("showDate").value = s.date;
  document.getElementById("artistName").value = s.artist;
  document.getElementById("venueName").value = s.venue;
  document.getElementById("startTime").value = s.startTime;
  document.getElementById("endTime").value = s.endTime;
  document.getElementById("showValue").value = s.value;
  document.getElementById("notes").value = s.notes;
  document.getElementById("nfDate").value = s.nfDate;
  document.getElementById("paymentDate").value = s.paymentDate;
  const colorEl = document.querySelector(
    `.color-option[data-color="${s.color}"]`,
  );
  selectEventColor(s.color, colorEl);
}

function deleteShow(id) {
  if (confirm("Excluir?")) {
    shows = shows.filter((s) => s.id !== id);
    localStorage.setItem("shows", JSON.stringify(shows));
    closeModal("detailsModal");
    renderCalendar();
  }
}

function renderColorPresets() {
  document.getElementById("colorPresets").innerHTML = PRESET_COLORS.map(
    (c) =>
      `<div class="color-option" style="background:${c}" data-color="${c}" onclick="selectEventColor('${c}', this)"></div>`,
  ).join("");
}

function selectEventColor(color, element) {
  document.getElementById("eventColor").value = color;
  document
    .querySelectorAll(".color-option")
    .forEach((el) => el.classList.remove("selected"));
  if (element) {
    element.classList.add("selected");
  } else {
    const found = document.querySelector(
      `.color-option[data-color="${color}"]`,
    );
    if (found) found.classList.add("selected");
  }
}

function checkAndNotify() {
  const todayStr = getLocalDateString();
  const c = shows.filter((s) => s.date === todayStr).length;
  if (c > 0) {
    const a = document.getElementById("dailyAlerts");
    a.innerText = `🔔 ${c} show(s) hoje!`;
    a.style.display = "block";
  }
}

function changeMonth(d) {
  viewDate.setMonth(viewDate.getMonth() + d);
  renderCalendar();
}
function goToToday() {
  viewDate = new Date();
  renderCalendar();
}
function requestNotificationPermission() {
  Notification.requestPermission();
}

function setupPWA() {
  let deferredPrompt;
  const installContainer = document.getElementById("installContainer");
  const installBtn = document.getElementById("installBtn");
  const iosModal = document.getElementById("iosInstallModal");
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone;
  if (isStandalone) {
    installContainer.style.display = "none";
    return;
  }
  const isIos =
    /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIos) {
    installContainer.classList.remove("hidden");
    installBtn.addEventListener("click", () => {
      iosModal.style.display = "flex";
    });
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installContainer.classList.remove("hidden");
  });
  installBtn.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        deferredPrompt = null;
        installContainer.classList.add("hidden");
      }
    }
  });
  window.addEventListener("appinstalled", () => {
    installContainer.classList.add("hidden");
    deferredPrompt = null;
  });
}

init();
