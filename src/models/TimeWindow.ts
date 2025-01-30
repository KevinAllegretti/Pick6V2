import { Schema, model } from 'mongoose';

const timeWindowSchema = new Schema({
  sundayDeadline: { type: Date, required: true },
  thursdayDeadline: { type: Date, required: true },
  tuesdayStartTime: { type: Date, required: true },
});

export const TimeWindow = model('TimeWindow', timeWindowSchema);
