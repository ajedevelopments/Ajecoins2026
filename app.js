// =====================
// LOGIN
// =====================
function login() {
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();

  if (user === "admin" && pass === "admin123") {
    window.location.href = "admin.html";
    return;
  }

  if (user !== "" && user === pass) {
    localStorage.setItem("usuario_actual", user);
    window.location.href = "usuario.html";
    return;
  }

  alert("Credenciales incorrectas");
}

// =====================
// ADMIN - PROCESAR EXCEL
// =====================
function procesarExcel() {
  const file = document.getElementById("excelFile").files[0];
  if (!file) {
    alert("Selecciona un archivo Excel");
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
        fecha: r.fecha,
        vendedor: r.vendedor,
        cedis: r.cedis,
        coins_ganados: r.coins_ganados,
        coins_usados: 0,
        coins_actuales: r.coins_ganados
      };
    });

    localStorage.setItem("baseCoins", JSON.stringify(baseCoins));

    mostrarTabla(rows);

    document.getElementById("resultado").innerText =
      "Excel cargado y visualizado correctamente";
  };

  reader.readAsArrayBuffer(file);
}

// =====================
// MOSTRAR TABLA
// =====================
function mostrarTabla(rows) {
  const thead = document.querySelector("#tablaExcel thead");
  const tbody = document.querySelector("#tablaExcel tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  let headerRow = "<tr>";
  headers.forEach(h => headerRow += `<th>${h}</th>`);
  headerRow += "</tr>";
  thead.innerHTML = headerRow;

  rows.forEach(row => {
    let tr = "<tr>";
    headers.forEach(h => tr += `<td>${row[h]}</td>`);
    tr += "</tr>";
    tbody.innerHTML += tr;
  });
}
