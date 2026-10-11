# Block Name Filter / กรองชื่อบล็อก

Category: `03_Selection_and_Inspection`.
Command: `SFBW_FINDING_STRING_NAME_BLOCK_SFBSTR_` (not a new short alias).

Standalone local showcase; existing Selection Slots and login remain unchanged. This page is not linked into the encrypted Programs catalogue yet. Do not publish the entire repository: this page and its GIF are plaintext, outside the login bundle.

## Source evidence

Based on the user's pasted defun, not a CAD execution. The command definition was not found by the targeted definition search in the main source. Its custom helper `LM:effectivename` was found at line 37 in `C:/TA/TA_COMPELETE/z00x_TA_standard_sun_func_and_MAIN.lsp`, with Lee Mac attribution. No source was copied into a downloadable LSP; redistribution permissions and standalone readiness have not been verified.

- `ssget "i"` filtered by `(0 . "INSERT")`, falling back to interactive `ssget`.
- `getstring` with remembered global pattern variables.
- Single selection loop: `ssname` → `vlax-ename->vla-object` → `LM:effectivename` → `strcase`/`wcmatch` → `ssadd`.
- Final `(command "pselect" new_pre_filter_set_xx_ "")`.
- One custom helper; no nested defun in the pasted command. ActiveX/Visual LISP availability and PSELECT must be checked for the target CAD product/version. No Mac/LT compatibility claim.
- Complexity: one pass over n selected inserts, n effective-name reads and pattern comparisons; O(n) selection iterations, plus name/pattern processing and selection-set operations; stores k matching entities. No benchmark performed.
- Review: nil selection before sslength; Enter with no saved pattern; cancel; no matches; globals without a local-variable list; getstring without T for spaces; missing helper; ActiveX initialization. Pattern is not automatically wrapped in `*`.

Wildcard reference: [Autodesk wcmatch](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-AutoLISP-Reference/files/GUID-EC257AF7-72D4-4B38-99B6-9B09952A53AD.htm).

## GIF

Original: `C:/Users/popul/Videos/20261011-1555-58.9560393.gif`.
Packaged: `assets/gifs/block-name-filter.gif`.
29,932,951 bytes; 816 × 550 logical pixels. Copied without transcoding, recompression or upscaling. Manual play; stop removes the animated image (not a frame-accurate pause). Expand starts a separate display from the beginning; closing releases its image. Hidden-page and reduced-motion changes stop playback. No fake animation, fabricated chapters or extracted CAD test results.

No upload, external fonts, telemetry, or CAD execution. The original recording and main source are untouched.
