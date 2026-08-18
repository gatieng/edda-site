#!/usr/bin/env bash
# Génère un dossier à transmettre au développeur :
#  - propositions.patch : le diff exact (applicable avec `git apply`)
#  - RESUME.md          : la liste des fichiers touchés
#  - fichiers-modifies/ : copie des fichiers modifiés, pour ceux qui préfèrent
# Usage : ./export-propositions.sh
set -euo pipefail
cd "$(dirname "$0")"

OUT="export"
rm -rf "$OUT"
mkdir -p "$OUT/fichiers-modifies"

git diff original...propositions > "$OUT/propositions.patch"
git diff --stat original...propositions > "$OUT/RESUME.md.tmp"

{
  echo "# Propositions de modifications — site EDDA"
  echo
  echo "Base : miroir de https://worksite.be/edda/ (branche \`original\`)."
  echo
  echo "## Fichiers touchés"
  echo '```'
  cat "$OUT/RESUME.md.tmp"
  echo '```'
  echo
  echo "## Application du patch"
  echo '```bash'
  echo "git apply propositions.patch"
  echo '```'
} > "$OUT/RESUME.md"
rm "$OUT/RESUME.md.tmp"

# Copie des fichiers modifiés/ajoutés en conservant l'arborescence
git diff --name-only --diff-filter=ACMR original...propositions | while read -r f; do
  mkdir -p "$OUT/fichiers-modifies/$(dirname "${f#site/}")"
  cp "$f" "$OUT/fichiers-modifies/${f#site/}"
done

echo "→ Export prêt dans ./$OUT/"
ls -R "$OUT"
