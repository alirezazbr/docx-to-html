# Insurance contract generator

Convert a Word contract to PDF (DOCX → HTML → PDF), or use JSON + Handlebars for a simple template.

## Setup

```bash
pnpm install
```

### Persian font (B Nazanin)

Copy your font file to:

```
assets/fonts/B-NAZANIN.TTF
```

The file name must match exactly. All generated HTML and PDF output uses this font.

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

Outputs: `output/contract.html`, `output/contract.pdf`

`contract.html` is **standalone** (CSS and B Nazanin font are embedded). You can copy it anywhere and open or print it without the project folder.

## JSON + Handlebars workflow (legacy)

Edit `data/contract.json` and `templates/contract.hbs`, then:

```bash
pnpm run build:json
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm run render` | HTML from DOCX if `input/contract.docx` exists, else JSON |
| `pnpm run render:docx` | HTML from DOCX only |
| `pnpm run render:json` | HTML from JSON + template |
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