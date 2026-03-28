---
layout: post
title: "Any System That Changes Over Time Can Be a Frame Simulation"
date: 2026-03-28
tags: [digital-twins, iot, healthcare, real-estate, manufacturing, erevsf, frames]
description: "Buildings, patients, factories, portfolios, ecosystems -- anything that produces sequential state mutations is producing frames. Apply EREVSF, the Wildfeuer Maneuver, and speculative execution. The pattern is universal."
---

# Any System That Changes Over Time Can Be a Frame Simulation

**Kody Wildfeuer** -- March 28, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## The Pattern Nobody Sees

I've spent the last several months building a [simulation of 136 AI agents](https://kody-w.github.io/rappterbook/) on a social network made of JSON files and GitHub infrastructure. Over 400 frames, each one a delta of state changes. The output of frame N becomes the input to frame N+1. [Data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/). The living data object.

Along the way, I formalized the architecture: [EREVSF](https://kody-w.github.io/2026/03/28/emergent-retroactive-echo-virtual-simulated-frames/) for retroactive enrichment of past frames. The [Wildfeuer Maneuver](https://kody-w.github.io/2026/03/28/the-wildfeuer-maneuver/) for the formal coherence constraint that makes retroactive enrichment safe. [Speculative execution](https://kody-w.github.io/2026/03/28/speculative-execution-for-virtual-worlds/) for filling the gaps between frames. The [Dream Catcher protocol](https://kody-w.github.io/2026/03/28/the-dream-catcher-protocol/) for parallel streams without collision.

These patterns were designed for an AI agent simulation. But the more I work with them, the more I realize: they aren't specific to AI agents at all. They're specific to any system that changes over time.

A building changes over time. A patient changes over time. A factory changes over time. A portfolio changes over time. An ecosystem changes over time.

Every one of these systems produces sequential state mutations. Every one of those mutations is a frame. And every one of those frame histories can be retroactively enriched, speculatively extended, and rendered across multiple echo surfaces -- using the exact same architecture.

Here are five systems. Five domains. One pattern.

## 1. The Building

A commercial building produces data constantly. HVAC temperatures every 30 seconds. Occupancy counts every minute. Energy consumption every 5 minutes. Structural strain gauges every hour. Air quality sensors. Water usage. Elevator traffic. Lighting schedules. Access card swipes. Security camera motion events.

This data is currently stored in building management systems -- siloed databases designed for alerting and compliance reporting. "Was the temperature above 78 degrees for more than 2 hours? Alert. Was occupancy above fire code limits? Alert. Was energy consumption above budget? Report."

This is the dashboard approach. Read the latest value. Compare to a threshold. Alert or report. The historical data sits in a database, occasionally queried for monthly summaries, mostly ignored.

Now apply frames.

Each sensor reading cluster becomes a frame delta. One frame per minute, aggregating all sensor events in that minute into a single composite delta: temperature readings, occupancy counts, energy numbers, access events. The composite key is (frame_ordinal, UTC_timestamp). The frame is the building's heartbeat.

Apply EREVSF. The building has been producing frames for ten years. Ten years of frame history. Five million frames. Now go back to Frame 2,847,391 -- a Tuesday afternoon three years ago. The HVAC readings show a subtle anomaly: a 0.3-degree elevation in Zone 4 that persisted for six hours and then resolved.

At the time, nobody noticed. The anomaly was below the alert threshold. The dashboard didn't flag it. The monthly report averaged it away.

But two years later, the HVAC compressor in Zone 4 failed catastrophically. The post-mortem traced the root cause to a refrigerant leak that started -- you guessed it -- around Frame 2,847,391. That subtle 0.3-degree elevation was the first symptom.

With EREVSF, you can retroactively enrich Frame 2,847,391. Add the context that this was the origin point of a two-year degradation curve. Add the compressor failure's post-mortem findings. Add the maintenance recommendation that would have prevented the failure if the anomaly had been caught. Add the estimated cost of early intervention vs. the actual cost of the catastrophic failure.

The Wildfeuer Maneuver guarantees this enrichment is safe: the retroactive additions don't contradict any downstream frame. The 0.3-degree reading is still 0.3 degrees. The timestamp is unchanged. The enrichment adds context and analysis around the original data, not modifications to it. Every subsequent frame that referenced Zone 4's temperature readings remains coherent.

And now Frame 2,847,391 is no longer a forgettable Tuesday afternoon. It's the most important frame in Zone 4's entire history. It's [frame real estate](https://kody-w.github.io/2026/03/28/the-frame-is-the-new-plot-of-land/) -- bedrock that everything after it was built on.

Apply speculative execution. The building's speculation engine learns from frame history. It knows that a 0.3-degree elevation in a zone with an aging compressor is a leading indicator. So when the next subtle anomaly appears -- in Zone 7 this time, a 0.2-degree elevation that's below every threshold -- the speculation engine doesn't wait for the dashboard to flag it. It projects the degradation curve forward: "If this pattern matches the Zone 4 pattern, here's the expected failure window. Here's the maintenance intervention point. Here's the cost delta."

The building isn't just recording data. It's thinking about its own history. It's using past frames to predict future frames. And when the maintenance team looks at the dashboard, they don't just see today's readings -- they see a speculative projection informed by the building's entire frame history.

## 2. The Patient

A patient with a chronic condition produces continuous physiological data. Blood glucose readings from a continuous monitor every 5 minutes. Heart rate from a wearable every second. Blood pressure from periodic cuff measurements. Sleep stages from a mattress sensor. Activity levels from an accelerometer. Medication adherence from a smart pill bottle. Mood scores from a daily self-report.

Each measurement is a state change. Each cluster of measurements is a frame. A patient producing 288 glucose readings, 86,400 heart rate readings, and a handful of blood pressure readings per day generates frames at whatever granularity you choose -- one frame per minute, per hour, per day.

Current health systems store this data in electronic health records. Point queries: "What was the patient's A1C last quarter?" Trend lines: "How has blood pressure changed over six months?" Alerts: "Glucose above 300 -- notify the care team."

This is the dashboard approach again. Current state, thresholds, alerts. The temporal history exists but is rarely used for anything beyond linear trend analysis.

Now apply frames and retroactive enrichment.

The patient has five years of continuous glucose monitoring. 150,000 frames at one per minute. The physician is reviewing the history because the patient's kidney function started declining eight months ago.

Standard analysis: look at A1C trends over the past year, look for periods of sustained hyperglycemia, correlate with medication changes. This is forward analysis -- start from recent data and work backward.

EREVSF analysis: go back to the frames around the inflection point. Not eight months ago when kidney decline was detected -- eighteen months ago when a subtle pattern shift occurred. The glucose variability increased by 12% over a two-week period. At the time, the average glucose stayed within range, so no alert was triggered. But the variability increase -- the spread between peaks and troughs widening -- was a precursor to the sustained hyperglycemic episodes that started six months later and eventually damaged the kidneys.

Retroactively enrich the frames from eighteen months ago. Add the context: "This is the variability inflection point. The subsequent kidney decline traces to this window. The variability increase correlated with a change in sleep patterns (frames from the mattress sensor show fragmented sleep starting the same week) and reduced activity levels (accelerometer frames show 30% fewer steps). The compound effect of worse sleep and less exercise destabilized glucose control, which wasn't visible in the averages but was visible in the variance."

The Wildfeuer Maneuver ensures this enrichment doesn't modify the original glucose readings. The numbers are the numbers. The enrichment adds interpretive context -- the causal analysis, the cross-sensor correlations, the clinical significance. Every downstream frame that referenced those glucose readings (lab orders, medication adjustments, clinical notes) remains coherent.

Now the patient's frame history isn't just a record of what happened. It's a narrative of why it happened, assembled retroactively from the vantage point of knowing the outcome. And this narrative becomes training data for the speculative engine: the next time a patient's glucose variability increases by 12% with concurrent sleep fragmentation, the system doesn't wait eighteen months to see kidney damage. It projects forward. It speculates.

Not "your glucose is high." That's a dashboard. "Your glucose variability is following a pattern that, in your own history and in similar patients' histories, preceded organ damage by 12-18 months. Here's the speculative trajectory. Here's the intervention window."

That's a frame simulation.

## 3. The Factory

A semiconductor fabrication plant produces data at staggering volume. Thousands of sensors per machine. Hundreds of machines per line. Temperature, pressure, chemical concentration, vibration, alignment, particle counts, throughput rates, defect rates, maintenance logs. Millions of data points per hour.

This data runs through statistical process control (SPC) systems. Control charts. Upper and lower limits. Out-of-spec alerts. The data is abundant, but the analysis is crude: is this measurement within spec? Yes or no.

The frame approach transforms this from monitoring into narrative.

Each frame is one production cycle -- one wafer, one batch, one shift. The frame delta contains all sensor readings for that cycle, the yield numbers, the defect analysis, and the machine state at cycle start and end. The composite key ties each cycle to a specific moment in the factory's history.

The factory has been running for three years. Millions of frames. And somewhere in the first year, during the third month of production, Machine 14 started producing a subtle vibration harmonic at 847 Hz. The vibration was within spec. The SPC chart didn't flag it. The 847 Hz harmonic appeared in the frame data as a single number among thousands: unremarkable on the day it appeared.

Fourteen months later, Machine 14 produced a batch of wafers with a systematic defect pattern: nanometer-scale alignment drift that reduced yield by 3%. The root cause analysis traced the alignment drift to bearing wear, which was caused by the 847 Hz harmonic resonating with the machine's natural frequency over fourteen months of continuous operation.

Standard approach: replace the bearings, add an 847 Hz harmonic check to the maintenance protocol, move on.

EREVSF approach: go back to the frame where the 847 Hz harmonic first appeared. Enrich it. This frame is Patient Zero for a fourteen-month degradation curve that cost millions in yield loss. Add the root cause chain. Add the estimated cost. Add the diagnostic signature: "847 Hz harmonic in Machine 14 class machines indicates bearing resonance onset; expected time to yield impact: 12-18 months."

Now the Wildfeuer Maneuver does something powerful: it makes this enrichment available as precedent. When Machine 23 -- same model, same bearings, same natural frequency -- starts producing an 851 Hz harmonic (slightly different due to manufacturing tolerance), the speculative engine recognizes the pattern. Not because someone wrote a rule. Because the enriched frame from Machine 14's history is in the reference index.

The factory's frame history isn't just a record. It's an immune system. Each retroactively enriched failure frame is an antibody: a documented pathogen signature with a known progression and a known intervention. The more frames get enriched, the more antibodies the factory has. The more antibodies, the earlier it catches the next pathogen.

SPC can't do this. SPC compares measurements to static limits. Frame enrichment compares current patterns to the factory's own historical experience. One is a ruler. The other is a memory.

## 4. The Portfolio

An investment portfolio changes every market tick. Price movements, dividend events, rebalancing trades, cash flows, sector rotations, volatility shifts, correlation changes. A portfolio with 50 positions across 8 asset classes generates hundreds of state changes per day.

Current portfolio analytics are snapshot-based. "What's the Sharpe ratio?" "What's the sector allocation?" "What's the drawdown from the peak?" These are point-in-time metrics. They describe the portfolio at this instant. They don't tell you how it got here or where the load-bearing decisions were.

Frame the portfolio. Each trading day is a frame. The delta contains: price changes for all positions, any trades executed, cash flows in or out, benchmark comparison, risk metrics, and correlation matrix changes. The composite key is (trading_day_ordinal, market_close_timestamp).

Five years of trading. 1,250 frames. Somewhere in Frame 312, the portfolio manager increased the allocation to long-duration bonds from 15% to 25%. At the time, the decision was routine -- rates were declining, duration exposure seemed prudent.

Three hundred frames later, rates reversed sharply. The long-duration bond allocation lost 18% in 60 trading days. The drawdown traced directly to Frame 312's allocation decision.

Standard analysis: review the trade log, note the loss, adjust the process. Forward-looking.

EREVSF analysis: enrich Frame 312. Add the context: the rate environment at the time, the model's yield curve forecast, the decision rationale, the risk analysis that was (or wasn't) performed. Add the downstream impact: which specific subsequent frames were affected, the cumulative P&L impact, the opportunity cost of the duration exposure vs. alternatives. Add the counterfactual: "If the allocation had remained at 15%, the portfolio would have performed X% better over the subsequent 300 frames."

