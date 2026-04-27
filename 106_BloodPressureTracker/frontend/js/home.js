document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;
  await loadSummary();
  await loadRecords();
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
    const records = await getRecords();
    if (records.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div style="font-size:48px">❤️</div>
          <p>まだ記録がありません</p>
          <p style="margin-top:4px;font-size:14px">右下の＋ボタンから記録しましょう</p>
        </div>`;
      return;
    }
    list.innerHTML = records.map(r => recordCard(r)).join("");
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>読み込みに失敗しました</p></div>';
  }
}

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
