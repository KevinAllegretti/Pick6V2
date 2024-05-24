import { Schema, model } from 'mongoose';

const timeWindowSchema = new Schema({
  thursdayDeadline: { type: Date, required: true },
  tuesdayStartTime: { type: Date, required: true },
});

export const TimeWindow = model('TimeWindow', timeWindowSchema);
