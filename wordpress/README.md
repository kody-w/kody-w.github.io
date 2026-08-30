# WordPress draft sync

GitHub Pages is the staging canary. WordPress is a human-approved projection.

The sync is intentionally conservative:

- dry-run unless `--apply` is present;
- creates drafts only; publishing is outside this pipeline;
- matches by slug and skips every existing item, including drafts, so reruns
  never overwrite human review;
- performs the collision check and create-if-absent operation server-side under
  a database advisory lock;
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

Install and activate `wordpress/kodyw-draft-sync.php` on the WordPress site,
assign the generated `kodyw_draft_sync` role to a dedicated service user, then
create an application password for that user under WordPress admin → Users →
Profile → Application Passwords. Do not use the normal account password and do
not commit credentials.

## GitHub Actions

Create a protected `wordpress-production` environment restricted to the
`master` branch. Store environment secrets named `WP_URL`, `WP_USER`, and
`WP_APP_PASSWORD` there and configure a required reviewer. The application
password must belong to the plugin-created `kodyw_draft_sync` role. That role
has only `read` and the plugin's `kodyw_sync_drafts` capability; it cannot use
WordPress's native edit, publish, or delete APIs. Run **WordPress Draft Sync**
manually from `master`.

After a successful scheduled **Refresh Weekly Signal** run, the draft workflow
waits up to 20 minutes for the exact completed-week manifest to appear on
GitHub Pages before it authenticates to WordPress. This automatic path remains
disabled until the repository Actions variable
`WORDPRESS_WEEKLY_SYNC_ENABLED` is explicitly set to `true`. It must be
repository-scoped because GitHub evaluates the job gate before attaching the
protected environment. Automatic runs still enter the protected environment
and create a draft only; they never publish or email subscribers.
