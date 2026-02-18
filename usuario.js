/* ================= CONFIGURACIÓN FIREBASE (COMPAT) ================= */
const firebaseConfig = {
  apiKey: "AIzaSyCsz2EP8IsTlG02uU2_GRfyQeeajMDuJjI",
  authDomain: "ajecoins-73829.firebaseapp.com",
  projectId: "ajecoins-73829",
  storageBucket: "ajecoins-73829.appspot.com",
  messagingSenderId: "247461322350",
  appId: "1:247461322350:web:802185ad39249ca650507f"
};

// Inicializar Firebase si no está inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

/* ================= ELEMENTOS UI ================= */
const loginCard = document.getElementById('login');
const cuentaCard = document.getElementById('cuenta');
const cedulaInput = document.getElementById('cedulaInput'); 
const passwordInput = document.getElementById('passwordInput');
const cedisInput = document.getElementById('cedisInput'); 
const ingresarBtn = document.getElementById('ingresarBtn');
const cerrarBtn = document.getElementById('cerrarBtn');
const btnCambiarPass = document.getElementById('btnCambiarPass');
const datosUl = document.getElementById('datos');
const coinsP = document.getElementById('coins');
const errorMsg = document.getElementById('errorMsg');
const tiendaDiv = document.getElementById('productosTienda');
const carritoList = document.getElementById('carritoList');
const bolsaSpan = document.getElementById('bolsa');
const movimientosBody = document.getElementById('movimientosBody'); 
const loader = document.getElementById('loader');

// Modales
const modalCorreo = document.getElementById('modalCorreo');
const modalRecuperar = document.getElementById('modalRecuperar');
const modalFin = document.getElementById('modalFin');

/* ================= VARIABLES GLOBALES ================= */
let coinsUsuario = 0;
let carrito = [];
let userCod = ''; 
let userNombre = '';
let userCedis = '';
let userLoginId = ''; 
let codigoGenerado = "";

/* ================= INICIO / CARGA DE CEDIS ================= */
async function cargarCedisDinamicos() {
    try {
        const snap = await db.collection('usuariosPorFecha').get();
        const listaCedis = new Set();
        snap.forEach(doc => {
            const d = doc.data();
            if (d.cedis) listaCedis.add(d.cedis.toUpperCase().trim());
        });

        const cedisOrdenados = Array.from(listaCedis).sort();
        const selects = [cedisInput, document.getElementById('cedisRecuperar')];
        
        selects.forEach(sel => {
            if (!sel) return;
            sel.innerHTML = '<option value="">Selecciona tu CEDIS</option>';
            cedisOrdenados.forEach(nombre => {
                const opt = document.createElement('option');
                opt.value = nombre;
                opt.textContent = nombre;
                sel.appendChild(opt);
            });
        });
    } catch (err) { console.error("Error cargando CEDIS:", err); }
}
cargarCedisDinamicos();

/* ================= LOADER ================= */
function mostrarLoader(mensaje='Procesando…'){
  loader.querySelector('p').textContent = mensaje;
  loader.classList.add('active');
}
function ocultarLoader(){ loader.classList.remove('active'); }

