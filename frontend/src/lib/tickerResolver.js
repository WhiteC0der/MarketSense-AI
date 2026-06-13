/**
 * Local company name → ticker map.
 * Instant lookup for popular stocks — no network call needed.
 * Keys are normalized (lowercase, no spaces/dots) for fuzzy matching.
 */
const TICKER_MAP = {
  // Tech
  apple: 'AAPL',
  microsoft: 'MSFT',
  google: 'GOOGL',
  alphabet: 'GOOGL',
  amazon: 'AMZN',
  meta: 'META',
  facebook: 'META',
  tesla: 'TSLA',
  nvidia: 'NVDA',
  netflix: 'NFLX',
  adobe: 'ADBE',
  salesforce: 'CRM',
  oracle: 'ORCL',
  intel: 'INTC',
  amd: 'AMD',
  qualcomm: 'QCOM',
  broadcom: 'AVGO',
  ibm: 'IBM',
  paypal: 'PYPL',
  uber: 'UBER',
  lyft: 'LYFT',
  airbnb: 'ABNB',
  doordash: 'DASH',
  snapchat: 'SNAP',
  snap: 'SNAP',
  twitter: 'X',
  spotify: 'SPOT',
  shopify: 'SHOP',
  zoom: 'ZM',
  slack: 'CRM',
  palantir: 'PLTR',
  snowflake: 'SNOW',
  coinbase: 'COIN',
  robinhood: 'HOOD',
  roblox: 'RBLX',
  unity: 'U',
  crowdstrike: 'CRWD',
  datadog: 'DDOG',
  mongodb: 'MDB',
  servicenow: 'NOW',
  workday: 'WDAY',
  twilio: 'TWLO',
  cloudflare: 'NET',
  hubspot: 'HUBS',
  docusign: 'DOCU',
  okta: 'OKTA',
  square: 'SQ',
  block: 'SQ',
  microstrategy: 'MSTR',
  arm: 'ARM',
  asml: 'ASML',
  tsmc: 'TSM',
  samsung: '005930SS',

  // Finance
  jpmorgan: 'JPM',
  jpmorganchase: 'JPM',
  bankofamerica: 'BAC',
  wellsfargo: 'WFC',
  citigroup: 'C',
  citi: 'C',
  goldmansachs: 'GS',
  goldman: 'GS',
  morganstanley: 'MS',
  blackrock: 'BLK',
  visa: 'V',
  mastercard: 'MA',
  americanexpress: 'AXP',
  amex: 'AXP',
  berkshirehathaway: 'BRK-B',
  berkshire: 'BRK-B',
  charlesschwab: 'SCHW',
  schwab: 'SCHW',

  // Healthcare
  johnson: 'JNJ',
  johnsonandjohnson: 'JNJ',
  unitedhealth: 'UNH',
  pfizer: 'PFE',
  abbvie: 'ABBV',
  eli: 'LLY',
  elililly: 'LLY',
  lilly: 'LLY',
  merck: 'MRK',
  bristol: 'BMY',
  bristolmyers: 'BMY',
  amgen: 'AMGN',
  gilead: 'GILD',
  moderna: 'MRNA',
  novavax: 'NVAX',
  biogen: 'BIIB',

  // Consumer / Retail
  walmart: 'WMT',
  costco: 'COST',
  target: 'TGT',
  homedepot: 'HD',
  lowes: 'LOW',
  mcdonalds: 'MCD',
  starbucks: 'SBUX',
  nike: 'NKE',
  cocacola: 'KO',
  coke: 'KO',
  pepsi: 'PEP',
  pepsico: 'PEP',
  disney: 'DIS',
  disney: 'DIS',

  // Energy
  exxon: 'XOM',
  exxonmobil: 'XOM',
  chevron: 'CVX',
  shell: 'SHEL',
  bp: 'BP',
  conocophillips: 'COP',
  conocop: 'COP',

  // Auto
  ford: 'F',
  gm: 'GM',
  generalmotors: 'GM',
  rivian: 'RIVN',
  lucid: 'LCID',

  // Telecom / Media
  att: 'T',
  verizon: 'VZ',
  tmobile: 'TMUS',
  comcast: 'CMCSA',
  warner: 'WBD',
  warnerbros: 'WBD',
  paramount: 'PARA',
};

/**
 * Normalize a string for map lookups:
 * lowercase, strip spaces, dots, dashes, &, Inc, Corp, Ltd etc.
 */
const normalize = (str) =>
  str
    .toLowerCase()
    .replace(/\b(inc|corp|corporation|ltd|limited|co|company|group|holdings|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

/**
 * Check if input looks like a ticker (1–5 uppercase letters, possibly with -)
 * e.g. AAPL, BRK-B
 */
const looksLikeTicker = (str) => /^[A-Z]{1,5}(-[A-Z]{1,2})?$/.test(str.trim());

/**
 * Resolve a user's raw input (company name or ticker) to a stock ticker symbol.
 *
 * Strategy:
 * 1. If input already looks like a valid ticker → return as-is (uppercased)
 * 2. Try local map lookup (instant, no network)
 * 3. Fall back to backend stockAPI.search() (Yahoo Finance / Finnhub)
 *
 * @param {string} raw - Raw user input e.g. "Apple", "TSLA", "tesla inc"
 * @param {Function} apiFallback - stockAPI.search function to call if local lookup fails
 * @returns {Promise<string>} - Resolved ticker symbol e.g. "AAPL"
 */
export const resolveTicker = async (raw, apiFallback) => {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('Please enter a company name or ticker.');

  // ── 1. Already a ticker? Return immediately ───────────────────────────────
  if (looksLikeTicker(trimmed)) {
    return trimmed.toUpperCase();
  }

  // ── 2. Local map lookup ───────────────────────────────────────────────────
  const key = normalize(trimmed);
  if (TICKER_MAP[key]) {
    return TICKER_MAP[key];
  }

  // Also try partial key matching for company names like "Apple Inc."
  const partialMatch = Object.keys(TICKER_MAP).find(
    (mapKey) => key.includes(mapKey) || mapKey.includes(key)
  );
  if (partialMatch) {
    return TICKER_MAP[partialMatch];
  }

  // ── 3. Backend API fallback ───────────────────────────────────────────────
  const found = await apiFallback(trimmed);
  if (!found?.symbol) throw new Error(`No match found for "${trimmed}".`);
  return found.symbol.toUpperCase();
};
