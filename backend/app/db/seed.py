# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Seeds demo data into the database for presentation.
#                 Creates 1 recruiter + 5 jobs + 3 students with complete profiles.
#                 Run once: python -m app.db.seed
# DEPENDS ON: all models, auth_service (for password hashing)

def seed():
    pass  # TODO: implement demo data seeding

if __name__ == "__main__":
    seed()