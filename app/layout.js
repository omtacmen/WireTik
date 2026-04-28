export const metadata = {
  title: "WireTik - VPN WireGuard-Mikrotik",
  description: "Gestión de interfaces WireGuard para routers MikroTik",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, backgroundColor: '#f1f5f9' }}>
        {children}
      </body>
    </html>
  );
}