/* ================= LOGIN Y SEGURIDAD ================= */
async function buscarUsuario(){
  const cod = cedulaInput.value.trim();
  const pass = passwordInput.value.trim();
  const cedisSel = cedisInput.value;

  if(!cod || !pass || !cedisSel){
    errorMsg.textContent='Código, contraseña y CEDIS obligatorios';
    return;
  }

  mostrarLoader('Verificando credenciales…');

  try{
    const snap = await db.collection('usuariosPorFecha')
                         .where('codVendedor','==',cod)
                         .where('cedis','==',cedisSel)
                         .get();
    
    if(snap.empty){
      errorMsg.textContent='Usuario no encontrado en este CEDIS';
      ocultarLoader();
      return;
    }

    userLoginId = `${cod}_${cedisSel}`;
    const credRef = db.collection("credenciales").doc(userLoginId);
    const docCred = await credRef.get();
    
    let cred;
    if(!docCred.exists){
        await credRef.set({
            password: cod,
            requiereCambio: true,
            email: "",
            creado: firebase.firestore.FieldValue.serverTimestamp()
        });
        cred = { password: cod, requiereCambio: true, email: "" };
    } else {
        cred = docCred.data();
    }

    if(cred.password !== pass){
      errorMsg.textContent='Contraseña incorrecta';
      ocultarLoader();
      return;
    }

    userCod = cod;
    userCedis = cedisSel;

    if (cred.requiereCambio === true) {
        ocultarLoader();
        const nueva = prompt("🔒 SEGURIDAD: Cambia tu contraseña inicial (mín. 4 caracteres):");
        if(!nueva || nueva.length < 4) { alert("Acceso denegado."); return; }
        mostrarLoader('Actualizando...');
        await credRef.update({ password: nueva, requiereCambio: false });
        alert("Contraseña actualizada. Ingresa de nuevo.");
        location.reload();
        return;
    }

    if (!cred.email) {
        ocultarLoader();
        modalCorreo.classList.remove('hidden');
        return; 
    }

    // Cálculos de saldo
    let totalCoins=0, fechaMasReciente='', nombre='';
    snap.forEach(doc=>{
      const d=doc.data();
      totalCoins += Number(d.coins_ganados);
      if(!fechaMasReciente || new Date(d.fecha)>new Date(fechaMasReciente)){
        fechaMasReciente=d.fecha; nombre=d.nombre;
      }
    });

    const snapCompras = await db.collection('compras')
                                 .where('codVendedor','==',cod)
                                 .where('cedis','==',cedisSel)
                                 .get();
    let totalGastado=0;
    snapCompras.forEach(d=> totalGastado += Number(d.data().total));

    coinsUsuario = totalCoins - totalGastado;
    userNombre = nombre;

    mostrarDatos({fecha:fechaMasReciente, codigo:cod, nombre, cedis:cedisSel});
    coinsP.textContent = coinsUsuario;

    await cargarProductos();
    await cargarHistorial();

  }catch(err){
    console.error(err);
    errorMsg.textContent='Error al cargar datos';
  }finally{ ocultarLoader(); }
}

/* ================= GESTIÓN DE TIENDA Y CARRITO ================= */
async function cargarProductos(){
  tiendaDiv.innerHTML='';
  const snap = await db.collection('productos').get();
  snap.forEach(doc=>{
    const p=doc.data();
    const div=document.createElement('div');
    div.className='tarjeta';
    div.innerHTML=`
        <img src="assets/productos/${p.producto}.png" onerror="this.src='assets/logo.png'">
        <h4>${p.producto}</h4>
        <b>${p.coins} c</b>
        <button onclick="agregarAlCarrito('${p.producto}', ${p.coins})">Agregar</button>
    `;
    tiendaDiv.appendChild(div);
  });
}

function agregarAlCarrito(nombre, precio){
  const totalCarrito = carrito.reduce((sum, item) => sum + item.precio, 0);
  if((totalCarrito + precio) > coinsUsuario){ 
      alert('¡Coins insuficientes!'); 
      return; 
  }
  carrito.push({nombre, precio});
  renderCarrito();
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    renderCarrito();
}

function renderCarrito(){
  carritoList.innerHTML='';
  let total=0;
  
  carrito.forEach((item, index) => { 
      total += item.precio; 
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.padding = '5px 0';
      li.style.borderBottom = '1px solid #eee';

      li.innerHTML = `
        <span style="font-size:14px;">${item.nombre} <b>(${item.precio}c)</b></span>
        <button onclick="eliminarDelCarrito(${index})" style="background:#d9534f; color:white; border:none; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:10px;">QUITAR</button>
      `;
      carritoList.appendChild(li);
  });
  
  bolsaSpan.textContent = `${total} c`;

  let btnFin = document.getElementById('btnFin');
  if(!btnFin) {
      btnFin = document.createElement('button');
      btnFin.id = 'btnFin';
      btnFin.textContent = 'Finalizar compra';
      btnFin.style.cssText = "width:100%; background:#007a5a; color:white; padding:10px; border:none; border-radius:8px; cursor:pointer; margin-top:10px; font-weight:bold;";
      btnFin.onclick = abrirModal;
      carritoList.after(btnFin);
  }
  btnFin.style.display = carrito.length > 0 ? 'block' : 'none';
}

