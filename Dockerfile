# 1. Usar la imagen oficial de Node.js versión 20 (Requerida por Next.js)
FROM node:20-alpine

# 2. Crear el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiar solo los archivos de dependencias primero
COPY package.json package-lock.json* ./

# 4. Instalar todas las dependencias
RUN npm install

# 5. Copiar el resto del código del proyecto
COPY . .

# 6. Construir la aplicación para producción
RUN npm run build

# 7. Exponer el puerto por defecto de Next.js
EXPOSE 3000

# 8. Comando para arrancar la aplicación
CMD ["npm", "start"]