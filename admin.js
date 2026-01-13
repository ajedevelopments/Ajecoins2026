import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, setDoc, doc, deleteDoc,
  query, where, addDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* =================== FIREBASE =================== */

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

/* =================== UTIL =================== */

function normalizarFecha(fecha){
  const [d,m,y] = fecha.split("/");
  return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
}

/* =================== CARGA CSV =================== */

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");

uploadBtn.addEventListener("click", async()=>{
  const file = fileInput.files[0];
  if(!file) return alert("Selecciona CSV");

  const text = await file.text();
  const lines = text.trim().split("\n").slice(1);

  let subidos = 0;

  for(const line of lines){
    const [fechaRaw, cedula, nombre, cedis, coins] = line.split(";").map(x=>x.trim());
    if(!fechaRaw || !cedula) continue;

    const fecha = normalizarFecha(fechaRaw);

    // ID único por día → NO SE BORRA JAMÁS
    const id = `${fecha}_${cedula}`;

    const ref = doc(db,"usuariosPorFecha",id);
    const snap = await getDocs(query(collection(db,"usuariosPorFecha"), where("__name__","==",id)));

    // Solo se escribe si NO existe (protege historia)
    if(snap.empty){
      await setDoc(ref,{
        fecha,
        cedula,
        nombre,
        cedis,
        coins_ganados: parseInt(coins,10),
        creado: Timestamp.now()
      });
      subidos++;
    }
  }

  alert(`Movimientos nuevos registrados: ${subidos}`);
  loadUsers();
});

/* =================== USUARIOS =================== */

const usersBody = document.querySelector("#usersTable tbody");

async function loadUsers(){
  usersBody.innerHTML = "";
  const snap = await getDocs(collection(db,"usuariosPorFecha"));
  snap.forEach(d=>{
    const u = d.data();
    usersBody.innerHTML += `
      <tr>
        <td>${u.fecha}</td>
        <td>${u.cedula}</td>
        <td>${u.nombre}</td>
        <td>${u.cedis}</td>
        <td>${u.coins_ganados}</td>
      </tr>`;
  });
}

/* =================== PRODUCTOS =================== */

const productFileInput = document.getElementById("productFileInput");
const uploadProductBtn = document.getElementById("uploadProductBtn");
const productsBody = document.querySelector("#productsTable tbody");

uploadProductBtn.addEventListener("click", async()=>{
  const file = productFileInput.files[0];
  if(!file) return alert("Selecciona CSV productos");

  const text = await file.text();
  const lines = text.trim().split("\n").slice(1);

  for(const line of lines){
    const [nombre, coins] = line.replace(/"/g,"").split(";");
    await setDoc(doc(db,"productos",nombre.trim()),{
      producto:nombre.trim(),
      coins:parseInt(coins.trim(),10)
    });
  }
  loadProducts();
});

async function loadProducts(){
  productsBody.innerHTML="";
  const snap = await getDocs(collection(db,"productos"));
  snap.forEach(d=>{
    const p=d.data();
    productsBody.innerHTML+=`
      <tr>
        <td>${p.producto}</td>
        <td><img src="assets/productos/${p.producto}.png" width="80"></td>
        <td>${p.coins}</td>
      </tr>`;
  });
}

/* =================== COMPRAS =================== */

async function registrarCompra(cedula,nombre,cedis,items,total){
  await addDoc(collection(db,"compras"),{
    cedula,nombre,cedis,items,total,
    fecha:Timestamp.now()
  });
}

/* =================== HISTORIAL =================== */

const comprasBody = document.querySelector("#comprasTable tbody");

async function loadCompras(){
  comprasBody.innerHTML="";
  const snap = await getDocs(collection(db,"compras"));
  snap.forEach(d=>{
    const c=d.data();
    comprasBody.innerHTML+=`
      <tr>
        <td>${c.fecha.toDate().toLocaleString()}</td>
        <td>${c.cedula}</td>
        <td>${c.nombre}</td>
        <td>${c.cedis}</td>
        <td>${c.items.map(i=>i.nombre).join(", ")}</td>
        <td>${c.total}</td>
      </tr>`;
  });
}

/* =================== SALDO REAL =================== */

async function calcularSaldo(cedula){
  let ingreso=0, gasto=0;

  const g1 = await getDocs(query(collection(db,"usuariosPorFecha"), where("cedula","==",cedula)));
  g1.forEach(d=>ingreso+=d.data().coins_ganados);

  const g2 = await getDocs(query(collection(db,"compras"), where("cedula","==",cedula)));
  g2.forEach(d=>gasto+=d.data().total);

  return ingreso-gasto;
}


/* =================== MOVIMIENTOS POR USUARIO =================== */

const movCedula = document.getElementById("movCedula");
const btnVerMov = document.getElementById("btnVerMov");
const movBody   = document.querySelector("#movTable tbody");

btnVerMov.addEventListener("click", async ()=>{
  const ced = movCedula.value.trim();
  if(!ced) return alert("Ingresa una cédula");

  movBody.innerHTML = "<tr><td colspan='5'>Cargando…</td></tr>";

  // 1. INGRESOS
  const ingresosSnap = await getDocs(
    query(collection(db,"usuariosPorFecha"), where("cedula","==",ced))
  );

  let movimientos = [];

  ingresosSnap.forEach(d=>{
    const u = d.data();
    movimientos.push({
      cedula: u.cedula,
      fecha: u.fecha,
      concepto: "Carga de coins",
      coins: u.coins_ganados,
      tipo: "ingreso"
    });
  });

  // 2. EGRESOS
  const comprasSnap = await getDocs(
    query(collection(db,"compras"), where("cedula","==",ced))
  );

  comprasSnap.forEach(d=>{
    const c = d.data();
    movimientos.push({
      cedula: c.cedula,
      fecha: c.fecha.toDate().toISOString().slice(0,10),
      concepto: c.items.map(i=>i.nombre).join(", "),
      coins: -c.total,
      tipo: "gasto"
    });
  });

  // 3. ORDENAR POR FECHA
  movimientos.sort((a,b)=> new Date(a.fecha) - new Date(b.fecha));

  // 4. CALCULAR SALDO
  let saldo = 0;
  movBody.innerHTML = "";

  for(const m of movimientos){
    saldo += m.coins;

    movBody.innerHTML += `
      <tr>
        <td>${m.cedula}</td>
        <td>${m.fecha}</td>
        <td>${m.concepto}</td>
        <td style="color:${m.coins>=0?'green':'red'}">${m.coins}</td>
        <td>${saldo}</td>
      </tr>
    `;
  }

  if(movimientos.length===0){
    movBody.innerHTML = "<tr><td colspan='5'>Sin movimientos</td></tr>";
  }
});


/* =================== INIT =================== */

loadUsers();
loadProducts();
loadCompras();