function abrirModal(){
  const total = carrito.reduce((a,b)=>a+b.precio,0);
  document.getElementById('totalFin').textContent=`Total: ${total} c`;
  document.getElementById('resumenList').innerHTML = carrito.map(i=>`<li>${i.nombre} · ${i.precio} c</li>`).join('');
  modalFin.classList.remove('hidden');
}

function cerrarModal(){ modalFin.classList.add('hidden'); }

async function confirmarCompra(){
  const total = carrito.reduce((a,b)=>a+b.precio,0);
  cerrarModal();
  mostrarLoader('Procesando canje...');
  
  try{
    await db.collection('compras').add({ 
        codVendedor: userCod, 
        nombre: userNombre, 
        cedis: userCedis, 
        items: carrito, 
        total: total, 
        fecha: firebase.firestore.FieldValue.serverTimestamp() 
    });
    
    coinsUsuario -= total;
    coinsP.textContent = coinsUsuario;
    carrito = [];
    renderCarrito();
    await cargarHistorial();
    alert("¡Canje exitoso! Retira tus productos.");
  } catch(err) { alert('Error al procesar.'); } finally { ocultarLoader(); }
}

/* ================= HISTORIAL Y PERFIL ================= */
function mostrarDatos(u){
  loginCard.classList.add('hidden');
  cuentaCard.classList.remove('hidden');
  datosUl.innerHTML=`<li><strong>Fecha:</strong> ${u.fecha}</li><li><strong>Código:</strong> ${u.codigo}</li><li><strong>Nombre:</strong> ${u.nombre}</li><li><strong>Cedis:</strong> ${u.cedis}</li>`;
}

async function cargarHistorial() {
  movimientosBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando...</td></tr>';
  try {
    let movimientos = [];
    let saldoCalc = 0;

    const snapIngresos = await db.collection('usuariosPorFecha').where('codVendedor', '==', userCod).where('cedis', '==', userCedis).get();
    snapIngresos.forEach(doc => {
      const d = doc.data();
      movimientos.push({ fecha: d.fecha, concepto: "Carga de Coins", coins: Number(d.coins_ganados) });
    });

    const snapCompras = await db.collection('compras').where('codVendedor', '==', userCod).where('cedis', '==', userCedis).get();
    snapCompras.forEach(doc => {
      const c = doc.data();
      const fechaC = c.fecha ? c.fecha.toDate().toISOString().slice(0, 10) : '---';
      movimientos.push({ fecha: fechaC, concepto: `Canje: ${c.items.map(i => i.nombre).join(", ")}`, coins: -Number(c.total) });
    });

    movimientos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    movimientosBody.innerHTML = '';
    
    movimientos.forEach(m => {
      saldoCalc += m.coins;
      const colorC = m.coins >= 0 ? '#007a5a' : '#d9534f';
      movimientosBody.innerHTML += `
        <tr>
          <td>${m.fecha}</td>
          <td>${m.concepto}</td>
          <td style="color:${colorC}; font-weight:bold;">${m.coins >= 0 ? '+' : ''}${m.coins}</td>
          <td style="font-weight:bold;">${saldoCalc}</td>
        </tr>`;
    });
  } catch (err) { console.error(err); }
}

/* ================= EVENTOS DE BOTONES ================= */
document.getElementById('btnGuardarEmail').onclick = async () => {
    const email = document.getElementById('emailRegistroInput').value.trim();
    if (!email.includes("@")) return alert("Correo inválido");
    mostrarLoader('Guardando...');
    await db.collection("credenciales").doc(userLoginId).update({ email: email });
    alert("Registrado. Ingresa de nuevo.");
    location.reload();
};

async function cambiarPassword(){
  const nueva = prompt("Nueva contraseña (mín 4 caracteres):");
  if(!nueva || nueva.length < 4) return;
  await db.collection("credenciales").doc(userLoginId).update({ password: nueva });
  alert("Contraseña cambiada.");
}

// Acordeón Historial
const btnH = document.getElementById('btnDesplegarHistorial');
if(btnH){
    btnH.onclick = () => {
        const panel = document.getElementById('historialAcordeon');
        panel.classList.toggle('hidden');
        btnH.querySelector('span').innerText = panel.classList.contains('hidden') ? '+' : '−';
    };
}

document.getElementById('btnConfirmar').onclick = confirmarCompra;
document.getElementById('btnCancelar').onclick = cerrarModal;
btnCambiarPass.onclick = cambiarPassword;
