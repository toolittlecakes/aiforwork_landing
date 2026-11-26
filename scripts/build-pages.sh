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
copy_file assets/course-start.js
copy_file assets/intro-experiment.js
copy_file assets/payment-request.js
copy_file assets/observability.js
copy_file assets/vendor/openobserve-logs-0.4.3.js
copy_file assets/vendor/openobserve-LICENSE.txt
copy_file assets/intro/meet-the-authors-d28a7f506a34.mp4
copy_file assets/intro/meet-the-authors-c5efcd53e819.webp
copy_dir images
copy_dir offer
copy_dir payment-failed
copy_dir privacy
copy_dir experiment

for redirect_slug in aiexee antonod ruspm aiunveiledplus aivolution ai_grably base friends frombot aitobusiness blackfriday; do
  copy_file "$redirect_slug/index.html"
done

copy_file webinar/index.html
copy_dir webinar/checklist
copy_file webinar/presentation/index.html
copy_file webinar/presentation/webinar-ai-for-work.pdf
copy_file webinar/presentation/contact-sheet-35.png
copy_dir webinar/presentation/assets
copy_dir webinar/presentation/fonts

copy_file workshop/presentation/index.html
copy_file workshop/presentation/workshop-go-to-market.pdf
copy_dir workshop/presentation/assets
copy_dir workshop/presentation/fonts

# Script filenames carry the first 12 hex characters of their SHA-256 so they can
# be served as immutable for a year without any manual ?v=N bump. Every reference
# in the built HTML is rewritten to the hashed name.
sha256_prefix() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -c1-12
  else
    shasum -a 256 "$1" | cut -c1-12
  fi
}

fingerprint_scripts() {
  local js rel dir base hashed new escaped html tmp
  while IFS= read -r -d '' js; do
    rel="${js#"$output_dir"/}"
    dir="$(dirname "$rel")"
    base="$(basename "$rel" .js)"
    hashed="$(sha256_prefix "$js")"
    new="$dir/$base.$hashed.js"
    mv "$js" "$output_dir/$new"

    escaped="$(printf '%s' "/$rel" | sed 's/[.[\*^$]/\\&/g')"
    while IFS= read -r -d '' html; do
      tmp="$html.fingerprint"
      sed -E "s#${escaped}(\?v=[0-9]+)?#/$new#g" "$html" > "$tmp"
      mv "$tmp" "$html"
    done < <(find "$output_dir" -name '*.html' -print0)
  done < <(find "$output_dir/assets" -name '*.js' -print0)
}

fingerprint_scripts

for script_base in course-start intro-experiment payment-request observability; do
  compgen -G "$output_dir/assets/$script_base.*.js" >/dev/null \
    || { echo "Hashed script missing: assets/$script_base.*.js" >&2; exit 1; }
done
compgen -G "$output_dir/assets/vendor/openobserve-logs-*.js" >/dev/null \
  || { echo "Hashed vendor script missing" >&2; exit 1; }

while IFS= read -r reference; do
  test -f "$output_dir$reference" \
    || { echo "Broken script reference in built HTML: $reference" >&2; exit 1; }
done < <(grep --recursive --no-filename --only-matching --extended-regexp '/assets/[A-Za-z0-9._/-]+\.js' "$output_dir" --include='*.html' | sort -u)

for required_path in \
  index.html \
  assets/intro/meet-the-authors-d28a7f506a34.mp4 \
  assets/intro/meet-the-authors-c5efcd53e819.webp \
  aiexee/index.html \
  antonod/index.html \
  ruspm/index.html \
  aiunveiledplus/index.html \
  aivolution/index.html \
  ai_grably/index.html \
  base/index.html \
  friends/index.html \
  frombot/index.html \
  aitobusiness/index.html \
  blackfriday/index.html \
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
  webinar/presentation/contact-sheet-35.png \
  workshop/presentation/index.html \
  workshop/presentation/assets/kolya.jpg \
  workshop/presentation/assets/deck-qr.png \
  workshop/presentation/fonts/fonts.css \
  workshop/presentation/workshop-go-to-market.pdf
do
  test -f "$output_dir/$required_path"
done

forbidden_file="$(find "$output_dir" -type f \( -name '*.md' -o -name '*.json' -o -name '*.vtt' -o -name '*.ts' -o \( -name '*.mp4' ! -path "$output_dir/assets/intro/meet-the-authors-d28a7f506a34.mp4" \) \) -print -quit)"
if [[ -n "$forbidden_file" ]]; then
  echo "Forbidden research file found in public artifact: $forbidden_file" >&2
  exit 1
fi

echo "Built safe public artifact at $output_dir"
