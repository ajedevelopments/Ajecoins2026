const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

const Auth = {
  login(u, p) {
    if (u === ADMIN_USER && p === ADMIN_PASS) return { role: 'admin', cedula: u };
    if (u && u === p) {
      const baseCoins = JSON.parse(localStorage.getItem('aje_baseCoins') || '{}');
      const userData = baseCoins[u];
      if (userData && userData.coins_ganados > 0) return { role: 'user', cedula: u };
    }
    return null;
  },
  setSession(data) {
    sessionStorage.setItem('aje_session', JSON.stringify({...data, time: Date.now()}));
  },
  getSession() {
    const s = sessionStorage.getItem('aje_session');
    return s ? JSON.parse(s) : null;
  }
};

window.handleLogin = () => {
  const user = document.getElementById('user').value.trim();
  const pass = document.getElementById('pass').value.trim();
  const auth = Auth.login(user, pass);
  if (auth) {
    Auth.setSession(auth);
    window.location.href = auth.role === 'admin' ? 'admin.html' : 'usuario.html';
  } else {
    alert('❌ Usuario no encontrado, sin coins asignados o credenciales incorrectas');
  }
};
