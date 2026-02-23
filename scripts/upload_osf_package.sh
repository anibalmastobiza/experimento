#!/usr/bin/env bash
set -euo pipefail

BASE="/Users/anibalmonasterioastobiza/Documents/New project"
PKG="$BASE/osf_package"
PYTHONPATH="$BASE/.vendor"

if [[ ! -d "$PKG" ]]; then
  echo "Package directory not found: $PKG" >&2
  exit 1
fi

if [[ -z "${OSF_PROJECT_ID:-}" ]]; then
  echo "OSF_PROJECT_ID is required (e.g., export OSF_PROJECT_ID=abc12)." >&2
  exit 1
fi

if [[ -z "${OSF_TOKEN:-}" ]]; then
  echo "OSF_TOKEN is required (personal access token)." >&2
  exit 1
fi

osf() {
  PYTHONPATH="$PYTHONPATH" OSF_TOKEN="$OSF_TOKEN" \
    python3 -m osfclient -p "$OSF_PROJECT_ID" "$@"
}

echo "Checking OSF access for project: $OSF_PROJECT_ID"
osf ls >/dev/null
echo "Access OK."

echo "Uploading package recursively to osfstorage/osf_package ..."
osf upload -r -U "$PKG/" "osfstorage/osf_package"

echo
echo "Upload complete."
echo "Project URL: https://osf.io/$OSF_PROJECT_ID/"
echo "Package root: osfstorage/osf_package/"
