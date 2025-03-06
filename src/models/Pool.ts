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
interface IPlayoffMember {
  user: mongoose.Types.ObjectId;
  username: string;
  seed: number;
  position: string;
  weeklyPoints: number;
  eliminatedInWeek?: number;
  hasBye: boolean;
  isAdvancing: boolean;
  picks?: any[];
  win?: number;
  loss?: number;
  push?: number;
}

interface IPlayoffMatch {
  matchId: string;
  round: number;
  week: number;
  player1Position: string;
  player2Position: string;
  player1Id?: mongoose.Types.ObjectId;
  player2Id?: mongoose.Types.ObjectId;
  winner?: string;
  nextMatchPosition: string;
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
      eliminatedAt: Date,
      eliminationWeek: Number
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

  hasPlayoffs: {
    type: Boolean,
    default: false
  },
  
  playoffMembers: {
    type: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      username: {
        type: String,
        required: true
      },
      seed: {
        type: Number,
        required: true
      },
      position: {
        type: String,
        required: true
      },
      weeklyPoints: {
        type: Number,
        default: 0
      },
      eliminatedInWeek: {
        type: Number
      },
      hasBye: {
        type: Boolean,
        default: false
      },
      isAdvancing: {
        type: Boolean,
        default: false
      },
      picks: [{ 
        teamName: String,
        type: String,
        value: String,
        teamRole: String,
        awayTeam: String,
        homeTeam: String,
        commenceTime: Date
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
    }],
    default: []
  },
  
  playoffBracket: {
    type: [{
      matchId: String,
      round: Number,
      week: Number,
      player1Position: String,
      player2Position: String,
      player1Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      player2Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      winner: String,
      nextMatchPosition: String
    }],
    default: []
  },
  
  playoffCurrentWeek: {
    type: Number,
    min: 14,
    max: 17
  },
  
  playoffWinner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
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