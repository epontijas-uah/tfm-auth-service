# Usamos una imagen de Node que incluye herramientas de compilación (necesarias para sqlite3)
FROM node:20-slim AS builder

# Instalar dependencias necesarias para compilar módulos nativos (C++)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias (incluyendo las nativas)
RUN npm install

# Copiamos el resto del código
COPY . .

# --- Etapa final para que la imagen sea ligera ---
FROM node:20-slim

WORKDIR /app

# Copiamos desde la etapa anterior solo lo necesario
COPY --from=builder /app /app

# Exponemos el puerto que definimos en .env (3001)
EXPOSE 3001

# Comando para arrancar
CMD ["npm", "start"]