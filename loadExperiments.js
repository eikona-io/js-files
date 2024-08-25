import { createClient } from 'https://esm.sh/@sanity/client'
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url'

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