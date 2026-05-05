# IntuSketch — marketing site

Static site for [intusketch.art](https://intusketch.art): landing, localized copy, privacy, terms, support.

**Publish:** GitHub Pages from this repository’s **root** on branch `main` (include **`CNAME`** for the custom domain).

**Locales:** edit `lang/*.json`, then run `python3 lang/emit_js.py` to refresh `lang/*.js`.

**Language selection:** the UI follows the browser/OS language list (`navigator.languages`) when the visitor has not chosen a language in the header menu. If none of those match a supported locale (`en`, `ru`, `de`, `es`, `zh`, `ko`), the site uses **English**. The `?lang=` query parameter always overrides; a choice from the dropdown is stored and kept until site data is cleared.
