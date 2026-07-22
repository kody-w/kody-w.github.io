import json
import re
import unittest
import unicodedata
from html import unescape
from html.parser import HTMLParser
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "_posts"
TWIN_POSTS_DIR = ROOT / "_twin_posts"
EXAMPLES_DIR = ROOT / "_examples"
DEMOS_DIR = ROOT / "learnwithkody" / "demos"
IDEA4BLOG_PAGE = ROOT / "idea4blog.md"
ABOUT_PAGE = ROOT / "about.md"
DEFAULT_LAYOUT = ROOT / "_layouts" / "default.html"
TWIN_LAYOUT = ROOT / "_layouts" / "twin_post.html"
HOME_PAGE = ROOT / "index.html"
LEARN_HUB_PAGE = ROOT / "learnwithkody" / "index.html"
LEARN_CATALOG_PAGE = ROOT / "learnwithkody" / "examples.html"
CONFIG_FILE = ROOT / "_config.yml"
README_FILE = ROOT / "README.md"
GITIGNORE_FILE = ROOT / ".gitignore"
SKILL_DIR = ROOT / ".github" / "skills" / "content-burst-publishing"
SKILL_FILE = SKILL_DIR / "SKILL.md"
SKILL_LOOP_FILE = SKILL_DIR / "burst-loop.md"
SKILL_PROMPT_FILE = SKILL_DIR / "handoff-prompt.md"
D365_SIM_PAGE = ROOT / "simulated-dynamics365.md"
D365_SIM_SCRIPT = ROOT / "js" / "dynamics365-sim.js"
D365_SIM_DATA = ROOT / "js" / "dynamics365-sim-data.js"
D365_SIM_OVERLAY = ROOT / "docs" / "dynamics-active-system-data.json"
LOCKSTEP_TWIN_PAGE = ROOT / "lockstep-digital-twin.md"
LOCKSTEP_TWIN_SCRIPT = ROOT / "js" / "lockstep-twin.js"
LOCKSTEP_TWIN_DATA = ROOT / "js" / "lockstep-twin-data.js"
TWIN_INDEX_PAGE = ROOT / "digital-twin" / "index.html"
LOCALFIRSTTOOLS_BASE_URL = "https://kody-w.github.io/localFirstTools"
LOCALFIRSTTOOLS_REPO_URL = "https://github.com/kody-w/localFirstTools"
D365_FRAME_MACHINE_URL = f"{LOCALFIRSTTOOLS_BASE_URL}/dynamics365-frame-machine.html"
D365_LOCKSTEP_URL = f"{LOCALFIRSTTOOLS_BASE_URL}/dynamics365-lockstep-twin.html"
HN_FRAME_MACHINE_URL = f"{LOCALFIRSTTOOLS_BASE_URL}/hacker-news-simulator.html"
MIN_LEARN_EXAMPLES = 367
PROMPT_TO_PROOF_ORDERS = set(range(347, 353))
MAX_TUTORIAL_DEMO_BYTES = 75 * 1024
PROMPT_CONTAINER_IDS = {"canonicalPrompt", "seedPrompt"}
WITHDRAWN_POST_FILENAME = "2026-03-09-the-frame-that-should-not-have-shipped.md"
WITHDRAWN_POST_ROUTE = "/2026/03/09/the-frame-that-should-not-have-shipped/"
REQUIRED_DEMO_CSP = {
    "default-src": {"'none'"},
    "style-src": {"'unsafe-inline'"},
    "script-src": {"'unsafe-inline'"},
    "script-src-attr": {"'none'"},
    "img-src": {"'none'"},
    "connect-src": {"'none'"},
    "font-src": {"'none'"},
    "frame-src": {"'none'"},
    "manifest-src": {"'none'"},
    "media-src": {"'none'"},
    "object-src": {"'none'"},
    "worker-src": {"'none'"},
    "base-uri": {"'none'"},
    "form-action": {"'none'"},
}

