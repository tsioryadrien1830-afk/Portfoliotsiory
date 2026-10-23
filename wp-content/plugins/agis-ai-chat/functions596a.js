/**
 * Normalizes a primitive account id (hostname-style key or Mongo ObjectId string).
 * Rejects DOM nodes (window.account shadowed by id="account"), coerced "[object …]" strings, etc.
 * @returns {string} canonical value or '' if invalid
 */
function agisCoerceValidAccountArg(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object' || typeof value === 'function') {
    return '';
  }
  const s = String(value).trim();
  if (!s || s === 'undefined' || s === 'null') {
    return '';
  }
  if (s.indexOf('[object ') === 0) {
    return '';
  }
  if (/^[a-fA-F0-9]{24}$/.test(s)) {
    return s;
  }
  if (/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/.test(s)) {
    return s;
  }
  return '';
}

function setCookie(name, value, days) {
  if (value === undefined || value === null) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
    return;
  }
  if (name === 'account') {
    const coerced = agisCoerceValidAccountArg(value);
    if (!coerced) {
      try {
        console.warn('setCookie: skipped invalid account value (not a hostname key or 24-char hex)');
      } catch (e) {
        /* ignore */
      }
      return;
    }
    value = coerced;
  }
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

const isValidAccountId = (value) => agisCoerceValidAccountArg(value) !== '';

/** Mongo ObjectId string — required by some license APIs for x-account-id. */
const isMongoObjectIdString = (value) => {
  if (value === null || value === undefined) {
    return false;
  }
  const s = String(value).trim();
  return /^[a-fA-F0-9]{24}$/.test(s);
};

/** Common DNS suffixes to strip so site keys match tenant slugs (primenumberfarms.com → primenumberfarms). */
const SITE_ACCOUNT_TLD_SUFFIXES = new Set([
  'com',
  'net',
  'org',
  'edu',
  'gov',
  'mil',
  'int',
  'io',
  'ai',
  'app',
  'dev',
  'me',
  'tv',
  'biz',
  'info',
  'us',
  'uk',
  'ca',
  'au',
  'de',
  'fr',
  'nl',
  'jp',
  'cn',
  'ru',
  'br',
  'in',
  'mx',
  'local',
  'test',
  'internal'
]);

/**
 * Strip trailing public/special TLD labels from hostname-style account keys (not Mongo ids).
 * Examples: primenumberfarms.com → primenumberfarms, site.example.co.uk → site.example.
 */
const normalizeSiteAccountKey = (value) => {
  if (!isValidAccountId(value)) {
    return '';
  }
  const s = String(value).trim();
  if (isMongoObjectIdString(s)) {
    return s;
  }
  const bare = s.replace(/^www\./i, '');
  const parts = bare.split('.').filter(Boolean);
  if (parts.length < 2) {
    return s;
  }
  const last = parts[parts.length - 1].toLowerCase();
  const prev = parts[parts.length - 2].toLowerCase();
  if (parts.length >= 3 && prev === 'co' && last === 'uk') {
    return parts.slice(0, -2).join('.').toLowerCase();
  }
  if (SITE_ACCOUNT_TLD_SUFFIXES.has(last)) {
    return parts.slice(0, -1).join('.').toLowerCase();
  }
  return s;
};

/** Canonical account string for cookies, globals, and API `account` fields (hostname keys only). */
const normalizeAccountForStorage = (id) => {
  const s = agisCoerceValidAccountArg(id);
  if (!s) {
    return '';
  }
  if (isMongoObjectIdString(s)) {
    return s;
  }
  const n = normalizeSiteAccountKey(s);
  return agisCoerceValidAccountArg(n) ? n : s;
};

/**
 * Picks issuer Mongo id from known API fields only (avoid generic _id / deep scan — those are often
 * crawl/domain document ids and cause "Issuer account not found" on license routes).
 */
const pickIssuerObjectIdFromDerivePayload = (data) => {
  if (!data || typeof data !== 'object') {
    return '';
  }
  const acc = data.account;
  if (acc && typeof acc === 'object' && isMongoObjectIdString(acc.$oid)) {
    return String(acc.$oid).trim();
  }
  if (data.parent && typeof data.parent === 'object' && isMongoObjectIdString(data.parent.$oid)) {
    return String(data.parent.$oid).trim();
  }
  if (data.owner && typeof data.owner === 'object' && isMongoObjectIdString(data.owner.$oid)) {
    return String(data.owner.$oid).trim();
  }
  if (isMongoObjectIdString(data.owner)) {
    return String(data.owner).trim();
  }
  const candidates = [
    data.issuerAccountId,
    data.poolOwnerAccount,
    data.poolOwner,
    data.ownerAccountId,
    data.ownerAccount,
    data.parentAccount,
    isMongoObjectIdString(data.parent) ? data.parent : null,
    data.accountId,
    data.accountMongoId,
    data.mongoAccountId,
    data.linkedAccountId,
    data.userAccountId,
    data.workspaceAccountId,
    data.agisAccountId,
    data.administratorId,
    data.adminAccountId,
    data.rootAccountId,
    data.primaryAccountId,
    data.billingAccountId,
    data.licensePoolOwnerId,
    data.tenantAccountId,
    typeof acc === 'string' || typeof acc === 'number' ? acc : null
  ];
  for (let i = 0; i < candidates.length; i++) {
    if (isMongoObjectIdString(candidates[i])) {
      return String(candidates[i]).trim();
    }
  }
  return '';
};