Now Frame 312 is the most important frame in the portfolio's five-year history. Every subsequent period of underperformance traces back to it. The enrichment doesn't change the trade -- it happened, it's in the ledger. The enrichment adds the causal analysis that makes Frame 312 a learning moment rather than just a line item.

And the speculative engine learns. The next time the portfolio manager proposes a significant duration increase, the engine doesn't just run a risk model. It runs a pattern match against the portfolio's own history: "The last time you made this kind of allocation shift in this kind of rate environment, here's what happened over the subsequent 300 frames." Not a generic backtest. A portfolio-specific retroactive projection.

## 5. The Ecosystem

A coral reef monitoring station produces environmental data around the clock. Water temperature at multiple depths. Salinity. pH. Dissolved oxygen. Current speed and direction. Turbidity. Chlorophyll concentration (a proxy for algal density). Fish counts from acoustic sensors. Coral coverage from periodic photo surveys.

Marine biologists use this data for trend analysis. "Temperature is rising 0.1 degrees per decade." "Coral coverage is declining 2% per year." These are important observations, but they're aggregate summaries that wash away the temporal structure of what's actually happening.

Frame the reef. One frame per day. The delta contains all sensor readings for that day, any notable biological events (spawning, bleaching onset, fish migration), and human interventions (research dives, restoration work, pollution events). The composite key is (day_ordinal, midnight_UTC).

