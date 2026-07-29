# img — serving copies, and their provenance

## What is here

    *-card.jpg          hero / arena card faces, 640x1120, ~150KB each
    *-reading.jpg       reading room images
    MANIFEST.json       provenance for every image
    prompts/            the exact prompt text each image came from
    ../provenance.py    writes and reads the records

## Every image carries its own record twice

**In `MANIFEST.json`** — greppable, diffable, reviewable in a pull request.
Survives re-encoding. Lost if a file is moved out of this folder.

**In the JPEG's own EXIF** — travels inside the file. Survives being emailed,
dropped on a desktop, or found on a drive in two years. Lost if an upload
pipeline strips metadata.

Neither is enough alone. Together an image is hard to orphan.

    python3 -c "import provenance; print(provenance.read('img/musashi-card.jpg'))"

## THE SEED FIELD IS EMPTY AND ONLY YOU CAN FILL IT

`prompt + seed + model + settings` is what makes an image **regenerable**.
Everything but the seed is recorded. The seed is not in the file and was not
captured at generation, so right now these records are a *history*, not a
*recipe* — the same prompt will give a similar image, never the same one.

From the next batch on, copy the seed out of OpenArt when you accept an image
and put it in `MANIFEST.json`. It is four seconds that cannot be recovered later.

## Adding an image

1. Drop the file in `img/`, named `figure-surface.jpg`
2. Add a block to `MANIFEST.json` — figure, surface, grammar, prompt_file,
   source filename, **seed**, model, aspect, resolution, polish, date, note
3. Run `provenance.stamp()` on it to write the EXIF
4. Keep the full-resolution master OUTSIDE the repo. These are serving copies:
   1120px tall, quality 86. Regenerating a 2K asset from one is lossy and
   cannot be undone.

## Why the images are stored at full colour

The deck's grade is applied in CSS with `--art-sat`, per card, so all five
settle at ~0.105 at rest. Storing graded files would bake that in, lose the
saturation pulse on card arrival, and make a deck-wide retune a refiling job
instead of one number.
