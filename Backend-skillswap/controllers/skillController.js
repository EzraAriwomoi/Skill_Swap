import User from '../models/User.js';

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
export const getSkills = async (req, res) => {
  try {
    const users = await User.find({ 'skillsOffered.0': { $exists: true } }).select('name photoUrl rating skillsOffered');
    
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
            reviewCount: user.reviews ? user.reviews.length : 0,
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
    const { query, category } = req.query;
    
    let filter = { 'skillsOffered.0': { $exists: true } };
    
    if (query) {
      filter['skillsOffered.skill'] = { $regex: query, $options: 'i' };
    }
    
    if (category && category !== 'All') {
      filter['skillsOffered.category'] = category;
    }
    
    const users = await User.find(filter).select('name photoUrl rating skillsOffered');
    
    const skills = [];
    
    users.forEach(user => {
      user.skillsOffered.forEach(skillObj => {
        // Only include skills that match the query if provided
        if (!query || skillObj.skill.toLowerCase().includes(query.toLowerCase())) {
          // Only include skills that match the category if provided
          if (!category || category === 'All' || skillObj.category === category) {
            skills.push({
              id: `${user._id}-${skillObj.skill}`,
              skill: skillObj.skill,
              category: skillObj.category,
              user: {
                id: user._id,
                name: user.name,
                photoUrl: user.photoUrl,
                rating: user.rating,
                reviewCount: user.reviews ? user.reviews.length : 0,
              },
            });
          }
        }
      });
    });
    
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};