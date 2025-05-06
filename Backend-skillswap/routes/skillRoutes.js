const express = require("express");
const Skill = require("../models/Skill");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Helper function to categorize skills
const categorizeSkill = (skillName) => {
  if (!skillName) return "Other";
  const skillLower = skillName.toLowerCase();

  if (
    skillLower.includes("programming") ||
    skillLower.includes("coding") ||
    skillLower.includes("development") ||
    skillLower.includes("software") ||
    skillLower.includes("web") ||
    skillLower.includes("app") ||
    skillLower.includes("python") ||
    skillLower.includes("javascript") ||
    skillLower.includes("java") ||
    skillLower.includes("c++") ||
    skillLower.includes("react") ||
    skillLower.includes("node") ||
    skillLower.includes("database") ||
    skillLower.includes("sql") ||
    skillLower.includes("html") ||
    skillLower.includes("css") ||
    skillLower.includes("computer")
  )
    return "Tech";

  if (
    skillLower.includes("art") ||
    skillLower.includes("drawing") ||
    skillLower.includes("painting") ||
    skillLower.includes("sketch") ||
    skillLower.includes("illustration") ||
    skillLower.includes("design") ||
    skillLower.includes("graphic") ||
    skillLower.includes("photography") ||
    skillLower.includes("sculpt") ||
    skillLower.includes("craft")
  )
    return "Art";

  if (
    skillLower.includes("music") ||
    skillLower.includes("guitar") ||
    skillLower.includes("piano") ||
    skillLower.includes("sing") ||
    skillLower.includes("vocal") ||
    skillLower.includes("drum") ||
    skillLower.includes("bass") ||
    skillLower.includes("violin") ||
    skillLower.includes("flute") ||
    skillLower.includes("saxophone") ||
    skillLower.includes("instrument") ||
    skillLower.includes("composition") ||
    skillLower.includes("song")
  )
    return "Music";

  if (
    skillLower.includes("language") ||
    skillLower.includes("english") ||
    skillLower.includes("spanish") ||
    skillLower.includes("french") ||
    skillLower.includes("german") ||
    skillLower.includes("italian") ||
    skillLower.includes("chinese") ||
    skillLower.includes("japanese") ||
    skillLower.includes("korean") ||
    skillLower.includes("russian") ||
    skillLower.includes("arabic") ||
    skillLower.includes("portuguese") ||
    skillLower.includes("translation") ||
    skillLower.includes("speaking")
  )
    return "Language";

  if (
    skillLower.includes("fitness") ||
    skillLower.includes("workout") ||
    skillLower.includes("gym") ||
    skillLower.includes("exercise") ||
    skillLower.includes("yoga") ||
    skillLower.includes("pilates") ||
    skillLower.includes("running") ||
    skillLower.includes("swimming") ||
    skillLower.includes("cycling") ||
    skillLower.includes("sport") ||
    skillLower.includes("training") ||
    skillLower.includes("health") ||
    skillLower.includes("nutrition") ||
    skillLower.includes("diet")
  )
    return "Fitness";
  if (
    skillLower.includes("business") ||
    skillLower.includes("management") ||
    skillLower.includes("marketing") ||
    skillLower.includes("finance") ||
    skillLower.includes("accounting") ||
    skillLower.includes("sales") ||
    skillLower.includes("strategy") ||
    skillLower.includes("entrepreneur")
  )
    return "Business";

  if (
    skillLower.includes("writing") ||
    skillLower.includes("content") ||
    skillLower.includes("copywriting") ||
    skillLower.includes("editing") ||
    skillLower.includes("proofreading") ||
    skillLower.includes("article") ||
    skillLower.includes("blog") ||
    skillLower.includes("technical writing") ||
    skillLower.includes("creative writing")
  )
    return "Writing";
  if (
    skillLower.includes("communication") ||
    skillLower.includes("public speaking") ||
    skillLower.includes("presentation") ||
    skillLower.includes("negotiation") ||
    skillLower.includes("interpersonal") ||
    skillLower.includes("facilitation")
  )
    return "Communication";
  if (
    skillLower.includes("ui/ux") ||
    skillLower.includes("user interface") ||
    skillLower.includes("user experience") ||
    skillLower.includes("web design") ||
    skillLower.includes("product design") ||
    skillLower.includes("motion graphics")
  )
    return "Design";
  if (
    skillLower.includes("photography") ||
    skillLower.includes("videography") ||
    skillLower.includes("photo editing") ||
    skillLower.includes("video editing") ||
    skillLower.includes("filmmaking") ||
    skillLower.includes("camera")
  )
    return "Photography & Videography";
  if (
    skillLower.includes("plumbing") ||
    skillLower.includes("electrical") ||
    skillLower.includes("carpentry") ||
    skillLower.includes("welding") ||
    skillLower.includes("construction") ||
    skillLower.includes("diy") ||
    skillLower.includes("repair") ||
    skillLower.includes("maintenance")
  )
    return "Trades & DIY";
  if (
    skillLower.includes("cooking") ||
    skillLower.includes("baking") ||
    skillLower.includes("recipe") ||
    skillLower.includes("chef") ||
    skillLower.includes("cuisine") ||
    skillLower.includes("pastry")
  )
    return "Cooking & Baking";
  if (
    skillLower.includes("tutoring") ||
    skillLower.includes("mathematics") ||
    skillLower.includes("science") ||
    skillLower.includes("history") ||
    skillLower.includes("geography") ||
    skillLower.includes("physics") ||
    skillLower.includes("chemistry") ||
    skillLower.includes("biology")
  )
    return "Tutoring & Academics";

  return "Other";
};

