const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

export const passwordChecks = (password = '') => ({
  length: password.length >= 8,
  upperLower: /[A-Z]/.test(password) && /[a-z]/.test(password),
  number: /\d/.test(password),
  special: SPECIAL_CHAR_REGEX.test(password),
});

export const isPasswordValid = (password = '') => {
  const checks = passwordChecks(password);
  return checks.length && checks.upperLower && checks.number && checks.special;
};
