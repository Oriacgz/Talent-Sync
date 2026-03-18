# WHO WRITES THIS: ML developer
# WHAT THIS DOES: Pre-computes SBERT embeddings for all job postings in DB.
#                 Stores embedding_vector back into job_postings table.
#                 Run this after seeding jobs, before demo.
# DEPENDS ON: ml/encoder.py, JobPosting model, database.py

def generate():
    pass  # TODO: query all jobs, encode description, save vector

if __name__ == "__main__":
    generate()