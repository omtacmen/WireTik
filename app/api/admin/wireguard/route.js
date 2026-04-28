export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const NETWORKS_PATH = path.join(DATA_DIR, 'networks.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

// Función auxiliar para garantizar que los archivos existen
const ensureFiles = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(NETWORKS_PATH)) fs.writeFileSync(NETWORKS_PATH, '[]');
};

export async function GET(request) {
  ensureFiles();
  const { searchParams } = new URL(request.url);
  if (searchParams.get('sync') === 'true') {
    try {
      if (!fs.existsSync(SETTINGS_PATH)) throw new Error("Configura la IP y credenciales primero.");
      const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
      const { routerHost, routerPort, routerUser, routerPass } = settings;

      const auth = `Basic ${Buffer.from(`${routerUser}:${routerPass}`).toString('base64')}`;
      const baseUrl = `http://${routerHost}:${routerPort}/rest`;

      const wgRes = await fetch(`${baseUrl}/interface/wireguard`, { headers: { 'Authorization': auth } });
      if (!wgRes.ok) throw new Error("Conexión o credenciales incorrectas en el MikroTik.");
      
      let data = await wgRes.json();
      let wgInterfaces = Array.isArray(data) ? data : (data ? [data] : []);

      const ipRes = await fetch(`${baseUrl}/ip/address`, { headers: { 'Authorization': auth } });
      let ipData = [];
      if (ipRes.ok) {
        let parsedIp = await ipRes.json();
        ipData = Array.isArray(parsedIp) ? parsedIp : (parsedIp ? [parsedIp] : []);
      }

      const synced = wgInterfaces.map(wg => {
        const addr = ipData.find(a => a.interface === wg.name);
        return {
          id: wg['.id'] || Math.random().toString(36).substr(2, 9),
          name: wg.name,
          port: wg['listen-port'],
          publicKey: wg['public-key'],
          routerIp: addr ? addr.address : 'Sin IP',
          network: addr ? addr.network : '172.10.0.0/24',
          comment: wg.comment || '',
          date: new Date().toLocaleDateString()
        };
      });

      fs.writeFileSync(NETWORKS_PATH, JSON.stringify(synced, null, 2));
      return NextResponse.json(synced);
    } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }
  return NextResponse.json(JSON.parse(fs.readFileSync(NETWORKS_PATH, 'utf8')));
}

export async function POST(request) {
  ensureFiles();
  try {
    const { name, port, routerIp, network } = await request.json();
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    const { routerHost, routerPort, routerUser, routerPass } = settings;
    const auth = `Basic ${Buffer.from(`${routerUser}:${routerPass}`).toString('base64')}`;
    const baseUrl = `http://${routerHost}:${routerPort}/rest`;

    await fetch(`${baseUrl}/interface/wireguard`, {
      method: 'PUT',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "name": name, "listen-port": parseInt(port), "comment": "mikroguard" })
    });

    await fetch(`${baseUrl}/ip/address`, {
      method: 'PUT',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "address": routerIp, "network": network, "interface": name, "comment": "mikroguard" })
    });

    const info = await fetch(`${baseUrl}/interface/wireguard?name=${name}`, { headers: { 'Authorization': auth } });
    const data = await info.json();
    const realKey = Array.isArray(data) ? data[0]['public-key'] : data['public-key'];
    
    const newNet = { id: Date.now(), name, port, network, routerIp, publicKey: realKey, comment: "mikroguard", date: new Date().toLocaleDateString() };
    const db = JSON.parse(fs.readFileSync(NETWORKS_PATH, 'utf8'));
    db.push(newNet);
    fs.writeFileSync(NETWORKS_PATH, JSON.stringify(db, null, 2));

    return NextResponse.json({ success: true, serverPublicKey: realKey });
  } catch (e) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(request) {
  ensureFiles();
  try {
    const { name } = await request.json();
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    const { routerHost, routerPort, routerUser, routerPass } = settings;
    const auth = `Basic ${Buffer.from(`${routerUser}:${routerPass}`).toString('base64')}`;
    const baseUrl = `http://${routerHost}:${routerPort}/rest`;

    const wgRes = await fetch(`${baseUrl}/interface/wireguard?name=${name}`, { headers: { 'Authorization': auth } });
    const wgData = await wgRes.json();
    const wgInterface = Array.isArray(wgData) ? wgData[0] : wgData;

    if (!wgInterface) throw new Error("La interfaz no existe en el router.");
    if (wgInterface.comment !== "mikroguard") {
      throw new Error("Protección activa: Esta red no fue creada por la aplicación y no se puede borrar.");
    }

    const ipRes = await fetch(`${baseUrl}/ip/address?interface=${name}`, { headers: { 'Authorization': auth } });
    const ipData = await ipRes.json();
    const ipAddr = Array.isArray(ipData) ? ipData[0] : ipData;
    
    if (ipAddr && ipAddr['.id']) {
      await fetch(`${baseUrl}/ip/address/${ipAddr['.id']}`, { method: 'DELETE', headers: { 'Authorization': auth } });
    }

    await fetch(`${baseUrl}/interface/wireguard/${wgInterface['.id']}`, { method: 'DELETE', headers: { 'Authorization': auth } });

    let db = JSON.parse(fs.readFileSync(NETWORKS_PATH, 'utf8'));
    db = db.filter(n => n.name !== name);
    fs.writeFileSync(NETWORKS_PATH, JSON.stringify(db, null, 2));

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}