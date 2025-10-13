#!/usr/bin/env bash
# Generate poster and thumbnail images for videos.
# Usage:
#   ./scripts/generate-video-thumbs.sh [seconds] [video1.mp4 video2.mp4 ...]
# If no videos specified, the script processes all .mp4 files in pictures/gallery.

set -euo pipefail

SEEK=${1:-3}
shift || true

OUTDIR="pictures/gallery"

if [ $# -gt 0 ]; then
  FILES=("$@")
else
  shopt -s nullglob
  FILES=("$OUTDIR"/*.mp4)
fi

if [ ${#FILES[@]} -eq 0 ]; then
  echo "No video files found to process. Exiting."
  exit 0
fi

for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "Skipping missing file: $f"
    continue
  fi
  base=$(basename "$f")
  name="${base%.*}"
  poster="$OUTDIR/${name}_poster.jpg"
  thumb="$OUTDIR/${name}_poster_thumb.jpg"
  poster_webp="$OUTDIR/${name}_poster.webp"
  thumb_webp="$OUTDIR/${name}_poster_thumb.webp"

  echo "Generating posters for: $f (seek=${SEEK}s)"

  # Full-size poster (1280px wide, keep aspect)
  ffmpeg -y -ss "$SEEK" -i "$f" -frames:v 1 -vf "scale=1280:-2,format=yuv420p" "$poster"

  # Small thumbnail (640px wide)
  ffmpeg -y -ss "$SEEK" -i "$f" -frames:v 1 -vf "scale=640:-2,format=yuv420p" "$thumb"

  # WebP versions (smaller size for thumbnails)
  ffmpeg -y -ss "$SEEK" -i "$f" -frames:v 1 -vf "scale=1280:-2" -vcodec libwebp -lossless 0 -qscale 60 "$poster_webp" || echo "webp generation failed for $poster_webp"
  ffmpeg -y -ss "$SEEK" -i "$f" -frames:v 1 -vf "scale=640:-2" -vcodec libwebp -lossless 0 -qscale 60 "$thumb_webp" || echo "webp generation failed for $thumb_webp"

  echo "Created: $poster, $thumb, $poster_webp, $thumb_webp"
done

echo "All done."