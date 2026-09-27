#!/usr/bin/env bash
# Install Clauddy (macOS, Apple Silicon) from this fork's latest GitHub release.
#
# Read it before running it:
#   curl -fsSLO https://raw.githubusercontent.com/jonathanpiette/claude-usage-monitor/develop/install.sh
#   less install.sh && bash install.sh
#
# The archive is checked against the SHA-256 digest GitHub records for the
# release asset before anything is installed. Set CLAUDDY_SHA256 to pin the
# digest you verified yourself instead of trusting the one the API returns.
set -euo pipefail

REPO="jonathanpiette/claude-usage-monitor"
APP_NAME="Clauddy.app"
DEST="/Applications"

if [ "$(uname -s)" != "Darwin" ] || [ "$(uname -m)" != "arm64" ]; then
  echo "Only macOS on Apple Silicon has a prebuilt app. Build from source instead." >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "→ Finding the latest release…"
curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" -o "$TMP/release.json"

# Pick the Apple Silicon zip and its recorded digest (JXA ships with macOS, no jq needed).
ASSET="$(
  osascript -l JavaScript -e '
    function run(argv) {
      const text = $.NSString.stringWithContentsOfFileEncodingError(argv[0], $.NSUTF8StringEncoding, null)
      const release = JSON.parse(text.js)
      const a = (release.assets || []).find((x) => /-mac-arm64\.zip$/.test(x.name))
      return a ? `${a.browser_download_url} ${a.digest || ""}` : ""
    }' "$TMP/release.json"
)"
ZIP_URL="${ASSET%% *}"
API_DIGEST="${ASSET#* }"
if [ -z "$ZIP_URL" ]; then
  echo "Couldn't find a macOS (arm64) build in the latest release. Aborting." >&2
  exit 1
fi

EXPECTED="${CLAUDDY_SHA256:-${API_DIGEST#sha256:}}"
if ! [[ "$EXPECTED" =~ ^[0-9a-f]{64}$ ]]; then
  echo "No SHA-256 digest to verify against. Aborting." >&2
  exit 1
fi

echo "→ Downloading $(basename "$ZIP_URL")…"
curl -fSL --progress-bar "$ZIP_URL" -o "$TMP/app.zip"

echo "→ Verifying SHA-256…"
ACTUAL="$(shasum -a 256 "$TMP/app.zip" | awk '{print $1}')"
if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "Checksum mismatch: expected ${EXPECTED}, got ${ACTUAL}. Aborting." >&2
  exit 1
fi

echo "→ Installing to ${DEST}…"
unzip -q "$TMP/app.zip" -d "$TMP"
if [ ! -d "$TMP/${APP_NAME}" ]; then
  echo "The archive does not contain ${APP_NAME}. Aborting." >&2
  exit 1
fi
osascript -e 'quit app "Clauddy"' 2>/dev/null || true
rm -rf "${DEST:?}/${APP_NAME}"
mv "$TMP/${APP_NAME}" "${DEST}/"

echo "→ Launching…"
open "${DEST}/${APP_NAME}"

echo "✓ Done: Clauddy is installed and will start at login."
