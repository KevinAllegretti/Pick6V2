// poolMember.ts
import mongoose from 'mongoose';

// Base schema for shared fields between classic and survivor members
const basePoolMemberSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  username: {
    type: String,
    required: true,
  },
  orderIndex: {
    type: Number,
    default: 0
  }
});

// Classic pool member schema (existing functionality)
const poolMemberSchema = basePoolMemberSchema.clone();
poolMemberSchema.add({
  points: { 
    type: Number, 
    default: 0 
  },
  picks: [{
    // Structure of a pick
  }],
  win: { 
    type: Number, 
    default: 0 
  },
  loss: { 
    type: Number, 
    default: 0 
  },
  push: { 
    type: Number, 
    default: 0 
  }
});

// New survivor pool member schema
const survivorPoolMemberSchema = basePoolMemberSchema.clone();
survivorPoolMemberSchema.add({
  isEliminated: {
    type: Boolean,
    default: false
  }
});

export { poolMemberSchema, survivorPoolMemberSchema }