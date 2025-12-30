import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// 🔹 Firebase config
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

const btn = document.getElementById("buscarBtn");
const mensaje = document.getElementById("mensaje");
const info = document.getElementById("infoUsuario");
const tablaBody = document.querySelector("#tablaHistorial tbody");

btn.addEventListener("click", async () => {
    const cedula = document.getElementById("cedulaInput").value.trim();

    mensaje.innerText = "";
    tablaBody.innerHTML = "";
    info.style.display = "none";

    if (!cedula) {
        mensaje.innerText = "⚠️ Ingresa una cédula válida";
        return;
    }

    // 🔹 Obtener usuario
    const userRef = doc(db, "usuarios", cedula);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        mensaje.innerText = "❌ Cédula no encontrada";
        return;
    }

    const userData = userSnap.data();
    document.getElementById("nombre").innerText = userData.nombre;
    document.getElementById("cedis").innerText = userData.cedis;

    // 🔹 Obtener movimientos
    const movSnap = await getDocs(
        collection(db, "usuarios", cedula, "movimientos")
    );

    let saldo = 0;

    movSnap.forEach(docu => {
        const d = docu.data();
        saldo = d.coins_actuales; // siempre queda el último saldo

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${d.fecha}</td>
            <td>${d.coins_ganados}</td>
            <td>${d.producto || "-"}</td>
            <td>${d.coins_canjeados}</td>
            <td>${d.coins_actuales}</td>
        `;
        tablaBody.appendChild(tr);
    });

    document.getElementById("coinsActuales").innerText = saldo;
    info.style.display = "block";
});
