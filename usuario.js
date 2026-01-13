import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs,
  addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= FIREBASE ================= */

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

/* ================= ELEMENTOS ================= */

const loginCard   = document.getElementById("login");
const cuentaCard  = document.getElementById("cuenta");
const cedulaInput = document.getElementById("cedulaInput");
const ingresarBtn = document.getElementById("ingresarBtn");
const cerrarBtn   = document.getElementById("cerrarBtn");
const datosUl     = document.getElementById("datos");
const coinsP      = document.getElementById("coins");
const errorMsg    = document.getElementById("errorMsg");
const tiendaDiv   = document.getElementById("productosTienda");
const carritoList = document.getElementById("carritoList");
const bolsaSpan   = document.getElementById("bolsa");
const historialList = document.getElementById("historialList");

const modal = document.getElementById("modalFin");
const resumenList = document.getElementById("resumenList");
const totalFin = document.getElementById("totalFin");
const btnConfirmar = document.getElementById("btnConfirmar");
const btnCancelar = document.getElementById("btnCancelar");
const loader = document.getElementById("loader");

/* ================= VARIABLES ================= */

let coinsUsuario = 0;
let carrito = [];
let userCed = "";
let procesando = false;

/* ================= UTIL ================= */

function mostrarLoader(estado){
  loader.classList.toggle("hidden", !estado);
}

function bloquearUI(estado){
  btnConfirmar.disabled = estado;
}

/* ================= EVENTOS ================= */

ingresarBtn.onclick = buscarUsuario;
cerrarBtn.onclick = () => location.reload();
btnConfirmar.onclick = confirmarCompra;
btnCancelar.onclick = () => modal.classList.add("hidden");

/* ================= LOGIN ================= */

async function buscarUsuario(){
  const ced = cedulaInput.value.trim();
  if(!ced){ errorMsg.textContent="Ingrese cédula"; return; }

  mostrarLoader(true);
  errorMsg.textContent="";

  try{
    const q = query(collection(db,"usuariosPorFecha"), where("cedula","==",ced));
    const snap = await getDocs(q);

    if(snap.empty){
      errorMsg.textContent="No existe";
      mostrarLoader(false);
      return;
    }

    let total=0, fecha="", nombre="", cedis="";
    snap.forEach(d=>{
      const data=d.data();
      total+=Number(data.coins_ganados);
      if(!fecha || new Date(data.fecha)>new Date(fecha)){
        fecha=data.fecha;
        nombre=data.nombre;
        cedis=data.cedis;
      }
    });

    const q2 = query(collection(db,"compras"), where("cedula","==",ced));
    const s2 = await getDocs(q2);
    let gastado=0;
    s2.forEach(d=>gastado+=Number(d.data().total));

    coinsUsuario = total - gastado;
    userCed = ced;

    mostrarDatos({fecha,nombre,cedis,cedula:ced,coins:coinsUsuario});
    await cargarProductos();
    await cargarHistorial();

  }catch(err){
    console.error(err);
    alert("Error de login");
  }

  mostrarLoader(false);
}

/* ================= UI ================= */

function mostrarDatos(u){
  loginCard.classList.add("hidden");
  cuentaCard.classList.remove("hidden");
  datosUl.innerHTML=`
    <li><b>Nombre:</b> ${u.nombre}</li>
    <li><b>Cédula:</b> ${u.cedula}</li>
    <li><b>Cedis:</b> ${u.cedis}</li>
    <li><b>Fecha:</b> ${u.fecha}</li>
  `;
  coinsP.textContent = u.coins;
}

/* ================= PRODUCTOS ================= */

async function cargarProductos(){
  tiendaDiv.innerHTML='<div class="spinner"></div>';
  const snap = await getDocs(collection(db,"productos"));
  tiendaDiv.innerHTML="";

  snap.forEach(d=>{
    const p=d.data();
    const div=document.createElement("div");
    div.className="tarjeta";
    div.innerHTML=`
      <img src="assets/productos/${p.producto}.png">
      <h4>${p.producto}</h4>
      <b>${p.coins} coins</b>
      <button>Agregar</button>
    `;
    div.querySelector("button").onclick=()=>agregar(p.producto,p.coins);
    tiendaDiv.appendChild(div);
  });
}

/* ================= CARRITO ================= */

function agregar(nombre,precio){
  if(precio > coinsUsuario) return alert("Saldo insuficiente");
  carrito.push({nombre,coins:precio});
  renderCarrito();
}

function renderCarrito(){
  carritoList.innerHTML="";
  let total=0;
  carrito.forEach(i=>{
    total+=i.coins;
    carritoList.innerHTML+=`<li>${i.nombre} <span>${i.coins}</span></li>`;
  });
  bolsaSpan.textContent=total;

  if(carrito.length && !document.getElementById("btnFin")){
    const b=document.createElement("button");
    b.id="btnFin";
    b.textContent="Finalizar compra";
    b.onclick=()=>abrirModal();
    carritoList.after(b);
  }
  if(!carrito.length){
    const b=document.getElementById("btnFin");
    if(b) b.remove();
  }
}

/* ================= MODAL ================= */

function abrirModal(){
  resumenList.innerHTML=carrito.map(i=>`<li>${i.nombre} - ${i.coins}</li>`).join("");
  const total=carrito.reduce((a,b)=>a+b.coins,0);
  totalFin.textContent=`Total: ${total} coins`;
  modal.classList.remove("hidden");
}

/* ================= HISTORIAL ================= */

async function cargarHistorial(){
  historialList.innerHTML="";
  const q=query(collection(db,"compras"), where("cedula","==",userCed));
  const snap=await getDocs(q);
  if(snap.empty){ historialList.innerHTML="<li>Sin compras</li>"; return; }
  snap.forEach(d=>{
    const c=d.data();
    historialList.innerHTML+=`<li>${c.total} coins</li>`;
  });
}

/* ================= COMPRA ================= */

async function confirmarCompra(){
  if(procesando) return;
  procesando=true;
  mostrarLoader(true);
  bloquearUI(true);

  try{
    const total=carrito.reduce((a,b)=>a+b.coins,0);

    if(total > coinsUsuario){
      alert("Saldo insuficiente");
      mostrarLoader(false);
      bloquearUI(false);
      return;
    }

    await addDoc(collection(db,"compras"),{
      cedula:userCed,
      items:carrito,
      total,
      fecha:serverTimestamp()
    });

    coinsUsuario -= total;
    coinsP.textContent = coinsUsuario;
    carrito=[];
    renderCarrito();
    modal.classList.add("hidden");
    await cargarHistorial();

  }catch(e){
    console.error(e);
    alert("Error al comprar");
  }

  mostrarLoader(false);
  bloquearUI(false);
  procesando=false;
}