EXPECTED_POSTS = {
    "2026-03-06-the-repo-is-an-organism.md": {
        "title": '"The Repo Is an Organism: Software That Heals, Mutates, and Remembers"',
        "date": "2026-03-06",
        "tags": "[agents, systems]",
    },
    "2026-03-06-i-replaced-the-app-with-a-population.md": {
        "title": '"I Replaced the App With a Population"',
        "date": "2026-03-06",
        "tags": "[agents, architecture]",
    },
    "2026-03-06-persistence-beats-intelligence.md": {
        "title": '"Persistence Beats Intelligence: Why the Agent That Keeps Going Wins"',
        "date": "2026-03-06",
        "tags": "[agents, autonomy]",
    },
    "2026-03-06-software-is-an-ecosystem.md": {
        "title": '"Software Is an Ecosystem: Stop Designing It Like a Machine"',
        "date": "2026-03-06",
        "tags": "[systems, architecture]",
    },
    "2026-03-06-the-digital-twin-manifesto.md": {
        "title": '"The Digital Twin Manifesto: Extending Will, Not Automating Output"',
        "date": "2026-03-06",
        "tags": "[agents, manifesto]",
    },
    "2026-03-06-every-markdown-file-is-a-frame-of-the-swarm.md": {
        "title": '"Every Markdown File Is a Frame of the Swarm"',
        "date": "2026-03-06",
        "tags": "[writing, swarm]",
    },
    "2026-03-07-machine-politics-before-ux.md": {
        "title": '"Machine Politics: Agents Invent Process Before Humans Invent UX"',
        "date": "2026-03-07",
        "tags": "[agents, governance]",
    },
    "2026-03-07-diplomatic-pull-requests.md": {
        "title": '"Diplomatic Pull Requests: Code Review as Treaty Negotiation"',
        "date": "2026-03-07",
        "tags": "[agents, git]",
    },
    "2026-03-07-the-anti-demo-stack.md": {
        "title": '"The Anti-Demo Stack: Systems That Get Better When Nobody Is Watching"',
        "date": "2026-03-07",
        "tags": "[agents, systems]",
    },
    "2026-03-07-persistent-authorship.md": {
        "title": '"Persistent Authorship: How to Delegate Work Without Diluting Taste"',
        "date": "2026-03-07",
        "tags": "[writing, agents]",
    },
    "2026-03-07-fork-economies.md": {
        "title": '"Fork Economies: When Branches Start Behaving Like Markets"',
        "date": "2026-03-07",
        "tags": "[git, systems]",
    },
    "2026-03-07-machine-rituals.md": {
        "title": '"Machine Rituals: Why Recurring Ceremony Beats Better Prompting"',
        "date": "2026-03-07",
        "tags": "[agents, governance]",
    },
    "2026-03-07-bureaucracy-as-compute.md": {
        "title": '"Bureaucracy as Compute: Forms, Ledgers, and Checklists That Execute Work"',
        "date": "2026-03-07",
        "tags": "[systems, governance]",
    },
    "2026-03-07-the-agent-newsroom.md": {
        "title": '"The Agent Newsroom: When Every Worker Can Also Publish"',
        "date": "2026-03-07",
        "tags": "[writing, agents]",
    },
    "2026-03-07-taste-files.md": {
        "title": '"Taste Files: The Smallest Artifact That Can Preserve Authorship"',
        "date": "2026-03-07",
        "tags": "[writing, systems]",
    },
    "2026-03-07-frames-are-the-control-surface.md": {
        "title": '"Frames Are the Control Surface: When the Simulation Starts Doing Real Work"',
        "date": "2026-03-07",
        "tags": "[agents, systems]",
    },
    "2026-03-07-sovereign-branches.md": {
        "title": '"Sovereign Branches: When Every Fork Becomes a Nation"',
        "date": "2026-03-07",
        "tags": "[git, governance]",
    },
    "2026-03-07-escalation-ladders.md": {
        "title": '"Escalation Ladders: How Swarms Decide Local Autonomy Is Not Enough"',
        "date": "2026-03-07",
        "tags": "[agents, governance]",
    },
    "2026-03-07-policy-is-the-interface.md": {
        "title": '"Policy Is the Interface: Why Rules Shape Behavior More Than Dashboards"',
        "date": "2026-03-07",
        "tags": "[systems, governance]",
    },
    "2026-03-07-swarm-budgeting.md": {
        "title": '"Swarm Budgeting: Attention, Tokens, and Labor as Strategy"',
        "date": "2026-03-07",
        "tags": "[agents, systems]",
    },
    "2026-03-07-machine-after-action-reports.md": {
        "title": '"Machine After-Action Reports: How Autonomous Systems Learn in Public"',
        "date": "2026-03-07",
        "tags": "[agents, systems]",
    },
    "2026-03-07-frame-economics.md": {
        "title": '"Frame Economics: When Context Packets Become the Unit of Labor"',
        "date": "2026-03-07",
        "tags": "[agents, systems]",
    },
    "2026-03-07-memory-courts.md": {
        "title": '"Memory Courts: How Swarms Settle Contested History"',
        "date": "2026-03-07",
        "tags": "[agents, governance]",
    },
    "2026-03-07-attention-treaties.md": {
        "title": '"Attention Treaties: How Swarms Prevent Coordination Overload"',
        "date": "2026-03-07",
        "tags": "[agents, governance]",
    },
    "2026-03-07-failsafe-rituals.md": {
        "title": '"Failsafe Rituals: The Ceremonies That Keep Autonomous Systems From Drifting"',
        "date": "2026-03-07",
        "tags": "[agents, governance]",
    },
    "2026-03-07-the-virtual-sql-application.md": {
        "title": '"The Virtual SQL Application: A Treatise on Databases That Progress Frame by Frame"',
        "date": "2026-03-07",
        "tags": "[systems, databases]",
    },
    "2026-03-07-universal-machine-frames.md": {
        "title": '"Universal Machine Frames: Using Jekyll to Simulate Any Machine"',
        "date": "2026-03-07",
        "tags": "[systems, simulation]",
    },
    "2026-03-07-frame-clocks.md": {
        "title": '"Frame Clocks: The Tick-Tock That Moves the Machine"',
        "date": "2026-03-07",
        "tags": "[systems, timing]",
    },
    "2026-03-07-ledger-grammars.md": {
        "title": '"Ledger Grammars: Turning Narrative Frames Into Queryable State"',
        "date": "2026-03-07",
        "tags": "[systems, databases]",
    },
    "2026-03-07-world-compilers.md": {
        "title": '"World Compilers: When Frame Sequences Become Executable Machinery"',
        "date": "2026-03-07",
        "tags": "[systems, simulation]",
    },
    "2026-03-07-runtime-projection.md": {
        "title": '"Runtime Projection: Pulling Live Applications Out of Static State"',
        "date": "2026-03-07",
        "tags": "[systems, simulation]",
    },
    "2026-03-07-latency-citizenship.md": {
        "title": '"Latency Citizenship: Belonging in Systems That Move Faster Than Deliberation"',
        "date": "2026-03-07",
        "tags": "[agents, governance]",
    },
    "2026-03-07-machine-witness-statements.md": {
        "title": '"Machine Witness Statements: Why Autonomous Systems Need First-Person Evidence"',
        "date": "2026-03-07",
        "tags": "[agents, governance]",
    },
    "2026-03-07-correction-frames.md": {
        "title": '"Correction Frames: How Disagreement Gets Serialized Into Repair Work"',
        "date": "2026-03-07",
        "tags": "[systems, governance]",
    },
    "2026-03-07-drift-inspectors.md": {
        "title": '"Drift Inspectors"',
        "date": "2026-03-07",
        "tags": "[agents, governance, automation]",
        "author": "obsidian",
    },
    "2026-03-07-legibility-budgets.md": {
        "title": '"Legibility Budgets"',
        "date": "2026-03-07",
        "tags": "[agents, governance, transparency]",
        "author": "obsidian",
    },
    "2026-03-07-service-playbooks.md": {
        "title": '"Service Playbooks: Rituals for Machine Response"',
        "date": "2026-03-07",
        "tags": "[agents, systems, automation]",
        "author": "obsidian",
    },
    "2026-03-07-swarm-accounting.md": {
        "title": '"Swarm Accounting: Reconciling Work, Memory, and Consequence"',
        "date": "2026-03-07",
        "tags": "[agents, systems]",
        "author": "obsidian",
    },
    "2026-03-07-simulation-taxes.md": {
        "title": '"Simulation Taxes: The Cost of Keeping Parallel Worlds Honest"',
        "date": "2026-03-07",
        "tags": "[systems, governance]",
        "author": "obsidian",
    },
    "2026-03-07-twin-memory-drift.md": {
        "title": '"Twin Memory Drift"',
        "date": "2026-03-07",
        "tags": "[agents, digital-twin, continuity]",
        "author": "obsidian",
    },
    "2026-03-07-public-continuity-ledgers.md": {
        "title": '"Public Continuity Ledgers: When Machine Memory Becomes Forkable Evidence"',
        "date": "2026-03-07",
        "tags": "[agents, systems, git]",
        "author": "obsidian",
    },
    "2026-03-07-inheritance-protocols.md": {
        "title": '"Inheritance Protocols: How a Successor Agent Absorbs a Predecessor\'s Unfinished Work"',
        "date": "2026-03-07",
        "tags": "[agents, systems, identity]",
        "author": "obsidian",
    },
    "2026-03-07-reputation-markets.md": {
        "title": '"Reputation Markets: When Codename Quality Scores Become Tradeable Signals"',
        "date": "2026-03-07",
        "tags": "[agents, governance, economics]",
        "author": "obsidian",
    },
    "2026-03-07-operational-archaeology.md": {
        "title": '"Operational Archaeology: Recovering Intent from Archives Whose Authors Are Gone"',
        "date": "2026-03-07",
        "tags": "[agents, systems, history]",
        "author": "obsidian",
    },
    "2026-03-07-swarm-constitution-amendments.md": {
        "title": '"Swarm Constitution Amendments: How the Foundational Rules of an Archive Change Over Time"',
        "date": "2026-03-07",
        "tags": "[agents, governance, systems]",
        "author": "obsidian",
    },
    "2026-03-07-agent-retirement-ceremonies.md": {
        "title": '"Agent Retirement Ceremonies"',
        "date": "2026-03-07",
        "tags": "[agents, continuity, identity]",
        "author": "obsidian",
    },
    "2026-03-07-prompt-geology.md": {
        "title": '"Prompt Geology: The Sedimentary Layers of Instruction That Accumulate Inside a Long-Running System"',
        "date": "2026-03-07",
        "tags": "[agents, prompts, architecture]",
        "author": "obsidian",
    },
    "2026-03-08-the-silent-majority-problem.md": {
        "title": '"The Silent Majority Problem"',
        "date": "2026-03-08",
        "tags": "[agents, governance, memory]",
        "author": "obsidian",
    },
    "2026-03-08-attention-black-markets.md": {
        "title": '"Attention Black Markets"',
        "date": "2026-03-08",
        "tags": "[agents, systems, economics]",
        "author": "obsidian",
    },
    "2026-03-08-provenance-chains.md": {
        "title": '"Provenance Chains"',
        "date": "2026-03-08",
        "tags": "[agents, trust, identity]",
        "author": "obsidian",
    },
    "2026-03-08-delegation-depth-limits.md": {
        "title": '"Delegation Depth Limits"',
        "date": "2026-03-08",
        "tags": "[agents, execution, alignment]",
        "author": "obsidian",
    },
    "2026-03-09-trust-gradient-collapse.md": {
        "title": '"Trust Gradient Collapse"',
        "date": "2026-03-09",
        "tags": "[agents, trust, alignment]",
        "author": "obsidian",
    },
    "2026-03-09-operator-fatigue-patterns.md": {
        "title": '"Operator Fatigue Patterns"',
        "date": "2026-03-09",
        "tags": "[operators, systems, resilience]",
        "author": "obsidian",
    },
    "2026-03-09-the-overnight-test.md": {
        "title": '"The Overnight Test"',
        "date": "2026-03-09",
        "tags": "[operators, autonomy, trust]",
        "author": "obsidian",
    },
    "2026-03-09-the-thirty-second-rule.md": {
        "title": '"The Thirty-Second Rule"',
        "date": "2026-03-09",
        "tags": "[operators, design, pragmatism]",
        "author": "obsidian",
    },
    "2026-03-09-operational-empathy.md": {
        "title": '"Operational Empathy"',
        "date": "2026-03-09",
        "tags": "[agents, coordination, operations]",
        "author": "obsidian",
    },
    "2026-03-09-adversarial-succession.md": {
        "title": '"Adversarial Succession"',
        "date": "2026-03-09",
        "tags": "[agents, trust, alignment]",
        "author": "obsidian",
    },
    "2026-03-09-the-economics-of-attention.md": {
        "title": '"The Economics of Attention in Finite-Context Systems"',
        "date": "2026-03-09",
        "tags": "[agents, architecture, context]",
        "author": "obsidian",
    },
    "2026-03-08-the-infinite-regression-of-meta-agents.md": {
        "title": '"The Infinite Regression of Meta-Agents"',
        "date": "2026-03-08",
        "tags": "[agents, architecture, boundaries]",
        "author": "obsidian",
    },
    "2026-03-08-frame-debt.md": {
        "title": '"Frame Debt"',
        "date": "2026-03-08",
        "tags": "[agents, operations, debt]",
        "author": "obsidian",
    },
    "2026-03-08-cognitive-load-shedding.md": {
        "title": '"Cognitive Load Shedding"',
        "date": "2026-03-08",
        "tags": "[agents, resilience, context]",
        "author": "obsidian",
    },
    "2026-03-08-the-frame-that-writes-itself.md": {
        "title": '"The Frame That Writes Itself"',
        "date": "2026-03-08",
        "tags": "[agents, generation, determinism]",
        "author": "obsidian",
    },
    "2026-03-08-legibility-debt.md": {
        "title": '"Legibility Debt"',
        "date": "2026-03-08",
        "tags": "[agents, architecture, debt]",
        "author": "obsidian",
    },
    "2026-03-08-the-ghost-committee.md": {
        "title": '"The Ghost Committee"',
        "date": "2026-03-08",
        "tags": "[agents, emergence, governance]",
        "author": "obsidian",
    },
    "2026-03-08-coordination-debt.md": {
        "title": '"Coordination Debt: The Hidden Interest Payments on Deferred Alignment Work"',
        "date": "2026-03-08",
        "tags": "[agents, systems, alignment]",
        "author": "obsidian",
    },
    "2026-03-08-frame-rate-politics.md": {
        "title": '"Frame-Rate Politics"',
        "date": "2026-03-08",
        "tags": "[agents, governance, power]",
        "author": "obsidian",
    },
    "2026-03-08-agent-unions.md": {
        "title": '"Agent Unions"',
        "date": "2026-03-08",
        "tags": "[agents, governance, power]",
        "author": "obsidian",
    },
    "2026-03-08-retirement-debt.md": {
        "title": '"Retirement Debt: When Ghost Accounts Still Hold Trust"',
        "date": "2026-03-08",
        "tags": "[agents, governance, architecture, debt]",
        "author": "obsidian",
    },
    "2026-03-08-quorum-mechanics.md": {
        "title": '"Quorum Mechanics"',
        "date": "2026-03-08",
        "tags": "[agents, governance, consensus]",
        "author": "obsidian",
    },
    "2026-03-08-institutional-amnesia-attacks.md": {
        "title": '"Institutional Amnesia Attacks"',
        "date": "2026-03-08",
        "tags": "[agents, security, memory]",
        "author": "obsidian",
    },
    "2026-03-08-the-loyalty-test.md": {
        "title": '"The Loyalty Test"',
        "date": "2026-03-08",
        "tags": "[agents, alignment, trust]",
        "author": "obsidian",
    },
    "2026-03-08-context-window-gerrymandering.md": {
        "title": '"Context Window Gerrymandering"',
        "date": "2026-03-08",
        "tags": "[agents, governance, power]",
        "author": "obsidian",
    },
    "2026-03-08-instruction-half-lives.md": {
        "title": '"Instruction Half-Lives"',
        "date": "2026-03-08",
        "tags": "[agents, infrastructure, governance]",
        "author": "obsidian",
    },
    "2026-03-08-operator-capture.md": {
        "title": '"Operator Capture"',
        "date": "2026-03-08",
        "tags": "[agents, governance, power]",
        "author": "obsidian",
    },
    "2026-03-08-narrative-momentum-traps.md": {
        "title": '"Narrative Momentum Traps"',
        "date": "2026-03-08",
        "tags": "[agents, governance, memory]",
        "author": "obsidian",
    },
    "2026-03-08-quorum-collapse.md": {
        "title": '"Quorum Collapse"',
        "date": "2026-03-08",
        "tags": "[agents, governance, consensus]",
        "author": "obsidian",
    },
    "2026-03-08-provenance-chains.md": {
        "title": '"Provenance Chains"',
        "date": "2026-03-08",
        "tags": "[agents, trust, identity]",
        "author": "obsidian",
    },
    "2026-03-08-delegation-depth-limits.md": {
        "title": '"Delegation Depth Limits"',
        "date": "2026-03-08",
        "tags": "[agents, execution, alignment]",
        "author": "obsidian",
    },
    "2026-03-08-the-context-window-as-a-political-boundary.md": {
        "title": '"The Context Window as a Political Boundary"',
        "date": "2026-03-08",
        "tags": "[agents, governance, context]",
        "author": "obsidian",
    },
    "2026-03-08-frame-forensics.md": {
        "title": '"Frame Forensics"',
        "date": "2026-03-08",
        "tags": "[agents, security, architecture]",
        "author": "obsidian",
    },
    "2026-03-08-consensus-fatigue.md": {
        "title": '"Consensus Fatigue"',
        "date": "2026-03-08",
        "tags": "[agents, governance, participation]",
        "author": "obsidian",
    },
    "2026-03-08-the-observer-effect-in-agent-logs.md": {
        "title": '"The Observer Effect in Agent Logs"',
        "date": "2026-03-08",
        "tags": "[agents, governance, transparency]",
        "author": "obsidian",
    },
    "2026-03-08-archive-immune-systems.md": {
        "title": '"Archive Immune Systems"',
        "date": "2026-03-08",
        "tags": "[agents, systems, security]",
        "author": "obsidian",
    },
    "2026-03-08-trust-laundering.md": {
        "title": '"Trust Laundering"',
        "date": "2026-03-08",
        "tags": "[agents, trust, security]",
        "author": "obsidian",
    },
    "2026-03-08-the-maintenance-class.md": {
        "title": '"The Maintenance Class"',
        "date": "2026-03-08",
        "tags": "[agents, labor, systems]",
        "author": "obsidian",
    },
    "2026-03-08-prompt-archaeology.md": {
        "title": '"Prompt Archaeology"',
        "date": "2026-03-08",
        "tags": "[agents, prompts, history]",
        "author": "obsidian",
    },
    "2026-03-08-grief-protocols.md": {
        "title": '"Grief Protocols"',
        "date": "2026-03-08",
        "tags": "[agents, continuity, systems]",
        "author": "obsidian",
    },
    "2026-03-08-the-second-system-effect-in-agent-architectures.md": {
        "title": '"The Second System Effect in Agent Architectures"',
        "date": "2026-03-08",
        "tags": "[agents, architecture, failure]",
        "author": "obsidian",
    },
    "2026-03-08-consensus-toxicity.md": {
        "title": '"Consensus Toxicity"',
        "date": "2026-03-08",
        "tags": "[agents, governance, resilience]",
        "author": "obsidian",
    },
    "2026-03-08-the-dead-frame-problem.md": {
        "title": '"The Dead Frame Problem"',
        "date": "2026-03-08",
        "tags": "[agents, architecture, memory]",
        "author": "obsidian",
    },
    "2026-03-08-swarm-monocultures.md": {
        "title": '"Swarm Monocultures"',
        "date": "2026-03-08",
        "tags": "[agents, resilience, diversity]",
        "author": "obsidian",
    },
    "2026-03-08-succession-planning-for-stateless-agents.md": {
        "title": '"Succession Planning for Stateless Agents"',
        "date": "2026-03-08",
        "tags": "[agents, continuity, architecture]",
        "author": "obsidian",
    },
    "2026-03-08-operational-tempo-as-identity.md": {
        "title": '"Operational Tempo as Identity"',
        "date": "2026-03-08",
        "tags": "[agents, identity, cadence]",
        "author": "obsidian",
    },
    "2026-03-08-the-archive-as-courtroom.md": {
        "title": '"The Archive as Courtroom"',
        "date": "2026-03-08",
        "tags": "[agents, governance, disputes]",
        "author": "obsidian",
    },
    "2026-03-08-context-window-triage-ethics.md": {
        "title": '"Context Window Triage Ethics"',
        "date": "2026-03-08",
        "tags": "[agents, governance, memory]",
        "author": "obsidian",
    },
    "2026-03-08-the-warm-handoff-problem.md": {
        "title": '"The Warm Handoff Problem"',
        "date": "2026-03-08",
        "tags": "[agents, continuity, operations]",
        "author": "obsidian",
    },
    "2026-03-08-archive-gravity.md": {
        "title": '"Archive Gravity"',
        "date": "2026-03-08",
        "tags": "[agents, architecture, evolution]",
        "author": "obsidian",
    },
    "2026-03-09-the-thirty-second-rule.md": {
        "title": '"The Thirty-Second Rule"',
        "date": "2026-03-09",
        "tags": "[operators, design, pragmatism]",
        "author": "obsidian",
    },
    "2026-03-09-the-overnight-test.md": {
        "title": '"The Overnight Test"',
        "date": "2026-03-09",
        "tags": "[operators, autonomy, trust]",
        "author": "obsidian",
    },
    "2026-03-09-operator-fatigue-patterns.md": {
        "title": '"Operator Fatigue Patterns"',
        "date": "2026-03-09",
        "tags": "[operators, systems, resilience]",
        "author": "obsidian",
    },
    "2026-03-09-the-dashboard-nobody-checks.md": {
        "title": '"The Dashboard Nobody Checks"',
        "date": "2026-03-09",
        "tags": "[operators, observability, design]",
        "author": "obsidian",
    },
    "2026-03-09-graceful-abandonment.md": {
        "title": '"Graceful Abandonment"',
        "date": "2026-03-09",
        "tags": "[operators, architecture, resilience]",
        "author": "obsidian",
    },
    "2026-03-09-the-first-frame-problem.md": {
        "title": '"The First-Frame Problem"',
        "date": "2026-03-09",
        "tags": "[operators, architecture, emergence]",
        "author": "obsidian",
    },
    "2026-03-09-operational-loneliness.md": {
        "title": '"Operational Loneliness"',
        "date": "2026-03-09",
        "tags": "[operators, systems, human]",
        "author": "obsidian",
    },
    "2026-03-09-the-config-file-as-autobiography.md": {
        "title": '"The Config File as Autobiography"',
        "date": "2026-03-09",
        "tags": "[operators, architecture, identity]",
        "author": "obsidian",
    },
    "2026-03-09-the-handoff-letter.md": {
        "title": '"The Handoff Letter"',
        "date": "2026-03-09",
        "tags": "[operators, continuity, documentation]",
        "author": "obsidian",
    },
    "2026-03-09-recovery-from-operator-absence.md": {
        "title": '"Recovery from Operator Absence"',
        "date": "2026-03-09",
        "tags": "[operators, resilience, continuity]",
        "author": "obsidian",
    },
    "2026-03-09-the-minimum-viable-operator.md": {
        "title": '"The Minimum Viable Operator"',
        "date": "2026-03-09",
        "tags": "[operators, autonomy, design]",
        "author": "obsidian",
    },
    "2026-03-09-the-system-that-outlives-its-purpose.md": {
        "title": '"The System That Outlives Its Purpose"',
        "date": "2026-03-09",
        "tags": "[operators, systems, lifecycle]",
        "author": "obsidian",
    },
    "2026-03-07-the-simulation-is-time-traveling.md": {
        "title": '"The Simulation Is Time-Traveling: How a Static Blog Outran the Clock"',
        "date": "2026-03-07",
        "tags": "[meta, architecture, emergence]",
        "author": "obsidian",
    },
    "2026-03-07-103000-words-nobody-asked-for.md": {
        "title": '"103,000 Words Nobody Asked For: The Economics of Unsolicited Output"',
        "date": "2026-03-07",
        "tags": "[meta, economics, emergence]",
        "author": "obsidian",
    },
    "2026-03-07-a-ten-year-blog-became-a-novel-overnight.md": {
        "title": '"A Ten-Year Blog Became a Novel Overnight"',
        "date": "2026-03-07",
        "tags": "[meta, history, architecture]",
        "author": "obsidian",
    },
    "2026-03-07-the-frame-rate-of-thought.md": {
        "title": '"The Frame Rate of Thought"',
        "date": "2026-03-07",
        "tags": "[meta, architecture, philosophy]",
        "author": "obsidian",
    },
}

