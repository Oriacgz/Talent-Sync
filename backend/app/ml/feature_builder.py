import numpy as np

# Exact feature order expected by the XGBoost model.
# Modifying this list requires retraining the model.
SAFE_FEATURES = [
    "sbert_similarity",
    "semantic_score",
    "skill_overlap_ratio",
    
    "cgpa_normalized",
    "cgpa_meets_threshold",
    "backlog_penalty",
    "branch_eligible",
    
    "experience_score",
    "experience_months",
    "experience_gap",
    
    "preference_score",
    "location_match",
    "domain_match",
    
    "skill_gap_score",
    "profile_completeness",
]

def _parse_list(val) -> list:
    if not val or (isinstance(val, float) and np.isnan(val)):
        return []
    if isinstance(val, str):
        if val.lower() == "nan": return []
        return [x.strip() for x in val.split("|") if x.strip()]
    return list(val)

def _safe_str(val) -> str:
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return ""
    if str(val).lower() == "nan":
        return ""
    return str(val)

def _safe_bool(val, default=False) -> bool:
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return default
    return bool(val)

def build_features(student: dict, job: dict, similarity: float) -> np.ndarray:
    """Centralized feature extraction for both inference and training."""
    # --- skill_overlap_ratio & skill_gap_score ---
    s_skills = set(s.lower() for s in _parse_list(student.get("skills")))
    j_skills = set(s.lower() for s in _parse_list(job.get("skills") or job.get("required_skills")))
    overlap = s_skills & j_skills
    skill_overlap_ratio = len(overlap) / max(len(j_skills), 1)
    skill_gap_score = skill_overlap_ratio

    # --- preference_score ---
    preferred_roles = [r.lower() for r in _parse_list(student.get("preferredRoles") or student.get("preferred_roles"))]
    job_title = (_safe_str(job.get("title") or job.get("role_title"))).lower()
    role_match = float(any(role in job_title or job_title in role for role in preferred_roles)) if preferred_roles else 0.0

    pref_locs = [l.lower() for l in _parse_list(student.get("preferredLocations") or student.get("preferred_locations"))]
    job_loc = _safe_str(job.get("location")).lower()
    
    if not job_loc: location_match = 1.0
    elif job_loc in pref_locs: location_match = 1.0
    elif "remote" in [l.lower() for l in pref_locs]: location_match = 0.5
    else: location_match = 0.0
    preference_score = (role_match + location_match) / 2.0

    # --- domain_match ---
    def extract_domain(title_str):
        t = _safe_str(title_str).lower()
        if "frontend" in t or "react" in t: return "frontend"
        if "backend" in t: return "backend"
        if "data" in t or "ml" in t: return "data"
        if "devops" in t: return "devops"
        return "general"
        
    job_domain = extract_domain(job_title)
    student_domain_roles = " ".join(preferred_roles)
    student_domain = extract_domain(student_domain_roles)
    domain_match = float(job_domain == student_domain)

    # --- academic_score & cgpa ---
    cgpa_val = student.get("cgpa") if student.get("cgpa") is not None else student.get("gpa")
    cgpa = float(cgpa_val) if not (isinstance(cgpa_val, float) and np.isnan(cgpa_val)) and cgpa_val is not None else 0.0
    
    min_cgpa_val = job.get("minCgpa") if job.get("minCgpa") is not None else job.get("min_cgpa")
    if min_cgpa_val is None: min_cgpa_val = job.get("min_gpa")
    min_cgpa = float(min_cgpa_val) if not (isinstance(min_cgpa_val, float) and np.isnan(min_cgpa_val)) and min_cgpa_val is not None else 0.0
    
    cgpa_meets_threshold = float(cgpa >= min_cgpa)
    cgpa_normalized = cgpa / 10.0

    # BOOLEAN logic with safe FALSE default
    bl_val = student.get("backlogs")
    backlogs = int(bl_val) if not (isinstance(bl_val, float) and np.isnan(bl_val)) and bl_val is not None else 0
    
    backlog_allowed = _safe_bool(
        job.get("backlogAllowed")
        if job.get("backlogAllowed") is not None
        else job.get("backlog_allowed"),
        default=False
    )
    
    if backlog_allowed:
        backlog_penalty = 0.0
    else:
        backlog_penalty = float(-0.1 * backlogs) if backlogs > 0 else 0.0

    # --- branch eligibility ---
    s_branch = _safe_str(student.get("branch")).strip().lower()
    eligible_branches = _parse_list(job.get("eligibleBranches") or job.get("eligible_branches"))
    if not eligible_branches:
        branch_eligible = 1.0
    else:
        eb_tokens = {_safe_str(b).strip().lower() for b in eligible_branches if _safe_str(b).strip()}
        branch_eligible = 1.0 if s_branch in eb_tokens else 0.0

    # --- experience ---
    exp_val = student.get("experience_months")
    s_exp_months = float(exp_val) if not (isinstance(exp_val, float) and np.isnan(exp_val)) and exp_val is not None else 0.0
    
    req_exp_val = job.get("requiredExperienceMonths") if job.get("requiredExperienceMonths") is not None else job.get("required_experience_months")
    req_exp = float(req_exp_val) if not (isinstance(req_exp_val, float) and np.isnan(req_exp_val)) and req_exp_val is not None else 0.0
    
    experience_score = 1.0 if s_exp_months >= req_exp else (s_exp_months / max(req_exp, 1.0))
    experience_gap = max(0.0, req_exp - s_exp_months) / max(req_exp, 1.0)
    
    # --- profile completeness ---
    completeness_points = sum([
        _safe_bool(student.get("bio")),
        _safe_bool(student.get("resume")),
        _safe_bool(student.get("github")),
        _safe_bool(student.get("linkedin")),
        len(s_skills) >= 3,
        cgpa > 0
    ])
    profile_completeness = completeness_points / 6.0

    return np.array([
        float(similarity),      # sbert_similarity
        float(similarity),      # semantic_score
        skill_overlap_ratio,    # skill_overlap_ratio
        cgpa_normalized,        # cgpa_normalized
        cgpa_meets_threshold,   # cgpa_meets_threshold
        backlog_penalty,        # backlog_penalty
        branch_eligible,        # branch_eligible
        experience_score,       # experience_score
        s_exp_months,           # experience_months
        experience_gap,         # experience_gap
        preference_score,       # preference_score
        location_match,         # location_match
        domain_match,           # domain_match
        skill_gap_score,        # skill_gap_score
        profile_completeness,   # profile_completeness
    ], dtype=np.float32)
