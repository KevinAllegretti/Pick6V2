// Pool.ts
import mongoose from 'mongoose';
import {poolMemberSchema} from './poolMember';

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
  mode: {
    type: String,
    enum: ['classic', 'survivor'],
    default: 'classic',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Pool = mongoose.model('Pool', poolSchema);
export default Pool;