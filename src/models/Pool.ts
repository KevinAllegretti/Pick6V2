// Pool.ts

import mongoose from 'mongoose';
import {poolMemberSchema} from './poolMember';

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
  members: [poolMemberSchema],
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