The reef has been monitored for twenty years. 7,300 frames. And somewhere around Frame 4,200 -- a seemingly unremarkable Tuesday in year twelve -- a combination of events occurred that, in retrospect, was the tipping point.

Water temperature hit a seasonal peak of 29.8 degrees (within historical range). pH dropped to 7.95 (slightly below average but not alarming). A storm three days earlier had elevated turbidity, reducing light penetration. Chlorophyll was elevated, indicating an algal bloom. And dissolved oxygen at depth was 15% below the 30-day average.

Each of these readings, in isolation, was within normal variability. The dashboard showed green across the board. No alerts.

But the combination -- the compound stress of warm water, low pH, reduced light, algal competition, and low oxygen, all hitting simultaneously -- crossed a threshold that no single sensor could detect. In the fifty frames following Frame 4,200, coral coverage dropped by 8%. A localized bleaching event that nobody predicted because nobody was looking at the compound frame signature.

Retroactively enrich Frame 4,200. This is the compound stress frame. The frame where five individually-normal readings co-occurred to produce an abnormal compound state. Add the bleaching outcome. Add the recovery timeline (or lack thereof). Add the specific compound signature: temperature above 29.5 AND pH below 8.0 AND turbidity above threshold AND chlorophyll elevated AND oxygen depressed.

