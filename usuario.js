function loginUsuario() {
    const cedula = document.getElementById("cedulaInput").value.trim();
    const error = document.getElementById("error");

    if (cedula === "") {
        error.textContent = "Ingrese su número de cédula";
        return;
    }

    // Obtener datos guardados por el admin
    const data = JSON.parse(localStorage.getItem("aje_coins_data"));

    if (!data || data.length === 0) {
        error.textContent = "No hay datos cargados aún";
        return;
    }

    // Buscar usuario por cédula
    const usuario = data.find(u => u.cedula === cedula);

    if (!usuario) {
        error.textContent = "Cédula no encontrada";
        return;
    }

    // Guardar usuario logueado
    localStorage.setItem("aje_usuario_actual", JSON.stringify(usuario));

    // Ir al dashboard
    window.location.href = "dashboard.html";
}
