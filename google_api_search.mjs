import fetch from 'node-fetch'; // You'll need to install: npm install node-fetch

const API_KEY = process.env.GOOGLE_API_KEY; // Get from Google Cloud Console
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID; // Create a custom search engine
const QUERY = process.env.QUERY || 'YOUR SEARCH QUERY';
const TARGET_DOMAIN = process.env.DOMAIN || 'example.com';
const ITERATIONS = Number(process.env.ITERATIONS || 50);
const COOLDOWN_MS = Number(process.env.COOLDOWN_MS || 800);

if (!API_KEY || !SEARCH_ENGINE_ID) {
  console.error('Please set GOOGLE_API_KEY and SEARCH_ENGINE_ID environment variables.');
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

    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(QUERY)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      console.log('API Response Status:', response.status);
      if (data.error) {
        console.error('API Error:', data.error);
        break;
      }

      if (data.items) {
        console.log(`Found ${data.items.length} results.`);
        let found = false;
        for (const item of data.items) {
          console.log(`Checking: ${item.link}`);
          if (matchesDomain(item.link, domain)) {
            console.log(`✓ Found target domain: ${item.link}`);
            console.log(`Title: ${item.title}`);
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