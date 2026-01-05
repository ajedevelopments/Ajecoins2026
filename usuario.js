import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsz2EP8IsTlG02uU2_GRfyQeeajMDuJjI",
  authDomain: "ajecoins-73829.firebaseapp.com",
  projectId: "ajecoins-73829",
  storageBucket: "ajecoins-73829.appspot.com",
  messagingSenderId: "247461322350",
  appId: "1:247461322350:web:802185ad39249ca650507f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let usuarioActual = null;
let carrito = [];

// 🔐 Login
window.login = async function () {
  const cedula = document.getElementById("cedulaInput").value.trim();
  if (!cedula) return alert("Ingresa una cédula");

  const snapshot = await getDocs(collection(db, "usuarios"));
  const user = snapshot.docs.find(d => d.data().cedula === cedula)?.data();

  if (!user) return alert("Usuario no encontrado");

  usuarioActual = user;
  document.getElementById("login").style.display = "none";
  document.getElementById("userInfo").style.display = "block";
  document.getElementById("productos").style.display = "block";
  document.getElementById("carrito").style.display = "block";
  document.getElementById("historial").style.display = "block";

  document.getElementById("userNombre").textContent = user.nombre;
  document.getElementById("userCedula").textContent = user.cedula;
  document.getElementById("userCedis").textContent = user.cedis;
  document.getElementById("userCoins").textContent = user.coins_ganados;

  cargarProductos();
  cargarHistorial();
};

// 🛍️ Cargar productos
async function cargarProductos() {
  const snapshot = await getDocs(collection(db, "productos"));
  const list = document.getElementById("productosList");
  list.innerHTML = "";
  snapshot.forEach(doc => {
    const p = doc.data();
    const div = document.createElement("div");
    div.className = "producto";
    div.innerHTML = `
      <img src="assets/productos/${p.nombre}.png" alt="${p.nombre}" width="60">
      <strong>${p.nombre}</strong> - ${p.coins} coins
      <button onclick="agregarAlCarrito('${p.nombre}', ${p.coins})">+1</button>
    `;
    list.appendChild(div);
  });
}

// 🛒 Agregar al carrito
window.agregarAlCarrito = function (nombre, coins) {
  carrito.push({ nombre, coins });
  actualizarCarrito();
};

function actualizarCarrito() {
  const list = document.getElementById("carritoList");
  list.innerHTML = "";
  let total = 0;
  carrito.forEach((item, i) => {
    total += item.coins;
    const li = document.createElement("li");
    li.textContent = `${item.nombre} - ${item.coins} coins`;
    list.appendChild(li);
  });
}

// ✅ Solicitar productos
window.solicitarProductos = async function () {
  if (!carrito.length) return alert("Carrito vacío");
  const total = carrito.reduce((sum, i) => sum + i.coins, 0);
  if (total > usuarioActual.coins_ganados) return alert("No tienes coins suficientes");

  // 🔥 Guardar pedido
  await addDoc(collection(db, "pedidos"), {
    cedula: usuarioActual.cedula,
    nombre: usuarioActual.nombre,
    cedis: usuarioActual.cedis,
    productos: carrito.map(i => i.nombre),
    coins_gastados: total,
    fecha: new Date().toISOString().slice(0, 10)
  });

  // 🔁 Actualizar coins
  const newCoins = usuarioActual.coins_ganados - total;
  const userRef = doc(db, "usuarios", usuarioActual.cedula);
  await updateDoc(userRef, { coins_ganados: newCoins });

  usuarioActual.coins_ganados = newCoins;
  document.getElementById("userCoins").textContent = newCoins;

  carrito = [];
  actualizarCarrito();
  cargarHistorial();
  alert("✅ Solicitud enviada");
};

// 📦 Cargar historial
async function cargarHistorial() {
  const snapshot = await getDocs(collection(db, "pedidos"));
  const body = document.getElementById("historialBody");
  body.innerHTML = "";
  snapshot.forEach(doc => {
    const p = doc.data();
    if (p.cedula !== usuarioActual.cedula) return;
    const row = `<tr>
      <td>${p.fecha}</td>
      <td>${p.productos.join(", ")}</td>
      <td>${p.coins_gastados}</td>
    </tr>`;
    body.innerHTML += row;
  });
}
