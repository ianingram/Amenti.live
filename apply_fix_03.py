#!/usr/bin/env python3
"""
AMENTI — FIX 03  ·  robust terminal lookup + a diagnostic
==========================================================
Run via the Apply-art-session workflow with `script: apply_fix_03.py`.
Idempotent. Touches ONE file: amenti-art-photo.js.

THE TERMINAL IS STILL BLACK AND EVERY STATIC CHECK PASSES. The script is
loaded, the resolver is the fixed one, the moon-key CSS is in Page1.html,
grades.css carries the pool geometry, and nothing opaque sits over the plate.
So the fault is in something a file cannot show: whether the record actually
resolves at run time.

THE LIKELY CAUSE. AMENTI_CHARS begins as a curated list where id equals the
array index, and is then REPLACED by mergeCuratedOver(csvFigs) — roughly a
thousand rows. After that merge an id is not reliably an index, so
`AMENTI_CHARS[+dataId]` can return the wrong record, or none, and the whole
chain fails without a sound.

THE FIX. Three routes to a record, cheapest first, each verified to carry a
.key: by array index (what tune() assumes), then by matching the id property,
then by matching the displayed name. Any one of them is enough.

AND A DIAGNOSTIC, because guessing twice is enough. In the browser console:

    AmentiArtPhoto.debug()

prints a table: whether .term-main was found, whether an active row was found,
its data-id, how many characters are loaded, whether a record resolved, the key,
whether the image loaded or 404'd, and the computed opacity and background-image
of the ::before. Every line is a step that can fail silently — which is exactly
why it failed silently.
"""
import os, sys, json, base64, zlib

