# Command Center Authoritative V7 — Clean Room

This directory is the isolated clean-room implementation of Command Center.

Rules:
- No imports from legacy Command Center JS/CSS/UI/runtime files.
- No legacy bootstrap, renderer, navigation, Agent front-end, or styling dependencies.
- Approved screenshots and written standards define presentation/behavior.
- Live verified data may be read from the current authorized backend, but data access code is newly written here.
- Nothing in this directory is production-active until the explicit cutover phase.
