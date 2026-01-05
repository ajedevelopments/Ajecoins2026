(function() {
  const { useState, useEffect } = React;
  const { createRoot } = ReactDOM;

  function AdminPanel() {
    const [activeTab, setActiveTab] = useState("usuarios");
    const [usuarios, setUsuarios] = useState([]);
    const [productos, setProductos] = useState([]);
    const [canjes, setCanjes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Cargar datos Firestore
    const loadData = async () => {
      setLoading(true);
      try {
        const usuariosSnap = await db.collection("usuarios").get();
        setUsuarios(usuariosSnap.docs.map(d => d.data()));

        const productosSnap = await db.collection("productos").get();
        setProductos(productosSnap.docs.map(d => d.data()));

        const canjesSnap = await db.collection("canjes").get();
        setCanjes(canjesSnap.docs.map(d => d.data()));
      } catch(e) {
        console.error(e);
        alert("Error cargando datos");
      }
      setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    return React.createElement("div", {className:"p-6"},
      React.createElement("h1",{className:"text-2xl font-bold text-green-800 mb-4"},"AjeCoins Admin"),
      React.createElement("button",{onClick:loadData,className:"bg-green-600 text-white px-4 py-2 rounded mb-4"},"Actualizar"),
      loading ? React.createElement("p", {className:"text-green-700"},"Cargando...") : React.createElement("div", null,
        React.createElement("h2", {className:"font-bold"},"Usuarios"),
        React.createElement("ul", null, usuarios.map(u => React.createElement("li", null, `${u.nombre} (${u.coins_ganados} coins)`))),
        React.createElement("h2", {className:"font-bold mt-4"},"Productos"),
        React.createElement("ul", null, productos.map(p => React.createElement("li", null, `${p.nombre} - ${p.coins} coins`))),
        React.createElement("h2", {className:"font-bold mt-4"},"Canjes"),
        React.createElement("ul", null, canjes.map(c => React.createElement("li", null, `${c.nombre} canjeó ${c.producto} (-${c.coins_gastados} coins)`)))
      )
    );
  }

  const root = createRoot(document.getElementById("root"));
  root.render(React.createElement(AdminPanel));
})();
