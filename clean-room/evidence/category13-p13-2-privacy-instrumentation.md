# Category 13 / P13.2 — Privacy-Conscious Analytics Instrumentation Evidence

Status: implemented on the isolated clean-room branch only. No production analytics provider, paid service, deployment, or external data collection is activated by this phase.

`src/analytics/privacy-instrumentation.ts` adds client/server emission routing, affirmative-consent behavior for product analytics, minimized essential-reliability telemetry, event-property allowlisting, unsafe-key/secret-like-value rejection, and bounded error/performance capture that never accepts raw error objects, message bodies, prompts, credentials, tokens, headers, or other free-form sensitive content.

Focused local verification before repository mutation: TypeScript 5.8.3 strict compilation PASS; combined P13.1/P13.2 tests 9/9 PASS.

Repository-wide gates remain authoritative after commit integration.
