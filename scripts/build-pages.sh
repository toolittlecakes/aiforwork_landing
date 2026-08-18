#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="$repo_root/_site"

mkdir -p "$output_dir"
find "$output_dir" -mindepth 1 -delete

copy_file() {
  local source_path="$1"
  mkdir -p "$(dirname "$output_dir/$source_path")"
  cp "$repo_root/$source_path" "$output_dir/$source_path"
}

copy_dir() {
  local source_path="$1"
  mkdir -p "$output_dir/$source_path"
  cp -R "$repo_root/$source_path/." "$output_dir/$source_path/"
}

copy_file .nojekyll
copy_file favicon.svg
copy_file index.html
copy_dir images
copy_dir offer
copy_dir payment-failed
copy_dir privacy
copy_dir experiment

copy_file webinar/index.html
copy_dir webinar/checklist
copy_file webinar/presentation/index.html
copy_file webinar/presentation/webinar-ai-for-work.pdf
copy_file webinar/presentation/contact-sheet-35.png
copy_dir webinar/presentation/assets
copy_dir webinar/presentation/fonts

for required_path in \
  index.html \
  offer/index.html \
  payment-failed/index.html \
  privacy/index.html \
  experiment/index.html \
  webinar/index.html \
  webinar/checklist/index.html \
  webinar/presentation/index.html \
  webinar/presentation/assets/kolya.jpg \
  webinar/presentation/assets/payment-qr.png \
  webinar/presentation/assets/queue-example.png \
  webinar/presentation/fonts/fonts.css \
  webinar/presentation/webinar-ai-for-work.pdf \
  webinar/presentation/contact-sheet-35.png
do
  test -f "$output_dir/$required_path"
done

forbidden_file="$(find "$output_dir" -type f \( -name '*.md' -o -name '*.json' -o -name '*.vtt' -o -name '*.ts' -o -name '*.mp4' \) -print -quit)"
if [[ -n "$forbidden_file" ]]; then
  echo "Forbidden research file found in public artifact: $forbidden_file" >&2
  exit 1
fi

echo "Built safe public artifact at $output_dir"
