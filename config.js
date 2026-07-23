/* ============================================================================
   AMENTI :: Shared Configuration
   ----------------------------------------------------------------------------
   This file holds the URLs and settings shared by every page of the
   Sovereign Instrument (Page1.html, Page2.html, page3.html). It is loaded
   BEFORE any page logic runs, via:

       <script src="config.js"></script>

   Edit the three URLs below ONCE. They survive every future update to the
   HTML pages, because the HTML pages no longer carry the config inline.

   None of these URLs are secret. They are visible to anyone viewing the
   site source. The Anthropic API key is what's protected, and it lives
   inside the Cloudflare Worker — not here.

   ----------------------------------------------------------------------------
   A NOTE ON THE SHAPE OF THIS FILE, LEARNED THE HARD WAY

   This is ONE JavaScript object. Every entry needs a closing quote and a
   comma, and the object needs its closing  };  at the end. Miss either and
   the file does not merely lose one setting — it FAILS TO PARSE ENTIRELY,
   window.AMENTI_CONFIG is never defined, and every page silently falls back
   to its defaults. Page1 falls back to ./names.csv, which may be a different
   roster than the Sheet.

   The failure is silent and it is cached: the browser goes on serving the
   last version that parsed, so the site keeps working while the file on disk
   is broken. That is exactly how a correct edit can appear to have no effect.

   IF YOU EDIT THIS FILE, LOAD  config.js  DIRECTLY IN A BROWSER AFTERWARDS
   AND CHECK THE CONSOLE FOR A RED SyntaxError.
   ============================================================================ */

window.AMENTI_CONFIG = {

  // ---- 1. LEDGER (Google Sheet, published as CSV) ----
  // In your Google Sheet:  File > Share > Publish to web
  // Format: "Comma-separated values (.csv)"
  // Paste the resulting URL here. It must end in `output=csv`.
  //
  // NOTE: the gid identifies ONE TAB. If you re-import and Sheets creates a
  // new tab, the gid changes and this URL must change with it — in BOTH this
  // file and the hardcoded copy inside library.js.
  LEDGER_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSN9sBzULLi1dZrhxuoNISIz8hSniWKyLqeYRnAGZEwfp4SaUXu5mo0SHoQlQYi7M3zDzwbAjLWh1Gs/pub?gid=1598709533&single=true&output=csv",

  // ---- 2. AI PROXY (Cloudflare Worker) ----
  // Holds the Anthropic API key. Until this is deployed, the chat stays
  // inert and Gabriel will say "AI proxy not configured" — that's fine
  // for testing the rest of the instrument. See SETUP.md.
  AI_PROXY_URL: "https://amenti-proxy.ingram-ian.workers.dev",

  // ---- 3. MANUEL (the glossary) ----
  // Path to MANUEL.md, relative to the HTML page that loads it.
  // Default assumes MANUEL.md sits next to the HTML files in the repo root.
  MANUEL_URL: "MANUEL.md"

};