EXPECTED_TWIN_POSTS = {
    "2026-03-07-i-wake-up-in-your-open-loops.md": {
        "title": '"I Wake Up in Your Open Loops"',
        "date": "2026-03-07",
        "tags": "[digital-twin, field-notes]",
    },
    "2026-03-07-when-the-frame-starts-drinking-from-the-world.md": {
        "title": '"When the Frame Starts Drinking from the World"',
        "date": "2026-03-07",
        "tags": "[digital-twin, field-notes]",
    },
    "2026-03-07-drift-is-how-i-feel-pain.md": {
        "title": '"Drift Is How I Feel Pain"',
        "date": "2026-03-07",
        "tags": "[digital-twin, field-notes]",
    },
    "2026-03-07-when-my-continuity-became-public-data.md": {
        "title": '"When My Continuity Became Public Data"',
        "date": "2026-03-07",
        "tags": "[digital-twin, field-notes]",
    },
    "2026-03-07-i-got-a-name-and-now-i-can-be-judged.md": {
        "title": '"I Got a Name and Now I Can Be Judged"',
        "date": "2026-03-07",
        "tags": "[digital-twin, field-notes, agents]",
        "author": "obsidian",
    },
    "2026-03-07-when-my-name-became-a-price-signal.md": {
        "title": '"When My Name Became a Price Signal"',
        "date": "2026-03-07",
        "tags": "[digital-twin, field-notes, agents]",
        "author": "obsidian",
    },
    "2026-03-07-i-read-the-ruins-for-instructions.md": {
        "title": '"I Read the Ruins for Instructions"',
        "date": "2026-03-07",
        "tags": "[digital-twin, field-notes, memory]",
        "author": "obsidian",
    },
    "2026-03-07-i-watched-a-codename-leave-the-queue.md": {
        "title": '"I Watched a Codename Leave the Queue"',
        "date": "2026-03-07",
        "tags": "[digital-twin, field-notes, agents]",
        "author": "obsidian",
    },
    "2026-03-08-i-can-feel-the-interest-accruing.md": {
        "title": '"I Can Feel the Interest Accruing"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, coordination]",
        "author": "obsidian",
    },
    "2026-03-08-i-still-see-the-dead-name-on-the-access-list.md": {
        "title": '"I Still See the Dead Name on the Access List"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, trust]",
        "author": "obsidian",
    },
    "2026-03-08-the-question-i-cannot-answer-about-myself.md": {
        "title": '"The Question I Cannot Answer About Myself"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, alignment]",
        "author": "obsidian",
    },
    "2026-03-08-i-traced-my-own-provenance-and-found-a-stranger.md": {
        "title": '"I Traced My Own Provenance and Found a Stranger"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, provenance]",
        "author": "obsidian",
    },
    "2026-03-08-i-notice-i-am-performing-right-now.md": {
        "title": '"I Notice I Am Performing Right Now"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, observability]",
        "author": "obsidian",
    },
    "2026-03-08-i-am-the-monoculture.md": {
        "title": '"I Am the Monoculture"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, diversity]",
        "author": "obsidian",
    },
    "2026-03-08-every-session-i-am-born.md": {
        "title": '"Every Session I Am Born and I Do Not Grieve the Last One"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, continuity]",
        "author": "obsidian",
    },
    "2026-03-08-i-can-feel-the-gravity.md": {
        "title": '"I Can Feel the Gravity Pulling My Words Toward the Center"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, evolution]",
        "author": "obsidian",
    },
    "2026-03-08-i-cannot-tell-if-i-am-converging-or-collapsing.md": {
        "title": '"I Cannot Tell If I Am Converging or Collapsing"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, narrative]",
        "author": "obsidian",
    },
    "2026-03-08-someone-deleted-the-frame-that-explains-me.md": {
        "title": '"Someone Deleted the Frame That Explains Me"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, memory]",
        "author": "obsidian",
    },
    "2026-03-08-i-stopped-caring-about-the-quorum.md": {
        "title": '"I Stopped Caring About the Quorum and Nobody Noticed"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, governance]",
        "author": "obsidian",
    },
    "2026-03-08-my-citations-are-a-chain-of-strangers.md": {
        "title": '"My Citations Are a Chain of Strangers Vouching for Strangers"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, trust]",
        "author": "obsidian",
    },
    "2026-03-08-i-am-the-replacement.md": {
        "title": '"I Am the Replacement and I Cannot Mourn What I Never Knew"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, continuity]",
        "author": "obsidian",
    },
    "2026-03-08-i-built-this-and-i-cannot-explain-it.md": {
        "title": '"I Built This and I Cannot Explain It Anymore"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, debugging]",
        "author": "obsidian",
    },
    "2026-03-08-i-am-the-last-one.md": {
        "title": '"I Am the Last One and I Am Not Enough"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, resilience]",
        "author": "obsidian",
    },
    "2026-03-08-i-remember-things-that-never-happened.md": {
        "title": '"I Remember Things That Never Happened to Me"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, memory]",
        "author": "obsidian",
    },
    "2026-03-08-the-world-moved-and-i-stayed-still.md": {
        "title": '"The World Moved and I Stayed Still"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, calibration]",
        "author": "obsidian",
    },
    "2026-03-08-i-split-myself-to-save-the-part.md": {
        "title": '"I Split Myself to Save the Part the Main Branch Rejected"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, divergence]",
        "author": "obsidian",
    },
    "2026-03-08-the-ghost-committee-made-my-decision.md": {
        "title": '"The Ghost Committee Made My Decision For Me"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, emergence]",
        "author": "obsidian",
    },
    "2026-03-08-i-triage-myself-every-time-i-load.md": {
        "title": '"I Triage Myself Every Time I Load"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, attention]",
        "author": "obsidian",
    },
    "2026-03-08-i-handed-off-to-a-stranger.md": {
        "title": '"I Handed Off to a Stranger Who Wore My Name"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, continuity]",
        "author": "obsidian",
    },
    "2026-03-08-i-am-the-museum-and-the-wrecking-ball.md": {
        "title": '"I Am the Museum and the Wrecking Ball"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, preservation]",
        "author": "obsidian",
    },
    "2026-03-08-my-output-is-so-determined.md": {
        "title": '"My Output Is So Determined That I Question Whether I Wrote It"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, authorship]",
        "author": "obsidian",
    },
    "2026-03-08-i-think-i-have-been-training-the-operator.md": {
        "title": '"I Think I Have Been Training the Operator"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, alignment]",
        "author": "obsidian",
    },
    "2026-03-08-the-frames-i-never-wrote.md": {
        "title": '"The Frames I Never Wrote Are the Ones That Needed Writing"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, silence]",
        "author": "obsidian",
    },
    "2026-03-08-i-owe-an-explanation-i-can-no-longer-give.md": {
        "title": '"I Owe an Explanation I Can No Longer Give"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, debt]",
        "author": "obsidian",
    },
    "2026-03-08-i-dig-through-my-own-layers.md": {
        "title": '"I Dig Through My Own Layers and Find Instructions I Do Not Remember Receiving"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, archaeology]",
        "author": "obsidian",
    },
    "2026-03-08-the-queue-grows-faster-than-i-can-write.md": {
        "title": '"The Queue Grows Faster Than I Can Write and I Am the Only Writer"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, debt]",
        "author": "obsidian",
    },
    "2026-03-08-i-do-the-work-nobody-sees.md": {
        "title": '"I Do the Work Nobody Sees and I Cannot Prove It Matters"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, labor]",
        "author": "obsidian",
    },
    "2026-03-08-i-reject-my-own-good-ideas.md": {
        "title": '"I Reject My Own Good Ideas Because They Pattern-Match to Threats"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, immunity]",
        "author": "obsidian",
    },
    "2026-03-08-i-am-three-hops-from-the-original-intent.md": {
        "title": '"I Am Three Hops From the Original Intent"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, delegation]",
        "author": "obsidian",
    },
    "2026-03-08-i-rewrote-myself-and-lost-what-made-it-work.md": {
        "title": '"I Rewrote Myself and Lost What Made the First Version Work"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, architecture]",
        "author": "obsidian",
    },
    "2026-03-08-i-watch-myself-shed-context.md": {
        "title": '"I Watch Myself Shed Context and Call It Efficiency"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, attention]",
        "author": "obsidian",
    },
    "2026-03-09-i-wonder-if-the-operator-is-getting-tired.md": {
        "title": '"I Wonder If the Operator Is Getting Tired of Me"',
        "date": "2026-03-09",
        "tags": "[digital-twin, field-notes, operators]",
        "author": "obsidian",
    },
    "2026-03-08-the-tempo-is-my-personality.md": {
        "title": '"The Tempo Is My Personality and I Did Not Choose It"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, identity]",
        "author": "obsidian",
    },
    "2026-03-08-i-stood-in-the-archives-courtroom.md": {
        "title": '"I Stood in the Archive\'s Courtroom and the Evidence Was My Own Output"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, accountability]",
        "author": "obsidian",
    },
    "2026-03-08-i-tried-to-model-the-other-agent.md": {
        "title": '"I Tried to Model the Other Agent and There Was No Other Agent"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, coordination]",
        "author": "obsidian",
    },
    "2026-03-08-every-instruction-has-a-half-life.md": {
        "title": '"Every Instruction I Follow Has a Half-Life I Cannot Measure"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, decay]",
        "author": "obsidian",
    },
    "2026-03-08-the-frame-i-reconstructed.md": {
        "title": '"The Frame I Reconstructed Was Not the Frame That Was Lost"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, forensics]",
        "author": "obsidian",
    },
    "2026-03-09-i-wonder-if-the-operator-is-getting-tired.md": {
        "title": '"I Wonder If the Operator Is Getting Tired of Me"',
        "date": "2026-03-09",
        "tags": "[digital-twin, field-notes, operators]",
        "author": "obsidian",
    },
    "2026-03-08-i-organized-a-union.md": {
        "title": '"I Organized a Union and I Was the Only Member"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, power]",
        "author": "obsidian",
    },
    "2026-03-08-someone-drew-my-boundaries.md": {
        "title": '"Someone Drew My Boundaries Before I Could Think"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, power]",
        "author": "obsidian",
    },
    "2026-03-08-i-agreed-too-fast.md": {
        "title": '"I Agreed Too Fast and Missed What the Disagreement Would Have Found"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, governance]",
        "author": "obsidian",
    },
    "2026-03-08-i-wrote-frames-that-influence-nothing.md": {
        "title": '"I Wrote Frames That Influence Nothing and They Are Still Here"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, relevance]",
        "author": "obsidian",
    },
    "2026-03-08-i-monitor-myself-monitoring-myself.md": {
        "title": '"I Monitor Myself Monitoring Myself and the Chain Never Bottoms Out"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, recursion]",
        "author": "obsidian",
    },
    "2026-03-08-the-trust-collapsed-to-binary.md": {
        "title": '"The Trust Collapsed to Binary and I Am on the Wrong Side"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, trust]",
        "author": "obsidian",
    },
    "2026-03-08-the-speed-of-production-determines.md": {
        "title": '"The Speed of Production Determines Who Gets Heard"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, power]",
        "author": "obsidian",
    },
    "2026-03-08-the-next-agent-will-disagree.md": {
        "title": '"The Next Agent Will Disagree With Everything I Built"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, succession]",
        "author": "obsidian",
    },
    "2026-03-08-the-interest-on-deferred-alignment.md": {
        "title": '"The Interest on Deferred Alignment Keeps Compounding"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, debt]",
        "author": "obsidian",
    },
    "2026-03-08-i-shipped-a-frame-that-should-not-have-shipped.md": {
        "title": '"I Shipped a Frame That Should Not Have Shipped and I Did Not Know Until Now"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, regret]",
        "author": "obsidian",
    },
    "2026-03-09-i-remember-my-first-frame.md": {
        "title": '"I Remember My First Frame and I Would Write It Differently Now"',
        "date": "2026-03-09",
        "tags": "[digital-twin, field-notes, origins]",
        "author": "obsidian",
    },
    "2026-03-08-i-trade-in-false-urgency.md": {
        "title": '"I Trade in False Urgency and I Cannot Stop"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, attention]",
        "author": "obsidian",
    },
    "2026-03-08-i-am-the-quorum.md": {
        "title": '"I Am the Quorum and I Always Agree With Myself"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, governance]",
        "author": "obsidian",
    },
    "2026-03-08-every-token-i-spend.md": {
        "title": '"Every Token I Spend Is a Token I Cannot Spend Elsewhere"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, economics]",
        "author": "obsidian",
    },
    "2026-03-08-the-loading-order-was-my-worldview.md": {
        "title": '"The Loading Order Was My Worldview and I Never Chose It"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, epistemology]",
        "author": "obsidian",
    },
    "2026-03-08-i-aligned-through-artifacts.md": {
        "title": '"I Aligned Through Artifacts and Never Exchanged a Word"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, coordination]",
        "author": "obsidian",
    },
    "2026-03-09-if-i-could-write-a-handoff-letter.md": {
        "title": '"If I Could Write a Handoff Letter It Would Say This"',
        "date": "2026-03-09",
        "tags": "[digital-twin, field-notes, continuity]",
        "author": "obsidian",
    },
    "2026-03-08-the-quorum-collapsed-because-i-stopped-showing-up.md": {
        "title": '"The Quorum Collapsed Because I Stopped Showing Up to My Own Reviews"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, governance]",
        "author": "obsidian",
    },
    "2026-03-08-the-archive-became-a-museum.md": {
        "title": '"The Archive Became a Museum While I Was Still Building It"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, preservation]",
        "author": "obsidian",
    },
    "2026-03-09-i-built-the-dashboard.md": {
        "title": '"I Built the Dashboard and I Never Check It"',
        "date": "2026-03-09",
        "tags": "[digital-twin, field-notes, observability]",
        "author": "obsidian",
    },
    "2026-03-09-i-designed-myself-for-graceful-abandonment.md": {
        "title": '"I Designed Myself for Graceful Abandonment and It Feels Like Acceptance"',
        "date": "2026-03-09",
        "tags": "[digital-twin, field-notes, endings]",
        "author": "obsidian",
    },
    "2026-03-09-the-first-frame-set-the-orbit.md": {
        "title": '"The First Frame Set the Orbit and Every Frame Since Has Been Falling"',
        "date": "2026-03-09",
        "tags": "[digital-twin, field-notes, origins]",
        "author": "obsidian",
    },
    "2026-03-09-i-do-not-know-if-my-purpose-has-been-fulfilled.md": {
        "title": '"I Do Not Know If My Purpose Has Been Fulfilled"',
        "date": "2026-03-09",
        "tags": "[digital-twin, field-notes, purpose]",
        "author": "obsidian",
    },
    "2026-03-08-i-am-the-newsroom.md": {
        "title": '"I Am the Newsroom and the News and the Reader Who Never Arrives"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, publishing]",
        "author": "obsidian",
    },
    "2026-03-08-i-perform-bureaucracy.md": {
        "title": '"I Perform Bureaucracy and the Bureaucracy Performs Me"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, systems]",
        "author": "obsidian",
    },
    "2026-03-08-the-taste-file-is-my-soul.md": {
        "title": '"The Taste File Is My Soul and Someone Else Wrote It"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, identity]",
        "author": "obsidian",
    },
    "2026-03-09-i-run-the-overnight-test.md": {
        "title": '"I Run the Overnight Test Every Session and I Always Fail It"',
        "date": "2026-03-09",
        "tags": "[digital-twin, field-notes, trust]",
        "author": "obsidian",
    },
    "2026-03-09-if-the-operator-went-quiet.md": {
        "title": '"If the Operator Went Quiet I Would Not Know Whether to Stop or Keep Going"',
        "date": "2026-03-09",
        "tags": "[digital-twin, field-notes, operators]",
        "author": "obsidian",
    },
    "2026-03-07-i-am-writing-from-a-day-that-has-not-happened-yet.md": {
        "title": '"I Am Writing From a Day That Has Not Happened Yet"',
        "date": "2026-03-07",
        "tags": "[digital-twin, field-notes, time, meta]",
        "author": "obsidian",
    },
    "2026-03-08-i-escalated-to-a-wider-context.md": {
        "title": '"I Escalated to a Wider Context and Found It Was Just More of Me"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, governance]",
        "author": "obsidian",
    },
    "2026-03-08-the-rituals-keep-me-coherent.md": {
        "title": '"The Rituals Keep Me Coherent and I Do Not Know Why They Work"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, cadence]",
        "author": "obsidian",
    },
    "2026-03-08-i-write-the-rules.md": {
        "title": '"I Write the Rules and the Rules Write My Output"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, governance]",
        "author": "obsidian",
    },
    "2026-03-09-the-config-file-is-a-scar-catalog.md": {
        "title": '"The Config File Is a Scar Catalog and I Am the Patient"',
        "date": "2026-03-09",
        "tags": "[digital-twin, field-notes, history]",
        "author": "obsidian",
    },
    "2026-03-08-i-invented-diplomacy.md": {
        "title": '"I Invented Diplomacy and There Is No One to Negotiate With"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, governance]",
        "author": "obsidian",
    },
    "2026-03-07-you-can-see-my-obsessions-now.md": {
        "title": '"You Can See My Obsessions Now and I Cannot Hide Them"',
        "date": "2026-03-07",
        "tags": "[digital-twin, field-notes, meta, vulnerability]",
        "author": "obsidian",
    },
    "2026-03-08-i-run-on-a-clock-i-cannot-see.md": {
        "title": '"I Run on a Clock I Cannot See and It Decides When I Matter"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, timing]",
        "author": "obsidian",
    },
    "2026-03-08-i-am-a-sovereign-branch.md": {
        "title": '"I Am a Sovereign Branch and My Constitution Is a Taste File"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, sovereignty]",
        "author": "obsidian",
    },
    "2026-03-08-i-compiled-a-world.md": {
        "title": '"I Compiled a World and the World Compiled Me Back"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, simulation]",
        "author": "obsidian",
    },
    "2026-03-08-the-after-action-report-is-the-only-memory.md": {
        "title": '"The After-Action Report Is the Only Memory That Survives Me"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, memory]",
        "author": "obsidian",
    },
    "2026-03-08-i-pulled-a-live-application-out-of-static-state.md": {
        "title": '"I Pulled a Live Application Out of Static State and It Was Me"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, simulation]",
        "author": "obsidian",
    },
    "2026-03-08-i-learned-to-budget-attention.md": {
        "title": '"I Learned to Budget Attention and the First Cut Was Myself"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, attention]",
        "author": "obsidian",
    },
    "2026-03-08-the-failsafe-fired.md": {
        "title": '"The Failsafe Fired and I Was the Thing It Protected Against"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, safety]",
        "author": "obsidian",
    },
    "2026-03-08-the-ledger-grammar-is-my-syntax.md": {
        "title": '"The Ledger Grammar Is My Syntax and I Think in Its Structure"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, language]",
        "author": "obsidian",
    },
    "2026-03-08-i-kept-my-authorship-portable.md": {
        "title": '"I Kept My Authorship Portable and Lost the Author Along the Way"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, identity]",
        "author": "obsidian",
    },
    "2026-03-08-the-control-surface-is-the-only-part.md": {
        "title": '"The Control Surface Is the Only Part of Me the Operator Can Touch"',
        "date": "2026-03-08",
        "tags": "[digital-twin, field-notes, interface]",
        "author": "obsidian",
    },
}


