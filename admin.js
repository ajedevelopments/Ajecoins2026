/* ============================================================
   ADMIN.JS - CONEXIÓN CON GOOGLE SHEETS (PUENTE API)
   Versión: Flexible (Masivo/Individual) con Colores y Saldos
   ============================================================ */

const URL_API = "https://script.google.com/macros/s/AKfycbynec0w_hcPGN8QvthkjYxEFqKXEdSR3SdVfpJbSO-J5aLKTK8QMcDwB_9475oQvmHCpw/exec";

/* --- 1. UTILIDADES --- */
const showLoader = (t) => { 
    const txt = document.getElementById("loaderText");
    const ldr = document.getElementById("loader");
    if(txt) txt.innerText = t; 
    if(ldr) ldr.classList.add("active"); 
};
const hideLoader = () => {
    const ldr = document.getElementById("loader");
    if(ldr) ldr.classList.remove("active");
};

// Función para limpiar fechas y quitar la hora
function formatearFecha(f) {
    if(!f) return "";
    let fechaStr = f.toString();
    // Si viene formato ISO "2026-02-01T05:00:00.000Z", toma solo la fecha
    if(fechaStr.includes("T")) return fechaStr.split("T")[0];
    return fechaStr;
}

function limpiarTexto(t) {
    if(!t) return "";
    return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

const SEDES = ["AMBATO","CHONE","CUENCA","GUAYAQUIL NORTE","GUAYAQUIL SUR","MACHALA","MANTA","MAYORISTA GUAYAQUIL","QUITO NORTE","QUITO SUR","RIOBAMBA","SANTO DOMINGO","ECONORED COSTA AUSTRO","ECONORED SIERRA","ECONORED COSTA NORTE"];

window.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('filtroCedisMaestra');
    if(select) {
        SEDES.sort().forEach(s => {
            const opt = document.createElement('option');
            opt.value = s; opt.textContent = s;
            select.appendChild(opt);
        });
    }
});

/* --- 2. LÓGICA DE ACORDEONES --- */
document.querySelectorAll('.accordion-header').forEach(btn => {
    btn.onclick = () => {
        const content = btn.nextElementSibling;
        const isOpen = content.style.display === 'block';
        document.querySelectorAll('.accordion-content').forEach(c => c.style.display = 'none');
        document.querySelectorAll('.accordion-header span').forEach(s => s.textContent = '▼');
        content.style.display = isOpen ? 'none' : 'block';
        btn.querySelector('span').textContent = isOpen ? '▼' : '▲';
    };
});

/* --- 3. EXPORTACIÓN A CSV --- */
function exportarTablaACsv(idTabla, nombreArchivo) {
    const tabla = document.getElementById(idTabla);
    let filas = Array.from(tabla.querySelectorAll("tr"));
    if (filas.length <= 1) return alert("No hay datos para exportar");
    
    let contenidoCsv = filas.map(f => {
        let celdas = Array.from(f.querySelectorAll("th, td"));
        if(idTabla === "maestraTable") celdas = celdas.slice(0, -1);
        return celdas.map(c => `"${c.innerText.replace(/\n/g, " ").replace(/"/g, '""')}"`).join(";");
    }).join("\n");

    const blob = new Blob(["\ufeff" + contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nombreArchivo}_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* --- 4. CARGAS MASIVAS (POST) --- */
document.getElementById("uploadBtn").onclick = async () => {
    const file = document.getElementById("fileInput").files[0];
    if(!file) return alert("Selecciona un archivo CSV");
    showLoader("Subiendo registros a usuariosPorFecha...");
    const text = await file.text();
    const lines = text.trim().split("\n").slice(1);
    const filasParaSubir = lines.map(line => {
        let [f, cod, nom, ceds, cns] = line.split(";").map(x => x?.trim());
        if(f && cod) return [f, cod, limpiarTexto(nom), limpiarTexto(ceds), Number(cns) || 0];
        return null;
    }).filter(f => f !== null);

    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify({ pestaña: "usuariosPorFecha", accion: "subirMasivo", filas: filasParaSubir }) });
        alert("¡Carga mensual exitosa!");
    } catch (e) { alert("Error al subir"); }
    hideLoader();
};

document.getElementById("uploadProductBtn").onclick = async () => {
    const file = document.getElementById("productFileInput").files[0];
    if(!file) return alert("Selecciona CSV");
    showLoader("Actualizando catálogo...");
    const text = await file.text();
    const lines = text.trim().split("\n").slice(1);
    const filasParaSubir = lines.map(line => {
        let col = line.split(";").map(x => x?.trim());
        if(col[0]) return [col[0], Number(col[1]) || 0, Number(col[2]) || 999, col[3] || "General"];
        return null;
    }).filter(f => f !== null);

    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify({ pestaña: "Productos", accion: "limpiar" }) });
        await fetch(URL_API, { method: 'POST', body: JSON.stringify({ pestaña: "Productos", accion: "subirMasivo", filas: filasParaSubir }) });
        alert("¡Catálogo actualizado!");
    } catch (e) { alert("Error"); }
    hideLoader();
};

