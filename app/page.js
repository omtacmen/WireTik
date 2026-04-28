'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [clients, setClients] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [clientName, setClientName] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetch('/api/wireguard').then(res => res.json()).then(data => setClients(data));
    fetch('/api/admin/wireguard').then(res => res.json()).then(data => {
      setNetworks(data);
      if (data.length > 0) setSelectedNetwork(data[0].name);
    });
  }, []);

  const handleCreate = async () => {
    if (!clientName || !selectedNetwork) return alert("Rellena el nombre y selecciona una red.");
    setIsCreating(true);
    try {
      const res = await fetch('/api/wireguard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clientName, networkName: selectedNetwork })
      });
      const data = await res.json();
      if (data.success) {
        setClients(prev => [...prev, data.user]);
        setClientName('');
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Error de red.");
    }
    setIsCreating(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Borrar este cliente?")) return;
    try {
      const res = await fetch('/api/wireguard', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setClients(clients.filter(c => c.id !== id));
      }
    } catch (e) {
      alert("Error al borrar.");
    }
  };

  const downloadConfig = (client) => {
    const element = document.createElement("a");
    const file = new Blob([client.config], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${client.name}.conf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      
      {/* NUEVA CABECERA WIRETIK */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '2.8rem', color: '#1e293b', margin: '0 0 5px 0' }}>🌐 WireTik</h1>
          <p style={{ fontSize: '1.2rem', color: '#64748b', margin: 0, fontWeight: '500' }}>
            Crea tu red VPN WireGuard en Mikrotik desde GUI
          </p>
        </div>
        <Link href="/admin" style={btnAdmin}>⚙️ Administración</Link>
      </div>

      <section style={secStyle}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input 
            placeholder="Nombre del dispositivo (ej: movil-juan)" 
            value={clientName} 
            onChange={e => setClientName(e.target.value)} 
            style={inStyle} 
          />
          <select value={selectedNetwork} onChange={e => setSelectedNetwork(e.target.value)} style={selectStyle}>
            {networks.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
          </select>
          <button onClick={handleCreate} disabled={isCreating} style={btnPri}>
            {isCreating ? 'Creando...' : 'Crear Cliente'}
          </button>
        </div>
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          <tr>
            <th style={thStyle}>Dispositivo</th>
            <th style={thStyle}>Red</th>
            <th style={thStyle}>IP</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}><strong>{c.name}</strong></td>
              <td style={tdStyle}>{c.network}</td>
              <td style={tdStyle}>{c.ip}</td>
              <td style={tdStyle}>
                <button onClick={() => downloadConfig(c)} style={btnSec}>⬇️ Descargar .conf</button>
                <button onClick={() => handleDelete(c.id)} style={{...btnSec, background: '#ef4444', marginLeft: '10px'}}>🗑️ Borrar</button>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No hay clientes creados todavía.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const secStyle = { background: '#f8fafc', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0' };
const inStyle = { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', flex: 2, fontSize: '15px' };
const selectStyle = { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', flex: 1, fontSize: '15px', background: 'white' };
const btnPri = { padding: '12px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', minWidth: '130px' };
const btnSec = { padding: '8px 12px', background: '#475569', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' };
const btnAdmin = { padding: '10px 15px', background: '#e2e8f0', color: '#334155', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', border: '1px solid #cbd5e1' };
const thStyle = { padding: '15px', textAlign: 'left', color: '#334155' };
const tdStyle = { padding: '15px', color: '#475569' };