// Format skill for response
const formatSkill = (skill) => {
  const category =
    !skill.category || skill.category === "Other"
      ? categorizeSkill(skill.skill)
      : skill.category;

  return {
    id: skill._id,
    skill: skill.skill,
    category,
    description: skill.description,
    user: {
      id: skill.user._id,
      name: skill.user.name,
      photoUrl: skill.user.photoUrl,
      rating: skill.user.rating || 0,
      reviewCount: skill.user.reviewCount || 0,
    },
  };
};

// Get all skills (optionally excluding skills from a specific user)
router.get("/", async (req, res) => {
  try {
    const excludeUserId = req.query.excludeUserId;

    const filter = excludeUserId ? { user: { $ne: excludeUserId } } : {};

    const skills = await Skill.find(filter)
      .populate("user", "name photoUrl rating reviewCount bio location")
      .lean();

    const formatSkill = (skill) => {
      const category =
        !skill.category || skill.category === "Other"
          ? categorizeSkill(skill.skill)
          : skill.category;

      return {
        id: skill._id,
        skill: skill.skill,
        category,
        description: skill.description,
        user: {
          id: skill.user._id,
          name: skill.user.name,
          photoUrl: skill.user.photoUrl,
          rating: skill.user.rating || 0,
          reviewCount: skill.user.reviewCount || 0,
          bio: skill.user.bio || "",
          location: skill.user.location || "",
        },
      };
    };

    // Group skills by user
    const skillsByUser = {};
    for (const skill of skills) {
      const userId = skill.user._id.toString();
      if (!skillsByUser[userId]) skillsByUser[userId] = [];
      skillsByUser[userId].push(skill);
    }

    // Format and attach allSkills to the first skill per user
    const formattedSkills = [];
    for (const userSkills of Object.values(skillsByUser)) {
      const userFormatted = userSkills.map(formatSkill);
      if (userFormatted.length > 0) {
        userFormatted[0].allSkills = userFormatted.map((s) => ({
          name: s.skill,
        }));
      }
      formattedSkills.push(...userFormatted);
    }

    res.json(formattedSkills);
  } catch (error) {
    console.error("Get skills error:", error);
    res.status(500).json({ message: "Error fetching skills" });
  }
});

// router.get("/", async (req, res) => {
//   try {
//     const excludeUserId = req.query.excludeUserId;

//     const filter = excludeUserId ? { user: { $ne: excludeUserId } } : {};

//     const skills = await Skill.find(filter)
//       .populate("user", "name photoUrl rating reviewCount bio location")
//       .lean();

