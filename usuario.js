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
  try {
    const ced = String(document.getElementById("cedulaInput").value.trim());

    if (!ced) {
      alert("Ingrese la cédula");
      return;
    }

    userCedula = ced;

    /* ===== BUSCAR MOVIMIENTOS ===== */

    const movSnap = await getDocs(
      query(collection(db, "usuariosPorFecha"), where("cedula", "==", ced))
    );

    if (movSnap.empty) {
      alert("Cédula no existe");
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

    /* ===== BUSCAR COMPRAS ===== */

    const comprasSnap = await getDocs(
      query(collection(db, "compras"), where("cedula", "==", ced))
    );

    let totalGasto = 0;
    comprasSnap.forEach(doc => {
      totalGasto += Number(doc.data().total);
    });

    coinsUsuario = totalIngreso - totalGasto;

    /* ===== MOSTRAR DATOS ===== */

    document.getElementById("coins").textContent = coinsUsuario;

    document.getElementById("datos").innerHTML = `
      <li><b>${nombre}</b></li>
      <li>${ced}</li>
      <li>${cedis}</li>
      <li>${ultimaFecha}</li>
    `;

    await cargarProductos();
    await cargarHistorial();

  } catch (e) {
    console.error(e);
    alert("Error al iniciar sesión");
  }
});

/* ================= PRODUCTOS ================= */

async function cargarProductos() {
  const div = document.getElementById("productosTienda");
  div.innerHTML = "";

  const snap = await getDocs(collection(db, "productos"));

  snap.forEach(doc => {
    const p = doc.data();

    const card = document.createElement("div");
    card.className = "producto";

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
    ul.innerHTML += `<li>${p.nombre} - ${p.precio} coins</li>`;
  });

  document.getElementById("bolsa").textContent = total;
}

/* ================= CONFIRMAR COMPRA ================= */

document.getElementById("btnConfirmar").addEventListener("click", async () => {
  if (carrito.length === 0) return;

  const total = carrito.reduce((a, b) => a + b.precio, 0);

  if (total > coinsUsuario) {
    alert("Fondos insuficientes");
    return;
  }

  await addDoc(collection(db, "compras"), {
    cedula: userCedula,
    items: carrito,
    total: total,
    fecha: serverTimestamp()
  });

  carrito = [];
  renderCarrito();

  await recalcularSaldo();
  await cargarHistorial();
});

/* ================= RECALCULAR SALDO ================= */

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
    ul.innerHTML += `<li>Compra: ${c.total} coins</li>`;
  });
}
