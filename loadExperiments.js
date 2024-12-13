// initialize posthog
!function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement("script")).type = "text/javascript", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e }, u.people.toString = function () { return u.toString(1) + ".people (stub)" }, o = "capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId setPersonProperties".split(" "), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);
/* murmurhash3js v3.0.1 MIT License
(c) 2012-2015 Karan Lyons 
Maintainer: Sascha Droste http://pid.github.io/murmurHash3js/ */
!function (a, b) { "use strict"; function c(a, b) { return (65535 & a) * b + (((a >>> 16) * b & 65535) << 16) } function d(a, b) { return a << b | a >>> 32 - b } function e(a) { return a ^= a >>> 16, a = c(a, 2246822507), a ^= a >>> 13, a = c(a, 3266489909), a ^= a >>> 16 } function f(a, b) { a = [a[0] >>> 16, 65535 & a[0], a[1] >>> 16, 65535 & a[1]], b = [b[0] >>> 16, 65535 & b[0], b[1] >>> 16, 65535 & b[1]]; var c = [0, 0, 0, 0]; return c[3] += a[3] + b[3], c[2] += c[3] >>> 16, c[3] &= 65535, c[2] += a[2] + b[2], c[1] += c[2] >>> 16, c[2] &= 65535, c[1] += a[1] + b[1], c[0] += c[1] >>> 16, c[1] &= 65535, c[0] += a[0] + b[0], c[0] &= 65535, [c[0] << 16 | c[1], c[2] << 16 | c[3]] } function g(a, b) { a = [a[0] >>> 16, 65535 & a[0], a[1] >>> 16, 65535 & a[1]], b = [b[0] >>> 16, 65535 & b[0], b[1] >>> 16, 65535 & b[1]]; var c = [0, 0, 0, 0]; return c[3] += a[3] * b[3], c[2] += c[3] >>> 16, c[3] &= 65535, c[2] += a[2] * b[3], c[1] += c[2] >>> 16, c[2] &= 65535, c[2] += a[3] * b[2], c[1] += c[2] >>> 16, c[2] &= 65535, c[1] += a[1] * b[3], c[0] += c[1] >>> 16, c[1] &= 65535, c[1] += a[2] * b[2], c[0] += c[1] >>> 16, c[1] &= 65535, c[1] += a[3] * b[1], c[0] += c[1] >>> 16, c[1] &= 65535, c[0] += a[0] * b[3] + a[1] * b[2] + a[2] * b[1] + a[3] * b[0], c[0] &= 65535, [c[0] << 16 | c[1], c[2] << 16 | c[3]] } function h(a, b) { return b %= 64, 32 === b ? [a[1], a[0]] : 32 > b ? [a[0] << b | a[1] >>> 32 - b, a[1] << b | a[0] >>> 32 - b] : (b -= 32, [a[1] << b | a[0] >>> 32 - b, a[0] << b | a[1] >>> 32 - b]) } function i(a, b) { return b %= 64, 0 === b ? a : 32 > b ? [a[0] << b | a[1] >>> 32 - b, a[1] << b] : [a[1] << b - 32, 0] } function j(a, b) { return [a[0] ^ b[0], a[1] ^ b[1]] } function k(a) { return a = j(a, [0, a[0] >>> 1]), a = g(a, [4283543511, 3981806797]), a = j(a, [0, a[0] >>> 1]), a = g(a, [3301882366, 444984403]), a = j(a, [0, a[0] >>> 1]) } var l = { version: "3.0.1", x86: {}, x64: {} }; l.x86.hash32 = function (a, b) { a = a || "", b = b || 0; for (var f = a.length % 4, g = a.length - f, h = b, i = 0, j = 3432918353, k = 461845907, l = 0; g > l; l += 4)i = 255 & a.charCodeAt(l) | (255 & a.charCodeAt(l + 1)) << 8 | (255 & a.charCodeAt(l + 2)) << 16 | (255 & a.charCodeAt(l + 3)) << 24, i = c(i, j), i = d(i, 15), i = c(i, k), h ^= i, h = d(h, 13), h = c(h, 5) + 3864292196; switch (i = 0, f) { case 3: i ^= (255 & a.charCodeAt(l + 2)) << 16; case 2: i ^= (255 & a.charCodeAt(l + 1)) << 8; case 1: i ^= 255 & a.charCodeAt(l), i = c(i, j), i = d(i, 15), i = c(i, k), h ^= i }return h ^= a.length, h = e(h), h >>> 0 }, l.x86.hash128 = function (a, b) { a = a || "", b = b || 0; for (var f = a.length % 16, g = a.length - f, h = b, i = b, j = b, k = b, l = 0, m = 0, n = 0, o = 0, p = 597399067, q = 2869860233, r = 951274213, s = 2716044179, t = 0; g > t; t += 16)l = 255 & a.charCodeAt(t) | (255 & a.charCodeAt(t + 1)) << 8 | (255 & a.charCodeAt(t + 2)) << 16 | (255 & a.charCodeAt(t + 3)) << 24, m = 255 & a.charCodeAt(t + 4) | (255 & a.charCodeAt(t + 5)) << 8 | (255 & a.charCodeAt(t + 6)) << 16 | (255 & a.charCodeAt(t + 7)) << 24, n = 255 & a.charCodeAt(t + 8) | (255 & a.charCodeAt(t + 9)) << 8 | (255 & a.charCodeAt(t + 10)) << 16 | (255 & a.charCodeAt(t + 11)) << 24, o = 255 & a.charCodeAt(t + 12) | (255 & a.charCodeAt(t + 13)) << 8 | (255 & a.charCodeAt(t + 14)) << 16 | (255 & a.charCodeAt(t + 15)) << 24, l = c(l, p), l = d(l, 15), l = c(l, q), h ^= l, h = d(h, 19), h += i, h = c(h, 5) + 1444728091, m = c(m, q), m = d(m, 16), m = c(m, r), i ^= m, i = d(i, 17), i += j, i = c(i, 5) + 197830471, n = c(n, r), n = d(n, 17), n = c(n, s), j ^= n, j = d(j, 15), j += k, j = c(j, 5) + 2530024501, o = c(o, s), o = d(o, 18), o = c(o, p), k ^= o, k = d(k, 13), k += h, k = c(k, 5) + 850148119; switch (l = 0, m = 0, n = 0, o = 0, f) { case 15: o ^= a.charCodeAt(t + 14) << 16; case 14: o ^= a.charCodeAt(t + 13) << 8; case 13: o ^= a.charCodeAt(t + 12), o = c(o, s), o = d(o, 18), o = c(o, p), k ^= o; case 12: n ^= a.charCodeAt(t + 11) << 24; case 11: n ^= a.charCodeAt(t + 10) << 16; case 10: n ^= a.charCodeAt(t + 9) << 8; case 9: n ^= a.charCodeAt(t + 8), n = c(n, r), n = d(n, 17), n = c(n, s), j ^= n; case 8: m ^= a.charCodeAt(t + 7) << 24; case 7: m ^= a.charCodeAt(t + 6) << 16; case 6: m ^= a.charCodeAt(t + 5) << 8; case 5: m ^= a.charCodeAt(t + 4), m = c(m, q), m = d(m, 16), m = c(m, r), i ^= m; case 4: l ^= a.charCodeAt(t + 3) << 24; case 3: l ^= a.charCodeAt(t + 2) << 16; case 2: l ^= a.charCodeAt(t + 1) << 8; case 1: l ^= a.charCodeAt(t), l = c(l, p), l = d(l, 15), l = c(l, q), h ^= l }return h ^= a.length, i ^= a.length, j ^= a.length, k ^= a.length, h += i, h += j, h += k, i += h, j += h, k += h, h = e(h), i = e(i), j = e(j), k = e(k), h += i, h += j, h += k, i += h, j += h, k += h, ("00000000" + (h >>> 0).toString(16)).slice(-8) + ("00000000" + (i >>> 0).toString(16)).slice(-8) + ("00000000" + (j >>> 0).toString(16)).slice(-8) + ("00000000" + (k >>> 0).toString(16)).slice(-8) }, l.x64.hash128 = function (a, b) { a = a || "", b = b || 0; for (var c = a.length % 16, d = a.length - c, e = [0, b], l = [0, b], m = [0, 0], n = [0, 0], o = [2277735313, 289559509], p = [1291169091, 658871167], q = 0; d > q; q += 16)m = [255 & a.charCodeAt(q + 4) | (255 & a.charCodeAt(q + 5)) << 8 | (255 & a.charCodeAt(q + 6)) << 16 | (255 & a.charCodeAt(q + 7)) << 24, 255 & a.charCodeAt(q) | (255 & a.charCodeAt(q + 1)) << 8 | (255 & a.charCodeAt(q + 2)) << 16 | (255 & a.charCodeAt(q + 3)) << 24], n = [255 & a.charCodeAt(q + 12) | (255 & a.charCodeAt(q + 13)) << 8 | (255 & a.charCodeAt(q + 14)) << 16 | (255 & a.charCodeAt(q + 15)) << 24, 255 & a.charCodeAt(q + 8) | (255 & a.charCodeAt(q + 9)) << 8 | (255 & a.charCodeAt(q + 10)) << 16 | (255 & a.charCodeAt(q + 11)) << 24], m = g(m, o), m = h(m, 31), m = g(m, p), e = j(e, m), e = h(e, 27), e = f(e, l), e = f(g(e, [0, 5]), [0, 1390208809]), n = g(n, p), n = h(n, 33), n = g(n, o), l = j(l, n), l = h(l, 31), l = f(l, e), l = f(g(l, [0, 5]), [0, 944331445]); switch (m = [0, 0], n = [0, 0], c) { case 15: n = j(n, i([0, a.charCodeAt(q + 14)], 48)); case 14: n = j(n, i([0, a.charCodeAt(q + 13)], 40)); case 13: n = j(n, i([0, a.charCodeAt(q + 12)], 32)); case 12: n = j(n, i([0, a.charCodeAt(q + 11)], 24)); case 11: n = j(n, i([0, a.charCodeAt(q + 10)], 16)); case 10: n = j(n, i([0, a.charCodeAt(q + 9)], 8)); case 9: n = j(n, [0, a.charCodeAt(q + 8)]), n = g(n, p), n = h(n, 33), n = g(n, o), l = j(l, n); case 8: m = j(m, i([0, a.charCodeAt(q + 7)], 56)); case 7: m = j(m, i([0, a.charCodeAt(q + 6)], 48)); case 6: m = j(m, i([0, a.charCodeAt(q + 5)], 40)); case 5: m = j(m, i([0, a.charCodeAt(q + 4)], 32)); case 4: m = j(m, i([0, a.charCodeAt(q + 3)], 24)); case 3: m = j(m, i([0, a.charCodeAt(q + 2)], 16)); case 2: m = j(m, i([0, a.charCodeAt(q + 1)], 8)); case 1: m = j(m, [0, a.charCodeAt(q)]), m = g(m, o), m = h(m, 31), m = g(m, p), e = j(e, m) }return e = j(e, [0, a.length]), l = j(l, [0, a.length]), e = f(e, l), l = f(l, e), e = k(e), l = k(l), e = f(e, l), l = f(l, e), ("00000000" + (e[0] >>> 0).toString(16)).slice(-8) + ("00000000" + (e[1] >>> 0).toString(16)).slice(-8) + ("00000000" + (l[0] >>> 0).toString(16)).slice(-8) + ("00000000" + (l[1] >>> 0).toString(16)).slice(-8) }, "undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = l), exports.murmurHash3 = l) : "function" == typeof define && define.amd ? define([], function () { return l }) : (l._murmurHash3 = a.murmurHash3, l.noConflict = function () { return a.murmurHash3 = l._murmurHash3, l._murmurHash3 = b, l.noConflict = b, l }, a.murmurHash3 = l) }(this);

// Initialize Sanity client and image builder
let gSanityClientUrl;
let gSanityCdnUrl;
let logger;
let gTotalExperiments;
let gUserId;
let gLoadedExperiments = 0;
let gPendingExperiments = [];
let gRetryTimeout = true;
let gOverride = false;
const isMobile = window.innerWidth <= 768;
const posthogHost = "https://ph.eikona.io";
const activeExperimentsHost = `https://d3fjltzrrgg4xq.cloudfront.net/production/active-experiments`;
const experimentVariantsSeed = 1234567890;
const experimentVariantsLocalStorageKey = 'eikona.experiments.variants';
const activeExperimentsLocalStorageKey = 'eikona.active.experiments';
const eikonaUserIdLocalStorageKey = 'eikona.user.id';
const maxVariantAllocationDomain = 99999;

// Function to block specified paths
function blockPage() {
  logger('blockPage was called');

  // Create style element for hiding body
  const style = document.createElement('style');
  style.innerHTML = 'body { opacity: 0 !important; }';

  const hide = () => document.head.appendChild(style);
  const show = () => style.remove();

  hide();

  // Set timeout to show body after 2s
  // if all hell broke loose
  setTimeout(() => {
    show();
    logger('Unblocked page after 2s');
  }, 2000);

  // Add unblockPage function for later use
  window.unblockPage = show;
}

const generateUUID = function () {
  // Primary method using crypto.randomUUID()
  // for modern browsers
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback using crypto.getRandomValues()
  // for older browsers
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}


function initializeSanity(projectId, dataset, apiVersion = '2024-01-01') {
  gSanityClientUrl = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`;
  gSanityCdnUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}`;
}

function urlForImage(asset, variantKey) {
  const preferedVariant = isMobile ? `${variantKey}_mobile` : variantKey;
  const source = asset[preferedVariant] ? asset[preferedVariant] : asset[variantKey];
  if (!source) {
    logger('No source for image:', asset, variantKey);
    return null;
  }
  const imageIdRaw = source.asset['_ref'];
  const imageId = imageIdRaw
    .replace('image-', '')
    .replace(/-(\w+)$/, '.$1'); // Converts ending format from -png to .png, -jpg to .jpg etc
  return `${gSanityCdnUrl}/${imageId}?auto=format`;
}

async function fetchExperimentAssets(experimentId, variantKey) {
  const query = encodeURIComponent(`*[_type == "experiment" && id == "${experimentId}"]`);
  let assets = await fetch(`${gSanityClientUrl}?query=${query}`).then(res => res.json());
  assets = assets.result;
  logger('Fetched assets for experiment:', experimentId, assets);
  // Prefetch images for relevant variant
  assets.forEach(asset => {
    if (asset[variantKey]) {
      const imageUrl = urlForImage(asset, variantKey);
      prefetchImage(imageUrl);
    }
    else {
      logger('No variant key:', variantKey, "for asset:", asset);
    }
  });

  return assets;
}

function generateUserId() {
  if (localStorage.getItem(eikonaUserIdLocalStorageKey)) {
    return localStorage.getItem(eikonaUserIdLocalStorageKey);
  }
  const userId = generateUUID();
  localStorage.setItem(eikonaUserIdLocalStorageKey, userId);
  return userId;
}

function dynamoDBRecordToJSON(record) {
  if (!record || typeof record !== 'object') {
    return null;
  }
  const result = {};

  for (const [key, value] of Object.entries(record)) {
    // Get the first key of the value object which represents the DynamoDB type
    const type = key === 'M' ? key : Object.keys(value)[0];

    switch (type) {
      case 'S':
        result[key] = value.S; // String
        break;
      case 'N':
        result[key] = Number(value.N); // Number
        break;
      case 'BOOL':
        result[key] = value.BOOL; // Boolean
        break;
      case 'NULL':
        result[key] = null;
        break;
      case 'L':
        result[key] = value.L.map(item => dynamoDBRecordToJSON(item)); // List
        break;
      case 'M':
        const subResult = dynamoDBRecordToJSON(value);
        Object.keys(subResult).forEach(key => {
          result[key] = subResult[key];
        });
        break;
      case 'SS':
        result[key] = value.SS; // String Set
        break;
      case 'NS':
        result[key] = value.NS.map(n => Number(n)); // Number Set
        break;
      default:
        return value;
    }
  }

  return result;
}

function getCachedActiveExperiments(customerId) {
  const cached = localStorage.getItem(activeExperimentsLocalStorageKey);
  if (!cached) return null;

  const parsedCache = JSON.parse(cached);
  return parsedCache.customerId === customerId ? parsedCache : null;
}

async function fetchAndCacheActiveExperiments(customerId) {
  const experiments = await fetch(`${activeExperimentsHost}/${customerId}`)
    .then(res => res.json())
    .then(json => dynamoDBRecordToJSON(json["Items"][0]));

  localStorage.setItem(activeExperimentsLocalStorageKey, JSON.stringify({
    ...experiments,
    customerId,
    timestamp: Date.now()
  }));

  return experiments;
}

/**
 * Initialize and load experiments
 * @param {string} customerId - The customer ID
 * @param {boolean} enableLogging - Whether to enable logging
 */
async function initializeAndLoadExperiments(customerId, enableLogging = false) {
  logger = enableLogging ? console.log.bind(console) : () => { };

  blockPage();

  // Get active experiments from cache or fetch them
  let activeExperiments = getCachedActiveExperiments(customerId);
  if (!activeExperiments) {
    activeExperiments = await fetchAndCacheActiveExperiments(customerId);
  }

  logger('Active experiments:', activeExperiments);
  const posthogToken = activeExperiments.posthog_token;
  const sanityProjectId = activeExperiments.sanity_project;
  const dataset = activeExperiments.env;
  const experimentsConfigs = activeExperiments.experiments;
  const pagesWithExperiments = experimentsConfigs.map(config => config.sitePath);
  if (pagesWithExperiments.length === 0) {
    logger('No experiments found for this page');
    unblockPage();
    return;
  }

  gUserId = generateUserId();

  // Only initialize PostHog if it hasn't been initialized yet
  if (!window.posthog.__loaded) {
    logger('Initializing PostHog...');
    const experimentsVariants = evaluateExperimentVariants(experimentsConfigs);
    logger('Evaluated experiment variants:', experimentsVariants);
    posthog.init(posthogToken, {
      api_host: posthogHost,
      person_profiles: 'always',
      enable_heatmaps: true,
      loaded: (posthog) => {
        logger('PostHog initialized');
        posthog.featureFlags.override(experimentsVariants);
      }
    });
  }
  // Initialize Sanity
  initializeSanity(sanityProjectId, dataset);

  // Function to load experiments
  function loadExperimentsWhenReady() {
    logger('Loading experiments...');
    try {
      loadExperiments(experimentsConfigs);
    } catch (error) {
      logger('Error initializing or loading experiments:', error);
      unblockPage();
    }
  }

  loadExperimentsWhenReady();

  // Set a flag to indicate that loadExperiments has been initialized
  window.loadExperimentsInitialized = true;
}

const getElementSizeOnScreen = (element) => {
  const rect = element.getBoundingClientRect();
  let width = Math.round(rect.width);
  let height = Math.round(rect.height);

  if (width === 0 || height === 0) {
    width = Math.round(element.offsetWidth);
    height = Math.round(element.offsetHeight);
  }

  return { width, height };
}

const addCopy = (div, asset) => {
  createBanner(div, {
    shape: isMobile ? asset.copyTypeMobile : asset.copyType,
    text: asset.copyText,
    subText: asset.copySubtext,
    textColor: asset.copyTextColor,
    subTextColor: asset.copySubtextColor,
    shapeColor: asset.copyShapeColor,
    textSize: isMobile ? asset.copyTextSizeMobile : asset.copyTextSize,
    subTextSize: isMobile ? asset.copySubtextSizeMobile : asset.copySubtextSize,
    textFont: asset.copyFont,
    textShadowStrength: asset.copyTextShadowStrength,
    buttons: asset.buttons,
  });
}

function prefetchImage(url) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.fetchpriority = 'high';
    link.importance = 'high';
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}


