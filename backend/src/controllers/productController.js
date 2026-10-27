const { dbAll, dbGet } = require('../db');

/**
 * GET /api/products
 * Retrieve all catalog products with optional category filtering
 */
async function getProducts(req, res, next) {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM products';
    const params = [];

    if (category && category.trim() !== '') {
      sql += ' WHERE LOWER(category) = LOWER(?)';
      params.push(category.trim());
    }

    sql += ' ORDER BY id ASC';
    const products = await dbAll(sql, params);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/search?q=keyword
 * Full search across name, description, and category
 */
async function searchProducts(req, res, next) {
  try {
    const query = req.query.q;
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required for search'
      });
    }

    const keyword = `%${query.trim()}%`;
    const sql = `
      SELECT * FROM products
      WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
      ORDER BY id ASC
    `;

    const matches = await dbAll(sql, [keyword, keyword, keyword]);

    res.json({
      success: true,
      query: query.trim(),
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/:id
 * Retrieve a single product by ID
 */
async function getProductById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    const product = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, error: `Product with ID ${id} not found` });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  searchProducts,
  getProductById
};
