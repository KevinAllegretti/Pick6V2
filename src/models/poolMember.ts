//poolMember.ts
import mongoose from 'mongoose';

const poolMemberSchema = new mongoose.Schema({
  pool: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pool', 
    required: false 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  username: {
    type: String,
    required: true,
  },
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
  },

});

export {poolMemberSchema}