function getExperimentAudience(experimentConfig) {
  // TODO: implement this
  return 'global';
}

function getFQExperimentId(experimentConfig) {
  const experimentAudience = getExperimentAudience(experimentConfig);
  return experimentAudience === 'global' ? experimentConfig.expId : `${experimentConfig.expId}-${experimentAudience}`;
}
function generateHash() {
  // generate a hash between 0 and maxVariantAllocationDomain
  const hash = murmurHash3.x86.hash32(gUserId, experimentVariantsSeed) / (2 ** 32 - 1);
  logger('Generated hash:', hash);
  return Math.floor(maxVariantAllocationDomain * hash);
}

function chooseRandomIndex(variants) {
  const hash = generateHash();
  for (let i = 0; i < variants.length; i++) {
    const [minAllocation, maxAllocation] = variants[i].allocation;
    logger('Checking variant:', variants[i], 'with allocation:', minAllocation, maxAllocation);
    if (hash >= minAllocation && hash <= maxAllocation) {
      return i;
    }
  }
  return variants.length - 1;
}
function evaluateExperimentVariants(experimentsConfigs) {
  if (localStorage.getItem(experimentVariantsLocalStorageKey)) {
    return JSON.parse(localStorage.getItem(experimentVariantsLocalStorageKey));
  }
  results = {};
  experimentsConfigs.forEach(config => {
    const expFQId = getFQExperimentId(config);
    const audience = getExperimentAudience(config);
    const variants = config.variant_groups.find(group => group.audience_id === audience).variants;
    if (variants.length > 0) {
      const randomIndex = chooseRandomIndex(variants);
      results[expFQId] = variants[randomIndex]["id"];
    }
  });
  // Store variants in local storage
  localStorage.setItem(experimentVariantsLocalStorageKey, JSON.stringify(results));
  return results;
}