const setLicenseIssuerIdIfValid = (oid) => {
  if (!isMongoObjectIdString(oid)) {
    return false;
  }
  const s = String(oid).trim();
  setCookie('issuerAccountId', s, 1);
  try {
    window.agisIssuerAccountId = s;
  } catch (e) {
    /* ignore */
  }
  return true;
};

/** Skip huge / misleading branches when shallow-scanning for issuer id (domain rows, page lists, etc.). */
const ISSUER_SHALLOW_SKIP_KEYS = new Set([
  'domains',
  'pages',
  'pageList',
  'results',
  'rows',
  'jobs',
  'children',
  'vectors',
  'embeddings',
  'transcripts',
  'messages',
  'history',
  'urls',
  'links',
  'discoveredUrls',
  'crawlResults',
  'documents',
  'items',
  'chunks'
]);

/** Prefer nested objects under these keys before generic shallow (derive / small API envelopes). */
const ISSUER_HINT_KEYS = [
  'account',
  'owner',
  'parent',
  'user',
  'admin',
  'administrator',
  'issuer',
  'poolOwner',
  'workspace',
  'organization',
  'org',
  'tenant',
  'billing',
  'subscription',
  'license',
  'pool',
  'linkedAccount',
  'siteAccount'
];

const pickIssuerFromHintKeys = (data) => {
  if (!data || typeof data !== 'object') {
    return '';
  }
  for (let i = 0; i < ISSUER_HINT_KEYS.length; i++) {
    const k = ISSUER_HINT_KEYS[i];
    const v = data[k];
    if (isMongoObjectIdString(v)) {
      return String(v).trim();
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (isMongoObjectIdString(v.$oid)) {
        return String(v.$oid).trim();
      }
      if (isMongoObjectIdString(v._id)) {
        return String(v._id).trim();
      }
    }
  }
  return '';
};

const MAX_ISSUER_SHALLOW_JSON_CHARS = 14000;

/** True when payload is small enough that bounded shallow scan is unlikely to be a full crawl blob. */
const payloadAllowsBoundedIssuerShallow = (data) => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  let len = 0;
  try {
    len = JSON.stringify(data).length;
  } catch (e) {
    return false;
  }
  if (len > MAX_ISSUER_SHALLOW_JSON_CHARS) {
    return false;
  }
  const bigArrays = ['pages', 'results', 'rows', 'domains', 'messages', 'urls', 'links', 'items'];
  for (let i = 0; i < bigArrays.length; i++) {
    const k = bigArrays[i];
    const a = data[k];
    if (Array.isArray(a) && a.length > 24) {
      return false;
    }
  }
  return true;
};

/**
 * Limited-depth scan (used after explicit field picks) — avoids generic deep scan picking wrong _ids.
 */
const pickIssuerShallowLimited = (data, maxDepth, depth, state) => {
  maxDepth = typeof maxDepth === 'number' ? maxDepth : 4;
  depth = typeof depth === 'number' ? depth : 0;
  state = state || { seen: typeof WeakSet !== 'undefined' ? new WeakSet() : null, count: 0 };
  if (depth > maxDepth || !data || typeof data !== 'object') {
    return '';
  }
  if (state.count > 48) {
    return '';
  }
  if (state.seen) {
    try {
      if (state.seen.has(data)) {
        return '';
      }
      state.seen.add(data);
    } catch (e) {
      /* ignore */
    }
  }
  state.count++;

  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (ISSUER_SHALLOW_SKIP_KEYS.has(k)) {
      continue;
    }
    // Root `_id` on getDomainRecord / crawl docs is the row id, not the license issuer — sending it as
    // x-account-id causes "Issuer account not found". Nested `account._id` etc. still resolves at depth > 0.
    if (k === '_id' && depth === 0) {
      continue;
    }
    const v = data[k];
    if (isMongoObjectIdString(v)) {
      return String(v).trim();
    }
    if (v && typeof v === 'object' && isMongoObjectIdString(v.$oid)) {
      return String(v.$oid).trim();
    }
  }
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (ISSUER_SHALLOW_SKIP_KEYS.has(k)) {
      continue;
    }
    if (k === '_id' && depth === 0) {
      continue;
    }
    const v = data[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const ctor = v.constructor && v.constructor.name;
      if (ctor && ctor !== 'Object') {
        continue;
      }
      const hit = pickIssuerShallowLimited(v, maxDepth, depth + 1, state);
      if (hit) {
        return hit;
      }
    }
    if (Array.isArray(v) && depth < maxDepth) {
      const lim = Math.min(v.length, 4);
      for (let j = 0; j < lim; j++) {
        if (v[j] && typeof v[j] === 'object') {
          const hit = pickIssuerShallowLimited(v[j], maxDepth, depth + 1, state);
          if (hit) {
            return hit;
          }
        }
      }
    }
  }
  return '';
};

