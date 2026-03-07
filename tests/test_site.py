import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "_posts"
IDEA4BLOG_PAGE = ROOT / "idea4blog.md"
ABOUT_PAGE = ROOT / "about.md"
DEFAULT_LAYOUT = ROOT / "_layouts" / "default.html"
README_FILE = ROOT / "README.md"
SKILL_DIR = ROOT / ".github" / "skills" / "content-burst-publishing"
SKILL_FILE = SKILL_DIR / "SKILL.md"
SKILL_LOOP_FILE = SKILL_DIR / "burst-loop.md"
SKILL_PROMPT_FILE = SKILL_DIR / "handoff-prompt.md"

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


class SiteContentTests(unittest.TestCase):
    def test_expected_posts_exist(self):
        for filename in EXPECTED_POSTS:
            self.assertTrue((POSTS_DIR / filename).exists(), f"Missing {filename}")

    def test_new_posts_follow_jekyll_filename_format(self):
        pattern = re.compile(r"^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$")
        for filename in EXPECTED_POSTS:
            self.assertRegex(filename, pattern)

    def test_new_posts_have_expected_front_matter(self):
        for filename, expected in EXPECTED_POSTS.items():
            front_matter, body = parse_front_matter(POSTS_DIR / filename)
            self.assertEqual(front_matter.get("layout"), "post")
            self.assertEqual(front_matter.get("title"), expected["title"])
            self.assertEqual(front_matter.get("date"), expected["date"])
            self.assertEqual(front_matter.get("tags"), expected["tags"])
            self.assertTrue(body.strip(), f"{filename} body should not be empty")

    def test_post_dates_match_filename_prefix(self):
        for filename, expected in EXPECTED_POSTS.items():
            self.assertTrue(filename.startswith(expected["date"]))

    def test_idea4blog_page_exists_and_has_expected_front_matter(self):
        front_matter, body = parse_front_matter(IDEA4BLOG_PAGE)
        self.assertEqual(front_matter.get("layout"), "default")
        self.assertEqual(front_matter.get("title"), "Idea4Blog")
        self.assertEqual(front_matter.get("permalink"), "/idea4blog/")
        self.assertIn("Every markdown file on this site is a simulated piece of the swarm", body)
        self.assertIn("## Frame 2026-03-07 / Database Treatise", body)
        self.assertIn("## Frame 2026-03-07 / Resilience Protocols", body)
        self.assertIn("## Frame 2026-03-07 / Operations Economy", body)
        self.assertIn("## Frame 2026-03-07 / Governance Stack", body)
        self.assertIn("## Frame 2026-03-07 / Control Surface", body)
        self.assertIn("## Frame 2026-03-07 / Night Cycle", body)
        self.assertIn("## Frame 2026-03-07", body)
        for filename in EXPECTED_POSTS:
            if filename.startswith("2026-03-06-"):
                slug = filename[len("2026-03-06-") : -len(".md")]
                expected_url = f"/2026/03/06/{slug}/"
            else:
                slug = filename[len("2026-03-07-") : -len(".md")]
                expected_url = f"/2026/03/07/{slug}/"
            self.assertIn(expected_url, body)

    def test_default_layout_links_to_idea4blog(self):
        layout = DEFAULT_LAYOUT.read_text(encoding="utf-8")
        self.assertIn('href="/idea4blog/"', layout)
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