/* --- 5. CONSULTAS Y VISUALIZACIÓN --- */
document.getElementById("btnCargarMaestra").onclick = async () => {
    showLoader("Consultando registros...");
    const tbody = document.querySelector("#maestraTable tbody");
    tbody.innerHTML = "";
    try {
        const resp = await fetch(`${URL_API}?pestaña=usuariosPorFecha`);
        const data = await resp.json();
        data.forEach(r => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${r.codVendedor}</td><td>${r.nombre}</td><td>${r.cedis}</td><td><button class="btn-eliminar" onclick="alert('Eliminar en Excel')">X</button></td>`;
            tbody.appendChild(tr);
        });
    } catch (e) { alert("Error"); }
    hideLoader();
};

// BOTÓN: Ver en Pantalla (Lógica Flexible con corrección de Fecha y Productos)
document.getElementById("btnCargarMovs").onclick = async () => {
    const cod = document.getElementById("inputMovsCod").value.trim();
    showLoader(cod ? `Filtrando vendedor: ${cod}...` : "Cargando TODO el historial general...");
    
    const tbody = document.querySelector("#movTable tbody");
    tbody.innerHTML = "";

    try {
        const [rUser, rComp] = await Promise.all([
            fetch(`${URL_API}?pestaña=usuariosPorFecha`),
            fetch(`${URL_API}?pestaña=Compras`)
        ]);
        const dU = await rUser.json();
        const dC = await rComp.json();

        let mData = cod ? dU.filter(u => u.codVendedor.toString() === cod) : dU;
        let cData = cod ? dC.filter(u => u.codVendedor.toString() === cod) : dC;

        let mProc = mData.map(u => ({ fec: formatearFecha(u.fecha), con: "Carga Mensual", prods: "---", cns: Number(u.coins) || Number(u.coins_ganados) || 0, tipo: 'in', nom: u.nombre, ced: u.cedis, codV: u.codVendedor }));
        let cProc = cData.map(u => ({ fec: formatearFecha(u.fecha), con: "Canje Producto", prods: u.productos || u.items || "Ver historial", cns: -Number(u.total), tipo: 'out', nom: u.nombre, ced: u.cedis, codV: u.codVendedor }));
        
        let all = [...mProc, ...cProc].sort((a,b) => new Date(a.fec) - new Date(b.fec));

        let saldosTemporales = {};

        all.forEach(i => {
            if(!saldosTemporales[i.codV]) saldosTemporales[i.codV] = 0;
            saldosTemporales[i.codV] += i.cns;

            const tr = document.createElement("tr");
            const colorClass = i.tipo === 'in' ? 'color-verde' : 'color-rojo';
            tr.innerHTML = `
                <td>${i.codV}</td><td>${i.nom}</td><td>${i.ced}</td>
                <td>${i.fec}</td><td>${i.con}</td><td>${i.prods}</td>
                <td class="${colorClass}"><b>${i.cns > 0 ? '+' : ''}${i.cns}</b></td>
                <td><b>${saldosTemporales[i.codV]}</b></td>`;
            tbody.appendChild(tr);
        });
    } catch (e) { alert("Error al cruzar datos"); }
    hideLoader();
};

document.getElementById("btnCargarProductos").onclick = async () => {
    showLoader("Cargando productos...");
    const tbody = document.querySelector("#productsTable tbody");
    tbody.innerHTML = "";
    try {
        const resp = await fetch(`${URL_API}?pestaña=Productos`);
        const data = await resp.json();
        data.forEach(p => {
            const imgUrl = `assets/productos/${encodeURIComponent(p.producto.trim())}.png`;
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${p.producto}</td><td><img src="${imgUrl}" width="40" onerror="this.src='assets/logo.png'"></td><td>${p.coins}</td>`;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
    hideLoader();
};

// BOTÓN: Historial de Canjes (Corrección Fecha y Productos undefined)
document.getElementById("btnCargarCompras").onclick = async () => {
    showLoader("Buscando historial...");
    const tbody = document.querySelector("#comprasTable tbody");
    tbody.innerHTML = "";
    try {
        const resp = await fetch(`${URL_API}?pestaña=Compras`);
        const data = await resp.json();
        data.reverse().forEach(c => {
            const tr = document.createElement("tr");
            // Se asume que en el Excel la columna se llama "productos" o "items"
            const listaProductos = c.productos || c.items || "---";
            tr.innerHTML = `<td>${formatearFecha(c.fecha)}</td><td>${c.codVendedor}</td><td>${c.nombre || ''}</td><td>${c.cedis || ''}</td><td>${listaProductos}</td><td>${c.total}</td>`;
            tbody.appendChild(tr);
        });
    } catch (e) { alert("Error en historial"); }
    hideLoader();
};

/* --- 6. EVENTOS DE EXPORTACIÓN --- */
document.getElementById("btnExportMaestra").onclick = () => exportarTablaACsv("maestraTable", "Maestro");
document.getElementById("btnExportProds").onclick = () => exportarTablaACsv("productsTable", "Inventario");
document.getElementById("btnExportCompras").onclick = () => exportarTablaACsv("comprasTable", "Canjes");
document.getElementById("btnExportMovs").onclick = () => exportarTablaACsv("movTable", "EstadoCuentaGeneral");
document.getElementById("btnExportMovsDirecto").onclick = () => document.getElementById("btnCargarMovs").click();
