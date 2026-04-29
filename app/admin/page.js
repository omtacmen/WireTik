'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [routerHost, setRouterHost] = useState('');
  const [routerPort, setRouterPort] = useState('80');
  const [routerUser, setRouterUser] = useState('');
  const [routerPass, setRouterPass] = useState('');
  const [externalIp, setExternalIp] = useState('');
  
  const [savedNetworks, setSavedNetworks] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [logs, setLogs] = useState([]); 
  
  // NUEVOS ESTADOS PARA LA CREACIÓN DE RED
  const [createLogs, setCreateLogs] = useState([]); 
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState('wireguard1');
  const [port, setPort] = useState('13231');
  const [network, setNetwork] = useState('172.10.0.0');
  const [routerIp, setRouterIp] = useState('172.10.0.1/24');

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      setRouterHost(data.routerHost || '');
      setRouterPort(data.routerPort || '80');
      setRouterUser(data.routerUser || '');
      setRouterPass(data.routerPass || '');
      setExternalIp(data.endpoint || '');
    });
    fetchNetworks(false);
  }, []);

  const fetchNetworks = async (sync = false) => {
    if (sync) setIsSyncing(true);
    try {
      const res = await fetch(`/api/admin/wireguard${sync ? '?sync=true' : ''}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setSavedNetworks(data);
    } catch (err) { console.error(err); }
    finally { if (sync) setIsSyncing(false); }
  };

  const handleFullCheckAndSave = async (onlyTest = false) => {
    setIsTesting(true);
    setLogs(["⏳ Iniciando diagnóstico..."]);
    try {
      const res = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routerHost, routerPort, routerUser, routerPass })
      });
      const data = await res.json();
      setLogs(data.logs || []);

      if (data.success) {
        if (data.publicEndpoint) setExternalIp(data.publicEndpoint);
        if (!onlyTest) {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ routerHost, routerPort, routerUser, routerPass, endpoint: data.publicEndpoint || externalIp })
          });
          setLogs(prev => [...prev, "💾 Ajustes guardados localmente con éxito."]);
        }
      }
    } catch (e) { setLogs(prev => [...prev, "❌ Error crítico de comunicación."]); } 
    finally { setIsTesting(false); }
  };

  // NUEVA LÓGICA DE CREACIÓN CON FEEDBACK
  const handleCreate = async () => {
    setIsCreating(true);
    setCreateLogs([`⏳ Iniciando creación de la interfaz "${name}"...`]);
    
    try {
      setCreateLogs(prev => [...prev, `📡 Enviando comandos al router...`]);
      const res = await fetch('/api/admin/wireguard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, port, network, routerIp })
      });
      const data = await res.json();
      
      if (data.success) { 
        setCreateLogs(prev => [...prev, `✅ Interfaz y reglas IP creadas correctamente.`]);
        setCreateLogs(prev => [...prev, `🔄 Sincronizando tabla de redes...`]);
        await fetchNetworks(true); 
        setCreateLogs(prev => [...prev, `🎉 Proceso finalizado con éxito.`]);
      } else { 
        setCreateLogs(prev => [...prev, `❌ Error del MikroTik: ${data.error}`]);
        
        // Añadimos pistas visuales dependiendo del error
        if (data.error.includes('port')) {
          setCreateLogs(prev => [...prev, `💡 Pista: El puerto ${port} ya está siendo usado por otro servicio en el router.`]);
        } else if (data.error.includes('name')) {
          setCreateLogs(prev => [...prev, `💡 Pista: Ya existe una interfaz llamada "${name}". Prueba con otro nombre.`]);
        } else if (data.error.includes('address')) {
          setCreateLogs(prev => [...prev, `💡 Pista: La IP ${routerIp} choca con otra IP o red existente.`]);
        }
      }
    } catch (e) {
      setCreateLogs(prev => [...prev, `❌ Error de red interno: No se pudo contactar con el backend.`]);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNetwork = async (networkName) => {
    if (!confirm(`¿Estás seguro de que quieres borrar la red ${networkName}? Se eliminará del router.`)) return;
    try {
      const res = await fetch('/api/admin/wireguard', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: networkName })
      });
      const data = await res.json();
      if (data.success) fetchNetworks(true);
      else alert("❌ Error al borrar: " + data.error);
    } catch (e) { alert("❌ Error de comunicación con el servidor."); }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#1e293b', margin: '0 0 10px 0' }}>⚙️ WireTik</h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0, fontWeight: '500' }}>
          Crea tu red VPN WireGuard en Mikrotik desde GUI
        </p>
      </div>
      
      <section style={secStyle}>
        <h3>🔌 Conexión y Credenciales MikroTik</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div><label style={labStyle}>IP MikroTik</label><input value={routerHost} onChange={e => setRouterHost(e.target.value)} style={inStyle} /></div>
          <div><label style={labStyle}>Puerto API</label><input value={routerPort} onChange={e => setRouterPort(e.target.value)} style={inStyle} /></div>
          <div><label style={labStyle}>Usuario</label><input value={routerUser} onChange={e => setRouterUser(e.target.value)} style={inStyle} /></div>
          <div><label style={labStyle}>Contraseña</label><input type="password" value={routerPass} onChange={e => setRouterPass(e.target.value)} style={inStyle} /></div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labStyle}>Endpoint Público (IP/DNS Externo) - Se rellena solo al Guardar</label>
          <input value={externalIp} onChange={e => setExternalIp(e.target.value)} style={inStyle} placeholder="Autocompletado al guardar..." />
        </div>

        {logs.length > 0 && (
          <div style={logPanelStyle}>
            {logs.map((log, i) => <div key={i} style={{ marginBottom: '4px' }}>{log}</div>)}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button onClick={() => handleFullCheckAndSave(true)} disabled={isTesting} style={{...btnPri, background: '#f59e0b', flex: 1}}>
            {isTesting ? '⏳ Probando...' : '📡 Solo Probar'}
          </button>
          <button onClick={() => handleFullCheckAndSave(false)} disabled={isTesting} style={{...btnPri, background: '#10b981', flex: 1}}>
            💾 Guardar y Diagnosticar
          </button>
        </div>
      </section>

      <section style={{...secStyle, background: 'white'}}>
        <h3>🛰️ Crear nueva interfaz WireGuard en Mikrotik</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
          <div>
            <label style={labStyle}>Nombre de la Interfaz</label>
            <span style={descStyle}>Nombre identificativo en WinBox (ej: wireguard1)</span>
            <input value={name} onChange={e => setName(e.target.value)} style={inStyle} />
          </div>
          <div>
            <label style={labStyle}>Puerto de Escucha</label>
            <span style={descStyle}>Puerto UDP que usarán los clientes (ej: 13231)</span>
            <input value={port} onChange={e => setPort(e.target.value)} style={inStyle} />
          </div>
          <div>
            <label style={labStyle}>IP del Router en la VPN</label>
            <span style={descStyle}>IP interna del MikroTik con prefijo (ej: 172.10.0.1/24)</span>
            <input value={routerIp} onChange={e => setRouterIp(e.target.value)} style={inStyle} />
          </div>
          <div>
            <label style={labStyle}>Dirección de Red</label>
            <span style={descStyle}>Rango base de IPs para los clientes (ej: 172.10.0.0)</span>
            <input value={network} onChange={e => setNetwork(e.target.value)} style={inStyle} />
          </div>
        </div>

        {/* NUEVO PANEL DE LOGS DE CREACIÓN */}
        {createLogs.length > 0 && (
          <div style={{...logPanelStyle, background: '#0f172a', marginBottom: '20px'}}>
            {createLogs.map((log, i) => (
              <div key={i} style={{ marginBottom: '6px', color: log.includes('❌') ? '#f87171' : log.includes('💡') ? '#fbbf24' : '#38bdf8' }}>
                {log}
              </div>
            ))}
          </div>
        )}

        <button onClick={handleCreate} disabled={isCreating} style={{...btnPri, width: '100%'}}>
          {isCreating ? '⏳ Creando...' : '🚀 Crear Interfaz en Router'}
        </button>
      </section>

      <section style={{...secStyle, padding: 0, overflow: 'hidden', background: 'white'}}>
        <div style={{padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h3 style={{margin: 0}}>📋 Redes VPN en Router</h3>
          <button onClick={() => fetchNetworks(true)} disabled={isSyncing} style={btnSec}>
            {isSyncing ? '🔄 Sincronizando...' : '🔄 Sincronizar'}
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr><th style={thStyle}>Nombre</th><th style={thStyle}>Red</th><th style={thStyle}>Puerto</th><th style={thStyle}>Acción</th></tr>
          </thead>
          <tbody>
            {savedNetworks.map(net => (
              <tr key={net.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={tdStyle}>{net.name}</td>
                <td style={tdStyle}>{net.network}</td>
                <td style={tdStyle}><span style={{background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', color: '#475569'}}>{net.port}</span></td>
                <td style={tdStyle}>
                  {net.comment === 'mikroguard' ? (
                    <button onClick={() => handleDeleteNetwork(net.name)} style={{...btnSec, background: '#ef4444'}}>🗑️ Borrar</button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#64748b' }}>🔒 Creada en router</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Link href="/" style={{display: 'block', textAlign: 'center', marginTop: '20px', fontWeight: 'bold', color: '#2563eb'}}>Volver a Clientes</Link>
    </div>
  );
}

// Estilos
const secStyle = { background: '#f8fafc', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0' };
const inStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' };
const logPanelStyle = { background: '#1e293b', color: '#34d399', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', maxHeight: '150px', overflowY: 'auto', marginBottom: '15px' };
const btnPri = { padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const btnSec = { padding: '8px 12px', background: '#475569', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const thStyle = { padding: '12px', textAlign: 'left' };
const tdStyle = { padding: '12px' };
const labStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' };
const descStyle = { display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '8px' };