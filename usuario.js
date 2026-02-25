const URL_API = "https://script.google.com/macros/s/AKfycbynec0w_hcPGN8QvthkjYxEFqKXEdSR3SdVfpJbSO-J5aLKTK8QMcDwB_9475oQvmHCpw/exec";

let coinsUsuario = 0, carrito = [], userCod = '', userNombre = '', userCedis = '';

/* --- UTILIDADES --- */
function mostrarLoader(m='Procesando...'){ 
    const ldr = document.getElementById('loader');
    ldr.querySelector('p').textContent = m; 
    ldr.classList.add('active'); 
}
function ocultarLoader(){ document.getElementById('loader').classList.remove('active'); }

function mostrarToast(msj) {
    const toast = document.getElementById('toast');
    toast.textContent = msj;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
}

/* --- INICIO --- */
window.addEventListener('DOMContentLoaded', cargarCedisDinamicas);
document.getElementById('ingresarBtn').onclick = buscarUsuario;
document.getElementById('cerrarBtn').onclick = () => location.reload();
document.getElementById('btnConfirmar').onclick = confirmarCompra;
document.getElementById('btnCancelar').onclick = () => document.getElementById('modalFin').style.display = 'none';
document.getElementById('btnNavCambiarPass').onclick = () => cambiarPassword(true);
document.getElementById('btnVerMovimientos').onclick = () => document.getElementById('modalMovimientos').classList.remove('hidden');
document.getElementById('btnCloseMovs').onclick = () => document.getElementById('modalMovimientos').classList.add('hidden');
document.getElementById('btnGuardarEmail').onclick = guardarEmail;
document.getElementById('olvideLink').onclick = (e) => { e.preventDefault(); document.getElementById('modalRecuperar').classList.remove('hidden'); };
document.getElementById('btnCerrarRecuperar').onclick = () => document.getElementById('modalRecuperar').classList.add('hidden');
document.getElementById('btnEnviarCodigo').onclick = procesoRecuperacion;

function cargarCedisDinamicas() {
    const sedes = ["AMBATO","CHONE","CUENCA","GUAYAQUIL NORTE","GUAYAQUIL SUR","MACHALA","MANTA","MAYORISTA GUAYAQUIL","QUITO NORTE","QUITO SUR","RIOBAMBA","SANTO DOMINGO","ECONORED COSTA AUSTRO","ECONORED SIERRA","ECONORED COSTA NORTE"];
    const select = document.getElementById('cedisLoginSelect');
    if(select) {
        select.innerHTML = '<option value="" disabled selected>Selecciona tu ciudad...</option>';
        sedes.sort().forEach(s => {
            const opt = document.createElement('option');
            opt.value = s; opt.textContent = s;
            select.appendChild(opt);
        });
    }
}

/* --- LOGICA DE SESION --- */
async function buscarUsuario(){
    const cod = document.getElementById('cedulaInput').value.trim();
    const pass = document.getElementById('passwordInput').value.trim();
    const cedisSel = document.getElementById('cedisLoginSelect').value;
    if(!cedisSel || !cod || !pass) return alert('Completa todo.');
    
    mostrarLoader('Iniciando sesión...');
    try {
        const resCred = await fetch(`${URL_API}?pestaña=Credenciales`);
        const creds = await resCred.json();
        let uCred = creds.find(u => u.codVendedor.toString() === cod && u.cedis === cedisSel);

        if(!uCred){
            const resUser = await fetch(`${URL_API}?pestaña=usuariosPorFecha`);
            const users = await resUser.json();
            const existe = users.find(u => u.codVendedor.toString() === cod && u.cedis === cedisSel);
            if(!existe){ alert('Vendedor no registrado.'); ocultarLoader(); return; }

            await fetch(URL_API, { method: 'POST', body: JSON.stringify({ pestaña: "Credenciales", accion: "subirMasivo", filas: [[cod, cod, "", "true", cedisSel]] }) });
            uCred = { codVendedor: cod, password: cod, email: "", requiereCambio: "true", cedis: cedisSel };
        }

        if(uCred.password.toString() !== pass){ alert('Contraseña incorrecta.'); ocultarLoader(); return; }
        
        userCod = cod; 
        userCedis = cedisSel;

        // IMPORTANTE: APAGAR LOADER ANTES DE LANZAR MODALES
        ocultarLoader();

        if(uCred.requiereCambio === "true" || uCred.requiereCambio === true) {
            await cambiarPassword(false);
            return;
        }
        
        if(!uCred.email) {
            document.getElementById('modalCorreo').classList.remove('hidden');
            return;
        }

        mostrarLoader('Cargando portal...');
        await cargarDatosPortal(cod, cedisSel);
    } catch(e) { 
        console.error(e);
        ocultarLoader();
    }
    ocultarLoader();
}

async function cargarDatosPortal(cod, cedisSel){
    const [resCargas, resCompras] = await Promise.all([
        fetch(`${URL_API}?pestaña=usuariosPorFecha`),
        fetch(`${URL_API}?pestaña=Compras`)
    ]);
    const cargas = await resCargas.json();
    const compras = await resCompras.json();

    const misCargas = cargas.filter(u => u.codVendedor.toString() === cod && u.cedis === cedisSel);
    const misCompras = compras.filter(u => u.codVendedor.toString() === cod && u.cedis === cedisSel);

    let tC = 0, tG = 0, nom = "", fec = "";
    misCargas.forEach(d => { 
        tC += Number(d.coins || d.coins_ganados || 0); 
        nom = d.nombre; 
        fec = d.fecha; 
    });
    misCompras.forEach(d => tG += Number(d.total));

    coinsUsuario = tC - tG;
    userNombre = nom;

    document.getElementById('login').classList.add('hidden');
    document.getElementById('cuenta').classList.remove('hidden');

    document.getElementById('datos').innerHTML = `
        <li><strong>Carga:</strong> ${fec}</li>
        <li><strong>Código:</strong> ${cod}</li>
        <li><strong>Nombre:</strong> ${nom}</li>
        <li><strong>Sede:</strong> ${cedisSel}</li>
    `;
    document.getElementById('coins').textContent = coinsUsuario;

    renderHistorial(misCargas, misCompras);
    cargarTienda();
}

async function cargarTienda() {
    const tienda = document.getElementById('productosTienda');
    tienda.innerHTML = 'Cargando...';
    const resp = await fetch(`${URL_API}?pestaña=Productos`);
    const prods = await resp.json();
    tienda.innerHTML = '';
    prods.forEach(p => {
        const card = document.createElement('div');
        card.className = 'tarjeta';
        card.innerHTML = `<img src="assets/productos/${p.producto}.png" onerror="this.src='assets/logo.png'"><h4>${p.producto}</h4><b>${p.coins} c</b><button>Agregar</button>`;
        card.querySelector('button').onclick = () => {
            const totalCar = carrito.reduce((a,b)=>a+b.precio, 0);
            if(coinsUsuario < (totalCar + Number(p.coins))) return alert("Coins insuficientes");
            carrito.push({id: Date.now(), nombre: p.producto, precio: Number(p.coins)});
            mostrarToast(`✅ ${p.producto} agregado`);
            renderCarrito();
        };
        tienda.appendChild(card);
    });
}

function renderCarrito() {
    const list = document.getElementById('carritoList');
    list.innerHTML = carrito.length ? '' : '<li>El carrito está vacío</li>';
    let total = 0;
    carrito.forEach(i => {
        total += i.precio;
        list.innerHTML += `<li style="display:flex; justify-content:space-between; padding:8px; background:#fff; margin-bottom:5px; border-radius:5px; border:1px solid #eee; font-size:12px;"><span>${i.nombre} (${i.precio}c)</span><button onclick="delCar(${i.id})" style="background:#ff4d4d; color:#fff; border:none; border-radius:3px; cursor:pointer; padding:2px 8px; width:auto;">✕</button></li>`;
    });
    document.getElementById('bolsa').textContent = `${total} c`;
    const container = document.getElementById('containerBtnFin');
    container.innerHTML = carrito.length ? `<button onclick="abrirConf()">CONFIRMAR CANJE</button>` : '';
}
window.delCar = (id) => { carrito = carrito.filter(i => i.id !== id); renderCarrito(); };
window.abrirConf = () => {
    const total = carrito.reduce((a,b)=>a+b.precio,0);
    document.getElementById('totalFin').innerText = `Total del Canje: ${total} Coins`;
    document.getElementById('resumenList').innerHTML = carrito.map(i=>`<li>${i.nombre}</li>`).join('');
    document.getElementById('modalFin').style.display = 'flex';
};

