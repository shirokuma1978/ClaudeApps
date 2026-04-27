let cachedRecords = [];
let currentView = localStorage.getItem("bpView") || "card";

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;
  await loadSummary();
  await loadRecords();

  document.querySelectorAll(".view-btn").forEach(btn => {
    if (btn.dataset.view === currentView) btn.classList.add("active");
    else btn.classList.remove("active");

    btn.addEventListener("click", () => {
      currentView = btn.dataset.view;
      localStorage.setItem("bpView", currentView);
      document.querySelectorAll(".view-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.view === currentView)
      );
      renderList();
    });
  });
});

async function loadSummary() {
  try {
    const data = await getMonthlySummary();
    const el = document.getElementById("summary");
    if (!el) return;
    if (data.count === 0) {
      el.textContent = "今月の記録はまだありません";
      return;
    }
    const pulse = data.avg_pulse ? ` 脈拍 ${data.avg_pulse}` : "";
    el.textContent = `今月の平均: ${data.avg_systolic}/${data.avg_diastolic} mmHg${pulse}（${data.count}件）`;
  } catch (e) {
    console.error("summary error", e);
  }
}

async function loadRecords() {
  const list = document.getElementById("record-list");
  list.innerHTML = '<div class="loading">読み込み中...</div>';
  try {
    cachedRecords = await getRecords();
    renderList();
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>読み込みに失敗しました</p></div>';
  }
}

function renderList() {
  const list = document.getElementById("record-list");
  if (cachedRecords.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div style="font-size:48px">❤️</div>
        <p>まだ記録がありません</p>
        <p style="margin-top:4px;font-size:14px">右下の＋ボタンから記録しましょう</p>
      </div>`;
    return;
  }
  if (currentView === "table") {
    list.innerHTML = renderTable(cachedRecords);
    list.querySelectorAll("tr[data-id]").forEach(tr => {
      tr.addEventListener("click", () => {
        window.location.href = `/record_detail.html?id=${tr.dataset.id}`;
      });
    });
  } else if (currentView === "compact") {
    list.innerHTML = cachedRecords.map(r => recordCompact(r)).join("");
  } else {
    list.innerHTML = cachedRecords.map(r => recordCard(r)).join("");
  }
}

// ── カード表示 ────────────────────────────────────────────
function recordCard(r) {
  const dt = formatDateTime(r.measured_at);
  const cat = getBPCategory(r.systolic, r.diastolic);
  const pulse = r.pulse ? `脈拍 ${r.pulse}` : "";
  return `
    <a class="card" href="/record_detail.html?id=${r.id}">
      <div class="card-meta">
        ${dt}
        <span class="bp-badge ${cat.cls}">${cat.label}</span>
      </div>
      <div class="card-title">${r.systolic}/${r.diastolic} <span style="font-size:16px;font-weight:400;color:var(--muted)">mmHg</span></div>
      <div class="card-sub">${pulse}</div>
    </a>`;
}

// ── テーブル表示 ──────────────────────────────────────────
function renderTable(records) {
  const rows = records.map(r => {
    const d = new Date(r.measured_at);
    const dt = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    const cat = getBPCategory(r.systolic, r.diastolic);
    const pulse = r.pulse ?? "—";
    return `
      <tr data-id="${r.id}">
        <td class="td-dt">${dt}</td>
        <td class="td-bp">${r.systolic}</td>
        <td class="td-bp">${r.diastolic}</td>
        <td>${pulse}</td>
        <td><span class="bp-badge ${cat.cls}">${cat.label}</span></td>
      </tr>`;
  }).join("");
  return `
    <table class="bp-table">
      <thead>
        <tr>
          <th>日時</th>
          <th>上</th>
          <th>下</th>
          <th>脈拍</th>
          <th>判定</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── コンパクト表示 ────────────────────────────────────────
function recordCompact(r) {
  const d = new Date(r.measured_at);
  const dt = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  const cat = getBPCategory(r.systolic, r.diastolic);
  return `
    <a class="compact-card" href="/record_detail.html?id=${r.id}">
      <span class="compact-dt">${dt}</span>
      <span class="compact-bp">${r.systolic}/${r.diastolic} <span class="compact-unit">mmHg</span></span>
      <span class="bp-badge ${cat.cls}">${cat.label}</span>
    </a>`;
}
