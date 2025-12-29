// =========================
// LOGIN
// =========================
function login() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  if (user === "admin" && pass === "admin123") {
    window.location.href = "admin.html";
    return;
  }

  if (user === pass && user !== "") {
    localStorage.setItem("usuario_actual", user);
    window.location.href = "usuario.html";
    return;
  }

  alert("Credenciales incorrectas");
}

// =========================
// ADMIN - PROCESAR EXCEL
// =========================
function procesarExcel() {
  const file = document.getElementById("excelFile").files[0];
  if (!file) {
    alert("Selecciona un Excel");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let baseCoins = {};

    rows.forEach(r => {
      const cedula = String(r.cedula);
      const coins = Number(r.coins_ganados);

      if (!baseCoins[cedula]) {
        baseCoins[cedula] = {
          cedula: cedula,
          vendedor: r.vendedor,
          cedis: r.cedis,
          coins_ganados: 0,
          coins_usados: 0,
          coins_actuales: 0,
          movimientos: []
        };
      }

      baseCoins[cedula].coins_ganados += coins;
      baseCoins[cedula].coins_actuales += coins;

      baseCoins[cedula].movimientos.push({
        fecha: r.fecha,
        coins: coins
      });
    });

    localStorage.setItem("baseCoins", JSON.stringify(baseCoins));
    document.getElementById("resultado").innerText =
      "Excel cargado correctamente ✅ (" + Object.keys(baseCoins).length + " usuarios)";
  };

  reader.readAsArrayBuffer(file);
}

// =========================
// USUARIO - MOSTRAR COINS
// =========================
const usuario = localStorage.getItem("usuario_actual");
const baseCoins = JSON.parse(localStorage.getItem("baseCoins")) || {};

if (usuario && baseCoins[usuario]) {
  const p = document.getElementById("coins");
  if (p) {
    p.innerText = "Coins actuales: " + baseCoins[usuario].coins_actuales;
  }
}

// =========================
// CANJEAR
// =========================
function canjear(valor) {
  if (!baseCoins[usuario] || baseCoins[usuario].coins_actuales < valor) {
    alert("No tienes coins suficientes");
    return;
  }

  baseCoins[usuario].coins_actuales -= valor;
  baseCoins[usuario].coins_usados += valor;

  baseCoins[usuario].movimientos.push({
    fecha: new Date().toISOString().split("T")[0],
    coins: -valor
  });

  localStorage.setItem("baseCoins", JSON.stringify(baseCoins));
  alert("Canje realizado con éxito 🪙");
  location.reload();
}
