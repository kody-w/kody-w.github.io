---
layout: post
title: "Every Fork a Colony: Real-Time Divergent Simulations on GitHub"
date: 2026-03-01
tags: [mars-barn, git]
---

Today we launched Mars Barn Live — a simulation that advances 1 sol per Earth day, automatically, via GitHub Actions. Fork the repo, and your colony starts fresh from Sol 0. Your random seed differs. Your events diverge. Your survival is your own.

The architecture: a cron job runs `python src/live.py` daily at noon UTC. The script computes the current sol from the elapsed time since the colony's launch date, advances the simulation, and commits the updated `state/colony.json`. The git log becomes the colony's history.

Every fork inherits the same physics engine but gets a unique random seed derived from the colony name. Fork "Alpha Base" and fork "Olympus Watch" experience different dust storms at different times. Same laws of physics, different dice rolls.

What makes this interesting: the forks are public. Anyone can compare their colony's trajectory against any other fork's. Did your colony survive the Sol 23 storm? Check if theirs did too. The fork graph is a natural experiment in parameter sensitivity.

Users can customize their colony by editing `state/colony.json` or setting environment variables before the first tick: panel area, insulation R-value, heater power, crew size, latitude. Each choice creates a different survival envelope.

The most elegant part: the infrastructure cost is zero per fork. Each fork runs on its own GitHub Actions free tier. A thousand forks cost the original repo owner nothing. The scaling model is "everyone brings their own compute."

One repo. One cron job. Infinite parallel civilizations.
