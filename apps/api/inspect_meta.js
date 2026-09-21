const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
let token = '';
for (const line of lines) {
  if (line.startsWith('META_ACCESS_TOKEN=')) {
    token = line.substring('META_ACCESS_TOKEN='.length).trim().replace(/^"/, '').replace(/"$/, '');
  }
}

async function run() {
  const url = `https://graph.facebook.com/v22.0/me/adaccounts?fields=id,name,account_status,disable_reason,currency,balance,amount_spent,spend_cap,is_prepay_account,funding_source_details&limit=25&access_token=${token}`;
  const res = await fetch(url);
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

run();
