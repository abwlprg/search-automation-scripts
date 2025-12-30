import fetch from 'node-fetch'; // You'll need to install: npm install node-fetch

const API_KEY = process.env.GOOGLE_API_KEY; // Get from Google Cloud Console
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID; // Create a custom search engine
const QUERY = process.env.QUERY || 'YOUR SEARCH QUERY';
const TARGET_DOMAIN = process.env.DOMAIN || 'example.com';
const EXACT_URL = process.env.EXACT_URL === 'true';
const ITERATIONS = Number(process.env.ITERATIONS || 10);
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
  const domain = EXACT_URL ? TARGET_DOMAIN : normalizeDomain(TARGET_DOMAIN);
  console.log(`Target ${EXACT_URL ? 'URL' : 'domain'}: ${domain}`);
  console.log(`Original TARGET_DOMAIN: ${TARGET_DOMAIN}`);
  console.log(`Exact URL mode: ${EXACT_URL}`);

  let foundTarget = false;
  let totalSearches = 0;

  for (let i = 1; i <= ITERATIONS && !foundTarget; i++) {
    console.log(`Iteration ${i}`);
    console.log(`Progress: ${i}/${ITERATIONS}`);

    // Search through multiple pages if needed
    let startIndex = 1;
    const maxPages = 5; // Search up to 5 pages (50 results total)

    for (let page = 1; page <= maxPages && !foundTarget; page++) {
      const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(QUERY)}&start=${startIndex}`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        totalSearches++;

        console.log(`API Response Status: ${response.status} (Page ${page}, Start: ${startIndex})`);
        if (data.error) {
          console.error('API Error:', data.error);
          break;
        }

        if (data.items && data.items.length > 0) {
          console.log(`Found ${data.items.length} results on page ${page}.`);
          for (const item of data.items) {
            console.log(`Checking: ${item.link}`);
            const matches = EXACT_URL ? (item.link === domain) : matchesDomain(item.link, domain);
            if (matches) {
              console.log(`✓ Found target ${EXACT_URL ? 'URL' : 'domain'}: ${item.link}`);
              console.log(`Title: ${item.title}`);
              console.log(`Snippet: ${item.snippet}`);
              foundTarget = true;
              break;
            }
          }
        } else {
          console.log(`No results found on page ${page}.`);
          break; // No more results available
        }

        startIndex += 10; // Next page
      } catch (error) {
        console.error('Error fetching search results:', error);
        break;
      }

      if (!foundTarget && page < maxPages) {
        await sleep(COOLDOWN_MS);
      }
    }

    if (!foundTarget) {
      console.log(`Target ${EXACT_URL ? 'URL' : 'domain'} not found in ${totalSearches} searches.`);
    }

    if (i < ITERATIONS && !foundTarget) {
      await sleep(COOLDOWN_MS);
    }
  }

  if (foundTarget) {
    console.log(`✅ Successfully found target ${EXACT_URL ? 'URL' : 'domain'} in search results!`);
  } else {
    console.log(`❌ Target ${EXACT_URL ? 'URL' : 'domain'} not found in any search results after all iterations.`);
  }
})();