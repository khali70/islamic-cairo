# Gemini prompt: remove the banner from azhar-night.jpg

Upload `images/src/azhar-night.orig.jpg` (the untouched photo, 1920x1440) to Gemini and paste this:

```text
Edit this night photo of Al-Azhar Mosque in Cairo. Remove only the long white cloth banner with
handwritten Arabic text that hangs across the stone wall in the lower-left middle of the picture,
just below the golden ribbed dome and the row of stepped crenellations.

Rebuild the area behind it so it looks like the banner was never there:
- continue the warm floodlit sandstone ashlar wall, with the same horizontal block courses and joints
- complete the row of stepped, leaf-shaped crenellations (merlons) along the roofline where the
  banner covered their lower part, matching the merlons on both sides in size, spacing and shadow
- continue the plain stone band under the crenellations and the carved niche panel below it
- remove the ropes or strings that hold the banner

Keep everything else exactly the same: framing, perspective, resolution and aspect ratio (4:3),
the golden lighting and colour cast, the dome, the three minarets, the night sky, the arched windows,
the dark sign at the bottom right and the tree at the left. No new objects, no text, no people.
Photorealistic, same grain and slight softness as the original photo, not cleaner or sharper.
```

If the first result smooths the wall too much, follow up with:

```text
Good. Now add back the natural stone texture and the slight JPEG grain in the area where the banner
was, so it matches the wall around it. Change nothing else.
```

Then save the result over `images/src/azhar-night.jpg` (it must stay 1920x1440) and rebuild the web copies:

```bash
~/.claude/skills/khalifa-design/scripts/optimize-images.sh img images/src/azhar-night.jpg
```

The photo is also the last clip of the hero video (`media/hero-1600.mp4`, `media/hero-1024.mp4`), so
re-render those too.

`images/src/azhar-night.jpg` currently holds a local banner-free version (patch fill from the surrounding
stone). It reads well at page size; Gemini can do better on the crenellation row if you zoom in.
