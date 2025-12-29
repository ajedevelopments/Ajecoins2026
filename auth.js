// CREDENCIALES (CAMBIA ESTOS VALORES)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123'; // CAMBIA ESTO POR UNA CONTRASEÑA SEGURA

// Hash simple
const hash = str => {
  let h = 0;
  for(let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return h.toString();
};

const Auth = {
  login(u, p) {
    if (u === ADMIN_USER && p === ADMIN_PASS) return { role: 'admin', cedula: u };
    if (u && u === p) return { role: 'user', cedula: u };
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
    alert('❌ Credenciales incorrectas');
  }
};
