const express = require('express');
const { body, validationResult } = require('express-validator');
const JournalEntry = require('../models/JournalEntry');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/journal
// @desc    Create a new journal entry
// @access  Private
router.post('/', auth, [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters'),
  body('mood').isIn(['excellent', 'good', 'okay', 'bad', 'terrible']).withMessage('Invalid mood'),
  body('title').optional().trim().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim().isLength({ max: 30 }).withMessage('Each tag cannot exceed 30 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { title, content, mood, tags, insights, session } = req.body;

    const entry = new JournalEntry({
      user: req.user.id,
      title: title || '',
      content,
      mood,
      tags: tags || [],
      insights: insights || [],
      session: session || null
    });

    await entry.save();

    res.status(201).json({
      message: 'Journal entry created successfully',
      entry
    });
  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/journal
// @desc    Get user's journal entries
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, mood, startDate, endDate, tag } = req.query;
    
    const query = { user: req.user.id };
    
    if (mood) {
      query.mood = mood;
    }
    
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const entries = await JournalEntry.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('session', 'type task startTime');

    const total = await JournalEntry.countDocuments(query);

    res.json({
      entries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/journal/analytics
// @desc    Get journal analytics
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let startDate = new Date();
    
    // Set start date based on period
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get mood distribution
    const moodDistribution = await JournalEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get most common tags
    const commonTags = await JournalEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $unwind: '$tags'
      },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get daily mood for the period
    const dailyMood = await JournalEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          averageMood: { $avg: { 
            $switch: {
              branches: [
                { case: { $eq: ['$mood', 'terrible'] }, then: 1 },
                { case: { $eq: ['$mood', 'bad'] }, then: 2 },
                { case: { $eq: ['$mood', 'okay'] }, then: 3 },
                { case: { $eq: ['$mood', 'good'] }, then: 4 },
                { case: { $eq: ['$mood', 'excellent'] }, then: 5 }
              ],
              default: 3
            }
          }},
          entryCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      period,
      analytics: {
        moodDistribution,
        commonTags,
        dailyMood
      }
    });
  } catch (error) {
    console.error('Get journal analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/journal/:id
// @desc    Update a journal entry
// @access  Private
router.put('/:id', auth, [
  body('content').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters'),
  body('mood').optional().isIn(['excellent', 'good', 'okay', 'bad', 'terrible']).withMessage('Invalid mood'),
  body('title').optional().trim().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim().isLength({ max: 30 }).withMessage('Each tag cannot exceed 30 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const entry = await JournalEntry.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    const { title, content, mood, tags, insights } = req.body;
    
    if (title !== undefined) entry.title = title;
    if (content) entry.content = content;
    if (mood) entry.mood = mood;
    if (tags) entry.tags = tags;
    if (insights) entry.insights = insights;

    await entry.save();

    res.json({
      message: 'Journal entry updated successfully',
      entry
    });
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/journal/:id
// @desc    Delete a journal entry
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    await JournalEntry.findByIdAndDelete(req.params.id);

    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;