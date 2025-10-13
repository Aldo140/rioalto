#!/usr/bin/env bash
set -euo pipefail

# convert-heic.sh
# - Archives all .heic files from pictures/Rio_alto/new into pictures/archive
# - Converts each HEIC into a web-optimized WebP full image (into pictures/Rio_alto/web-optimized)
# - Generates a thumbnail (WebP) + JPEG fallback into pictures/gallery
# - Leaves originals in place (they are archived); no extra intermediate files kept
# - Resilient: logs per-file errors and continues processing

HEIC_DIR="pictures/Rio_alto/new"
WEBOPT_DIR="pictures/Rio_alto/web-optimized"
GALLERY_DIR="pictures/gallery"
ARCHIVE_DIR="pictures/archive"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE="$ARCHIVE_DIR/Rio_alto_new_heic_${TIMESTAMP}.tar.gz"
ERR_LOG="$ARCHIVE_DIR/convert-errors.log"
TMP_DIR="/tmp/convert-heic-${TIMESTAMP}"

mkdir -p "$WEBOPT_DIR" "$GALLERY_DIR" "$ARCHIVE_DIR" "$TMP_DIR"

shopt -s nullglob
FILES=("$HEIC_DIR"/*.heic "$HEIC_DIR"/*.HEIC)
if [ ${#FILES[@]} -eq 0 ]; then
  echo "No HEIC files found in $HEIC_DIR. Nothing to do."
  exit 0
fi

# Archive originals (keeps originals in place)
# Use -C to avoid embedding full path in tar
tar -czf "$ARCHIVE" -C "$HEIC_DIR" . || true
echo "Archived HEIC originals to: $ARCHIVE"

# Helper: safe base name
bn() {
  local f="$1"
  echo "$(basename "$f")" | sed 's/\.[^.]*$//' 
}

log_err() {
  echo "[$(date --iso-8601=seconds)] $1" | tee -a "$ERR_LOG" >&2
}

# Choose conversion pipeline
if command -v vips >/dev/null 2>&1 && command -v vipsthumbnail >/dev/null 2>&1; then
  echo "Using libvips (vips + vipsthumbnail) for conversion"
  for f in "${FILES[@]}"; do
    name=$(bn "$f")
    echo "Processing: $f -> $name.webp + ${name}_thumb.webp"

    # full-size WebP (quality 80)
    if ! vips copy "$f" "$WEBOPT_DIR/${name}.webp[Q=80]" 2>>"$ERR_LOG"; then
      log_err "vips failed for $f"
      continue
    fi

    # thumbnail (max dimension 1200px) as WebP
    if ! vipsthumbnail "$f" -s 1200 -o "$GALLERY_DIR/${name}_thumb.webp[Q=75]" 2>>"$ERR_LOG"; then
      log_err "vipsthumbnail failed for $f (webp thumb)"
    fi

    # JPEG fallback thumbnail (quality 85)
    if ! vipsthumbnail "$f" -s 1200 -o "$GALLERY_DIR/${name}_thumb.jpg[Q=85]" 2>>"$ERR_LOG"; then
      log_err "vipsthumbnail failed for $f (jpg thumb)"
    fi
  done

elif command -v heif-convert >/dev/null 2>&1 && command -v cwebp >/dev/null 2>&1; then
  echo "Using heif-convert + cwebp (fallback)"
  for f in "${FILES[@]}"; do
    name=$(bn "$f")
    echo "Processing: $f -> $name.webp + ${name}_thumb.webp"

    tmp_jpg="$TMP_DIR/${name}.jpg"
    if ! heif-convert "$f" "$tmp_jpg" 2>>"$ERR_LOG"; then
      log_err "heif-convert failed for $f"
      rm -f "$tmp_jpg"
      continue
    fi

    if ! cwebp -q 80 "$tmp_jpg" -o "$WEBOPT_DIR/${name}.webp" 2>>"$ERR_LOG"; then
      log_err "cwebp failed for $tmp_jpg"
      rm -f "$tmp_jpg"
      continue
    fi

    if command -v convert >/dev/null 2>&1; then
      if ! convert "$tmp_jpg" -resize 1200x1200\> "$GALLERY_DIR/${name}_thumb.jpg" 2>>"$ERR_LOG"; then
        log_err "convert failed for $tmp_jpg"
      fi
    else
      if command -v ffmpeg >/dev/null 2>&1; then
        if ! ffmpeg -y -i "$tmp_jpg" -vf "scale='min(1200,iw)':'min(1200,ih)':force_original_aspect_ratio=decrease" "$GALLERY_DIR/${name}_thumb.jpg" 2>>"$ERR_LOG"; then
          log_err "ffmpeg failed to create jpg thumb for $tmp_jpg"
        fi
      else
        cp "$tmp_jpg" "$GALLERY_DIR/${name}_thumb.jpg" || log_err "cp fallback failed for $tmp_jpg"
      fi
    fi

    if ! cwebp -q 75 "$GALLERY_DIR/${name}_thumb.jpg" -o "$GALLERY_DIR/${name}_thumb.webp" 2>>"$ERR_LOG"; then
      log_err "cwebp failed for ${name}_thumb.jpg"
    fi
    rm -f "$tmp_jpg"
  done

elif command -v convert >/dev/null 2>&1 && command -v cwebp >/dev/null 2>&1; then
  echo "Using ImageMagick (convert) + cwebp pipeline"
  for f in "${FILES[@]}"; do
    name=$(bn "$f")
    echo "Processing: $f -> $name.webp + ${name}_thumb.webp + ${name}_thumb.jpg"

    # full webp via ImageMagick
    if ! convert "$f" -quality 80 "$WEBOPT_DIR/${name}.webp" 2>>"$ERR_LOG"; then
      log_err "convert failed to create full webp for $f"
      continue
    fi

    # create jpg thumbnail (max dim 1200)
    if ! convert "$f" -resize 1200x1200\> -quality 85 "$GALLERY_DIR/${name}_thumb.jpg" 2>>"$ERR_LOG"; then
      log_err "convert failed to create jpg thumb for $f"
      # continue; keep trying to create webp from whatever exists
    fi

    # create webp thumbnail from jpg (better compression)
    if [ -f "$GALLERY_DIR/${name}_thumb.jpg" ]; then
      if ! cwebp -q 75 "$GALLERY_DIR/${name}_thumb.jpg" -o "$GALLERY_DIR/${name}_thumb.webp" 2>>"$ERR_LOG"; then
        log_err "cwebp failed for ${name}_thumb.jpg"
      fi
    fi
  done

elif command -v ffmpeg >/dev/null 2>&1; then
  echo "Using ffmpeg-only pipeline (no libvips / heif-convert + cwebp)."
  for f in "${FILES[@]}"; do
    name=$(bn "$f")
    echo "Processing: $f -> $name.webp + ${name}_thumb.webp + ${name}_thumb.jpg"

    if ! ffmpeg -y -i "$f" -c:v libwebp -q:v 80 -lossless 0 -preset default -an -vsync 0 "$WEBOPT_DIR/${name}.webp" 2>>"$ERR_LOG"; then
      log_err "ffmpeg failed to create full webp for $f"
      continue
    fi

    if ! ffmpeg -y -i "$f" -vf "scale='min(1200,iw)':'min(1200,ih)':force_original_aspect_ratio=decrease" -frames:v 1 "$GALLERY_DIR/${name}_thumb.jpg" 2>>"$ERR_LOG"; then
      log_err "ffmpeg failed to create jpg thumb for $f"
      continue
    fi

    if ! ffmpeg -y -i "$GALLERY_DIR/${name}_thumb.jpg" -c:v libwebp -q:v 75 -lossless 0 -an -vsync 0 "$GALLERY_DIR/${name}_thumb.webp" 2>>"$ERR_LOG"; then
      log_err "ffmpeg failed to create webp thumb for $name"
      # keep jpg thumb as fallback
    fi

    if [ -f "$WEBOPT_DIR/${name}.webp" ]; then
      echo "Created: $WEBOPT_DIR/${name}.webp"
    else
      log_err "Missing expected output: $WEBOPT_DIR/${name}.webp"
    fi
  done

else
  echo "No supported HEIC conversion toolchain found."
  echo "Install libvips (vips + vipsthumbnail) or heif-convert + cwebp, or ensure ffmpeg is available." >&2
  echo "On Debian/Ubuntu: apt install -y libvips-tools libheif-examples webp" >&2
  exit 1
fi

# Clean up
rm -rf "$TMP_DIR"

echo "Conversion complete. Web-optimized full images are in: $WEBOPT_DIR"
echo "Thumbnails (+ JPEG fallbacks) are in: $GALLERY_DIR"
echo "Original HEICs are archived at: $ARCHIVE" 

echo "Errors (if any) were logged to: $ERR_LOG"

echo "Next steps (manual):"
echo " - Verify images."
echo " - Update gallery.html if you want data-full entries to point to pictures/Rio_alto/web-optimized/<basename>.webp"

echo "Note: the script does not delete originals; archive was created to let you safely remove originals later if desired."
