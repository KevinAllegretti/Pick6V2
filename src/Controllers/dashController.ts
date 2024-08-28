import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { connectToDatabase } from '../microservices/connectDB';
const mlbToNflMap: { [key: string]: string } = {
    "Arizona Diamondbacks": "ARI Cardinals",
    "Atlanta Braves": "ATL Falcons",
    "Baltimore Orioles": "BAL Ravens",
    "Boston Red Sox": "NE Patriots",
    "Chicago Cubs": "CHI Bears",
    "Chicago White Sox": "CHI Bears",
    "Cincinnati Reds": "CIN Bengals",
    "Cleveland Guardians": "CLE Browns",
    "Colorado Rockies": "DEN Broncos",
    "Detroit Tigers": "DET Lions",
    "Houston Astros": "HOU Texans",
    "Kansas City Royals": "KC Chiefs",
    "Los Angeles Angels": "LA Chargers",
    "Los Angeles Dodgers": "LA Rams",
    "Miami Marlins": "MIA Dolphins",
    "Milwaukee Brewers": "GB Packers",
    "Minnesota Twins": "MIN Vikings",
    "New York Yankees": "NY Giants",
    "New York Mets": "NY Jets",
    "Oakland Athletics": "SF 49ers",
    "Philadelphia Phillies": "PHI Eagles",
    "Pittsburgh Pirates": "PIT Steelers",
    "San Francisco Giants": "SF 49ers",
    "Seattle Mariners": "SEA Seahawks",
    "Tampa Bay Rays": "TB Buccaneers",
    "Texas Rangers": "DAL Cowboys",
    "Toronto Blue Jays": "BUF Bills",
    "Washington Nationals": "WAS Commanders"
};
const fetchMLBData = async (req: Request, res: Response) => {
    const url = 'https://odds.p.rapidapi.com/v4/sports/baseball_mlb/odds';
    const params = {
      regions: 'us',
      markets: 'h2h,spreads',
      oddsFormat: 'american',
    };
    const queryParams = new URLSearchParams(params);
    const betOptions: any[] = [];
  
    try {
      console.log(`Fetching data from: ${url}?${queryParams}`);
      const response = await fetch(`${url}?${queryParams}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'odds.p.rapidapi.com',
          'x-rapidapi-key': '3decff06f7mshbc96e9118345205p136794jsn629db332340e'
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Full API Data:", JSON.stringify(data, null, 2)); // Log the entire data set received from the API
  
      data.forEach((event: any) => {
        console.log('Processing event:', JSON.stringify(event, null, 2));
        if (!event.teams || !Array.isArray(event.teams)) {
          if (event.home_team && event.away_team) {
            const nflHomeTeam = mlbToNflMap[event.home_team] || event.home_team;
            const nflAwayTeam = mlbToNflMap[event.away_team] || event.away_team;
            processBookmakers([nflHomeTeam, nflAwayTeam], event.bookmakers, event.commence_time, event.home_team, event.away_team, betOptions);
          }
        } else {
          const nflTeams = event.teams.map((team: any) => mlbToNflMap[team] || team);
          processBookmakers(nflTeams, event.bookmakers, event.commence_time, event.home_team, event.away_team, betOptions);
        }
      });
  
      console.log("Processed Bet Options:", JSON.stringify(betOptions, null, 2)); // Log the processed bet options
      res.json(betOptions);
    } catch (error) {
      console.error('Error fetching MLB data:', error);
      res.status(500).send('Error fetching MLB data');
    }
  };
  
// Helper function to format date as YYYY-MM-DDTHH:MM:SSZ
function formatDateWithoutMilliseconds(date: Date): string {
  return date.toISOString().split('.')[0] + 'Z';
}

const fetchNFLDataOneWeekOut = async (req: Request, res: Response) => {
  const url = 'https://odds.p.rapidapi.com/v4/sports/americanfootball_nfl/odds';
  
  // Calculate the date range for 30 days out
  const today = new Date();
  const oneWeekOutDate = new Date(today);
  oneWeekOutDate.setDate(today.getDate() + 7);
  
  // Format the dates without milliseconds
  const commenceTimeFrom = formatDateWithoutMilliseconds(today);
  const commenceTimeTo = formatDateWithoutMilliseconds(oneWeekOutDate);
  
  console.log('Commence Time From:', commenceTimeFrom);
  console.log('Commence Time To:', commenceTimeTo);

  const params = {
    regions: 'us',
    markets: 'h2h,spreads',
    oddsFormat: 'american',
    commenceTimeFrom: commenceTimeFrom,
    commenceTimeTo: commenceTimeTo,
  };
  const queryParams = new URLSearchParams(params);
  console.log(`Fetching data from: ${url}?${queryParams.toString()}`);

  const betOptions: any[] = [];

  try {
    const response = await fetch(`${url}?${queryParams}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'odds.p.rapidapi.com',
        'x-rapidapi-key': '3decff06f7mshbc96e9118345205p136794jsn629db332340e'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text(); // Log error body
      console.error('Error response:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Full API Data:", JSON.stringify(data, null, 2));

    data.forEach((event: any) => {
      console.log('Processing event:', JSON.stringify(event, null, 2));
      if (!event.teams || !Array.isArray(event.teams)) {
        console.log('Teams are not in expected format, checking home/away teams:', event.home_team, event.away_team);
        if (event.home_team && event.away_team) {
          processBookmakers([event.home_team, event.away_team], event.bookmakers, event.commence_time, event.home_team, event.away_team, betOptions);
        }
      } else {
        processBookmakers(event.teams, event.bookmakers, event.commence_time, event.home_team, event.away_team, betOptions);
      }
    });

    console.log("Processed Bet Options:", JSON.stringify(betOptions, null, 2));
    res.json(betOptions);
  } catch (error) {
    console.error('Error fetching NFL data:', error);
    res.status(500).send('Error fetching NFL data');
  }
};


  

const fetchNFLschedule = async (req: Request, res: Response) => {
  const url = 'https://odds.p.rapidapi.com/v4/sports/americanfootball_nfl/odds';
  const params = {
    regions: 'us',
    markets: 'h2h,spreads',
    oddsFormat: 'american',
  };
  const queryParams = new URLSearchParams(params);
  const betOptions: any[] = [];

  try {
    console.log(`Fetching data from: ${url}?${queryParams}`);
    const response = await fetch(`${url}?${queryParams}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'odds.p.rapidapi.com',
        'x-rapidapi-key': '3decff06f7mshbc96e9118345205p136794jsn629db332340e'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Full API Data:", JSON.stringify(data, null, 2)); // Log the entire data set received from the API

    data.forEach((event: any) => {
      console.log('Processing event:', JSON.stringify(event, null, 2));
      if (!event.teams || !Array.isArray(event.teams)) {
        if (event.home_team && event.away_team) {
          const nflHomeTeam = mlbToNflMap[event.home_team] || event.home_team;
          const nflAwayTeam = mlbToNflMap[event.away_team] || event.away_team;
          processBookmakers([nflHomeTeam, nflAwayTeam], event.bookmakers, event.commence_time, event.home_team, event.away_team, betOptions);
        }
      } else {
        const nflTeams = event.teams.map((team: any) => mlbToNflMap[team] || team);
        processBookmakers(nflTeams, event.bookmakers, event.commence_time, event.home_team, event.away_team, betOptions);
      }
    });

    console.log("Processed Bet Options:", JSON.stringify(betOptions, null, 2)); // Log the processed bet options
    res.json(betOptions);
  } catch (error) {
    console.error('Error fetching NFL data:', error);
    res.status(500).send('Error fetching NFL data');
  }
};
  function processBookmakers(nflTeams: any, bookmakers: any, commenceTime: any, homeTeam: any, awayTeam: any, betOptions: any[]) {
    const nflHomeTeam = mlbToNflMap[homeTeam] || homeTeam;
    const nflAwayTeam = mlbToNflMap[awayTeam] || awayTeam;
  
    console.log(`Processing bookmakers for ${nflHomeTeam} vs ${nflAwayTeam} at ${commenceTime}`);
    bookmakers.forEach((bookmaker: any) => {
      if (bookmaker.key === 'draftkings') {
        console.log(`Processing bookmaker: ${bookmaker.key}`);
        bookmaker.markets.forEach((market: any) => {
          console.log(`Processing market: ${market.key}`);
          market.outcomes.forEach((outcome: any) => {
            console.log(`Processing outcome: ${JSON.stringify(outcome, null, 2)}`);
            const nflTeamName = mlbToNflMap[outcome.name] || outcome.name;
            const betType = market.key === 'h2h' ? 'ML' : 'Spread';
            let betValue = market.key === 'h2h' ? outcome.price : outcome.point;
  
            if (betValue > 0 && !betValue.toString().startsWith('+')) {
              betValue = '+' + betValue;
            }
  
            betOptions.push({
              teamName: nflTeamName,
              teamRole: nflTeamName === nflHomeTeam ? 'home' : 'away',
              awayTeam: nflAwayTeam,
              homeTeam: nflHomeTeam,
              type: betType,
              value: betValue,
              commenceTime: commenceTime
            });
          });
        });
      }
    });
  }

const saveWeeklyPicks = async (req: Request, res: Response) => {
    const { picks } = req.body; // Your NFL transformed data
    try {
      const database = await connectToDatabase();
      const picksCollection = database.collection('weeklyPicks');
      await picksCollection.updateOne(
        { identifier: 'current' },
        { $set: { picks: picks, updated: new Date() } },
        { upsert: true }
      );
      res.json({ success: true, message: 'Picks saved successfully' });
    } catch (error: any) {
      console.error('Failed to save picks:', error);
      res.status(500).json({ success: false, message: 'Failed to save picks', error: error.toString() });
    }
  };
  
  const saveNFLSchedule = async (req: Request, res: Response) => {
    const { picks } = req.body; // Your NFL transformed data
    try {
      const database = await connectToDatabase();
      const picksCollection = database.collection('nflSchedule');
      const existingData = await picksCollection.findOne({ identifier: 'current' });
  
      let newPicks = picks;
      if (existingData && existingData.picks) {
        newPicks = existingData.picks.concat(picks);
        console.log(`Existing picks length: ${existingData.picks.length}`);
        console.log(`New picks length: ${newPicks.length}`);
      }
  
      await picksCollection.updateOne(
        { identifier: 'current' },
        { $set: { picks: newPicks, updated: new Date() } },
        { upsert: true }
      );
  
      res.json({ success: true, message: 'Schedule saved successfully' });
    } catch (error: any) {
      console.error('Failed to save schedule:', error);
      res.status(500).json({ success: false, message: 'Failed to save schedule', error: error.toString() });
    }
  };
  // Fetch distinct teams and weeks
export const fetchTeamsAndWeeks = async (req: Request, res: Response) => {
  try {
    const database = await connectToDatabase();
    const picksCollection = database.collection('nflSchedule');
    const scheduleData = await picksCollection.findOne({ identifier: 'current' });

    if (!scheduleData) {
      return res.status(404).json({ success: false, message: 'No schedule data found' });
    }

    const teams = [...new Set(scheduleData.picks.map(game => game.awayTeam).concat(scheduleData.picks.map(game => game.homeTeam)))];
    const weeks = Array.from({ length: 18 }, (_, i) => i + 1); // Weeks 1 to 18

    res.json({ success: true, teams, weeks });
  } catch (error: any) {
    console.error('Failed to fetch teams and weeks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teams and weeks', error: error.toString() });
  }
};

// Fetch games by team or week
export const fetchGamesByFilter = async (req: Request, res: Response) => {
  const { team, week } = req.body;
  try {
    const database = await connectToDatabase();
    const picksCollection = database.collection('nflSchedule');
    const scheduleData = await picksCollection.findOne({ identifier: 'current' });

    if (!scheduleData) {
      return res.status(404).json({ success: false, message: 'No schedule data found' });
    }

    let filteredGames = scheduleData.picks;

    if (team) {
      filteredGames = filteredGames.filter(game => game.awayTeam === team || game.homeTeam === team);
    }

    if (week) {
      const weekNumber = parseInt(week);
      filteredGames = filteredGames.filter(game => {
        const gameDate = new Date(game.commenceTime);
        const gameWeek = getNFLWeekNumber(gameDate);
        return gameWeek === weekNumber;
      });
    }

    // Filter out duplicate games
    filteredGames = filterUniqueGames(filteredGames);

    res.json({ success: true, games: filteredGames });
  } catch (error: any) {
    console.error('Failed to fetch games:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch games', error: error.toString() });
  }
};

// Helper function to get the NFL week number
const getNFLWeekNumber = (date: Date): number => {
  const startMonth = 8; // September
  const year = date.getFullYear();
  const firstDayOfMonth = new Date(year, startMonth, 1);
  let firstThursdayOfMonth = firstDayOfMonth;

  // Find the first Thursday of September
  while (firstThursdayOfMonth.getDay() !== 4) {
    firstThursdayOfMonth.setDate(firstThursdayOfMonth.getDate() + 1);
  }

  // Calculate the number of days since the start of the NFL season
  const days = Math.floor((date.getTime() - firstThursdayOfMonth.getTime()) / (24 * 60 * 60 * 1000));

  // Calculate the week number, ensuring correct handling of all weeks
  let weekNumber = Math.ceil((days + 3) / 7);

  // Special handling for the last week of the season (Week 18)
  if (weekNumber > 18) {
    weekNumber = 18;
  }

  return weekNumber;
};



// Helper function to filter unique games
const filterUniqueGames = (games: any[]): any[] => {
  const seen = new Set();
  return games.filter(game => {
    const gameKey = `${game.homeTeam}-${game.awayTeam}-${game.commenceTime}`;
    if (seen.has(gameKey)) {
      return false;
    }
    seen.add(gameKey);
    return true;
  });
};



export { fetchMLBData, saveWeeklyPicks, fetchNFLschedule, saveNFLSchedule, fetchNFLDataOneWeekOut };
