import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= FIREBASE ================= */

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

/* ================= VARIABLES ================= */

let userCedula = "";
let coinsUsuario = 0;
let carrito = [];

/* ================= LOGIN ================= */

document.getElementById("ingresarBtn").addEventListener("click", async () => {
  const ced = document.getElementById("cedulaInput").value.trim();
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.textContent = "";

  if (!ced) {
    errorMsg.textContent = "Ingresa la cédula";
    return;
  }

  userCedula = ced;

  // 🔍 Buscar movimientos
  const movSnap = await getDocs(
    query(collection(db, "usuariosPorFecha"), where("cedula", "==", ced))
  );

  if (movSnap.empty) {
    errorMsg.textContent = "Cédula no existe";
    return;
  }

  let totalIngreso = 0;
  let nombre = "";
  let cedis = "";
  let ultimaFecha = "";

  movSnap.forEach(doc => {
    const d = doc.data();
    totalIngreso += Number(d.coins_ganados);

    if (!ultimaFecha || d.fecha > ultimaFecha) {
      ultimaFecha = d.fecha;
      nombre = d.nombre;
      cedis = d.cedis;
    }
  });

  // 🧾 Buscar compras
  const comprasSnap = await getDocs(
    query(collection(db, "compras"), where("cedula", "==", ced))
  );

  let totalGasto = 0;
  comprasSnap.forEach(d => totalGasto += Number(d.data().total));

  coinsUsuario = totalIngreso - totalGasto;

  // 🔥 CAMBIO DE VISTA (ESTO ERA LO QUE FALTABA)
  document.getElementById("login").classList.add("hidden");
  document.getElementById("cuenta").classList.remove("hidden");

  // 🧾 Mostrar datos
  document.getElementById("coins").textContent = coinsUsuario;
  document.getElementById("datos").innerHTML = `
    <li><strong>Nombre:</strong> ${nombre}</li>
    <li><strong>Cédula:</strong> ${ced}</li>
    <li><strong>Cedis:</strong> ${cedis}</li>
    <li><strong>Última fecha:</strong> ${ultimaFecha}</li>
  `;

  cargarProductos();
  cargarHistorial();
});

/* ================= PRODUCTOS ================= */

async function cargarProductos() {
  const div = document.getElementById("productosTienda");
  div.innerHTML = "";

  const snap = await getDocs(collection(db, "productos"));
  snap.forEach(doc => {
    const p = doc.data();
    const card = document.createElement("div");
    card.className = "tarjeta";

    card.innerHTML = `
      <img src="assets/productos/${p.producto}.png">
      <h4>${p.producto}</h4>
      <b>${p.coins} coins</b>
      <button>Agregar</button>
    `;

    card.querySelector("button").onclick = () => agregarProducto(p.producto, p.coins);
    div.appendChild(card);
  });
}

/* ================= CARRITO ================= */

function agregarProducto(nombre, precio) {
  if (coinsUsuario < precio) {
    alert("Saldo insuficiente");
    return;
  }

  carrito.push({ nombre, precio });
  renderCarrito();
}

function renderCarrito() {
  const ul = document.getElementById("carritoList");
  ul.innerHTML = "";
  let total = 0;

  carrito.forEach(p => {
    total += p.precio;
    ul.innerHTML += `<li>${p.nombre} <span>${p.precio} c</span></li>`;
  });

  document.getElementById("bolsa").textContent = total;
}

/* ================= CONFIRMAR COMPRA ================= */

document.getElementById("btnConfirmar").addEventListener("click", async () => {
  if (!carrito.length) return;

  const total = carrito.reduce((a, b) => a + b.precio, 0);
  if (total > coinsUsuario) return alert("Fondos insuficientes");

  await addDoc(collection(db, "compras"), {
    cedula: userCedula,
    items: carrito,
    total,
    fecha: serverTimestamp()
  });

  carrito = [];
  renderCarrito();
  await recalcularSaldo();
  cargarHistorial();
});

/* ================= SALDO ================= */

async function recalcularSaldo() {
  const movSnap = await getDocs(
    query(collection(db, "usuariosPorFecha"), where("cedula", "==", userCedula))
  );

  let ingreso = 0;
  movSnap.forEach(d => ingreso += Number(d.data().coins_ganados));

  const comprasSnap = await getDocs(
    query(collection(db, "compras"), where("cedula", "==", userCedula))
  );

  let gasto = 0;
  comprasSnap.forEach(d => gasto += Number(d.data().total));

  coinsUsuario = ingreso - gasto;
  document.getElementById("coins").textContent = coinsUsuario;
}

/* ================= HISTORIAL ================= */

async function cargarHistorial() {
  const ul = document.getElementById("historialList");
  ul.innerHTML = "";

  const snap = await getDocs(
    query(collection(db, "compras"), where("cedula", "==", userCedula))
  );

  snap.forEach(doc => {
    const c = doc.data();
    ul.innerHTML += `<li>${c.total} coins</li>`;
  });
}
