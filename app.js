// NAVEGACIÓN
function irAdmin() {
  window.location.href = "admin.html";
}

function irUsuario() {
  window.location.href = "login.html";
}

// LOGIN USUARIO
function loginUsuario() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  if (user === pass && user !== "") {
    localStorage.setItem("usuario_actual", user);
    window.location.href = "usuario.html";
  } else {
    alert("Credenciales incorrectas");
  }
}

// ADMIN – PROCESAR EXCEL
function procesarExcel() {
  const file = document.getElementById("excelFile").files[0];
  if (!file) return alert("Selecciona un Excel");

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let base = {};
    rows.forEach(r => {
      base[r.cedula] = {
        coins_ganados: r.coins_ganados,
        coins_usados: 0,
        coins_actuales: r.coins_ganados
      };
    });

    localStorage.setItem("baseCoins", JSON.stringify(base));
    document.getElementById("resultado").innerText = "Excel cargado correctamente";
  };

  reader.readAsArrayBuffer(file);
}

// USUARIO – MOSTRAR COINS
const usuario = localStorage.getItem("usuario_actual");
const baseCoins = JSON.parse(localStorage.getItem("baseCoins")) || {};

if (usuario && baseCoins[usuario]) {
  const p = document.getElementById("coins");
  if (p) p.innerText = "Coins actuales: " + baseCoins[usuario].coins_actuales;
}

// CANJEAR
function canjear(valor, item) {
  if (!baseCoins[usuario] || baseCoins[usuario].coins_actuales < valor) {
    alert("No tienes coins suficientes");
    return;
  }

  baseCoins[usuario].coins_actuales -= valor;
  baseCoins[usuario].coins_usados += valor;
  localStorage.setItem("baseCoins", JSON.stringify(baseCoins));

  alert("Canje realizado: " + item);
  location.reload();
}