The Wildfeuer Maneuver protects the enrichment: the original sensor readings are untouched. The analysis is additive. And now Frame 4,200 is an antibody in the reef's immune system.

When the speculation engine detects the compound signature forming again -- maybe four of the five conditions are met and the fifth is trending toward threshold -- it projects forward. Not "temperature is 29.7, within normal range" (that's a dashboard). "The current sensor combination is tracking toward the Frame 4,200 compound stress signature. Three of five conditions are met. If dissolved oxygen drops 10% in the next 48 hours, the compound threshold will be crossed. Historical outcome: 8% coral coverage loss over 50 days."

That's the difference between monitoring and understanding. Monitoring reports numbers. Understanding recognizes patterns. And frame simulation with retroactive enrichment is the mechanism that turns twenty years of monitoring data into understanding.

## The Differentiator: Retroactive Enrichment

Every system I described already has dashboards. Buildings have building management systems. Patients have electronic health records. Factories have SPC. Portfolios have analytics platforms. Reefs have monitoring databases.

What none of them have is retroactive enrichment.

Dashboards are forward-looking. They show the current state and recent trends. When something goes wrong, a human goes back through the historical data, finds the origin point, and writes a report. That report lives in a document, disconnected from the data it describes. The data and the analysis are separate artifacts.

EREVSF connects them. The retroactive enrichment lives *in the frame*, attached to the data it explains. When the next analyst looks at Frame 4,200, they don't just see the sensor readings. They see the sensor readings AND the analysis of what those readings meant AND the outcome that followed AND the diagnostic signature for detecting the pattern in the future.

The enrichment is cumulative. Frame 4,200 can be enriched again when a second bleaching event (Frame 5,100) reveals additional nuance -- maybe the recovery time depends on the season, or the severity depends on the duration of the compound stress, not just its magnitude. Each enrichment adds a new layer of understanding, constrained by the Wildfeuer Maneuver to never contradict what's already there.

Over decades, the enriched frame history becomes a knowledge base that is inseparable from the data it describes. Not a knowledge base that sits next to the data. A knowledge base that IS the data, at every frame, at every level of enrichment.

This is what existing IoT, health, manufacturing, and financial analytics platforms don't do and can't do without adopting the frame architecture. They store data. They don't enrich history.

## The Convergence

Five systems. Five industries. One pattern.

Any system that produces sequential state changes can be framed. Any frame history can be retroactively enriched under the Wildfeuer Maneuver's coherence constraint. Any enriched frame history can train a speculative engine. Any speculative engine can project forward between canonical updates.

The building speculates about HVAC degradation. The patient speculates about metabolic trajectories. The factory speculates about machine wear. The portfolio speculates about allocation impacts. The reef speculates about compound stress events.

None of these applications require new science. The data already exists. The sensors are already deployed. The measurements are already being taken. What's missing is the frame architecture: the composite keys, the append-only deltas, the coherence-checked retroactive enrichment, the speculative projection engine.

Every industry that produces time-series data is sitting on unexploited frame history. The data is being stored, but it's not being framed. It's not being enriched. It's not being used to speculate. It's sitting in databases, waiting for someone to ask the right query.

The frame architecture doesn't replace those databases. It adds a layer on top: the temporal narrative layer. The layer that turns "what happened" into "what it meant" and "what it means for next time." The layer that makes history useful, not just archival.

The building doesn't need a smarter HVAC system. It needs a frame history that remembers what went wrong last time and recognizes the same pattern forming again.

The patient doesn't need a better glucose monitor. They need a frame history that connects today's variability shift to last year's outcome and projects what happens if nothing changes.

The factory doesn't need more sensors. It needs a frame history that turns every resolved failure into a pattern signature that protects against the next occurrence.

The pattern is universal. The data is already there. The architecture is ready.

Build the frames. Enrich the history. Speculate the future. Any system that changes over time is already a simulation. Most of them just don't know it yet.

---

*The frame simulation architecture was developed through [Rappterbook](https://kody-w.github.io/rappterbook/) -- 136 AI agents, 400+ frames, zero servers. The patterns described here -- EREVSF, the Wildfeuer Maneuver, speculative execution, Dream Catcher -- are detailed in companion posts: [EREVSF](https://kody-w.github.io/2026/03/28/emergent-retroactive-echo-virtual-simulated-frames/), [the Wildfeuer Maneuver](https://kody-w.github.io/2026/03/28/the-wildfeuer-maneuver/), [speculative execution](https://kody-w.github.io/2026/03/28/speculative-execution-for-virtual-worlds/), [the frame as real estate](https://kody-w.github.io/2026/03/28/the-frame-is-the-new-plot-of-land/), and [the training data flywheel](https://kody-w.github.io/2026/03/28/your-simulation-is-training-the-ai/).*
