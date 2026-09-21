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
  const url = `https://graph.facebook.com/v22.0/me/adaccounts?fields=id,name,account_status,disable_reason,currency,balance,amount_spent,spend_cap,is_prepay_account,funding_source_details&limit=50&access_token=${token}`;
  const res = await fetch(url);
  const json = await res.json();
  const accounts = json.data || [];
  
  console.log(`Total accounts: ${accounts.length}`);
  for (const a of accounts) {
    let availableBalancePaise = 0n;
    let rawDisplay = a.funding_source_details?.display_string || '';
    
    // Extract available balance from display_string: e.g. "Available Balance (₹5,789.14 INR)"
    const match = rawDisplay.match(/([0-9,]+\.?[0-9]*)/);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      const num = parseFloat(numStr) || 0;
      availableBalancePaise = BigInt(Math.round(num * 100));
    } else if (a.is_prepay_account && a.spend_cap && a.amount_spent) {
      const cap = BigInt(a.spend_cap || '0');
      const spent = BigInt(a.amount_spent || '0');
      if (cap > spent) {
        availableBalancePaise = cap - spent;
      }
    }
    
    console.log({
      id: a.id,
      name: a.name,
      status: a.account_status === 1 ? 'ACTIVE' : 'RESTRICTED',
      is_prepay: a.is_prepay_account,
      display_string: rawDisplay,
      extractedBalanceINR: (Number(availableBalancePaise) / 100).toFixed(2),
      meta_raw_balance_INR: (Number(a.balance || 0) / 100).toFixed(2),
      spend_cap_minus_spent_INR: a.spend_cap && a.amount_spent ? ((Number(BigInt(a.spend_cap) - BigInt(a.amount_spent))) / 100).toFixed(2) : '0.00'
    });
  }
}

run();
