import React, { useState, useEffect } from "https://cdn.skypack.dev/react";
import { createRoot } from "https://cdn.skypack.dev/react-dom/client";
import { collection, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const { Upload, Users, Package, ArrowDownToLine, Calendar, RefreshCw } = window.lucide;

function AdminPanel() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [canjes, setCanjes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  // Cargar datos desde Firestore
  const loadData = async () => {
    setLoading(true);
    try {
      const usuariosSnap = await getDocs(collection(window.db, "usuarios"));
      setUsuarios(usuariosSnap.docs.map(d => d.data()));

      const productosSnap = await getDocs(collection(window.db, "productos"));
      setProductos(productosSnap.docs.map(d => d.data()));

      const canjesSnap = await getDocs(collection(window.db, "canjes"));
      setCanjes(canjesSnap.docs.map(d => d.data()));
    } catch (err) {
      console.error(err);
      alert("Error cargando datos de Firebase");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Subida de CSV
  const handleFileUpload = async (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      if (tipo === "usuarios") {
        const data = lines.slice(1).map(line => {
          const [fecha, cedula, nombre, cedis, coins_ganados] = line.split(",");
          return { fecha, cedula, nombre, cedis, coins_ganados: parseInt(coins_ganados) || 0 };
        }).filter(u => u.cedula);

        for (const u of data) await setDoc(doc(window.db, "usuarios", u.cedula), u);
        setUsuarios(data);

      } else if (tipo === "productos") {
        const data = lines.slice(1).map((line, index) => {
          const [nombre, coins] = line.split(",");
          return { id: `prod_${index+1}`, nombre, coins: parseInt(coins) || 0 };
        }).filter(p => p.nombre);

        for (const p of data) await setDoc(doc(window.db, "productos", p.id), p);
        setProductos(data);
      }
      alert(`✅ ${tipo} cargados correctamente`);
    } catch (err) {
      console.error(err);
      alert("❌ Error al procesar archivo");
    }
    setLoading(false);
    e.target.value = "";
  };

  // Filtrar canjes por fecha
  const filteredCanjes = canjes.filter(c => {
    const canjeDate = new Date(c.fecha_solicitud);
    const start = dateFilter.start ? new Date(dateFilter.start) : new Date("1900-01-01");
    const end = dateFilter.end ? new Date(dateFilter.end) : new Date("2100-12-31");
    return canjeDate >= start && canjeDate <= end;
  });

  // Descargar canjes
  const downloadCanjes = () => {
    const csv = [
      "Fecha,Cédula,Nombre,Producto,Coins Gastados",
      ...filteredCanjes.map(c => `${c.fecha_solicitud},${c.cedula},${c.nombre},${c.producto},${c.coins_gastados}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `canjes_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">AjeCoins Admin</h1>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded">
          <RefreshCw size={18}/> Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {["usuarios","productos","canjes"].map(tab => (
          <button key={tab} onClick={()=>setActiveTab(tab)}
            className={`px-4 py-2 rounded ${activeTab===tab?'bg-green-600 text-white':'bg-white text-green-700 border border-green-300'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading && <p className="text-green-700">Cargando...</p>}

      {!loading && activeTab==="usuarios" && (
        <div>
          <label className="flex items-center gap-2 bg-green-50 p-4 rounded cursor-pointer mb-2">
            <Upload size={20} className="text-green-600"/>
            <span>Cargar CSV Usuarios</span>
            <input type="file" accept=".csv" onChange={e=>handleFileUpload(e,"usuarios")} className="hidden"/>
          </label>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-4 py-2 text-green-800 font-semibold">Fecha</th>
                  <th className="px-4 py-2 text-green-800 font-semibold">Cédula</th>
                  <th className="px-4 py-2 text-green-800 font-semibold">Nombre</th>
                  <th className="px-4 py-2 text-green-800 font-semibold">CEDIS</th>
                  <th className="px-4 py-2 text-green-800 font-semibold">Coins</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u,i)=>
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{u.fecha}</td>
                    <td className="px-4 py-2 font-medium">{u.cedula}</td>
                    <td className="px-4 py-2">{u.nombre}</td>
                    <td className="px-4 py-2">{u.cedis}</td>
                    <td className="px-4 py-2 text-green-600 font-semibold">{u.coins_ganados}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab==="productos" && (
        <div>
          <label className="flex items-center gap-2 bg-green-50 p-4 rounded cursor-pointer mb-4">
            <Upload size={20} className="text-green-600"/>
            <span>Cargar CSV Productos</span>
            <input type="file" accept=".csv" onChange={e=>handleFileUpload(e,"productos")} className="hidden"/>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productos.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow p-4 border border-green-100">
                <img src={`assets/productos/${p.nombre}.png`} alt={p.nombre} className="w-full h-32 object-contain mb-2"/>
                <h3 className="font-semibold text-gray-800">{p.nombre}</h3>
                <p className="text-green-600 font-bold">{p.coins} coins</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && activeTab==="canjes" && (
        <div>
          <div className="flex gap-2 mb-2 flex-wrap">
            <input type="date" value={dateFilter.start} onChange={e=>setDateFilter({...dateFilter,start:e.target.value})} className="border p-2 rounded"/>
            <input type="date" value={dateFilter.end} onChange={e=>setDateFilter({...dateFilter,end:e.target.value})} className="border p-2 rounded"/>
            <button onClick={downloadCanjes} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1">
              <ArrowDownToLine size={16}/> Descargar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-4 py-2 text-green-800 font-semibold">Fecha</th>
                  <th className="px-4 py-2 text-green-800 font-semibold">Cédula</th>
                  <th className="px-4 py-2 text-green-800 font-semibold">Nombre</th>
                  <th className="px-4 py-2 text-green-800 font-semibold">Producto</th>
                  <th className="px-4 py-2 text-green-800 font-semibold">Coins</th>
                </tr>
              </thead>
              <tbody>
                {filteredCanjes.map((c,i)=>
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{c.fecha_solicitud}</td>
                    <td className="px-4 py-2 font-medium">{c.cedula}</td>
                    <td className="px-4 py-2">{c.nombre}</td>
                    <td className="px-4 py-2">{c.producto}</td>
                    <td className="px-4 py-2 text-red-600 font-semibold">-{c.coins_gastados}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// Render
const root = createRoot(document.getElementById("root"));
root.render(<AdminPanel />);
