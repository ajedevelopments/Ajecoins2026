// ======================
// NAVEGACIÓN
// ======================
function irAdmin() {
  window.location.href = "/AJECOINS/admin.html";
}

function irUsuario() {
  window.location.href = "/AJECOINS/login.html";
}

// ======================
// LOGIN USUARIO
// ======================
function loginUsuario() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  if (user !== "" && user === pass) {
    localStorage.setItem("usuario_actual", user);
    window.location.href = "/AJECOINS/usuario.html";
  } else {
    alert("Credenciales incorrectas");
  }
}

// ======================
// ADMIN - PROCESAR EXCEL
// Columnas esperadas:
// fecha | cedula | vendedor | cedis | coins_ganados
// ======================
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
      baseCoins[r.cedula] = {
        cedula: r.cedula,
        vendedor: r.vendedor,
        cedis: r.cedis,
        coins_ganados: r.coins_ganados,
        coins_usados: 0,
        coins_actuales: r.coins_ganados,
        fecha: r.fecha
      };
    });

    localStorage.setItem("baseCoins", JSON.stringify(baseCoins));
    document.getElementById("resultado").innerText = "Excel cargado correctamente";
  };

  reader.readAsArrayBuffer(file);
}

// ======================
// MOSTRAR COINS USUARIO
// ======================
const usuario = localStorage.getItem("usuario_actual");
const baseCoins = JSON.parse(localStorage.getItem("baseCoins")) || {};

if (usuario && baseCoins[usuario]) {
  const p = document.getElementById("coins");
  if (p) {
    p.innerText = "Coins actuales: " + baseCoins[usuario].coins_actuales;
  }
}

// ======================
// CANJEAR
// ======================
function canjear(valor) {
  if (!baseCoins[usuario] || baseCoins[usuario].coins_actuales < valor) {
    alert("No tienes coins suficientes");
    return;
  }

  baseCoins[usuario].coins_actuales -= valor;
  baseCoins[usuario].coins_usados += valor;

  localStorage.setItem("baseCoins", JSON.stringify(baseCoins));
  alert("Canje exitoso");
  location.reload();
}
