import { Auth } from './auth.js';

// Proteger ruta
const session = Auth.getSession();
if (!session || session.role !== 'user') {
  alert('Debes iniciar sesión');
  window.location.href = 'login.html';
}

const CATALOGO = [
  {id: 1, nombre: 'Taza', precio: 500, img: 'catalogo/taza.png'},
  {id: 2, nombre: 'Gorra', precio: 700, img: 'catalogo/gorra.png'},
  {id: 3, nombre: 'Mochila', precio: 1200, img: 'catalogo/mochila.png'}
];

const loadUserData = () => {
  const baseCoins = JSON.parse(localStorage.getItem('aje_baseCoins') || '{}');
  return baseCoins[session.user];
};

const renderCatalogo = (coins) => {
  const container = document.querySelector('.catalogo');
  container.innerHTML = CATALOGO.map(item => `
    <div class="item">
      <img src="${item.img}" alt="${item.nombre}">
      <h3>${item.nombre}</h3>
      <p>${item.precio} Coins</p>
      <button ${coins < item.precio ? 'disabled' : ''} 
              onclick="canjear(${item.precio}, '${item.nombre}')">
        ${coins < item.precio ? 'Insuficiente' : 'Canjear'}
      </button>
    </div>
  `).join('');
};

const updateDisplay = () => {
  const userData = loadUserData();
  if (!userData) {
    document.getElementById('coins').innerHTML = '<span class="error">Usuario no encontrado</span>';
    return;
  }
  document.getElementById('coins').textContent = `Tienes ${userData.coins_actuales} COINS`;
  renderCatalogo(userData.coins_actuales);
};

window.canjear = (precio, nombre) => {
  const baseCoins = JSON.parse(localStorage.getItem('aje_baseCoins') || '{}');
  const userData = baseCoins[session.user];
  
  if (!userData || userData.coins_actuales < precio) return alert('Coins insuficientes');
  
  userData.coins_usados += precio;
  userData.coins_actuales -= precio;
  baseCoins[session.user] = userData;
  
  localStorage.setItem('aje_baseCoins', JSON.stringify(baseCoins));
  alert(`¡Canjeaste ${nombre} por ${precio} coins!`);
  updateDisplay();
};

updateDisplay();
