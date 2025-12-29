// LOGIN ADMIN
function loginAdmin() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  if (user === "admin" && pass === "admin123") {
    window.location.href = "admin.html";
  } else {
    alert("Credenciales admin incorrectas");
  }
}

// LOGIN USUARIO
function loginUsuario() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  const baseCoins = JSON.parse(localStorage.getItem("baseCoins")) || {};

  if (user === pass && baseCoins[user]) {
    localStorage.setItem("usuario_actual", user);
    window.location.href = "usuario.html";
  } else {
    alert("Usuario no existe o credenciales incorrectas");
  }
}

// PROCESAR EXCEL
function procesarExcel() {
  const file = document.getElementById("excelFile").files[0];
  if (!file) return alert("Selecciona un Excel");

  const reader = new FileReader();
  reader.onload = e => {
    const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

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
