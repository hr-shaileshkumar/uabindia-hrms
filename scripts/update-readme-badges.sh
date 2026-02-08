#!/bin/sh
# Update README badges by replacing OWNER/REPO placeholders with detected git remote origin.
# Usage: ./scripts/update-readme-badges.sh

set -euo pipefail

if ! command -v git >/dev/null 2>&1; then
  echo "git not found" >&2; exit 1
fi

remote=$(git config --get remote.origin.url || true)
if [ -z "$remote" ]; then
  echo "remote.origin.url not set. Set remote and try again." >&2; exit 1
fi

if echo "$remote" | grep -qE 'github.com[:/]'; then
  slug=$(echo "$remote" | sed -E 's#.*github.com[:/]+([^/]+)/([^/.]+)(\.git)?#\1/\2#')
else
  echo "Unsupported remote format: $remote" >&2; exit 1
fi

echo "Detected repo: $slug"

for f in README.md Backend/README.md; do
  if [ -f "$f" ]; then
    if grep -q 'OWNER/REPO' "$f"; then
      cp "$f" "$f.bak"
      sed "s/OWNER\/REPO/$slug/g" "$f.bak" > "$f"
      echo "Updated $f (backup at $f.bak)"
    else
      echo "No OWNER/REPO placeholders in $f"
    fi
  fi
done

echo "Done."
