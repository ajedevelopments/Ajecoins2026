// 🔹 Firebase SDK (modo web, compatible GitHub Pages)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// 🔹 Configuración Firebase (la tuya)
const firebaseConfig = {
    apiKey: "AIzaSyCsz2EP8IsTlG02uU2_GRfyQeeajMDuJjI",
    authDomain: "ajecoins-73829.firebaseapp.com",
    projectId: "ajecoins-73829",
    storageBucket: "ajecoins-73829.firebasestorage.app",
    messagingSenderId: "247461322350",
    appId: "1:247461322350:web:802185ad39249ca650507f"
};

// 🔹 Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔹 Leer CSV y guardar en Firestore
document.getElementById("fileInput").addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async function (event) {
        const text = event.target.result;
        const lines = text.split("\n");

        let contador = 0;

        // Empieza en 1 para saltar encabezado
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].trim();
            if (!row) continue;

            const cols = row.split(",");

            const fecha = cols[0];
            const cedula = cols[1];
            const nombre = cols[2];
            const cedis = cols[3];
            const coinsGanados = Number(cols[4]);

            if (!cedula || !fecha) continue;

            // 🔹 Ruta:
            // usuarios/{cedula}/movimientos/{fecha}
            const ref = doc(db, "usuarios", cedula, "movimientos", fecha);

            const existente = await getDoc(ref);

            let coinsActuales = coinsGanados;

            if (existente.exists()) {
                const prev = existente.data();
                coinsActuales = (prev.coins_actuales || 0) + coinsGanados;
            }

            await setDoc(ref, {
                fecha: fecha,
                cedula: cedula,
                nombre: nombre,
                cedis: cedis,
                coins_ganados: coinsGanados,
                producto: "",
                coins_canjeados: 0,
                coins_actuales: coinsActuales
            });

            contador++;
        }

        document.getElementById("status").innerText =
            `✅ Archivo cargado en Firebase. Registros procesados: ${contador}`;
    };

    reader.readAsText(file);
});