BLOB = "eNq1Wg1z2zYS/SuI51JKtcTY7rXXyHVvFFtJfHEsj+Ve78Z2OxAJSYwpQgUpK27i/35vFwBFSrKTtD3NWB8ksFgsdt++XfrDlpyqrEja0hTt2UQXOnyXb3XE1rOvxcFf97rKhBAbVhJX872d3b+Ls9f9i/6r8+7Z6+NDcdg9PxIvu4e9AU9r/3Uvltc/7Yl/9V+E4mxeiGQ6fvbhRt3dtyNp4vDdbCySrNCimCgRmqiN+0KPhMzuBA0Qi4nOlRgl47lRLG0ic6Ez1cKQWIxVITSkYgYJWMg7MdKGv2NMji+yELEWmS7Cq4zn//y6d94TF6+PB2JwfDEQRqWySG6VgBIVg30DY/F4mJF+ipEqoglEDv79CnOyWJkkG+diZPSU15tiG2KhzY0yrFqSvVNRQSqoKW/RSXObbIkwi9rFZD4d8vBwelPYny0xlbRUjC2IWBayHU2kacNmobiYJFgySZUTFmvepBI5VBfv9JC3f94dXPTOSW8xUSmpwmOMmulQdK1dYxVpIwusMlHGi4PwqcQOYrsuBHxzcLUVw5RXWyLXzhKpkrdYNimETHHLuxS72NjI2UQskswbb0HihazeVe+TvMhb3lhk0EjfKpM7LfPyrE774m33DDpjJ7iuU1p3CM/Q2S2dFAxU2j9NhkaaOwE7ddzatKM1d3P3LjAF1yFqqtwp1mwN9SZJNPEuYXReKEMBBOuny2N30pxyJsgFCZBRQdsxeuGNU54RrZnPZFQq/OxrSMVG5rnKsVMnMMfxwCsmcI32VMJ98IdjSWE5OiUSV0zggM7DTTIq8qWH/1e86B6+eXXe/+n0SHTxd9q/ED/AFj/WnZBE7X63M3svCpmm7IdGz8eT9E7sPv8exxirfV5rhhiBmSSO8nln9zsx06YwMqGDYnlDGd2MMRXa5snvqmMPFAKKiZ2v84SPa5jIHPuYzxbkhDdKzexmJkqSnzpxI0OmInUio92IHMrk/lSg94I2Lh1IyKwg42V2k/CsOdw+Uyr2jo1A1ItM6CEFZXsE3zXzlHaENexoQMykqMJQe2wSxCD2kQJWZGqg4p2XZyOKgmU+83a/OH57fPqq4l/WaUjZ4TxJC/JcjWlG5JFJZlBJjuh+qrF3UoQtJcc0cV6wpzthwLxJiwMQZsjGKQ3LMb0QR/23hzor4KMnkKKWcZ0T5pGHONBYMKb4qCSUmM4LyWci2dHyCTw3GztgxQzYezrTJNo7sbM27i3RQxZO5BSbBWJFyvrEX5jLxNfPrrLGaJ5FrG6jKT7QEgEiRuSFSaIi2LdHcCsNPH/QEweiAQyK9SLsvu2dXhz/2j2/EF99JdYuhoxLL+CUTfHxowgIL0ialXWTkdMciA/3+9gSMjRFb/tHUZi5Eh/FSKa54nNREk5JuEzGmRk9ZPRGkJPqVhahKMwidkrpJ4BpUZWeSpgQHoFUIlOLKXPacovPK1bD+RibJ5EkojRIps20ceOsQlhUzE0mBgUlqMYNbytohoU+0QtlDrHVBn6ZZIoPpIQUWNR4dnl1lf96vf0MeSloB03W8X5lHX/oDZW2yBLlirSZCR3/gVBp+NtcmbuBShFo2jSC9XzXqiQ7txQiaiQaT0hI021gfyk7NxFE88Fu8xFsQ0mP54EbSHPDvLhLVbhEo+MphRO5I9zFpI2rrQCTSR5EXG01H508AJIJN5nx7NHRZx7iMPrbnadi9/un9fGq6BYw+xCh3Qg41wByAmvJfVG+4AdIk8C6MEKIT7S+IfyDW1lXEmTiDbIoV0NYQG4WLOVBmk3a+U0y45z9STGWK1Zk2fH0Y3t7o2MU5u6NultzCzpSjqBLXL0mRLARs3LCG4ZRfEHMusft+6mkg3cPjjeYPVMLwQfe8DrznVBnjLAYUcMQUV2Ul4TVNqx4vyJMGYNofFQYb3N15md4sTMsDo3IszjvM497Jk57Pw/w8bZ7/qZ3cXYCpu4hmebn9A7mU+MvFRbvjrzUl3LHIc1rlEcV62hORKcevN00bQSXNbHXHaSVxmXdV66bQdNTrhBQ1QMaVvBapeU6/shIwQMLXPDD8bof+vWCpj/L0lXIw1Y8rhxy39xkx8P+Ue8/4qh30T0+EX+ikMHuovg97Ztg/ts6cXKsLJVmDAbr83Sc5DOiD1TSVKsYQRWO5caOS8BJ4nlUhOKYpRtVcgZbbRwpcMAUR6aARHeiSKaqQkBzPjIyt83iltmQXyT4Dh5NFocSnghVaCndSRNi1trzL5cfD193zweXILO4ex2KgSb8YN2Y7cZL8m3HWHoK1utoWrVIqbhoErcoQlKir4SfVHnl6Xw8tny2NBoWyMADPb2ynCrSsXpPdZ81N+IDpKt7Yhlqi0gPX+e4IlNSuchlhYaqlEapdiyPAPzFnSPoNnNsY8kk7gk5zLWhTG7PzbJZmaC8Y8AnYwAqcIZOHKh45jnSiBg+kdcZ5lNlWVJmz0HES0mFhDeAVxo+7sRleskFeHeucApX45lNQuFQS8hUfBw8ENjIyuTIGBLak6ulYZq5xpXYFypxzEsoQrQN4y63SfSGsE7ioHldRisvBhlYDB8hR7ZjLwwN/qKbUIH8bPqpvZHnlLvyQqfin1ZyNg0L9b5w1LnKg36R7d932s/b154KLdFn+VqOb5eUaXntl/bH9t/4ctAUHbxvTJozquoO6egaXG7mc0NOUztDQppP7BND6hwKFz6XQjEXssvS7yqb+oK8upIJvb2gxwN07AEuBnuJ7aW1A5CgRKZtIkMJdg+wT0FhFFU9xK/+sfO0ZcZD2djb3WuhiG3tfdPaCXf3mi2EWYYS21DlglElydusE7O8VYa3eegqxdvbe7oy4VGO94mRVerlnaGcg1TGZTL1A2xioLbJElO4hIV21DMq9Mw3xCpdF8/7nD/cjrEL0mTFqXCD6CO5Er42aaCzg09l2HxGxNBH5efQo2rEe48johd4hEOkrAZEQHBY+vYmLoX3B0ILBIcF/Z+iydKXJe5WZ9A9lFxk2vFmd2jy1ito56bTFKOm8MOHXaOMwFVjLQ25kUn2DvvnR+Kk33/z05n4EwSoivIovqEYUmVOWW9u+wFMARyxiXmjSPzwGiQJ9b5VYUo+qZ/3mNAeEdOZKpCnQyupj3BsRPnty2ScNz1f8d0pCQl6ntuG1YJaP9xJoWaYb0eQKMriCS9IvMCoNJFDmp1ZdUAQ6MPTDqeoay0V8wyAV6EwXOhbAoTTYVpg8qIlhtTVLpC8M1pkqFz3GesseN9hyV6M8q2dFmiakjMiik4KbcUyO+oT4EsySix1sMxJipA7wCu5HynyJbw3icllWsyXLpDYan7f3ZykyUsvr1siqTg2QRuQM1fHAFwvdHen5uBJfipPG1mT0nb3Mrv2n7X8TRf260kTvjh0fiBKNCJG1ki4LSIS8YPohqnKxsUEv7a3m+Lxl5MY848lvpGWrvvRvUyuwyS2Eeeu2W059ZNVtZPryl4r5hRf9LKa0fSaZmRiopeiVKZcwXdkCv0TOKNr05Tw/7iZ6gWS3xRtsGoG1sY3gzYsxjYi7WqUZ90w93VONU/TTYhTEvM/9+zIkX7gNQAloricyUylq9UWgu8WMFQvpThguVPusNFJtGR6TFXJUE0S13hdTHTK/UQlpyGvWrJv5NjoJufaaVlnUTXgq0IaySWro9NekVSNCtcF3redeuLWVJKA3NMRSQ/0pGtZRvjnXeu1FqlQr44YOPwDIzlGWsiLSl3oGvcLUAedoiKqtJZ8ccgWU6ZtzaJnMkqKdaChnHrhDFJPq/R44rG8ysahQfXMSlc2pFYy0CelVUxdCqXJQ/xVJyMB91JFX1/cHceNAPdPq3WBL2IwxwGpq30eKV9amwoCelXnPqi1q0soDklZfHy4b9ZqkRWaYVWrlEi+hCkrprLCELajfACwgg4d8eQJl+JJ3BFfvi1SNu+sttEriaPpIKhFivFiKmKi22G971c4EUEoHfkDDId50Vp3jybzpC9kUg9WPD6k/2Cps9b1I4OHqX3yYvmo3eQnmr2f11Jk4SOZpCvCH7Xgl/JkXqnSEdyvsuf9lbDf9yLITm/d86P+MFeGyBqNbYba/myUQei/uEh0jvYBHpak8QnoYoebr1T0DIG+yv70rTznfzKOe/TIl8Yr2KsRLJ9Yway8NI8nlymX5kd2g4JwjasNOinkQ1/Ul+PWpa8+V6utodJcOePtl1nvfI4syQ+Lu6Y443+38E9sXDaIdJZTjqF2l6JuDhCMWCKT5SVkb3gAhLSkZ2C5PSaI0HFGjHOG3I58kBD95mucYZAKBTmNbwzCfTJaJrFNFcjVQHtpnytVnqbekUjnbX6SzwIeBGrbI6DxxUgOqKB38FoUyjjRuic7rkCPEOBCLdss79gP5w9sq87mqvGPZRk7j/475KDafg7sw1dhozZYIp5zw8rIpVAQMNT/QTnyCaev6lgfg1SAV5TBWJ4P8H0UyNaXrdIJu3rHIgKBemU0UwKH4lUAd6OTuDq4BuMWv4PKYAb96nhDj0PikoQEK8IJ8iujqV+/KTO60VSoVhXnZtDaMfjRDlU/+sesazOtr26Y6Zx408xIT2dzKlMdzVmeqD8lHNChGzSgtgfnH9TXnc5QgYUjd4du7ka5y2ZR8KVyH+IVq73HlXZamKdJpBo7LfF8p5RxX8aAA52wQOWrGoiGMstSaFQpPc25bzKkbd3/D5ZCGUs="
DRY = "--dry-run" in sys.argv
def say(*a): print(*a)

