const API_BASE = "";

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { headers, ...options });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login.html";
    return;
  }
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw { status: res.status, detail: data.detail || "エラーが発生しました" };
  return data;
}

function getRecords() {
  return request("/records");
}

function getRecord(id) {
  return request(`/records/${id}`);
}

function createRecord(data) {
  return request("/records", { method: "POST", body: JSON.stringify(data) });
}

function updateRecord(id, data) {
  return request(`/records/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteRecord(id) {
  return request(`/records/${id}`, { method: "DELETE" });
}

function getMonthlySummary() {
  return request("/summary/monthly");
}

// ── Blood pressure category ───────────────────────────────────
function getBPCategory(systolic, diastolic) {
  if (systolic < 90 || diastolic < 60) {
    return { label: "低血圧", cls: "low" };
  }
  if (systolic >= 180 || diastolic >= 110) {
    return { label: "高血圧3度", cls: "high3" };
  }
  if (systolic >= 160 || diastolic >= 100) {
    return { label: "高血圧2度", cls: "high2" };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return { label: "高血圧1度", cls: "high1" };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return { label: "高値血圧", cls: "elevated" };
  }
  if (systolic >= 120) {
    return { label: "正常高値", cls: "elevated" };
  }
  return { label: "正常", cls: "normal" };
}

// ── Utilities ────────────────────────────────────────────────
function formatDateTime(dtStr) {
  if (!dtStr) return "";
  const d = new Date(dtStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}（${days[d.getDay()]}）${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function nowLocalStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d - offset).toISOString().slice(0, 16);
}

function showToast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2000);
}

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
