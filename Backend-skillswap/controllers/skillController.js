import mongoose from 'mongoose'
import User from '../models/User.js'

// Helper to format individual skill entries
const formatSkill = (user, skillObj) => ({
  id: `${user._id}-${skillObj.skill}`,
  skill: skillObj.skill,
  category: skillObj.category,
  user: {
    id: user._id,
    name: user.name,
    photoUrl: user.photoUrl,
    rating: user.rating || 0,
    reviewCount: user.reviews ? user.reviews.length : 0,
  },
})

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
export const getSkills = async (req, res) => {
  try {
    const { excludeUserId } = req.query;

    const query = { 'skillsOffered.0': { $exists: true } };

    if (excludeUserId && mongoose.Types.ObjectId.isValid(excludeUserId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeUserId) };
    }

    const users = await User.find(query).select('name photoUrl rating reviews skillsOffered');

    const skills = [];

    users.forEach(user => {
      user.skillsOffered.forEach(skillObj => {
        skills.push({
          id: `${user._id}-${skillObj.skill}`,
          skill: skillObj.skill,
          category: skillObj.category,
          user: {
            id: user._id,
            name: user.name,
            photoUrl: user.photoUrl,
            rating: user.rating,
            reviewCount: user.reviews?.length || 0,
          },
        });
      });
    });

    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search skills
// @route   GET /api/skills/search
// @access  Public
export const searchSkills = async (req, res) => {
  try {
    const { query, category } = req.query

    const filter = { 'skillsOffered.0': { $exists: true } }

    if (query) {
      filter['skillsOffered.skill'] = { $regex: query, $options: 'i' }
    }

    if (category && category !== 'All') {
      filter['skillsOffered.category'] = category
    }

    const users = await User.find(filter)
      .select('name photoUrl rating reviews skillsOffered')
      .lean()

    const skills = users.flatMap(user =>
      user.skillsOffered
        .filter(skillObj => {
          const matchesQuery = !query || skillObj.skill.toLowerCase().includes(query.toLowerCase())
          const matchesCategory = !category || category === 'All' || skillObj.category === category
          return matchesQuery && matchesCategory
        })
        .map(skillObj => formatSkill(user, skillObj))
    )

    res.json(skills)
  } catch (error) {
    console.error('Error searching skills:', error)
    res.status(500).json({ message: 'Error searching skills' })
  }
}
