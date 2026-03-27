export const matches = [
  {
    id: "match-1",
    jobId: "job-1",
    title: "Frontend Engineer Intern",
    company: "TalentSync",
    location: "Bangalore",
    score: 0.86,
    requiredSkills: ["React", "TypeScript", "CSS"],
    missingSkills: ["GSAP"],
    explanation: "Your project experience aligns strongly with role requirements.",
    shapValues: {
      "React": 0.22,
      "TypeScript": 0.16,
      "Projects": 0.1,
      "Location": 0.06,
      "GPA": 0.05,
    },
  },
  {
    id: "match-2",
    jobId: "job-2",
    title: "ML Engineer Intern",
    company: "TalentSync",
    location: "Remote",
    score: 0.73,
    requiredSkills: ["Python", "SQL", "ML"],
    missingSkills: ["Pandas"],
    explanation: "Good ML baseline with room to improve feature engineering stack.",
    shapValues: {
      "Python": 0.18,
      "SQL": 0.12,
      "ML": 0.11,
      "Projects": 0.09,
      "Domain": 0.06,
    },
  },
];

export const applications = [
  {
    id: "app-1",
    matchId: "match-1",
    jobTitle: "Frontend Engineer Intern",
    company: "TalentSync",
    status: "SHORTLISTED",
    appliedAt: "2026-03-15T10:20:00.000Z",
  },
  {
    id: "app-2",
    matchId: "match-2",
    jobTitle: "ML Engineer Intern",
    company: "TalentSync",
    status: "APPLIED",
    appliedAt: "2026-03-20T09:00:00.000Z",
  },
];
