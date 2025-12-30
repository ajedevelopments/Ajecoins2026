document.getElementById("fileInput").addEventListener("change", function (e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
        const text = event.target.result;
        const lines = text.split("\n");

        const data = [];

        // Empieza desde 1 para saltar encabezados
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].trim();
            if (row === "") continue;

            const cols = row.split(",");

            const registro = {
                fecha: cols[0],
                cedula: cols[1],
                nombre: cols[2],
                cedis: cols[3],
                coins: Number(cols[4])
            };

            data.push(registro);
        }

        localStorage.setItem("aje_coins_data", JSON.stringify(data));

        document.getElementById("status").innerText =
            "Archivo cargado correctamente. Registros: " + data.length;
    };

    reader.readAsText(file);
});
