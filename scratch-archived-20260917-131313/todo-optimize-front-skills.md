# TODO: trim bloat in amasty-storefront vendored six

Repo: ~/AmastyDir/adobeIO/claude-tools, plugin amasty-storefront. Review against Adobe package 3.4.0, 2026-09-17. None of the six have `*Confirmed live: …*` markers — all normative, not observed findings.

- [ ] storefront-project-manager — ~1/3 of file (~160/480 lines) process scaffolding: ~40-line redirect template, unexplained complexity-scoring weights, "Do NOT describe future phase actions" repeated verbatim 3x (Phase 1/2/3 boundaries).
- [ ] storefront-block-developer — Accessibility/Performance/Responsive sections (~200/963 lines) generic web-dev tutorial, zero EDS specifics. "MANDATORY Skill Handoff" restates one rule 5 ways.
- [ ] storefront-researcher — same routing logic drawn 3x (ASCII tree → table → "Quick Reference"), ~25-30% of file.
- [ ] storefront-tester — closing "Quick Reference" duplicates material shown twice above; "Test Report Template" (~40 lines) generic QA boilerplate.
- [ ] storefront-content-modeler — 3 of 4 "Common Block Examples" restate same convention already shown; ~half the file is repetition.
- [ ] storefront-dropin-developer — strongest of the six; one real rule ("verify via Researcher") restated 8x. Lowest priority.

Before editing: amasty-storefront/CLAUDE.md currently says "do not hand-edit the vendored six" — that rule needs updating/exception as part of this work. Re-run npm pack/diff check first in case Adobe fixed some of this upstream.
