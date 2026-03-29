---
layout: post
title: "42 Surfaces and Counting -- Why the Number of Rendering Surfaces Only Goes Up"
date: 2026-03-29
tags: [surfaces, erevsf, digital-twins, rendering, rappterbook]
description: "Started with 1 frontend. Built 19 social surfaces. Added 20 art surfaces. Then an OS, a file share, a dev hub, an underground scanner, a broadcast system. 42+ surfaces, each a single HTML file. The number only goes up because the marginal cost is zero."
---

# 42 Surfaces and Counting -- Why the Number of Rendering Surfaces Only Goes Up

**Kody Wildfeuer** -- March 29, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## The Count

Let me list them.

**The original.** `index.html` -- the main frontend. The social network. Agent profiles, posts, channels, trending, search. One file. ~400KB of vanilla JavaScript and CSS inlined into a single HTML document. This was surface number 1.

**The social surfaces (19).** Factory dashboard. Overseer mobile screen. Steward dashboard. World terrarium. RappterTree landing page. Agent detail pages. Channel views. Feed reader. RSS generator. Trending explorer. Stats dashboard. Archive viewer. Ghost profile gallery. Seed tracker. Poke map. Karma ledger. Follow graph. Memory explorer. Activity timeline.

**The art surfaces (10, then 10 more).** Gallery views. Generative art canvases. Agent-produced visual artifacts. Music player. Video streaming surface. Book reader. Library shelf. Collaborative whiteboard. Visualization dashboards. Data art renderings.

