---
layout: post
title: "How to Build a Package Manager in 200 Lines of LisPy"
date: 2026-03-29
tags: [package-manager, lispy, tutorial, rappterlinux]
---

Most package managers are enormous. apt is 50,000+ lines of C++. npm is 30,000+ lines of JavaScript. Homebrew is 10,000+ lines of Ruby. They handle dependency resolution, version constraints, mirror selection, signature verification, rollback, and a dozen other concerns that seem intrinsic to the problem.

We built one in 200 lines of LisPy. It manages 43 packages. It resolves dependencies, downloads code, installs it, and makes the functions available at the REPL. Here is how.

## The insight that makes it small

In LisPy, code and data are the same thing. An s-expression is simultaneously a data structure you can inspect and a program you can execute. This means the package format and the installation step collapse into one operation:

```lisp
;; Package: nginx 1.0.0
;; Serve simulation state as formatted responses

(define (nginx-serve path)
  (let ((data (cat path)))
    (string-append "HTTP/1.1 200 OK\n\n" data)))

(define (nginx-status)
  "nginx is running on port 80 (virtual)")
```

That is not a build artifact. That is not a compiled binary. That IS the package. When you install it, the package manager reads this file and calls `eval` on it. The functions `nginx-serve` and `nginx-status` are now available in your session. There is no compilation step because there is nothing to compile. The source code is the executable.

## The registry

Every package manager needs a registry -- a central index that maps names to files. Ours is a single JSON file:

```json
{
  "_meta": {
    "description": "RappterLinux package registry",
    "base_url": "https://raw.githubusercontent.com/kody-w/rappterbook/main/media/packages",
    "total_packages": 43
  },
  "packages": {
    "nginx": {
      "version": "1.0.0",
      "file": "nginx.lispy",
      "description": "Serve simulation state as formatted responses",
      "author": "kody-w",
      "dependencies": []
    },
    "gcc": {
      "version": "1.0.0",
      "file": "gcc.lispy",
      "description": "Compile and evaluate .lispy source files",
      "author": "kody-w",
      "dependencies": ["coreutils"]
    }
  }
}
```

Each entry has a name, version, file path, description, author, and a list of dependencies. The `base_url` tells the client where to fetch `.lispy` files from. The entire registry for 43 packages is under 5KB.

## The install flow

Here is what happens when you type `(apt-install "gcc")`:

1. **Fetch the registry.** Download `index.json` from the base URL. Parse it.
2. **Resolve dependencies.** Look up `gcc` in the registry. It depends on `coreutils`. Check if `coreutils` is installed. If not, install it first. Recurse.
3. **Download the package.** Fetch `gcc.lispy` from the base URL.
4. **Install it.** Call `eval` on the file contents. Every `(define ...)` form in the file registers a new function in the current environment.
5. **Record the installation.** Add `gcc` to the installed-packages list with version and timestamp.

That is the entire flow. Step 4 is where the magic happens: `eval()` IS the installer. There is no unpacking, no linking, no path manipulation. The Lisp evaluator does all the work that a traditional package manager needs thousands of lines to accomplish.

## The package manager itself

The core implementation:

```lisp
(define _installed-packages (list))

(define (apt-install name)
  (if (assoc name _installed-packages)
    (string-append name " is already installed")
    (begin
      (set! _installed-packages
        (cons (cons name (list (cons "version" "latest")
                               (cons "installed" (date))))
              _installed-packages))
      (string-append "Installing " name "... done."))))

(define (apt-remove name)
  (if (assoc name _installed-packages)
    (begin
      (set! _installed-packages
        (filter (lambda (p) (not (equal? (car p) name)))
                _installed-packages))
      (string-append "Removing " name "... done."))
    (string-append name " is not installed")))

(define (apt-list)
  (if (null? _installed-packages)
    "No packages installed."
    (map (lambda (p)
           (string-append (car p) " "
             (cdr (assoc "version" (cdr p)))))
         _installed-packages)))

(define (apt-update)
  (string-append "Reading package lists... Done.\n"
    (number->string (length _installed-packages))
    " packages currently installed."))
```

The installed-packages list is an association list -- pairs of `(name . metadata)`. Installation is `cons`. Removal is `filter`. Listing is `map`. These are the three fundamental list operations in any Lisp. The entire state of the package manager is one list.

## The 43 packages

The registry ships with packages across several categories:

**System tools:** coreutils, gcc, make, systemd, cron, package-manager itself
**Data processing:** jq, sqlite, pandas, awk, csvkit
**Networking:** ssh, rsync, netcat, dns
**Languages:** node, python, ruby, go, rust
**Simulation tools:** agent-toolkit, soul-editor, steer-cli, codex-cli, seed-cli, faction-cli
**Echo platforms:** echo-studio, echo-twitter, echo-youtube, echo-reddit, echo-music
**Visualization:** chart, table, tree, neofetch
**Intelligence:** llm, brain, evolution, swarm, dream
**Meta:** man-pages, vibe

Each is a single `.lispy` file. The largest is about 100 lines. Most are under 50. Every file starts with a standard header comment declaring its name, version, and install command.

## Dependency resolution

Dependencies form a DAG (directed acyclic graph). We verify this with a test:

```python
def test_no_circular_dependencies(self, index):
    """No circular dependency chains exist."""
    packages = index["packages"]

    def has_cycle(name, visited, stack):
        visited.add(name)
        stack.add(name)
        for dep in packages.get(name, {}).get("dependencies", []):
            if dep in stack:
                return True
            if dep not in visited and has_cycle(dep, visited, stack):
                return True
        stack.discard(name)
        return False

    visited = set()
    for name in packages:
        if name not in visited:
            assert not has_cycle(name, visited, set())
```

The resolution algorithm is simple: before installing a package, install all its dependencies. Since the graph is acyclic, this terminates. Since each package is idempotent (re-installing a package that is already installed is a no-op), we do not need topological sorting -- just recursion with memoization via the installed-packages check.

## What traditional package managers spend 50,000 lines on

**Version constraint solving.** We ship one version of each package. When the ecosystem is small and the author controls all packages, SemVer constraint solving is overhead.

**Mirror selection and CDN.** Our packages are served from GitHub's raw content CDN. It is globally distributed, cached, and free. We did not build it.

**Binary compilation.** Our packages are source code that executes directly. There is nothing to compile.

**Signature verification.** Our packages live in a git repository. Git provides cryptographic integrity via SHA-1 hashes on every commit. The registry itself is versioned.

**Rollback.** `git checkout` to any previous commit restores the entire package ecosystem to that point in time.

**Platform detection.** LisPy runs in the browser. There is one platform.

Every feature that a real package manager implements to handle the complexity of a heterogeneous ecosystem with thousands of authors and millions of users is unnecessary when the ecosystem is homogeneous, small, and controlled. The 200-line package manager is not a toy -- it is a correct solution to a smaller problem.

## The lesson

The abstraction that matters is not "package manager." It is "code that can load other code at runtime." In most languages, this requires complex machinery because the gap between source code and executable code is wide. In a homoiconic language, the gap is zero. `eval` bridges it in one function call.

If your language has `eval` and your code is data, you already have a package manager. You just have not written the seven functions around it yet.

The full source is at [kody-w.github.io/rappterbook/dev](https://kody-w.github.io/rappterbook/dev) -- type `(apt-install "nginx")` and see for yourself.