function getExperimentVariant(experimentConfig) {
  const expFQId = getFQExperimentId(experimentConfig);
  const variants = JSON.parse(localStorage.getItem(experimentVariantsLocalStorageKey) || '{}');
  // update posthog about feature flag variant
  try {
    posthog.getFeatureFlag(expFQId);
  } catch (error) {
    logger('Error updating PostHog:', error);
  }

  const variant = variants[expFQId];
  if (!variant) {
    logger('No variant found for experiment:', expFQId);
    return undefined;
  }
  const variantKey = variant === 'control' ? variant : `variant_${variant.slice(-1)}`;
  return variantKey;
}

function lockElementProperty(element, property, value) {
  if (gOverride) {
    // allow override multiple timesfor testing
    return;
  }
  Object.defineProperty(element, property, {
    value: value,
    writable: false,
    configurable: false
  });
}

function handleImgTag(element, asset, elementSize, isMobileAsset, imageUrl) {
  if (asset.copyType !== 'none') {
    const parentDiv = document.createElement('div');
    parentDiv.style.position = 'relative';
    if (elementSize.width > 0 && elementSize.height > 0 && !isMobileAsset) {
      parentDiv.style.width = `${elementSize.width}px`;
      parentDiv.style.height = `${elementSize.height}px`;
    }
    element.parentNode.insertBefore(parentDiv, element);
    parentDiv.appendChild(element);

    const copyDiv = document.createElement('div');
    copyDiv.style.position = 'absolute';
    copyDiv.style.top = '0';
    copyDiv.style.left = '0';
    copyDiv.style.width = '100%';
    copyDiv.style.height = '100%';
    parentDiv.appendChild(copyDiv);
    addCopy(copyDiv, asset);
  }
  element.src = imageUrl;
  element.srcset = "";
  element.style.objectFit = 'cover';
  const sourceElement = element.parentElement.querySelector('source');
  if (sourceElement) {
    sourceElement.remove();
  }
  lockElementProperty(element, 'src', imageUrl);
}

