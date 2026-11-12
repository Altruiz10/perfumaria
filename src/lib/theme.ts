export const THEME_KEY = "hm_theme";

/**
 * Runs before first paint (inline, with CSP nonce) so the chosen theme never flashes.
 * Explicit choice wins; otherwise the OS preference.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})();`;