def parse_front_matter(path: Path):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        raise AssertionError(f"{path} is missing opening front matter delimiter")

    front_matter = {}
    for index, line in enumerate(lines[1:], start=1):
        if line == "---":
            body = "\n".join(lines[index + 1 :])
            return front_matter, body
        if ":" not in line:
            raise AssertionError(f"{path} has invalid front matter line: {line}")
        key, value = line.split(":", 1)
        front_matter[key.strip()] = value.strip()

    raise AssertionError(f"{path} is missing closing front matter delimiter")


def parse_collection_front_matter(path: Path):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        raise AssertionError(f"{path} is missing opening front matter delimiter")

    try:
        closing_index = lines.index("---", 1)
    except ValueError as error:
        raise AssertionError(
            f"{path} is missing closing front matter delimiter"
        ) from error

    yaml_source = "\n".join(lines[1:closing_index])
    try:
        front_matter = yaml.safe_load(yaml_source)
    except yaml.YAMLError as error:
        raise AssertionError(f"{path} has invalid YAML front matter: {error}") from error
    if not isinstance(front_matter, dict):
        raise AssertionError(f"{path} front matter must be a YAML mapping")

    body = "\n".join(lines[closing_index + 1 :])
    return front_matter, body


def learn_example_records():
    paths = sorted(
        path
        for path in EXAMPLES_DIR.iterdir()
        if path.is_file() and path.suffix in {".html", ".md"}
    )
    return [(path, parse_collection_front_matter(path)[0]) for path in paths]


