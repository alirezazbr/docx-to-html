# Insurance contract generator

Convert a Word contract to PDF (DOCX → HTML → PDF), or use JSON + Handlebars for a simple template.

## Setup

```bash
pnpm install
```

### Persian font (optional, PDF only)

Email HTML uses **Tahoma / Arial** (widely supported in inboxes). For PDF you can still add B Nazanin at `assets/fonts/B-NAZANIN.TTF` if you add print-specific styling later; the default email HTML does not embed web fonts.

## DOCX workflow (recommended)

1. Put your Word file at `input/contract.docx` (or pass another path).
2. Build:

```bash
pnpm run build
```

Or explicitly:

```bash
pnpm run build:docx
```

Custom DOCX path:

```bash
CONTRACT_DOCX=input/my-contract.docx pnpm run build:docx
```

Or render then PDF in two steps:

```bash
pnpm run render:docx -- input/my-contract.docx
pnpm run pdf
```

Outputs:

| File | Use |
|------|-----|
| `output/contract.html` | **Send this to Tamin `createPdfFile`** (same pattern as `input/sampleWorkingHtml.html`) |
| `output/contract.pdf` | Local PDF via Puppeteer |

### Tamin backend PDF (`contract.html` only)

Use the **full file** as the HTML argument — same idea as `sampleWorkingHtml.html`:

```text
createPdfFile(Files.readString("output/contract.html"))
```

Do **not** wrap it again:

```text
<!-- WRONG — causes "Invalid nested tag head" -->
<html><head><meta/></head><body> + contract.html + </body></html>
```

`contract.html` already has `<!DOCTYPE>`, one `<head>`, one `<meta charset="UTF-8"/>`, and `<style>`.

Check before sending:

```bash
pnpm run build:docx
pnpm run validate:pdf
```

`contract.html` is refactored for **iText 5 XMLWorker** (table layout, safe CSS, `logo.png` by default, XHTML meta).

Optional env vars:

- `CONTRACT_LOGO_URL=logo.png` — image path/URL for `<img class="logo">` (default: `logo.png`)
- `CONTRACT_EMBED_IMAGES=1` — embed DOCX images as base64 (not recommended for iText)
- `CONTRACT_WRITE_FRAGMENT=1` — also write `contract-fragment.html`

## JSON + Handlebars workflow

Edit `data/contract.json` (keys like `letter-number`, `insured-name`) and `templates/contract.hbs`, then:

```bash
pnpm run build:json
```

## Placeholder template (for another generator)

Static HTML with `{letter-number}`-style tokens and the same simple CSS classes (`container`, `highlight`, `term-item`, …):

```bash
pnpm run render:placeholder
```

Source: `templates/contract.placeholder.html`

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm run render` | HTML from DOCX if `input/contract.docx` exists, else JSON |
| `pnpm run render:docx` | HTML from DOCX only |
| `pnpm run render:json` | HTML from JSON + template |
| `pnpm run render:placeholder` | HTML with `{placeholder}` tokens for external tools |
| `pnpm run pdf` | PDF from `output/contract.html` |
| `pnpm run build` | render + pdf |



# PDF Generator by HTML

Generate production-ready PDF documents from HTML templates using:

- Node.js
- Handlebars
- Puppeteer
- CSS Print Layouts
- RTL (Persian/Arabic) Support

Perfect for:

- Contracts
- Insurance Forms
- Invoices
- Certificates
- Reports
- Government Documents