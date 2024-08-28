import { createClient } from 'https://esm.sh/@sanity/client'
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url'

// initialize posthog
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId setPersonProperties".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
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
  return builder.image(source).url()
}

async function fetchExperiment(experimentId) {
  return await client.fetch(`*[_type == "experiment" && id == $id][0]`, { id: experimentId });
}

export function initializeAndLoadExperiments(posthogToken, sanityProjectId, experimentIds) {
  // Initialize PostHog
  posthog.init(posthogToken, {api_host:'https://us.i.posthog.com', person_profiles: 'always', enable_heatmaps: true});
  
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
      const element = document.getElementById(expId);
      if (!element) {
        throw new Error(`Element with ID ${expId} does not exist in the document`);
      }
      
      const tagName = element.tagName.toLowerCase();
      if (['img', 'div', 'video'].includes(tagName)) {
        fetchExperiment(expId).then(exp => {
          const variantKey = `variant_${variant.slice(-1)}`;
          if (exp[variantKey]) {
            const imageUrl = urlForImage(exp[variantKey]);
            if (tagName === 'img') {
              element.src = imageUrl;
              element.srcset = "";
            } else if (tagName === 'div') {
              element.style.cssText = `background: url('${imageUrl}'); background-repeat: no-repeat; background-position: center; background-size: cover;`;
            } else if (tagName === 'video') {
              element.poster = imageUrl;
              element.querySelector('source').src = imageUrl;
              element.querySelector('img').src = imageUrl;
            }
          }
        });
      } else {
        console.warn(`Unsupported element type for ID ${expId}: ${tagName}`);
      }
    });
  });
}