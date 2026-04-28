import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const settingsPath = path.join(process.cwd(), 'settings.json');
    if (!fs.existsSync(settingsPath)) throw new Error("Configura primero la conexión al router");
    
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const { routerHost, routerPort } = settings;
    
    const auth = `Basic ${Buffer.from(`${process.env.ROUTEROS_USERNAME}:${process.env.ROUTEROS_PASSWORD}`).toString('base64')}`;

    // Consultamos IP Cloud en el MikroTik
    const response = await fetch(`http://${routerHost}:${routerPort}/rest/ip/cloud`, {
      headers: { 'Authorization': auth },
      next: { revalidate: 0 } // Evitar caché
    });

    if (!response.ok) throw new Error("No se pudo obtener respuesta de la API del router");

    const data = await response.json();
    
    // CORRECCIÓN: MikroTik devuelve un objeto directo en este endpoint.
    // Buscamos primero el dns-name (que es mejor para VPN) y si no, la IP.
    // También añadimos compatibilidad por si en el futuro MikroTik lo cambia a un Array.
    const dnsName = data['dns-name'] || (Array.isArray(data) && data[0]?.['dns-name']);
    const publicIp = data['public-address'] || (Array.isArray(data) && data[0]?.['public-address']);

    // Damos prioridad absoluta al dominio de DDNS
    const finalEndpoint = dnsName || publicIp;

    if (!finalEndpoint) throw new Error("No se encontró ni IP ni DNS en la respuesta.");

    return NextResponse.json({ success: true, publicIp: finalEndpoint });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}