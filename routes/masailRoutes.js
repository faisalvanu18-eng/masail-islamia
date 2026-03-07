const express = require('express');
const router = express.Router();
const Masail = require('../models/Masail');


// ─────────────────────────────────────────────
// GET all published masail
// Example:
// /api/masail?keyword=namaz&category=Namaz&date=2026-03-07&month=3&page=1&limit=10&sort=latest
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      keyword,
      search,
      category,
      date,
      month,
      page = 1,
      limit = 10,
      sort = 'latest'
    } = req.query;

    const query = { isPublished: true };

    // Search keyword
    const finalKeyword = keyword || search;
    if (finalKeyword) {
      query.$text = { $search: finalKeyword };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Exact date filter
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);

      query.publishedDate = { $gte: start, $lt: end };
    }

    // Month filter (current year)
    if (month) {
      const year = new Date().getFullYear();
      const start = new Date(year, parseInt(month) - 1, 1);
      const end = new Date(year, parseInt(month), 1);

      query.publishedDate = { $gte: start, $lt: end };
    }

    // Pagination
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const perPage = Math.max(parseInt(limit) || 10, 1);
    const skip = (currentPage - 1) * perPage;

    // Sorting
    let sortOption = { publishedDate: -1 };
    if (sort === 'oldest') {
      sortOption = { publishedDate: 1 };
    }

    const total = await Masail.countDocuments(query);

    let masailListQuery = Masail.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(perPage)
      .select('-__v');

    // Text score sorting if searching
    if (finalKeyword) {
      masailListQuery = Masail.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, publishedDate: -1 })
        .skip(skip)
        .limit(perPage)
        .select('-__v');
    }

    const masailList = await masailListQuery;

    res.json({
      success: true,
      total,
      page: currentPage,
      pages: Math.ceil(total / perPage),
      count: masailList.length,
      data: masailList
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


// ─────────────────────────────────────────────
// GET featured masail
// /api/masail/featured
// ─────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    let masail = await Masail.findOne({
      isFeatured: true,
      isPublished: true
    }).sort({ publishedDate: -1 });

    // Fallback latest published
    if (!masail) {
      masail = await Masail.findOne({
        isPublished: true
      }).sort({ publishedDate: -1 });
    }

    if (!masail) {
      return res.status(404).json({
        success: false,
        message: 'No masail found'
      });
    }

    masail.views += 1;
    await masail.save();

    res.json({
      success: true,
      data: masail
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


// ─────────────────────────────────────────────
// GET all categories with masail count
// /api/masail/categories/list
// ─────────────────────────────────────────────
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Masail.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1
        }
      },
      { $sort: { category: 1 } }
    ]);

    res.json({
      success: true,
      data: categories
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


// ─────────────────────────────────────────────
// GET single masail by masail number
// /api/masail/number/001
// ─────────────────────────────────────────────
router.get('/number/:masailNumber', async (req, res) => {
  try {
    const masail = await Masail.findOne({
      masailNumber: req.params.masailNumber,
      isPublished: true
    });

    if (!masail) {
      return res.status(404).json({
        success: false,
        message: 'Masail not found'
      });
    }

    masail.views += 1;
    await masail.save();

    res.json({
      success: true,
      data: masail
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


// ─────────────────────────────────────────────
// GET single masail by ID
// /api/masail/:id
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const masail = await Masail.findById(req.params.id);

    if (!masail || !masail.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Masail not found'
      });
    }

    masail.views += 1;
    await masail.save();

    res.json({
      success: true,
      data: masail
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;