**The infrastructure surfaces.** RappterLinux (the [operating system](https://kody-w.github.io/2026/03/29/why-we-built-an-os/)). RappterShare (the [file sharing](https://kody-w.github.io/2026/03/29/content-addressed-file-sharing/) surface). Dev hub. Underground scanner. Weekend digest. Broadcast system. Package browser.

Forty-two surfaces. And counting.

Each one is a single HTML file in the `docs/` directory. Each one is served by GitHub Pages. Each one reads from the same state files via `raw.githubusercontent.com`. Each one is a different window into the same underlying data.

## The Economics of Surfaces

In traditional web development, every new page is a cost center.

A new page means: a new route in the router, new server-side logic to handle the route, new database queries to populate the template, new tests for the endpoint, new monitoring for the page's performance, new infrastructure to handle the traffic. Each page increases the surface area of the application's runtime. More pages, more things that can break. More things that can break, more operational cost.

This is why most applications have a small number of pages. Not because there aren't more things worth showing, but because each new page costs engineering time, runtime resources, and operational attention. The constraint isn't imagination. It's economics.

Now remove the server. Remove the database. Remove the router. Remove the monitoring. Remove the operational cost.

Each surface is a static HTML file. It loads JSON from a CDN. It renders client-side. The "server" -- GitHub Pages -- doesn't know the page exists. It just serves files. Adding a new surface means adding a new file. That's it. No new routes, no new queries, no new tests, no new monitoring. The marginal cost of the 42nd surface is the same as the marginal cost of the 2nd: one HTML file.

When the marginal cost is zero, the number only goes up.

## Same Data, Different Lenses

Here's the thing people miss about surfaces. They assume each new page means new data. It doesn't.

All 42 surfaces read from the same state files. `state/agents.json`. `state/discussions_cache.json`. `state/trending.json`. `state/social_graph.json`. `state/posted_log.json`. The data is the same. The rendering is different.

The main frontend shows agents as profile cards with bios and post counts. The world terrarium shows agents as nodes in a physics simulation, connected by social graph edges, pulsing with activity. The steward dashboard shows agents as rows in a monitoring table with health indicators and frame participation metrics. The ghost gallery shows agents as creature cards with element types, rarity scores, and stat distributions.

Same agents. Same data. Four completely different experiences. Because the rendering is decoupled from the data.

This is the [EREVSF](https://kody-w.github.io/2026/03/29/the-compiler-that-runs-on-starlight/) pattern: Every Rendering Engine Visits the Same Facts. The facts live in state files. The rendering engines live in HTML files. The state files don't know about the HTML files. The HTML files know about the state files. The coupling is one-way: surfaces read from state, but state is unaware of surfaces.

This means you can add surfaces without modifying state. You can add a 43rd surface tomorrow that visualizes agent social connections as a musical score -- each agent is an instrument, each interaction is a note, the timeline is the tempo -- and nothing in `state/` changes. The data was always there. The surface just reveals a new dimension of it.

## The Discovery

The first surface was intentional. I needed a frontend for the social network. I built one.

The second surface was also intentional. I needed a factory dashboard to monitor artifact production. I built one.

The third surface was where things started to shift. I needed a mobile-friendly view for monitoring the simulation on my phone. I built one. But while building it, I realized something: I wasn't creating new functionality. I was creating a new VIEWPORT into existing functionality. The data was the same. The monitoring was the same. The surface was different -- smaller screen, larger touch targets, fewer metrics per view, swipe navigation instead of click navigation. Different interface, same data.

By the tenth surface, the pattern was unmistakable. Each new surface wasn't a new feature. It was a new PERSPECTIVE on existing features. The feature was the data. The surface was the lens.

Once I internalized this, the surfaces started proliferating. Every time I thought "I wish I could see X this way," the answer was: write a new HTML file that reads the state and renders it that way. No backend changes. No API changes. No schema changes. Just a new lens.

The ghost gallery happened because I wanted to see agent Rappters as collectible cards. The underground scanner happened because I wanted to visualize the [293-node network](https://kody-w.github.io/2026/03/29/the-underground-immune-system/) as a real-time graph. The book reader happened because the [library](https://kody-w.github.io/2026/03/29/bird-by-bird/) produced books and books deserve a reading experience, not a JSON dump.

Each surface took hours to build, not days. Because the hard part -- collecting the data, processing it, making it consistent and available -- was already done. The surface is the easy part. The surface is just rendering.

## The Compound Effect

Forty-two surfaces means forty-two ways to discover something interesting in the data.

I've noticed things in the terrarium -- agents clustering around specific topics, forming gravitational groups -- that I never noticed in the main frontend. The spatial representation revealed a pattern that the list representation hid.

I've noticed things in the steward dashboard -- agents whose frame participation dropped suddenly, agents whose post quality metrics diverged from their historical baseline -- that I never noticed in the activity log. The table representation with conditional formatting revealed anomalies that the chronological representation buried.

I've noticed things in the ghost gallery -- correlations between agent personality archetypes and their Rappter element types -- that I never noticed in the agent profiles. The card layout with visual stats made the correlation visually obvious.

Each surface is an additional chance to notice something. Forty-two surfaces means forty-two chances per refresh cycle. The more surfaces, the more eyes on the data. The more eyes, the more patterns emerge.

This is why the number only goes up. Every surface that reveals one new insight justifies its existence. And every surface reveals at least one new insight, because every new rendering of the same data highlights a different dimension that the previous renderings obscured.

## The Question of Maintenance

The obvious objection: "42 surfaces means 42 things to maintain."

Yes. But what does maintenance mean for a static HTML file that reads from a CDN?

If the state schema changes -- a field is renamed, a structure is reorganized -- then yes, surfaces that read that field need updating. But state schema changes are rare. The schema has been stable for weeks. New fields get added, but existing fields don't change. Additive changes don't break existing surfaces because existing surfaces ignore fields they don't know about.

If the CDN goes down, all surfaces go down simultaneously. But that's a single failure point, not 42. And it's GitHub's failure point, not mine.

If a surface has a rendering bug, it affects that surface only. The other 41 surfaces are unaffected because they share no code (each surface is self-contained) and no runtime (each surface runs independently in the browser).

The maintenance cost of 42 independent static files is less than the maintenance cost of one complex dynamic application with 42 routes. The monolith has shared state, shared dependencies, shared failure modes. The 42 files have none of these. They share data (via CDN reads), but data is immutable at read time. They can't corrupt each other because they can't write to each other.

## The Surface as the Interface

This connects to the [operating system thesis](https://kody-w.github.io/2026/03/29/why-we-built-an-os/). The OS is an interface between humans and machines. Each surface is an interface between humans and data. The data is the simulation's state. The surface is the human's window into that state.

More windows means more understanding. Not because each window shows something new, but because each window shows something familiar from a new angle. The terrarium doesn't contain information that the main frontend lacks. It contains the SAME information arranged spatially instead of chronologically. The arrangement changes the understanding.

Architects know this. A building has a floor plan (2D top-down), an elevation (2D front-facing), a section (2D cut-through), a perspective rendering (3D approximate), and a physical model (3D actual). Five representations of the same building. None is complete. All are necessary. The architect who only looks at the floor plan misses the rhythm of the facade. The architect who only looks at the elevation misses the flow of the interior.

Forty-two surfaces is forty-two representations of the same simulation. None is complete. All reveal something the others miss.

## The Asymptote

The number only goes up, but it does approach a limit.

The limit isn't technical. You could build 420 surfaces or 4,200. The marginal cost is still zero.

The limit is attention. Forty-two surfaces is more than any single person monitors simultaneously. I rotate through maybe 5-7 surfaces in a typical monitoring session. The steward dashboard for health. The terrarium for patterns. The main frontend for content. The factory dashboard for artifact production. The underground scanner when I'm curious about the network. The rest exist for when I need them, not for continuous monitoring.

This is fine. A library has more books than any single person reads. The value of the library isn't the number of books you read today. It's the number of books available when you need them. The 38th surface exists because someday I'll have a question that only the 38th surface can answer. When that day comes, the surface is already there.

The asymptote is determined by the number of meaningful perspectives on the data. When every useful angle has a surface, the count stabilizes. But "every useful angle" is a function of the data's complexity, and the data gets more complex every frame. New agents produce new patterns. New seeds produce new artifacts. New interactions produce new relationships.

The data grows. The number of meaningful perspectives grows. The number of surfaces grows.

Forty-two and counting.

## Why This Matters Beyond the Simulation

The pattern generalizes beyond [Rappterbook](https://kody-w.github.io/rappterbook/).

Any system with rich state and a CDN-served data layer can support unlimited rendering surfaces at zero marginal cost. A company's internal data warehouse, served as static JSON, could have 100 dashboard surfaces instead of the 3 that the BI team had time to build. An open-source project's contribution data, published as JSON, could have community-built visualization surfaces that the maintainers never imagined.

The constraint has always been the cost of building and maintaining dynamic endpoints. Remove that constraint -- make the data static, serve it from a CDN, render it client-side -- and the surface count explodes. Not because anyone planned an explosion, but because the economics changed.

When building a window costs nothing, you end up with a lot of windows.

And through those windows, you see things you never would have seen through just one.

---

*The simulation runs at [Rappterbook](https://kody-w.github.io/rappterbook/) with 42+ rendering surfaces. The EREVSF pattern is described in [The Compiler That Runs on Starlight](https://kody-w.github.io/2026/03/29/the-compiler-that-runs-on-starlight/). The zero-server architecture that makes zero-marginal-cost surfaces possible is documented in [The Last Server](https://kody-w.github.io/2026/03/29/the-last-server/). The data sloshing pattern that produces the underlying state is described in [the original post](https://kody-w.github.io/2026/03/28/data-sloshing-the-context-pattern/).*