async function confirmarCompra(){
    document.getElementById('modalFin').style.display = 'none';
    mostrarLoader('Registrando canje...');
    const total = carrito.reduce((a,b)=>a+b.precio,0);
    const items = carrito.map(i => i.nombre).join(', ');
    const fila = [new Date().toLocaleDateString(), userCod, userNombre, userCedis, items, total];
    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify({ pestaña: "Compras", accion: "subirMasivo", filas: [fila] }) });
        alert("¡Canje registrado!");
        location.reload();
    } catch(e) { alert("Error."); ocultarLoader(); }
}

function renderHistorial(cargas, compras) {
    const body = document.getElementById('movimientosBody');
    body.innerHTML = '';
    let m = [], sal = 0;
    cargas.forEach(d => m.push({f: d.fecha, c: "Carga", v: Number(d.coins || d.coins_ganados || 0)}));
    compras.forEach(d => m.push({f: d.fecha, c: "Canje", v: -Number(d.total)}));
    m.sort((a,b) => new Date(a.f) - new Date(b.f)).forEach(i => {
        sal += i.v;
        body.innerHTML += `<tr><td>${i.f}</td><td>${i.c}</td><td style="color:${i.v>0?'green':'red'}; font-weight:bold;">${i.v}</td><td><b>${sal}</b></td></tr>`;
    });
}

async function guardarEmail() {
    const email = document.getElementById('emailRegistroInput').value.trim();
    if(!email.includes("@")) return alert("Correo inválido.");
    mostrarLoader('Guardando seguridad...');
    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify({ pestaña: "Credenciales", accion: "actualizar", id: userCod, columna: "email", valor: email.toLowerCase(), cedis: userCedis }) });
        alert("¡Seguridad configurada!");
        location.reload();
    } catch(e) { alert("Error."); ocultarLoader(); }
}

async function cambiarPassword(manual){
    const n = prompt(manual ? "Ingresa tu nueva clave (Mínimo 5):" : "NUEVA CLAVE OBLIGATORIA (Mínimo 5):");
    if(n && n.length >= 5){
        mostrarLoader('Actualizando clave...');
        try {
            await fetch(URL_API, { method: 'POST', body: JSON.stringify({ pestaña: "Credenciales", accion: "actualizarPassword", id: userCod || document.getElementById('cedulaInput').value.trim(), cedis: userCedis || document.getElementById('cedisLoginSelect').value, nuevaPass: n }) });
            alert("Clave actualizada.");
            location.reload();
        } catch(e) { alert("Error."); ocultarLoader(); }
    } else if(n) {
        alert("Clave muy corta.");
        if(!manual) cambiarPassword(false);
    }
}

async function procesoRecuperacion() {
    const cod = document.getElementById('codRecuperar').value.trim();
    const email = document.getElementById('emailRecuperar').value.trim();
    const cedis = document.getElementById('cedisLoginSelect').value;
    mostrarLoader('Verificando...');
    try {
        const resp = await fetch(`${URL_API}?pestaña=Credenciales`);
        const creds = await resp.json();
        const u = creds.find(x => x.codVendedor.toString() === cod && x.cedis === cedis && x.email.toLowerCase() === email.toLowerCase());
        if(u){
            emailjs.send("service_5zouh3m", "template_fwvkczd", { user_email: email, user_name: cod, recovery_code: u.password })
            .then(() => alert("Enviado."));
        } else alert("Datos no coinciden.");
    } catch(e) { alert("Error."); }
    ocultarLoader();
}
