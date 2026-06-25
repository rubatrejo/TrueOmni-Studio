#!/usr/bin/env bash
#
# setup.sh — deja esta Mac lista para trabajar tras clonar el repo.
# Asume YA instalados: Node 20+, pnpm, vercel CLI, git (todo lo demás de la guía).
# Uso:  bash setup.sh
#
set -euo pipefail

cd "$(dirname "$0")"

# --- 0. sanity: ¿estoy en el repo? -------------------------------------------
if [ ! -f package.json ] || ! grep -q '"kiosk:dev"' package.json; then
  echo "✗ Ejecuta esto DENTRO de la carpeta del repo (Kiosk Portrait Old)." >&2
  exit 1
fi

need() { command -v "$1" >/dev/null 2>&1 || { echo "✗ Falta '$1'. Instálalo y reintenta." >&2; exit 1; }; }
need node; need pnpm; need vercel; need git; need rsync

echo "▶ 1/3  Secrets desde Vercel…"
if [ -f .env.local ]; then
  echo "   .env.local ya existe — lo conservo."
else
  if ! vercel whoami >/dev/null 2>&1; then
    echo "   No hay sesión de Vercel. Corre 'vercel login' (con ruba.trejo@gmail.com) y vuelve a lanzar setup.sh." >&2
    exit 1
  fi
  vercel link --yes --project trueomni-studio >/dev/null 2>&1 || vercel link
  vercel env pull .env.local --yes
  echo "   .env.local descargado ($(grep -cE '^[A-Z0-9_]+=' .env.local) variables)."
fi

echo "▶ 2/3  Dependencias…"
pnpm install --silent

echo "▶ 3/3  Memoria de Claude…"
MEMREPO="$HOME/.claude/claude-config"
if [ -d "$MEMREPO/.git" ]; then
  git -C "$MEMREPO" pull --ff-only >/dev/null 2>&1 || true
else
  git clone --quiet https://github.com/rubatrejo/claude-config.git "$MEMREPO"
fi
# Solo restaura la MEMORIA del proyecto; no toca tu config global (commands/agents/CLAUDE.md).
rsync -a "$MEMREPO/projects/" "$HOME/.claude/projects/"
echo "   memoria sincronizada."

echo ""
echo "✅ Listo. Ahora:"
echo "     pnpm kiosk:dev        # ver el kiosk en http://localhost:3000"
echo "     claude   → /iniciar   # retomar con todo el contexto"
