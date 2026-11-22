# anirbandas7.github.io

Personal academic website of Anirban Das (BITS Pilani, K K Birla Goa Campus), built with Jekyll on GitHub Pages.

## Where to edit things

| What | File |
| --- | --- |
| Name, contact, social links | `_config.yml` (`author:` block) |
| Home page text, research interests, student openings | `_pages/about.md` |
| News on the home page | `_data/news.yml` |
| Publications (Publications page, home "Selected", CV) | `_data/publications.yml` |
| Top menu | `_data/navigation.yml` |
| Teaching history | `_teaching/*.md` |
| Talks and demos | `_talks/*.md` |
| Funded projects | `_posts/*.md` |
| Testbeds and other activities | `_portfolio/*.md`, `_pages/portfolio.html` |
| Look and feel | `assets/css/site.css` (plain CSS, no build step) |
| Page templates | `_layouts/`, `_includes/pub.html`, `_includes/contact-links.html` |

### Adding a publication

Copy an entry in `_data/publications.yml`, put it in the right place (newest first) and fill in
`type` (journal, conference, demo, preprint or patent), `title`, `authors`, `venue`, `venue_short`,
`year` and, if available, `doi`, `url`, `arxiv`, `pdf`. Add `selected: true` to feature it on the home page.

## Preview locally

```
bundle install
bundle exec jekyll serve
```

Fonts (Lora, Source Sans 3) are self-hosted under the SIL Open Font License; see `assets/fonts/FONTS.md`.
