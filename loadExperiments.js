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
const isMobile = window.innerWidth <= 768;
const posthogHost = "https://ph.eikona.io";
const activeExperimentsHost = `https://d3fjltzrrgg4xq.cloudfront.net/production/active-experiments`;

// Function to block specified paths
function blockPaths(pathsToBlock) {
  logger('Initializing blockPaths with:', pathsToBlock);
  // Convert paths to RegExp objects for flexible matching
  const blockedPatterns = pathsToBlock.map(path => new RegExp(`^${path}(\\?|$)`));

  // Function to check if the current path is blocked
  function isPathBlocked() {
    const currentPath = window.location.pathname;
    const isBlocked = blockedPatterns.some(pattern => pattern.test(currentPath));
    logger(`Checking if path "${currentPath}" is blocked:`, isBlocked);
    return isBlocked;
  }

  // Function to block the page
  function blockPage() {
    if (isPathBlocked()) {
      logger('Blocking page...');
      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'path-block-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'white';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.color = 'white';
      overlay.style.fontSize = '24px';

      // Append overlay to body or create body if it doesn't exist
      if (document.body) {
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
      } else {
        document.documentElement.appendChild(overlay);
        // Prevent scrolling
        document.documentElement.style.overflow = 'hidden';
      }
      logger('Overlay appended to body');

      logger('Scrolling disabled');

      // Set a timeout to unblock the page after 5 seconds
      setTimeout(() => {
        unblockPage(window.location.pathname);
        logger('Page unblocked after 5 seconds timeout');
      }, 5000);
    }
  }

  // Function to unblock a specific page
  function unblockPage(path) {
    logger(`Attempting to unblock path: ${path}`);
    if (window.location.pathname === path) {
      const overlay = document.getElementById('path-block-overlay');
      if (overlay) {
        overlay.remove();
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        logger(`Path ${path} unblocked successfully`);
      } else {
        logger(`No overlay found for path ${path}`);
      }
    } else {
      logger(`Current path does not match ${path}, unblock not performed`);
    }
  }

  // Initial check and block
  if (isPathBlocked()) {
    logger('Initial check: page is blocked');
    blockPage();
    // Attach unblock function to window object
    window.unblockSignal = unblockPage;
    logger('Unblock function attached to window.unblockSignal');

    // Dispatch a custom event to signal that blockPages has finished
    window.blockPagesLoaded = true;
    const event = new CustomEvent('blockPagesLoaded');
    window.dispatchEvent(event);
    logger('blockPagesLoaded event dispatched');
  }
}


function initializeSanity(projectId, dataset, apiVersion = '2024-01-01') {
  sanityClientUrl = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`;
  sanityCdnUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}`;
}

function urlForImage(asset, variantKey) {
  const preferedVariant = isMobile ? `${variantKey}_mobile` : variantKey;
  const source = asset[preferedVariant] ? asset[preferedVariant] : asset[variantKey];
  if (!source) {
    return null;
  }
  const imageIdRaw = source.asset['_ref'];
  const imageId = imageIdRaw
    .replace('image-', '')
    .replace(/-(\w+)$/, '.$1'); // Converts ending format from -png to .png, -jpg to .jpg etc
  return `${sanityCdnUrl}/${imageId}?auto=format`;
}

