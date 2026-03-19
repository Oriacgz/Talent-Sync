Score Weight Justification
SEMANTIC SCORE     → 45%
  Why: Captures overall contextual fit.
  A student who describes themselves as "data-driven
  problem solver with Python" matches a job asking for
  "analytical thinker with scripting skills" even without
  exact keyword match. This is SBERT's strength.
  Highest weight because it's the most comprehensive signal.

ACADEMIC SCORE     → 25%
  Why: GPA matters but shouldn't dominate.
  A 7.5 GPA student from a tier-3 college who knows
  5 required skills should beat a 9.0 GPA student
  from IIT who knows 2 skills.
  If we gave GPA 50% weight, we'd replicate existing bias.

PREFERENCE SCORE   → 20%
  Why: Mutual fit matters.
  A student who wants FinTech roles in Mumbai matched to
  a HealthTech job in Bangalore is a bad match even if
  skills align. Preference alignment predicts retention.

SKILL GAP SCORE    → 10%
  Why: Specific coverage matters beyond semantic.
  SBERT might score "Python developer" high for a job
  requiring "Python|Docker|Kubernetes" — but if student
  has only Python, skill gap catches that nuance.

TOTAL = 100%

Bonuses (on top):
  Certification match → +0.0 to +0.2
  Backlog penalty     → -0.0 to -0.2
  These are adjustments, not base weights

What Final Distribution Should Look Like
After generating all 1,00,000 rows:

hybrid_score distribution:
  0.0 to 0.4  → ~15,000 rows  (poor matches, kept for model balance)
  0.4 to 0.6  → ~35,000 rows  (average matches)
  0.6 to 0.8  → ~40,000 rows  (good matches)
  0.8 to 1.0  → ~10,000 rows  (excellent matches)

was_selected distribution:
  0 (not selected) → ~80,000 rows
  1 (selected)     → ~20,000 rows
  This 80-20 split is realistic for internship hiring.
  Model must handle class imbalance.

Per college tier (in was_selected=1):
  Tier 1 selected → should NOT be more than 35%
  Tier 2 selected → should be around 35%
  Tier 3 selected → should be at least 30%
  If tier-1 is 60%+, your fairness correction is not working.

Generation Order — Step by Step
DAY 1:
  → Create student_profiles.csv (1000 rows)
  → Focus most time on resume_text_raw quality
  → Verify college_tier distribution: 300-350-350

DAY 2:
  → Create job_postings.csv (500 rows)
  → Focus most time on description_raw quality
  → Verify role and domain distributions

DAY 3:
  → Run SBERT encoding on both files
    model.encode(student_resume_text_raw)  → 1000 vectors
    model.encode(job_description_raw)      → 500 vectors
  → This takes 10-30 minutes depending on hardware

DAY 4:
  → Compute cosine similarity matrix (1000 × 500 = 500,000 pairs)
  → Keep top 100 per student → 1,00,000 rows
  → Calculate all score columns using formulas
  → Apply fairness correction
  → Assign was_selected with probability rules
  → Save match_outcomes.csv

DAY 5:
  → Verify distributions (check the table above)
  → If distributions are off, adjust generation logic
  → Hand all 3 files to ML developer

Most Common Mistakes to Avoid
MISTAKE 1: Same resume_text_raw structure for all students
  Bad:   "Student with Python, SQL, React skills seeking job"
  Good:  Vary writing style, length, vocabulary

MISTAKE 2: All students having perfect skills for every job
  Every student should be missing at least 1-2 required skills
  in most of their matches. Perfect matches should be rare.

MISTAKE 3: college_tier not matching distribution
  Count your rows before finalizing.
  300-350-350 is not approximate — it is exact.

MISTAKE 4: was_selected being purely deterministic
  Do NOT do: if score > 0.7: selected = 1
  MUST USE: probability-based assignment with random noise

MISTAKE 5: Skill names inconsistent
  "Machine Learning" in student file
  "machine learning" in job file — these will NOT match
  in skill_overlap calculation. Case sensitive.
  
MISTAKE 6: Too many students with high GPA
  If 800 out of 1000 students have GPA > 8.0,
  the academic_score feature becomes useless.
  Stick to the 250-500-250 distribution strictly.

MISTAKE 7: Ignoring the backlog and certification columns
  These make the model more realistic.
  Do not skip them just because they are new columns.