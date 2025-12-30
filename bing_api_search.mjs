import fetch from 'node-fetch'; // You'll need to install: npm install node-fetch

const SUBSCRIPTION_KEY = process.env.BING_SUBSCRIPTION_KEY; // Get from Azure Cognitive Services
const QUERY = process.env.QUERY || 'YOUR SEARCH QUERY';
const TARGET_DOMAIN = process.env.DOMAIN || 'example.com';
const ITERATIONS = Number(process.env.ITERATIONS || 10);
const COOLDOWN_MS = Number(process.env.COOLDOWN_MS || 800);

if (!SUBSCRIPTION_KEY) {
  console.error('Please set BING_SUBSCRIPTION_KEY environment variable.');
  process.exit(1);
}

function normalizeDomain(d) {
  try {
    const url = new URL(d.startsWith('http') ? d : 'https://' + d);
    return url.hostname.toLowerCase();
  } catch {
    return d.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  }
}

function matchesDomain(url, domain) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === domain || h.endsWith('.' + domain);
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const domain = normalizeDomain(TARGET_DOMAIN);

  for (let i = 1; i <= ITERATIONS; i++) {
    console.log(`Iteration ${i}`);
    console.log(`Progress: ${i}/${ITERATIONS}`);

    const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(QUERY)}&count=10`;

    try {
      const response = await fetch(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
        }
      });
      const data = await response.json();

      console.log('API Response Status:', response.status);
      if (data.error) {
        console.error('API Error:', data.error);
        break;
      }

      if (data.webPages && data.webPages.value) {
        console.log(`Found ${data.webPages.value.length} results.`);
        let found = false;
        for (const item of data.webPages.value) {
          console.log(`Checking: ${item.url}`);
          if (matchesDomain(item.url, domain)) {
            console.log(`✓ Found target domain: ${item.url}`);
            console.log(`Name: ${item.name}`);
            console.log(`Snippet: ${item.snippet}`);
            found = true;
            break;
          }
        }
        if (!found) {
          console.log('Target domain not found in results.');
        }
      } else {
        console.log('No results found.');
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    }

    if (i < ITERATIONS) {
      await sleep(COOLDOWN_MS);
    }
  }
})();