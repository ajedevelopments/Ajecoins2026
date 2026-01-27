import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, setDoc, doc, deleteDoc,
  query, where, Timestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsz2EP8IsTlG02uU2_GRfyQeeajMDuJjI",
  authDomain: "ajecoins-73829.firebaseapp.com",
  projectId: "ajecoins-73829",
  storageBucket: "ajecoins-73829.firebasestorage.app",
  messagingSenderId: "247461322350",
  appId: "1:247461322350:web:802185ad39249ca650507f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =================== ELIMINAR TODO EL RASTRO =================== */
window.eliminarUsuarioTotal = async (codVendedor) => {
  if (!confirm(`⚠️ ¡ATENCIÓN! Se eliminará el acceso y todos los coins del vendedor ${codVendedor}. ¿Continuar?`)) return;

  try {
    // 1. Borrar credenciales (Acceso)
    await deleteDoc(doc(db, "credenciales", codVendedor));

    // 2. Borrar todas sus cargas de coins
    const snapCargas = await getDocs(query(collection(db, "usuariosPorFecha"), where("codVendedor", "==", codVendedor)));
    for (const d of snapCargas.docs) {
      await deleteDoc(doc(db, "usuariosPorFecha", d.id));
    }

    alert(`Vendedor ${codVendedor} ha sido eliminado del sistema.`);
    loadUsers(); // Recargar tablas
  } catch (err) {
    alert("Error al eliminar el usuario.");
  }
};

/* =================== UTILIDADES =================== */
function normalizarFecha(fecha) {
  if (fecha.includes("-")) return fecha;
  const [d, m, y] = fecha.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function descargarCSV(nombre, filas) {
  const csv = filas.map(f => f.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
}

/* =================== CARGA DE DATOS =================== */
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");

uploadBtn.onclick = async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Selecciona CSV");
  const text = await file.text();
  const lines = text.trim().split("\n").slice(1);
  let subidos = 0;
  for (const line of lines) {
    const [fechaRaw, codVendedor, nombre, cedis, coins] = line.split(";").map(x => x.trim());
    if (!fechaRaw || !codVendedor) continue;
    const fecha = normalizarFecha(fechaRaw);
    await setDoc(doc(db, "usuariosPorFecha", `${fecha}_${codVendedor}`), {
      fecha, codVendedor, nombre, cedis, coins_ganados: Number(coins), creado: Timestamp.now()
    }, { merge: true });
    subidos++;
  }
  alert(`Registros cargados: ${subidos}`);
  loadUsers();
};

/* =================== RENDERIZADO DE TABLAS =================== */
const usersBody = document.querySelector("#usersTable tbody");
const maestraBody = document.getElementById("maestraBody");
let cacheUsuarios = [];

async function loadUsers() {
  usersBody.innerHTML = "";
  maestraBody.innerHTML = "";
  cacheUsuarios = [];
  const snap = await getDocs(collection(db, "usuariosPorFecha"));
  snap.forEach(d => cacheUsuarios.push(d.data()));
  renderCargas(cacheUsuarios);
  renderListaMaestra(cacheUsuarios);
}

// Tabla 1: Lista Maestra Única para gestión
function renderListaMaestra(lista) {
  maestraBody.innerHTML = "";
  const unicos = {};
  lista.forEach(u => { if(!unicos[u.codVendedor]) unicos[u.codVendedor] = u; });

  Object.values(unicos).forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${u.codVendedor}</strong></td>
      <td>${u.nombre}</td>
      <td>${u.cedis}</td>
      <td><button class="btn-eliminar" onclick="eliminarUsuarioTotal('${u.codVendedor}')">Eliminar Todo</button></td>`;
    maestraBody.appendChild(tr);
  });
}

// Tabla 2: Historial detallado de todas las cargas
function renderCargas(lista) {
  usersBody.innerHTML = "";
  lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
  lista.forEach(u => {
    usersBody.innerHTML += `<tr><td>${u.fecha}</td><td>${u.codVendedor}</td><td>${u.nombre}</td><td>${u.coins_ganados}</td></tr>`;
  });
}

/* =================== PRODUCTOS Y COMPRAS (SIN CAMBIOS) =================== */
const productFileInput = document.getElementById("productFileInput");
const uploadProductBtn = document.getElementById("uploadProductBtn");
const productsBody = document.querySelector("#productsTable tbody");

uploadProductBtn.onclick = async () => {
  const file = productFileInput.files[0];
  if (!file) return alert("Selecciona CSV productos");
  const text = await file.text();
  const lines = text.trim().split("\n").slice(1);
  for (const line of lines) {
    const [nombre, coins] = line.replace(/"/g, "").split(";");
    await setDoc(doc(db, "productos", nombre.trim()), { producto: nombre.trim(), coins: Number(coins) });
  }
  loadProducts();
};

async function loadProducts() {
  productsBody.innerHTML = "";
  const snap = await getDocs(collection(db, "productos"));
  snap.forEach(d => {
    const p = d.data();
    productsBody.innerHTML += `<tr><td>${p.producto}</td><td><img src="assets/productos/${p.producto}.png" width="40"></td><td>${p.coins}</td></tr>`;
  });
}

const comprasBody = document.querySelector("#comprasTable tbody");
async function loadCompras() {
  comprasBody.innerHTML = "";
  const snap = await getDocs(collection(db, "compras"));
  const lista = [];
  snap.forEach(d => lista.push(d.data()));
  lista.sort((a, b) => a.fecha.toMillis() - b.fecha.toMillis());
  lista.forEach(c => {
    comprasBody.innerHTML += `<tr><td>${c.fecha.toDate().toLocaleString()}</td><td>${c.codVendedor}</td><td>${c.nombre}</td><td>${c.items.map(i => i.nombre).join(", ")}</td><td>${c.total}</td></tr>`;
  });
}

/* =================== CONSULTA MOVIMIENTOS =================== */
const movBody = document.querySelector("#movTable tbody");
document.getElementById("btnVerMov").onclick = async () => {
  const cod = document.getElementById("movCedula").value.trim();
  if(!cod) return;
  const mov = await obtenerMovimientos(cod);
  renderMov(mov);
};

async function obtenerMovimientos(cod) {
  let mov = []; let saldo = 0;
  const ing = await getDocs(query(collection(db, "usuariosPorFecha"), where("codVendedor", "==", cod)));
  ing.forEach(d => { const u = d.data(); mov.push({ cod: u.codVendedor, nom: u.nombre, fec: u.fecha, con: "Carga", cns: u.coins_ganados }); });
  const com = await getDocs(query(collection(db, "compras"), where("codVendedor", "==", cod)));
  com.forEach(d => { const c = d.data(); mov.push({ cod: c.codVendedor, nom: c.nombre, fec: c.fecha.toDate().toISOString().slice(0, 10), con: "Canje", cns: -c.total }); });
  mov.sort((a, b) => new Date(a.fec) - new Date(b.fec));
  mov.forEach(m => { saldo += m.cns; m.sld = saldo; });
  return mov;
}

function renderMov(lista) {
  movBody.innerHTML = lista.map(m => `<tr><td>${m.cod}</td><td>${m.nom}</td><td>${m.fec}</td><td>${m.con}</td><td style="color:${m.cns>=0?'green':'red'}">${m.cns}</td><td>${m.sld}</td></tr>`).join('');
}

// Inicialización
loadUsers();
loadProducts();
loadCompras();
