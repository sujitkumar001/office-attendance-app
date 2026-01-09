export const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateName = (name) => {
  return name.trim().length >= 2;
};

export const validateForm = (formData, type = 'login') => {
  const errors = {};

  if (type === 'register') {
    if (!formData.name || !validateName(formData.name)) {
      errors.name = 'Name must be at least 2 characters';
    }
  }

  if (!formData.email || !validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.password || !validatePassword(formData.password)) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (type === 'register') {
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      errors.role = 'Please select your role';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};