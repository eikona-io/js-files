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

function initializeSanity(projectId, dataset, apiVersion = '2024-01-01') {
  client = createClient({
    projectId,
    dataset,
    useCdn: true,
    apiVersion,
  });
  builder = imageUrlBuilder(client);
}

function urlForImage(source) {
  return builder.image(source).auto('format').url()
}

async function fetchExperimentAsstes(experimentId) {
  const assets = await client.fetch(`*[_type == "experiment" && id match $id]`, { id: `*${experimentId}*` });
  console.log('assets', assets);
  return assets;
}

export function initializeAndLoadExperiments(posthogToken, sanityProjectId, experimentIds, dataset = 'production') {
  // Initialize PostHog
  posthog.init(posthogToken, { api_host: 'https://us.i.posthog.com', person_profiles: 'always', enable_heatmaps: true });

  // Initialize Sanity
  initializeSanity(sanityProjectId, dataset);

  // Load experiments
  loadExperiments(experimentIds);
}

const getElementIdFromAttributes = (element, expId) => {
  const attributes = element.attributes;
  for (const attr of attributes) {
    if (attr.value.includes(expId)) {
      return attr.name;
    }
  }
  return null;
}

function loadExperiments(experimentIds) {
  posthog.onFeatureFlags(function () {
    const notFoundExperiments = [];

    function processExperiment(expId) {
      const variant = posthog.getFeatureFlag(expId);
      if (variant === undefined) {
        console.log(`Experiment with ID ${expId} does not exist`);
        return;
      }

      let elements;
      const variantLetter = variant.slice(-1);
      const variantKey = `variant_${variantLetter}`;
      // catch any element with the experiment id in any of the attributes
      elements = document.querySelectorAll(`[id*="${expId}"], [alt*="${expId}"], [data-bg*="${expId}"], [style*="${expId}"]`);
      console.log('elements', elements);
      const nofElements = elements.length;
      if (nofElements === 0) {
        notFoundExperiments.push(expId);
        return;
      }
      console.log('variant', variant);
      if (variant === 'control') {
        return;
      }

      fetchExperimentAsstes(expId).then(experimentsAssets => {
        const nofAssets = experimentsAssets.length;
        const isBroadcastExperiment = nofAssets === 1 && nofElements > 1;
        const isMultiAssetExperiment = nofAssets > 1 && nofElements === nofAssets;
        const isSingleAssetExperiment = nofAssets === 1 && nofElements === 1;
        console.log('isBroadcastExperiment', isBroadcastExperiment);
        console.log('isMultiAssetExperiment', isMultiAssetExperiment);
        console.log('isSingleAssetExperiment', isSingleAssetExperiment);
        if (!isBroadcastExperiment && !isMultiAssetExperiment && !isSingleAssetExperiment) {
          console.warn(`Experiment with ID ${expId} has ${nofAssets} assets but ${nofElements} elements`);
          return;
        }
        for (const asset of experimentsAssets) {
          if (asset[variantKey]) {
            const imageUrl = urlForImage(asset[variantKey]);
            const assetId = asset.id;
            console.log('assetId', assetId);
            elements.forEach(element => {
              const elementId = getElementIdFromAttributes(element, expId);
              console.log('elementId', elementId);
              // check that we are changing the right element
              // (the experiments in the CMS have the same ID or alt text as the elements)
              if (isSingleAssetExperiment || isBroadcastExperiment || (isMultiAssetExperiment && assetId === elementId)) {
                const tagName = element.tagName.toLowerCase();
                // change the element to the new image
                // each element type has a different way to change the image
                if (['img', 'div', 'video'].includes(tagName)) {
                  if (tagName === 'img') {
                    element.src = imageUrl;
                    element.srcset = "";
                  } else if (tagName === 'div') {
                    element.style.cssText = `background: url('${imageUrl}'); background-repeat: no-repeat; background-position: center; background-size: cover;`;
                  } else if (tagName === 'video') {
                    const parentElement = element.parentNode;
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.id = parentElement.id;
                    img.alt = parentElement.getAttribute('alt') || '';
                    img.className = parentElement.className;
                    if (parentElement.tagName.toLowerCase() === 'video-section') {
                      // Replace the video-section with an image
                      parentElement.parentNode.replaceChild(img, parentElement);
                    } else {
                      // Replace just the video element with an image
                      element.parentNode.replaceChild(img, element);
                    }
                  }
                } else {
                  console.warn(`Unsupported element type for ID ${element.id}: ${tagName}`);
                }
              }
            });
          }
        }
      });
    }

    experimentIds.forEach(processExperiment);

    // Retry not found experiments until success
    function retryNotFoundExperiments() {
      const stillNotFound = [];
      notFoundExperiments.forEach(expId => {
        console.log(`Retrying experiment with ID ${expId}`);
        const elements = document.querySelectorAll(`[id="${expId}"], [alt="${expId}"]`);
        if (elements.length === 0) {
          stillNotFound.push(expId);
        } else {
          processExperiment(expId);
        }
      });

      if (stillNotFound.length > 0) {
        notFoundExperiments.length = 0;
        notFoundExperiments.push(...stillNotFound);
        setTimeout(retryNotFoundExperiments, 100);
      }
    }

    if (notFoundExperiments.length > 0) {
      setTimeout(retryNotFoundExperiments, 500);
    }
  });
}