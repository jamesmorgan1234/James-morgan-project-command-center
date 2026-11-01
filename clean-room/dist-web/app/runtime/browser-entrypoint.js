import { installBrowserStartupBoundary } from "./browser-startup-runtime.js";
if (installBrowserStartupBoundary()) {
    await import("./browser-navigation-runtime.js");
    await import("./browser.js");
}
//# sourceMappingURL=browser-entrypoint.js.map