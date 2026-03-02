const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const loginMatch = env.match(/DATAFORSEO_LOGIN="(.*?)"/);
const passMatch = env.match(/DATAFORSEO_PASSWORD="(.*?)"/);
const login = loginMatch[1];
const password = passMatch[1];
const credentials = Buffer.from(`${login}:${password}`).toString('base64');

const data = JSON.stringify([{
    keyword: "SEO strategy for 2025",
    location_name: "United States",
    language_name: "English",
    device: "desktop",
    os: "windows",
    depth: 20
}]);

const options = {
  hostname: 'api.dataforseo.com',
  port: 443,
  path: '/v3/serp/google/organic/live/advanced',
  method: 'POST',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    const json = JSON.parse(body);
    const items = json.tasks?.[0]?.result?.[0]?.items || [];
    console.log(`Length: ${items.length}`);
    const paa = items.filter(i => i.type === 'people_also_ask');
    console.log("PAA Type:", Array.isArray(paa), "Length:", paa.length);
    if(paa.length > 0) {
       console.log("Keys:", Object.keys(paa[0]));
       console.log("Items exists:", !!paa[0].items);
       if(paa[0].items) console.log("Items length:", paa[0].items.length);
    }
  });
});

req.on('error', (e) => { console.error(e); });
req.write(data);
req.end();
