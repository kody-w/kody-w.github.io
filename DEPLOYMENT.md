# Deployment Pipeline — Digital Twin → Staging → Production

## Architecture

```
Digital Twin (local)          GitHub Pages (staging)           rappter.com (production)
    OpenRappter                kody-w.github.io                  WordPress/GoDaddy
        │                           │                                  │
        │  git push                 │  auto-deploy                     │  manual
        ├──────────────────────────►│◄─────────────────                │
        │                           │  CI validates                    │
        │                           │  PII check                      │
        │                           │  build check                    │
        │                           │                                  │
        │                           │  ── if build passes ──►         │
        │                           │  staging is live                 │
        │                           │                                  │
        │                           │  ── manual review ──►           │
        │                           │  blog-import.html               │
        │                           │  human approves                 ├── production updated
        │                           │                                  │
```

## Three Environments

### 1. Digital Twin (Source of Truth)
- **Where**: Your local machine, running OpenRappter
- **What**: Blog posts, landing pages, RappterSignal UI, everything
- **How**: Files in `openrappter/docs/blog/` and `kody-w.github.io/_posts/`
- **Safety**: Full local control, nothing leaves without a `git push`

### 2. Staging (GitHub Pages — Canary)
- **Where**: `kody-w.github.io`
- **What**: Auto-deployed on every push to main
- **How**: GitHub Actions builds Jekyll, validates HTML, checks for PII leaks
- **Safety**: If the build breaks, it stays broken on staging — production is never touched
- **Review**: Browse staging, check formatting, verify no PII leaked

### 3. Production (rappter.com / kodyw.com)
- **Where**: `rappter.com` (GoDaddy) and `kodyw.com` (WordPress)
- **What**: The public-facing sites
- **How**: Manual import via `blog-import.html` tool
- **Safety**: Human-in-the-loop — you review staging, then manually push to production
- **Never auto-deployed**: The pipeline NEVER pushes to production automatically

## Workflow

### Adding a new blog post

1. **Write** the post in `openrappter/docs/blog/` (markdown)
2. **Copy** to `kody-w.github.io/_posts/` with Jekyll front matter
3. **Push** to both repos
4. **Wait** for GitHub Actions to build and deploy to staging
5. **Review** at `kody-w.github.io`
6. **Import** to production via `localhost:18790/blog-import.html`

### Quick commands

```bash
# Write a post
vim openrappter/docs/blog/my-new-post.md

# Create Jekyll version
cat > kody-w.github.io/_posts/2026-03-28-my-new-post.md << 'EOF'
---
layout: post
title: "My New Post"
date: 2026-03-28
tags: [tag1, tag2]
---
(paste content here)
EOF

# Push to staging
cd kody-w.github.io && git add . && git commit -m "blog: My New Post" && git push

# Review staging
open https://kody-w.github.io

# Import to production (after review)
open http://localhost:18790/blog-import.html
```

## Safety Gates

1. **Jekyll build** — if the site doesn't build, it doesn't deploy
2. **PII check** — scans built HTML for email/phone patterns
3. **Manual production gate** — human reviews staging before touching production
4. **Golden goose protection** — public posts contain thought leadership only, never implementation details
