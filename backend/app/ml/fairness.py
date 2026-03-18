# WHO WRITES THIS: ML developer
# WHAT THIS DOES: Checks if match scores are biased by college tier.
#                 check_parity() — compares avg score per tier group.
#                 apply_correction() — normalises within-tier if bias found.
#                 Bias threshold: 0.05 score gap between any two tiers.
# DEPENDS ON: pandas, numpy

def check_parity(matches: list) -> dict:
    pass  # TODO: group by college_tier, compare means

def apply_correction(matches: list) -> list:
    pass  # TODO: normalise within tier groups