/**
 * Persist issuer id from API payloads.
 * @param {boolean|'auto'} [allowShallow] – true: always run bounded shallow if explicit misses; false: never;
 *   'auto' (default): shallow only for compact payloads (derive / domain record), not large crawl JSON.
 */
const persistIssuerAccountIdFromDerive = (data, allowShallow = 'auto') => {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      return;
    }
  }
  let oid = pickIssuerObjectIdFromDerivePayload(data);
  if (!oid && data && typeof data === 'object' && data.data && typeof data.data === 'object') {
    oid = pickIssuerObjectIdFromDerivePayload(data.data);
  }
  if (!oid && data && typeof data === 'object') {
    oid = pickIssuerFromHintKeys(data);
  }
  if (!oid && data && typeof data === 'object' && data.data && typeof data.data === 'object') {
    oid = pickIssuerFromHintKeys(data.data);
  }
  const runShallow =
    data &&
    typeof data === 'object' &&
    (allowShallow === true || (allowShallow === 'auto' && payloadAllowsBoundedIssuerShallow(data)));
  if (!oid && runShallow) {
    try {
      oid = pickIssuerShallowLimited(data, 3, 0, null);
    } catch (e) {
      console.warn('pickIssuerShallowLimited:', e);
    }
  }
  if (oid) {
    setLicenseIssuerIdIfValid(oid);
  }
};

const clearIssuerCookieOnly = () => {
  document.cookie = 'issuerAccountId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'issuerAccount=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  try {
    delete window.agisIssuerAccountId;
  } catch (e) {
    /* ignore */
  }
};

const clearAccountCookie = () => {
  document.cookie = 'account=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  clearIssuerCookieOnly();
};

const getValidAccountFromCookie = () => {
  const c = getCookie('account');
  return isValidAccountId(c) ? String(c).trim() : '';
};

/** Prefer window.account, then valid cookie (many modules still read bare `account`). */
const getResolvedAccountId = () => {
  let id = '';
  if (typeof window !== 'undefined' && isValidAccountId(window.account)) {
    id = String(window.account).trim();
  } else if (typeof account !== 'undefined' && isValidAccountId(account)) {
    id = String(account).trim();
  } else {
    return getValidAccountFromCookie();
  }
  return normalizeAccountForStorage(id);
};

/** WordPress: prefer canonical `account` cookie for domain/tenant APIs when globals are stale. */
const getAccountKeyForDomainApis = () => {
  if (typeof isWordpress !== 'undefined' && isWordpress) {
    const fromCookie = getValidAccountFromCookie();
    if (isValidAccountId(fromCookie)) {
      return String(fromCookie).trim();
    }
  }
  return getResolvedAccountId();
};

/**
 * x-account-id for license routes. Matches pre–Apr-2026 behavior: same id as `account` when the API
 * returns a Mongo ObjectId in `data.account` (see backup functions.js derive → setCookie('account', …)).
 */
const getLicenseIssuerXAccountId = () => {
  let fromCookie = getCookie('issuerAccountId');
  if (!isMongoObjectIdString(fromCookie)) {
    const legacy = getCookie('issuerAccount');
    if (isMongoObjectIdString(legacy)) {
      fromCookie = legacy;
    }
  }
  if (isMongoObjectIdString(fromCookie)) {
    return String(fromCookie).trim();
  }
  try {
    if (typeof window !== 'undefined' && isMongoObjectIdString(window.agisIssuerAccountId)) {
      return String(window.agisIssuerAccountId).trim();
    }
  } catch (e) {
    /* ignore */
  }
  const resolved = getResolvedAccountId();
  if (isMongoObjectIdString(resolved)) {
    return resolved;
  }
  return '';
};

/** Keep window + legacy global `account` aligned so JSON payloads stay valid across bundles. */
const syncResolvedAccountGlobals = (id) => {
  const s = normalizeAccountForStorage(id);
  if (!isValidAccountId(s)) {
    return;
  }
  try {
    window.account = s;
  } catch (e) {
    /* ignore */
  }
  try {
    if (typeof globalThis !== 'undefined') {
      globalThis.account = s;
    }
  } catch (e) {
    /* ignore */
  }
  try {
    // Sloppy-mode global used by htmlContents.js / lookAndFeel.js / etc.
    // eslint-disable-next-line no-global-assign, no-undef
    account = s;
  } catch (e) {
    /* ignore (e.g. strict mode without global binding) */
  }
};

let wpAccountEnsurePromise = null;

/**
 * WordPress: resolve account id from cookie, API (deriveAccountFromHostname), or hostname fallback;
 * updates window.account, global account, and cookie when a valid id is found.
 * Single-flight so parallel callers share one derive + one cookie write.
 */