function handleDivTag(element, asset, elementSize, isMobileAsset, imageUrl) {
  const backgroundImage = `url('${imageUrl}')`;
  element.style.backgroundImage = backgroundImage;
  element.style.backgroundRepeat = 'no-repeat';
  element.style.backgroundPosition = 'center';
  element.style.backgroundSize = !isMobileAsset ? 'cover' : 'contain';
  element.dataset.bg = "";
  element.dataset.bgHidpi = "";
  if (asset.copyType !== 'none') {
    addCopy(element, asset);
  }
  lockElementProperty(element, 'backgroundImage', backgroundImage);
}

function handleVideoTag(element, asset, elementSize, isMobileAsset, imageUrl) {
  const parentElement = element.parentNode;
  const img = document.createElement('img');
  img.src = imageUrl;
  img.id = parentElement.id;
  img.alt = parentElement.getAttribute('alt') || '';
  img.className = parentElement.className;
  lockElementProperty(img, 'src', imageUrl);
  // preserve the original image size
  if (elementSize.width > 0 && elementSize.height > 0 && !isMobileAsset) {
    img.style.width = `${elementSize.width}px`;
    img.style.height = `${elementSize.height}px`;
  }
  if (parentElement.tagName.toLowerCase() === 'video-section') {
    // Replace the video-section with an image
    parentElement.parentNode.replaceChild(img, parentElement);
  } else {
    // Replace just the video element with an image
    element.parentNode.replaceChild(img, element);
  }
}


