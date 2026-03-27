/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Validates email, password length, GPA range, name length
 * DEPENDS ON: nothing
 */
export const isValidEmail = (email) => {
	const value = String(email || "").trim();
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isValidPassword = (pw) => {
	const value = String(pw || "");
	return value.length >= 8;
};

export const isValidGPA = (gpa) => {
	const value = Number(gpa);
	if (!Number.isFinite(value)) {
		return false;
	}
	return value >= 0 && value <= 10;
};

export const isValidName = (name) => {
	const value = String(name || "").trim();
	return value.length >= 2;
};