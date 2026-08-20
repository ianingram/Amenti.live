He read it the way you read something you already know.

Not for information. For the shape of it. The tablet was not long — nothing that
old ever is — and he had read it before, and reading it again was less like
learning than like descending.

The first layer went quickly. That was the surface, the part any reader gets, the
part that is right there in front of the eye and gone the moment you look away.
Under it was the layer he had put down himself, the version he carried, worn
smooth from handling. Under that, older. A thing written before he was told it,
by somebody who had been told it by somebody else.

He kept going down. The layers got slower and they held longer. Whatever sat at
the bottom had been there for thousands of years and was not in any hurry to be
recalled, and it did not thin out as it got older. It got heavier.

At some point he stopped reading and simply stayed where he was, at depth.

---

What surfaced was not a sentence.

It was a shape — the tablet had one, and the shape was not decorative. Something
had been *specified* here. Not described, not celebrated. Specified: this holds,
that must not, and here is what happens if it does.

He looked up.

The console was still open. It had been open the whole time, which is a thing he
noticed and did not examine.

He sat down and began to type.

## ⟦SPELL⟧  A hundred and ninety gates

The Book of the Dead is not a book. It is a spellbook in the operational sense —
roughly a hundred and ninety spells, each one named, each one numbered, each one
invoked to pass a specific gate.

Spell 125 is the weighing of the heart. Spell 30B addresses the heart directly
and instructs it not to testify against its owner. Spell 154 is against decay.
Each has a name. Each has a number. Each is called at a particular moment to
produce a particular effect, and calling the wrong one at the wrong gate does
nothing at all.

That is a function signature.

Not *like* a function signature — the same object. A named, numbered, callable
unit invoked at a boundary to satisfy a condition. The Egyptians wrote an API
for the underworld and then buried a copy of the documentation with the user.

Once that is seen it cannot be unseen, and it changes what the rest of the text
is for.

> The negative confession is not a prayer.
> It is a list of assertions, and every one of them is falsifiable.

Spell 125 has the dead man stand before forty-two assessors and state, forty-two
times, what he has not done. *I have not stolen. I have not lied. I have not
diverted water from its channel.* Each is a claim about the record. Each could be
contradicted by the record. **The confession does not ask for mercy; it offers
itself for checking.**

A test suite is forty-two assertions that could fail. So is this.

## ⟦MECHANISM⟧  The specification came first

The claim this book makes, and the one it has to earn, is that the mythology was
not applied afterwards.

It was read as a requirements document. The software was built to satisfy it.

That is a large claim and it is exactly the kind that decorates itself
comfortably after the fact, so it is worth stating what makes it checkable
rather than merely pleasing: **there is a file.**

`spec/spells.json` holds twenty-one requirements extracted from the Book of the
Dead and from the working briefs. Each one names its source text, states a rule
in language a machine can act on, and declares how it may be proven. Every six
hours a probe walks the running system and measures it against them.

```
  the-seal-verifies        Spell 125 · the weighing
      A verdict may only be sealed after the count is frozen
      and the freeze has been read back.

  ammit-is-a-boundary      Spell 125 · Ammit at the scale
      The roster answers ONE question: in, or out.
      It may not rank, score, or condemn.

  hades-keeps-nothing      the Duat · what runs and forgets
      A cache may expire. A record must exist upstream.
      Nothing that matters may live only in the thing that forgets.
```

Four of the twenty-one are permanently unprovable and say so. Nothing can measure
whether a summons leaned; nothing can tell a hand-typed number from a read one
without reading every line. **They print UNPROVEN, with the reason, as loudly as
a pass** — because a probe that guessed at them would be inventing, which is the
exact fault the specification exists to catch.

## ⟦PRIMER⟧  What a specification is for

A specification is not documentation. Documentation describes what a thing does;
a specification states what it must do, in a form that makes it possible to be
wrong.

The difference is the whole of it. **A description cannot fail.** You can write
four hundred pages describing a system, and if the system changes underneath you,
the pages are not falsified — they are merely old. Nothing rings.

A specification is written so that reality can contradict it. That is not a
weakness in the document. It is the only property that makes it worth having.

Which is why the negative confession is the model and not the prayer beside it.
*Grant me passage* cannot be checked. *I have not diverted water from its
channel* can.

## ⟦PLATE⟧  The specification, audited by the ship

The order here matters more than the numbers, and it is the reverse of the order
anyone would expect.

Before the specification was allowed to judge the ship, four probes were sent at
the specification. **Three of its entries were wrong.**

| The rule as drafted | What the ship said |
|---|---|
| every KV key must carry a TTL | 22 of 24 writes are durable storage. The rule would have failed correct code. |
| a probe may not POST | 15 POSTs in the proxy are the generator. A rule wide enough to condemn the engine teaches its reader to ignore it. |
| the roster may not carry a rank | `rank` is build order. An ordering, not a station. |
| — missing entirely — | nothing declared what a key *is*. Three incidents traced to it. |

A specification written from briefs is a claim. Four greps against the running
worker are a reading. Uploading the draft unchecked would have built a
conformance register reporting failures that were its own.

The current reading, taken at the hour of writing:

```
  spec 2026.08-draft-3

  CONFIRMED     8
  CONTRADICTED  0
  UNPROVEN      4    nothing measures these — the honest reading
  UNREACHABLE   8    the worker source is in another repository
```

## ⟦ROADMAP⟧  What is not built

Eight spells are unreachable because they live in the Worker source, which is
mirrored in a private repository the probe cannot read from where it runs. That
is a plumbing problem, not a philosophical one, and it will close.

The four unproven ones will not close. They are the boundary of what an
instrument can know about intent, and the specification is more honest for
carrying them in the open than it would be for quietly dropping them.

And one contradiction is kept deliberately. **The feather and the vote** —
Ma'at's feather does not care how many are watching, and the pool settles by
vote. Both are true. Neither has been made to give way. It is printed on every
run so that it cannot be forgotten, and so that it cannot be quietly resolved by
whoever next finds it inconvenient.
