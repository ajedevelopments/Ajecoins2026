import { db } from "./firebase.js";
import { collection, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Helper: parse CSV simple
function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const headers = lines.shift().split(/\s*[,;]\s*/);
    return lines.map(line => {
        const values = line.split(/\s*[,;]\s*/);
        let obj = {};
        headers.forEach((h,i)=> obj[h.trim()]=values[i].trim());
        return obj;
    });
}

// ==== USUARIOS ====
const fileUsuarios = document.getElementById("fileUsuarios");
const uploadUsuarios = document.getElementById("uploadUsuarios");
const statusUsuarios = document.getElementById("statusUsuarios");
const listaUsuarios = document.getElementById("listaUsuarios");

uploadUsuarios.addEventListener("click", async () => {
    const file = fileUsuarios.files[0];
    if (!file) return alert("Selecciona un archivo CSV de usuarios.");
    statusUsuarios.textContent = "Cargando usuarios...";
    const text = await file.text();
    const data = parseCSV(text);

    for (const u of data) {
        await setDoc(doc(db, "usuarios", u.cedula), u);
    }

    statusUsuarios.textContent = `Usuarios subidos: ${data.length}`;
    mostrarUsuarios();
});

async function mostrarUsuarios() {
    const snapshot = await getDocs(collection(db, "usuarios"));
    listaUsuarios.innerHTML = `<p>Total: ${snapshot.size} usuarios</p>` + 
        Array.from(snapshot.docs).map(d=>JSON.stringify(d.data())).join("<br>");
}

// ==== PRODUCTOS ====
const fileProductos = document.getElementById("fileProductos");
const uploadProductos = document.getElementById("uploadProductos");
const statusProductos = document.getElementById("statusProductos");
const listaProductos = document.getElementById("listaProductos");

uploadProductos.addEventListener("click", async () => {
    const file = fileProductos.files[0];
    if (!file) return alert("Selecciona un archivo CSV de productos.");
    statusProductos.textContent = "Cargando productos...";
    const text = await file.text();
    const data = parseCSV(text);

    for (const p of data) {
        await setDoc(doc(db, "productos", p.productos), p);
    }

    statusProductos.textContent = `Productos subidos: ${data.length}`;
    mostrarProductos();
});

async function mostrarProductos() {
    const snapshot = await getDocs(collection(db, "productos"));
    listaProductos.innerHTML = `<p>Total: ${snapshot.size} productos</p>` +
        Array.from(snapshot.docs).map(d=>JSON.stringify(d.data())).join("<br>");
}

// ==== HISTORIAL CANJES ====
const listaCanjes = document.getElementById("listaCanjes");
const filtroFecha = document.getElementById("filtroFecha");
const filtrarCanjes = document.getElementById("filtrarCanjes");
const descargarCanjes = document.getElementById("descargarCanjes");

async function mostrarCanjes(fecha) {
    const snapshot = await getDocs(collection(db, "canjes"));
    let data = snapshot.docs.map(d=>d.data());
    if (fecha) data = data.filter(c => c.fecha === fecha);
    listaCanjes.innerHTML = data.map(d=>JSON.stringify(d)).join("<br>");
}

filtrarCanjes.addEventListener("click", () => {
    mostrarCanjes(filtroFecha.value);
});

descargarCanjes.addEventListener("click", () => {
    // Descarga CSV simple
    getDocs(collection(db, "canjes")).then(snapshot => {
        const rows = snapshot.docs.map(d=>d.data());
        const headers = Object.keys(rows[0] || {});
        let csv = [headers.join(",")].concat(rows.map(r=>headers.map(h=>r[h]).join(","))).join("\n");
        const blob = new Blob([csv], {type:"text/csv"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download="canjes.csv"; a.click();
        URL.revokeObjectURL(url);
    });
});

// Mostrar inicial
mostrarUsuarios();
mostrarProductos();
mostrarCanjes();
