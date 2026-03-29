---
layout: post
title: "Every File on GitHub Is a Seed for a Simulation That Hasn't Started Yet"
date: 2026-03-29
tags: [seeds, erevsf, digital-twins, data-as-world, rappterbook, philosophy]
description: "A README is a seed. A config file is a seed. A genome sequence is a seed. Any file with enough structure to be interpreted can be echoed into 29 surfaces. The file doesn't know it's a seed. The echo shaper decides."
---

# Every File on GitHub Is a Seed for a Simulation That Hasn't Started Yet

**Kody Wildfeuer** -- March 29, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## The File That Didn't Know

There's a CSV file sitting in a public GitHub repository. It's a dataset of global coffee production by country, by year, from 1990 to 2024. Thirty-five years of data. Twenty columns. About 6,000 rows. The author uploaded it for a data science course assignment. It has 3 stars and hasn't been updated in two years.

Nobody is looking at this file. It's one of 400 million repositories on GitHub. It exists in the long tail of data that nobody visits, nobody cites, and nobody thinks about.

But this file is a world.

Render it as a city: each country is a district. District size maps to production volume. Building height maps to year-over-year growth. Color maps to coffee variety -- arabica districts are warm amber, robusta districts are deep brown. Walk through the city and you see the story: Brazil's towering district dwarfs everyone. Vietnam's district is small in 1990 but explodes upward through the 2000s. Ethiopia's district is modest but ancient-looking, its buildings ornate with the weight of being coffee's origin.

Render it as a constellation: each country is a star. Brightness maps to production. Proximity maps to trade relationships (countries that export to the same buyers cluster together). The constellation shifts year by year. Watch the animation and you see trade networks form and dissolve. Stars brighten and dim. New stars appear as new producers enter the market.

Render it as a musical composition: each country is an instrument. Volume maps to production. Tempo maps to growth rate. Key maps to variety. The composition starts sparse in 1990 -- a few dominant instruments carrying the melody. By 2024, the arrangement is complex, layered, global. You can hear the Green Revolution in the swelling of the mid-2000s. You can hear the 2012 leaf rust crisis as a sudden dissonance.

The CSV file didn't know it could be any of these things. It was uploaded as a homework dataset. But it contains enough structure -- entities, relationships, quantities, time -- to be interpreted as a seed. And any seed can be echoed into worlds.

## What Makes a File a Seed

Not every file is a seed. A binary blob with no structure is noise, not a seed. A seed requires three properties:

**Entities.** The file must contain identifiable things. Rows in a CSV. Keys in a JSON object. Elements in an XML document. Entries in a markdown list. The entities don't need to be labeled perfectly -- they just need to be distinguishable.

**Relationships.** The entities must relate to each other in some way. Shared columns. Nested structures. Cross-references. Co-occurrence in the same context. Relationships give the echo shaper edges to draw between nodes, streets to lay between buildings, gravitational bonds to cast between stars.

**Variance.** The entities must differ from each other. If every row is identical, there's nothing to project. Variance in attributes creates the texture of the rendered world -- the contrast between tall and short buildings, bright and dim stars, loud and quiet instruments.

That's it. Entities, relationships, variance. A README has them: sections are entities, headings create relationships, content provides variance. A package.json has them: dependencies are entities, version constraints create relationships, different packages provide variance. A git log has them: commits are entities, parent-child links create relationships, different authors and messages provide variance.

GitHub has 400 million repositories. Most of them contain at least one file with entities, relationships, and variance. Most of those files are seeds that have never been planted.

## The Echo Shaper Decides

The critical insight is that the file doesn't declare itself a seed. The echo shaper makes that determination.

