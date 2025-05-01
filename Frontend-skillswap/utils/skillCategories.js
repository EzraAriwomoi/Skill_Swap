/**
 * Automatically categorize a skill based on its name
 * @param {string} skillName - The name of the skill
 * @returns {string} - The category name
 */
export const categorizeSkill = (skillName) => {
    if (!skillName) return "Other"
  
    const skillLower = skillName.toLowerCase()
  
    // Tech skills
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
    ) {
      return "Tech"
    }
  
    // Art skills
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
    ) {
      return "Art"
    }
  
    // Music skills
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
    ) {
      return "Music"
    }
  
    // Language skills
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
    ) {
      return "Language"
    }
  
    // Fitness skills
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
    ) {
      return "Fitness"
    }
  
    // Default category
    return "Other"
  }
  