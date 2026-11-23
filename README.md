# wesley-portfolio

Personal portfolio site for Wesley Kay. Single self-contained HTML file. No build step. Designed to deploy on GitHub Pages.

## Preview locally

```bash
open index.html
```

Or for a quick local server:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## Deploy to GitHub Pages

```bash
# In this folder
git init
git add .
git commit -m "Initial portfolio"
git branch -M main

# Create a new public repo on GitHub (e.g. named `wesley-portfolio` or `wloka.github.io`)
# Then:
git remote add origin git@github.com:<your-username>/<repo-name>.git
git push -u origin main
```

Then in the GitHub repo settings:

1. **Settings → Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main` / root
4. Save

The URL will be `https://<your-username>.github.io/<repo-name>/` (or `https://<your-username>.github.io/` if the repo is named `<your-username>.github.io`).

For a custom domain (e.g. `wesleykay.com`):

1. Add the domain in Pages settings
2. Create a `CNAME` file in the repo root containing just the domain
3. Configure DNS at the registrar (A records for apex, CNAME for `www`)

## What still needs to land

- [ ] Resume link in the About section currently points to `#` — replace with a hosted PDF (e.g. `resume.pdf` in this repo) and update both the About section link and the contact card.
- [ ] Headshot photo replaces the placeholder in the About section.
- [ ] Qualcomm, T-Mobile, Overlay screenshots (Figma exports referenced in the prior draft).
- [ ] Update the canonical portfolio URL on the resume markdown / PDF once the GitHub Pages URL is live.

## Voice and content rules

- No em-dashes anywhere. The middle separator everywhere is `·` (interpunct).
- Direct, blunt, lowercase-okay. Not corporate, not LinkedIn-speak.
- No "passion / excited / thrilled" filler.
- Claude → code workflow. No Figma. State it confidently.
