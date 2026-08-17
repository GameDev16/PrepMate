// Password validation utilities - duplicated from server for client-side strength meter

export function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (password.length > 128) errors.push("Maximum 128 characters");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("One number");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) errors.push("One special character (!@#$%^&*...)");

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) score++;
  if (password.length >= 16) score++;

  let strength = "weak";
  if (score >= 7) strength = "strong";
  else if (score >= 5) strength = "good";
  else if (score >= 3) strength = "fair";

  return { isValid: errors.length === 0, errors, strength };
}

export function getStrengthColor(strength) {
  switch (strength) {
    case "strong": return "#16ab59";
    case "good": return "#2727e6";
    case "fair": return "#ffda00";
    default: return "#ff4141";
  }
}

export function getStrengthPercent(strength) {
  switch (strength) {
    case "strong": return 100;
    case "good": return 75;
    case "fair": return 50;
    default: return 25;
  }
}


