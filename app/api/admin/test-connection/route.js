export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const logs = [];
  try {
    const { routerHost, routerPort, routerUser, routerPass } = await request.json();
    const auth = `Basic ${Buffer.from(`${routerUser}:${routerPass}`).toString('base64')}`;
    const baseUrl = `http://${routerHost}:${routerPort}/rest`;

    logs.push("🔍 Iniciando secuencia de comprobación...");

    // 1. Prueba de Identidad y Autenticación
    const idRes = await fetch(`${baseUrl}/system/identity`, { headers: { 'Authorization': auth } });
    if (!idRes.ok) throw new Error(idRes.status === 401 ? "Credenciales inválidas." : "No se puede alcanzar el router.");
    const idData = await idRes.json();
    logs.push(`✅ Conexión establecida con el router: ${idData.name}`);

    // 2. Verificar si WireGuard está disponible
    const wgRes = await fetch(`${baseUrl}/interface/wireguard`, { headers: { 'Authorization': auth } });
    if (!wgRes.ok) logs.push("⚠️ Advertencia: No se pudo acceder a WireGuard. ¿Está instalada la v7?");
    else logs.push("✅ Soporte para WireGuard verificado.");

    // 3. Obtener IP Externa / Cloud DNS (La automatización)
    logs.push("🌐 Intentando recuperar dirección externa (MikroTik Cloud)...");
    const cloudRes = await fetch(`${baseUrl}/ip/cloud`, { headers: { 'Authorization': auth } });
    let publicEndpoint = "";
    if (cloudRes.ok) {
      const cloudData = await cloudRes.json();
      publicEndpoint = cloudData['dns-name'] || cloudData['public-address'] || "";
      if (publicEndpoint) logs.push(`✅ Endpoint recuperado: ${publicEndpoint}`);
    } else {
      logs.push("ℹ️ No se pudo obtener IP de Cloud. Se usará la actual.");
    }

    // 4. Comprobar recursos de red
    const addrRes = await fetch(`${baseUrl}/ip/address`, { headers: { 'Authorization': auth } });
    if (addrRes.ok) logs.push("✅ Permisos de lectura de red confirmados.");

    return NextResponse.json({ 
      success: true, 
      logs, 
      publicEndpoint, 
      message: "Auditoría completada con éxito." 
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      logs: [...logs, `❌ ERROR: ${error.message}`], 
      error: error.message 
    }, { status: 500 });
  }
}