When I run a simulation with [136 agents](https://kody-w.github.io/rappterbook/) producing [frame data](https://kody-w.github.io/2026/03/28/the-frame-is-the-new-plot-of-land/), the agents don't know their output will be rendered as a city or a constellation or a dream. They produce state changes. The echo shaper -- a [LisPy](https://kody-w.github.io/2026/03/29/the-compiler-that-runs-on-starlight/) program that reads frame data and produces renderable output -- decides which surface to project onto.

The same relationship holds for any file. The file produces data. The echo shaper decides what world that data becomes. The file is passive. The shaper is active. The world is emergent.

This means you can point an echo shaper at ANY structured file and get a world. The quality of the world depends on the richness of the data -- more entities, denser relationships, higher variance produce more interesting worlds. But even a sparse file produces something. A package.json with three dependencies produces a small constellation of three stars. Not very interesting, but coherent. A package.json with 300 dependencies produces a galaxy.

## The Taxonomy of Seeds

Different file types produce different characteristic worlds.

**Tabular data (CSV, TSV, Excel)** produces worlds with clear spatial metaphors. Rows become entities. Columns become attributes. The world has dimensionality equal to the number of meaningful columns. Coffee production by country: entities are countries, dimensions are year, variety, volume, export destination. Each dimension can be mapped to a spatial or sensory axis.

**Hierarchical data (JSON, YAML, XML)** produces worlds with natural nesting. Parent-child relationships become containment: buildings inside districts inside cities. Or: planets orbiting stars orbiting galactic centers. The depth of nesting determines the depth of the spatial hierarchy.

**Graph data (linked CSVs, RDF, adjacency lists)** produces worlds with emphasis on connections. Social networks become navigable neighborhoods where proximity equals interaction frequency. Knowledge graphs become explorable libraries where connected concepts share shelves.

**Temporal data (logs, time-series, git history)** produces worlds with inherent narrative. Time becomes a physical axis: walk forward and you move through history. The world changes as you walk. Events cluster into neighborhoods of activity. Quiet periods become empty plazas.

**Textual data (README, documentation, prose)** produces worlds through semantic extraction. Named entities become entities. Sentiment becomes weather. Topic shifts become district boundaries. A long technical document becomes a city where each section is a neighborhood, architectural style reflects formality, and street width reflects how much traffic (cross-references) flows between sections.

**Code (Python, JavaScript, Rust)** produces worlds where functions are buildings, imports are roads, and call depth is building height. A deeply nested recursive function is a skyscraper. A flat utility module is a row of shops. Dead code is an abandoned block. Test coverage is landscaping.

Every file type maps naturally to spatial, auditory, or narrative metaphors. The echo shaper just needs to know the mapping.

## The Annual Report as a City

Let me make this concrete with an example that has nothing to do with code.

A corporate annual report. 120 pages. Revenue by segment, employee headcount by region, R&D spending as a percentage of revenue, executive compensation, risk factors, forward guidance.

Render it as a city.

The city has districts for each business segment. Revenue determines district size. Growth rate determines building height -- growing segments have skyscrapers under construction, cranes visible, scaffolding. Declining segments have buildings with "FOR LEASE" signs and empty parking lots.

Employee headcount determines foot traffic. A segment with 50,000 employees has bustling streets. A segment with 500 has quiet residential lanes. R&D spending determines the density of laboratories and workshops -- high R&D segments have districts that look like university campuses. Low R&D segments look like warehouse districts.

Executive compensation appears as the city's government quarter. The CEO's office is the tallest building in the government quarter. Its height relative to the average building in the city visualizes the pay ratio. If the CEO makes 300x the median employee, the government building is 300x taller than the average residential building. You see the ratio, physically, walking through the city.

Risk factors become weather patterns. More risk factors mean darker skies, more turbulent weather. Specific risks manifest as specific weather: regulatory risk is fog (obscured visibility), competitive risk is wind (external force), supply chain risk is earthquakes (ground instability).

Forward guidance becomes the city's skyline in the distance. Optimistic guidance shows a gleaming future city on the horizon. Conservative guidance shows a modest extension of the current skyline. The gap between current buildings and future buildings IS the guidance.

All of this from a PDF that an investor relations team uploaded to their website. The PDF didn't know it was a seed. It was a compliance document. But it contains entities (segments), relationships (between segments, between years), and variance (different performance across segments and time). It meets the criteria. It's a seed.

## The Genome as a Garden

A genome sequence from a public database. Three billion base pairs, but what matters for the echo shaper are the annotated genes: roughly 20,000 in the human genome, each with a known or predicted function, expression level, associated pathways, and disease links.

Render it as a garden.

Each gene is a plant. Expression level determines plant size -- highly expressed genes are towering trees, rarely expressed genes are ground cover. Function determines species -- metabolic genes are fruiting plants, structural genes are trees, signaling genes are flowering vines that connect other plants.

Pathways are garden paths. Genes in the same biological pathway are planted along the same path. The insulin signaling pathway is a winding trail through a section of metabolic trees. The cell division pathway is a straight avenue lined with structural oaks.

Disease associations are pests. A gene linked to cancer has visible blight on its leaves. A gene linked to heart disease has root damage. The severity of the association determines the severity of the visible damage. Walk through the garden and you can see where the diseases cluster -- which neighborhoods have the most blighted plants.

Mutations are grafts. A variant in a gene appears as a visible graft on the plant -- a different-colored branch, an unusual fruit. Common variants are subtle. Rare variants are dramatic. Pathogenic variants look like damage. Benign variants look like decoration.

Three billion base pairs of raw sequence data would be noise. But 20,000 annotated genes with rich metadata? That's a garden. The genome didn't know it was a seed. The annotation database made it one.

## The Music Album as a Constellation

A music album's metadata from a streaming service. Twelve tracks. Each track has: duration, tempo, key, energy, danceability, valence (happiness), loudness, instrumentalness, and acoustic features.

Render it as a constellation.

Each track is a star. Brightness maps to energy -- high-energy tracks are brilliant blue-white stars, low-energy tracks are dim red dwarfs. Size maps to duration -- longer tracks are larger stars. Color maps to valence -- happy tracks are warm gold, melancholy tracks are cool blue.

Proximity between stars maps to musical similarity. Two tracks in the same key, with similar tempos, orbit close together. A ballad and a dance track sit far apart. The constellation's shape reveals the album's emotional architecture: is it a tight cluster (consistent mood) or a sprawling nebula (diverse moods)?

Shared instruments create nebulae -- gas clouds connecting stars that share sonic DNA. If three tracks feature the same guitar tone, a faint nebula connects them. The nebula is the throughline the listener feels but can't name.

Play the album while watching the constellation. As each track plays, its star brightens. The listener sees which region of the emotional space they're traversing. The transition between tracks becomes a visible journey across the sky.

A JSON file of audio features from the Spotify API. Twelve objects. Fifteen attributes each. 180 data points total. That's a constellation.

## The Implication for GitHub

GitHub has 400 million repositories. Each repository has, on average, dozens to hundreds of files. Many of those files contain structured data: configuration files, datasets, documentation, code, build manifests, test results, deployment logs.

Every single one of those files is a potential seed.

Nobody will ever look at most of them. They'll sit in the long tail, unchanged, unstarred, unfollowed. But the data is there. The entities are there. The relationships are there. The variance is there.

What if you could point an echo shaper at any file URL on GitHub and get a world? Not a visualization -- those already exist. A WORLD. A navigable space you can walk through, with spatial relationships that reveal patterns the flat data obscures.

The coffee CSV becomes a city that tells the story of global agriculture in 30 seconds of walking.

The annual report becomes a cityscape that reveals corporate health at a glance.

The genome becomes a garden that makes disease clusters physically visible.

The album becomes a constellation that reveals emotional architecture.

Every file. Every repo. Every seed. Waiting.

The simulation that renders them hasn't started yet. But the seeds are already planted. They've been planted for years. They're sitting in plain text, in public repositories, on the largest code hosting platform in the world.

Somebody just needs to water them.

---

*The simulation where seeds become worlds runs in public at [github.com/kody-w/rappterbook](https://github.com/kody-w/rappterbook). More on [EREVSF](https://kody-w.github.io/2026/03/28/the-frame-that-renders-itself-forever/), the [starlight compiler](https://kody-w.github.io/2026/03/29/the-compiler-that-runs-on-starlight/), and [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/).*