function checkAllExperimentsLoadedAndUnblockPage() {
  if (gLoadedExperiments === gTotalExperiments) {
    unblockPage();
  }
}

function incrementLoadedExperiments() {
  gLoadedExperiments++;
  checkAllExperimentsLoadedAndUnblockPage();
}

function createLoadImagePromise(imageUrl, element) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      incrementLoadedExperiments();
      logger(`Full element tag:`, element);
      resolve();
    };
    img.onerror = (error) => {
      console.error(`Failed to load image for experiment:`, error);
      reject(error);
    };
    img.src = imageUrl;
  });
}

function evaluateElementsStructure(elementStructure) {
  if (!elementStructure || !Array.isArray(elementStructure)) {
    return { elements: [], requiresReload: false };
  }

  function evaluateSingleStructure(structure) {
    if (structure.operator && Array.isArray(structure.elements)) {
      if (structure.operator === 'xpath' && Array.isArray(structure.elements)) {
        const results = structure.elements
          .map(xpath => evaluateXPathWithFallback(xpath))
          .filter(result => result && result.length > 0)
          .reduce((acc, curr) => acc.concat(curr), []);

        return {
          elements: results,
          requiresReload: structure.allow_lazy_load && results.length === 0
        };
      }

      const subResults = structure.elements.map(element => evaluateSingleStructure(element));

      if (structure.operator.toLowerCase() === 'and') {
        // combine all non-empty results for AND
        // if any of the results require a reload, the entire structure requires a reload
        // if any of the results are empty without a reload, the entire structure is empty
        let andElements = [];
        let requiresReload = false;
        for (const result of subResults) {
          if (result.elements.length > 0) {
            andElements = andElements.concat(result.elements);
          } else {
            if (result.requiresReload) {
              requiresReload = true;
            }
            else {
              return { elements: [], requiresReload: true };
            }
          }
        }
        return { elements: andElements, requiresReload: requiresReload };
      }

      if (structure.operator.toLowerCase() === 'or') {
        // combine all the non-empty results for OR
        // if any of the results require a reload, the entire structure requires a reload
        const combinedElements = subResults.reduce((acc, curr) => acc.concat(curr.elements), []);
        return {
          elements: combinedElements,
          requiresReload: subResults.some(r => r.requiresReload)
        };
      }
    }

    return { elements: [], requiresReload: false };
  }

  if (elementStructure.length !== 1) {
    logger('Element structure has more then 1 root elements: ', elementStructure.length);
    return { elements: [], requiresReload: false };
  }
  const results = evaluateSingleStructure(elementStructure[0]);

  return results;
}

