# WHO WRITES THIS: ML developer
# WHAT THIS DOES: Extracts skills, GPA, and raw text from uploaded PDF resume.
#                 Uses pdfminer for text extraction.
#                 Uses regex to find GPA pattern.
#                 Matches extracted text against known SKILL_VOCAB list.
# DEPENDS ON: pdfminer.six

def parse_resume(file_bytes: bytes) -> dict:
    pass
    # TODO: extract text → find skills → find GPA → return dict