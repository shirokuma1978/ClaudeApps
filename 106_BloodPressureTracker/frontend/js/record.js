document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  if (path.includes("record_new")) {
    initNewForm();
  } else if (path.includes("record_detail")) {
    const id = params.get("id");
    if (!id) { window.location.href = "/"; return; }
    await initDetail(parseInt(id));
  }
});

// ── New Record ──────────────────────────────────────────────
function initNewForm() {
  document.getElementById("measured_date").value = todayStr();
  document.getElementById("time_slot").value = detectTimeSlot();

  document.getElementById("record-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const btn = document.getElementById("save-btn");
    btn.disabled = true;
    try {
      await createRecord(collectFormData());
      showToast("保存しました");
      setTimeout(() => window.location.href = "/", 500);
    } catch (err) {
      showToast(err.detail || "保存に失敗しました");
      btn.disabled = false;
    }
  });
}

// ── Detail / Edit ──────────────────────────────────────────
async function initDetail(id) {
  try {
    const record = await getRecord(id);
    renderDetail(record);

    document.getElementById("edit-btn").addEventListener("click", () => {
      showEditForm(record);
    });

    document.getElementById("delete-btn").addEventListener("click", async () => {
      if (!confirm("この記録を削除しますか？")) return;
      try {
        await deleteRecord(id);
        showToast("削除しました");
        setTimeout(() => window.location.href = "/", 500);
      } catch (err) {
        showToast(err.detail || "削除に失敗しました");
      }
    });
  } catch (err) {
    document.getElementById("detail-content").innerHTML =
      '<div class="empty-state"><p>記録が見つかりません</p></div>';
  }
}

function renderDetail(r) {
  const dateStr = formatDate(r.measured_date) + (r.time_slot ? `　${r.time_slot}` : "");
  const cat = getBPCategory(r.systolic, r.diastolic);

  const rows = [
    r.pulse ? { icon: "💓", label: "脈拍", value: `${r.pulse} 回/分` } : null,
    r.memo  ? { icon: "📝", label: "メモ", value: r.memo } : null,
  ].filter(Boolean);

  const rowsHtml = rows.map(row => `
    <div class="detail-row">
      <span class="detail-icon">${row.icon}</span>
      <div>
        <div class="detail-label">${row.label}</div>
        <div class="detail-value">${escHtml(row.value)}</div>
      </div>
    </div>`).join("");

  document.getElementById("detail-content").innerHTML = `
    <div class="detail-section">
      <div class="detail-date">${dateStr}</div>
      <div style="margin-bottom:8px"><span class="bp-badge ${cat.cls}">${cat.label}</span></div>
      <div class="detail-bp">${r.systolic}/${r.diastolic}</div>
      <div class="detail-bp-label">収縮期（上）/ 拡張期（下）mmHg</div>
      ${rowsHtml}
    </div>`;

  document.getElementById("action-btns").style.display = "flex";
}

function showEditForm(record) {
  document.getElementById("detail-content").style.display = "none";
  document.getElementById("action-btns").style.display = "none";

  const editSection = document.getElementById("edit-section");
  editSection.style.display = "block";
  editSection.innerHTML = buildFormHtml(record);

  document.getElementById("record-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const btn = document.getElementById("save-btn");
    btn.disabled = true;
    try {
      const updated = await updateRecord(record.id, collectFormData());
      showToast("更新しました");
      setTimeout(() => {
        editSection.style.display = "none";
        document.getElementById("detail-content").style.display = "block";
        document.getElementById("action-btns").style.display = "flex";
        renderDetail(updated);
      }, 500);
    } catch (err) {
      showToast(err.detail || "更新に失敗しました");
      btn.disabled = false;
    }
  });

  document.getElementById("cancel-btn").addEventListener("click", () => {
    editSection.style.display = "none";
    document.getElementById("detail-content").style.display = "block";
    document.getElementById("action-btns").style.display = "flex";
  });
}

function buildFormHtml(r) {
  return `
    <form id="record-form" class="detail-section">
      <div class="form-group">
        <label class="form-label">日付<span class="required">*</span></label>
        <input type="date" id="measured_date" class="form-control" value="${r.measured_date}" required>
      </div>
      <div class="form-group">
        <label class="form-label">時間帯</label>
        <select id="time_slot" class="form-control">
          <option value="">選択してください</option>
          <option value="朝" ${r.time_slot === "朝" ? "selected" : ""}>朝</option>
          <option value="夜" ${r.time_slot === "夜" ? "selected" : ""}>夜</option>
          <option value="その他" ${r.time_slot === "その他" ? "selected" : ""}>その他</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">収縮期（上）/ 拡張期（下）<span class="required">*</span></label>
        <div class="bp-input-row">
          <input type="number" id="systolic" class="form-control" value="${r.systolic}"
                 min="30" max="300" inputmode="numeric" required>
          <span class="bp-sep">/</span>
          <input type="number" id="diastolic" class="form-control" value="${r.diastolic}"
                 min="20" max="200" inputmode="numeric" required>
          <span class="bp-unit">mmHg</span>
        </div>
        <div id="bp-error" class="error-msg" style="display:none;"></div>
      </div>
      <div class="form-group">
        <label class="form-label">脈拍</label>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="number" id="pulse" class="form-control" value="${r.pulse ?? ""}"
                 min="20" max="300" inputmode="numeric" style="max-width:120px">
          <span class="bp-unit">回/分</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">メモ</label>
        <textarea id="memo" class="form-control" maxlength="500" rows="3">${escHtml(r.memo || "")}</textarea>
      </div>
      <div class="btn-row">
        <button type="button" id="cancel-btn" class="btn btn-secondary">キャンセル</button>
        <button type="submit" id="save-btn" class="btn btn-primary">保存</button>
      </div>
    </form>`;
}

// ── Shared helpers ────────────────────────────────────────
function collectFormData() {
  const pulseVal = document.getElementById("pulse").value;
  return {
    measured_date: document.getElementById("measured_date").value,
    time_slot: document.getElementById("time_slot").value || null,
    systolic: parseInt(document.getElementById("systolic").value),
    diastolic: parseInt(document.getElementById("diastolic").value),
    pulse: pulseVal !== "" ? parseInt(pulseVal) : null,
    memo: document.getElementById("memo").value.trim() || null,
  };
}

function validateForm() {
  let valid = true;
  const sysEl = document.getElementById("systolic");
  const diaEl = document.getElementById("diastolic");
  const dateEl = document.getElementById("measured_date");
  const errEl = document.getElementById("bp-error");

  [sysEl, diaEl, dateEl].forEach(el => el.classList.remove("error"));
  if (errEl) errEl.style.display = "none";

  if (!dateEl.value) {
    dateEl.classList.add("error");
    valid = false;
  }
  if (!sysEl.value || parseInt(sysEl.value) < 30 || parseInt(sysEl.value) > 300) {
    sysEl.classList.add("error");
    valid = false;
  }
  if (!diaEl.value || parseInt(diaEl.value) < 20 || parseInt(diaEl.value) > 200) {
    diaEl.classList.add("error");
    valid = false;
  }
  if (!valid && errEl) {
    errEl.textContent = "日付・血圧値を正しく入力してください";
    errEl.style.display = "block";
  }
  return valid;
}
