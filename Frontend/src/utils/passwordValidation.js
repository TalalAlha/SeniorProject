/**
 * passwordValidation.js — Password strength rule evaluation utilities.
 *
 * Used by PasswordRequirements to show live feedback and by form validators
 * to gate submission until all rules are satisfied.
 */
// Matches any character that is not alphanumeric (i.e. a special character)
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

/** Return an object with boolean flags for each password strength rule. */
export const passwordChecks = (password = '') => ({
  length: password.length >= 8,
  upperLower: /[A-Z]/.test(password) && /[a-z]/.test(password),
  number: /\d/.test(password),
  special: SPECIAL_CHAR_REGEX.test(password),
});

/** Return true only when all four password strength rules are satisfied. */
export const isPasswordValid = (password = '') => {
  const checks = passwordChecks(password);
  return checks.length && checks.upperLower && checks.number && checks.special;
};
