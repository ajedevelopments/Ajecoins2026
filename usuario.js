/* ================= CONFIGURACIÓN ================= */
const firebaseConfig = {
  apiKey: "AIzaSyCsz2EP8IsTlG02uU2_GRfyQeeajMDuJjI",
  authDomain: "ajecoins-73829.firebaseapp.com",
  projectId: "ajecoins-73829",
  storageBucket: "ajecoins-73829.appspot.com",
  messagingSenderId: "247461322350",
  appId: "1:247461322350:web:802185ad39249ca650507f"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ================= ELEMENTOS UI ================= */
const loginCard = document.getElementById('login');
const cuentaCard = document.getElementById('cuenta');
const cedulaInput = document.getElementById('cedulaInput'); 
const passwordInput = document.getElementById('passwordInput');
const ingresarBtn = document.getElementById('ingresarBtn');
const cerrarBtn = document.getElementById('cerrarBtn');
const btnCambiarPass = document.getElementById('btnCambiarPass');
const datosUl = document.getElementById('datos');
const coinsP = document.getElementById('coins');
const errorMsg = document.getElementById('errorMsg');
const tiendaDiv = document.getElementById('productosTienda');
const carritoList = document.getElementById('carritoList');
const bolsaSpan = document.getElementById('bolsa');
const historialList = document.getElementById('historialList');
const loader = document.getElementById('loader');

// Nuevos Elementos
const modalCorreo = document.getElementById('modalCorreo');
const modalRecuperar = document.getElementById('modalRecuperar');

/* ================= VARIABLES GLOBALES ================= */
let coinsUsuario = 0;
let carrito = [];
let userCod = ''; 
let userNombre = '';
let userCedis = '';
let codigoGenerado = "";

/* ================= EVENTOS ================= */
ingresarBtn.addEventListener('click', buscarUsuario);
cerrarBtn.addEventListener('click', () => location.reload());
document.getElementById('btnConfirmar').addEventListener('click', confirmarCompra);
document.getElementById('btnCancelar').addEventListener('click', cerrarModal);
btnCambiarPass.addEventListener("click", cambiarPassword);

// Eventos de Recuperación y Correo
document.getElementById('btnGuardarEmail').addEventListener('click', guardarEmail);
document.getElementById('olvideLink').addEventListener('click', (e) => {
    e.preventDefault();
    modalRecuperar.classList.remove('hidden');
});
document.getElementById('btnEnviarCodigo').addEventListener('click', flujoEnviarCodigo);
document.getElementById('btnRestablecer').addEventListener('click', restablecerPassword);
document.getElementById('btnCerrarRecuperar').addEventListener('click', () => modalRecuperar.classList.add('hidden'));

/* ================= LOADER ================= */
function mostrarLoader(mensaje='Procesando…'){
  loader.querySelector('p').textContent = mensaje;
  loader.classList.add('active');
}
function ocultarLoader(){
  loader.classList.remove('active');
}

/* ================= CREDENCIALES ================= */
async function crearCredencialSiNoExiste(cod){
  const ref = db.collection("credenciales").doc(cod);
  const doc = await ref.get();
  if(!doc.exists){
    await ref.set({
      password: cod, 
      creado: firebase.firestore.FieldValue.serverTimestamp(),
      email: "" 
    });
  }
}

async function obtenerCredencial(cod){
  const doc = await db.collection("credenciales").doc(cod).get();
  return doc.exists ? doc.data() : null;
}

/* ================= LOGIN ================= */
async function buscarUsuario(){
  const cod = cedulaInput.value.trim();
  const pass = passwordInput.value.trim();

  if(!cod || !pass){
    errorMsg.textContent='Código y contraseña obligatorios';
    return;
  }

  mostrarLoader('Verificando credenciales…');

  try{
    const snap = await db.collection('usuariosPorFecha').where('codVendedor','==',cod).get();
    
    if(snap.empty){
      errorMsg.textContent='Código de vendedor no encontrado';
      ocultarLoader();
      return;
    }

    await crearCredencialSiNoExiste(cod);
    const cred = await obtenerCredencial(cod);

    if(cred.password !== pass){
      errorMsg.textContent='Contraseña incorrecta';
      ocultarLoader();
      return;
    }

    userCod = cod;
    
    // VERIFICACIÓN DE CORREO OBLIGATORIO
    if (!cred.email) {
        ocultarLoader();
        modalCorreo.classList.remove('hidden');
        return; 
    }

    let totalCoins=0, fechaMasReciente='', nombre='', cedis='';

    snap.forEach(doc=>{
      const d=doc.data();
      totalCoins += Number(d.coins_ganados);
      if(!fechaMasReciente || new Date(d.fecha)>new Date(fechaMasReciente)){
        fechaMasReciente=d.fecha;
        nombre=d.nombre;
        cedis=d.cedis;
      }
    });

    const snapCompras = await db.collection('compras').where('codVendedor','==',cod).get();
    let totalGastado=0;
    snapCompras.forEach(d=> totalGastado += Number(d.data().total));

    coinsUsuario = totalCoins - totalGastado;
    userNombre = nombre;
    userCedis = cedis;

    mostrarDatos({fecha:fechaMasReciente, codigo:cod, nombre, cedis});
    coinsP.textContent = coinsUsuario;

    await cargarProductos();
    await cargarHistorial();

  }catch(err){
    console.error(err);
    errorMsg.textContent='Error al cargar datos';
  }finally{
    ocultarLoader();
  }
}

async function guardarEmail() {
    const email = document.getElementById('emailRegistroInput').value.trim();
    if (!email.includes("@") || email.length < 5) return alert("Ingresa un correo válido");

    mostrarLoader('Registrando correo...');
    try {
        await db.collection("credenciales").doc(userCod).update({ email: email });
        alert("Correo registrado con éxito. Por favor, ingresa de nuevo.");
        location.reload();
    } catch (e) {
        alert("Error al guardar correo");
    } finally {
        ocultarLoader();
    }
}

/* ================= RECUPERACIÓN (EMAILJS) ================= */
async function flujoEnviarCodigo() {
    const cod = document.getElementById('codRecuperar').value.trim();
    const email = document.getElementById('emailRecuperar').value.trim();

    if(!cod || !email) return alert("Completa los datos");

    mostrarLoader('Verificando...');
    const cred = await obtenerCredencial(cod);

    if (!cred || cred.email !== email) {
        ocultarLoader();
        return alert("Los datos no coinciden.");
    }

    codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();

    const templateParams = {
        user_name: cod,
        user_email: email,
        recovery_code: codigoGenerado
    };

    try {
        await emailjs.send('service_5zouh3m', 'template_j20stir', templateParams);
        alert("Código enviado a tu bandeja.");
        document.getElementById('step1Recuperar').classList.add('hidden');
        document.getElementById('step2Recuperar').classList.remove('hidden');
        document.getElementById('tituloRecuperar').textContent = "Paso Final";
    } catch (err) {
        alert("Error al enviar email");
    } finally {
        ocultarLoader();
    }
}

async function restablecerPassword() {
    const codIn = document.getElementById('codigoVerificacionInput').value.trim();
    const pass = document.getElementById('nuevaPassInput').value.trim();
    const user = document.getElementById('codRecuperar').value.trim();

    if (codIn !== codigoGenerado) return alert("Código inválido");
    if (pass.length < 4) return alert("Contraseña muy corta");

    mostrarLoader('Actualizando...');
    await db.collection("credenciales").doc(user).update({ password: pass });
    alert("¡Listo! Ya puedes entrar.");
    location.reload();
}

/* ================= TIENDA Y CARRITO ================= */
function mostrarDatos(u){
  loginCard.classList.add('hidden');
  cuentaCard.classList.remove('hidden');
  datosUl.innerHTML=`
    <li><strong>Fecha:</strong> ${u.fecha}</li>
    <li><strong>Código:</strong> ${u.codigo}</li>
    <li><strong>Nombre:</strong> ${u.nombre}</li>
    <li><strong>Cedis:</strong> ${u.cedis}</li>
  `;
}

async function cargarProductos(){
  tiendaDiv.innerHTML='';
  const snap = await db.collection('productos').get();
  snap.forEach(doc=>{
    const p=doc.data();
    const div=document.createElement('div');
    div.className='tarjeta';
    div.innerHTML=`<img src="assets/productos/${p.producto}.png"><h4>${p.producto}</h4><b>${p.coins} c</b><button>Agregar</button>`;
    div.querySelector('button').onclick = ()=> agregarAlCarrito(p.producto, p.coins);
    tiendaDiv.appendChild(div);
  });
}

function agregarAlCarrito(nombre, precio){
  if(coinsUsuario < precio){ alert('Coins insuficientes'); return; }
  carrito.push({nombre, precio});
  renderCarrito();
}

function renderCarrito(){
  carritoList.innerHTML='';
  let total=0;
  carrito.forEach(i=>{
    total+=i.precio;
    carritoList.innerHTML += `<li>${i.nombre} <span>${i.precio} c</span></li>`;
  });
  bolsaSpan.textContent=`${total} c`;
  let btnFin = document.getElementById('btnFin');
  if(carrito.length && !btnFin){
    btnFin = document.createElement('button');
    btnFin.id='btnFin'; btnFin.textContent='Finalizar compra';
    btnFin.onclick = abrirModal;
    carritoList.after(btnFin);
  }else if(!carrito.length && btnFin){ btnFin.remove(); }
}

function abrirModal(){
  const total = carrito.reduce((a,b)=>a+b.precio,0);
  document.getElementById('totalFin').textContent=`Total: ${total} coins`;
  document.getElementById('resumenList').innerHTML = carrito.map(i=>`<li>${i.nombre} · ${i.precio}</li>`).join('');
  document.getElementById('modalFin').classList.remove('hidden');
}

function cerrarModal(){ document.getElementById('modalFin').classList.add('hidden'); }

async function confirmarCompra(){
  const total = carrito.reduce((a,b)=>a+b.precio,0);
  cerrarModal();
  mostrarLoader('Procesando compra…');
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
  }catch(err){ alert('Error en la compra'); }finally{ ocultarLoader(); }
}

async function cargarHistorial(){
  historialList.innerHTML='';
  const snap = await db.collection('compras').where('codVendedor','==',userCod).get();
  if(snap.empty){ historialList.innerHTML='<li>Sin compras</li>'; return; }
  snap.forEach(doc=>{
    const c=doc.data();
    historialList.innerHTML += `<li>${c.items.map(i=>i.nombre).join(", ")} — ${c.total} c</li>`;
  });
}

async function cambiarPassword(){
  const nueva = prompt("Nueva contraseña:");
  if(!nueva || nueva.length < 4){ alert("Mínimo 4 caracteres"); return; }
  await db.collection("credenciales").doc(userCod).update({ password: nueva });
  alert("Actualizada");
}
