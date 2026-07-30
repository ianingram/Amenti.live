# ADDING A FIGURE

    1. I write the prompt.
    2. You generate it in OpenArt — 9:16, 2K, polish on. Copy the SEED.
    3. You send me the file. I audit it and say whether it holds.
    4. You run one command.
    5. git add, commit, push.

That is the whole pipeline. Step 4 replaced everything I used to do by hand.

## Step 4

    python3 ingest.py ~/Downloads/openart-sample-xxxx.png marcus-aurelius card

Third argument is `card` or `reading`. Second is the **library key** — it must
match `library/<key>.json` exactly, because art resolves by convention:

    img/{key}-card.jpg      img/{key}-reading.jpg

The script crops to the slot, resizes to 1120 px, measures saturation, computes
the grade factor, names the file, stamps the provenance into the JPEG and the
manifest, and rewrites `img/grades.css`.

**`Page1.html` is never edited to add a figure.** Not the paths — those resolve
by key. Not the grades — those live in the generated stylesheet. If the file is
there it appears; if it is not, nothing breaks.

## What still needs a person

**Me:** the prompt, and the judgement on whether a plate holds. The audit
measures aspect, key strength, value range, colour discipline, tile legibility
and focus falloff — but it cannot tell you whether a face is right, whether the
period is right, or whether it is any good.

**You:** the seed. It is the one field the script cannot fill and the one thing
that makes an image regenerable rather than merely recorded. Four seconds at
generation, unrecoverable afterwards.

## Why send it to me rather than commit it raw

A raw generation is 9:16 not 0.571, four times more pixels than any display
uses, three times the bytes, has no grade factor, no provenance, and the wrong
filename. The script fixes all of that. The audit is the part worth a round
trip — and if a plate fails, better to know before it is in the history.