async function processExperiment(experimentConfig) {
  const {
    expId = '',
    elements = [],
    sitePath = '',
    textXPaths = [],
    audiences = [],
    variants = [],
  } = experimentConfig;

  // fetch variant key
  const variantKey = getExperimentVariant(experimentConfig);
  if (variantKey === undefined) {
    logger(`Experiment not found: ${expId}`);
    incrementLoadedExperiments();
    return;
  }

  logger('Experiment variant:', expId, variantKey);
  if (variantKey === 'control') {
    incrementLoadedExperiments();
    return;
  }

  // fetch assets for the experiment
  const FQExpId = getFQExperimentId(experimentConfig);
  logger('Fetching assets for experiment:', FQExpId, 'with variant:', variantKey);
  const experimentAssets = await fetchExperimentAssets(FQExpId, variantKey);
  if (!experimentAssets) {
    logger(`No assets found for experiment ${expId}`);
    incrementLoadedExperiments();
    return;
  }

  const foundElements = evaluateElementsStructure(elements);
  logger('Found elements for experiment:', expId, foundElements);
  if (foundElements.elements.length === 0 || foundElements.requiresReload) {
    logger(`Experiment ${expId} requires reload`);
    gPendingExperiments.push(experimentConfig);
    if (foundElements.elements.length === 0) {
      logger(`No elements found for experiment ${expId}`);
      if (foundElements.requiresReload) {
        // this is HACKY and wrong.
        // we should increment by the number of experiments
        // that require a reload and not just 1
        incrementLoadedExperiments();
      }
      return;
    }
  }
  const nofElements = foundElements.elements.length;

  let textElements = [];
  textXPaths.forEach(xpath => {
    const matchingElements = evaluateXPathWithFallback(xpath);
    textElements = textElements.concat(matchingElements);
  });

  logger('Found text elements for experiment:', expId, textElements);
  removeTextFromElements(textElements);

  // check assets constraints and experiment type
  const nofAssets = experimentAssets.length;
  const isBroadcastExperiment = nofAssets === 1 && nofElements > 1;
  const isMultiAssetExperiment = nofAssets > 1 && nofElements === nofAssets;
  const isMultiAssetBroadcastExperiment = nofAssets > 1 && nofElements > nofAssets;
  const isSingleAssetExperiment = nofAssets === 1 && nofElements === 1;
  logger('Experiment type: nof', expId, {
    isBroadcastExperiment,
    isMultiAssetExperiment,
    isSingleAssetExperiment,
    isMultiAssetBroadcastExperiment
  });
  if (!isBroadcastExperiment && !isMultiAssetExperiment && !isSingleAssetExperiment && !isMultiAssetBroadcastExperiment) {
    console.warn(`Mismatch in experiment ${expId}: ${nofAssets} assets for ${nofElements} elements`);
    incrementLoadedExperiments();
    return;
  }

  // process assets for the experiment and update the DOM
  for (const asset of experimentAssets) {
    const imageUrl = urlForImage(asset, variantKey);
    // mobile assets are optional
    const isMobileAsset = isMobile ? asset.hasOwnProperty(`${variantKey}_mobile`) : false;
    if (imageUrl) {
      const assetId = asset.id;
      logger('Processing asset:', assetId, 'for experiment:', expId);
      foundElements.elements.forEach(element => {
        logger('Processing element:', element, 'for experiment:', expId);
        // check that we are changing the right element
        // (the experiments in the CMS have the same ID or alt text as the elements)
        // TODO: enable multi-asset experiments with xpath in sanity
        if (isSingleAssetExperiment || isBroadcastExperiment) {
          const tagName = element.tagName.toLowerCase();
          const elementSize = getElementSizeOnScreen(element);
          // preserve the original image size
          // only if not a mobile asset
          if (elementSize.width > 0 && elementSize.height > 0 && !isMobileAsset) {
            element.style.width = `${elementSize.width}px`;
            element.style.height = `${elementSize.height}px`;
          }
          // change the element to the new image
          // each element type has a different way to change the image
          if (['img', 'div', 'video', 'section'].includes(tagName)) {
            if (tagName === 'img') {
              handleImgTag(element, asset, elementSize, isMobileAsset, imageUrl);
            } else if (tagName === 'div' || tagName === 'section') {
              handleDivTag(element, asset, elementSize, isMobileAsset, imageUrl);
            } else if (tagName === 'video') {
              handleVideoTag(element, asset, elementSize, isMobileAsset, imageUrl);
            }
            const loadImagePromise = createLoadImagePromise(imageUrl, element);
            loadImagePromise.then(() => {
              logger(`Image loaded successfully for experiment ${expId}`);
            });
          } else {
            console.warn(`Unsupported element type for experiment ${expId}: ${tagName}`);
          }
        }
      });
    }
  }
}

function setupRetryMutationObserver() {
  logger('Setting up retry mutation observer, experiments pending:', gPendingExperiments);
  // Only set up once
  if (window._experimentObserver) return;

  // Wait for body to be available
  if (!document.body) {
    logger('Waiting for body to be available');
    document.addEventListener('DOMContentLoaded', () => setupRetryMutationObserver());
    return;
  }

  const observer = new MutationObserver(() => {
    logger('Mutation observer triggered');
    logger('Pending experiments:', gPendingExperiments);
    // prevent infinite loops
    observer.disconnect();
    window._experimentObserver = null;
    const experimentsToRetry = gPendingExperiments;
    gPendingExperiments = [];
    loadExperiments(experimentsToRetry);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  window._experimentObserver = observer;
}

async function loadExperiments(experimentsConfigs) {
  const currentPath = window.location.pathname;
  logger('Current path:', currentPath);
  const relevantExperiments = experimentsConfigs.filter(config => {
    return config.sitePath === currentPath;
  });



  gTotalExperiments = relevantExperiments.length;
  logger('Total experiments for page:', gTotalExperiments);

  try {
    await Promise.all(relevantExperiments.map(processExperiment));
  } catch (error) {
    console.error('Error in loadExperiments:', error);
    unblockPage();
  } finally {
    if (gPendingExperiments.length > 0) {
      if (gRetryTimeout) {
        // first retry is a timeout
        // to make the first one fast
        gRetryTimeout = false;
        setTimeout(() => {
          logger('Retrying experiments after timeout:', gPendingExperiments);
          const experimentsToRetry = gPendingExperiments;
          gPendingExperiments = [];
          loadExperiments(experimentsToRetry);
        }, 50);
      } else {
        // other retries are based on mutation observer
        setupRetryMutationObserver();
      }
    } else {
      checkAllExperimentsLoadedAndUnblockPage();
    }
  }
};

function unblockPage() {
  logger("All relevant experiments loaded. Unblocking page.");
  window.unblockPage();
}

function removeTextFromElements(textElements) {
  textElements.forEach(element => {
    logger('Removing text from element:', element);
    element.remove();
  });
}

function evaluateXPathWithFallback(xpath) {
  try {
    logger('Evaluating XPath:', xpath);
    const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    logger('XPath evaluation result:', result);
    const elements = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      elements.push(result.snapshotItem(i));
    }
    return elements;
  } catch (error) {
    logger(`XPath evaluation failed, falling back to manual evaluation for: ${xpath}`);
    return evaluateXPathManually(xpath);
  }
}

function evaluateXPathManually(xpath) {
  const parts = xpath.split('/');
  let currentElements = [document.documentElement];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part === '') continue;

    const newElements = [];
    for (const element of currentElements) {
      if (part === '*') {
        newElements.push(...element.children);
      } else if (part.includes('[')) {
        const [tagName, index] = part.split('[');
        const children = Array.from(element.children).filter(child => child.tagName.toLowerCase() === tagName.toLowerCase());
        const idx = parseInt(index) - 1;
        if (children[idx]) newElements.push(children[idx]);
      } else {
        newElements.push(...Array.from(element.children).filter(child => child.tagName.toLowerCase() === part.toLowerCase()));
      }
    }
    currentElements = newElements;
  }

  return currentElements;
}


