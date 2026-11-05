document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "tro_bill_data_v1";

  // Elements
  const monthInput = document.getElementById("billMonth");
  const rentAmountInput = document.getElementById("rentAmount");
  const elecOldInput = document.getElementById("elecOld");
  const elecNewInput = document.getElementById("elecNew");
  const elecPriceInput = document.getElementById("elecPrice");
  const serviceFeeInput = document.getElementById("serviceFee");
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

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Mặc định ban đầu nếu truy cập lần đầu
  const defaultData = {
    billMonth: `${year}-${month}`,
    rentAmount: 5000000,
    elecOld: 1200,
    elecNew: 1350,
    elecPrice: 3500,
    serviceFee: 150000,
    bikeCount: 4,
    bikePrice: 100000,
    livingExpenses: [
      { id: 1, date: `${year}-${month}-05`, amount: 120000, desc: "Nước uống" },
      {
        id: 2,
        date: `${year}-${month}-12`,
        amount: 250000,
        desc: "Gia vị & Đồ dùng chung",
      },
    ],
    tenants: [
      { id: 1, name: "Lê Long Hồ", advance: 0, debt: 0 },
      { id: 2, name: "Huỳnh Nguyễn Trọng Phúc", advance: 0, debt: 0 },
      { id: 3, name: "Nguyễn Hồng Phong", advance: 0, debt: 0 },
      { id: 4, name: "Nguyễn Trung Tín", advance: 0, debt: 0 },
      { id: 5, name: "Huỳnh Thiên Bảo", advance: 0, debt: 0 },
    ],
  };

  let livingExpenses = [];
  let tenants = [];

  function formatVND(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  // Tải dữ liệu từ LocalStorage để khôi phục trạng thái cũ
  function loadSavedData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    let data = defaultData;

    if (saved) {
      try {
        data = JSON.parse(saved);
      } catch (e) {
        console.error("Không thể đọc dữ liệu lưu trữ:", e);
      }
    }

    if (monthInput) monthInput.value = data.billMonth || `${year}-${month}`;
    if (rentAmountInput) rentAmountInput.value = data.rentAmount ?? 5000000;
    if (elecOldInput) elecOldInput.value = data.elecOld ?? 1200;
    if (elecNewInput) elecNewInput.value = data.elecNew ?? 1350;
    if (elecPriceInput) elecPriceInput.value = data.elecPrice ?? 3500;
    if (serviceFeeInput) serviceFeeInput.value = data.serviceFee ?? 150000;
    if (bikeCountInput) bikeCountInput.value = data.bikeCount ?? 4;
    if (bikePriceInput) bikePriceInput.value = data.bikePrice ?? 100000;

    livingExpenses = data.livingExpenses || defaultData.livingExpenses;
    tenants = data.tenants || defaultData.tenants;
  }

  // Tự động lưu tất cả thông tin đã nhập vào LocalStorage
  function saveData() {
    const dataToSave = {
      billMonth: monthInput?.value || `${year}-${month}`,
      rentAmount: Number(rentAmountInput?.value) || 0,
      elecOld: Number(elecOldInput?.value) || 0,
      elecNew: Number(elecNewInput?.value) || 0,
      elecPrice: Number(elecPriceInput?.value) || 0,
      serviceFee: Number(serviceFeeInput?.value) || 0,
      bikeCount: Number(bikeCountInput?.value) || 0,
      bikePrice: Number(bikePriceInput?.value) || 0,
      livingExpenses,
      tenants,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }

  // Nội dung chuyển khoản cố định
  if (transferMemoEl) {
    transferMemoEl.textContent = "A13";
  }

  if (monthInput) {
    monthInput.addEventListener("change", () => {
      saveData();
    });
  }

  // Render danh sách chi phí sinh hoạt
  function renderLivingExpenses() {
    const container = document.getElementById("livingExpensesList");
    if (!container) return;
    container.innerHTML = "";

    livingExpenses.forEach((item) => {
      const row = document.createElement("div");
      row.className = "dynamic-item";
      row.innerHTML = `
        <input type="date" value="${item.date}" onchange="updateLivingItem(${item.id}, 'date', this.value)">
        <input type="text" placeholder="Khoản chi (vd: Nước, rác...)" value="${item.desc}" onchange="updateLivingItem(${item.id}, 'desc', this.value)">
        <input type="number" placeholder="Số tiền" value="${item.amount}" min="0" onchange="updateLivingItem(${item.id}, 'amount', this.value)">
        <button type="button" class="btn btn-danger" onclick="removeLivingItem(${item.id})" title="Xóa">✕</button>
      `;
      container.appendChild(row);
    });
  }

  // Render danh sách người thuê
  function renderTenants() {
    const container = document.getElementById("tenantsList");
    if (!container) return;
    container.innerHTML = "";

    tenants.forEach((tenant) => {
      const row = document.createElement("div");
      row.className = "dynamic-item";
      row.innerHTML = `
        <input type="text" placeholder="Họ & Tên" value="${tenant.name}" onchange="updateTenant(${tenant.id}, 'name', this.value)">
        <input type="number" placeholder="Tiền ứng trước" value="${tenant.advance}" min="0" onchange="updateTenant(${tenant.id}, 'advance', this.value)">
        <input type="number" placeholder="Tiền nợ" value="${tenant.debt}" min="0" onchange="updateTenant(${tenant.id}, 'debt', this.value)">
        <button type="button" class="btn btn-danger" onclick="removeTenant(${tenant.id})" title="Xóa">✕</button>
      `;
      container.appendChild(row);
    });
  }

  // Thêm/Xóa/Sửa Sinh hoạt
  window.updateLivingItem = (id, field, value) => {
    const item = livingExpenses.find((i) => i.id === id);
    if (item) {
      item[field] = field === "amount" ? Number(value) : value;
      calculateAll();
      saveData();
    }
  };

  window.removeLivingItem = (id) => {
    livingExpenses = livingExpenses.filter((i) => i.id !== id);
    renderLivingExpenses();
    calculateAll();
    saveData();
  };

  const addLivingBtn = document.getElementById("addLivingItemBtn");
  if (addLivingBtn) {
    addLivingBtn.addEventListener("click", () => {
      const newItem = {
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        desc: "",
        amount: 0,
      };
      livingExpenses.push(newItem);
      renderLivingExpenses();
      calculateAll();
      saveData();
    });
  }

  // Thêm/Xóa/Sửa Thành viên
  window.updateTenant = (id, field, value) => {
    const tenant = tenants.find((t) => t.id === id);
    if (tenant) {
      tenant[field] =
        field === "advance" || field === "debt" ? Number(value) : value;
      calculateAll();
      saveData();
    }
  };

  window.removeTenant = (id) => {
    tenants = tenants.filter((t) => t.id !== id);
    renderTenants();
    calculateAll();
    saveData();
  };

  const addTenantBtn = document.getElementById("addTenantBtn");
  if (addTenantBtn) {
    addTenantBtn.addEventListener("click", () => {
      const newTenant = {
        id: Date.now(),
        name: "",
        advance: 0,
        debt: 0,
      };
      tenants.push(newTenant);
      renderTenants();
      calculateAll();
      saveData();
    });
  }

  // Tính toán tổng hóa đơn
  function calculateAll() {
    const rentAmount = Number(rentAmountInput?.value) || 0;
    const elecOld = Number(elecOldInput?.value) || 0;
    const elecNew = Number(elecNewInput?.value) || 0;
    const elecPrice = Number(elecPriceInput?.value) || 0;
    const serviceFee = Number(serviceFeeInput?.value) || 0;
    const bikeCount = Number(bikeCountInput?.value) || 0;
    const bikePrice = Number(bikePriceInput?.value) || 0;

    const elecDiff = Math.max(0, elecNew - elecOld);
    const elecTotal = elecDiff * elecPrice;
    const bikeTotal = bikeCount * bikePrice;
    const rentTotal = rentAmount + elecTotal + serviceFee + bikeTotal;

    if (elecDiffEl) elecDiffEl.textContent = elecDiff;
    if (elecTotalEl) elecTotalEl.textContent = formatVND(elecTotal);
    if (bikeTotalEl) bikeTotalEl.textContent = formatVND(bikeTotal);
    if (rentTotalEl) rentTotalEl.textContent = formatVND(rentTotal);

    const livingTotal = livingExpenses.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );
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
        if (perPersonBaseEl)
          perPersonBaseEl.textContent = `${formatVND(baseShare)}/người`;

        tenants.forEach((t) => {
          const advance = Number(t.advance) || 0;
          const debt = Number(t.debt) || 0;
          const finalPayable = baseShare - advance + debt;

          const card = document.createElement("div");
          card.className = "breakdown-card";
          card.innerHTML = `
            <div class="breakdown-header">
              <span>${t.name || "Chưa nhập tên"}</span>
              <strong style="color: ${finalPayable >= 0 ? "#4f46e5" : "#10b981"}">
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
        perPersonBreakdownEl.innerHTML =
          "<p style='color: var(--text-muted); font-size: 0.85rem;'>Chưa có người thuê trọ nào.</p>";
      }
    }

    saveData();
  }

  // Lắng nghe sự thay đổi của tất cả các ô nhập liệu
  const inputsToListen = [
    rentAmountInput,
    elecOldInput,
    elecNewInput,
    elecPriceInput,
    serviceFeeInput,
    bikeCountInput,
    bikePriceInput,
  ];

  inputsToListen.forEach((input) => {
    if (input) {
      input.addEventListener("input", () => {
        calculateAll();
        saveData();
      });
    }
  });

  // Xuất file PDF (Chỉ chọn phần Tổng Hóa Đơn và Thông Tin Thanh Toán)
  const pdfBtn = document.getElementById("exportPdfBtn");
  if (pdfBtn) {
    pdfBtn.addEventListener("click", () => {
      const element = document.getElementById("exportSummaryArea");
      if (!element) return;
      if (typeof html2pdf === "undefined") {
        alert("Thư viện xuất PDF đang nạp, vui lòng thử lại sau vài giây.");
        return;
      }
      const monthVal = monthInput?.value || "hoa-don";
      const opt = {
        margin: 8,
        filename: `Tong_Hop_Hoa_Don_${monthVal}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      html2pdf().set(opt).from(element).save();
    });
  }

  // Xuất file Ảnh (PNG) (Chỉ chọn phần Tổng Hóa Đơn và Thông Tin Thanh Toán)
  const imgBtn = document.getElementById("exportImgBtn");
  if (imgBtn) {
    imgBtn.addEventListener("click", () => {
      const element = document.getElementById("exportSummaryArea");
      if (!element) return;
      if (typeof html2canvas === "undefined") {
        alert("Thư viện xuất ảnh đang nạp, vui lòng thử lại sau vài giây.");
        return;
      }
      const monthVal = monthInput?.value || "hoa-don";
      html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = `Tong_Hop_Hoa_Don_${monthVal}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    });
  }

  // Khởi chạy: Tải dữ liệu lưu trữ từ lần trước -> Render danh sách -> Tính toán
  loadSavedData();
  renderLivingExpenses();
  renderTenants();
  calculateAll();
});
