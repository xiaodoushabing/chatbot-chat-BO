# Variety round — fresh-eyes critique (opus-critic, screenshots only)

**Recommendation:** lock V1 Ledger as the base, as a composite with V3's two-column "Customers today → After release" layout. The marks are split by side: a grey strike-through on the left, a green highlight on the right. Reject V2's shadow and stripe and V3's bezel.

Shared findings and how they were handled:
- Dark Fail button contrast: **false positive**. The computed colours are #2a0a0e on #e8556a, about 5.3:1, which passes AA.
- "Intent 1 of 4" vs the 2/1/4 tally: fixed (shown as "7 changed: 2 passed · 1 failed · 4 to test").
- Phrasing ticks didn't match the transcript: fixed (3 of 6; "annual fee" counts as the tester's own question).
- Mono font on plain counts: fixed.
- User bubbles outweigh the signature card: open. Make the user bubbles a tint or an outline instead of solid ink.

Per candidate:
- V1 Ledger: the only candidate that marks the swapped digits and fits everything above the footer. The red diff is a fourth red area, so removed text should be grey. The interleaved redline is hard to read as one finished sentence, so split it into two columns.
- V2 Studio: the change isn't marked (S$192.60 → S$196.20 is easy to miss). The crimson stripe makes the new answer read as an error. Lift shadow plus stripe is a generic recipe. Content is clipped above the footer.
- V3 Device: the bezel is the dominant shape and the flagged turn is clipped. Today → after columns are the clearest structure of the three.
