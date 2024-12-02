// initialize posthog
!function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement("script")).type = "text/javascript", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e }, u.people.toString = function () { return u.toString(1) + ".people (stub)" }, o = "capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId setPersonProperties".split(" "), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);
const toolbarJSON = new URLSearchParams(window.location.hash.substring(1)).get('__posthog')
if (toolbarJSON) {
  posthog.loadToolbar(JSON.parse(toolbarJSON))
}

// Initialize Sanity client and image builder
let sanityClientUrl;
let sanityCdnUrl;
let logger;
let loadedExperiments = 0;
let totalExperiments;
const isMobile = window.innerWidth <= 768;
let pendingExperiments = new Set();
const posthogHost = "https://ph.eikona.io";
const activeExperimentsHost = `https://d3fjltzrrgg4xq.cloudfront.net/production/active-experiments`;
const experimentVariantsSeed = 1234567890;
const experimentVariantsLocalStorageKey = 'eikona.experiments.variants';
const activeExperimentsLocalStorageKey = 'eikona.active.experiments';
const eikonaUserIdLocalStorageKey = 'eikona.user.id';

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


function initializeSanity(projectId, dataset, apiVersion = '2024-01-01') {
  sanityClientUrl = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`;
  sanityCdnUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}`;
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
  return `${sanityCdnUrl}/${imageId}?auto=format`;
}

async function fetchExperimentAssets(experimentId, variantKey) {
  const query = encodeURIComponent(`*[_type == "experiment" && id == "${experimentId}"]`);
  let assets = await fetch(`${sanityClientUrl}?query=${query}`).then(res => res.json());
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
function generateHash(seed, str) {
  const hash = murmurHash.x86.hash32(str, seed) / (2 ** 32 - 1);
  return Math.floor(99999 * hash);
}

function chooseRandomIndex(variants) {
  return Math.floor(Math.random() * variants.length);
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
  posthog.getFeatureFlag(expFQId);

  const variant = variants[expFQId];
  if (!variant) {
    logger('No variant found for experiment:', expFQId);
    return undefined;
  }
  const variantKey = variant === 'control' ? variant : `variant_${variant.slice(-1)}`;
  return variantKey;
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
}

function handleDivTag(element, asset, elementSize, isMobileAsset, imageUrl) {
  element.style.backgroundImage = `url('${imageUrl}')`;
  element.style.backgroundRepeat = 'no-repeat';
  element.style.backgroundPosition = 'center';
  element.style.backgroundSize = !isMobileAsset ? 'cover' : 'contain';
  element.dataset.bg = "";
  element.dataset.bgHidpi = "";
  if (asset.copyType !== 'none') {
    addCopy(element, asset);
  }
}

function handleVideoTag(element, asset, elementSize, isMobileAsset, imageUrl) {
  const parentElement = element.parentNode;
  const img = document.createElement('img');
  img.src = imageUrl;
  img.id = parentElement.id;
  img.alt = parentElement.getAttribute('alt') || '';
  img.className = parentElement.className;
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
  if (loadedExperiments === totalExperiments) {
    unblockPage();
  }
}

function incrementLoadedExperiments() {
  loadedExperiments++;
  checkAllExperimentsLoadedAndUnblockPage();
}

function createLoadImagePromise(imageUrl, element) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      incrementLoadedExperiments();
      logger(`Full element tag:`, element.outerHTML);
      resolve();
    };
    img.onerror = (error) => {
      console.error(`Failed to load image for experiment:`, error);
      reject(error);
    };
    img.src = imageUrl;
  });
}

// Modify the early return for missing elements
async function processExperiment(experimentConfig) {
  const {
    expId = '',
    xPaths = [],
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


  let elements = [];
  xPaths.forEach(xpath => {
    const matchingElements = evaluateXPathWithFallback(xpath);
    elements = elements.concat(matchingElements);
  });
  let textElements = [];
  textXPaths.forEach(xpath => {
    const matchingElements = evaluateXPathWithFallback(xpath);
    textElements = textElements.concat(matchingElements);
  });

  logger('Found elements for experiment:', expId, elements);
  logger('Found text elements for experiment:', expId, textElements);
  const nofElements = elements.length;
  if (nofElements === 0) {
    logger(`No elements found for experiment ${expId}`);
    // Add to pending experiments instead of just returning
    pendingExperiments.add(experimentConfig);
    setupRetryMutationObserver();
    return;
  }
  logger('Experiment variant:', expId, variantKey);
  if (variantKey === 'control') {
    incrementLoadedExperiments();
    return;
  }
  removeTextFromElements(textElements);

  // fetch assets for the experiment
  const FQExpId = getFQExperimentId(experimentConfig);
  logger('Fetching assets for experiment:', FQExpId, 'with variant:', variantKey);
  const experimentAssets = await fetchExperimentAssets(FQExpId, variantKey);
  if (!experimentAssets) {
    logger(`No assets found for experiment ${expId}`);
    incrementLoadedExperiments();
    return;
  }

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
      elements.forEach(element => {
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
  logger('Setting up retry mutation observer');
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
    if (pendingExperiments.size === 0) {
      observer.disconnect();
      window._experimentObserver = null;
      return;
    }

    // Try processing all pending experiments again
    const experimentsToRetry = Array.from(pendingExperiments);
    experimentsToRetry.forEach(experiment => {
      // Remove from pending before processing to avoid potential duplicates
      pendingExperiments.delete(experiment);
      processExperiment(experiment).catch(err =>
        console.error(`Error processing experiment ${experiment.expId}:`, err)
      );
    });
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



  totalExperiments = relevantExperiments.length;
  logger('Total experiments for page:', totalExperiments);


  try {
    await Promise.all(relevantExperiments.map(processExperiment));
  } catch (error) {
    console.error('Error in loadExperiments:', error);
    unblockPage();
  } finally {
    checkAllExperimentsLoadedAndUnblockPage();
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


