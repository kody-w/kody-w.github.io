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
        self.assertEqual(self.quest["version"], "1.1.0")
        self.assertEqual(self.quest["reviewed"], "2026-09-18")
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
            "b2d857e36583944bc479cf5abe4f27d4ce245efa",
            self.html,
        )
        self.assertIn(
            "f93369d1e5973dcb6862c40a9a2eab87a9f347a8",
            self.html,
        )
        self.assertIn(
            "9b1975a1b8f01981f3f1e6b667ad3aaf907178ea",
            self.html,
        )
        self.assertNotRegex(
            self.html,
            r"unreleased working changes|linked base revision",
        )
        self.assertIn(
            "Brainstem always passes continue_pending_work=false",
            self.html,
        )
        self.assertIn(
            "at least 30 AI credits per SDK 1.0.13 session",
            self.html,
        )
        self.assertNotIn("6b3f16cb9079b64478ed15e546c87ca41b40e0ea", self.html)
        self.assertNotIn("2314aa53811c447cc79d186e228d490505093738", self.html)

    def test_agent_first_portability_and_gauntlet_story(self):
        for text in (
            "agent.py</code> is Brainstem’s only first-class executable capability",
            "does not present plain skills as peer tools",
            "deterministically generates and hot-loads an agent.py wrapper",
            "Generated agent.py",
            "Uses skill: book-swap-review",
            "Export agent.py bundles",
            "Export SKILL.md embeds",
            "complete SKILL.md carrier",
            "CC BY 4.0",
            "needs_reference",
            "executed=false",
            "Keep the protected gauntlet-loop agent available",
        ):
            self.assertIn(text, self.html)
        self.assertNotIn(
            "AI Brainstem loads both as discoverable capabilities",
            self.html,
        )
        self.assertIn(
            "State whether the previously exported agent.py and SKILL.md carrier "
            "are included by an actual scoped reference",
            self.html,
        )

    def test_sdk_cards_teach_supported_state_and_exact_limits(self):
        for text in (
            "<strong>Supported</strong>",
            "<strong>On or Off</strong>",
            "<strong>Configured or Not configured</strong>",
            "<strong>Needs approval</strong>",
            "<strong>Provider dependent</strong>",
            "<strong>SDK limitation</strong>",
            "zero configured roles, routines, active tasks, caps, or Apps is valid",
            "bounded Markdown, sanitized inert HTML, allowlisted SVG, or closed "
            "line/rect/circle/text",
            "isolated session store and persistent cache are On",
            "Owned Stop binds one operation identifier",
            "Attached task ceilings are 2 concurrent, 4 total, depth 1, and 120 seconds",
            "File tracking and session diff are enabled on create and resume",
            "journaled sandbox rewind",
            "local content-free diagnostics",
            "selective <code>continue_pending_work</code>",
            "unrestricted detach",
            "enforceably local native memory",
            "native telemetry locality",
            "interactive MCP Apps",
            "does not claim every provider behavior was observed live",
        ):
            self.assertIn(text, self.html)
        for stale_claim in (
            "Canvases show unavailable: no-renderer",
            "MCP Apps show unavailable: no-safe-renderer",
            "Rewind execution is unavailable",
            "SDK session-store indexing and memory are off",
        ):
            self.assertNotIn(stale_claim, self.html)

    def test_accessible_progress_contract_is_preserved(self):
        for text in (
            'class="skip-link" href="#mainContent"',
            'role="progressbar"',
            'aria-valuemax="24"',
            'aria-modal="true"',
            'aria-live="polite"',
            'data-outcome="verified" aria-pressed="false"',
            'data-outcome="gated" aria-pressed="false"',
            "prefers-reduced-motion: reduce",
            "window.localStorage",
            "ai-brainstem-training-quest:v1",
        ):
            self.assertIn(text, self.html)

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
