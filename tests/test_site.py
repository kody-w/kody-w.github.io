import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "_posts"
IDEA4BLOG_PAGE = ROOT / "idea4blog.md"
DEFAULT_LAYOUT = ROOT / "_layouts" / "default.html"

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
        for filename in EXPECTED_POSTS:
            slug = filename[len("2026-03-06-") : -len(".md")]
            self.assertIn(f"/2026/03/06/{slug}/", body)

    def test_default_layout_links_to_idea4blog(self):
        layout = DEFAULT_LAYOUT.read_text(encoding="utf-8")
        self.assertIn('href="/idea4blog/"', layout)


if __name__ == "__main__":
    unittest.main()
