const express = require('express');
const Badge = require('../models/Badge');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/badges
// @desc    Get all available badges
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const badges = await Badge.find().sort({ category: 1, rarity: 1 });
    
    res.json({ badges });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/badges/user
// @desc    Get user's earned badges
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('badges');
    
    res.json({ badges: user.badges });
  } catch (error) {
    console.error('Get user badges error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/badges/check
// @desc    Check and award badges based on user stats
// @access  Private
router.post('/check', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('badges');
    const earnedBadgeIds = user.badges.map(badge => badge._id.toString());
    
    // Get all available badges
    const allBadges = await Badge.find();
    const newBadges = [];

    for (const badge of allBadges) {
      // Skip if user already has this badge
      if (earnedBadgeIds.includes(badge._id.toString())) {
        continue;
      }

      let eligible = false;

      // Check badge criteria based on user stats
      switch (badge.criteria.type) {
        case 'sessions_count':
          eligible = user.stats.totalSessions >= badge.criteria.value;
          break;
        case 'focus_time':
          eligible = user.stats.totalFocusTime >= badge.criteria.value;
          break;
        case 'streak_days':
          eligible = user.stats.longestStreak >= badge.criteria.value;
          break;
        case 'distractions_avoided':
          // This would need more complex logic based on user's distraction history
          // For now, we'll use a simple inverse calculation
          eligible = user.stats.totalDistractions <= badge.criteria.value;
          break;
        default:
          eligible = false;
      }

      if (eligible) {
        user.badges.push(badge._id);
        newBadges.push(badge);
      }
    }

    if (newBadges.length > 0) {
      await user.save();
    }

    res.json({
      message: newBadges.length > 0 ? 'New badges earned!' : 'No new badges earned',
      newBadges,
      totalBadges: user.badges.length
    });
  } catch (error) {
    console.error('Check badges error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;