'use client'; // Le dice a Next.js que esto se ejecuta en el navegador
import { useState } from 'react';

export default function CreaTuVPN() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const crearUsuario = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/wireguard', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        // Crear un archivo virtual en el navegador y forzar su descarga
        const blob = new Blob([data.configData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'MiConexionVPN.conf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url); // Limpiar memoria
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Fallo al conectar con nuestro propio servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Generador Automático WireGuard</h2>
      <p style={styles.subtitle}>Conecta tu dispositivo al RB5009 en un clic.</p>
      
      <button 
        onClick={crearUsuario} 
        disabled={loading}
        style={{...styles.button, opacity: loading ? 0.7 : 1}}
      >
        {loading ? '⏳ Conectando con el router...' : '🚀 Descargar Perfil VPN'}
      </button>

      {error && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

// Unos estilos básicos para que no se vea feo
const styles = {
  card: {
    backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px', margin: '0 auto',
    textAlign: 'center'
  },
  title: { margin: '0 0 10px 0', color: '#333' },
  subtitle: { color: '#666', marginBottom: '20px' },
  button: {
    backgroundColor: '#0070f3', color: 'white', border: 'none',
    padding: '12px 24px', fontSize: '16px', borderRadius: '6px',
    cursor: 'pointer', width: '100%', fontWeight: 'bold'
  },
  errorBox: {
    marginTop: '20px', padding: '10px', backgroundColor: '#fee2e2',
    color: '#991b1b', borderRadius: '6px', fontSize: '14px'
  }
};