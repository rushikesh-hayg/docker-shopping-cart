const { dbGet, dbAll, dbRun, dbExec } = require('../db');

/**
 * POST /api/checkout
 * Atomic checkout transaction with stock validation and immediate deduction.
 * If any item lacks stock, the entire transaction rolls back.
 */
async function checkout(req, res, next) {
  const { customer_name, customer_email, items } = req.body;

  // Validation
  if (!customer_name || typeof customer_name !== 'string' || customer_name.trim() === '') {
    return res.status(400).json({ success: false, error: 'Customer name is required' });
  }

  if (!customer_email || !customer_email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid customer email is required' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Cart must contain at least one item' });
  }

  // Validate item format
  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return res.status(400).json({
        success: false,
        error: 'Each item must have a valid product_id and an integer quantity > 0'
      });
    }
  }

  try {
    // Begin Atomic Transaction
    await dbExec('BEGIN IMMEDIATE TRANSACTION;');

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await dbGet('SELECT * FROM products WHERE id = ?', [item.product_id]);

      if (!product) {
        await dbExec('ROLLBACK;');
        return res.status(404).json({
          success: false,
          error: `Product with ID ${item.product_id} does not exist.`
        });
      }

      if (product.stock < item.quantity) {
        await dbExec('ROLLBACK;');
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
          productId: product.id,
          productName: product.name,
          availableStock: product.stock,
          requestedQuantity: item.quantity
        });
      }

      const subtotal = Math.round(product.price * item.quantity * 100) / 100;
      totalAmount += subtotal;

      validatedItems.push({
        product_id: product.id,
        name: product.name,
        unit_price: product.price,
        quantity: item.quantity,
        subtotal
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    // Insert Order record
    const orderResult = await dbRun(
      `INSERT INTO orders (customer_name, customer_email, total_amount, status)
       VALUES (?, ?, ?, 'COMPLETED')`,
      [customer_name.trim(), customer_email.trim(), totalAmount]
    );

    const orderId = orderResult.lastID;

    // Insert order items & deduct stock
    for (const item of validatedItems) {
      await dbRun(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );

      await dbRun(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Commit Transaction
    await dbExec('COMMIT;');

    res.status(201).json({
      success: true,
      message: 'Checkout completed successfully',
      data: {
        order_id: orderId,
        customer_name: customer_name.trim(),
        customer_email: customer_email.trim(),
        total_amount: totalAmount,
        status: 'COMPLETED',
        items: validatedItems,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    try {
      await dbExec('ROLLBACK;');
    } catch (rbErr) {
      console.error('[TRANSACTION ROLLBACK ERROR]:', rbErr);
    }
    next(error);
  }
}

/**
 * GET /api/orders
 * Retrieve order history including purchased items
 */
async function getAllOrders(req, res, next) {
  try {
    const orders = await dbAll('SELECT * FROM orders ORDER BY created_at DESC');

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await dbAll(
          `SELECT oi.id, oi.product_id, p.name, oi.quantity, oi.unit_price, oi.subtotal
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [order.id]
        );
        return { ...order, items };
      })
    );

    res.json({
      success: true,
      count: ordersWithItems.length,
      data: ordersWithItems
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/stats
 * Aggregate metrics: revenue, order counts, stock alerts, and top products
 */
async function getAdminStats(req, res, next) {
  try {
    const orderAgg = await dbGet(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COUNT(*) AS total_orders
      FROM orders
    `);

    const itemsAgg = await dbGet(`
      SELECT COALESCE(SUM(quantity), 0) AS total_items_sold
      FROM order_items
    `);

    const inventoryAgg = await dbGet(`
      SELECT 
        COUNT(*) AS total_products,
        SUM(CASE WHEN stock <= 15 THEN 1 ELSE 0 END) AS low_stock_count,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS out_of_stock_count
      FROM products
    `);

    const topProducts = await dbAll(`
      SELECT 
        p.id, 
        p.name, 
        p.category, 
        p.price,
        p.stock,
        COALESCE(SUM(oi.quantity), 0) AS units_sold,
        COALESCE(SUM(oi.subtotal), 0) AS revenue_generated
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id
      ORDER BY units_sold DESC, revenue_generated DESC
      LIMIT 5
    `);

    const recentOrders = await dbAll(`
      SELECT id, customer_name, customer_email, total_amount, status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        financials: {
          total_revenue: Math.round(orderAgg.total_revenue * 100) / 100,
          total_orders: orderAgg.total_orders,
          total_items_sold: itemsAgg.total_items_sold,
          average_order_value: orderAgg.total_orders > 0 
            ? Math.round((orderAgg.total_revenue / orderAgg.total_orders) * 100) / 100 
            : 0
        },
        inventory: {
          total_products: inventoryAgg.total_products,
          low_stock_count: inventoryAgg.low_stock_count || 0,
          out_of_stock_count: inventoryAgg.out_of_stock_count || 0
        },
        top_products: topProducts,
        recent_orders: recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkout,
  getAllOrders,
  getAdminStats
};