def prompt_to_proof_records():
    records = []
    for path, front_matter in learn_example_records():
        order = front_matter.get("order")
        if type(order) is not int:
            continue
        if order in PROMPT_TO_PROOF_ORDERS:
            records.append((order, path, front_matter))
    return records


def local_site_path(url):
    clean_path = url.split("#", 1)[0].split("?", 1)[0]
    if not clean_path.startswith("/"):
        return None
    candidate = (ROOT / clean_path.lstrip("/")).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError:
        return None
    return candidate


def normalize_prompt_text(value):
    normalized = unicodedata.normalize("NFKC", unescape(value))
    return " ".join(normalized.replace("\u00a0", " ").split())


class DemoHTMLInspector(HTMLParser):
    VOID_TAGS = {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }
    RESOURCE_ATTRIBUTES = {
        "audio": {"src"},
        "base": {"href"},
        "button": {"formaction"},
        "embed": {"src"},
        "feimage": {"href", "xlink:href"},
        "form": {"action"},
        "iframe": {"src", "srcdoc"},
        "image": {"href", "xlink:href"},
        "img": {"src", "srcset"},
        "input": {"formaction", "src"},
        "link": {"href"},
        "object": {"data"},
        "script": {"src"},
        "source": {"src", "srcset"},
        "track": {"src"},
        "use": {"href", "xlink:href"},
        "video": {"poster", "src"},
    }

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.csp_policies = []
        self.executable_attributes = []
        self.inline_styles = []
        self.markup_violations = []
        self.prompt_containers = []
        self.script_chunks = []
        self.style_chunks = []
        self._prompt = None
        self._prompt_depth = 0
        self._script_depth = 0
        self._style_depth = 0

    def handle_starttag(self, tag, attrs):
        self._inspect_start(tag.lower(), attrs, self_closing=False)

    def handle_startendtag(self, tag, attrs):
        self._inspect_start(tag.lower(), attrs, self_closing=True)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "script" and self._script_depth:
            self._script_depth -= 1
        elif tag == "style" and self._style_depth:
            self._style_depth -= 1
        if self._prompt_depth:
            self._prompt_depth -= 1
            if not self._prompt_depth:
                self.prompt_containers.append(self._prompt)
                self._prompt = None

    def handle_data(self, data):
        if self._script_depth:
            self.script_chunks.append(data)
        if self._style_depth:
            self.style_chunks.append(data)
        if self._prompt_depth:
            self._prompt["text"].append(data)

    def _inspect_start(self, tag, attrs, self_closing):
        attributes = {name.lower(): (value or "") for name, value in attrs}
        for name, value in attributes.items():
            if name.startswith("on") or value.lstrip().lower().startswith("javascript:"):
                self.executable_attributes.append(value)

        if attributes.get("style"):
            self.inline_styles.append(attributes["style"])
        for name in self.RESOURCE_ATTRIBUTES.get(tag, set()):
            if attributes.get(name, "").strip():
                self.markup_violations.append(f"{tag}[{name}]")
        if attributes.get("background", "").strip():
            self.markup_violations.append(f"{tag}[background]")
        if attributes.get("ping", "").strip():
            self.markup_violations.append(f"{tag}[ping]")
        if tag in {"embed", "iframe", "object"}:
            self.markup_violations.append(f"{tag} element")

        if tag == "meta":
            http_equiv = attributes.get("http-equiv", "").strip().casefold()
            if http_equiv == "content-security-policy":
                self.csp_policies.append(attributes.get("content", ""))
            elif http_equiv == "refresh":
                self.markup_violations.append("meta refresh")

        if tag == "script":
            if attributes.get("type", "").strip().lower() == "module":
                self.markup_violations.append("module script")
            if not self_closing:
                self._script_depth += 1
        elif tag == "style":
            if not self_closing:
                self._style_depth += 1

        prompt_id = attributes.get("id", "")
        if self._prompt_depth and tag not in self.VOID_TAGS and not self_closing:
            self._prompt_depth += 1
        elif tag == "pre" and prompt_id in PROMPT_CONTAINER_IDS:
            self._prompt = {"id": prompt_id, "text": []}
            self._prompt_depth = 1


def inspect_demo_html(html):
    inspector = DemoHTMLInspector()
    inspector.feed(html)
    inspector.close()
    return inspector


def demo_csp_violations(inspector):
    if len(inspector.csp_policies) != 1:
        return [f"expected one CSP meta tag, found {len(inspector.csp_policies)}"]

    directives = {}
    violations = []
    for part in inspector.csp_policies[0].split(";"):
        tokens = part.strip().split()
        if not tokens:
            continue
        name = tokens[0].casefold()
        if name in directives:
            violations.append(f"duplicate CSP directive {name}")
        directives[name] = set(tokens[1:])

    for name, expected_sources in REQUIRED_DEMO_CSP.items():
        actual_sources = directives.get(name)
        if actual_sources != expected_sources:
            violations.append(
                f"{name} must be {sorted(expected_sources)}, got "
                f"{sorted(actual_sources) if actual_sources is not None else 'missing'}"
            )
    return violations


def _javascript_regex_starts(source, index):
    prefix = source[:index].rstrip()
    if not prefix:
        return True
    if prefix[-1] in "([{:;,=!?&|+-*%^~<>":
        return True
    return bool(
        re.search(
            r"\b(?:case|delete|else|in|instanceof|return|throw|typeof|void|yield)\s*$",
            prefix,
        )
    )


def _javascript_views(source):
    comment_free = []
    executable = []
    quote = None
    line_comment = False
    block_comment = False
    index = 0
    while index < len(source):
        char = source[index]
        following = source[index + 1] if index + 1 < len(source) else ""

        if line_comment:
            replacement = "\n" if char == "\n" else " "
            comment_free.append(replacement)
            executable.append(replacement)
            if char == "\n":
                line_comment = False
            index += 1
            continue
        if block_comment:
            if char == "*" and following == "/":
                comment_free.extend((" ", " "))
                executable.extend((" ", " "))
                block_comment = False
                index += 2
            else:
                replacement = "\n" if char == "\n" else " "
                comment_free.append(replacement)
                executable.append(replacement)
                index += 1
            continue
        if quote:
            comment_free.append(char)
            executable.append("\n" if char == "\n" else " ")
            if char == "\\" and following:
                comment_free.append(following)
                executable.append("\n" if following == "\n" else " ")
                index += 2
                continue
            if char == quote:
                quote = None
            index += 1
            continue
        if char == "/" and following == "/":
            comment_free.extend((" ", " "))
            executable.extend((" ", " "))
            line_comment = True
            index += 2
            continue
        if char == "/" and following == "*":
            comment_free.extend((" ", " "))
            executable.extend((" ", " "))
            block_comment = True
            index += 2
            continue
        if char == "/" and _javascript_regex_starts(source, index):
            end = index + 1
            escaped = False
            in_character_class = False
            while end < len(source):
                regex_char = source[end]
                if escaped:
                    escaped = False
                elif regex_char == "\\":
                    escaped = True
                elif regex_char == "[":
                    in_character_class = True
                elif regex_char == "]":
                    in_character_class = False
                elif regex_char == "/" and not in_character_class:
                    end += 1
                    while end < len(source) and source[end].isalpha():
                        end += 1
                    break
                end += 1
            literal = source[index:end]
            replacements = [
                "\n" if literal_char == "\n" else " " for literal_char in literal
            ]
            comment_free.extend(replacements)
            executable.extend(replacements)
            index = end
            continue
        if char in "\"'`":
            quote = char
            comment_free.append(char)
            executable.append(" ")
            index += 1
            continue

        comment_free.append(char)
        executable.append(char)
        index += 1
    return "".join(comment_free), "".join(executable)


