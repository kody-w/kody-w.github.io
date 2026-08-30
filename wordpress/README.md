# WordPress draft sync

GitHub Pages is the staging canary. WordPress is a human-approved projection.

The sync is intentionally conservative:

- dry-run unless `--apply` is present;
- creates drafts only; publishing is outside this pipeline;
- matches by slug so reruns update instead of duplicate;
- updates only existing drafts and skips published, scheduled, pending, and private content;
- reads rendered HTML from the deployed GitHub Pages site;
- never stores credentials.

## Local plan

```bash
python3 scripts/sync_wordpress.py --surface pages
python3 scripts/sync_wordpress.py --surface posts --since 2026-08-01
python3 scripts/sync_wordpress.py --surface weekly
```

## Local draft sync

Supply a WordPress application password at call time:

```bash
export WP_URL="https://kodyw.com"
export WP_USER="your-wordpress-login"
export WP_APP_PASSWORD="your application password"
python3 scripts/sync_wordpress.py --apply --surface pages
```

Use WordPress admin → Users → Profile → Application Passwords. Do not use the
normal account password and do not commit credentials.

## GitHub Actions

Create a protected `wordpress-production` environment restricted to the
`master` branch. Store environment secrets named `WP_URL`, `WP_USER`, and
`WP_APP_PASSWORD` there and configure a required reviewer. Run **WordPress
Draft Sync** manually from `master`.

The workflow also has a Monday schedule for the Weekly Signal only. It remains
disabled until the protected environment variable
`WORDPRESS_WEEKLY_SYNC_ENABLED` is explicitly set to `true`. Scheduled runs
still enter the protected environment and create or update a draft only; they
never publish or email subscribers.
