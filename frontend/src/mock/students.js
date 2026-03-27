export const studentProfile = {
  id: "student-1",
  fullName: "Aarav Sharma",
  college: "NIT Surathkal",
  branch: "Computer Science",
  graduationYear: 2026,
  gpa: 8.7,
  preferredRoles: ["Frontend Intern", "ML Intern"],
  preferredLocations: ["Bangalore", "Remote"],
  skills: ["React", "TypeScript", "Python", "SQL"],
  projects: ["AI Resume Parser", "Campus Placement Portal"],
};

export const candidates = [
  {
    id: "cand-1",
    jobId: "job-1",
    fullName: "Aarav Sharma",
    college: "NIT Surathkal",
    gpa: 8.7,
    skills: ["React", "TypeScript", "Python"],
    score: 0.86,
    explanation: "Strong React + TypeScript proficiency with relevant project depth.",
    shapValues: {
      "React": 0.21,
      "TypeScript": 0.15,
      "Communication": 0.08,
      "Domain Fit": 0.1,
      "GPA": 0.06,
    },
  },
  {
    id: "cand-2",
    jobId: "job-1",
    fullName: "Priya Nair",
    college: "IIIT Bangalore",
    gpa: 8.9,
    skills: ["React", "Node", "SQL"],
    score: 0.81,
    explanation: "Balanced full-stack profile and strong academic consistency.",
    shapValues: {
      "React": 0.18,
      "Node": 0.11,
      "SQL": 0.09,
      "Location Match": 0.06,
      "GPA": 0.07,
    },
  },
];

export const chatbotMockResponse = {
  response: "Thanks. I captured your latest details. Add your preferred role and location to complete profile setup.",
  profile_complete: false,
};
