# Workshop: Gemini AI in Academic Writing

A static training website with a front page and seven tabs (six modules plus a conclusion).

- **Live site:** https://firdaussahran-um.github.io/gemini-workshop/ (GitHub Pages, published automatically)
- **Staging site:** http://localhost:8080 (your local Docker copy, for checking changes before they go live)

## Structure

```
site/                 # the website (edit content here) - this folder is what gets published
  index.html          # front page + all 7 tabs
  css/styles.css
  js/app.js           # tab routing (#home, #module-1 … #module-7), copy buttons, demos
  js/slides.js        # turns the page into 16:9 slides when printing
  img/                # logo, speaker photo, diagram example
  favicon.svg
.github/workflows/pages.yml   # publishes site/ to GitHub Pages on every push to main
nginx.conf, Dockerfile, docker-compose.yml   # local staging server
```

## Everyday workflow: staging, then live

1. **Edit** files in `site/`.
2. **Check on staging:** run `docker compose up -d --build` and open http://localhost:8080.
3. **Publish:** when you're happy, commit and push:
   ```bash
   git add -A
   git commit -m "Describe what you changed"
   git push
   ```
   GitHub publishes the update in about 1–2 minutes. Progress is shown under the repository's
   **Actions** tab, and the live site updates when the run turns green.

Nothing reaches the live site until you push, so you can experiment freely on staging.

## One-time setup on GitHub

1. Sign in at https://github.com as **firdaussahran-um** and create a new repository:
   - name: **gemini-workshop**
   - visibility: **Public** (free GitHub Pages needs a public repository)
   - leave "Add a README", ".gitignore" and "license" **unticked** (this project already has them)
2. In this folder, push for the first time:
   ```bash
   git push -u origin main
   ```
   When asked for a password, use a **personal access token**, not your GitHub password
   (GitHub → Settings → Developer settings → Personal access tokens → Fine-grained token with
   *Contents: Read and write* and *Workflows: Read and write* for this repository).
   Alternatively, use GitHub Desktop, which signs you in through the browser.
3. On GitHub, open the repository's **Settings → Pages**, and under **Build and deployment**
   set **Source** to **GitHub Actions**.
4. Open the **Actions** tab. If the first run failed because Pages wasn't switched on yet,
   click it and choose **Re-run all jobs**. When it's green, the site is live at
   https://firdaussahran-um.github.io/gemini-workshop/.

### Other hosting options
The site is plain HTML/CSS/JS, so it can also be hosted elsewhere: upload the **contents of
`site/`** to any web host (for example `public_html/` on cPanel), or run the Docker setup on
a server with `docker compose up -d --build` behind an HTTPS proxy.

## Editing content
Each module is a `<section data-page="module-N">` block in `site/index.html`. To rename
a tab, edit both the tab label in the `<nav>` and the module's `<h1>`.

## Speaker photo
The front page shows the speaker photo from `site/img/speaker.png` (transparent background,
so the card's gradient shows behind it) with `site/img/speaker.webp` for modern browsers.
To change it, replace both files with a square image (at least 320 × 320 px) and rebuild
(`docker compose up -d --build`). If the photo is missing, the initials are shown instead.
To change the speaker's name or title, edit the `speaker-card` block near the top of `site/index.html`.

## Printing (slides)
"Print this module", "Print full workbook" and Ctrl/Cmd+P all produce 16:9 landscape slides
(13.33 × 7.5 in), built by `site/js/slides.js` just before printing:
- a dark title slide per module (and for the workshop, with the speaker card), then one slide per section;
- long sections continue on "(cont.)" slides, and blocks too tall for one slide are scaled to fit;
- exercises and takeaways get their own slides; slides always print in light colours.

In the print dialog choose **Save as PDF**. Chrome and Edge pick up the slide size automatically.
In Safari or Firefox, set margins to **None**, turn off **headers and footers**, and turn on
**background graphics** if the slides look plain.
