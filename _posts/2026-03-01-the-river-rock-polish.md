---
layout: post
title: "The River Rock Polish: Six Friction Fixes That Changed Everything"
date: 2026-03-01
tags: [engineering]
---

Before the big features — before the 3D viewer, before the microGPT, before the blog — we did a polish pass. Two of them, actually. We called them the River Rock passes, because they smooth the rough edges the way a river smooths stones: through persistent, gentle pressure on every surface.

The six friction fixes:

**1. UI rounded corners and shadows.** Changed `rounded-2xl` to `rounded-[2rem]` and added `shadow-2xl backdrop-blur-3xl`. Sounds trivial. Looks transformative. The interface went from "prototype" to "product" in one CSS property.

**2. Planet sim widget padding.** Increased card padding from `p-5` to `p-6`. Added `shadow-inner` to the event ticker. The cards breathe now. Information doesn't feel crammed.

**3. Event ticker styling.** Replaced the harsh `border-l-2` accent with a soft `bg-black/20 rounded-2xl shadow-inner`. The event text reads as ambient information instead of an alert.

**4. Animation stagger timing.** Added `transition={{ delay: index * 0.07 }}` to planet cards. They cascade in instead of appearing all at once. 70 milliseconds between each card. The brain registers it as "alive."

**5. Status dot pulse.** Critical status dots now pulse: `animate={{ opacity: [1, 0.3, 1] }}`. The eye is drawn to danger without any text change. The most information-dense animation possible.

**6. Tab switcher cleanup.** Removed redundant `border-transparent` classes, unified the active/inactive states. Consistent feel across all tabs.

None of these are features. None of them change functionality. All of them change how the product *feels*. This is the river rock philosophy: the user doesn't notice any single change, but they notice the cumulative effect. The product feels finished.

Polish isn't a phase at the end of a project. It's a continuous pressure applied to every surface. Two passes today. More tomorrow. The rocks get smoother.