//     // Group skills by user ID
//     const tutorsData = {};
//     skills.forEach(skill => {
//       const userId = skill.user._id.toString();
//       if (!tutorsData[userId]) {
//         tutorsData[userId] = {
//           user: {
//             id: skill.user._id,
//             name: skill.user.name,
//             photoUrl: skill.user.photoUrl,
//             rating: skill.user.rating || 0,
//             reviewCount: skill.user.reviewCount || 0,
//             bio: skill.user.bio,
//             location: skill.user.location,
//           },
//           allSkills: []
//         };
//       }
//       tutorsData[userId].allSkills.push({ name: skill.skill, category: skill.category });
//     });

//     // Format and attach allSkills to the first skill per user
//     const formattedTutors = Object.values(tutorsData);
//     // for (const userSkills of Object.values(skillsByUser)) {
//     //   const userFormatted = userSkills.map(formatSkill);
//     //   if (userFormatted.length > 0) {
//     //     userFormatted[0].allSkills = userFormatted.map(s => ({ name: s.skill }));
//     //   }
//     //   formattedTutors.push(...userFormatted);
//     // }

//     res.json(formattedTutors);
//   } catch (error) {
//     console.error("Get skills error:", error);
//     res.status(500).json({ message: "Error fetching skills" });
//   }
// });

// Get skills by category
router.get("/category/:category", async (req, res) => {
  try {
    const skills = await Skill.find({ category: req.params.category })
      .populate("user", "name photoUrl rating reviewCount")
      .lean();

    const skillsByUser = {};
    for (const skill of skills) {
      const userId = skill.user._id.toString();
      if (!skillsByUser[userId]) skillsByUser[userId] = [];
      skillsByUser[userId].push(skill);
    }

    const formattedSkills = [];
    for (const userSkills of Object.values(skillsByUser)) {
      const userFormatted = userSkills.map(formatSkill);
      if (userFormatted.length > 0) {
        userFormatted[0].allSkills = userFormatted.map((s) => ({
          name: s.skill,
        }));
      }
      formattedSkills.push(...userFormatted);
    }

    res.json(formattedSkills);
  } catch (error) {
    console.error("Get skills by category error:", error);
    res.status(500).json({ message: "Error fetching skills" });
  }
});

// Get skills by user
router.get("/user/:userId", async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.params.userId })
      .populate("user", "name photoUrl rating reviewCount")
      .lean();

    const formattedSkills = skills.map(formatSkill);
    res.json(formattedSkills);
  } catch (error) {
    console.error("Get skills by user error:", error);
    res.status(500).json({ message: "Error fetching skills" });
  }
});

// Add a new skill
router.post("/", auth, async (req, res) => {
  try {
    const { skill, category, description } = req.body;
    const skillCategory = category || categorizeSkill(skill);

    const newSkill = new Skill({
      user: req.user._id,
      skill,
      category: skillCategory,
      description,
    });

    await newSkill.save();

    const populatedSkill = await Skill.findById(newSkill._id)
      .populate("user", "name photoUrl rating reviewCount")
      .lean();

    res.status(201).json(formatSkill(populatedSkill));
  } catch (error) {
    console.error("Add skill error:", error);
    res.status(500).json({ message: "Error adding skill" });
  }
});

// Update a skill
router.put("/:id", auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    if (skill.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this skill" });
    }

    const { skill: skillName, category, description } = req.body;

    skill.skill = skillName || skill.skill;
    skill.category = category || categorizeSkill(skillName || skill.skill);
    skill.description = description || skill.description;

    await skill.save();

    const populatedSkill = await Skill.findById(skill._id)
      .populate("user", "name photoUrl rating reviewCount")
      .lean();

    res.json(formatSkill(populatedSkill));
  } catch (error) {
    console.error("Update skill error:", error);
    res.status(500).json({ message: "Error updating skill" });
  }
});

// Delete a skill
router.delete("/:id", auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    if (skill.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this skill" });
    }

    await Skill.findByIdAndDelete(req.params.id);

    res.json({ message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Delete skill error:", error);
    res.status(500).json({ message: "Error deleting skill" });
  }
});

module.exports = router;
