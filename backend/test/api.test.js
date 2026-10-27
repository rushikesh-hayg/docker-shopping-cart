const path = require('path');
const http = require('http');
const assert = require('assert');

// Point DB_PATH to isolated test database
process.env.DB_PATH = './data/test_shopping_cart.db';
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';

const { app } = require('../src/server');
const { initDb, getDbInstance } = require('../src/db');

let server;
const BASE_URL = 'http://localhost:5001';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting Automated Backend Verification Suite');
  console.log('======================================================\n');

  try {
    // 1. Reset and Seed Test Database
    console.log('[TEST 1] Initializing fresh test database...');
    await initDb(true);
    console.log('  ✔ Database reset and seeded successfully.');

    // 2. Start Test Server
    server = app.listen(5001);
    console.log('[TEST 2] Test HTTP Server running on port 5001.');

    // 3. Test Health Check
    console.log('\n[TEST 3] GET /api/health');
    const healthRes = await request('GET', '/api/health');
    assert.strictEqual(healthRes.status, 200, 'Health endpoint should return HTTP 200');
    assert.strictEqual(healthRes.body.status, 'UP', 'Service status should be UP');
    assert.strictEqual(healthRes.body.database, 'connected', 'Database should be connected');
    console.log('  ✔ Health check passed (status: UP, db: connected).');

    // 4. Test Catalog Listing
    console.log('\n[TEST 4] GET /api/products');
    const catalogRes = await request('GET', '/api/products');
    assert.strictEqual(catalogRes.status, 200);
    assert.strictEqual(catalogRes.body.count, 6, 'Should contain exactly 6 default seeded products');
    console.log(`  ✔ Catalog listing passed (${catalogRes.body.count} items verified).`);

    // 5. Test Search
    console.log('\n[TEST 5] GET /api/products/search?q=DevOps');
    const searchRes = await request('GET', '/api/products/search?q=DevOps');
    assert.strictEqual(searchRes.status, 200);
    assert.ok(searchRes.body.count >= 1, 'Search for DevOps should return at least 1 item');
    console.log(`  ✔ Search passed (${searchRes.body.count} matching products found).`);

    // 6. Test Atomic Checkout: Stock Rejection
    console.log('\n[TEST 6] POST /api/checkout (Negative Test - Exceeds Stock)');
    const excessiveCheckout = await request('POST', '/api/checkout', {
      customer_name: 'Jane Doe',
      customer_email: 'jane@example.com',
      items: [{ product_id: 1, quantity: 999 }]
    });
    assert.strictEqual(excessiveCheckout.status, 400, 'Should return HTTP 400 when stock is exceeded');
    assert.strictEqual(excessiveCheckout.body.success, false);
    assert.ok(excessiveCheckout.body.error.includes('Insufficient stock'), 'Error message should report insufficient stock');
    console.log(`  ✔ Stock check passed: Rejection occurred as expected (${excessiveCheckout.body.error})`);

    // 7. Test Atomic Checkout: Successful Purchase
    console.log('\n[TEST 7] POST /api/checkout (Positive Test - Purchase 2 units of Item 1)');
    const initialItem1 = (await request('GET', '/api/products/1')).body.data;
    const initialStock = initialItem1.stock;

    const validCheckout = await request('POST', '/api/checkout', {
      customer_name: 'Rushikesh DevOps',
      customer_email: 'devops@example.com',
      items: [{ product_id: 1, quantity: 2 }]
    });
    assert.strictEqual(validCheckout.status, 201, 'Should return HTTP 201 on success');
    assert.strictEqual(validCheckout.body.success, true);
    assert.ok(validCheckout.body.data.order_id > 0, 'Order ID must be generated');
    console.log(`  ✔ Checkout succeeded: Order #${validCheckout.body.data.order_id} created for $${validCheckout.body.data.total_amount}.`);

    // 8. Verify Stock Deduction
    console.log('\n[TEST 8] GET /api/products/1 (Verify Stock Deduction)');
    const updatedItem1 = (await request('GET', '/api/products/1')).body.data;
    assert.strictEqual(updatedItem1.stock, initialStock - 2, `Stock should be deducted from ${initialStock} to ${initialStock - 2}`);
    console.log(`  ✔ Stock verification passed: Item 1 stock changed from ${initialStock} to ${updatedItem1.stock}.`);

    // 9. Verify Admin Dashboard Stats
    console.log('\n[TEST 9] GET /api/admin/stats');
    const statsRes = await request('GET', '/api/admin/stats');
    assert.strictEqual(statsRes.status, 200);
    assert.strictEqual(statsRes.body.data.financials.total_orders, 1, 'Total orders should be 1');
    assert.strictEqual(statsRes.body.data.financials.total_items_sold, 2, 'Total items sold should be 2');
    console.log(`  ✔ Admin stats passed: Revenue: $${statsRes.body.data.financials.total_revenue}, Orders: ${statsRes.body.data.financials.total_orders}`);

    console.log('\n======================================================');
    console.log('🎉 ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    const db = getDbInstance();
    if (db) {
      db.close();
    }
  }
}

runTests();
