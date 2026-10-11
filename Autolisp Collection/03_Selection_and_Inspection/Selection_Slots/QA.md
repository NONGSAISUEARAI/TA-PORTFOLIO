# Video update verification — 2026-10-11

Local-only update of the approved template using the supplied MP4. Browser metadata: 53.233333 seconds, 1318 × 578 pixels, no media error. Original and project copy are compared by SHA-256 before delivery. No original CAD code or MP4 was modified, and no GitHub publication performed.

- Page opens paused at time zero with controls enabled and autoplay disabled. Native Play starts playback and playback time advances.
- Selecting Load pauses the shared clip without changing its source or assigning a chapter; actual Load command and helper remain visible. TH/EN copy updates correctly.
- Expanded video starts paused at the main video's current time. Playing the dialog leaves the main video paused. Escape closes the dialog, pauses it, releases its source and returns the updated playback position to the main video.
- Local chooser rejects a GIF fixture. Supplied MP4 loads as a Blob URL, paused, without a media error. Original-clip reset and refresh restore the packaged MP4.
- Screenshots show the user's actual recording, not a fabricated CAD result. Visual checks performed at desktop and mobile widths; see current video previews.
- No API upload, browser storage or external media service was added. MP4/WebM header validation is preliminary only, not codec/security certification.

Not verified: other browsers, oversized-file handling by an actual 256+ MB fixture, all CAD scenarios, full independent privacy review of the recording, public hosting or encrypted-portfolio integration. The media URL is not password protected. This standalone page remains outside publish/.

## Previous GIF-template verification (historical)

Checked in the Codex in-app browser over localhost; page returned HTTP 200. No original CAD code was modified or executed, and no GitHub publication performed.

- Save / Load / Add / Remove tabs display their actual command names and helper information.
- Keyboard Home selects Save; TH/EN changes command descriptions and interface copy.
- Invalid non-GIF file rejected. A generated one-pixel GIF fixture loaded correctly using the local chooser. This fixture is test-only, outside the template, and is not a CAD demonstration.
- Image expansion opened a dialog; Escape closed it. A selected GIF stayed associated with Save when switching to Load and back. Clear returned the frame to its placeholder.
- Local GIF uses a Blob URL. No upload endpoint, network API or browser storage code is present. Clipboard copy has a manual fallback; clipboard success was not independently verified.
- Background pause works. Canvas defaults to static for prefers-reduced-motion and pauses in hidden tabs. GIF animation itself is not paused by the star control.
- Responsive checks at 1280 × 900 and 390 × 844 showed no horizontal document overflow. Mobile placeholder height adjusted so the filename stays inside the frame above its caption. Temporary viewport override reset.
- Browser console inspection returned no warning/error entries after the functional tests. JavaScript syntax check passed.
- Preview screenshots contain placeholders only, not fabricated CAD results or real user-selected media.

Not verified: a cross-browser matrix, deployed HTTPS hosting, real CAD GIF recordings, oversized GIF test, independent security audit, or integration with the encrypted portfolio. Template remains outside publish/; adding it to the public site requires a separate integration step.