if not os.path.exists("Page1.html"):
    sys.exit("Page1.html not found — run from the repo root.")
P = json.loads(zlib.decompress(base64.b64decode(BLOB)).decode())

say("\n[1] GUARD")
page = open("Page1.html").read()
INV = [".page-section{display:none;}", "THE MOON KEY", '<section class="term-main">',
       "populateMiniPortraits"]
lost = [i for i in INV if i not in page]
if lost:
    say("  *** ABORTING — Page1.html is missing something load-bearing ***")
    for i in lost: say(f"      lost: {i}")
    sys.exit(1)
say(f"  invariants intact ({len(INV)} checked); Page1.html is not modified by this fix")

say("\n[2] WRITE")
for path, body in P.items():
    if os.path.exists(path) and open(path).read() == body:
        say(f"  {path:24s} unchanged")
    else:
        say(("  would write " if DRY else "  write ") + f"{path}  ({len(body)//1024 or 1} KB)")
        if not DRY: open(path, "w").write(body)

say("\n[3] VERIFY")
js = P["amenti-art-photo.js"]
ok = True
for lab, t in (
  ("three-route record lookup", "function recFor" in js),
  ("falls back to id match",    "String(A[i].id) === String(idAttr)" in js),
  ("falls back to name match",  "toUpperCase() === want" in js),
  ("records last resolution",   "LAST = {" in js),
  ("debug() exposed",           "debug: function" in js),
  ("reports computed style",    "getComputedStyle(main, '::before')" in js),
):
    say(f"  [{'ok ' if t else 'FAIL'}] {lab}"); ok &= t

say("\n" + ("DONE — commit, hard-refresh, open the terminal and select a legend.\n"
            "If it is still black, open the console and run:\n\n"
            "    AmentiArtPhoto.debug()\n\n"
            "and send me the table. It will name the exact step that stops."
            if ok and not DRY else "DRY RUN — nothing written." if DRY else
            "COMPLETED WITH FAILURES — read the report above."))
