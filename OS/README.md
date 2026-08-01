# Kody DOG OS

A pure static, local-first OS client for `https://kody-w.github.io/OS/`. The user's public site is treated as the read-only public filesystem. In this ecosystem, DOG means the public, exhaust, bones-side layer: bytes that are safe to be public by construction.

This OS never writes to the mounted volume. It does not store or protect private data. It reads public bytes only.

## Files

- `index.html` — desktop shell with top bar, dock, panes, and hash routes.
- `styles.css` — house style: cream, ink, scarce coral, tile panels, navy code surfaces.
- `client.js` — vanilla ES module client.
- `api/fs.json` — static mount manifest.
- `api/apps.json` — installed apps registry.
- `system32/index.html` — direct GitHub Pages route for `OS/system32/`.

All internal links are relative so the OS can be served from `/OS/`.

## Static API schemas

### `api/fs.json`

```json
{
  "schemaVersion": 1,
  "volume": {
    "id": "string",
    "name": "string",
    "baseUrl": "url",
    "readOnly": true,
    "privacy": "public-by-construction",
    "description": "string"
  },
  "mounts": [
    {
      "path": "dog:/path",
      "name": "string",
      "kind": "directory|json|text|xml|html",
      "url": "optional public url",
      "description": "string",
      "children": []
    }
  ],
  "verifiedAt": "ISO-ish timestamp"
}
```

The client uses this file for Files, Terminal `ls`/`cat`, and system32 mount tables.

### `api/apps.json`

```json
{
  "schemaVersion": 1,
  "apps": [
    {
      "id": "files|examples|terminal|system32",
      "name": "string",
      "icon": "glyph",
      "does": "string",
      "entry": "relative hash route",
      "pathEntry": "optional direct relative path"
    }
  ]
}
```

The dock is rendered from this registry.

## Working apps

- Files: browses `api/fs.json`, fetches public leaves, renders JSON prettily and text/XML/HTML as text.
- Examples: loads the real `https://kody-w.github.io/api/examples.json` catalog and filters by category, difficulty, and search text.
- Terminal: read-only commands: `ls`, `cat <path>`, `mount`, `help`, `clear`, `about`.
- system32: lists static API endpoints, mount table, and build info. It works at both `#/system32` and `system32/`.

## Verified public mounts

The mounted public URLs are limited to endpoints that returned HTTP 200 during build verification. Paths that did not verify were left out rather than invented.