async function fetchExperimentAssets(experimentId) {
  const query = encodeURIComponent(`*[_type == "experiment" && id == "${experimentId}"]`);
  let assets = await fetch(`${sanityClientUrl}?query=${query}`).then(res => res.json());
  assets = assets.result;
  logger('Fetched assets for experiment:', experimentId, assets);
  // Prefetch images for all variants
  assets.forEach(asset => {
    ['variant_a', 'variant_b', 'variant_c', 'variant_d'].forEach(variant => {
      if (asset[variant]) {
        const imageUrl = urlForImage(asset, variant);
        prefetchImage(imageUrl);
      }
    });
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

/**
 * Initialize and load experiments
 * @param {string} customerId - The customer ID
 * @param {boolean} enableLogging - Whether to enable logging
 */
async function initializeAndLoadExperiments(customerId, enableLogging = false) {
  logger = enableLogging ? console.log.bind(console) : () => { };

  const activeExperiments = await fetch(`${activeExperimentsHost}/${customerId}`)
    .then(res => res.json())
    .then(json => dynamoDBRecordToJSON(json["Items"][0]));
  logger('Active experiments:', activeExperiments);
  const posthogToken = activeExperiments.posthog_token;
  const sanityProjectId = activeExperiments.sanity_project;
  const dataset = activeExperiments.env;
  const experimentsConfigs = activeExperiments.experiments;
  const pagesWithExperiments = experimentsConfigs.map(config => config.sitePath);
  blockPaths(pagesWithExperiments);

  // Only initialize PostHog if it hasn't been initialized yet
  if (!window.posthog.__loaded) {
    logger('Initializing PostHog...');
    const experimentsVariants = evaluateExperimentVariants(experimentsConfigs);
    logger('Evaluated experiment variants:', experimentsVariants);
    posthog.init(posthogToken, {
      api_host: posthogHost,
      person_profiles: 'always',
      enable_heatmaps: true,
      bootstrap: {
        featureFlags: experimentsVariants,
      },
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

  // Check if blockPages has already run
  if (window.blockPagesLoaded) {
    logger('blockPages already loaded, proceeding with experiments');
    loadExperimentsWhenReady();
  } else {
    logger('Waiting for blockPages to load...');
    // If not, wait for the custom event
    window.addEventListener('blockPagesLoaded', function onBlockPagesLoaded() {
      logger('blockPagesLoaded event received, loading experiments');
      loadExperimentsWhenReady();
      // Remove the event listener to avoid multiple calls
      window.removeEventListener('blockPagesLoaded', onBlockPagesLoaded);
    });
  }

  // Set a flag to indicate that loadExperiments has been initialized
  window.loadExperimentsInitialized = true;
}

const hideElements = (elements) => {
  elements.forEach(element => {
    element.style.visibility = 'hidden';
    element.style.opacity = '0';
  });
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

const showElement = (element) => {
  element.style.visibility = 'visible';
  setTimeout(() => {
    element.style.opacity = '1';
  }, 1); // Small delay to ensure the transition is applied
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
  return String(experimentConfig.expId) + (experimentAudience === 'global' ? '' : '-' + experimentAudience);
}

function evaluateExperimentVariants(experimentsConfigs) {
  if (localStorage.getItem('eikona-experiments-variants')) {
    return JSON.parse(localStorage.getItem('eikona-experiments-variants'));
  }
  results = {};
  experimentsConfigs.forEach(config => {
    const expFQId = getFQExperimentId(config);
    const audience = getExperimentAudience(config);
    const variants = config.variant_groups.find(group => group.audience_id === audience).variants;
    if (variants.length > 0) {
      const randomIndex = Math.floor(Math.random() * variants.length);
      results[expFQId] = variants[randomIndex]["id"];
    }
  });
  // Store variants in local storage
  // localStorage.setItem('eikona-experiments-variants', JSON.stringify(results));
  return results;
}

function getExperimentVariant(experimentConfig) {
  const expFQId = getFQExperimentId(experimentConfig);
  // const variants = JSON.parse(localStorage.getItem('eikona-experiments-variants') || '{}');
  const posthogVariant = posthog.getFeatureFlag(expFQId);
  logger('PostHog Feature flag:', expFQId, posthogVariant);
  // logger('Local storage variant:', expFQId, variants[expFQId]);
  return posthogVariant;
}

async function loadExperiments(experimentsConfigs) {
  const currentPath = window.location.pathname;
  logger('Current path:', currentPath);
  const relevantExperiments = experimentsConfigs.filter(config => {
    return config.sitePath === currentPath;
  });


  // Now fetch experiment assets in parallel after flags are loaded
  const fetchAssetsPromises = relevantExperiments.map(config => {
    const FQExpId = getFQExperimentId(config);
    logger('Fetching assets for experiment:', FQExpId);
    return fetchExperimentAssets(FQExpId).then(assets => ({ expId: config.expId, assets }));
  });


  // Wait for all assets to be fetched
  const assetsResults = await Promise.all(fetchAssetsPromises);

  // Map experiment IDs to their assets
  const assetsByExpId = {};
  for (const result of assetsResults) {
    logger('Assets for experiment:', result.expId, result.assets);
    assetsByExpId[result.expId] = result.assets;
  }

  let loadedExperiments = 0;
  const totalExperiments = relevantExperiments.length;
  let notFoundExperiments = [];
  logger('Total experiments for page:', totalExperiments);

  function checkAllExperimentsLoadedAndUnblockPage() {
    if (loadedExperiments === totalExperiments) {
      unblockPage();
    }
  }

  async function processExperiment(experimentConfig) {
    const {
      expId = '',
      xPaths = [],
      sitePath = '',
      textXPaths = [],
      audiences = [],
      variants = [],
    } = experimentConfig;

    // Check if the current path matches the experiment's sitePath
    if (sitePath !== currentPath) {
      logger(`Experiment ${expId} skipped: current path does not match ${sitePath}`);
      return;
    }

    // fetch variant key
    const variant = getExperimentVariant(experimentConfig);
    if (variant === undefined) {
      logger(`Experiment not found: ${expId}`);
      loadedExperiments++;
      checkAllExperimentsLoadedAndUnblockPage();
      return;
    }
    const variantLetter = variant.slice(-1);
    const variantKey = `variant_${variantLetter}`;

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
      notFoundExperiments.push(expId);
      return;
    }
    logger('Experiment variant:', expId, variant);
    if (variant === 'control') {
      loadedExperiments++;
      checkAllExperimentsLoadedAndUnblockPage();
      return;
    }
    hideElements(elements);
    removeTextFromElements(textElements);

    // fetch assets for the experiment
    const experimentAssets = assetsByExpId[expId];
    if (!experimentAssets) {
      logger(`No assets found for experiment ${expId}`);
      loadedExperiments++;
      checkAllExperimentsLoadedAndUnblockPage();
      return;
    }

    // check assets constraints and experiment type
    const nofAssets = experimentAssets.length;
    const isBroadcastExperiment = nofAssets === 1 && nofElements > 1;
    const isMultiAssetExperiment = nofAssets > 1 && nofElements === nofAssets;
    const isMultiAssetBroadcastExperiment = nofAssets > 1 && nofElements > nofAssets;
    const isSingleAssetExperiment = nofAssets === 1 && nofElements === 1;
    logger('Experiment type:', expId, {
      isBroadcastExperiment,
      isMultiAssetExperiment,
      isSingleAssetExperiment,
      isMultiAssetBroadcastExperiment
    });
    if (!isBroadcastExperiment && !isMultiAssetExperiment && !isSingleAssetExperiment && !isMultiAssetBroadcastExperiment) {
      console.warn(`Mismatch in experiment ${expId}: ${nofAssets} assets for ${nofElements} elements`);
      loadedExperiments++;
      checkAllExperimentsLoadedAndUnblockPage();
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
              } else if (tagName === 'div' || tagName === 'section') {
                element.style.backgroundImage = `url('${imageUrl}')`;
                element.style.backgroundRepeat = 'no-repeat';
                element.style.backgroundPosition = 'center';
                element.style.backgroundSize = !isMobileAsset ? 'cover' : 'contain';
                element.dataset.bg = "";
                element.dataset.bgHidpi = "";
                if (asset.copyType !== 'none') {
                  addCopy(element, asset);
                }
              } else if (tagName === 'video') {
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
              const imageLoadPromise = new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
              });

              imageLoadPromise
                .then(() => {
                  // Image has loaded successfully, we can count this experiment as loaded
                  loadedExperiments++;
                  checkAllExperimentsLoadedAndUnblockPage();
                  logger(`Updated ${tagName} element for experiment:`, expId);
                  logger(`Full element tag:`, element.outerHTML);
                  showElement(element);
                })
                .catch((error) => {
                  console.error(`Failed to load image for experiment ${expId}:`, error);
                  // Even if image fails to load, we should count it as processed
                  loadedExperiments++;
                  checkAllExperimentsLoadedAndUnblockPage();
                  showElement(element);
                });
            } else {
              console.warn(`Unsupported element type for experiment ${expId}: ${tagName}`);
            }
          }
        });
      }
    }
  }

  async function retryNotFoundExperiments() {
    const notFoundExperimentsCopy = [...notFoundExperiments];
    notFoundExperiments = [];
    for (const expId of notFoundExperimentsCopy) {
      logger(`Retrying experiment: ${expId}`);
      await processExperiment(relevantExperiments.find(config => config.expId === expId));
    };

    if (notFoundExperiments.length > 0) {
      setTimeout(() => {
        retryNotFoundExperiments();
      }, 100);
    } else {
      checkAllExperimentsLoadedAndUnblockPage();
    }
  }

  try {
    await Promise.all(relevantExperiments.map(processExperiment));
  } catch (error) {
    console.error('Error in loadExperiments:', error);
    unblockPage();
  } finally {
    if (notFoundExperiments.length > 0) {
      setTimeout(() => {
        retryNotFoundExperiments();
      }, 500);
    }
    checkAllExperimentsLoadedAndUnblockPage();
  }
};

function unblockPage() {
  logger("All relevant experiments loaded. Unblocking page.");
  window.unblockSignal(window.location.pathname);
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


