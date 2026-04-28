'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PanelVPN() {
  const [users, setUsers] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [newName, setNewName] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDatos = () => {
    const t = Date.now();
    fetch(`/api/wireguard?t=${t}`).then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : []));
    fetch(`/api/admin/wireguard?t=${t}`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        setNetworks(d);
        fetch('/api/settings').then(r => r.json()).then(s => setSelectedNetwork(s.activeNetwork || (d[0]?.name || '')));
      }
    });
  };

  useEffect(() => { fetchDatos(); }, []);

  const handleCreate = () => {
    if (!newName) return alert("Escribe un nombre");
    setLoading(true);
    fetch('/api/wireguard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, networkName: selectedNetwork })
    }).then(r => r.json()).then(data => {
      setLoading(false);
      if (data.success) {
        setNewName('');
        fetchDatos();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([data.user.config], { type: 'text/plain' }));
        a.download = `VPN_${data.user.name.replace(/\s/g, '_')}.conf`;
        a.click();
      } else { alert("Error: " + data.error); }
    });
  };

  const handleDelete = (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar a ${nombre}? La IP quedará libre para otro usuario.`)) return;
    
    fetch('/api/wireguard', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).then(r => r.json()).then(data => {
      if (data.success) {
        fetchDatos();
      } else { alert("Error al borrar: " + data.error); }
    });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🔐 Clientes WireGuard</h1>
        <Link href="/admin" style={{ padding: '8px 15px', background: '#e2e8f0', borderRadius: '20px', textDecoration: 'none', color: '#334155', fontWeight: 'bold' }}>Administración</Link>
      </div>

      <section style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input placeholder="Nombre dispositivo" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 2, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
          <select value={selectedNetwork} onChange={e => setSelectedNetwork(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '5px' }}>
            {networks.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
          </select>
          <button onClick={handleCreate} disabled={loading} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Creando...' : 'Crear VPN'}
          </button>
        </div>
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <thead style={{ background: '#f8fafc' }}>
          <tr>
            <th style={thS}>Dispositivo</th>
            <th style={thS}>Red</th>
            <th style={thS}>IP</th>
            <th style={thS}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={tdS}><strong>{u.name}</strong></td>
              <td style={tdS}>{u.network}</td>
              <td style={tdS}><code style={{color: '#2563eb'}}>{u.ip}</code></td>
              <td style={tdS}>
                <button onClick={() => { 
                  const a = document.createElement('a'); 
                  a.href = URL.createObjectURL(new Blob([u.config], { type: 'text/plain' })); 
                  a.download = `VPN_${u.name}.conf`; 
                  a.click(); 
                }} style={btnD}>Descargar</button>
                
                <button onClick={() => handleDelete(u.id, u.name)} style={btnE}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thS = { padding: '15px', textAlign: 'left', fontSize: '14px', color: '#64748b' };
const tdS = { padding: '15px', fontSize: '14px' };
const btnD = { padding: '5px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' };
const btnE = { padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };