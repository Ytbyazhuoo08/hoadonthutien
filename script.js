import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9lG6ue8sYdFaN7XFpCw_hoQl4D2E7cGM",
  authDomain: "ql-tro-f5938.firebaseapp.com",
  databaseURL: "https://ql-tro-f5938-default-rtdb.firebaseio.com",
  projectId: "ql-tro-f5938",
  storageBucket: "ql-tro-f5938.firebasestorage.app",
  messagingSenderId: "851461793361",
  appId: "1:851461793361:web:3b91f0d3314627ae177a70"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const DATA_REF = ref(db, "tro_bill_data");
const CONNECTED_REF = ref(db, ".info/connected");

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "tro_bill_data_v2";

  let isUnlocked = false;
  let currentEnteredPasscode = ""; // Lưu tạm mật khẩu người dùng vừa nhập ở máy này

  const monthInput = document.getElementById("billMonth");
  const rentAmountInput = document.getElementById("rentAmount");
  const elecOldInput = document.getElementById("elecOld");
  const elecNewInput = document.getElementById("elecNew");
  const elecPriceInput = document.getElementById("elecPrice");
  const serviceFeeInput = document.getElementById("serviceFee");
  const waterFeeInput = document.getElementById("waterFee");
  const bikeCountInput = document.getElementById("bikeCount");
  const bikePriceInput = document.getElementById("bikePrice");

  const elecDiffEl = document.getElementById("elecDiff");
  const elecTotalEl = document.getElementById("elecTotal");
  const bikeTotalEl = document.getElementById("bikeTotal");
  const rentTotalEl = document.getElementById("rentTotal");
  const livingTotalEl = document.getElementById("livingTotal");

  const summaryRentEl = document.getElementById("summaryRent");
  const summaryLivingEl = document.getElementById("summaryLiving");
  const grandTotalEl = document.getElementById("grandTotal");
  const perPersonBaseEl = document.getElementById("perPersonBase");
  const perPersonBreakdownEl = document.getElementById("perPersonBreakdown");
  const transferMemoEl = document.getElementById("transferMemo");

  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");
  const themeText = document.getElementById("themeText");

  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");

  const lockToggleBtn = document.getElementById("lockToggleBtn");
  const lockBtnText = document.getElementById("lockBtnText");
  const passcodeModal = document.getElementById("passcodeModal");
  const passcodeInput = document.getElementById("passcodeInput");
  const cancelPasscodeBtn = document.getElementById("cancelPasscodeBtn");
  const submitPasscodeBtn = document.getElementById("submitPasscodeBtn");

  const addLivingBtn = document.getElementById("addLivingItemBtn");
  const addTenantBtn = document.getElementById("addTenantBtn");

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const defaultData = {
    theme: "light",
    billMonth: `${year}-${month}`,
    rentAmount: 5000000,
    elecOld: 1200,
    elecNew: 1350,
    elecPrice: 3500,
    serviceFee: 150000,
    waterFee: 500000,
    bikeCount: 4,
    bikePrice: 100000,
    livingExpenses: [
      { id: 1, date: `${year}-${month}-05`, amount: 120000, desc: "Nước uống", payerId: 1 },
      { id: 2, date: `${year}-${month}-12`, amount: 250000, desc: "Gia vị & Đồ dùng chung", payerId: 2 }
    ],
    tenants: [
      { id: 1, name: "Lê Long Hồ", advance: 120000, debt: 0 },
      { id: 2, name: "Huỳnh Nguyễn Trọng Phúc", advance: 250000, debt: 0 },
      { id: 3, name: "Nguyễn Hồng Phong", advance: 0, debt: 0 },
      { id: 4, name: "Nguyễn Trung Tín", advance: 0, debt: 0 },
      { id: 5, name: "Huỳnh Thiên Bảo", advance: 0, debt: 0 }
    ]
  };

  let livingExpenses = [];
  let tenants = [];
  let isRemoteUpdate = false;

  function formatVND(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }

  function updateLockStateUI() {
    if (isUnlocked) {
      if (lockBtnText) lockBtnText.textContent = "Đã mở khóa";
      if (lockToggleBtn) lockToggleBtn.style.background = "#10b981";
      if (addLivingBtn) addLivingBtn.style.display = "inline-block";
      if (addTenantBtn) addTenantBtn.style.display = "inline-block";
    } else {
      if (lockBtnText) lockBtnText.textContent = "Mở khóa sửa";
      if (lockToggleBtn) lockToggleBtn.style.background = "#eab308";
      if (addLivingBtn) addLivingBtn.style.display = "none";
      if (addTenantBtn) addTenantBtn.style.display = "none";
    }

    const allInputs = document.querySelectorAll("input, select");
    allInputs.forEach((input) => {
      if (input.id !== "passcodeInput") {
        input.disabled = !isUnlocked;
      }
    });
  }

  if (lockToggleBtn) {
    lockToggleBtn.addEventListener("click", () => {
      if (isUnlocked) {
        isUnlocked = false;
        currentEnteredPasscode = "";
        updateLockStateUI();
      } else {
        if (passcodeInput) passcodeInput.value = "";
        if (passcodeModal) passcodeModal.style.display = "flex";
      }
    });
  }

  if (cancelPasscodeBtn) {
    cancelPasscodeBtn.addEventListener("click", () => {
      if (passcodeModal) passcodeModal.style.display = "none";
    });
  }

  if (submitPasscodeBtn) {
    submitPasscodeBtn.addEventListener("click", () => {
      const enteredPass = passcodeInput?.value || "";
      if (!enteredPass.trim()) {
        alert("Vui lòng nhập mật khẩu!");
        return;
      }
      currentEnteredPasscode = enteredPass;
      isUnlocked = true;
      updateLockStateUI();
      if (passcodeModal) passcodeModal.style.display = "none";
    });
  }

  onValue(CONNECTED_REF, (snap) => {
    if (snap.val() === true) {
      if (statusDot) statusDot.style.background = "#10b981";
      if (statusText) statusText.textContent = "Realtime Online";
    } else {
      if (statusDot) statusDot.style.background = "#ef4444";
      if (statusText) statusText.textContent = "Ngoại tuyến";
    }
  });

  function initTheme(savedTheme) {
    const isDark = savedTheme === "dark";
    if (isDark) {
      document.body.classList.add("dark-mode");
      if (themeIcon) themeIcon.textContent = "☀️";
      if (themeText) themeText.textContent = "Chế độ sáng";
    } else {
      document.body.classList.remove("dark-mode");
      if (themeIcon) themeIcon.textContent = "🌙";
      if (themeText) themeText.textContent = "Chế độ tối";
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-mode");
      if (themeIcon) themeIcon.textContent = isDark ? "☀️" : "🌙";
      if (themeText) themeText.textContent = isDark ? "Chế độ sáng" : "Chế độ tối";
      saveData();
    });
  }

  onValue(DATA_REF, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      isRemoteUpdate = true;
      applyDataToUI(data);
      isRemoteUpdate = false;
    } else {
      saveData();
    }
  });

  function applyDataToUI(data) {
    initTheme(data.theme || "light");

    setInputValue(monthInput, data.billMonth || `${year}-${month}`);
    setInputValue(rentAmountInput, data.rentAmount ?? 5000000);
    setInputValue(elecOldInput, data.elecOld ?? 1200);
    setInputValue(elecNewInput, data.elecNew ?? 1350);
    setInputValue(elecPriceInput, data.elecPrice ?? 3500);
    setInputValue(serviceFeeInput, data.serviceFee ?? 150000);
    setInputValue(waterFeeInput, data.waterFee ?? 500000);
    setInputValue(bikeCountInput, data.bikeCount ?? 4);
    setInputValue(bikePriceInput, data.bikePrice ?? 100000);

    livingExpenses = Array.isArray(data.livingExpenses)
      ? data.livingExpenses
      : data.livingExpenses
      ? Object.values(data.livingExpenses)
      : defaultData.livingExpenses;

    tenants = Array.isArray(data.tenants)
      ? data.tenants
      : data.tenants
      ? Object.values(data.tenants)
      : defaultData.tenants;

    autoUpdateTenantAdvances();
    renderLivingExpenses();
    renderTenants();
    calculateAll(false);
    updateLockStateUI();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function setInputValue(el, val) {
    if (el && document.activeElement !== el) {
      el.value = val;
    }
  }

  function saveData() {
    if (isRemoteUpdate || !isUnlocked) return;

    const dataToSave = {
      submittedPasscode: currentEnteredPasscode, // Đính kèm mật khẩu người dùng vừa nhập để Server xác thực
      theme: document.body.classList.contains("dark-mode") ? "dark" : "light",
      billMonth: monthInput?.value || `${year}-${month}`,
      rentAmount: Number(rentAmountInput?.value) || 0,
      elecOld: Number(elecOldInput?.value) || 0,
      elecNew: Number(elecNewInput?.value) || 0,
      elecPrice: Number(elecPriceInput?.value) || 0,
      serviceFee: Number(serviceFeeInput?.value) || 0,
      waterFee: Number(waterFeeInput?.value) || 0,
      bikeCount: Number(bikeCountInput?.value) || 0,
      bikePrice: Number(bikePriceInput?.value) || 0,
      livingExpenses,
      tenants
    };

    set(DATA_REF, dataToSave)
      .then(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      })
      .catch((err) => {
        console.error("Lỗi đồng bộ:", err);
        alert("⚠️ Mật khẩu phòng không đúng! Bạn không có quyền sửa hóa đơn này.");
        isUnlocked = false;
        currentEnteredPasscode = "";
        updateLockStateUI();
      });
  }

  if (transferMemoEl) transferMemoEl.textContent = "A13";
  if (monthInput) monthInput.addEventListener("change", () => saveData());

  function autoUpdateTenantAdvances() {
    tenants.forEach((tenant) => {
      const tenantTotalAdvance = livingExpenses
        .filter((item) => Number(item.payerId) === Number(tenant.id))
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      tenant.advance = tenantTotalAdvance;

      const advanceInput = document.querySelector(`input[data-advance-id="${tenant.id}"]`);
      if (advanceInput && document.activeElement !== advanceInput) {
        advanceInput.value = tenantTotalAdvance;
      }
    });
  }

  function renderLivingExpenses() {
    const container = document.getElementById("livingExpensesList");
    if (!container) return;
    container.innerHTML = "";

    livingExpenses.forEach((item) => {
      const row = document.createElement("div");
      row.className = "dynamic-item living-item";

      let tenantOptionsHtml = `<option value="">-- Người ứng tiền --</option>`;
      tenants.forEach((t) => {
        const selected = Number(item.payerId) === Number(t.id) ? "selected" : "";
        tenantOptionsHtml += `<option value="${t.id}" ${selected}>${t.name || "Chưa đặt tên"}</option>`;
      });

      row.innerHTML = `
        <div class="field-group date-field">
          <label class="mobile-label">Ngày chi</label>
          <input type="date" value="${item.date || ""}" ${!isUnlocked ? "disabled" : ""} onchange="window.updateLivingItem(${item.id}, 'date', this.value)">
        </div>
        <div class="field-group desc-field">
          <label class="mobile-label">Nội dung chi</label>
          <input type="text" placeholder="Khoản chi (vd: Nước, rác...)" value="${item.desc || ""}" ${!isUnlocked ? "disabled" : ""} onchange="window.updateLivingItem(${item.id}, 'desc', this.value)">
        </div>
        <div class="field-group amount-field">
          <label class="mobile-label">Số tiền (VNĐ)</label>
          <input type="number" placeholder="Số tiền" value="${item.amount || 0}" min="0" ${!isUnlocked ? "disabled" : ""} onchange="window.updateLivingItem(${item.id}, 'amount', this.value)">
        </div>
        <div class="field-group payer-field">
          <label class="mobile-label">Người ứng trước</label>
          <select ${!isUnlocked ? "disabled" : ""} onchange="window.updateLivingItem(${item.id}, 'payerId', this.value)">
            ${tenantOptionsHtml}
          </select>
        </div>
        ${isUnlocked ? `<button type="button" class="btn btn-danger" onclick="window.removeLivingItem(${item.id})" title="Xóa">✕</button>` : ""}
      `;
      container.appendChild(row);
    });
  }

  function renderTenants() {
    const container = document.getElementById("tenantsList");
    if (!container) return;
    container.innerHTML = "";

    tenants.forEach((tenant) => {
      const row = document.createElement("div");
      row.className = "dynamic-item tenant-item";
      row.innerHTML = `
        <div class="field-group name-field">
          <label class="mobile-label">Họ & Tên</label>
          <input type="text" placeholder="Họ & Tên" value="${tenant.name || ""}" ${!isUnlocked ? "disabled" : ""} onchange="window.updateTenant(${tenant.id}, 'name', this.value)">
        </div>
        <div class="field-group advance-field">
          <label class="mobile-label">Tiền ứng trước (Tự động)</label>
          <input type="number" data-advance-id="${tenant.id}" placeholder="Ứng trước" value="${tenant.advance || 0}" min="0" ${!isUnlocked ? "disabled" : ""} onchange="window.updateTenant(${tenant.id}, 'advance', this.value)">
        </div>
        <div class="field-group debt-field">
          <label class="mobile-label">Tiền nợ cũ</label>
          <input type="number" placeholder="Tiền nợ" value="${tenant.debt || 0}" min="0" ${!isUnlocked ? "disabled" : ""} onchange="window.updateTenant(${tenant.id}, 'debt', this.value)">
        </div>
        ${isUnlocked ? `<button type="button" class="btn btn-danger" onclick="window.removeTenant(${tenant.id})" title="Xóa người này">✕</button>` : ""}
      `;
      container.appendChild(row);
    });
  }

  window.updateLivingItem = (id, field, value) => {
    if (!isUnlocked) return;
    const item = livingExpenses.find((i) => i.id === id);
    if (item) {
      if (field === "amount" || field === "payerId") {
        item[field] = Number(value) || 0;
      } else {
        item[field] = value;
      }
      autoUpdateTenantAdvances();
      calculateAll(true);
    }
  };

  window.removeLivingItem = (id) => {
    if (!isUnlocked) return;
    livingExpenses = livingExpenses.filter((i) => i.id !== id);
    autoUpdateTenantAdvances();
    renderLivingExpenses();
    calculateAll(true);
  };

  if (addLivingBtn) {
    addLivingBtn.addEventListener("click", () => {
      if (!isUnlocked) return;
      const firstTenantId = tenants.length > 0 ? tenants[0].id : "";
      const newItem = {
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        desc: "",
        amount: 0,
        payerId: firstTenantId
      };
      livingExpenses.push(newItem);
      autoUpdateTenantAdvances();
      renderLivingExpenses();
      calculateAll(true);
    });
  }

  window.updateTenant = (id, field, value) => {
    if (!isUnlocked) return;
    const tenant = tenants.find((t) => t.id === id);
    if (tenant) {
      tenant[field] = field === "advance" || field === "debt" ? Number(value) : value;
      if (field === "name") renderLivingExpenses();
      calculateAll(true);
    }
  };

  window.removeTenant = (id) => {
    if (!isUnlocked) return;
    tenants = tenants.filter((t) => t.id !== id);
    autoUpdateTenantAdvances();
    renderTenants();
    renderLivingExpenses();
    calculateAll(true);
  };

  if (addTenantBtn) {
    addTenantBtn.addEventListener("click", () => {
      if (!isUnlocked) return;
      const newTenant = { id: Date.now(), name: "", advance: 0, debt: 0 };
      tenants.push(newTenant);
      renderTenants();
      renderLivingExpenses();
      calculateAll(true);
    });
  }

  function calculateAll(shouldSave = true) {
    const rentAmount = Number(rentAmountInput?.value) || 0;
    const elecOld = Number(elecOldInput?.value) || 0;
    const elecNew = Number(elecNewInput?.value) || 0;
    const elecPrice = Number(elecPriceInput?.value) || 0;
    const serviceFee = Number(serviceFeeInput?.value) || 0;
    const waterFee = Number(waterFeeInput?.value) || 0;
    const bikeCount = Number(bikeCountInput?.value) || 0;
    const bikePrice = Number(bikePriceInput?.value) || 0;

    const elecDiff = Math.max(0, elecNew - elecOld);
    const elecTotal = elecDiff * elecPrice;
    const bikeTotal = bikeCount * bikePrice;

    const rentTotal = rentAmount + elecTotal + serviceFee + waterFee + bikeTotal;

    if (elecDiffEl) elecDiffEl.textContent = elecDiff;
    if (elecTotalEl) elecTotalEl.textContent = formatVND(elecTotal);
    if (bikeTotalEl) bikeTotalEl.textContent = formatVND(bikeTotal);
    if (rentTotalEl) rentTotalEl.textContent = formatVND(rentTotal);

    const livingTotal = livingExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (livingTotalEl) livingTotalEl.textContent = formatVND(livingTotal);

    const grandTotal = rentTotal + livingTotal;
    if (summaryRentEl) summaryRentEl.textContent = formatVND(rentTotal);
    if (summaryLivingEl) summaryLivingEl.textContent = formatVND(livingTotal);
    if (grandTotalEl) grandTotalEl.textContent = formatVND(grandTotal);

    const tenantCount = tenants.length;
    if (perPersonBreakdownEl) {
      perPersonBreakdownEl.innerHTML = "";

      if (tenantCount > 0) {
        const baseShare = grandTotal / tenantCount;
        if (perPersonBaseEl) perPersonBaseEl.textContent = `${formatVND(baseShare)}/người`;

        tenants.forEach((t) => {
          const advance = Number(t.advance) || 0;
          const debt = Number(t.debt) || 0;
          const finalPayable = baseShare - advance + debt;

          const card = document.createElement("div");
          card.className = "breakdown-card";
          card.innerHTML = `
            <div class="breakdown-header">
              <span>${t.name || "Chưa nhập tên"}</span>
              <strong class="${finalPayable >= 0 ? "text-primary" : "text-success"}">
                ${formatVND(finalPayable)}
              </strong>
            </div>
            <div class="breakdown-details">
              Gốc: ${formatVND(baseShare)} 
              ${advance > 0 ? ` | Ứng: -${formatVND(advance)}` : ""} 
              ${debt > 0 ? ` | Nợ: +${formatVND(debt)}` : ""}
            </div>
          `;
          perPersonBreakdownEl.appendChild(card);
        });
      } else {
        if (perPersonBaseEl) perPersonBaseEl.textContent = "0 VNĐ/người";
        perPersonBreakdownEl.innerHTML = "<p style='color: var(--text-muted); font-size: 0.85rem;'>Chưa có người thuê trọ nào.</p>";
      }
    }

    if (shouldSave) saveData();
  }

  const inputsToListen = [
    rentAmountInput,
    elecOldInput,
    elecNewInput,
    elecPriceInput,
    serviceFeeInput,
    waterFeeInput,
    bikeCountInput,
    bikePriceInput
  ];

  inputsToListen.forEach((input) => {
    if (input) {
      input.addEventListener("input", () => calculateAll(true));
    }
  });

  const pdfBtn = document.getElementById("exportPdfBtn");
  if (pdfBtn) {
    pdfBtn.addEventListener("click", () => {
      const element = document.getElementById("exportSummaryArea");
      if (!element) return;
      if (typeof html2pdf === "undefined") {
        alert("Thư viện xuất PDF đang nạp, vui lòng thử lại sau giây lát.");
        return;
      }
      const monthVal = monthInput?.value || "hoa-don";
      const opt = {
        margin: 8,
        filename: `Tong_Hop_Hoa_Don_${monthVal}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };
      html2pdf().set(opt).from(element).save();
    });
  }

  const imgBtn = document.getElementById("exportImgBtn");
  if (imgBtn) {
    imgBtn.addEventListener("click", () => {
      const element = document.getElementById("exportSummaryArea");
      if (!element) return;
      if (typeof html2canvas === "undefined") {
        alert("Thư viện xuất ảnh đang nạp, vui lòng thử lại sau giây lát.");
        return;
      }
      const monthVal = monthInput?.value || "hoa-don";
      const isDark = document.body.classList.contains("dark-mode");
      html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: isDark ? "#1e293b" : "#f8fafc"
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = `Tong_Hop_Hoa_Don_${monthVal}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    });
  }
});
