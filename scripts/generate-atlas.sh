#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/src/lib/font/atlas"
FONT_FILE="$PROJECT_ROOT/fonts/NotoSansJP-Regular.ttf"
CHARSET_FILE="$SCRIPT_DIR/charsets/hiragana-katakana.txt"

if [ ! -f "$FONT_FILE" ]; then
  echo "Error: Font file not found at $FONT_FILE"
  echo ""
  echo "Noto Sans JP をダウンロードしてください:"
  echo "  curl -L -o fonts/NotoSansJP-Regular.ttf 'https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf'"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Generating MSDF atlas..."
echo "  Font: $FONT_FILE"
echo "  Charset: $CHARSET_FILE"
echo "  Output: $OUTPUT_DIR/"

npx msdf-bmfont \
  -f json \
  -i "$CHARSET_FILE" \
  -s 48 \
  -t msdf \
  -m 2048,2048 \
  --pot \
  -o "$OUTPUT_DIR/hiragana-katakana.json" \
  "$FONT_FILE"

# msdf-bmfont-xml はJSONファイル名をフォント名で出力するためリネーム
FONT_JSON="$OUTPUT_DIR/NotoSansJP-Regular.json"
TARGET_JSON="$OUTPUT_DIR/hiragana-katakana.json"
if [ -f "$FONT_JSON" ] && [ "$FONT_JSON" != "$TARGET_JSON" ]; then
  mv "$FONT_JSON" "$TARGET_JSON"
fi

echo ""
echo "Atlas generated successfully:"
ls -lh "$OUTPUT_DIR"/hiragana-katakana*
