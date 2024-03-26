// Pool.ts

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Define the Pool schema
const poolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminUsername: {
    type: String,
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isPrivate: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to hash password for private pools
poolSchema.pre('save', async function (next) {
  const pool = this as any; // Cast to 'any' type to avoid type checking issues in this context
  if (pool.isPrivate && pool.isModified('password')) {
    pool.password = await bcrypt.hash(pool.password, 10);
  }
  next();
});

// Create the model from the schema
const Pool = mongoose.model('Pool', poolSchema);

// Export the model
export default Pool;
