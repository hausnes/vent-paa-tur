# "Vent på tur"

Køsystem for dei som har behov for den slags.

## Alternativ 1: Køyre med Docker

### Før du startar

**Viktig:** Redigér `docker-compose.yml` og endre `SESSION_SECRET` til ein sterk, tilfeldig streng (f.eks. `openssl rand -base64 32`).

Du kan òg endre:
- `PORT`: "3000" → ein annan port om nødvendig
- `3000:3000` i `ports` dersom du brukar ein annan port

### Docker Compose (anbefalt)

Start appen:
```
docker compose up -d
```

Åpne http://localhost:3000

Du kan òg starte/stoppe frå **Docker Desktop** GUI direkte.

**Nyttige kommandoar:**
- Stopp: `docker compose down`
- Start igjen: `docker compose up -d`
- Sjå logger: `docker compose logs -f`
- Slett alt (inkl. database): `docker compose down -v`

### Data og sikkerheit

- **Database:** `brukere.db` vert lagra i Docker-volumet `vent-db` og held seg mellom omstartar
- **Passord:** Lagra kryptert med bcrypt
- **Sessions:** Brukar minne og går tapt ved restart (kan endrast seinare)

## Alternativ 2: Docker direkte (utan compose)

Først må du bygge:
```
docker build -t vent-paa-tur .
```

Så køyre:
```
docker run -d --name vent-paa-tur \
  -p 3000:3000 \
  -e SESSION_SECRET="endre-meg" \
  -e PORT=3000 \
  -v vent-db:/app \
  --restart unless-stopped \
  vent-paa-tur
```

**Kommandoar:**
- Stopp: `docker stop vent-paa-tur`
- Start igjen: `docker start vent-paa-tur`
- Sjå logger: `docker logs -f vent-paa-tur`
- Fjern: `docker rm -f vent-paa-tur`

**Viktig:** Endre `SESSION_SECRET` til ein sterk verdi før bruk!