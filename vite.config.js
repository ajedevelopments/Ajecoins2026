export default {
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: '.',
    rollupOptions: {
      input: {
        index: 'index.html',
        login: 'login.html',
        admin: 'admin.html',
        usuario: 'usuario.html'
      }
    }
  }
};
