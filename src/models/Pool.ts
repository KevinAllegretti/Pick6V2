// Pool.ts
import mongoose from 'mongoose';
import { poolMemberSchema, survivorPoolMemberSchema } from './poolMember';

interface IMember {
  user: mongoose.Types.ObjectId;
  username: string;
  orderIndex: number;
  points?: number;
  picks?: any[];
  win?: number;
  loss?: number;
  push?: number;
  isEliminated?: boolean;
}

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
  members: {
    type: [mongoose.Schema.Types.Mixed],
    required: true,
    validate: {
      validator: function(this: { mode: string }, members: IMember[]) {
        const mode = this.mode;
        return members.every(member => {
          if (mode === 'classic') {
            return member.points !== undefined;
          } else if (mode === 'survivor') {
            return member.isEliminated !== undefined;
          }
          return false;
        });
      },
      message: 'Members schema must match pool mode (classic/survivor)'
    }
  },
  eliminatedMembers: {  // New field to track eliminated members
    type: [{
      username: String,
      eliminatedAt: Date
    }],
    default: [],
  },
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
// Middleware to use correct member schema based on pool mode
poolSchema.pre('save', function(next) {
  if (this.isModified('mode') || this.isModified('members')) {
    this.members = this.members.map(member => {
      if (this.mode === 'survivor') {
        const { points, picks, win, loss, push, ...survivorMember } = member;
        return survivorMember;
      }
      return member;
    });
  }
  next();
});

const Pool = mongoose.model('Pool', poolSchema);
export default Pool;