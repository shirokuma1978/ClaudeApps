let allRecords = [];
let chart = null;
let activeDays = 14;

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;

  try {
    allRecords = await getRecords();
    renderChart(activeDays);
  } catch (e) {
    console.error(e);
  }

  document.querySelectorAll(".period-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".period-btn").forEach(b => {
        b.className = "period-btn btn btn-secondary";
      });
      btn.className = "period-btn btn btn-primary";
      activeDays = parseInt(btn.dataset.days);
      renderChart(activeDays);
    });
  });
});

function renderChart(days) {
  const records = filterRecords(allRecords, days);

  if (records.length === 0) {
    if (chart) { chart.destroy(); chart = null; }
    document.getElementById("stats-section").style.display = "none";
    return;
  }

  // 日付順に並べる
  const sorted = [...records].sort((a, b) => a.measured_date.localeCompare(b.measured_date));

  const labels = sorted.map(r => {
    const d = new Date(r.measured_date + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}${r.time_slot ? " " + r.time_slot : ""}`;
  });

  const systolicData = sorted.map(r => r.systolic);
  const diastolicData = sorted.map(r => r.diastolic);
  const pulseData = sorted.map(r => r.pulse ?? null);

  const ctx = document.getElementById("bp-chart").getContext("2d");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "収縮期（上）",
          data: systolicData,
          borderColor: "#C62828",
          backgroundColor: "rgba(198,40,40,0.08)",
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: "#C62828",
          tension: 0.3,
          fill: false,
        },
        {
          label: "拡張期（下）",
          data: diastolicData,
          borderColor: "#1565C0",
          backgroundColor: "rgba(21,101,192,0.08)",
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: "#1565C0",
          tension: 0.3,
          fill: false,
        },
        {
          label: "脈拍",
          data: pulseData,
          borderColor: "#2E7D32",
          backgroundColor: "rgba(46,125,50,0.08)",
          borderWidth: 1.5,
          pointRadius: 3,
          pointBackgroundColor: "#2E7D32",
          tension: 0.3,
          fill: false,
          borderDash: [4, 4],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        annotation: {},
      },
      scales: {
        x: {
          ticks: { font: { size: 11 }, maxRotation: 45 },
          grid: { color: "rgba(0,0,0,0.05)" },
        },
        y: {
          min: 40,
          ticks: { font: { size: 11 } },
          grid: { color: "rgba(0,0,0,0.07)" },
        },
      },
    },
  });

  renderStats(sorted);
}

function filterRecords(records, days) {
  if (days === 0) return records;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return records.filter(r => r.measured_date >= cutoffStr);
}

function renderStats(sorted) {
  const section = document.getElementById("stats-section");
  const content = document.getElementById("stats-content");

  const count = sorted.length;
  const avgSys = (sorted.reduce((s, r) => s + r.systolic, 0) / count).toFixed(1);
  const avgDia = (sorted.reduce((s, r) => s + r.diastolic, 0) / count).toFixed(1);
  const maxSys = Math.max(...sorted.map(r => r.systolic));
  const minSys = Math.min(...sorted.map(r => r.systolic));
  const pulses = sorted.filter(r => r.pulse).map(r => r.pulse);
  const avgPulse = pulses.length ? (pulses.reduce((s, v) => s + v, 0) / pulses.length).toFixed(1) : null;

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div>
        <div class="detail-label">平均血圧</div>
        <div class="detail-value" style="font-size:20px;font-weight:700">${avgSys}/${avgDia}</div>
        <div style="font-size:12px;color:var(--muted)">mmHg</div>
      </div>
      <div>
        <div class="detail-label">記録件数</div>
        <div class="detail-value" style="font-size:20px;font-weight:700">${count}件</div>
      </div>
      <div>
        <div class="detail-label">収縮期 最高/最低</div>
        <div class="detail-value">${maxSys} / ${minSys} mmHg</div>
      </div>
      ${avgPulse ? `<div>
        <div class="detail-label">平均脈拍</div>
        <div class="detail-value">${avgPulse} 回/分</div>
      </div>` : ""}
    </div>`;

  section.style.display = "block";
}
