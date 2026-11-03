#!/usr/bin/env bash
# Blog automation on the server.
#   bash scripts/blog-auto.sh install   — one time: clone the blog-content branch next to the site
#                                          and add the cron job (every 10 min). Safe to run again.
#   bash scripts/blog-auto.sh           — what cron runs: pull new notes, then scripts/crosspost.js.
set -euo pipefail

SITE="$(cd "$(dirname "$0")/.." && pwd)"
BLOG="$(dirname "$SITE")/studyassist-blog"
REPO="https://github.com/sp00ler/studyassist.ru_v.2.0.git"
BRANCH="blog-content"

if [ "${1:-}" = "install" ]; then
  [ -d "$BLOG/.git" ] || git clone -q --depth 1 --branch "$BRANCH" "$REPO" "$BLOG"     || echo "branch $BRANCH not on GitHub yet — cron will clone it once it appears"
  LINE="*/10 * * * * bash $SITE/scripts/blog-auto.sh >> \$HOME/blog-auto.log 2>&1"
  (crontab -l 2>/dev/null | grep -v 'scripts/blog-auto.sh'; echo "$LINE") | crontab -
  echo "OK: notes from $BRANCH -> $BLOG, cron installed:"
  crontab -l | grep blog-auto
  exit 0
fi

# cron has no login profile: load nvm for node.
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

if [ ! -d "$BLOG/.git" ]; then
  git clone -q --depth 1 --branch "$BRANCH" "$REPO" "$BLOG" 2>/dev/null || { cd "$SITE" && node scripts/crosspost.js; exit 0; }
fi

# The clone is read-only for us: always match the remote branch exactly (deleted notes disappear too).
git -C "$BLOG" fetch -q --depth 1 origin "$BRANCH"
git -C "$BLOG" reset -q --hard FETCH_HEAD

cd "$SITE" && node scripts/crosspost.js
