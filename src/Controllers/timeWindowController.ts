import { Request, Response } from 'express';
import { TimeWindow } from '../models/TimeWindow';

export const getTimeWindows = async (req: Request, res: Response) => {
  try {
    const timeWindow = await TimeWindow.findOne();
    res.json(timeWindow);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const updateTimeWindows = async (req: Request, res: Response) => {
  try {
    const { thursdayDeadline, tuesdayStartTime } = req.body;
    const timeWindow = await TimeWindow.findOneAndUpdate(
      {},
      { thursdayDeadline, tuesdayStartTime },
      { new: true, upsert: true }
    );
    res.json(timeWindow);
  } catch (error:any) {
    res.status(500).send(error);
  }
};