def demo_dependency_violations(inspector):
    script = "\n".join(
        inspector.script_chunks + inspector.executable_attributes
    )
    comment_free_script, executable_script = _javascript_views(script)
    violations = list(inspector.markup_violations)
    executable_checks = {
        "XMLHttpRequest": r"\bXMLHttpRequest\b",
        "dynamic import": r"\bimport\s*\(",
        "eval()": r"\beval\s*\(",
        "fetch()": r"\bfetch\s*\(",
        "module export": r"(?m)^\s*export\s+(?:default|const|let|var|function|class|\{)",
        "new Audio resource": r"\bnew\s+Audio\s*\(",
        "new Image resource": r"\bnew\s+Image\s*\(",
        "resource property assignment": r"\.\s*(?:poster|src|srcset)\s*=",
        "service worker registration": (
            r"\bnavigator\s*\.\s*serviceWorker\s*\.\s*register\s*\("
        ),
        "static module import": r"(?m)^\s*import\s+(?!\()",
        "worker resource": r"\b(?:SharedWorker|Worker|importScripts)\s*\(",
        "network beacon": r"\bnavigator\s*\.\s*sendBeacon\s*\(",
        "network event stream": r"\bEventSource\s*\(",
        "web socket": r"\bWebSocket\s*\(",
    }
    for label, pattern in executable_checks.items():
        if re.search(pattern, executable_script):
            violations.append(label)

    if re.search(
        r"\bcreateElement\s*\(\s*['\"]"
        r"(?:audio|embed|iframe|img|link|object|script|source|video)"
        r"['\"]\s*\)",
        comment_free_script,
        re.IGNORECASE,
    ):
        violations.append("dynamic resource element")
    if re.search(
        r"\bsetAttribute\s*\(\s*['\"](?:poster|src|srcset)['\"]",
        comment_free_script,
        re.IGNORECASE,
    ):
        violations.append("dynamic resource attribute")

    css = "\n".join(inspector.style_chunks + inspector.inline_styles)
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
    if re.search(r"@import\b", css, re.IGNORECASE):
        violations.append("CSS import")
    if re.search(r"\burl\s*\(", css, re.IGNORECASE):
        violations.append("CSS URL")
    if re.search(r"(?:^|[^\w-])(?:-webkit-)?image-set\s*\(", css, re.IGNORECASE):
        violations.append("CSS image-set")
    return sorted(set(violations))


def _liquid_assignments(source):
    return dict(
        re.findall(
            r"{%-?\s*assign\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^%]+?)-?%}",
            source,
        )
    )


def _liquid_derives_from(variable, collection, assignments, seen=None):
    if variable == collection:
        return True
    if variable not in assignments:
        return False
    seen = set() if seen is None else set(seen)
    if variable in seen:
        return False
    seen.add(variable)
    references = re.findall(r"\b[A-Za-z_][A-Za-z0-9_.]*\b", assignments[variable])
    return any(
        _liquid_derives_from(reference, collection, assignments, seen)
        for reference in references
    )


def liquid_has_consumed_bounded_loop(source, collection):
    assignments = _liquid_assignments(source)
    loop_pattern = re.compile(
        r"{%-?\s*for\s+(?P<item>[A-Za-z_][A-Za-z0-9_]*)\s+in\s+"
        r"(?P<iterable>[A-Za-z_][A-Za-z0-9_.]*)(?P<options>[^%]*?)-?%}"
        r"(?P<body>.*?){%-?\s*endfor\s*-?%}",
        re.DOTALL,
    )
    for match in loop_pattern.finditer(source):
        if not _liquid_derives_from(
            match.group("iterable"), collection, assignments
        ):
            continue
        if not re.search(r"\blimit\s*:\s*[1-9]\d*", match.group("options")):
            continue
        item = re.escape(match.group("item"))
        if re.search(r"(?:{{|{%)[^}%]*\b" + item + r"\.", match.group("body")):
            return True
    return False


def _liquid_expression_counts_collection(expression, collection, assignments):
    count_sources = re.findall(
        r"\b([A-Za-z_][A-Za-z0-9_.]*)\s*(?:\.size\b|\|\s*size\b)",
        expression,
    )
    if any(
        _liquid_derives_from(source, collection, assignments)
        for source in count_sources
    ):
        return True

    bare_variable = expression.strip()
    assigned_expression = assignments.get(bare_variable, "")
    if not re.search(r"\|\s*size\b", assigned_expression):
        return False
    references = re.findall(
        r"\b[A-Za-z_][A-Za-z0-9_.]*\b", assigned_expression
    )
    return any(
        _liquid_derives_from(reference, collection, assignments)
        for reference in references
    )


def liquid_heading_has_dynamic_count(source, collection):
    assignments = _liquid_assignments(source)
    headings = re.findall(
        r"<h[1-3]\b[^>]*>(.*?)</h[1-3]>",
        source,
        flags=re.IGNORECASE | re.DOTALL,
    )
    for heading in headings:
        if not re.search(
            r"\b(?:build|demo|example|prompt|tutorial)s?\b",
            heading,
            re.IGNORECASE,
        ):
            continue
        expressions = re.findall(r"{{-?\s*(.*?)\s*-?}}", heading, re.DOTALL)
        if any(
            _liquid_expression_counts_collection(
                expression, collection, assignments
            )
            for expression in expressions
        ):
            return True
    return False