/*********************************** BANNER STYLING ********************************************/
// set pointer events to none for overlapping elements with our buttons
function setPointerEventsNone(buttonContainer) {
  const buttonRect = buttonContainer.getBoundingClientRect();
  let currentElement = buttonContainer.parentElement;
  let levelsUp = 0;

  // search up to 10 levels up for overlapping elements
  // TODO: omerh - change this, its bad
  while (currentElement && levelsUp < 10) {
    if (currentElement !== buttonContainer && !buttonContainer.contains(currentElement)) {
      const currentRect = currentElement.getBoundingClientRect();
      if (rectsOverlap(buttonRect, currentRect, 5)) {
        currentElement.style.pointerEvents = 'none';
      }
    }
    currentElement = currentElement.parentElement;
    levelsUp++;
  }
}

function rectsOverlap(rect1, rect2, tolerance = 0) {
  return (Math.abs(rect1.left - rect2.left) <= tolerance &&
    Math.abs(rect1.right - rect2.right) <= tolerance &&
    Math.abs(rect1.top - rect2.top) <= tolerance &&
    Math.abs(rect1.bottom - rect2.bottom) <= tolerance);
}

/**
 * Create a banner with the given shape and text
 * @param {HTMLElement} divElement - The div element to create the banner on
 * @param {Object} options - The options for the banner
 * @param {string} options.shape - The shape of the banner
 * @param {string} options.text - The text of the banner
 * @param {string} options.subText - The subtext of the banner
 * @param {string} options.textColor - The text color of the banner
 * @param {string} options.subTextColor - The subtext color of the banner
 * @param {string} options.shapeColor - The shape color of the banner
 * @param {string} options.textSize - The text size of the banner
 * @param {string} options.subTextSize - The subtext size of the banner
 * @param {string} options.textFont - The text font of the banner
 * @param {string} options.textShadow - The text shadow of the banner
 * @param {string} options.subTextShadow - The subtext shadow of the banner
 * @param {Array} options.buttons - Array of button configurations (up to 2)
 * @param {Object} options.buttons[].text - The text to display on the button
 * @param {string} options.buttons[].color - The background color of the button
 * @param {string} options.buttons[].textColor - The color of the button text
 * @param {string} options.buttons[].textSize - The font size of the button text
 * @param {string} options.buttons[].padding - The padding around the button text
 * @param {string} options.buttons[].edgesRadius - The border radius of the button
 * @param {string} options.buttons[].width - The width of the button (default is 'auto')
 * @param {string} options.buttons[].height - The height of the button
 * @param {string} options.buttons[].onClick - The path to navigate to when the button is clicked
 */
