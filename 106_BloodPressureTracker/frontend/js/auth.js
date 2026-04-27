// ── Token management ─────────────────────────────────────────
function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
}

// ── Auth guard: call at top of every protected page ──────────
function requireAuth() {
  if (!getToken()) {
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

// ── Logout ───────────────────────────────────────────────────
function logout() {
  clearAuth();
  window.location.href = "/login.html";
}

// ── API calls ────────────────────────────────────────────────
async function register(name, email, password) {
  const res = await fetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, detail: data.detail || "登録に失敗しました" };
  setToken(data.access_token);
  localStorage.setItem("userName", data.user.name);
  return data;
}

async function login(email, password) {
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, detail: data.detail || "ログインに失敗しました" };
  setToken(data.access_token);
  localStorage.setItem("userName", data.user.name);
  return data;
}