const ensureWordpressAccountAndCookie = async () => {
  if (typeof isWordpress === 'undefined' || !isWordpress) {
    if (typeof account !== 'undefined' && isValidAccountId(account)) {
      const s = normalizeAccountForStorage(String(account).trim());
      syncResolvedAccountGlobals(s);
      return s;
    }
    const c = getValidAccountFromCookie();
    if (c) {
      const norm = normalizeAccountForStorage(c);
      syncResolvedAccountGlobals(norm);
      return norm;
    }
    return c;
  }

  if (!wpAccountEnsurePromise) {
    wpAccountEnsurePromise = (async () => {
      try {
        let resolved =
          (typeof account !== 'undefined' && isValidAccountId(account) ? String(account).trim() : '') ||
          getValidAccountFromCookie();

        if (isValidAccountId(resolved)) {
          const norm = normalizeAccountForStorage(resolved);
          syncResolvedAccountGlobals(norm);
          setCookie('account', norm, 1);
          if (isMongoObjectIdString(norm)) {
            setLicenseIssuerIdIfValid(norm);
          }
          return norm;
        }

        clearAccountCookie();
        const derived = await deriveAccountFromWordpress();
        const finalId = isValidAccountId(derived) ? String(derived).trim() : '';

        if (!isValidAccountId(finalId)) {
          console.error('ensureWordpressAccountAndCookie: could not resolve a valid account id');
          return '';
        }

        const norm = normalizeAccountForStorage(finalId);
        syncResolvedAccountGlobals(norm);
        setCookie('account', norm, 1);
        if (isMongoObjectIdString(norm)) {
          setLicenseIssuerIdIfValid(norm);
        }
        return norm;
      } finally {
        wpAccountEnsurePromise = null;
      }
    })();
  }

  return wpAccountEnsurePromise;
};

/** All values for a cookie name (browsers may store duplicates under different paths/scopes). */
const getAllCookieValues = (name) => {
  const cname = name + '=';
  let decodedCookie = '';
  try {
    decodedCookie = decodeURIComponent(document.cookie);
  } catch (e) {
    decodedCookie = document.cookie;
  }
  const out = [];
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(cname) === 0) {
      out.push(c.substring(cname.length, c.length).trim());
    }
  }
  return out;
};

/**
 * When multiple `account=` cookies exist (e.g. stale "agis" + current site slug), pick the one that
 * matches this site's hostname so derive / getDomainsByAccount use the right tenant key.
 */
const pickCanonicalAccountCookieValue = (values) => {
  if (!values || !values.length) {
    return '';
  }
  const uniq = [];
  const seen = {};
  for (let i = 0; i < values.length; i++) {
    const raw = (values[i] || '').toString().trim();
    if (!raw || seen[raw]) {
      continue;
    }
    seen[raw] = 1;
    uniq.push(raw);
  }
  if (uniq.length === 1) {
    return uniq[0];
  }
  let host = '';
  try {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      host = window.location.hostname.replace(/^www\./i, '').toLowerCase();
    }
  } catch (e) {
    host = '';
  }
  for (let j = 0; j < uniq.length; j++) {
    const v = uniq[j];
    const vl = v.toLowerCase();
    if (isMongoObjectIdString(v)) {
      continue;
    }
    if (host && vl === host) {
      return v;
    }
    if (host && host.startsWith(vl + '.')) {
      return v;
    }
    if (host && host.endsWith('.local') && vl === host.slice(0, -'.local'.length)) {
      return v;
    }
  }
  const nonMongo = uniq.filter((v) => !isMongoObjectIdString(v));
  if (nonMongo.length === 1) {
    return nonMongo[0];
  }
  return uniq[uniq.length - 1];
};

function getCookie(name) {
  if (name === 'account') {
    const raw = pickCanonicalAccountCookieValue(getAllCookieValues('account'));
    const normalized = normalizeAccountForStorage(raw);
    if (!normalized && raw) {
      try {
        document.cookie = 'account=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } catch (e) {
        /* ignore */
      }
    }
    return normalized;
  }
  let cname = name + "=";
  let decodedCookie = '';
  try {
    decodedCookie = decodeURIComponent(document.cookie);
  } catch (e) {
    decodedCookie = document.cookie;
  }
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(cname) == 0) {
      return c.substring(cname.length, c.length).trim();
    }
  }
  return "";
}

const showModal = (title, innerHtml) => {
  jQuery('#modalTitle').html(title);
  jQuery('#modalContents').html(innerHtml);
  jQuery('#customModal').modal('show');
};

const showUpgradeModal = (licenseData, licenseType, message) => {
  let title = `You do not have an active ${licenseType} subscription.`;
  let newHtml = `
In order to use this feature, you must please upgrade your account.
<hr size=1>
To view your subscriptions, please <a href="#" onClick="hideModal(); billingEntry();"> Click here </a>
`;
  showModal(title, newHtml);
};

// Hide modal
const hideModal = () => {
  jQuery('#customModal').modal('hide');
};

