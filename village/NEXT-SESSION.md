# Case-study rewrite status

## Completed · 2026-09-19

Rewrote all four village studies in the approved order: Qualcomm, BNY, T-Mobile, Overlay. Each now follows consequential decisions, with evidence beside the relevant choice. Removed responsibility inventories, generic seniority claims, version-history narration, and unsupported outcomes. Captions explain the retained artifacts.

Read `AGENTS.md`, `village/README.md`, and `village/EDITORIAL-SOURCES.md` before further content changes. The evidence record lists the resumes and Obsidian notes checked, contradictions found, and what the copy can support.

## Follow-up · 2026-09-20

Wesley confirmed the 120x writing-effort and 95% CMS creation-time reductions as verified and requested their restoration. Both now appear in Qualcomm’s metric grid and documentation section. Do not remove them for lack of a separately recorded measurement method. All four case studies now use system sans-serif for body text, headings, labels, and metrics. Village signs and panel chrome retain Pixelify Sans.

Wesley also confirmed the T-Mobile zero-result reduction and chose the before/after rates for display: about 13% → 0.7% of searches returned zero results. This replaces −59% in the study. Search usage +24% and phone sales +11% remain; navigation metrics stay separate.

## Remaining optional clarification

Questions were sent early in the rewrite session; no answers had arrived when the changes were saved:

- Overlay: a consequential product mistake, what exposed it, and what changed. Current copy uses the documented arrival-confusion / market-discovery change without inventing a stronger anecdote or onboarding metric.
- BNY: confirm the placement-framework middle term. Framework labels are omitted. The study uses the adopted IA, documented usability findings, and task origins. Broader task-experience validation is not presented as a shipped outcome.

At Wesley’s request on September 20, the T-Mobile search bullet now uses ~13% to 0.7% in the main and AI Forward Markdown/HTML resumes, the Assured HTML resume, all three PDF exports, and both portfolio PDF copies. Other resume content was preserved. Do not restore unrelated omitted figures simply because a resume repeats them.

## Branch and scope

Work only on `codex/alpine-village`. Main remains at `21c9abe2cac0edc7a077b24fb2eb3e9da0af87f3`. Do not push, publish, deploy, switch to main, or change main. Save relevant changes in local commits only. Leave untracked `AGENTS.md` and unrelated Qualcomm images unstaged.

Scene design, village JavaScript, and interactions were preserved. The September 20 CSS update changes only typography and metric-column sizing within case-study content. Only a brittle BNY headline assertion in `check.cjs` changed to identify the loaded study by its stable page ID.

## Verification and preview

Passed JavaScript syntax, `node village/check.cjs`, `git diff --check`, HTML nesting, all retained image paths, tracked-image status, lazy-loading, and copy checks for em-dashes and excluded claims. Inspected all retained images for caption accuracy.

Restarted preview with `python3 -m http.server 8000 --bind 127.0.0.1`. Homepage and all four study endpoints returned HTTP 200. Check that the server is still running before relying on it in a later session.

No browser-rendering verification: the Browser skill was read, but its required execution tool was unavailable; no standalone browser automation package was installed. The VM harness does not establish visual rendering or real-device touch behavior.