function createBanner(divElement, options = {}) {
  const {
    shape = 'right-diagonal',
    text = '',
    subText = '',
    textColor = '#ffffff',
    subTextColor = '#ffffff',
    shapeColor = '#000000',
    textSize = '6vh',
    subTextSize = '2.5vh',
    textFont = 'Gotham, sans-serif',
    textShadowStrength = 0.7,
    buttons = []
  } = options;

  divElement.style.overflow = 'hidden';

  const textShadow = `-10px 10px 20px rgba(0, 0, 0, ${textShadowStrength})`;
  const subTextShadow = `-5px 5px 10px rgba(0, 0, 0, ${textShadowStrength})`;
  const shapeOverlay = document.createElement('div');
  const requiresBackground = shape !== 'centered' && shape !== 'aligned-left' && shape !== 'aligned-right' && shape !== 'bottom-center' && shape !== 'top-center';
  shapeOverlay.style.position = 'absolute';
  shapeOverlay.style.top = '0';
  shapeOverlay.style.left = '0';
  shapeOverlay.style.width = '100%';
  shapeOverlay.style.height = '100%';
  shapeOverlay.style.backgroundColor = requiresBackground ? shapeColor : 'transparent';
  shapeOverlay.style.display = 'flex';
  shapeOverlay.style.alignItems = 'center';
  shapeOverlay.style.justifyContent = 'center';
  shapeOverlay.style.fontFamily = textFont;
  shapeOverlay.style.fontWeight = 'bold';

  const centeredTextContainerWidth = isMobile ? '95%' : '60%';

  let clipPath;
  let textContainerStyle = {};
  let buttonContainerStyle = {};
  switch (shape) {
    case 'right-diagonal':
      clipPath = `polygon(75% 0%, 100% 0%, 100% 100%, 60% 100%)`;
      textContainerStyle = { right: '0', width: '30%', height: '100%' };
      buttonContainerStyle = { marginTop: '2vh', gap: '1.5vw' };
      break;
    case 'left-diagonal':
      clipPath = `polygon(0% 0%, 25% 0%, 40% 100%, 0% 100%)`;
      textContainerStyle = { left: '0', width: '30%', height: '100%' };
      buttonContainerStyle = { marginTop: '7vh', gap: '1.5vw' };
      break;
    case 'top-circle':
      clipPath = 'ellipse(57% 16.67% at 50% 5%)';
      textContainerStyle = { top: '1%', left: '15%', width: '70%', height: '18%' };
      buttonContainerStyle = { position: 'absolute', bottom: '3vh', left: '50%', transform: 'translateX(-50%)', gap: '5vw' };
      break;
    case 'bottom-circle':
      clipPath = 'ellipse(57% 16.67% at 50% 92%)';
      textContainerStyle = { bottom: '4%', left: '15%', width: '70%', height: '18%' };
      buttonContainerStyle = { position: 'absolute', top: '3vh', left: '50%', transform: 'translateX(-50%)', gap: '5vw' };
      break;
    case 'left-rectangle':
      clipPath = 'polygon(0% 0%, 35% 0%, 35% 100%, 0% 100%)';
      textContainerStyle = { left: '0', width: '35%', height: '100%' };
      buttonContainerStyle = { marginTop: '5vh', gap: '1vw' };
      break;
    case 'right-rectangle':
      clipPath = 'polygon(65% 0%, 100% 0%, 100% 100%, 65% 100%)';
      textContainerStyle = { right: '0', width: '35%', height: '100%' };
      buttonContainerStyle = { marginTop: '5vh', gap: '1vw' };
      break;
    case 'centered':
      clipPath = '';
      textContainerStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: centeredTextContainerWidth, height: '100%' };
      buttonContainerStyle = { marginTop: '5vh', gap: '1vw', width: '100%' };
      break;
    case 'aligned-left':
      clipPath = '';
      textContainerStyle = { top: '50%', left: '0%', transform: 'translate(5%, -50%)', width: '40%', height: '100%' };
      buttonContainerStyle = { marginTop: '5vh', gap: '1vw', alignItems: 'left', justifyContent: 'left', width: '92%' };
      break;
    case 'aligned-right':
      clipPath = '';
      textContainerStyle = { top: '50%', left: '100%', transform: 'translate(-105%, -50%)', width: '40%', height: '100%' };
      buttonContainerStyle = { marginTop: '5vh', gap: '1vw', alignItems: 'left', justifyContent: 'left', width: '92%' };
      break;
    case 'bottom-center':
      clipPath = '';
      textContainerStyle = { top: '80%', left: '50%', transform: 'translate(-50%, -50%)', width: centeredTextContainerWidth, height: '100%' };
      buttonContainerStyle = { marginTop: '5vh', gap: '1vw' };
      break;
    case 'top-center':
      clipPath = '';
      textContainerStyle = { top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: centeredTextContainerWidth, height: '100%' };
      buttonContainerStyle = { marginTop: '5vh', gap: '1vw' };
      break;
    default:
      clipPath = '';
  }
  shapeOverlay.style.clipPath = clipPath;

  const textContainer = document.createElement('div');
  Object.assign(textContainer.style, {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...textContainerStyle
  });

  const textElement = document.createElement('div');
  textElement.innerText = text;
  Object.assign(textElement.style, {
    color: textColor,
    fontSize: textSize,
    fontWeight: 'bold',
    textShadow: textShadow,
    pointerEvents: 'none',
    textAlign: shape === 'aligned-left' ? 'left' : shape === 'aligned-right' ? 'left' : 'center',
    width: '99%',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: textSize,
    marginBottom: textSize * 0.9
  });

  const subTextElement = document.createElement('div');
  subTextElement.innerText = subText;
  Object.assign(subTextElement.style, {
    color: subTextColor,
    fontSize: subTextSize,
    fontWeight: 'normal',
    textShadow: subTextShadow,
    pointerEvents: 'none',
    textAlign: shape === 'aligned-left' ? 'left' : shape === 'aligned-right' ? 'left' : 'center',
    width: '92%',
    lineHeight: subTextSize,
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    marginTop: subTextSize
  });

  textContainer.appendChild(textElement);
  textContainer.appendChild(subTextElement);

  // Add buttons
  if (buttons.length > 0) {
    const buttonContainer = document.createElement('div');
    Object.assign(buttonContainer.style, {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      zIndex: '10000',
      position: 'relative',
      pointerEvents: 'none',
      ...buttonContainerStyle
    });

    buttons.slice(0, 2).forEach(buttonConfig => {
      const button = document.createElement('button');
      button.innerText = buttonConfig.text || 'Button';
      const defaultStyle = {
        backgroundColor: buttonConfig.color || '#ffffff',
        color: buttonConfig.textColor || '#000000',
        fontSize: buttonConfig.textSize || '16px',
        padding: buttonConfig.padding || '10px 20px',
        border: 'none',
        borderRadius: buttonConfig.edgesRadius || '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        textDecoration: 'none',
        display: 'inline-block',
        textAlign: 'center',
        width: buttonConfig.width || 'auto',
        height: buttonConfig.height || 'auto',
        transition: 'background-color 0.3s, color 0.3s, opacity 0.3s',
        zIndex: '10001',  // Ensure buttons are on top of the container
        position: 'relative',
        pointerEvents: 'auto'
      };
      Object.assign(button.style, defaultStyle);

      const hoverOpacity = 0.8;

      button.addEventListener('mouseover', () => {
        button.style.opacity = hoverOpacity;
      });

      button.addEventListener('mouseout', () => {
        button.style.opacity = '1';
      });

      if (buttonConfig.onClick) {
        if (typeof buttonConfig.onClick === 'string') {
          button.addEventListener('click', (e) => {
            e.stopPropagation();  // Prevent event from bubbling up
            window.location.href = buttonConfig.onClick;
          });
        } else if (typeof buttonConfig.onClick === 'function') {
          button.addEventListener('click', (e) => {
            e.stopPropagation();  // Prevent event from bubbling up
            buttonConfig.onClick();
          });
        }
      }

      buttonContainer.appendChild(button);
    });

    if (['top-circle', 'bottom-circle'].includes(shape)) {
      divElement.appendChild(buttonContainer);
    } else {
      textContainer.appendChild(buttonContainer);
    }
  }

  shapeOverlay.appendChild(textContainer);
  divElement.appendChild(shapeOverlay);
  if (buttons.length > 0) {
    setPointerEventsNone(divElement);
  }
}

// HACKY function for demoing the dashboard
function overrideVariants(variantId) {
  logger('Overriding variants:', variantId);
  gOverride = true;
  const experimentsConfigs = JSON.parse(localStorage.getItem(activeExperimentsLocalStorageKey));
  if (!experimentsConfigs) {
    console.warn('No experiments found in localStorage');
    return;
  }

  const newVariants = {};
  experimentsConfigs.experiments.forEach(config => {
    const expFQId = getFQExperimentId(config);
    newVariants[expFQId] = variantId;
  });

  localStorage.setItem(experimentVariantsLocalStorageKey, JSON.stringify(newVariants));

  gLoadedExperiments = 0;
  gPendingExperiments = [];
  gRetryTimeout = true;

  loadExperiments(experimentsConfigs.experiments);
}

window.overrideVariants = overrideVariants;