const getAccount = async () => {
  console.log('Get account trying to look at global');
  let l_account =
    typeof account !== 'undefined' && isValidAccountId(account) ? String(account).trim() : '';

  if (!l_account) {
    l_account = getValidAccountFromCookie();
  }

  console.log('Account: ' + l_account);

  if (!l_account && typeof isWordpress !== 'undefined' && isWordpress) {
    console.log('No account present, resolving via ensureWordpressAccountAndCookie (WordPress)');
    l_account = await ensureWordpressAccountAndCookie();
    if (!isValidAccountId(l_account)) {
      l_account = '';
    }
  }

  console.log('Account now: ' + l_account);
  return l_account;
};

const deriveAccountFromWordpress = () => {
  return new Promise((resolve) => {
    const domain = getWordpressDomain()[0];
    const hostFallback = isValidAccountId(domain) ? String(domain).trim() : '';
    console.log('deriveAccountFromWordpress Domain: ' + domain);
    let postUrl = `${serverUrl}/api/deriveAccountFromHostname`;
    console.log('Using postUrl:' + postUrl);

    jQuery.ajax({
      url: postUrl,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ domain: domain }),
      success: function (data) {
        console.log('deriveAccountFromHostname response:', data);
        try {
          window.__AGIS_LAST_DERIVE_RESPONSE = data;
        } catch (e) {
          /* ignore */
        }
        persistIssuerAccountIdFromDerive(data);
        let fromApi = data && data.account;
        if (fromApi && typeof fromApi === 'object' && !Array.isArray(fromApi) && isMongoObjectIdString(fromApi.$oid)) {
          fromApi = String(fromApi.$oid).trim();
        }
        if (isMongoObjectIdString(fromApi)) {
          setLicenseIssuerIdIfValid(fromApi);
        }
        if (isValidAccountId(fromApi)) {
          const out = isMongoObjectIdString(fromApi)
            ? String(fromApi).trim()
            : normalizeAccountForStorage(fromApi);
          resolve(out);
          return;
        }
        if (hostFallback) {
          const fb = normalizeAccountForStorage(hostFallback);
          console.warn('deriveAccountFromHostname: missing account in response; using hostname:', fb || hostFallback);
          resolve(fb || hostFallback);
          return;
        }
        resolve('');
      },
      error: function (xhr, status, error) {
        console.warn('deriveAccountFromHostname request failed:', error, '- using hostname fallback if available');
        try {
          const body = xhr && xhr.responseJSON;
          if (body) {
            persistIssuerAccountIdFromDerive(body);
          } else if (xhr && xhr.responseText) {
            try {
              persistIssuerAccountIdFromDerive(JSON.parse(xhr.responseText));
            } catch (e) {
              /* ignore non-JSON error bodies */
            }
          }
        } catch (e) {
          /* ignore */
        }
        if (hostFallback) {
          resolve(normalizeAccountForStorage(hostFallback) || hostFallback);
          return;
        }
        resolve('');
      }
    });
  });
};

/**
 * Try other account/domain endpoints that often include a Mongo id even when derive omits it.
 * @param {string} [wizardDomain] – setup wizard current domain (preferred for getDomainRecord)
 */
const resolveLicenseIssuerFromAlternateApis = async (wizardDomain) => {
  let id = getLicenseIssuerXAccountId();
  if (id) {
    return id;
  }

  const accountKey = getAccountKeyForDomainApis();
  if (accountKey) {
    try {
      const grouped = await new Promise((resolve, reject) => {
        jQuery.ajax({
          url: `${serverUrl}/api/getDomainsByAccountWithOrigin`,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ account: accountKey }),
          success: (data) => resolve(Array.isArray(data) ? data : []),
          error: (xhr, _status, err) => reject(err || xhr)
        });
      });

      for (let i = 0; i < grouped.length; i++) {
        const g = grouped[i];
        if (g && isMongoObjectIdString(g.account)) {
          setLicenseIssuerIdIfValid(g.account);
          id = getLicenseIssuerXAccountId();
          if (id) {
            return id;
          }
        }
        persistIssuerAccountIdFromDerive(g);
        id = getLicenseIssuerXAccountId();
        if (id) {
          return id;
        }
      }
    } catch (e) {
      console.warn('resolveLicenseIssuerFromAlternateApis: getDomainsByAccountWithOrigin', e);
    }
  }

  const domainForRecord =
    (wizardDomain && String(wizardDomain).trim()) ||
    (typeof getCookie === 'function' && getCookie('domain') && String(getCookie('domain')).trim()) ||
    (typeof getWordpressDomain === 'function' ? getWordpressDomain()[0] : '') ||
    '';

  if (domainForRecord) {
    try {
      const record = await new Promise((resolve, reject) => {
        jQuery.ajax({
          url: `${serverUrl}/api/getDomainRecord`,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ domain: domainForRecord }),
          success: (data) => resolve(data),
          error: (xhr, _status, err) => reject(err || xhr)
        });
      });
      persistIssuerAccountIdFromDerive(record);
      id = getLicenseIssuerXAccountId();
      if (id) {
        return id;
      }
    } catch (e) {
      console.warn('resolveLicenseIssuerFromAlternateApis: getDomainRecord', e);
    }
  }

  return getLicenseIssuerXAccountId();
};

