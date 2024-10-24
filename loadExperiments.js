import { createClient } from 'https://esm.sh/@sanity/client'
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url'

// initialize posthog
!function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement("script")).type = "text/javascript", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e }, u.people.toString = function () { return u.toString(1) + ".people (stub)" }, o = "capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId setPersonProperties".split(" "), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);
const toolbarJSON = new URLSearchParams(window.location.hash.substring(1)).get('__posthog')
if (toolbarJSON) {
  posthog.loadToolbar(JSON.parse(toolbarJSON))
}

// Initialize Sanity client and image builder
let client;
let builder;
let logger;
const isMobile = window.innerWidth <= 768;

function initializeSanity(projectId, dataset, apiVersion = '2024-01-01') {
  client = createClient({
    projectId,
    dataset,
    useCdn: true,
    apiVersion,
  });
  builder = imageUrlBuilder(client);
}

function urlForImage(source, shape = null) {
  if (shape && shape.width !== 0 && shape.height !== 0) {
    return builder.image(source).auto('format').width(shape.width).height(shape.height).url()
  }
  return builder.image(source).auto('format').url()
}

async function fetchExperimentAssets(experimentId) {
  const assets = await client.fetch(`*[_type == "experiment" && id match $id]`, { id: `*${experimentId}*` });
  logger('Fetched assets for experiment:', experimentId, assets);

  // Prefetch images for all variants
  assets.forEach(asset => {
    ['variant_a', 'variant_b', 'variant_c', 'variant_d'].forEach(variant => {
      if (asset[variant]) {
        const imageUrl = urlForImage(asset[variant]);
        prefetchImage(imageUrl);
      }
    });
  });

  return assets;
}

/**
 * Initialize and load experiments
 * @param {string} posthogToken - The PostHog token
 * @param {string} sanityProjectId - The Sanity project ID
 * @param {string[]} experimentConfigs - The experiment configurations
 * @param {string} dataset - The Sanity dataset
 * @param {boolean} enableLogging - Whether to enable logging
 * @param {boolean} resizeElements - Whether to resize elements according to their size on screen
 */
export function initializeAndLoadExperiments(posthogToken, sanityProjectId, experimentConfigs, dataset = 'production', enableLogging = false) {
  logger = enableLogging ? console.log.bind(console) : () => { };
  // Initialize PostHog
  posthog.init(posthogToken, { api_host: 'https://ph.eikona.io', person_profiles: 'always', enable_heatmaps: true });
  // Initialize Sanity
  initializeSanity(sanityProjectId, dataset);

  // Function to load experiments
  function loadExperimentsWhenReady() {
    logger('Loading experiments...');
    try {
      loadExperiments(experimentConfigs);
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

async function loadExperiments(experimentConfigs) {
  // Function to get feature flags as a Promise
  const getFeatureFlags = () => {
    return new Promise(resolve => {
      posthog.onFeatureFlags(() => {
        resolve();
      });
    });
  };

  // Start getting feature flags
  const featureFlagsPromise = getFeatureFlags();

  const currentPath = window.location.pathname;
  const relevantExperiments = experimentConfigs.filter(config => config.sitePath === currentPath);

  // Fetch experiment assets in parallel
  const fetchAssetsPromises = relevantExperiments.map(config => {
    return fetchExperimentAssets(config.expId).then(assets => ({ expId: config.expId, assets }));
  });

  // Wait for both feature flags and experiment assets to be ready
  const [_, assetsResults] = await Promise.all([featureFlagsPromise, Promise.all(fetchAssetsPromises)]);

  // Map experiment IDs to their assets
  const assetsByExpId = {};
  for (const result of assetsResults) {
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
    } = experimentConfig;

    // Check if the current path matches the experiment's sitePath
    if (sitePath !== currentPath) {
      logger(`Experiment ${expId} skipped: current path does not match ${sitePath}`);
      return;
    }

    // fetch variant key
    const variant = posthog.getFeatureFlag(expId);
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
      const variantAsset = asset[variantKey];
      if (variantAsset) {
        const assetId = asset.id;
        logger('Processing asset:', assetId, 'for experiment:', expId);
        elements.forEach(element => {
          const imageUrl = urlForImage(variantAsset);
          logger('Processing element:', element, 'for experiment:', expId);
          // check that we are changing the right element
          // (the experiments in the CMS have the same ID or alt text as the elements)
          // TODO: enable multi-asset experiments with xpath in sanity
          if (isSingleAssetExperiment || isBroadcastExperiment) {
            const tagName = element.tagName.toLowerCase();
            const elementSize = getElementSizeOnScreen(element);
            // preserve the original image size
            if (elementSize.width > 0 && elementSize.height > 0) {
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
                  if (elementSize.width > 0 && elementSize.height > 0) {
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
                element.style.backgroundSize = 'cover';
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
                if (elementSize.width > 0 && elementSize.height > 0) {
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
 */
export function createBanner(divElement, options = {}) {
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
  } = options;

  // divElement.style.position = 'relative';
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
  switch (shape) {
    case 'right-diagonal':
      clipPath = `polygon(75% 0%, 100% 0%, 100% 100%, 60% 100%)`;
      textContainerStyle = { right: '0', width: '30%', height: '100%' };
      break;
    case 'left-diagonal':
      clipPath = `polygon(0% 0%, 25% 0%, 40% 100%, 0% 100%)`;
      textContainerStyle = { left: '0', width: '30%', height: '100%' };
      break;
    case 'top-circle':
      clipPath = 'ellipse(57% 16.67% at 50% 5%)';
      textContainerStyle = { top: '1%', left: '15%', width: '70%', height: '18%' };
      break;
    case 'bottom-circle':
      clipPath = 'ellipse(57% 16.67% at 50% 92%)';
      textContainerStyle = { bottom: '4%', left: '15%', width: '70%', height: '18%' };
      break;
    case 'left-rectangle':
      clipPath = 'polygon(0% 0%, 35% 0%, 35% 100%, 0% 100%)';
      textContainerStyle = { left: '0', width: '35%', height: '100%' };
      break;
    case 'right-rectangle':
      clipPath = 'polygon(65% 0%, 100% 0%, 100% 100%, 65% 100%)';
      textContainerStyle = { right: '0', width: '35%', height: '100%' };
      break;
    case 'centered':
      clipPath = '';
      textContainerStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: centeredTextContainerWidth, height: '100%' };
      break;
    case 'aligned-left':
      clipPath = '';
      textContainerStyle = { top: '50%', left: '0%', transform: 'translate(5%, -50%)', width: '40%', height: '100%' };
      break;
    case 'aligned-right':
      clipPath = '';
      textContainerStyle = { top: '50%', left: '100%', transform: 'translate(-105%, -50%)', width: '40%', height: '100%' };
      break;
    case 'bottom-center':
      clipPath = '';
      textContainerStyle = { top: '80%', left: '50%', transform: 'translate(-50%, -50%)', width: centeredTextContainerWidth, height: '100%' };
      break;
    case 'top-center':
      clipPath = '';
      textContainerStyle = { top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: centeredTextContainerWidth, height: '100%' };
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
    lineHeight: textSize, // Adjust line height relative to the font size
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
  shapeOverlay.appendChild(textContainer);
  divElement.appendChild(shapeOverlay);
}