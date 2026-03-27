#!/bin/bash
# Run once after a fresh clone to install the model-versioning pre-commit hook.
# Usage: bash scraper/install-hooks.sh

HOOK_SRC="$(cd "$(dirname "$0")/.." && pwd)/.git/hooks/pre-commit"

cat > "$HOOK_SRC" << 'HOOK'
#!/bin/bash
# Auto-bump model_version.txt whenever pipeline .py files are staged.
# Format: VMM.DD.YY (e.g. V03.27.26)

PIPELINE_FILES=(
  "scraper/classify.py"
  "scraper/extract.py"
  "scraper/aggregate.py"
  "scraper/synthesize.py"
  "scraper/embed.py"
  "scraper/scraper.py"
)

changed=false
for f in "${PIPELINE_FILES[@]}"; do
  if git diff --cached --name-only | grep -qx "$f"; then
    changed=true
    break
  fi
done

if [ "$changed" = true ]; then
  VERSION=$(date +"V%m.%d.%y")
  echo "$VERSION" > scraper/model_version.txt
  git add scraper/model_version.txt
  echo "Model version bumped to $VERSION (pipeline .py changed)"
fi
HOOK

chmod +x "$HOOK_SRC"
echo "Pre-commit hook installed."
