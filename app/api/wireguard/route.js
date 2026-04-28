export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const NETWORKS_PATH = path.join(DATA_DIR, 'networks.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

const leerUsuarios = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]');
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) { return []; }
};

export async function GET() { 
  return NextResponse.json(leerUsuarios()); 
}

export async function POST(request) {
  try {
    const { name, networkName } = await request.json();
    if (!fs.existsSync(SETTINGS_PATH)) throw new Error("Faltan ajustes del router.");
    
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    const networks = fs.existsSync(NETWORKS_PATH) ? JSON.parse(fs.readFileSync(NETWORKS_PATH, 'utf8')) : [];
    const target = networks.find(n => n.name === networkName);

    if (!target) throw new Error("La red seleccionada no existe.");

    const { routerHost, routerPort, routerUser, routerPass } = settings;
    const auth = `Basic ${Buffer.from(`${routerUser}:${routerPass}`).toString('base64')}`;

    // 1. Generar claves del cliente
    const { publicKey: pub, privateKey: priv } = crypto.generateKeyPairSync('x25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });
    const cPub = pub.subarray(12).toString('base64');
    const cPriv = priv.subarray(16).toString('base64');

    // 2. Calcular IP del cliente
    const db = leerUsuarios();
    const baseIP = target.network.split('.').slice(0, 3).join('.');
    const usados = db.filter(u => u.network === networkName).map(u => parseInt(u.ip.split('.')[3]));
    let octeto = 2;
    while (usados.includes(octeto)) octeto++;
    const clientIP = `${baseIP}.${octeto}`;

    // 3. Obtener la IP del Router para usarla como DNS
    // target.routerIp suele venir como "172.10.0.1/24", necesitamos solo "172.10.0.1"
    const dnsIP = target.routerIp.split('/')[0];

    // 4. Registrar el Peer en el MikroTik
    const resRouter = await fetch(`http://${routerHost}:${routerPort}/rest/interface/wireguard/peers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': auth },
      body: JSON.stringify({ 
        "interface": networkName, 
        "public-key": cPub, 
        "allowed-address": `${clientIP}/32`, 
        "comment": name 
      })
    });

    if (!resRouter.ok) throw new Error("Fallo MikroTik: " + await resRouter.text());

    // 5. Generar configuración con el DNS dinámico
    const config = `[Interface]
PrivateKey = ${cPriv}
Address = ${clientIP}/24
DNS = ${dnsIP}

[Peer]
PublicKey = ${target.publicKey}
Endpoint = ${settings.endpoint}:${target.port}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;

    const nuevo = { 
      id: Date.now(), 
      name, 
      network: networkName, 
      ip: clientIP, 
      config, 
      date: new Date().toLocaleDateString() 
    };
    
    db.push(nuevo);
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

    return NextResponse.json({ success: true, user: nuevo });
  } catch (e) { 
    return NextResponse.json({ success: false, error: e.message }, { status: 500 }); 
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    let db = leerUsuarios();
    const usuario = db.find(u => u.id === id);
    if (!usuario) throw new Error("Usuario no encontrado.");

    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    const { routerHost, routerPort, routerUser, routerPass } = settings;
    const auth = `Basic ${Buffer.from(`${routerUser}:${routerPass}`).toString('base64')}`;

    const search = await fetch(`http://${routerHost}:${routerPort}/rest/interface/wireguard/peers?comment=${usuario.name}`, { headers: { 'Authorization': auth } });
    const peers = await search.json();
    const p = Array.isArray(peers) ? peers[0] : peers;

    if (p && p['.id']) {
      await fetch(`http://${routerHost}:${routerPort}/rest/interface/wireguard/peers/${p['.id']}`, { method: 'DELETE', headers: { 'Authorization': auth } });
    }

    const nuevaDB = db.filter(u => u.id !== id);
    fs.writeFileSync(DB_PATH, JSON.stringify(nuevaDB, null, 2));
    return NextResponse.json({ success: true });
  } catch (e) { 
    return NextResponse.json({ success: false, error: e.message }, { status: 500 }); 
  }
}