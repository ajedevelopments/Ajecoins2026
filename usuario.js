import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ===== Firebase ===== */
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

/* ===== Variables ===== */
let userCedula = "";
let coinsUsuario = 0;
let carrito = [];

/* ===== Helpers ===== */
function el(id){
  return document.getElementById(id);
}

/* ===== LOGIN ===== */
el("ingresarBtn").addEventListener("click", async () => {
  try {
    const ced = String(el("cedulaInput").value.trim());

    if (!ced) {
      alert("Ingrese la cédula");
      return;
    }

    userCedula = ced;

    const movSnap = await getDocs(
      query(collection(db, "usuariosPorFecha"), where("cedula", "==", ced))
    );

    if (movSnap.empty) {
      alert("Cédula no existe");
      return;
    }

    let totalIngreso = 0;
    let nombre = "", cedis = "", ultimaFecha = "";

    movSnap.forEach(d => {
      const x = d.data();
      totalIngreso += Number(x.coins_ganados);

      if (!ultimaFecha || x.fecha > ultimaFecha) {
        ultimaFecha = x.fecha;
        nombre = x.nombre;
        cedis = x.cedis;
      }
    });

    const comprasSnap = await getDocs(
      query(collection(db, "compras"), where("cedula", "==", ced))
    );

    let totalGasto = 0;
    comprasSnap.forEach(d => totalGasto += Number(d.data().total));

    coinsUsuario = totalIngreso - totalGasto;

    if(el("coins")) el("coins").textContent = coinsUsuario;

    if(el("datos")){
      el("datos").innerHTML = `
        <li>${nombre}</li>
        <li>${ced}</li>
        <li>${cedis}</li>
        <li>${ultimaFecha}</li>
      `;
    }

    if(el("productosTienda")) cargarProductos();
    if(el("historialList")) cargarHistorial();

  } catch (e) {
    console.error(e);
    alert("Error al iniciar sesión");
  }
});

/* ===== Productos ===== */
async function cargarProductos(){
  const div = el("productosTienda");
  if(!div) return;

  div.innerHTML="";
  const snap = await getDocs(collection(db,"productos"));

  snap.forEach(d=>{
    const p=d.data();
    const card=document.createElement("div");
    card.innerHTML=`
      <img src="assets/productos/${p.producto}.png">
      <h4>${p.producto}</h4>
      <b>${p.coins} coins</b>
      <button>Agregar</button>
    `;
    card.querySelector("button").onclick=()=>agregarProducto(p.producto,p.coins);
    div.appendChild(card);
  });
}

/* ===== Carrito ===== */
function agregarProducto(nombre,precio){
  if(coinsUsuario<precio){
    alert("Saldo insuficiente");
    return;
  }
  carrito.push({nombre,precio});
  renderCarrito();
}

function renderCarrito(){
  const ul = el("carritoList");
  if(!ul) return;

  ul.innerHTML="";
  let total=0;
  carrito.forEach(i=>{
    total+=i.precio;
    ul.innerHTML+=`<li>${i.nombre} ${i.precio}</li>`;
  });

  if(el("bolsa")) el("bolsa").textContent=total;
}

/* ===== Historial ===== */
async function cargarHistorial(){
  const ul = el("historialList");
  if(!ul) return;

  ul.innerHTML="";
  const snap = await getDocs(
    query(collection(db,"compras"),where("cedula","==",userCedula))
  );
  snap.forEach(d=>{
    ul.innerHTML+=`<li>${d.data().total} coins</li>`;
  });
}