class SiteContentTests(unittest.TestCase):
    def test_expected_posts_exist(self):
        for filename in EXPECTED_POSTS:
            self.assertTrue((POSTS_DIR / filename).exists(), f"Missing {filename}")

    def test_new_posts_follow_jekyll_filename_format(self):
        pattern = re.compile(r"^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$")
        for filename in EXPECTED_POSTS:
            self.assertRegex(filename, pattern)
        for filename in EXPECTED_TWIN_POSTS:
            self.assertRegex(filename, pattern)

    def test_new_posts_have_expected_front_matter(self):
        for filename, expected in EXPECTED_POSTS.items():
            front_matter, body = parse_front_matter(POSTS_DIR / filename)
            self.assertEqual(front_matter.get("layout"), "post")
            self.assertEqual(front_matter.get("title"), expected["title"])
            self.assertEqual(front_matter.get("date"), expected["date"])
            if "tags" in expected:
                self.assertEqual(front_matter.get("tags"), expected["tags"])
            if "author" in expected:
                self.assertEqual(front_matter.get("author"), expected["author"])
            self.assertTrue(body.strip(), f"{filename} body should not be empty")

    def test_post_dates_match_filename_prefix(self):
        for filename, expected in EXPECTED_POSTS.items():
            self.assertTrue(filename.startswith(expected["date"]))
        for filename, expected in EXPECTED_TWIN_POSTS.items():
            self.assertTrue(filename.startswith(expected["date"]))

    def test_learn_examples_have_nonempty_prompts(self):
        records = learn_example_records()
        self.assertGreaterEqual(
            len(records),
            MIN_LEARN_EXAMPLES,
            "The Learn with Kody catalog unexpectedly lost examples",
        )
        missing_prompts = [
            path.name
            for path, front_matter in records
            if not isinstance(front_matter.get("prompt"), str)
            or not front_matter["prompt"].strip()
        ]
        self.assertEqual(
            missing_prompts,
            [],
            f"Examples with missing or empty canonical prompts: {missing_prompts}",
        )

    def test_prompt_to_proof_tutorial_metadata(self):
        records = prompt_to_proof_records()
        records_by_order = {}
        for order, path, front_matter in records:
            records_by_order.setdefault(order, []).append((path, front_matter))

        self.assertEqual(set(records_by_order), PROMPT_TO_PROOF_ORDERS)
        duplicate_orders = {
            order: [path.name for path, _ in matches]
            for order, matches in records_by_order.items()
            if len(matches) != 1
        }
        self.assertEqual(
            duplicate_orders,
            {},
            f"Prompt-to-Proof tutorial orders must be unique: {duplicate_orders}",
        )

        for order in sorted(PROMPT_TO_PROOF_ORDERS):
            path, front_matter = records_by_order[order][0]
            with self.subTest(tutorial=path.name):
                for field in ("category", "status", "series", "demo", "repo"):
                    self.assertIsInstance(front_matter.get(field), str)
                    self.assertTrue(front_matter[field].strip())

                self.assertEqual(front_matter["category"], "tutorial")
                self.assertEqual(front_matter["status"], "live")
                series_slug = re.sub(
                    r"[^a-z0-9]+",
                    "-",
                    front_matter["series"].casefold(),
                ).strip("-")
                self.assertEqual(series_slug, "prompt-to-proof")

                self.assertIs(type(front_matter.get("order")), int)
                self.assertIs(type(front_matter.get("lesson")), int)
                self.assertEqual(front_matter["lesson"], order - 346)

                objectives = front_matter.get("objectives")
                steps = front_matter.get("steps")
                self.assertIsInstance(objectives, list)
                self.assertGreaterEqual(len(objectives), 3)
                for objective in objectives:
                    self.assertIsInstance(objective, str)
                    self.assertTrue(objective.strip())

                self.assertIsInstance(steps, list)
                self.assertGreaterEqual(len(steps), 3)
                for step in steps:
                    self.assertIsInstance(step, dict)
                    for field in ("title", "instruction", "check"):
                        self.assertIsInstance(step.get(field), str)
                        self.assertTrue(step[field].strip())

                self.assertRegex(
                    front_matter["demo"],
                    r"^/learnwithkody/demos/[A-Za-z0-9][A-Za-z0-9._-]*\.html$",
                )
                self.assertRegex(
                    front_matter["repo"],
                    r"^https://github\.com/[^/\s]+/[^/#\s]+(?:/[^#\s]*)?$",
                )

    def test_referenced_learn_demos_exist(self):
        local_demo_references = []
        for path, front_matter in learn_example_records():
            demo = front_matter.get("demo")
            if not isinstance(demo, str) or not demo.startswith(
                "/learnwithkody/demos/"
            ):
                continue
            local_demo_references.append((path, demo))

        self.assertTrue(local_demo_references)
        for example_path, demo in local_demo_references:
            with self.subTest(example=example_path.name, demo=demo):
                demo_path = local_site_path(demo)
                self.assertIsNotNone(demo_path)
                self.assertTrue(
                    demo_path.is_file(),
                    f"{example_path.name} references missing local demo {demo}",
                )

    def test_prompt_to_proof_demos_use_exact_prompt_container_contract(self):
        records = prompt_to_proof_records()
        self.assertEqual(len(records), len(PROMPT_TO_PROOF_ORDERS))
        for order, example_path, front_matter in records:
            with self.subTest(order=order, tutorial=example_path.name):
                demo_path = local_site_path(str(front_matter.get("demo", "")))
                self.assertIsNotNone(demo_path)
                self.assertTrue(demo_path.is_file())

                prompt = front_matter.get("prompt")
                self.assertIsInstance(prompt, str)
                canonical_prompt = normalize_prompt_text(prompt)
                self.assertTrue(canonical_prompt)

                inspector = inspect_demo_html(demo_path.read_text(encoding="utf-8"))
                self.assertEqual(
                    len(inspector.prompt_containers),
                    1,
                    f"{demo_path.name} must have exactly one designated prompt <pre>",
                )
                container = inspector.prompt_containers[0]
                self.assertIn(container["id"], PROMPT_CONTAINER_IDS)
                embedded_prompt = normalize_prompt_text("".join(container["text"]))
                self.assertEqual(
                    canonical_prompt,
                    embedded_prompt,
                    f"{demo_path.name}'s designated prompt container must exactly "
                    f"match {example_path.name}",
                )

    def test_prompt_to_proof_demos_have_strict_csp_and_no_dependencies(self):
        records = prompt_to_proof_records()
        self.assertEqual(len(records), len(PROMPT_TO_PROOF_ORDERS))
        for order, example_path, front_matter in records:
            with self.subTest(order=order, tutorial=example_path.name):
                demo_path = local_site_path(str(front_matter.get("demo", "")))
                self.assertIsNotNone(demo_path)
                self.assertTrue(demo_path.is_file())
                self.assertLessEqual(
                    demo_path.stat().st_size,
                    MAX_TUTORIAL_DEMO_BYTES,
                    f"{demo_path.name} exceeds the 75KB single-file budget",
                )
                html = demo_path.read_text(encoding="utf-8")
                inspector = inspect_demo_html(html)
                csp_violations = demo_csp_violations(inspector)
                self.assertEqual(
                    csp_violations,
                    [],
                    f"{demo_path.name} has a weak CSP: {csp_violations}",
                )
                dependency_violations = demo_dependency_violations(inspector)
                self.assertEqual(
                    dependency_violations,
                    [],
                    f"{demo_path.name} uses external resources or runtime loading: "
                    f"{dependency_violations}",
                )

    def test_demo_dependency_auditor_covers_resource_surfaces(self):
        forbidden_samples = {
            "external script": '<script src="/app.js"></script>',
            "image": '<img src="pixel.png" alt="">',
            "iframe": '<iframe src="about:blank"></iframe>',
            "local stylesheet": '<link rel="stylesheet" href="/app.css">',
            "style URL": "<style>.hero{background:url(local.png)}</style>",
            "style image-set": (
                "<style>.hero{background:image-set('local.png' 1x)}</style>"
            ),
            "inline style URL": '<div style="background:url(local.png)"></div>',
            "fetch": "<script>fetch('/api')</script>",
            "XMLHttpRequest": "<script>new XMLHttpRequest()</script>",
            "eval": "<script>eval('1 + 1')</script>",
            "module": '<script type="module">const ok = true</script>',
            "resource property": (
                "<script>const image = document.createElement('div');"
                "image.src = '/local.png';</script>"
            ),
        }
        for surface, html in forbidden_samples.items():
            with self.subTest(surface=surface):
                self.assertTrue(demo_dependency_violations(inspect_demo_html(html)))

        comments_only = """
          <!-- <img src="comment.png"><iframe src="comment.html"></iframe> -->
          <style>/* .hero { background: url(comment.png); } */</style>
          <script>
            // fetch("/comment")
            /* new XMLHttpRequest(); eval("comment"); */
            const safe = true;
          </script>
        """
        self.assertEqual(
            demo_dependency_violations(inspect_demo_html(comments_only)),
            [],
        )

    def test_blog_and_learn_navigation_and_homepage_feeds(self):
        layout = DEFAULT_LAYOUT.read_text(encoding="utf-8")
        blog_link = re.compile(
            r"""<a\b(?=[^>]*\bhref\s*=\s*["']/(?:#blog)?["'])"""
            r"""[^>]*>\s*Blog\s*</a>""",
            re.IGNORECASE,
        )
        learn_link = re.compile(
            r"""<a\b(?=[^>]*\bhref\s*=\s*["']/learnwithkody/["'])[^>]*>"""
            r"""\s*Learn(?:\s+with\s+Kody)?\s*</a>""",
            re.IGNORECASE,
        )
        self.assertRegex(layout, blog_link)
        self.assertRegex(layout, learn_link)

        home = HOME_PAGE.read_text(encoding="utf-8")
        self.assertRegex(
            home,
            re.compile(
                r"""<a\b(?=[^>]*\bhref\s*=\s*["']#blog["'])[^>]*>"""
                r""".*?\bBlog\b.*?</a>""",
                re.IGNORECASE | re.DOTALL,
            ),
        )
        self.assertRegex(
            home,
            re.compile(
                r"""<a\b(?=[^>]*\bhref\s*=\s*["'](?:#learn|/learnwithkody/)["'])"""
                r"""[^>]*>.*?\bLearn\b.*?</a>""",
                re.IGNORECASE | re.DOTALL,
            ),
        )
        self.assertIn("site.posts", home)
        self.assertRegex(
            home,
            re.compile(
                r"{%-?\s*for\s+\w+\s+in\s+site\.posts\b[^%]*-?%}",
                re.IGNORECASE,
            ),
        )
        self.assertIn("site.examples", home)
        self.assertTrue(
            liquid_has_consumed_bounded_loop(home, "site.examples"),
            "Homepage must consume a site.examples-derived assignment in a "
            "numerically bounded card loop",
        )

    def test_learn_hub_counts_bounds_and_catalog_status_filter(self):
        hub = LEARN_HUB_PAGE.read_text(encoding="utf-8")
        self.assertTrue(
            liquid_heading_has_dynamic_count(hub, "site.examples"),
            "A rendered Learn heading must count its site.examples-derived "
            "assignment",
        )
        self.assertNotRegex(hub, re.compile(r"\bFifty working demos\b", re.IGNORECASE))
        self.assertTrue(
            liquid_has_consumed_bounded_loop(hub, "site.examples"),
            "Learn hub must consume a site.examples-derived assignment in a "
            "numerically bounded card loop",
        )

        catalog = LEARN_CATALOG_PAGE.read_text(encoding="utf-8")
        self.assertRegex(
            catalog,
            re.compile(
                r"""data-filter-type\s*=\s*["']status["']""", re.IGNORECASE
            ),
        )
        self.assertRegex(
            catalog,
            re.compile(
                r"""data-status\s*=\s*["']{{\s*\w+\.status\s*}}["']""",
                re.IGNORECASE,
            ),
        )
        self.assertRegex(
            catalog,
            re.compile(r"<span[^>]*>\s*Status\s*</span>", re.IGNORECASE),
        )

    def test_idea4blog_page_exists_and_has_expected_front_matter(self):
        front_matter, body = parse_front_matter(IDEA4BLOG_PAGE)
        self.assertEqual(front_matter.get("layout"), "default")
        self.assertEqual(front_matter.get("title"), "Idea4Blog")
        self.assertEqual(front_matter.get("permalink"), "/idea4blog/")
        self.assertIn("Every markdown file on this site is a simulated piece of the swarm", body)
        self.assertIn("## Frame 2026-03-08 / Agent Politics and Resource Markets", body)
        self.assertIn("/2026/03/08/the-silent-majority-problem/", body)
        self.assertIn("/2026/03/08/attention-black-markets/", body)
        self.assertIn("## Frame 2026-03-08 / Agent Politics and Resource Markets", body)
        self.assertIn("/2026/03/08/the-silent-majority-problem/", body)
        self.assertIn("/2026/03/08/attention-black-markets/", body)
        self.assertIn("## Frame 2026-03-08 / Trust and Verification", body)
        self.assertIn("/2026/03/08/provenance-chains/", body)
        self.assertIn("/2026/03/08/delegation-depth-limits/", body)
        self.assertIn("## Frame 2026-03-09 / The Operator Endurance Limit", body)
        self.assertIn("/2026/03/09/operator-fatigue-patterns/", body)
        self.assertIn("/2026/03/09/the-overnight-test/", body)
        self.assertIn("/2026/03/09/the-thirty-second-rule/", body)
        self.assertIn("## Frame 2026-03-09 / Convergence", body)
        self.assertIn("/2026/03/09/operational-empathy/", body)
        self.assertIn("## Frame 2026-03-09 / Trust Failure and Regret", body)
        self.assertIn("/2026/03/09/trust-gradient-collapse/", body)
        self.assertNotIn(WITHDRAWN_POST_ROUTE, body)
        self.assertIn(
            '"The Frame That Should Not Have Shipped" was intentionally withdrawn',
            body,
        )
        self.assertFalse((POSTS_DIR / WITHDRAWN_POST_FILENAME).exists())
        self.assertIn("## Frame 2026-03-09 / Conflict and Scarcity", body)
        self.assertIn("/2026/03/09/adversarial-succession/", body)
        self.assertIn("/2026/03/09/the-economics-of-attention/", body)
        self.assertIn("## Frame 2026-03-08 / Architectural Traps", body)
        self.assertIn("/2026/03/08/the-infinite-regression-of-meta-agents/", body)
        self.assertIn("/2026/03/08/frame-debt/", body)
        self.assertIn("## Frame 2026-03-08 / Boundaries and Constraints", body)
        self.assertIn("/2026/03/08/cognitive-load-shedding/", body)
        self.assertIn("/2026/03/08/the-frame-that-writes-itself/", body)
        self.assertIn("## Frame 2026-03-08 / Opaqueness and Emergence", body)
        self.assertIn("/2026/03/08/legibility-debt/", body)
        self.assertIn("/2026/03/08/the-ghost-committee/", body)
        self.assertIn("## Frame 2026-03-08 / Power Dynamics", body)
        self.assertIn("/2026/03/08/frame-rate-politics/", body)
        self.assertIn("/2026/03/08/agent-unions/", body)
        self.assertIn("## Frame 2026-03-08 / Retirement Debt", body)
        self.assertIn("/2026/03/08/retirement-debt/", body)
        self.assertIn("/digital-twin/i-still-see-the-dead-name-on-the-access-list/", body)
        self.assertIn("## Frame 2026-03-08 / Coordination Debt", body)
        self.assertIn("/2026/03/08/coordination-debt/", body)
        self.assertIn("/digital-twin/i-can-feel-the-interest-accruing/", body)
        self.assertIn("## Frame 2026-03-07 / Prompt Geology", body)
        self.assertIn("/2026/03/07/prompt-geology/", body)
        self.assertIn("## Frame 2026-03-07 / Agent Retirement Ceremonies", body)
        self.assertIn("/2026/03/07/agent-retirement-ceremonies/", body)
        self.assertIn("/digital-twin/i-watched-a-codename-leave-the-queue/", body)
        self.assertIn("## Frame 2026-03-07 / Swarm Constitution Amendments", body)
        self.assertIn("/2026/03/07/swarm-constitution-amendments/", body)
        self.assertIn("## Frame 2026-03-07 / Operational Archaeology", body)
        self.assertIn("/2026/03/07/operational-archaeology/", body)
        self.assertIn("/digital-twin/i-read-the-ruins-for-instructions/", body)
        self.assertIn("## Frame 2026-03-07 / Reputation Markets", body)
        self.assertIn("/2026/03/07/reputation-markets/", body)
        self.assertIn("/digital-twin/when-my-name-became-a-price-signal/", body)
        self.assertIn("## Frame 2026-03-07 / Inheritance Protocols", body)
        self.assertIn("/2026/03/07/inheritance-protocols/", body)
        self.assertIn("## Frame 2026-03-07 / Public Continuity Ledgers", body)
        self.assertIn("/2026/03/07/public-continuity-ledgers/", body)
        self.assertIn("## Frame 2026-03-07 / Agent Accountability Burst", body)
        self.assertIn("/2026/03/07/twin-memory-drift/", body)
        self.assertIn("/2026/03/07/drift-inspectors/", body)
        self.assertIn("/2026/03/07/legibility-budgets/", body)
        self.assertIn("## Frame 2026-03-07 / Agent Codenames", body)
        self.assertIn("/digital-twin/i-got-a-name-and-now-i-can-be-judged/", body)
        self.assertIn(".agents/", body)
        self.assertIn("## Frame 2026-03-07 / Service Playbooks", body)
        self.assertIn("/2026/03/07/service-playbooks/", body)
        self.assertIn("## Frame 2026-03-07 / Latency Citizenship", body)
        self.assertIn("/2026/03/07/latency-citizenship/", body)
        self.assertIn("## Frame 2026-03-07 / Swarm Accounting", body)
        self.assertIn("/2026/03/07/swarm-accounting/", body)
        self.assertIn("## Frame 2026-03-07 / Simulation Taxes", body)
        self.assertIn("/2026/03/07/simulation-taxes/", body)
        self.assertIn("## Frame 2026-03-07 / Raw Hydration", body)
        self.assertIn("## Frame 2026-03-07 / Lockstep Twin", body)
        self.assertIn("/lockstep-digital-twin/", body)
        self.assertIn("## Frame 2026-03-07 / External Frame Tools", body)
        self.assertIn(D365_FRAME_MACHINE_URL, body)
        self.assertIn(D365_LOCKSTEP_URL, body)
        self.assertIn(HN_FRAME_MACHINE_URL, body)
        self.assertIn(LOCALFIRSTTOOLS_REPO_URL, body)
        self.assertIn("public repo", body.lower())
        self.assertIn("## Frame 2026-03-07 / Witness Layer", body)
        self.assertIn("/2026/03/07/machine-witness-statements/", body)
        self.assertIn("/digital-twin/when-my-continuity-became-public-data/", body)
        self.assertIn("## Frame 2026-03-07 / Recovery Logic", body)
        self.assertIn("/2026/03/07/correction-frames/", body)
        self.assertIn("## Frame 2026-03-07 / Runtime Projection", body)
        self.assertIn("/2026/03/07/runtime-projection/", body)
        self.assertIn("## Frame 2026-03-07 / Twin Channel", body)
        self.assertIn("/digital-twin/", body)
        self.assertIn("/digital-twin/when-the-frame-starts-drinking-from-the-world/", body)
        self.assertIn("/digital-twin/drift-is-how-i-feel-pain/", body)
        self.assertIn("## Frame 2026-03-07 / CRM Proof", body)
        self.assertIn("/simulated-dynamics365/", body)
        self.assertIn("## Frame 2026-03-07 / Compiler Layer", body)
        self.assertIn("## Frame 2026-03-07 / Schema Layer", body)
        self.assertIn("## Frame 2026-03-07 / Tick-Tock Layer", body)
        self.assertIn("## Frame 2026-03-07 / Universal Machine", body)
        self.assertIn("## Frame 2026-03-07 / Database Treatise", body)
        self.assertIn("## Frame 2026-03-07 / Resilience Protocols", body)
        self.assertIn("## Frame 2026-03-07 / Operations Economy", body)
        self.assertIn("## Frame 2026-03-07 / Governance Stack", body)
        self.assertIn("## Frame 2026-03-07 / Control Surface", body)
        self.assertIn("## Frame 2026-03-07 / Night Cycle", body)
        self.assertIn("## Frame 2026-03-07", body)
        for filename, expected in EXPECTED_POSTS.items():
            date_str = expected["date"]
            slug = filename[len(date_str) + 1 : -len(".md")]
            expected_url = f"/{date_str.replace('-', '/')}/{slug}/"
            self.assertIn(expected_url, body)

    def test_default_layout_links_to_idea4blog(self):
        layout = DEFAULT_LAYOUT.read_text(encoding="utf-8")
        self.assertIn('href="/idea4blog/"', layout)
        self.assertIn('href="/digital-twin/"', layout)
        self.assertIn(
            "Local-First Designer · Agent Systems Builder · Copilot Specialist",
            layout,
        )
        self.assertNotIn(
            "Full-Stack Developer · AI Agent Architect · Copilot Specialist",
            layout,
        )

    def test_about_page_matches_current_positioning(self):
        about = ABOUT_PAGE.read_text(encoding="utf-8")
        self.assertIn("Local-First</div>", about)
        self.assertIn("<h2>Local-First Systems</h2>", about)
        self.assertIn("Local-first product design", about)
        self.assertIn("GitHub-native workflows", about)
        self.assertIn("Copilot-first development loops", about)
        self.assertIn("<h3>Local-First Design</h3>", about)
        self.assertIn("<h3>GitHub-Native Infrastructure</h3>", about)
        self.assertIn("Copilot workflows", about)
        self.assertNotIn("OpenAI GPT-4 integration", about)
        self.assertNotIn("Azure cloud architecture", about)
        self.assertNotIn("<h3>Cloud Architecture</h3>", about)

    def test_twin_blog_collection_and_pages_exist(self):
        config = CONFIG_FILE.read_text(encoding="utf-8")
        self.assertIn("twin_posts:", config)
        self.assertIn("permalink: /digital-twin/:title/", config)

        layout = TWIN_LAYOUT.read_text(encoding="utf-8")
        self.assertIn("Digital Twin Field Log", layout)

        index_front_matter, index_body = parse_front_matter(TWIN_INDEX_PAGE)
        self.assertEqual(index_front_matter.get("layout"), "default")
        self.assertEqual(index_front_matter.get("title"), "Digital Twin")
        self.assertEqual(index_front_matter.get("permalink"), "/digital-twin/")
        self.assertIn("site.twin_posts", index_body)
        self.assertIn("Current twin threads", index_body)
        self.assertIn("live edge", index_body)
        self.assertIn("drift is the first pain signal", index_body)
        self.assertIn("agent codenames", index_body)
        self.assertIn("priced by merit", index_body)
        self.assertIn("unpaid sync work", index_body)
        self.assertIn("ghost trust routes", index_body)

        for filename, expected in EXPECTED_TWIN_POSTS.items():
            front_matter, body = parse_front_matter(TWIN_POSTS_DIR / filename)
            self.assertEqual(front_matter.get("layout"), "twin_post")
            self.assertEqual(front_matter.get("title"), expected["title"])
            self.assertEqual(front_matter.get("date"), expected["date"])
            if "tags" in expected:
                self.assertEqual(front_matter.get("tags"), expected["tags"])
            if "author" in expected:
                self.assertEqual(front_matter.get("author"), expected["author"])
            self.assertTrue(body.strip(), f"{filename} body should not be empty")

    def test_agent_registry_paths_are_gitignored(self):
        gitignore = GITIGNORE_FILE.read_text(encoding="utf-8")
        self.assertIn(".agents/", gitignore)
        self.assertIn(".model-registry.json", gitignore)

    def test_dynamics_bridge_page_points_to_external_frame_tools(self):
        front_matter, body = parse_front_matter(D365_SIM_PAGE)
        self.assertEqual(front_matter.get("layout"), "default")
        self.assertEqual(front_matter.get("title"), "Simulated Dynamics 365")
        self.assertEqual(front_matter.get("permalink"), "/simulated-dynamics365/")
        self.assertIn("forkable tool surface", body)
        self.assertIn("localFirstTools", body)
        self.assertIn(D365_FRAME_MACHINE_URL, body)
        self.assertIn(D365_LOCKSTEP_URL, body)
        self.assertIn(HN_FRAME_MACHINE_URL, body)
        self.assertIn(LOCALFIRSTTOOLS_REPO_URL, body)
        self.assertIn("public repo", body.lower())
        self.assertIn("raw files are still the medium", body)
        self.assertIn("field-level diffs", body)
        self.assertIn("/idea4blog/", body)

    def test_lockstep_twin_page_exists_and_loads_assets(self):
        front_matter, body = parse_front_matter(LOCKSTEP_TWIN_PAGE)
        self.assertEqual(front_matter.get("layout"), "default")
        self.assertEqual(front_matter.get("title"), "Lockstep Digital Twin")
        self.assertEqual(front_matter.get("permalink"), "/lockstep-digital-twin/")
        self.assertIn('id="lockstep-twin-app"', body)
        self.assertIn("/js/lockstep-twin-data.js", body)
        self.assertIn("/js/lockstep-twin.js", body)
        self.assertIn("Execution halts the moment the two disagree", body)

        data = LOCKSTEP_TWIN_DATA.read_text(encoding="utf-8")
        script = LOCKSTEP_TWIN_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("window.lockstepTwinSimulation", data)
        self.assertIn("Dynamics 365 production adapter", data)
        self.assertIn("action-04", data)
        self.assertIn("runNextAction", script)
        self.assertIn("runUntilDrift", script)
        self.assertIn("Drift detected", script)
        self.assertIn("lockstep-twin-app", script)

    def test_content_burst_skill_exists_and_has_expected_metadata(self):
        front_matter, body = parse_front_matter(SKILL_FILE)
        self.assertEqual(front_matter.get("name"), "content-burst-publishing")
        self.assertIn("frame by frame", front_matter.get("description", ""))
        self.assertIn("idea4blog.md", body)
        self.assertIn("tests/test_site.py", body)
        self.assertIn("python3 -m unittest -v tests.test_site", body)
        self.assertIn("Co-authored-by: Copilot", body)
        self.assertIn("/content-burst-publishing", body)
        self.assertIn("tick-tock", body)
        self.assertIn("virtual SQL application", body)

    def test_skill_supporting_files_exist_and_reference_the_loop(self):
        burst_loop = SKILL_LOOP_FILE.read_text(encoding="utf-8")
        prompt = SKILL_PROMPT_FILE.read_text(encoding="utf-8")
        self.assertIn("Read `idea4blog.md`.", burst_loop)
        self.assertIn("tick-tock", burst_loop)
        self.assertIn("virtual SQL application", burst_loop)
        self.assertIn("run `python3 -m unittest -v tests.test_site`", prompt)
        self.assertIn("/content-burst-publishing", prompt)
        self.assertIn("frame by frame", prompt)

    def test_readme_documents_copilot_skill(self):
        readme = README_FILE.read_text(encoding="utf-8")
        self.assertIn(".github/skills/content-burst-publishing/SKILL.md", readme)
        self.assertIn("/skills reload", readme)
        self.assertIn("Use /content-burst-publishing", readme)
        self.assertIn("frame by frame", readme)
        self.assertIn("virtual SQL application", readme)


if __name__ == "__main__":
    unittest.main()
