// Updated Pool.ts with championship fields
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
  weeklyPoints: number; // Current week's points
  pointsHistory: {     // New field to track historical points
    week: number;
    points: number;
    position: string;  // Track the position they were in during that week
    opponent?: string; // Store the opponent they faced (username)
    opponentPoints?: number; // Points their opponent had
  }[];
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

// New interface for the champion info
interface IPlayoffChampion {
  username: string;
  seed: number;
  winningPoints: number;
  dateWon: Date;
  win: number;
  loss: number;
  push: number;
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
  lastScoresUpdate: {
  type: Date
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
    enum: ['classic', 'survivor', 'golf'], 
    default: 'classic',
    required: true
  },

  idleTime: {
    type: Boolean,
    default: false
  },
  
  draftTime: {
    type: Boolean,
    default: false
  },
  
  playTime: {
    type: Boolean,
    default: false
  },
  
  draftOrder: [{
    username: String,
    picks: [{
      round: Number,
      golferName: String,
      pickTime: Date
    }]
  }],
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
      pointsHistory: [{
        week: Number,
        points: Number,
        position: String,
        opponent: String,
        opponentPoints: Number,
        matchId: String,
        roundNumber: Number,
        advanced: Boolean
      }],
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
  },
  
  // New fields for championship features
  playoffCompleted: {
    type: Boolean,
    default: false
  },
  
  playoffChampion: {
    username: String,
    seed: Number,
    winningPoints: Number,
    dateWon: {
      type: Date,
      default: Date.now
    },
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
  }
});

// Middleware to use correct member schema based on pool mode
// Middleware to use correct member schema based on pool mode
poolSchema.pre('save', function(next) {
  if (this.isModified('mode') || this.isModified('members')) {
    this.members = this.members.map(member => {
      if (this.mode === 'survivor') {
        const { points, picks, win, loss, push, ...survivorMember } = member;
        return survivorMember;
      } else if (this.mode === 'golf') {
        // Keep picks for golf mode but remove classic stats
        const { points, win, loss, push, ...golfMember } = member;
        return golfMember;
      }
      return member;
    });
  }
  next();
});

const Pool = mongoose.model('Pool', poolSchema);
export default Pool;