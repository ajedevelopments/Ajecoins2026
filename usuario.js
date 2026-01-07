import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsz2EP8IsTlG02uU2_GRfyQeeajMDuJjI",
  authDomain: "ajecoins-73829.firebaseapp.com",
  projectId: "ajecoins-73829",
  storageBucket: "ajecoins-73829.firebasestorage.app",
  messagingSenderId: "247461322350",
  appId: "1:247261322350:web:802185ad39249ca650507f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- ELEMENTOS ----------
const loginCard   = document.getElementById('login');
const cuentaCard  = document.getElementById('cuenta');
const cedulaInput = document.getElementById('cedulaInput');
const ingresarBtn = document.getElementById('ingresarBtn');
const cerrarBtn   = document.getElementById('cerrarBtn');
const datosUl     = document.getElementById('datos');
const coinsP      = document.getElementById('coins');
const errorMsg    = document.getElementById('errorMsg');
const tiendaDiv   = document.getElementById('productosTienda');
const carritoList = document.getElementById('carritoList');
const bolsaSpan   = document.getElementById('bolsa');
const historialList = document.getElementById('historialList');

// ---------- VARIABLES ----------
let coinsUsuario = 0;
let carrito = [];
let userId = '';
let userCed = '';

// ---------- EVENTOS ----------
ingresarBtn.addEventListener('click', buscarUsuario);
cerrarBtn.addEventListener('click', () => location.reload());
document.getElementById('btnConfirmar').addEventListener('click', confirmarCompra);
document.getElementById('btnCancelar').addEventListener('click', cerrarModal);

// ---------- FUNCIONES ----------
async function buscarUsuario() {
  const ced = cedulaInput.value.trim();
  if (!ced) { errorMsg.textContent = 'Escribe tu cédula'; return; }

  const q = query(collection(db, 'usuarios'), where('cedula', '==', ced));
  const snap = await getDocs(q);

  if (snap.empty) {
    errorMsg.textContent = 'Cédula no encontrada';
    return;
  }

  const docSnap = snap.docs[0];
  userId = docSnap.id;
  userCed = ced; // <-- GUARDAMOS CÉDULA PRIMERO
  const user = docSnap.data();
  mostrarDatos(user);
  cargarHistorial(); // <-- AHORA SÍ TENEMOS CÉDULA
}

function mostrarDatos(u) {
  loginCard.classList.add('hidden');
  cuentaCard.classList.remove('hidden');

  datosUl.innerHTML = `
    <li><strong>Fecha:</strong> ${u.fecha}</li>
    <li><strong>Cédula:</strong> ${u.cedula}</li>
    <li><strong>Nombre:</strong> ${u.nombre}</li>
    <li><strong>Cedis:</strong> ${u.cedis}</li>
  `;

  coinsUsuario = u.coins_ganados;
  coinsP.textContent = coinsUsuario;
  cargarProductos();
}

async function cargarProductos() {
  tiendaDiv.innerHTML = '<div class="spinner"></div>';
  const snap = await get
