# Local verification — 2026-10-11

Verified in the Codex in-app browser via localhost. No public deployment, account login, Git commit, or CAD code execution performed.

- One password input; no username, form endpoint, credential request, cookie or password storage code.
- Empty submit shows validation. Wrong password fails and clears the field.
- Correct password decrypts locally and renders the real homepage in a sandboxed srcdoc iframe. Blob-frame loading did not display in this browser, so it was replaced with srcdoc before delivery.
- Portfolio TH/EN switch, tool detail dialog, Block category filtering and internal navigation work after unlock.
- Lock removes srcdoc and clears the password field. Reload returns to the locked screen.
- Login TH/EN, show/hide password and pause animation controls work. No real password was included in screenshots or tool output.
- 390 × 844 responsive check: document width 390, no horizontal overflow, one input, locked portfolio hidden. Temporary viewport override reset afterward.
- Browser console inspection returned no warning/error entries after the final unlock/lock test.
- HTTP checks: index, CSS, login JS and ciphertext JS returned 200; /private/access-key.json and /source/index.html returned 404. Only publish/ served, loopback binding. Server access log inspected: preview traffic uses GET, no login POST.
- Build verification: encryption round-trip passed; wrong-key and modified-ciphertext decryption rejected.
- Originals left unchanged. Packaging uses copies of the prior homepage; internal source-audit download link removed from the encrypted presentation.
- Git ignore verification is unresolved: repository reports “must be run in a work tree”. No Git configuration or history changed. Do not commit secrets; upload only publish/ contents.

Limitations: no cross-browser matrix, deployment/HTTPS-host testing, independent security audit, server-side identity checks, per-user revocation or prevention of copying after unlock. Strong passwords remain important against offline guessing. The local preview server is stopped after testing; use tools/start-preview.ps1 to reopen it.