/**
 * Ensures license APIs have a Mongo ObjectId: cache, derive, then other account/domain APIs.
 * @param {string} [wizardDomain] – optional wizard step domain for getDomainRecord
 */
const ensureLicenseIssuerFromServer = async (wizardDomain) => {
  let id = getLicenseIssuerXAccountId();
  if (id) {
    return id;
  }
  await deriveAccountFromWordpress();
  id = getLicenseIssuerXAccountId();
  if (id) {
    return id;
  }
  id = await resolveLicenseIssuerFromAlternateApis(wizardDomain);
  if (!id) {
    try {
      window.__AGIS_LICENSE_ISSUER_DEBUG = {
        at: new Date().toISOString(),
        wizardDomain: wizardDomain || null,
        resolvedAccount: getResolvedAccountId(),
        accountKeyForDomainApis: getAccountKeyForDomainApis(),
        domainCookie: typeof getCookie === 'function' ? getCookie('domain') : '',
        lastDeriveResponse: typeof window !== 'undefined' ? window.__AGIS_LAST_DERIVE_RESPONSE : null,
        issuerCookie: typeof getCookie === 'function' ? getCookie('issuerAccountId') : ''
      };
      console.warn(
        'AGIS: could not resolve license issuer Mongo id. Inspect window.__AGIS_LICENSE_ISSUER_DEBUG and Network → deriveAccountFromHostname JSON.'
      );
    } catch (e) {
      /* ignore */
    }
  }
  return id;
};

const syncToLicenses = async () => {
  if (typeof isWordpress !== 'undefined' && isWordpress) {
    await ensureWordpressAccountAndCookie();
  }
  const currentAccount = getResolvedAccountId();
  console.log('syncToLicenses for account: ' + currentAccount);

  let postUrl = `${serverUrl}/api/syncToLicenses`;
  console.log('Using postUrl:' + postUrl);

  return new Promise((resolve) => {
    jQuery.ajax({
      url: postUrl,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ account: currentAccount }),
      success: function (data) {
        console.log('License data returned:', data);
        resolve(data);
      },
      error: function (xhr, status, error) {
        console.error('Error fetching domains:', error);
        alert('An error occurred while fetching domains.');
        resolve([]);
      }
    });
  });
};

const getDomainsByAccount = async () => {
  if (typeof isWordpress !== 'undefined' && isWordpress) {
    await ensureWordpressAccountAndCookie();
  }

  const currentAccount = getResolvedAccountId();

  if (!isValidAccountId(currentAccount)) {
    console.warn('getDomainsByAccount: no valid account; returning empty domain list');
    return [];
  }

  syncResolvedAccountGlobals(currentAccount);

  console.log('Getting domains by account');
  console.log('Getting domains for account: ' + currentAccount);

  let postUrl = `${serverUrl}/api/getDomainsByAccount`;
  console.log('Using postUrl:' + postUrl);

  return new Promise((resolve) => {
    jQuery.ajax({
      url: postUrl,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ account: currentAccount }),
      success: function (data) {
        resolve(data);
      },
      error: function (xhr, status, error) {
        console.error('Error fetching domains:', error);
        alert('An error occurred while fetching domains.');
        resolve([]);
      }
    });
  });
};

const setSection = (section) => {
  const url = new URL(window.location);
  url.searchParams.set('section', section);
  window.history.pushState({ section }, '', url);
};

const setSubSection = (subSection) => {
  const url = new URL(window.location);
  url.searchParams.set('subSection', subSection);
  window.history.pushState({ subSection }, '', url);
  console.log('Set subsection:' + subSection);
};

const setDomain = (domain) => {
  const url = new URL(window.location);
  url.searchParams.set('domain', domain);
  window.history.pushState({ domain }, '', url);
  setCookie('domain', domain, 1);
  console.log('Set domain:' + domain);
};

const populateDomainSelect = async () => {
  let selectBox = jQuery('#availableDomains');

  try {
    let domains = await getDomainsByAccount();
    console.log('Domains:', domains);

    selectBox.empty();
    selectBox.append('<option value="">Select a domain</option>');

    domains.forEach(domain => {
      selectBox.append(`<option value="${domain}">${domain}</option>`);
    });

    setupDomainChange();
    translateDomainQuery();

    if (domains.length === 1) {
      const onlyDomain = domains[0];
      selectBox.val(onlyDomain).trigger('change');
      console.log(`Auto-selected domain: ${onlyDomain}`);
    }
  } catch (error) {
    console.error('Error fetching domains:', error);
    selectBox.empty().append('<option value="">Failed to load domains</option>');
  }
};

const setupDomainChange = () => {
  jQuery('#availableDomains').change(function () {
    let currentDomain = jQuery('#availableDomains').val();
    console.log('New domain: ' + currentDomain);
    setDomain(currentDomain);
  });
};

const translateDomainQuery = () => {
  const params = new URLSearchParams(window.location.search);
  const selectedDomain = params.get('domain');

  if (selectedDomain && selectedDomain.length > 0) {
    setDomain(selectedDomain);
    console.log('Selected domain from query:' + selectedDomain);
    if (jQuery('#availableDomains').length) {
      jQuery('#availableDomains').val(selectedDomain);
    }
    return;
  }

  const cookieDomain = getCookie('domain') || '';
  console.log('No domain query param; keeping cookie domain:' + cookieDomain);
  if (jQuery('#availableDomains').length && cookieDomain) {
    jQuery('#availableDomains').val(cookieDomain);
  }
};

