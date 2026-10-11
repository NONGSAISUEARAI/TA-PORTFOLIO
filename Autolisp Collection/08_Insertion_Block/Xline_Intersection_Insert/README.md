# Xline Intersection Insert

Category: `08_Insertion_Block` / INSERTION BLOCK.
Actual command: `xline_intersect_block_xl2_`. No short `XL2` alias claimed.

User-supplied MP4 is copied into `assets/videos/xline-intersection-insert.mp4` without recompression. MP4 container metadata: 814 × 550, about 18.559979 seconds, 1,280,557 bytes. HTML controls, no autoplay/loop. Expand is paused at the main player's time; close pauses/releases the expanded player. No upload or external media requests. Browser playback is not yet independently verified.

## Source evidence and dependencies

Based on the pasted attachment `C:/Users/popul/.codex/attachments/b197a475-a1a0-4b8c-9c4d-93a1d6de2a15/Pasted text.txt`, and the corresponding definition at line 20794 of `C:/TA/TA_COMPELETE/z00x_TA_standard_sun_func_and_MAIN.lsp`. Originals are not edited or executed; no downloadable LSP distribution is created.

Direct custom calls (five):

- `LM:intersectionsinset` — main line 1219.
- `LM:effectivename` — line 37.
- `TA:vla-insertblock` — line 4314.
- `LM:getdynprops` — line 177.
- `LM:setdynpropvalue` — line 158.

Indirect calls from the actual main source: `LM:intersections` (line 1151), then `remove_member_list_` (line 1369). Keep Lee Mac attribution for the LM helpers; the inspected local intersection helper is modified and must not be described as an unmodified upstream version. Verify redistribution rights before packaging source.

The pasted command filters preselection or interactive selection to XLINE, obtains intersection points, reads a reference block, and inserts using its effective name, X effective scale and rotation. The insertion helper applies that one scale to X/Y/Z and chooses ModelSpace/PaperSpace based on CVPORT. The command sets new entity Color to 256, accumulates inserted entities and passes them to PSELECT. For a dynamic reference, it reads/applies properties except names matching `*ORIGIN*`. No attribute-copy or complete layer/scale cloning claim.

## Readiness review (no implementation changes)

- Nil/cancel checks needed before sslength and object conversion; invalid reference may leave stale global name/scale. No local-variable list in the command.
- `(trans point 1 1)` does not convert between coordinate systems; verify actual point interpretation for custom UCS.
- Actual `LM:intersections` ends with `remove_member_list_ 2`. That helper uses `vl-remove` of the Z value, not removal by index. Equal X/Y/Z values may change point length; conversion to 2D also needs review. No fix is implemented here.
- No deduplication before insertion; three or more concurrent lines can yield repeated insertion points.
- Reference X scale is used uniformly; non-uniform scaling and dynamic read-only/allowed values need tests.
- Uses entlast to identify a new insert, does not use the returned object directly. Group undo/error cleanup and failure midway through insertion need review.
- Pairwise intersection helper checks n(n−1)/2 entity pairs; m result points and p dynamic properties add insertion/property work. This is structural complexity, not measured performance.
- ActiveX initialization, acExtendNone constant, CAD version/platform and PSELECT availability not certified.

This standalone page/media is outside the encrypted login bundle and accessible directly. The catalogue contains a link, not password protection for this page. No GitHub publication or CAD testing performed.
