const express = require('express');
const { verifyToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({ categories });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch categories', status: 500 } });
  }
});

router.get('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [categories] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (categories.length === 0) {
      return res.status(404).json({ error: { message: 'Category not found', status: 404 } });
    }
    res.json({ category: categories[0] });
  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch category', status: 500 } });
  }
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { name, slug, description } = req.body;
  
  try {
    const [result] = await db.query(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, description]
    );
    const [category] = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Category created', category: category[0] });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: { message: 'Failed to create category', status: 500 } });
  }
});

router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { name, slug, description } = req.body;
  
  try {
    await db.query(
      'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
      [name, slug, description, req.params.id]
    );
    const [category] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category updated', category: category[0] });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: { message: 'Failed to update category', status: 500 } });
  }
});

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: { message: 'Failed to delete category', status: 500 } });
  }
});

module.exports = router;