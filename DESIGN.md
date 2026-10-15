# Islamic Cairo Walk: design notes

One-day walking route through historic (Islamic) Cairo, laid out like the "Japan Tours" reference:
glass pill nav with a Book button, huge faded place name in the hero over a row of small photo
cards, a vertical "about" timeline with photo collages on alternating sides, four image cards,
then a glass request form over a full-bleed photo, social icons and a footer nav.

Era styling (Fatimid and Mamluk): pointed-arch photo frames and doorway, stepped crenellation
bands between scenes (the Al-Azhar roofline), 8-point khatam stars for dots and icons, a faint
star lattice behind the timeline, Kufic Arabic names (Reem Kufi).

Language: English UI, Arabic place names as display accents.
Stack: static HTML + GSAP 3.15 (ScrollTrigger, SplitText) + Lenis 1.3.26, from the khalifa-design starter.

## Route (walking order)

1. Al-Ghouriya (الغورية): Sultan al-Ghuri complex, Tanoura at the Ghuri complex
2. Al-Azhar Mosque (الجامع الأزهر)
3. Al-Hussein (الحسين): mosque and square, El Fishawy cafe
4. Souq al-Sagha (سوق الصاغة): goldsmiths' lane next to Khan el-Khalili
5. Al-Muizz Street (شارع المعز): Bab Zuweila, Qalawun, Barquq, Katkhuda sabil, Al-Aqmar, Bayt al-Suhaymi, Al-Hakim, Bab al-Futuh

## Scene table

| # | Beat | Dominant visual | Source | Layers | Motion pattern | Words |
|---|------|-----------------|--------|--------|----------------|-------|
| 1 | Hero: "A thousand years, on foot" | 22s slow-pan video loop of 6 route photos (poster: Al-Azhar at twilight) + 5 photo cards | Made from Pexels/Commons photos | video + giant word | Scale-out into an inset frame (3), giant CAIRO letters rise then drift up, cards stagger | 18 |
| 2 | About the walk: 5 stops | Pointed-arch photo + inset photo per stop, alternating sides | Pexels / Commons | 2 per stop | Route line draws on scrub, star dots light, arches open upward (4 variant), inset parallax, word reveal (8) | 23-28 per stop |
| - | Transition | Sandstone crenellation band | SVG | - | Merlons rise from the centre out on scrub (7, crenellation instead of a wave) | 0 |
| 3 | Al-Muizz: the open-air museum | 8 monuments in arch frames, walking north, on sandstone ground | Pexels / Commons | flat | Pinned horizontal gallery (6), photos pan inside arches (containerAnimation), progress line | 39 |
| - | Transition | Night crenellation band | SVG | - | Same rising merlons | 0 |
| 4 | Good to know | 4 expanding arch-topped cards (Tanoura, Fishawy, night walk, mosque manners) | Pexels / Commons | flat | Expanding cards (5), staggered rise | 39 |
| 5 | Want to walk with us? | Al-Azhar at night behind a glass form | Commons | flat | Arch doorway mask grows until the photo fills the screen, form rises | 15 |

Signature moment: the hero video settling into a rounded frame while the giant CAIRO word drifts away.
Second beat: the closing arch doorway. Pins: 1 (gallery, desktop only). No pins under 768px.
Measured visual:text ratio (desktop 1440x900): 5.3:1, every scene at 3.2:1 or more.

## Palette (sampled from the photos)

- ink `#0d0a07` (night over sandstone), ground `#16110c`
- sand `#e9dcc4` (text on dark, gallery ground), stone `#a8977c` (muted)
- accent `#e0a64b` (lamp gold); `#8a5714` deep gold for Arabic on sand (4.5:1)

## Type

- Display: Archivo (expanded width 118-125%, 700/800), uppercase titles
- Text: Manrope 400-600
- Arabic names: Reem Kufi 600 (Kufic, echoes the monuments' inscriptions)

## Fallbacks

- Hero video: the still `<img>` is the video's own first frame (LCP element), with a 224-byte blurred copy
  inlined in CSS behind it. The video gets its `src` only after `load` + idle, only when the page's own
  downloads measured at 1 Mbps or more and Save-Data is off; no `canplaythrough` within 6s drops it. It then
  fades in over the still with no visible jump, and the loop ends on frame 0, so the restart is seamless.
- The giant CAIRO word leaves (letters rise out and fade) at the video's first crossfade (3.5s); without
  video it stays over the still.
- Phones (<768px): still image instead of video, no pins, stacked timeline with the line on the left, gallery swipes natively with snap.
- Reduced motion: no Lenis, no ScrollTrigger, no video; every image and line visible and static.
- No JS or CDN failure: full static page (the head script drops hidden start states after 4s if GSAP never loads).
- Slow links: the hero headline and cards rise in CSS from the first paint (never hidden waiting on GSAP),
  web fonts load without blocking the first paint, and the Lenis base CSS is inlined. Scenes below the hero
  are built after `load`, one per idle slot, so setup never blocks input.
- The hero is 92svh, not 100: the next scene peeks in as a scroll cue, and Chrome counts the still as the
  LCP image (it skips images that cover the whole viewport as backgrounds).

## Performance (Lighthouse 12, served by serve-static.mjs, 2026-10-15)

| Run | Performance | LCP | TBT | CLS | Video bytes | LCP element |
|-----|-------------|-----|-----|-----|-------------|-------------|
| mobile (median of 3) | 1.00 | 1.6s | 43ms | 0.002 | - | hero still (960w) |
| desktop (median of 3) | 1.00 | 0.5s | 0ms | 0.019 | - | hero still (1600w) |
| slow 3G | - | 3.8s | - | 0.002 | 0 | hero still (960w) |

Two rounds. Round 1 failed mobile (0.66, LCP 4.8s on the headline) and slow 3G (headline as LCP):
full-viewport hero image skipped by Chrome, headline hidden until GSAP, two render-blocking CDN
stylesheets, one 213ms setup task. Round 2 fixed all four (see Fallbacks).

## Open items

- No verified free photo of the Souq al-Sagha gold lane itself; stop 4 uses Khan el-Khalili lanterns (captioned as next door).
- Request form has no backend; it validates and confirms locally.
- Social links are placeholders (`#top`).
- Al-Azhar night photo (closing doorway, last hero clip): banner removed locally. For a cleaner fill,
  run the Gemini prompt in `images/gemini-prompt-azhar-night.md` on `images/src/azhar-night.orig.jpg`.
