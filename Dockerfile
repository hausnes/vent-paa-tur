# Bruk Node.js versjon 20 på Alpine Linux (liten, sikker base image)
FROM node:20-alpine

# Sett arbeidsmappe inne i containeren
WORKDIR /app

# Kopier package.json og package-lock.json frå prosjektet
COPY package*.json ./

# Installer byggeverktøy som trengs for better-sqlite3, så installer avhengigheiter
# --omit=dev sikrar at berre produktive pakker vert installert (ikkje devDependencies)
RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev

# Kopier resten av filene frå prosjektet
COPY . .

# Opne port 3000 (appen kjører på denne porten)
EXPOSE 3000

# Start appen
CMD ["node", "app.js"]