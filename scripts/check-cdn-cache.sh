#!/usr/bin/env bash
# Read the cache behaviour of the /*/parks/* family from outside.
#
# Two modes, and mixing them up is how this gets measured wrong:
#   headers  — what the origin declares. Needs a cache-buster, or you read Cloudflare's copy.
#   cache    — what Cloudflare does. Must NOT have a cache-buster: the second fetch of the SAME
#              URL is the whole measurement.
#
# Usage:  scripts/check-cdn-cache.sh [headers|cache|hitrate|redirect] [base-url]
set -uo pipefail

BASE="${2:-https://park.fan}"
PARK="/de/parks/europe/germany/bruehl/phantasialand"
CAL="$PARK/wartezeiten-kalender"

hdr() { curl -sS -o /dev/null -D - --compressed --max-time 25 "$1" 2>/dev/null | tr -d '\r'; }
field() { grep -i "^$2:" <<<"$1" | head -1 | cut -d' ' -f2-; }

case "${1:-headers}" in

  # ---- Does the origin declare a window, and does Vercel route it through? -------------------
  headers)
    printf '%-46s %-9s %s\n' 'PFAD' 'STATUS' 'CDN-CACHE-CONTROL'
    for p in "/de/parks" "/de/parks/europe" "/de/parks/europe/germany" \
             "/de/parks/europe/germany/bruehl" "$PARK" "$PARK/taron" \
             "$CAL" "$CAL/2026/10" "/de/blog"; do
      h=$(hdr "$BASE$p?cb=$RANDOM$RANDOM")
      printf '%-46s %-9s %s\n' "$p" \
        "$(grep -oE 'HTTP/[0-9.]+ [0-9]+' <<<"$h" | tail -1 | awk '{print $2}')" \
        "$(field "$h" cdn-cache-control || echo '(KEINER)')"
    done
    ;;

  # ---- Does Cloudflare actually keep it? No cache-buster, same URL twice. --------------------
  cache)
    for p in "$PARK/taron" "$CAL/2026/10" "/de/parks/europe" "/de/blog"; do
      echo "--- $p"
      for i in 1 2; do
        h=$(hdr "$BASE$p")
        printf '    #%d cf=%-8s age=%-7s x-vercel=%s\n' "$i" \
          "$(field "$h" cf-cache-status)" "$(field "$h" age)" "$(field "$h" x-vercel-cache)"
      done
    done
    ;;

  # ---- The number that decides everything: what share of real URLs is Cloudflare serving? ----
  hitrate)
    for map in "rides:sitemap-attractions/de.xml" "cal:sitemap-calendar/de.xml"; do
      n=${map%%:*}; hit=0; tot=0; max=0
      while read -r u; do
        h=$(hdr "$u"); tot=$((tot+1))
        [ "$(field "$h" cf-cache-status)" = "HIT" ] && hit=$((hit+1))
        a=$(field "$h" age); [ -n "${a:-}" ] && [ "$a" -gt "$max" ] 2>/dev/null && max=$a
      done < <(curl -sS --compressed "$BASE/${map#*:}" | grep -oP '(?<=<loc>)[^<]+' | shuf -n 40)
      echo "$n: HIT $hit/$tot = $((hit*100/tot))%   groesstes age=${max}s (~$((max/3600))h)"
    done
    ;;

  # ---- The 72 kB redirect. Note: no content-encoding even though we ask for br. --------------
  redirect)
    for m in 2026/1 2025/12 2030/1; do
      h=$(hdr "$BASE$CAL/$m")
      b=$(curl -sS -o /dev/null --compressed --max-time 25 -w '%{size_download}' "$BASE$CAL/$m")
      printf '%-10s %s  %7s B  enc=%-6s cf=%s\n' "$m" \
        "$(grep -oE 'HTTP/[0-9.]+ [0-9]+' <<<"$h" | tail -1 | awk '{print $2}')" "$b" \
        "$(field "$h" content-encoding || echo none)" "$(field "$h" cf-cache-status)"
    done
    ;;
esac
