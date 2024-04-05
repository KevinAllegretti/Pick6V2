// Pool.ts

import mongoose from 'mongoose';


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
    type: mongoose.Schema.Types.String,
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


// Create the model from the schema
const Pool = mongoose.model('Pool', poolSchema);

// Export the model
export default Pool;
