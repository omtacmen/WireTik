export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

const getSettings = () => {
  // Si no existe la carpeta, la crea
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // Si no existe el archivo, lo crea con valores por defecto
  if (!fs.existsSync(SETTINGS_PATH)) {
    const initial = { routerHost: '', routerPort: '80', routerUser: '', routerPass: '', endpoint: '', activeNetwork: '' };
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  
  return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
};

export async function GET() { 
  return NextResponse.json(getSettings()); 
}

export async function POST(request) {
  const newSettings = await request.json();
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2));
  return NextResponse.json({ success: true });
}