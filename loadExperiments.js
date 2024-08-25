import { createClient } from 'https://esm.sh/@sanity/client'
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url'

// initialize posthog
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId setPersonProperties".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('phc_oNKus4rxhKBXC7ly2GEgrnFWKRI5Si0qUY5LoDvb0gv',{api_host:'https://us.i.posthog.com', person_profiles: 'always', enable_heatmaps: true})
const toolbarJSON = new URLSearchParams(window.location.hash.substring(1)).get('__posthog')
if (toolbarJSON) {
  posthog.loadToolbar(JSON.parse(toolbarJSON))
}

// initialize sanity client
const client = createClient({
  projectId: 'srk0ofy4',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01'
});

const builder = imageUrlBuilder(client)
function urlForImage(source) {
  return builder.image(source).url()
}

async function fetchExperiment(experimentId) {
  return await client.fetch(`*[_type == "experiment" && id == $id][0]`, { id: experimentId });
}

export function loadExperiments(experimentIds) {
  posthog.onFeatureFlags(function () {
    experimentIds.forEach(expId => {
      const variant = posthog.getFeatureFlag(expId);
      const img = document.getElementById(expId);
      
      if (img) {
        fetchExperiment(expId).then(exp => {
          const variantKey = `variant_${variant.slice(-1)}`;
          if (exp[variantKey]) {
            img.src = urlForImage(exp[variantKey]);
            img.srcset = "";
          }
        });
      }
    });
  });
}