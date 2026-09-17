import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "ai-brainstem.html"


class AIBrainstemPageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PAGE.read_text(encoding="utf-8")
        match = re.search(
            r'<script\b(?=[^>]*\bid="questData")(?=[^>]*\btype="application/json")[^>]*>'
            r"([\s\S]*?)</script>",
            cls.html,
        )
        if not match:
            raise AssertionError("The standalone quest data is missing")
        cls.quest = json.loads(match.group(1))

    def test_page_is_standalone_and_canonical(self):
        self.assertIn(
            '<link rel="canonical" href="https://kody-w.github.io/ai-brainstem.html">',
            self.html,
        )
        self.assertNotRegex(
            self.html,
            r'<(?:script\b[^>]*\bsrc=|link\b[^>]*\brel=["\']stylesheet|iframe\b)',
        )
        self.assertEqual(len(re.findall(r"<script\b", self.html)), 2)
        self.assertIn(
            'href="https://blazingbeard.github.io/quests/rapp-brainstem.html"',
            self.html,
        )
        self.assertNotIn('href="rapp-brainstem.html"', self.html)

    def test_all_prompt_first_checkpoints_are_present(self):
        tagline = (
            "The AI for democratizing exploration at the ever-changing edge "
            "of the frontier."
        )
        self.assertGreaterEqual(self.html.count(tagline), 2)
        self.assertEqual(self.quest["version"], "1.0.0")
        self.assertEqual(len(self.quest["phases"]), 6)
        self.assertEqual(len(self.quest["checkpoints"]), 24)
        self.assertEqual(
            len({checkpoint["id"] for checkpoint in self.quest["checkpoints"]}),
            24,
        )
        for checkpoint in self.quest["checkpoints"]:
            self.assertGreaterEqual(len(checkpoint["prompt"]), 100)
            visible = " ".join(
                [
                    checkpoint["intro"],
                    checkpoint["prompt"],
                    *checkpoint["actions"],
                    *checkpoint["outcomes"],
                    checkpoint["boundary"],
                    checkpoint["help"],
                ]
            )
            self.assertRegex(visible.lower(), r"gate|block|unavailable|unsupported")

    def test_source_claims_are_pinned_to_reviewed_commits(self):
        self.assertIn(
            "04f4c9033f62ab8b49126d83129dc02cf205fb4d",
            self.html,
        )
        self.assertIn(
            "4a7c19c7cf87a88feba55653c15afad3174536d0",
            self.html,
        )
        self.assertNotRegex(
            self.html,
            r"unreleased working changes|linked base revision",
        )

    def test_user_path_contains_no_command_line_or_secret_setup(self):
        content = self.html + json.dumps(self.quest)
        for pattern in (
            r"\b(?:powershell|terminal|localhost|curl|cli|cmd(?:\.exe)?|bash|zsh|wsl)\b",
            r"\bapi[\s_-]*keys?\b",
            r"\b(?:sudo|npm|npx|pip|python3?|brew|winget|chmod|xcrun)\b",
            r"\bgit\s+(?:clone|checkout|pull|push|commit)\b",
            r"(?:/Users/|/home/|/Volumes/|[A-Z]:\\)",
            r"\b(?:GITHUB_TOKEN|BRAINSTEM_SECRET)\b",
        ):
            self.assertNotRegex(content, re.compile(pattern, re.IGNORECASE))


if __name__ == "__main__":
    unittest.main()
