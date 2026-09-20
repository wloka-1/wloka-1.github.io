# Next session: rewrite the four case studies

## User authorization and immediate task

Wesley approved rewriting all four case studies: "good do it all, ask me what you need along the way." He then asked to save a handoff so he could start a fresh session. No case-study copy has been edited yet. Continue with actual rewrites, not another strategy-only response.

Read `AGENTS.md` and `village/README.md` first. Work in `/Users/wk/Projects/wesley-portfolio` on `codex/alpine-village`. Do not push, publish, deploy, switch to main, or change main. Main remains at `21c9abe2cac0edc7a077b24fb2eb3e9da0af87f3`.

Existing untracked `AGENTS.md` and `images/qualcomm/` files are unrelated. Do not stage them. Save relevant work in local commits only.

## Agreed editorial direction

Wesley likes the village's direct, human copy. Case studies need professional polish through precision, clear reasoning, and evidence, while preserving his voice. Avoid corporate prose and self-congratulatory claims about seniority.

- Remove the "What this shows" sections and generic lessons about being a Staff designer.
- Cut slogans such as "The process was the product," generic UX explanations, and unsupported grand claims.
- Replace responsibility inventories, process-stage headings, and version histories with two or three consequential decisions per study.
- Explain the observation, choice, tradeoff, and result. Keep evidence adjacent to the decision it supports.
- Open with the situation, Wesley's specific role, and the result. Distinguish personal contribution from team work, and shipped outcomes from work still in validation.
- Include a specific limitation, failed assumption, or remaining problem where supported. Never invent an anecdote to fill a narrative gap.
- Keep useful personality and concrete details. Professional does not mean formal or bland.
- Images should explain the work through useful captions, rather than serve as an unannotated gallery.

## Story for each study

1. **Qualcomm first:** shared guidance across three brands. Connect visual direction, pattern research, and documentation to real product differences. Use existing visual artifacts and the public system as evidence. Automation supports this story rather than taking over the case study.
2. **BNY:** giving a growing AI platform a coherent structure. Focus on adopted IA and what user testing changed; give the task model a distinct second chapter. Compress other ownership into a scope summary. The current draft contains navigation and implementation specifics excluded by the project NDA rules, so scrub it carefully. Do not claim the colleague's component architecture/contracts or the boss's intake framework. Confirm the placement-framework middle term before naming it.
3. **T-Mobile:** helping people find useful results across shopping and support. Follow a few search decisions from evidence through iteration to outcomes. Remove competitor roll calls, version numbers, and negative commentary about the PM. Keep search metrics separate from navigation metrics and reach.
4. **Overlay:** making an unfamiliar trading product understandable and usable. Explain the confusion observed and how the product changed. Founder scope supplies context. Seek a real consequential mistake rather than generic startup lessons. Do not conflate social audiences with product users or sum overlapping audiences as unique people.

## Questions already asked, not answered

An asynchronous question was sent immediately before the user requested this handoff. No answers arrived. Ask for these early in the next session while progressing with independent work:

- **T-Mobile:** the study says null results fell from 13% to 0.7% (94%). Verified project rules say search usage +24%, zero-result searches −59%, phone sales +11%. Are these different measurement periods, or should the verified project figures replace the current study's claim? Navigation separately grew from 16 to 30 sites with +23% usage.
- **Qualcomm:** what before/after times support "120x writing-effort reduction" and "95% CMS creation time reduction"? Did writing effort include human review? These claims also appear in the resumes; repetition is not independent evidence of the measurement method.
- **Overlay:** one important product decision Wesley got wrong, what exposed it, and what changed afterward.

Other research should uncover specific observations and tradeoffs. Ask focused follow-ups as needed. Do not block all four studies on one unanswered question or publish unsupported numbers to make the story feel complete.

## Sources and edit scope

- Rewrite `village/studies/bny.html`, `qds.html`, `tmo.html`, and `overlay.html`.
- Read project content/attribution rules in `AGENTS.md`.
- Verify against `/Users/wk/Documents/Documents - fuo/Resume/Wesley Kay Resume.md` and `/Users/wk/Documents/Documents - fuo/Resume/Wesley Kay Resume - AI Forward.md`. Both exist; the main resume was read in this session for relevant claims. Avoid silently extending the work into editing all resume variants.
- Project instructions also require checking Obsidian meeting notes. Obsidian connector search/read tools were available. Those notes have not yet been searched for this rewrite.
- Preserve the scene and art direction. Wesley likes it. No framework, new infrastructure, or visual redesign is needed.
- No em-dashes. Observe BNY NDA restrictions, attribution corrections, and the limited placement of the personal coding-workflow positioning in AGENTS.md.

## Local site state and verification

Latest implementation commits:

- `13cc387`: centered composition, removed ground shadow, name sign and instructions beneath island, ski/hike loop and bridge bounds, saved `village/check.cjs`.
- `2e403f9`: mobile panels fill the viewport with fixed header/close controls and safe-area padding; removed sheet expansion gestures and handle. Mobile music/pause controls now have equal 17px top/right spacing.

Working tree was clean apart from the unrelated untracked files before this handoff file was added. All requested UI changes are committed.

Preview: `python3 -m http.server 8000 --bind 127.0.0.1` from the repo root. It was started during this session, but verify it is still running. Binding and localhost HTTP checks required sandbox escalation.

Checks: `node --check village/village.js`, `node village/check.cjs`, and `git diff --check`. The VM harness includes literal copy assertions (for example BNY's "240-year-old"); update brittle text assertions appropriately if the rewrite removes that wording, while preserving meaningful loading/interaction checks. Verify study image paths and lazy-loading attributes after edits.

Actual browser tools were unavailable because their required execution tool was not exposed. User screenshots guided UI changes; VM checks do not establish browser rendering. Use supported browser tooling if available next session, and do not claim visual verification without seeing the result.