const wait = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const getWordpressDomain = () => {
  let hostname = window.location.hostname.replace('www.', '');
  console.log('Using wordpress and extracting domain from url. Host:' + hostname);
  return [hostname];
};

const capitalize = (str) => {
  let newstr = str.trim();
  let capitalized = newstr.charAt(0).toUpperCase() + newstr.slice(1);
  return capitalized;
};

const processPrepaymentUserRequest = async (prepaymentDomain, prepaymentLicenseType) => {
  console.log('Processing prepayment user request for domain ' + prepaymentDomain + ' as ' + prepaymentLicenseType);

  if (prepaymentLicenseType.toLowerCase() === 'audio') {
    console.log('Enabling audio for user');
    await updateVoiceEnabled(prepaymentDomain, true);
    setCookie(
      'serverNotification',
      `<span style="color: green;"><b>${prepaymentLicenseType} has been enabled for ${prepaymentDomain}!</b><span>`,
      1
    );
    window.location.reload();
  } else {
    console.log('No valid license found to activate');
  }
};

const processReturnFromStripe = async () => {
  let prepaymentUrl = getCookie('prepaymentUrl');
  let prepaymentDomain = getCookie('prepaymentDomain');
  let prepaymentLicenseType = getCookie('prepaymentLicenseType');

  console.log('Unsetting prepayment url');
  setCookie('prepaymentUrl', undefined, 1);
  console.log('Syncing licenses');
  await syncToLicenses();
  console.log('Processing prepay request');
  await processPrepaymentUserRequest(prepaymentDomain, prepaymentLicenseType);

  console.log(`I am back to enabling ${prepaymentLicenseType} for ${prepaymentDomain}`);
};

const translateQueryParameters = async () => {
  const cookieAccount = getValidAccountFromCookie();

  if (!cookieAccount) {
    console.log('No account or empty account - checking auth');
    if (typeof window.checkAuth === 'function') {
      await window.checkAuth();
    } else {
      console.warn('checkAuth is not available on this page.');
      return;
    }
  }

  console.log('Checking for returning from prepayment');
  let prepaymentUrl = getCookie('prepaymentUrl');

  if (prepaymentUrl) {
    if (window.location.href.indexOf('NewAccount') >= 0) {
      setCookie('prepaymentUrl', '', 1);
      console.log('Had abandoned cart - but on new account. clearing');
    } else {
      if (prepaymentUrl !== 'undefined' && prepaymentUrl !== '') {
        if (window.location.href !== prepaymentUrl && window.location.href + '#' !== prepaymentUrl) {
          console.log('I have a cookie set for prepayment from stripe');
          processReturnFromStripe();
          return;
        }
      }
    }
  }

  console.log('Translating query parameters');
  const params = new URLSearchParams(window.location.search);
  let section = params.get('section') || '';
  const subSection = params.get('subSection') || '';

  console.log('Section: ' + section);
  console.log('subSection: ' + subSection);

  if (!section) {
    section = 'accounts';
    console.log('No section specified. Hard setting to accounts');
  }

  const hasLoadPage = typeof window.loadPage === 'function';

  switch (section) {
    case "accounts":
      if (!hasLoadPage) {
        console.warn('loadPage is not defined; skipping accounts route.');
        break;
      }
      window.loadPage('tab-webpages');
      if (typeof window.loadSection_Accounts === 'function') {
        window.loadSection_Accounts(subSection);
      }
      break;

    case "files":
      if (!hasLoadPage) {
        console.warn('loadPage is not defined; skipping files route.');
        break;
      }
      window.loadPage('tab-files');
      if (typeof window.loadSection_Files === 'function') {
        window.loadSection_Files(subSection);
      }
      break;

    case "transcripts":
      if (!hasLoadPage) {
        console.warn('loadPage is not defined; skipping transcripts route.');
        break;
      }
      window.loadPage('tab-transcripts');
      if (typeof window.loadSection_Transcripts === 'function') {
        window.loadSection_Transcripts(subSection);
      }
      break;

    case "profile":
      if (typeof window.profileEntry === 'function') {
        window.profileEntry();
      } else {
        console.warn('profileEntry is not defined.');
      }
      break;

    case "billing":
      if (typeof window.billingEntry === 'function') {
        window.billingEntry();
      } else {
        console.warn('billingEntry is not defined.');
      }
      break;

    case "testing":
      if (!hasLoadPage) {
        console.warn('loadPage is not defined; skipping testing route.');
        break;
      }
      window.loadPage('tab-testing');
      console.log('Loading subsection for testing');
      if (typeof window.loadSection_Testing === 'function') {
        window.loadSection_Testing(subSection);
      }
      break;

    case "advanced":
      if (!hasLoadPage) {
        console.warn('loadPage is not defined; skipping advanced route.');
        break;
      }
      window.loadPage('tab-advanced');
      if (typeof window.loadSection_Advanced === 'function') {
        window.loadSection_Advanced(subSection);
      }
      break;

    case "lookAndFeel":
      if (!hasLoadPage) {
        console.warn('loadPage is not defined; skipping lookAndFeel route.');
        break;
      }
      window.loadPage('tab-lookfeel');
      if (typeof window.loadSection_LookAndFeel === 'function') {
        window.loadSection_LookAndFeel(subSection);
      }
      break;

    case "analytics":
      if (!hasLoadPage) {
        console.warn('loadPage is not defined; skipping analytics route.');
        break;
      }
      window.loadPage('tab-analytics');
      break;

    default:
      console.log('No section specified');
  }

  let currentDomain = getCookie('domain');
  if (currentDomain && currentDomain.length > 1) {
    console.log('Current domain: ' + currentDomain);
    if (jQuery('#availableDomains').length) {
      jQuery('#availableDomains').val(currentDomain);
    }
  }

  if (subSection) {
    console.log('Subsection: ' + subSection);
    jQuery('.custom-options-bar .btn').removeClass('active');
    jQuery('#' + subSection).addClass('active');
  }
};

