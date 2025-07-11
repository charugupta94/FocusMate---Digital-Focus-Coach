const express = require('express');
const { body, validationResult } = require('express-validator');
const Distraction = require('../models/Distraction');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/distractions
// @desc    Log a new distraction
// @access  Private
router.post('/', auth, [
  body('type').isIn(['phone', 'social_media', 'website', 'notification', 'person', 'noise', 'thought', 'other']).withMessage('Invalid distraction type'),
  body('source').optional().trim().isLength({ max: 100 }).withMessage('Source cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  body('duration').optional().isInt({ min: 0, max: 3600 }).withMessage('Duration must be between 0 and 3600 seconds'),
  body('severity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid severity level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { type, source, description, duration, severity, session } = req.body;

    const distraction = new Distraction({
      user: req.user.id,
      type,
      source: source || '',
      description: description || '',
      duration: duration || 0,
      severity: severity || 'medium',
      session: session || null
    });

    await distraction.save();

    // Update user stats
    const user = await User.findById(req.user.id);
    user.stats.totalDistractions += 1;
    await user.save();

    res.status(201).json({
      message: 'Distraction logged successfully',
      distraction
    });
  } catch (error) {
    console.error('Log distraction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/distractions
// @desc    Get user's distractions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate, severity } = req.query;
    
    const query = { user: req.user.id };
    
    if (type) {
      query.type = type;
    }
    
    if (severity) {
      query.severity = severity;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const distractions = await Distraction.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('session', 'type task startTime');

    const total = await Distraction.countDocuments(query);

    res.json({
      distractions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get distractions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/distractions/analytics
// @desc    Get distraction analytics
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    let startDate = new Date();
    
    // Set start date based on period
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get distractions by type
    const distractionsByType = await Distraction.aggregate([
      {
        $match: {
          user: req.user._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get distractions by severity
    const distractionsBySeverity = await Distraction.aggregate([
      {
        $match: {
          user: req.user._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily distraction count for the period
    const dailyDistractions = await Distraction.aggregate([
      {
        $match: {
          user: req.user._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      period,
      analytics: {
        byType: distractionsByType,
        bySeverity: distractionsBySeverity,
        daily: dailyDistractions
      }
    });
  } catch (error) {
    console.error('Get distraction analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/distractions/:id
// @desc    Update a distraction
// @access  Private
router.put('/:id', auth, [
  body('type').optional().isIn(['phone', 'social_media', 'website', 'notification', 'person', 'noise', 'thought', 'other']).withMessage('Invalid distraction type'),
  body('source').optional().trim().isLength({ max: 100 }).withMessage('Source cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  body('duration').optional().isInt({ min: 0, max: 3600 }).withMessage('Duration must be between 0 and 3600 seconds'),
  body('severity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid severity level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const distraction = await Distraction.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!distraction) {
      return res.status(404).json({ message: 'Distraction not found' });
    }

    const { type, source, description, duration, severity } = req.body;
    
    if (type) distraction.type = type;
    if (source !== undefined) distraction.source = source;
    if (description !== undefined) distraction.description = description;
    if (duration !== undefined) distraction.duration = duration;
    if (severity) distraction.severity = severity;

    await distraction.save();

    res.json({
      message: 'Distraction updated successfully',
      distraction
    });
  } catch (error) {
    console.error('Update distraction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/distractions/:id
// @desc    Delete a distraction
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const distraction = await Distraction.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!distraction) {
      return res.status(404).json({ message: 'Distraction not found' });
    }

    await Distraction.findByIdAndDelete(req.params.id);

    // Update user stats
    const user = await User.findById(req.user.id);
    user.stats.totalDistractions = Math.max(0, user.stats.totalDistractions - 1);
    await user.save();

    res.json({ message: 'Distraction deleted successfully' });
  } catch (error) {
    console.error('Delete distraction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;