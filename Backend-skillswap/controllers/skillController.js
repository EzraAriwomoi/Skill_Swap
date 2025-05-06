import mongoose from "mongoose";
import User from "../models/User.js";
import Skill from "../models/Skill.js";

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
    reviewCount: user.reviewCount || 0,
    bio: user.bio || "",
    location: user.location || "",
  },
});

// @desc    Get all skills (excluding skills of a specific user if excludeUserId is provided)
// @route   GET /api/skills
// @access  Public
export const getSkills = async (req, res) => {
  try {
    const { excludeUserId } = req.query;
    console.log("excludeUserId:", excludeUserId); // Verify the exclusion ID is passed

    let query = {};
    if (excludeUserId) {
      // Exclude the current user's skills
      query.user = { $ne: excludeUserId }; // Ensure you're excluding correctly
    }

    const skills = await Skill.find(query); // Query the database with exclusion
    console.log("Fetched skills:", skills); // Verify skills are fetched correctly

    res.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ message: "Error fetching skills", error });
  }
};

// @desc    Search skills (optionally filter by category)
// @route   GET /api/skills/search
// @access  Public
export const searchSkills = async (req, res) => {
  try {
    const { query, category, excludeUserId } = req.query;

    const filter = { "skillsOffered.0": { $exists: true } };

    if (query) {
      filter["skillsOffered.skill"] = { $regex: query, $options: "i" };
    }

    if (category && category !== "All") {
      filter["skillsOffered.category"] = category;
    }

    if (excludeUserId) {
      filter["_id"] = { $ne: excludeUserId };
    }

    const users = await User.find(filter)
      .select("name photoUrl rating reviewCount bio location skillsOffered")
      .lean();

    const formattedSkills = users.flatMap(user => {
      const matchedSkills = user.skillsOffered
        .filter(skillObj => {
          const matchesQuery = !query || skillObj.skill.toLowerCase().includes(query.toLowerCase());
          const matchesCategory = !category || category === "All" || skillObj.category === category;
          return matchesQuery && matchesCategory;
        })
        .map(skillObj => formatSkill(user, skillObj));

      // Attach allSkills to the first skill entry
      if (matchedSkills.length > 0) {
        matchedSkills[0].allSkills = user.skillsOffered.map(s => ({ name: s.skill }));
      }

      return matchedSkills;
    });

    res.json(formattedSkills);
  } catch (error) {
    console.error("Error searching skills:", error);
    res.status(500).json({ message: "Error searching skills" });
  }
};
