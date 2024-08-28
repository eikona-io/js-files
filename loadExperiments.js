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

function initializeSanity(projectId, dataset = 'production', apiVersion = '2024-01-01') {
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

async function fetchExperimentAsstes(experimentIdPrefix) {
  return await client.fetch(`*[_type == "experiment" && id match $idPrefix]`, { idPrefix: experimentIdPrefix });
}

export function initializeAndLoadExperiments(posthogToken, sanityProjectId, experimentIds) {
  // Initialize PostHog
  posthog.init(posthogToken, { api_host: 'https://us.i.posthog.com', person_profiles: 'always', enable_heatmaps: true });

  // Initialize Sanity
  initializeSanity(sanityProjectId);

  // Load experiments
  loadExperiments(experimentIds);
}

function loadExperiments(experimentIds) {
  posthog.onFeatureFlags(function () {
    experimentIds.forEach(expId => {
      const variant = posthog.getFeatureFlag(expId);
      if (variant === null) {
        throw new Error(`Experiment with ID ${expId} does not exist`);
      }

      let elements;
      const variantLetter = variant.slice(-1);
      const variantKey = `variant_${variantLetter}`;
      if (expId.endsWith('-_')) {
        // For "everything" pattern
        expId = expId.slice(0, -2); // Remove '-_' suffix (can't do * in posthog experiment id)
        elements = document.querySelectorAll(`[id^="${expId}"]`);
        expId = expId + "*";
      } else {
        // For exact match
        const element = document.getElementById(expId);
        elements = element ? [element] : [];
      }

      if (elements.length === 0) {
        throw new Error(`No elements with ID ${expId} exist in the document`);
      }

      if (variant === 'control') {
        return;
      }
      fetchExperimentAsstes(expId).then(experimentsAssets => {
        for (const asset of experimentsAssets) {
          if (asset[variantKey]) {
            const imageUrl = urlForImage(asset[variantKey]);
            const assetId = asset.id;
            elements.forEach(element => {
              const elementId = element.id;
              // check that we are changing the right element
              // (the experiments in the CMS have the same ID as the elements)
              if (assetId === elementId) {
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
                    // for now replace the video with an image
                    // TODO: omerh -> support replacing the video with the new video
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.id = element.id;
                    img.alt = element.alt || '';
                    img.className = element.className;
                    element.parentNode.replaceChild(img, element);
                  }
                } else {
                  console.warn(`Unsupported element type for ID ${element.id}: ${tagName}`);
                }
              }
            });
          }
        }
      });
    });
  });
}