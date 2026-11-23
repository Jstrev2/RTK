#!/usr/bin/env bash
# Vercel runs this before every build (vercel.json "ignoreCommand").
# Exit 0 = skip the build, exit 1 = build.
#
# 1. On a push to main, publish any new guides: the guide-writing routine's
#    sandbox can't reach runnertoolkit.com, so the sync is triggered here.
# 2. Skip the build when the push changed nothing outside content/: guides
#    reach the site through the sync, not through a deploy.

if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  curl -fsS -m 50 https://runnertoolkit.com/api/guides/sync || echo "guide sync call failed; the daily cron will retry"
  echo
fi

base="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
if ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  exit 1 # can't compare (shallow clone or first deploy): build
fi

if git diff --quiet "$base" HEAD -- . ':(exclude)content'; then
  echo "Only content/ changed: skipping the build."
  exit 0
fi
exit 1
