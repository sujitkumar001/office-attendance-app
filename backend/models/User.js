const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['employee', 'manager'],
      default: 'employee',
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Please provide your date of birth'],
    },
    profileInitial: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Combined pre-save middleware
userSchema.pre('save', async function () {
  // Set profile initial
  if (this.isNew || this.isModified('name')) {
    this.profileInitial = this.name.charAt(0).toUpperCase();
  }

  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if today is birthday
userSchema.methods.isBirthdayToday = function () {
  if (!this.dateOfBirth) return false;
  
  const today = new Date();
  const dob = new Date(this.dateOfBirth);
  
  return (
    today.getMonth() === dob.getMonth() &&
    today.getDate() === dob.getDate()
  );
};

// Method to get age
userSchema.methods.getAge = function () {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const dob = new Date(this.dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    dateOfBirth: this.dateOfBirth,
    profileInitial: this.profileInitial,
    isActive: this.isActive,
    createdAt: this.createdAt,
    isBirthdayToday: this.isBirthdayToday(),
    age: this.getAge(),
  };
};

// Static method to get today's birthdays
userSchema.statics.getTodaysBirthdays = async function () {
  const today = new Date();
  const month = today.getMonth() + 1; // 1-12
  const day = today.getDate();
  
  const allUsers = await this.find({ isActive: true }).select('name email role dateOfBirth profileInitial');
  
  const birthdayUsers = allUsers.filter(user => {
    if (!user.dateOfBirth) return false;
    const dob = new Date(user.dateOfBirth);
    return (dob.getMonth() + 1) === month && dob.getDate() === day;
  });
  
  return birthdayUsers.map(user => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileInitial: user.profileInitial,
    age: user.getAge(),
    dateOfBirth: user.dateOfBirth,
  }));
};

module.exports = mongoose.model('User', userSchema);