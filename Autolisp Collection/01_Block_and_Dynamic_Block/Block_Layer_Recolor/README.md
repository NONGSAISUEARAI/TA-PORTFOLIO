# Block Layer Recolor

Category 01 Block & Dynamic Block. Command: `Dyeing_layer_object_dyeLIST`.

Created 2026-10-14 from the pending message in the supplied project-state backup. The supplied AutoLISP is read as text only, not executed, modified, copied into public assets, or distributed as an LSP download.

The command chooses a destination layer from a fixed list or reads one from a selected object. It sets selected objects to that layer and color 256 (ByLayer). For block references, it edits supported entities in the effective-name block definition and encountered nested block definitions. This is not a per-instance color override: other references sharing definitions may change. The public page describes the workflow without helper names or implementation maps.

Source reference: `C:/Users/popul/.codex/attachments/fbec8b5e-0016-4d9b-8589-b2d2f0ecdedc/Pasted text.txt` (11,018 characters according to queued attachment metadata).

Local review only: cancellation/empty selection, missing layers/helpers, traversal bounds around ENDBLK, nested-definition cycles, dynamic/anonymous definitions, attribute references, undo and error cleanup need CAD verification. No fixes to the supplied command are made. Its internal entity edits cover HATCH, ARC, LINE, LWPOLYLINE, SPLINE, ELLIPSE, CIRCLE, TEXT, MTEXT and ATTDEF; LINE on `A-ANNO-SYMB` is excepted during definition editing. The selection itself is not limited to INSERT.

Original GIF: `C:/Users/popul/AppData/Local/Temp/codex-clipboard-1fa6590b-58b5-4b34-9201-50ce301ea897.gif`, originally named `20261011-1846-09.7735805.gif`.
Packaged GIF: `assets/gifs/block-layer-recolor.gif`.
GIF89a, 1310 × 432 logical pixels, 102,191,678 bytes. SHA-256: `728F649843EF23BC227908A1892DD7F0D454F121B13F27FC675983FFC8682070`. Byte-identical copy; no recompression or upscaling. The public page states the original file size because initial loading may take time.

Retained collection starfield, TH/EN, copy-command, automatic GIF playback with reduced-motion exception, manual Stop/Play, expand/close, and hidden-page/Back cleanup. Stop releases the GIF; it does not pause at a particular frame. Expand restarts it separately.

The command page and GIF are plaintext and directly accessible, outside the encrypted catalogue. Publish only the page and assets if deployment is requested; keep README/QA/source/backups/private out of deployment. This update is local, preserving the existing portfolio password.
