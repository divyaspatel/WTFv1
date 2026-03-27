#!/bin/bash
# Run once after a fresh clone to install the model-versioning pre-commit hook.
# Usage: bash scraper/install-hooks.sh

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK_DST="$REPO_ROOT/.git/hooks/pre-commit"

cat > "$HOOK_DST" << 'HOOK'
#!/bin/bash
# Auto-bump model version files whenever pipeline .py files are staged.
# Format: VMM.DD.YY (e.g. V03.27.26)
# Updates: scraper/model_version.txt (Python) + src/data/modelVersion.js (React)

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

  cat > src/data/modelVersion.js << EOF
// Auto-updated by .git/hooks/pre-commit when pipeline .py files change.
// Do not edit manually.
export const MODEL_VERSION = '$VERSION';
EOF
  git add src/data/modelVersion.js

  echo "Model version bumped to $VERSION (pipeline .py changed)"
fi
HOOK

chmod +x "$HOOK_DST"
echo "Pre-commit hook installed."
