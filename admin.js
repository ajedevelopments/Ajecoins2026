(function() {
  const { useState, useEffect } = React;
  const { createRoot } = ReactDOM;

  function AdminPanel() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔹 Cargar usuarios desde Firestore
    const loadUsuarios = async () => {
      setLoading(true);
      try {
        const snapshot = await db.collection("usuarios").get();
        const data = snapshot.docs.map(doc => doc.data());
        setUsuarios(data);
      } catch (err) {
        console.error("Error cargando usuarios:", err);
        alert("Error cargando usuarios desde Firebase");
      }
      setLoading(false);
    };

    useEffect(() => {
      loadUsuarios();
    }, []);

    return React.createElement("div", {className:"p-6"},
      React.createElement("h1", {className:"text-2xl font-bold text-green-800 mb-4"}, "Usuarios"),
      loading ? 
        React.createElement("p", {className:"text-green-700"}, "Cargando usuarios...") :
        React.createElement("div", {className:"overflow-x-auto"},
          React.createElement("table", {className:"w-full border-collapse"},
            React.createElement("thead", {className:"bg-green-50"},
              React.createElement("tr", null,
                ["Fecha", "Cédula", "Nombre", "CEDIS", "Coins"].map(h => 
                  React.createElement("th", {className:"px-4 py-2 text-green-800 font-semibold text-left"}, h)
                )
              )
            ),
            React.createElement("tbody", null,
              usuarios.map((u, i) => 
                React.createElement("tr", {key:i, className:"hover:bg-gray-50"},
                  React.createElement("td", {className:"px-4 py-2"}, u.fecha),
                  React.createElement("td", {className:"px-4 py-2 font-medium"}, u.cedula),
                  React.createElement("td", {className:"px-4 py-2"}, u.nombre),
                  React.createElement("td", {className:"px-4 py-2"}, u.cedis),
                  React.createElement("td", {className:"px-4 py-2 text-green-600 font-semibold"}, u.coins_ganados)
                )
              )
            )
          )
        )
    );
  }

  const root = createRoot(document.getElementById("root"));
  root.render(React.createElement(AdminPanel));
})();