// ─── Shared Utility Helpers ───────────────────────────────────────────────────

const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const escapeAttr = (value) => {
  return escapeHtml(value).replace(/\n/g, ' ');
};

const formatDateTime = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch (e) {
    return String(value);
  }
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return true;
  }
};

const formatTimeUTC = (isoString) => {
  if (!isoString) return 'Never';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const rgbToHex = (rgb) => {
  if (!rgb) {
    console.warn('rgbToHex received an empty value!');
    return '#000000';
  }
  if (rgb === 'transparent') {
    console.warn("Received 'transparent', defaulting to white.");
    return '#ffffff';
  }
  let match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*(\d?.\d+)?\)$/);
  if (!match) {
    console.warn('Unexpected color format:', rgb);
    return '#000000';
  }
  let r = parseInt(match[1]);
  let g = parseInt(match[2]);
  let b = parseInt(match[3]);
  let alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
  if (alpha < 0.1) {
    console.warn(`Color ${rgb} is nearly transparent, defaulting to white.`);
    return '#ffffff';
  }
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// ──────────────────────────────────────────────────────────────────────────────
// Expose shared helpers globally for other JS files
// ─────────────────────────────────────────────────────────────────────────────-

window.setCookie = setCookie;
window.getCookie = getCookie;
window.showModal = showModal;
window.showUpgradeModal = showUpgradeModal;
window.hideModal = hideModal;
window.getAccount = getAccount;
window.isValidAccountId = isValidAccountId;
window.isMongoObjectIdString = isMongoObjectIdString;
window.normalizeSiteAccountKey = normalizeSiteAccountKey;
window.normalizeAccountForStorage = normalizeAccountForStorage;
window.getLicenseIssuerXAccountId = getLicenseIssuerXAccountId;
window.persistIssuerAccountIdFromDerive = persistIssuerAccountIdFromDerive;
window.getValidAccountFromCookie = getValidAccountFromCookie;
window.getResolvedAccountId = getResolvedAccountId;
window.getAccountKeyForDomainApis = getAccountKeyForDomainApis;
window.syncResolvedAccountGlobals = syncResolvedAccountGlobals;
window.ensureWordpressAccountAndCookie = ensureWordpressAccountAndCookie;
window.clearAccountCookie = clearAccountCookie;
window.clearIssuerCookieOnly = clearIssuerCookieOnly;
window.setLicenseIssuerIdIfValid = setLicenseIssuerIdIfValid;
window.deriveAccountFromWordpress = deriveAccountFromWordpress;
window.ensureLicenseIssuerFromServer = ensureLicenseIssuerFromServer;
window.resolveLicenseIssuerFromAlternateApis = resolveLicenseIssuerFromAlternateApis;
window.syncToLicenses = syncToLicenses;
window.getDomainsByAccount = getDomainsByAccount;
window.setSection = setSection;
window.setSubSection = setSubSection;
window.setDomain = setDomain;
window.populateDomainSelect = populateDomainSelect;
window.setupDomainChange = setupDomainChange;
window.translateDomainQuery = translateDomainQuery;
window.wait = wait;
window.getWordpressDomain = getWordpressDomain;
window.capitalize = capitalize;
window.processPrepaymentUserRequest = processPrepaymentUserRequest;
window.processReturnFromStripe = processReturnFromStripe;
window.translateQueryParameters = translateQueryParameters;
window.escapeHtml = escapeHtml;
window.escapeAttr = escapeAttr;
window.formatDateTime = formatDateTime;
window.copyToClipboard = copyToClipboard;
window.formatTimeUTC = formatTimeUTC;
window.rgbToHex = rgbToHex;

jQuery(document).ready(() => {
  if (typeof window.loadPage !== 'function') {
    console.warn('Skipping translateQueryParameters because loadPage is not available on this page.');
    return;
  }

  translateQueryParameters();
});