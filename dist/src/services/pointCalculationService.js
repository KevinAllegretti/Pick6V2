"use strict";
/*import Pick from '../models/picks';
import User, { IUser } from '../models/user';
import GameOutcome from '../models/gamesOutcome';

export const calculatePointsForWeek = async (week: number) => {
    const outcomes = await GameOutcome.findOne({ week });
    const picksForWeek = await Pick.find({ week });

    if (!outcomes) {
        throw new Error("No outcomes found for the specified week.");
    }

    for (const userPicks of picksForWeek) {
        let points = 0;

        for (const pick of userPicks.picks) {
            const outcome = outcomes.outcomes.find(o => o.team === pick.team);

            if (!outcome) continue;  // or handle this case if an outcome for a pick isn't found

            if (pick.type === 'spread') {
                if (pick.value === outcome.value) {
                    points += 0.5;  // spread push
                } else if ((pick.value - outcome.value) > 0) {
                    points += 2;  // spread win
                }
            } else if (pick.type === 'moneyline') {
                if (pick.value < -250) {
                    points += 1.5;  // favorited moneyline with ML is -250 or higher
                } else if (pick.value > 0) {
                    points += 2;  // underdog moneyline win
                } else {
                    points += 1;  // any other favorited moneyline
                }
            }
        }

        const definiteBonusBet = userPicks.bonusBet as { team: string, type: string, value: number };

        // Handle bonus bet
        const bonusBetOutcome = outcomes.outcomes.find(o => o.team === definiteBonusBet.team);
        if (definiteBonusBet.type === 'spread' && definiteBonusBet.value === bonusBetOutcome?.value) {
            points += 1;
        } else if (definiteBonusBet.type === 'moneyline' && definiteBonusBet.value > 0) {
            points += 1;
        } else {
            points -= 2;
        }

        // Update user's total points
        const user = await User.findById(userPicks.userId);
        if (!user) {
            throw new Error("User not found");
        }

        user.totalPoints = (user.totalPoints || 0) + points;
        await user.save();
    }
};


*/ 
