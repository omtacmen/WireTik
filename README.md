# 🛡️ MikroGuard GUI

Un panel de control web moderno, rápido y ligero construido con **Next.js** para gestionar servidores y clientes VPN WireGuard directamente en routers **MikroTik** a través de su API REST.

Olvídate de configurar WireGuard por consola o WinBox. Con MikroGuard puedes desplegar redes, dar de alta dispositivos, asignar IPs automáticamente y descargar los archivos `.conf` listados para usar con un solo clic.

---

## 📑 Tabla de Contenidos
1. [Características Principales](#-características-principales)
2. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
3. [Requisitos Previos](#-requisitos-previos)
4. [Instalación y Despliegue](#-instalación-y-despliegue)
5. [Tutorial de Uso (Primeros Pasos)](#-tutorial-de-uso-primeros-pasos)
6. [Estructura del Proyecto](#-estructura-del-proyecto)
7. [Solución de Problemas (Troubleshooting)](#-solución-de-problemas-troubleshooting)
8. [Seguridad](#-seguridad)

---

## ✨ Características Principales

- **Gestión de Infraestructura:** Crea nuevas interfaces WireGuard (Servidores) directamente desde la web.
- **Sincronización Bidireccional:** Lee las redes WireGuard ya existentes en tu MikroTik para gestionarlas sin conflictos.
- **Generación Nativa de Claves:** Utiliza el motor criptográfico nativo de Node.js (Curve25519) para crear pares de claves seguras en el lado del servidor sin dependencias externas.
- **Gestión Inteligente de IPs:** Asigna la siguiente dirección IP libre automáticamente y recicla las IPs de los usuarios eliminados.
- **Descarga Instantánea:** Genera y descarga el archivo `.conf` listo para importar en cualquier cliente oficial de WireGuard.
- **Base de Datos en JSON:** Utiliza archivos JSON locales para una portabilidad total. Sin bases de datos pesadas que instalar (MySQL, Postgres, etc.).

---

## 🛠️ Tecnologías Utilizadas

- **Frontend & Backend:** [Next.js](https://nextjs.org/) (App Router) / React
- **Criptografía:** Módulo nativo `crypto` de Node.js (Curve25519)
- **Integración Hardware:** API REST nativa de MikroTik RouterOS v7.
- **Estilos:** Inline CSS & Objetos de estilo para máxima ligereza.

---

## 📋 Requisitos Previos

Antes de instalar MikroGuard, asegúrate de cumplir con lo siguiente:

1. **Node.js**: Versión 18.0 o superior.
2. **Router MikroTik**: Con RouterOS v7 o superior.
3. **API REST Habilitada en el router**: 
   - Ve a `IP` -> `Services`.
   - Asegúrate de que el servicio `www` (puerto 80) o `www-ssl` (puerto 443) esté habilitado.
4. **Usuario MikroTik**: Debe tener los permisos: `read`, `write`, `api` y `rest`.

---

## 🚀 Instalación y Despliegue

**1. Clonar el repositorio:**

git clone [https://github.com/omtacmen/MikroGuardGUI.git](https://github.com/omtacmen/MikroGuardGUI.git)
cd MikroGuardGUI


**2. Instalar las dependencias:

npm install

3. Iniciar el servidor en modo desarrollo: 
npm run dev


La aplicación estará disponible en http://localhost:3000.


📖 Tutorial de Uso (Primeros Pasos)

Paso 1: Configurar el Router (Panel de Administración)

1. Dirígete a http://localhost:3000/admin.
2. En la sección Conexión y Credenciales MikroTik, rellena la IP, Puerto, Usuario y Contraseña de tu router.
3. Pulsa "🔍 Auto" para obtener tu DNS de MikroTik Cloud o escribe tu IP pública manual en el campo de Endpoint.
4. Haz clic en 💾 Guardar Todo.


Paso 2: Desplegar o Sincronizar tu Red

1. Si ya tienes WireGuard configurado: Pulsa "🔄 Sincronizar redes". Pulsa en "Usar" sobre la interfaz deseada.
2. Si no tienes WireGuard: Rellena los datos en Nueva Interfaz y pulsa "🚀 Crear Interfaz".

Paso 3: Crear tu primer Cliente VPN
1. Ve a la página principal de Clientes.
2. Escribe el nombre del dispositivo, selecciona la red y pulsa Crear VPN.
3. l archivo .conf se descargará automáticamente.


📂 Estructura del Proyecto

MikroGuardGUI/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── wireguard/route.js       # Sincronización e Infraestructura
│   │   ├── settings/route.js            # Configuración JSON
│   │   └── wireguard/route.js           # CRUD Clientes y Claves
│   ├── admin/
│   │   └── page.js                      # UI Administración
│   ├── PanelVPN.js                      # UI Clientes
│   └── page.js                          # Home
├── settings.json                        # (Local) Ajustes del router
├── networks.json                        # (Local) Redes sincronizadas
├── db.json                              # (Local) Usuarios creados
└── README.md

🚑 Solución de Problemas (Troubleshooting)

Problema->Causa->Solución->

Error 401->Credenciales incorrectas->Verifica el usuario/password en el panel Admin.

Error 404->API REST desactivada.->Habilita el servicio www en el router.

No aparecen redes->Falta sincronizar.->Pulsa el botón de Sincronizar en Admin después de guardar la IP.


🔒 Seguridad

Los archivos settings.json, networks.json y db.json contienen información sensible
