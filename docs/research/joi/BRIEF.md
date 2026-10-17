# joi.com home – layout brief
Route: https://joi.com/ -> src/app/page.tsx (src/components/sites/joi/joi-home.tsx, data.ts)
Assets: public/sites/joi/logo.svg (extracted header SVG)

## Measured tokens
- Font Outfit; bg #0f0f0f; surface #1a1a1a; accent #ff2792; muted #858585 / #aeaeae; divider #303030
- Header 60px; nav pills 38px, radius 40, active bg white/12; Sign up #f1f1f1
- Hero 1170x190, radius 8; name 32/700/34; Say Hi 13/600, pad 10x22; progress track 90x6
- Filters: 32px controls, tags 13/500
- Grid: 5 x 229px, gap 6px / row 24px; card 418 = image 318 + info 72 + badge 28; radius 12
- Mobile: 2 cols (179-184px), card 349-356, hero full-bleed
- FAQ column 1040px, details radius 12, summary pad 20, gap 12; blocks gap 40
- Age gate 448px, radius 24, title 36/600

## Content policy for this clone
Not copied: character photos, character bios, real-person ("Celebrity") names, explicit SEO/FAQ copy.
Placeholders are data-driven: set `image` on CARDS / HERO_SLIDES in data.ts and replace text to use your own content.

## Not rebuilt
Cookie banner (third-party OneTrust), other routes (/characters, /chats, ...), live data, auth.
