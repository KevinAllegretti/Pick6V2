// Core variables
const storedUsername = localStorage.getItem('username')?.toLowerCase();
let selectedPool = 'all';
let picksCount = 0;
let userPicks = [];
let userImmortalLock = null;
let betOptions = [];
let isDeadline = false;
let lastWeekPicks = {}; 


async function blackOutPreviousBets() {
    let key;
    if (selectedPool === 'all') {
        try {
            const response = await fetch(`/pools/userPools/${encodeURIComponent(storedUsername)}`);
            const pools = await response.json();
            const classicPools = pools.filter(pool => pool.mode === 'classic');
            if (classicPools.length > 0) {
                key = classicPools[0].name;
                // Fetch last week's picks if they don't exist
                if (!lastWeekPicks[key]) {
                    await fetchLastWeekPicks(storedUsername, key);
                }
                await applyBlackout(key);
            }
        } catch (error) {
            console.error('Error fetching pools:', error);
        }
    } else {
        key = selectedPool;
        // Fetch last week's picks if they don't exist
        if (!lastWeekPicks[key]) {
            await fetchLastWeekPicks(storedUsername, key);
        }
        await applyBlackout(key);
    }
}

async function applyBlackout(key) {
    console.log('Blackout - Selected Pool:', selectedPool);
    console.log('Blackout - Using key:', key);
    console.log('Blackout - Last Week Picks:', lastWeekPicks[key]);
    
    // Handle regular picks
    if (lastWeekPicks[key] && Array.isArray(lastWeekPicks[key].picks)) {
        lastWeekPicks[key].picks.forEach(pick => {
            const teamClass = pick.teamName.replace(/\s+/g, '-').toLowerCase();
            const typeClass = pick.type.toLowerCase();
            const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`);

            console.log(`Blacking out regular pick: ${pick.teamName} ${pick.type}`);
            betButtons.forEach(button => {
                button.style.backgroundColor = 'black';
                button.style.color = 'red';
                button.dataset.previousPick = 'true';
                button.title = 'You made this pick last week!';
            });
        });
    }

    // Handle immortal lock pick
    if (lastWeekPicks[key] && lastWeekPicks[key].immortalLockPick) {
        // Handle both array and single object cases
        const immortalLocks = Array.isArray(lastWeekPicks[key].immortalLockPick) 
            ? lastWeekPicks[key].immortalLockPick 
            : [lastWeekPicks[key].immortalLockPick];

        immortalLocks.forEach(immortalPick => {
            if (immortalPick && immortalPick.teamName && immortalPick.type) {
                console.log('Processing immortal lock:', immortalPick);
                const teamClass = immortalPick.teamName.replace(/\s+/g, '-').toLowerCase();
                const typeClass = immortalPick.type.toLowerCase();
                
                const betButtons = document.querySelectorAll(
                    `.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`
                );
                
                console.log(`Found ${betButtons.length} buttons to blackout for immortal lock`);
                betButtons.forEach(button => {
                    button.style.backgroundColor = 'black';
                    button.style.color = 'red';
                    button.dataset.previousPick = 'true';
                    button.dataset.previousImmortalLock = 'true';
                    button.title = 'This was your Immortal Lock pick last week!';
                });
            }
        });
    }
}

function applyBlackout(key) {
    console.log('Blackout - Selected Pool:', selectedPool);
    console.log('Blackout - Using key:', key);
    console.log('Blackout - Last Week Picks:', lastWeekPicks[key]);
    
    // Handle regular picks
    if (lastWeekPicks[key] && Array.isArray(lastWeekPicks[key].picks)) {
        lastWeekPicks[key].picks.forEach(pick => {
            const teamClass = pick.teamName.replace(/\s+/g, '-').toLowerCase();
            const typeClass = pick.type.toLowerCase();
            const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`);

            console.log(`Blacking out regular pick: ${pick.teamName} ${pick.type}`);
            betButtons.forEach(button => {
                button.style.backgroundColor = 'black';
                button.style.color = 'red';
                button.dataset.previousPick = 'true';
                button.title = 'You made this pick last week!';
            });
        });
    }

    // Handle immortal lock pick
    if (lastWeekPicks[key] && lastWeekPicks[key].immortalLockPick) {
        // Handle both array and single object cases
        const immortalLocks = Array.isArray(lastWeekPicks[key].immortalLockPick) 
            ? lastWeekPicks[key].immortalLockPick 
            : [lastWeekPicks[key].immortalLockPick];

        immortalLocks.forEach(immortalPick => {
            if (immortalPick && immortalPick.teamName && immortalPick.type) {
                console.log('Processing immortal lock:', immortalPick);
                const teamClass = immortalPick.teamName.replace(/\s+/g, '-').toLowerCase();
                const typeClass = immortalPick.type.toLowerCase();
                
                const betButtons = document.querySelectorAll(
                    `.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`
                );
                
                console.log(`Found ${betButtons.length} buttons to blackout for immortal lock`);
                betButtons.forEach(button => {
                    button.style.backgroundColor = 'black';
                    button.style.color = 'red';
                    button.dataset.previousPick = 'true';
                    button.dataset.previousImmortalLock = 'true';
                    button.title = 'This was your Immortal Lock pick last week!';
                });
            }
        });
    }
}

function applyBlackout(key) {
    console.log('Blackout - Selected Pool:', selectedPool);
    console.log('Blackout - Using key:', key);
    console.log('Blackout - Last Week Picks:', lastWeekPicks[key]);
    
    // Handle regular picks
    if (lastWeekPicks[key] && Array.isArray(lastWeekPicks[key].picks)) {
        lastWeekPicks[key].picks.forEach(pick => {
            const teamClass = pick.teamName.replace(/\s+/g, '-').toLowerCase();
            const typeClass = pick.type.toLowerCase();
            const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`);

            console.log(`Blacking out regular pick: ${pick.teamName} ${pick.type}`);
            betButtons.forEach(button => {
                button.style.backgroundColor = 'black';
                button.style.color = 'red';
                button.dataset.previousPick = 'true';
                button.title = 'You made this pick last week!';
            });
        });
    }

    // Handle immortal lock pick
    if (lastWeekPicks[key] && lastWeekPicks[key].immortalLockPick) {
        // Handle both array and single object cases
        const immortalLocks = Array.isArray(lastWeekPicks[key].immortalLockPick) 
            ? lastWeekPicks[key].immortalLockPick 
            : [lastWeekPicks[key].immortalLockPick];

        immortalLocks.forEach(immortalPick => {
            if (immortalPick && immortalPick.teamName && immortalPick.type) {
                console.log('Processing immortal lock:', immortalPick);
                const teamClass = immortalPick.teamName.replace(/\s+/g, '-').toLowerCase();
                const typeClass = immortalPick.type.toLowerCase();
                
                const betButtons = document.querySelectorAll(
                    `.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`
                );
                
                console.log(`Found ${betButtons.length} buttons to blackout for immortal lock`);
                betButtons.forEach(button => {
                    button.style.backgroundColor = 'black';
                    button.style.color = 'red';
                    button.dataset.previousPick = 'true';
                    button.dataset.previousImmortalLock = 'true';
                    button.title = 'This was your Immortal Lock pick last week!';
                });
            }
        });
    }
}
// Also update the validatePick function to properly handle immortal locks
function validatePick(option) {
    const betButton = document.querySelector(
        `.bet-button[data-team="${option.teamName.replace(/\s+/g, '-').toLowerCase()}"][data-type="${option.type.toLowerCase()}"]`
    );
    
    if (betButton?.dataset.previousPick === 'true') {
        const message = betButton.dataset.previousImmortalLock 
            ? "This was your Immortal Lock pick last week. You cannot select it again."
            : "You made this pick last week. You cannot select it again.";
        alert(message);
        return false;
    }

    // Rest of the validation logic...
    const currentMatchup = betOptions.find(bet => 
        bet.homeTeam === option.teamName || bet.awayTeam === option.teamName
    );
    
    if (!currentMatchup) {
        console.error('No matchup found for team:', option.teamName);
        return false;
    }

    return true;
}

// Add debug logging to fetchLastWeekPicks
async function fetchLastWeekPicks(username, poolName) {
    try {
        const response = await fetch(`/api/getLastWeekPicks/${encodeURIComponent(username)}/${encodeURIComponent(poolName)}`);
        if (!response.ok) throw new Error('Failed to fetch last week picks');
        
        const data = await response.json();
        console.log('Last week picks raw data:', data);
        
        // Only process and store data if success is true
        if (data.success) {
            // Store with just the pool name as key
            lastWeekPicks[poolName] = {
                picks: Array.isArray(data.picks) ? data.picks : [],
                immortalLockPick: data.immortalLockPick || null
            };

            console.log('Processed last week picks:', lastWeekPicks[poolName]);
            
            // Only blackout if we have actual picks
            if (lastWeekPicks[poolName].picks.length > 0 || lastWeekPicks[poolName].immortalLockPick) {
                blackOutPreviousBets();
            }
        } else {
            console.log('No last week picks available');
            lastWeekPicks[poolName] = {
                picks: [],
                immortalLockPick: null
            };
        }
    } catch (error) {
        console.error('Error fetching last week picks:', error);
        // Still initialize the object with empty arrays even on error
        lastWeekPicks[poolName] = {
            picks: [],
            immortalLockPick: null
        };
    }
}


// Add this helper function to check if a team was picked last week
function wasPickedLastWeek(teamName, type) {
    const key = `${storedUsername}-${selectedPool}`;
    if (!lastWeekPicks[key]) return false;

    // Check regular picks
    const regularPickMatch = lastWeekPicks[key].picks?.some(pick => 
        pick.teamName === teamName && pick.type === type
    );

    // Check immortal lock pick
    const immortalLockMatch = lastWeekPicks[key].immortalLockPick?.teamName === teamName;

    return regularPickMatch || immortalLockMatch;
}
// Team mapping constants
const mlbToNflMap = {
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

// Team colors and styles
const teamColorClasses = {
    'Arizona Cardinals': 'cardinals-color',
    'Atlanta Falcons': 'falcons-color',
    'Baltimore Ravens': 'ravens-color',
    'Buffalo Bills': 'bills-color',
    'Carolina Panthers': 'panthers-color',
    'Chicago Bears': 'bears-color',
    'Cincinnati Bengals': 'bengals-color',
    'Cleveland Browns': 'browns-color',
    'Dallas Cowboys': 'cowboys-color',
    'Denver Broncos': 'broncos-color',
    'Detroit Lions': 'lions-color',
    'Green Bay Packers': 'packers-color',
    'Houston Texans': 'texans-color',
    'Indianapolis Colts': 'colts-color',
    'Jacksonville Jaguars': 'jaguars-color',
    'Kansas City Chiefs': 'chiefs-color',
    'Las Vegas Raiders': 'raiders-color',
    'Los Angeles Chargers': 'chargers-color',
    'Los Angeles Rams': 'rams-color',
    'Miami Dolphins': 'dolphins-color',
    'Minnesota Vikings': 'vikings-color',
    'New England Patriots': 'patriots-color',
    'New Orleans Saints': 'saints-color',
    'New York Giants': 'giants-color',
    'New York Jets': 'jets-color',
    'Philadelphia Eagles': 'eagles-color',
    'Pittsburgh Steelers': 'steelers-color',
    'San Francisco 49ers': 'FortyNiners-color',
    'Seattle Seahawks': 'seahawks-color',
    'Tampa Bay Buccaneers': 'buccaneers-color',
    'Tennessee Titans': 'titans-color',
    'Washington Commanders': 'commanders-color'
};

// Team logos
const teamLogos = {
    'Arizona Cardinals': '/ARILogo.png',
    'Atlanta Falcons': '/ATLLogo.png',
    'Baltimore Ravens': '/BALLogo.png',
    'Buffalo Bills': '/BUFLogo.png',
    'Carolina Panthers': '/CARLogo.png',
    'Chicago Bears': '/CHILogo.png',
    'Cincinnati Bengals': '/CINLogo.png',
    'Cleveland Browns': '/CLELogo.png',
    'Dallas Cowboys': '/DALLogo.png',
    'Denver Broncos': '/DENLogo.png',
    'Detroit Lions': '/DETLogo.png',
    'Green Bay Packers': '/GBLogo.png',
    'Houston Texans': '/HOULogo.png',
    'Indianapolis Colts': '/INDLogo.png',
    'Jacksonville Jaguars': '/JAXLogo.png',
    'Kansas City Chiefs': '/KCLogo.png',
    'Las Vegas Raiders': '/LVLogo.png',
    'Los Angeles Chargers': '/LACLogo.png',
    'Los Angeles Rams': '/LARLogo.png',
    'Miami Dolphins': '/MIALogo.png',
    'Minnesota Vikings': '/MINLogo.png',
    'New England Patriots': '/NELogo.png',
    'New Orleans Saints': '/NOLogo.png',
    'New York Giants': '/NYGLogo.png',
    'New York Jets': '/NYJLogo.png',
    'Philadelphia Eagles': '/PHILogo.png',
    'Pittsburgh Steelers': '/PITLogo.png',
    'San Francisco 49ers': '/SFLogo.png',
    'Seattle Seahawks': '/SEALogo.png',
    'Tampa Bay Buccaneers': '/TBLogo.png',
    'Tennessee Titans': '/TENLogo.png',
    'Washington Commanders': '/WASLogo.png'
};

// Injury team mapping
const injuryTeamNameMap = {
    'Arizona Cardinals': 'Arizona Cardinals',
    'Atlanta Falcons': 'Atlanta Falcons',
    'Baltimore Ravens': 'Baltimore Ravens',
    'Buffalo Bills': 'Buffalo Bills',
    'Carolina Panthers': 'Carolina Panthers',
    'Chicago Bears': 'Chicago Bears',
    'Cincinnati Bengals': 'Cincinnati Bengals',
    'Cleveland Browns': 'Cleveland Browns',
    'Dallas Cowboys': 'Dallas Cowboys',
    'Denver Broncos': 'Denver Broncos',
    'Detroit Lions': 'Detroit Lions',
    'Green Bay Packers': 'Green Bay Packers',
    'Houston Texans': 'Houston Texans',
    'Indianapolis Colts': 'Indianapolis Colts',
    'Jacksonville Jaguars': 'Jacksonville Jaguars',
    'Kansas City Chiefs': 'Kansas City Chiefs',
    'Las Vegas Raiders': 'Las Vegas Raiders',
    'Los Angeles Chargers': 'Los Angeles Chargers',
    'Los Angeles Rams': 'Los Angeles Rams',
    'Miami Dolphins': 'Miami Dolphins',
    'Minnesota Vikings': 'Minnesota Vikings',
    'New England Patriots': 'New England Patriots',
    'New Orleans Saints': 'New Orleans Saints',
    'New York Giants': 'New York Giants',
    'New York Jets': 'New York Jets',
    'Philadelphia Eagles': 'Philadelphia Eagles',
    'Pittsburgh Steelers': 'Pittsburgh Steelers',
    'San Francisco 49ers': 'San Francisco 49ers',
    'Seattle Seahawks': 'Seattle Seahawks',
    'Tampa Bay Buccaneers': 'Tampa Bay Buccaneers',
    'Tennessee Titans': 'Tennessee Titans',
    'Washington Commanders': 'Washington Commanders'
};

document.addEventListener('DOMContentLoaded', async () => {
    if (storedUsername) {
        try {
            // Check time window first
            const timeResponse = await fetch('/api/timewindows');
            if (!timeResponse.ok) throw new Error('Failed to fetch time windows.');
            
            const { thursdayDeadline, sundayDeadline } = await timeResponse.json();
            const now = getCurrentTimeInUTC4();
            const thursdayTime = new Date(thursdayDeadline);
            const sundayTime = new Date(sundayDeadline);
            
            const isThursdayGameTime = now > thursdayTime && now < sundayTime;
            const injuryContainer = document.getElementById('injuryContainer');
            if (injuryContainer) {
                injuryContainer.classList.add('hidden-border');
                injuryContainer.classList.remove('visible-border');
            }
            // Initialize dashboard first
            await initializeDashboard();

            // If it's Thursday game time, apply the features after a delay
            if (isThursdayGameTime) {
                setTimeout(() => {
                    enableThursdayGameFeatures();
                }, 100);
            }
        } catch (error) {
            console.error('Error during initialization:', error);
        }
        
        isInitialPageLoad = false;
    }
});


// Modified initializeDashboard function with better error handling
async function initializeDashboard() {
    if (!storedUsername) {
        console.error('Username not found in storage');
        return;
    }

    try {
        // Load weekly picks first
        await loadWeeklyPicks();

        // Setup event listeners
        setupEventListeners();

        // Initialize pool selector and fetch initial picks
        await populatePoolSelector();

        // Don't need to explicitly call fetchUserPicksAndRender here
        // as populatePoolSelector will handle it

        // Fetch last week's picks
        await fetchLastWeekPicks(storedUsername, selectedPool);

        // Check time window
        await checkCurrentTimeWindow();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}
/*
async function populatePoolSelector() {
    const poolSelector = document.getElementById('poolSelector');
    if (!poolSelector) {
        console.error('Pool selector element not found');
        return;
    }

    const currentSelection = poolSelector.value;
    poolSelector.innerHTML = '<option value="loading">Loading pools...</option>';

    try {
        // First check if we're in Thursday game time window
        const timeResponse = await fetch('/api/timewindows');
        if (!timeResponse.ok) throw new Error('Failed to fetch time windows.');
        
        const { thursdayDeadline, sundayDeadline } = await timeResponse.json();
        const now = getCurrentTimeInUTC4();
        const thursdayTime = new Date(thursdayDeadline);
        const sundayTime = new Date(sundayDeadline);
        
        const isThursdayGameTime = now > thursdayTime && now < sundayTime;

        // Fetch pools
        const response = await fetch(`/pools/userPools/${encodeURIComponent(storedUsername)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pools = await response.json();
        const classicPools = pools.filter(pool => pool.mode === 'classic');

        if (classicPools.length === 0) {
            poolSelector.innerHTML = '<option value="none">User is in no classic pools</option>';
            return;
        }

        // Clear any existing warnings
        const existingWarnings = document.querySelectorAll('.thursday-warning');
        existingWarnings.forEach(warning => warning.remove());

        let shouldShowAllOption = true;
        let allPoolsThursdayPicks = [];

        // Only check for Thursday picks if we're in Thursday game time
        if (isThursdayGameTime) {
            // Fetch picks for all pools
            const poolPicks = await Promise.all(classicPools.map(async pool => {
                try {
                    const picksResponse = await fetch(`/api/getPicks/${storedUsername}/${pool.name}`);
                    const data = await picksResponse.json();
                    return {
                        poolName: pool.name,
                        picks: data.picks || [],
                        immortalLock: data.immortalLock || []
                    };
                } catch (error) {
                    console.error(`Error checking picks for pool ${pool.name}:`, error);
                    return null;
                }
            }));

            // Filter out any failed requests
            const validPoolPicks = poolPicks.filter(pick => pick !== null);

            // Extract Thursday picks from each pool
            const thursdayPicksByPool = validPoolPicks.map(poolData => {
                const thursdayPicks = (poolData.picks || []).filter(pick => 
                    checkIfThursdayGame(pick.commenceTime) && 
                    new Date(pick.commenceTime) < now
                );
                
                const thursdayImmortalLock = (poolData.immortalLock || []).filter(lock => 
                    checkIfThursdayGame(lock.commenceTime) && 
                    new Date(lock.commenceTime) < now
                );

                return {
                    poolName: poolData.poolName,
                    thursdayPicks,
                    thursdayImmortalLock
                };
            });

            // Check if all pools have the same Thursday picks
            const hasThursdayPicks = thursdayPicksByPool.some(pool => 
                pool.thursdayPicks.length > 0 || pool.thursdayImmortalLock.length > 0
            );

            if (hasThursdayPicks) {
                const firstPoolWithPicks = thursdayPicksByPool.find(pool => 
                    pool.thursdayPicks.length > 0 || pool.thursdayImmortalLock.length > 0
                );

                const allPoolsMatch = thursdayPicksByPool.every(pool => {
                    const picksMatch = JSON.stringify(sortPicks(pool.thursdayPicks)) === 
                                     JSON.stringify(sortPicks(firstPoolWithPicks.thursdayPicks));
                    const locksMatch = JSON.stringify(sortPicks(pool.thursdayImmortalLock)) === 
                                     JSON.stringify(sortPicks(firstPoolWithPicks.thursdayImmortalLock));
                    return picksMatch && locksMatch;
                });

                shouldShowAllOption = allPoolsMatch;
                
                if (allPoolsMatch) {
                    allPoolsThursdayPicks = {
                        picks: firstPoolWithPicks.thursdayPicks,
                        immortalLock: firstPoolWithPicks.thursdayImmortalLock
                    };
                } else {
                    // Add warning message
                    const container = poolSelector.closest('.pool-selector-container');
                    if (container) {
                        const warningDiv = document.createElement('div');
                        warningDiv.className = 'thursday-warning';
                        warningDiv.textContent = 'Different Thursday picks detected. Please manage picks in individual pools.';
                        container.insertAdjacentElement('afterend', warningDiv);
                    }
                }
            }
        }

        // Reset the selector's content
        poolSelector.innerHTML = '';
        
        // Add "All Pools" option if appropriate
        if (shouldShowAllOption) {
            poolSelector.innerHTML = '<option value="all">All Pools</option>';
        }

        // Add individual pool options
        classicPools.forEach(pool => {
            if (pool && pool.name) {
                const option = document.createElement('option');
                option.value = pool.name;
                option.textContent = pool.name;
                poolSelector.appendChild(option);
            }
        });

        // Set appropriate selection
        if (isThursdayGameTime && !shouldShowAllOption) {
            // When different Thursday picks detected, default to first pool
            poolSelector.value = classicPools[0].name;
            selectedPool = classicPools[0].name;
        } else if (currentSelection && currentSelection !== 'loading') {
            // Otherwise use current selection if valid
            poolSelector.value = currentSelection;
            selectedPool = currentSelection;
        }

        // Store Thursday picks for "all" view if they exist
        if (allPoolsThursdayPicks.picks?.length > 0 || allPoolsThursdayPicks.immortalLock?.length > 0) {
            window.allPoolsThursdayPicks = allPoolsThursdayPicks;
        }

        // Fetch and render picks
        await fetchUserPicksAndRender(storedUsername, poolSelector.value);

        if (isThursdayGameTime) {
            setTimeout(() => {
                enableThursdayGameFeatures();
            }, 100);
        }

    } catch (error) {
        console.error('Error fetching pools:', error);
        poolSelector.innerHTML = '<option value="error">Error loading pools</option>';
        poolSelector.classList.add('error');
    }
}
*/

// Near the top of populatePoolSelector, before try block
const style = document.createElement('style');
style.textContent = `
    .pool-warning {
        color: rgb(99, 209, 237);
        margin-top: 8px;
        font-size: 14px;
        display: block;
        text-align: center;
        padding: 8px;
        border-radius: 4px;

    }

    .pool-selector-container {
        display: flex;
        align-items: center;
        gap: 10px;
    }
`;
document.head.appendChild(style);
async function populatePoolSelector() {
    const poolSelector = document.getElementById('poolSelector');
    if (!poolSelector) {
      console.error('Pool selector element not found');
      return;
    }
  
    const currentSelection = poolSelector.value;
    poolSelector.innerHTML = '<option value="loading">Loading pools...</option>';
  
    try {
      // First check if we're in Thursday game time
      const timeResponse = await fetch('/api/timewindows');
      if (!timeResponse.ok) throw new Error('Failed to fetch time windows.');
  
      const { thursdayDeadline, sundayDeadline } = await timeResponse.json();
      const now = getCurrentTimeInUTC4();
      const thursdayTime = new Date(thursdayDeadline);
      const sundayTime = new Date(sundayDeadline);
  
      const isThursdayGameTime = now > thursdayTime && now < sundayTime;
  
      // Fetch pools
      const response = await fetch(
        `/pools/userPools/${encodeURIComponent(storedUsername)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const pools = await response.json();
      const classicPools = pools.filter((pool) => pool.mode === 'classic');
  
      if (classicPools.length === 0) {
        poolSelector.innerHTML =
          '<option value="none">User is in no classic pools</option>';
        return;
      }
  
      // Clear any existing warnings
      const existingWarnings = document.querySelectorAll('.pool-warning');
      existingWarnings.forEach((warning) => warning.remove());
  
      // Reset the selector's content
      poolSelector.innerHTML = '';
  
      // If there's only one pool, just add that pool
      if (classicPools.length === 1) {
        const option = document.createElement('option');
        option.value = classicPools[0].name;
        option.textContent = classicPools[0].name;
        poolSelector.appendChild(option);
        selectedPool = classicPools[0].name;
  
        // Fetch and store last week's picks for single pool
        const lastWeekResponse = await fetch(
          `/api/getLastWeekPicks/${encodeURIComponent(
            storedUsername
          )}/${encodeURIComponent(classicPools[0].name)}`
        );
        const lastWeekData = await lastWeekResponse.json();
        lastWeekPicks[classicPools[0].name] = {
          picks:
            lastWeekData.success && Array.isArray(lastWeekData.picks)
              ? lastWeekData.picks
              : [],
          immortalLockPick:
            lastWeekData.success && lastWeekData.immortalLockPick
              ? lastWeekData.immortalLockPick
              : null,
        };
      } else {
        // Multiple pools - check for both current and last week's picks differences
        let shouldShowAllOption = true;
        let currentPicksMatch = true; // Initialize to true
        let lastWeekPicksMatch = true; // Initialize to true
  
        // Fetch current picks for all pools
        const currentPoolPicks = await Promise.all(
          classicPools.map(async (pool) => {
            try {
              const response = await fetch(
                `/api/getPicks/${storedUsername}/${pool.name}`
              );
              const data = await response.json();
              return {
                poolName: pool.name,
                picks: data.picks || [],
                immortalLock: data.immortalLock || [],
              };
            } catch (error) {
              console.error(`Error fetching picks for pool ${pool.name}:`, error);
              return null;
            }
          })
        );
  
        // Filter out failed requests
        const validCurrentPicks = currentPoolPicks.filter((pick) => pick !== null);
  
        // Check if current picks match across pools
        if (validCurrentPicks.length > 1) {
          const firstPool = validCurrentPicks[0];
          currentPicksMatch = validCurrentPicks.every((poolPick) => {
            const regularPicksMatch =
              JSON.stringify(sortPicks(poolPick.picks)) ===
              JSON.stringify(sortPicks(firstPool.picks));
            const immortalLockMatch =
              JSON.stringify(poolPick.immortalLock) ===
              JSON.stringify(firstPool.immortalLock);
            return regularPicksMatch && immortalLockMatch;
          });
  
          if (currentPicksMatch) {
            // Store the matching picks in global state for "all" view
            userPicks = [...firstPool.picks];
            userImmortalLock = firstPool.immortalLock?.[0] || null;
            picksCount = userPicks.length;
          } else {
            shouldShowAllOption = false;
          }
        } else {
          currentPicksMatch = true; // Only one pool, so picks match by default
        }
  
        // If current picks match, check last week's picks
        if (currentPicksMatch) {
          const lastWeekPoolPicks = await Promise.all(
            classicPools.map(async (pool) => {
              try {
                const response = await fetch(
                  `/api/getLastWeekPicks/${encodeURIComponent(
                    storedUsername
                  )}/${encodeURIComponent(pool.name)}`
                );
                const data = await response.json();
                return {
                  poolName: pool.name,
                  picks: data.success && Array.isArray(data.picks) ? data.picks : [],
                  immortalLockPick:
                    data.success && data.immortalLockPick ? data.immortalLockPick : null,
                };
              } catch (error) {
                console.error(
                  `Error fetching last week picks for pool ${pool.name}:`,
                  error
                );
                return null;
              }
            })
          );
  
          // Filter out failed requests
          const validLastWeekPicks = lastWeekPoolPicks.filter(
            (pick) => pick !== null
          );
  
          if (validLastWeekPicks.length > 1) {
            const firstPool = validLastWeekPicks[0];
            lastWeekPicksMatch = validLastWeekPicks.every((poolPick) => {
              const regularPicksMatch =
                JSON.stringify(sortPicks(poolPick.picks)) ===
                JSON.stringify(sortPicks(firstPool.picks));
              const immortalLockMatch =
                JSON.stringify(poolPick.immortalLockPick) ===
                JSON.stringify(firstPool.immortalLockPick);
              return regularPicksMatch && immortalLockMatch;
            });
  
            if (lastWeekPicksMatch) {
              // Store the matching picks for the 'all' view
              lastWeekPicks['all'] = {
                picks: firstPool.picks,
                immortalLockPick: firstPool.immortalLockPick,
              };
            } else {
              shouldShowAllOption = false;
            }
          } else {
            lastWeekPicksMatch = true; // Only one pool, so picks match by default
          }
        } else {
          lastWeekPicksMatch = false; // Current picks don't match, so last week's don't matter
        }
  
        const container = poolSelector.closest('.pool-selector-container');
  
        // If current picks don't match, add warning
        if (!currentPicksMatch && container) {
          const warningDiv = document.createElement('div');
          warningDiv.className = 'pool-warning';
          warningDiv.textContent =
            'Different current picks detected across pools. Please manage picks in individual pools, or select reset picks on all individual pools to obtain the "all pools" view.';
          container.insertAdjacentElement('afterend', warningDiv);
          shouldShowAllOption = false; // Ensure "All Pools" option is not shown
        }
  
        // If last week's picks don't match and current picks DO match, add warning
        else if (!lastWeekPicksMatch && currentPicksMatch && container) {
          const warningDiv = document.createElement('div');
          warningDiv.className = 'pool-warning';
          warningDiv.textContent =
            'Different last week picks detected across pools. Please manage picks in individual pools.';
          container.insertAdjacentElement('afterend', warningDiv);
          shouldShowAllOption = false; // Ensure "All Pools" option is not shown
        }
  
        // Only add "All Pools" option if all picks match
        if (shouldShowAllOption) {
          const allOption = document.createElement('option');
          allOption.value = 'all';
          allOption.textContent = 'All Pools';
          poolSelector.appendChild(allOption);
        }
  
        // Add individual pool options
        classicPools.forEach((pool) => {
          const option = document.createElement('option');
          option.value = pool.name;
          option.textContent = pool.name;
          poolSelector.appendChild(option);
        });
  
        // Set appropriate selection
        if (!shouldShowAllOption && selectedPool === 'all') {
          // If currently on "all" but picks don't match, switch to first pool
          poolSelector.value = classicPools[0].name;
          selectedPool = classicPools[0].name;
  
          // Clear current picks state
          userPicks = [];
          userImmortalLock = null;
          picksCount = 0;
  
          // Clear UI selections
          document.querySelectorAll('.bet-button').forEach((button) => {
            if (!button.dataset.thursdayGame) {
              button.classList.remove('selected', 'immortal-lock-selected');
            }
          });
        } else if (currentSelection && currentSelection !== 'loading') {
          poolSelector.value = currentSelection;
          selectedPool = currentSelection;
        }
      }
  
      // Fetch and render picks
      await fetchUserPicksAndRender(storedUsername, selectedPool);
  
      // If it's Thursday game time, apply features after rendering
      if (isThursdayGameTime) {
        setTimeout(() => {
          enableThursdayGameFeatures();
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
      poolSelector.innerHTML = '<option value="error">Error loading pools</option>';
      poolSelector.classList.add('error');
    }
  }
  

// Helper function to sort picks for comparison
function sortPicks(picks) {
    return picks.sort((a, b) => {
        if (a.teamName !== b.teamName) return a.teamName.localeCompare(b.teamName);
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.value - b.value;
    });
}

// Keep the existing helper function and CSS
function hasThursdayPicksInPool(data, now) {
    // Check regular picks
    if (data.picks && data.picks.some(pick => 
        checkIfThursdayGame(pick.commenceTime) && 
        new Date(pick.commenceTime) < now
    )) {
        return true;
    }

    // Check immortal lock
    if (data.immortalLock && data.immortalLock.length > 0) {
        const lock = data.immortalLock[0];
        if (checkIfThursdayGame(lock.commenceTime) && 
            new Date(lock.commenceTime) < now) {
            return true;
        }
    }

    return false;
}
// Helper function to update pool selector on error
function updatePoolSelectorError() {
    const poolSelector = document.getElementById('poolSelector');
    if (poolSelector) {
        poolSelector.innerHTML = '<option value="error">Error loading pools</option>';
        poolSelector.classList.add('error');
    }
}
//come back to here
// Modified submit picks function with enhanced error handling
// Modified submit picks function with deduplication
async function submitUserPicks() {
    if (!storedUsername) {
        alert('Please log in to submit picks');
        return;
    }

    if (selectedPool === 'none') {
        alert('Join a pool to submit picks!');
        return;
    }

    if (userPicks.length === 0 && lockedPicks.length === 0) {
        alert('Please add at least one pick before submitting.');
        return;
    }

    const validateDate = (date) => {
        const parsedDate = Date.parse(date);
        return !isNaN(parsedDate) ? new Date(parsedDate).toISOString() : null;
    };

    // IMPORTANT FIX: Deduplicate picks before submission
    // Create a Map with team-type as key to ensure uniqueness
    const uniquePicksMap = new Map();
    
    // Process userPicks
    userPicks.forEach(pick => {
        const key = `${pick.teamName}-${pick.type}`;
        uniquePicksMap.set(key, {
            teamName: pick.teamName,
            type: pick.type,
            value: pick.value,
            commenceTime: validateDate(pick.commenceTime)
        });
    });
    
    // Process lockedPicks (these will override userPicks if there's a duplicate)
    lockedPicks.forEach(pick => {
        const key = `${pick.teamName}-${pick.type}`;
        uniquePicksMap.set(key, {
            teamName: pick.teamName,
            type: pick.type,
            value: pick.value,
            commenceTime: validateDate(pick.commenceTime),
            isLocked: true
        });
    });
    
    // Convert Map values to array for submission
    const uniquePicks = Array.from(uniquePicksMap.values());

    // Create the data object with deduplicated picks
    const data = {
        picks: uniquePicks,
        immortalLock: userImmortalLock || lockedImmortalLock ? [{
            teamName: (userImmortalLock || lockedImmortalLock).teamName,
            type: (userImmortalLock || lockedImmortalLock).type,
            value: (userImmortalLock || lockedImmortalLock).value,
            commenceTime: validateDate((userImmortalLock || lockedImmortalLock).commenceTime),
            isLocked: !!lockedImmortalLock
        }] : []
    };

    console.log("Deduplicated Picks Data Before Submission:", data);
    console.log("Total unique picks:", uniquePicks.length);

    try {
        if (selectedPool === 'all') {
            // Get all classic pools for the user
            const poolsResponse = await fetch(`/pools/userPools/${encodeURIComponent(storedUsername)}`);
            if (!poolsResponse.ok) throw new Error('Failed to fetch user pools');
            
            const allPools = await poolsResponse.json();
            const classicPools = allPools.filter(pool => pool.mode === 'classic');

            if (classicPools.length === 0) {
                alert('No classic pools found to submit picks to.');
                return;
            }

            // Submit to each classic pool
            const results = await Promise.all(classicPools.map(async pool => {
                try {
                    await submitToPool(pool.name, data);
                    return { poolName: pool.name, success: true };
                } catch (error) {
                    return { poolName: pool.name, success: false, error: error.message };
                }
            }));

            // Check results and provide feedback
            const failures = results.filter(result => !result.success);
            if (failures.length === 0) {
                alert(`Picks successfully submitted to all ${classicPools.length} pools!`);
            } else {
                const failedPools = failures.map(f => f.poolName).join(', ');
                alert(`Successfully submitted to ${classicPools.length - failures.length} pools.\nFailed for pools: ${failedPools}`);
            }
        } else {
            // Submit to single pool
            await submitToPool(selectedPool, data);
            alert('Picks submitted successfully!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while submitting picks. Please try again.');
    }
}

function setupEventListeners() {
    // Pool selector change
    const poolSelector = document.getElementById('poolSelector');
    if (poolSelector) {
        // Update the pool change handler in setupEventListeners
        poolSelector.addEventListener('change', async function(e) {
            console.log('Pool changed to:', e.target.value);
            selectedPool = e.target.value;
            
            try {
                // Clear state first
                userPicks = [];
                userImmortalLock = null;
                lockedPicks = [];
                lockedImmortalLock = null;
                picksCount = 0;
                
                // Clear Thursday-specific states
                isThursdayImmortalLockSet = false;
                thursdayImmortalLockTeam = null;

                // Clear UI selections and states but preserve base click functionality
                document.querySelectorAll('.bet-button').forEach(button => {
                    button.classList.remove('selected', 'immortal-lock-selected', 'user-thursday-pick', 'thursday-immortal-lock');
                    button.style.backgroundColor = '';
                    button.style.color = '';
                    button.dataset.previousPick = '';
                    button.dataset.previousImmortalLock = '';
                    button.dataset.thursdayGame = '';
                    button.title = '';
                });

                // Reset immortal lock checkbox
                const immortalLockCheck = document.getElementById('immortalLockCheck');
                if (immortalLockCheck) {
                    immortalLockCheck.checked = false;
                    immortalLockCheck.disabled = false;
                    immortalLockCheck.style.cursor = 'pointer';
                    immortalLockCheck.parentElement?.classList.remove('thursday-locked');
                }

                if (selectedPool === 'all') {
                    // For "all" view, ONLY get first pool's picks since we know they match
                    const poolsResponse = await fetch(`/pools/userPools/${encodeURIComponent(storedUsername)}`);
                    const allPools = await poolsResponse.json();
                    const classicPools = allPools.filter(pool => pool.mode === 'classic');
                    
                    if (classicPools.length > 0) {
                        const response = await fetch(`/api/getPicks/${storedUsername}/${classicPools[0].name}`);
                        const data = await response.json();
                        
                        if (data.picks) {
                            data.picks.forEach(pick => renderPick(pick, false));
                        }
                        if (data.immortalLock && data.immortalLock.length > 0) {
                            renderPick(data.immortalLock[0], true);
                        }
                    }
                } else {
                    // For individual pool, fetch normally
                    const response = await fetch(`/api/getPicks/${storedUsername}/${selectedPool}`);
                    const data = await response.json();
                    
                    if (data.picks) {
                        data.picks.forEach(pick => renderPick(pick, false));
                    }
                    if (data.immortalLock && data.immortalLock.length > 0) {
                        renderPick(data.immortalLock[0], true);
                    }
                }

                // Re-apply last week's picks blackout
                await fetchLastWeekPicks(storedUsername, selectedPool);
                await blackOutPreviousBets();

                // Check for Thursday features
                const timeResponse = await fetch('/api/timewindows');
                if (timeResponse.ok) {
                    const { thursdayDeadline, sundayDeadline } = await timeResponse.json();
                    const now = getCurrentTimeInUTC4();
                    const thursdayTime = new Date(thursdayDeadline);
                    const sundayTime = new Date(sundayDeadline);
                    
                    if (now > thursdayTime && now < sundayTime) {
                        setTimeout(() => {
                            enableThursdayGameFeatures();
                        }, 300);
                    }
                }
            } catch (error) {
                console.error('Error handling pool change:', error);
            }
        });
    }

    // Other event listeners remain the same...
    document.getElementById('submitPicks')?.addEventListener('click', submitUserPicks);
    document.getElementById('resetPicks')?.addEventListener('click', resetPicks);
    document.getElementById('displayInjuriesBtn')?.addEventListener('click', handleDisplayInjuries);
}

// Separate pool change handler
async function handlePoolChange(e) {
    console.log('Pool changed to:', e.target.value);
    selectedPool = e.target.value;
    
    try {
        // Check if we're in Thursday game time
        const timeResponse = await fetch('/api/timewindows');
        if (timeResponse.ok) {
            const { thursdayDeadline, sundayDeadline } = await timeResponse.json();
            const now = getCurrentTimeInUTC4();
            const thursdayTime = new Date(thursdayDeadline);
            const sundayTime = new Date(sundayDeadline);
            
            const isThursdayGameTime = now > thursdayTime && now < sundayTime;

            // Clear current state and re-render
            await fetchUserPicksAndRender(storedUsername, selectedPool);

            // If it's Thursday game time, wait for DOM update then apply features
            if (isThursdayGameTime) {
                // Wait for DOM to be fully updated
                await new Promise(resolve => setTimeout(resolve, 500));
                enableThursdayGameFeatures();
            }
        }
    } catch (error) {
        console.error('Error handling pool change:', error);
    }
}


async function fetchUserPicksAndRender(username, poolSelection) {
    console.log('\n=== Fetching User Picks ===');
    console.log('Username:', username);
    console.log('Pool Selection:', poolSelection);

    try {
        // Reset state and ensure betOptions are loaded
        await initializeState();

        if (poolSelection === 'all') {
            await handleAllPoolsView(username);
        } else {
            await handleSinglePoolView(username, poolSelection);
        }

        // After rendering picks, recalculate total picks count using Set for deduplication
        picksCount = new Set([
            ...userPicks.map(pick => `${pick.teamName}-${pick.type}`),
            ...lockedPicks.map(pick => `${pick.teamName}-${pick.type}`)
        ]).size;

        console.log('Updated Pick Count:', picksCount);
        logPickState();

        // After rendering picks, apply blackout
        await blackOutPreviousBets();
    } catch (error) {
        console.error('Error fetching user picks:', error);
        clearAllSelections();
    }
}

async function initializeState() {
    // Reset state
    lockedPicks = [];
    lockedImmortalLock = null;
    picksCount = 0;

    // Load bet options if needed
    if (!betOptions || betOptions.length === 0) {
        await loadWeeklyPicks();
    }
}

async function handleAllPoolsView(username) {
    // Get all classic pools
    const classicPools = await getClassicPools(username);
    if (classicPools.length < 2) {
        console.log('Not enough pools to compare');
        return;
    }

    // Fetch current picks for all pools
    const poolPicks = await Promise.all(classicPools.map(async pool => {
        try {
            const response = await fetch(`/api/getPicks/${username}/${pool.name}`);
            const data = await response.json();
            return {
                poolName: pool.name,
                picks: data.picks || [],
                immortalLock: data.immortalLock || []
            };
        } catch (error) {
            console.error(`Error checking picks for pool ${pool.name}:`, error);
            return null;
        }
    }));

    // Filter out failed requests
    const validPoolPicks = poolPicks.filter(pick => pick !== null);
    
    if (validPoolPicks.length > 0) {
        // Compare picks across pools
        const firstPool = validPoolPicks[0];
        const allPoolsMatch = validPoolPicks.every(poolPick => {
            const regularPicksMatch = JSON.stringify(sortPicks(poolPick.picks)) === 
                                    JSON.stringify(sortPicks(firstPool.picks));
            const immortalLockMatch = JSON.stringify(poolPick.immortalLock) === 
                                    JSON.stringify(firstPool.immortalLock);
            return regularPicksMatch && immortalLockMatch;
        });

        if (allPoolsMatch) {
            // If all pools have matching picks, deduplicate and render
            const uniquePicks = Array.from(new Map(
                firstPool.picks.map(pick => [`${pick.teamName}-${pick.type}`, pick])
            ).values());

            userPicks = uniquePicks;
            userImmortalLock = firstPool.immortalLock?.[0] || null;
            picksCount = uniquePicks.length;

            renderCurrentPicks({
                picks: uniquePicks,
                immortalLock: firstPool.immortalLock
            });

            logPickState();
        } else {
            // If picks don't match, clear selections and switch to first pool
            clearAllSelections();
            const poolSelector = document.getElementById('poolSelector');
            if (poolSelector && classicPools.length > 0) {
                poolSelector.value = classicPools[0].name;
                selectedPool = classicPools[0].name;
                await handleSinglePoolView(username, classicPools[0].name);
            }
        }
    }
}

function logPickState() {
    console.log('Current Pick State:', {
        userPicks: userPicks.map(p => `${p.teamName}-${p.type}`),
        lockedPicks: lockedPicks.map(p => `${p.teamName}-${p.type}`),
        picksCount,
        uniquePickCount: new Set([
            ...userPicks.map(p => `${p.teamName}-${p.type}`),
            ...lockedPicks.map(p => `${p.teamName}-${p.type}`)
        ]).size,
        immortalLock: userImmortalLock ? `${userImmortalLock.teamName}-${userImmortalLock.type}` : null,
        lockedImmortalLock: lockedImmortalLock ? `${lockedImmortalLock.teamName}-${lockedImmortalLock.type}` : null
    });
}
async function handleSinglePoolView(username, poolSelection) {
    // Fetch last week's picks for this pool
    await fetchLastWeekPicks(username, poolSelection);
    
    // Fetch current picks
    const response = await fetch(`/api/getPicks/${username}/${poolSelection}`);
    const data = await response.json();
    
    // Clear UI and render picks with deduplication
    clearAllSelections();
    
    // Deduplicate picks before rendering
    const uniquePicks = Array.from(new Map(
        (data.picks || []).map(pick => [`${pick.teamName}-${pick.type}`, pick])
    ).values());
    
    renderCurrentPicks({
        picks: uniquePicks,
        immortalLock: data.immortalLock
    });

    logPickState();
}
async function getClassicPools(username) {
    const poolsResponse = await fetch(`/pools/userPools/${encodeURIComponent(username)}`);
    const allPools = await poolsResponse.json();
    return allPools.filter(pool => pool.mode === 'classic');
}

function renderCurrentPicks(data) {
    // Handle regular picks
    if (data.picks) {
        data.picks.forEach(pick => {
            if (!pick.commenceTime) {
                const matchingBet = betOptions.find(bet => 
                    (bet.homeTeam === pick.teamName || bet.awayTeam === pick.teamName) &&
                    bet.type === pick.type
                );
                if (matchingBet) {
                    pick.commenceTime = matchingBet.commenceTime;
                }
            }
            renderPick(pick, false);
        });
    }

    // Handle immortal lock
    if (data.immortalLock && data.immortalLock.length > 0) {
        const lock = data.immortalLock[0];
        if (!lock.commenceTime) {
            const matchingBet = betOptions.find(bet => 
                (bet.homeTeam === lock.teamName || bet.awayTeam === lock.teamName) &&
                bet.type === lock.type
            );
            if (matchingBet) {
                lock.commenceTime = matchingBet.commenceTime;
            }
        }
        renderPick(lock, true);
    }
}
// Clear all selections
function clearAllSelections() {
    // Store existing Thursday picks before clearing
    const existingThursdayPicks = lockedPicks.filter(pick => {
        const matchingBet = betOptions.find(bet => 
            (bet.homeTeam === pick.teamName || bet.awayTeam === pick.teamName) &&
            bet.type === pick.type
        );
        return matchingBet && checkIfThursdayGame(matchingBet.commenceTime);
    });

    const existingThursdayLock = lockedImmortalLock && betOptions.find(bet => 
        (bet.homeTeam === lockedImmortalLock.teamName || bet.awayTeam === lockedImmortalLock.teamName) &&
        bet.type === lockedImmortalLock.type &&
        checkIfThursdayGame(bet.commenceTime)
    ) ? lockedImmortalLock : null;

    // Clear regular picks and immortal lock
    userPicks = [];
    userImmortalLock = null;
    
    // Restore Thursday picks
    lockedPicks = existingThursdayPicks;
    lockedImmortalLock = existingThursdayLock;
    
    // Update picks count to reflect preserved Thursday picks
    picksCount = lockedPicks.length;
    
    // Update UI
    document.querySelectorAll('.bet-button').forEach(button => {
        // Only remove selection if it's not a Thursday game pick
        if (!button.dataset.thursdayGame) {
            button.classList.remove('selected', 'immortal-lock-selected');
        }
    });

    // Reset immortal lock checkbox unless we have a locked Thursday immortal lock
    if (!existingThursdayLock) {
        document.getElementById('immortalLockCheck').checked = false;
    }

    console.log('After clearing selections:', {
        thursdayPicks: existingThursdayPicks,
        thursdayLock: existingThursdayLock,
        lockedPicks,
        lockedImmortalLock,
        picksCount
    });
}

// Render a single pick
function renderPick(pick, isImmortalLock) {
    console.log('renderPick called with:', { pick, isImmortalLock });
    const option = {
        teamName: pick.teamName,
        type: pick.type,
        value: pick.value
    };
    console.log('Created option:', option);
    selectBet(option, true, isImmortalLock);
}

// Bet selection logic
function selectBet(option, isRendering = false, isImmortalLock = false) {
    const immortalLockCheckbox = document.getElementById('immortalLockCheck');
    
    // For initial rendering
    if (isRendering) {
        updateBetCell(option, true, isImmortalLock);
        if (isImmortalLock) {
            userImmortalLock = createPickObject(option);
            immortalLockCheckbox.checked = true;
        } else {
            userPicks.push(createPickObject(option));
            // Update picksCount with deduplication
            picksCount = new Set([
                ...userPicks.map(pick => `${pick.teamName}-${pick.type}`),
                ...lockedPicks.map(pick => `${pick.teamName}-${pick.type}`)
            ]).size;
        }
        return;
    }

    // Calculate total picks with deduplication
    const uniquePicks = new Set([
        ...userPicks.map(pick => `${pick.teamName}-${pick.type}`),
        ...lockedPicks.map(pick => `${pick.teamName}-${pick.type}`)
    ]);
    const totalPicks = uniquePicks.size;
    
    // Check if this is a commenced Thursday game
    const betButton = document.querySelector(
        `.bet-button[data-team="${option.teamName.replace(/\s+/g, '-').toLowerCase()}"][data-type="${option.type.toLowerCase()}"]`
    );
    
    // Get existing pick index if any
    const existingPickIndex = userPicks.findIndex(pick => 
        pick.teamName === option.teamName && pick.type === option.type
    );

    // Check if trying to deselect
    const isDeselecting = existingPickIndex !== -1 || 
        (userImmortalLock && 
         userImmortalLock.teamName === option.teamName && 
         userImmortalLock.type === option.type);

    // Only block for Thursday games if trying to make a new pick in an empty matchup
    if (betButton?.dataset.thursdayGame === 'true' && !isDeselecting && !isRendering) {
        // Check if this matchup already has any picks
        const currentMatchup = betOptions.find(bet => 
            bet.homeTeam === option.teamName || bet.awayTeam === option.teamName
        );
        const opposingTeam = currentMatchup.homeTeam === option.teamName ? 
            currentMatchup.awayTeam : currentMatchup.homeTeam;
        
        const matchupHasPicks = [...userPicks, ...lockedPicks].some(pick => 
            pick.teamName === option.teamName || pick.teamName === opposingTeam
        ) || (userImmortalLock && (
            userImmortalLock.teamName === option.teamName || 
            userImmortalLock.teamName === opposingTeam
        ));

        if (!matchupHasPicks) {
            alert('Thursday game has already commenced!');
            return;
        }
    }

    // Handle previous week's pick check
    if (betButton && betButton.dataset.previousPick === 'true' && !isRendering) {
        alert("You made this pick last week. You cannot select it again.");
        return;
    }

    // Check for existing picks on this team before doing anything else
    const hasExistingTeamPick = checkForExistingTeamPick(option.teamName);
    if (hasExistingTeamPick && !isDeselecting) {
        alert("Only one pick per team is allowed.");
        return;
    }

    // Handle immortal lock deselection
    if (userImmortalLock && 
        userImmortalLock.teamName === option.teamName && 
        userImmortalLock.type === option.type) {
        // Only prevent deselection if it's a locked Thursday immortal lock
        if (lockedImmortalLock && 
            lockedImmortalLock.teamName === option.teamName && 
            checkIfThursdayGame(lockedImmortalLock.commenceTime)) {
            alert("Cannot deselect a Thursday game immortal lock!");
            return;
        }
        deselectImmortalLock();
        return;
    }

    // Handle regular pick deselection
    if (existingPickIndex !== -1 && !isRendering) {
        userPicks.splice(existingPickIndex, 1);
        // Update picksCount with deduplication after removal
        picksCount = new Set([
            ...userPicks.map(pick => `${pick.teamName}-${pick.type}`),
            ...lockedPicks.map(pick => `${pick.teamName}-${pick.type}`)
        ]).size;
        updateBetCell(option, false);
        return;
    }

    // Validate new selection
    if (!validatePick(option) || !validatePickForThursday(option)) {
        return;
    }

    const currentPick = createPickObject(option);

    // Handle pick selection
    if (totalPicks < 6) {
        userPicks.push(currentPick);
        // Update picksCount with deduplication after addition
        picksCount = new Set([
            ...userPicks.map(pick => `${pick.teamName}-${pick.type}`),
            ...lockedPicks.map(pick => `${pick.teamName}-${pick.type}`)
        ]).size;
        updateBetCell(option, true);
    } else if (totalPicks === 6 && immortalLockCheckbox.checked) {
        // Only prevent immortal lock change if there's a locked Thursday immortal lock
        if (lockedImmortalLock && checkIfThursdayGame(lockedImmortalLock.commenceTime)) {
            alert("Cannot change immortal lock - Thursday game is locked as your immortal lock!");
            return;
        }
        handleImmortalLockSelection(currentPick);
    } else if (totalPicks === 6) {
        alert('You already have 6 picks. Toggle Immortal Lock to make this your immortal lock pick.');
    } else {
        alert('Maximum number of picks reached.');
    }
}
let isThursdayImmortalLockSet = false;
let thursdayImmortalLockTeam = null;

function isThursdayImmortalLock(pick) {
    if (!pick || !pick.commenceTime) return false;
    
    const matchingBet = betOptions.find(bet => 
        (bet.homeTeam === pick.teamName || bet.awayTeam === pick.teamName) &&
        checkIfThursdayGame(bet.commenceTime)
    );
    
    return !!matchingBet;
}
// Helper function to check if we're trying to deselect a pick
function isDeselection(option) {
    const existingRegularPick = userPicks.some(pick => 
        pick.teamName === option.teamName && pick.type === option.type
    );
    const existingImmortalPick = userImmortalLock && 
        userImmortalLock.teamName === option.teamName && 
        userImmortalLock.type === option.type;
    
    return existingRegularPick || existingImmortalPick;
}

// Helper function to check for any existing picks on a team
function checkForExistingTeamPick(teamName) {
    // Check regular picks
    const hasRegularPick = userPicks.some(pick => pick.teamName === teamName);
    
    // Check locked picks
    const hasLockedPick = lockedPicks.some(pick => pick.teamName === teamName);
    
    // Check immortal locks (both user and locked)
    const hasImmortalLock = (userImmortalLock && userImmortalLock.teamName === teamName) ||
                           (lockedImmortalLock && lockedImmortalLock.teamName === teamName);
    
    return hasRegularPick || hasLockedPick || hasImmortalLock;
}

// Pick validation
function validatePick(option) {
    // Find the current matchup
    const currentMatchup = betOptions.find(bet => 
        bet.homeTeam === option.teamName || bet.awayTeam === option.teamName
    );
    
    if (!currentMatchup) {
        console.error('No matchup found for team:', option.teamName);
        return false;
    }

    const opposingTeam = currentMatchup.homeTeam === option.teamName ? 
        currentMatchup.awayTeam : currentMatchup.homeTeam;

    // Check for commenced Thursday game
    const betButton = document.querySelector(
        `.bet-button[data-team="${option.teamName.replace(/\s+/g, '-').toLowerCase()}"][data-type="${option.type.toLowerCase()}"]`
    );
    
    if (betButton?.dataset.previousPick === 'true') {
        alert("You made this pick last week. You cannot select it again.");
        return false;
    }

    if (betButton?.dataset.thursdayGame === 'true') {
        alert('Thursday game has already commenced!');
        return false;
    }

    // Check for previous week's pick
    if (betButton?.dataset.previousPick === 'true') {
        alert("You made this pick last week. You cannot select it again.");
        return false;
    }

    // Double-check for any existing pick on the same team
    if (checkForExistingTeamPick(option.teamName)) {
        alert("Only one pick per team is allowed.");
        return false;
    }

    // Check for opposing team bet
    if (checkForExistingTeamPick(opposingTeam)) {
        alert("You cannot select a pick from both teams in the same matchup.");
        return false;
    }

    return true;
}

function createPickObject(option) {
    // Add check for commenceTime, make it optional
    const currentMatchup = betOptions.find(bet => bet.homeTeam === option.teamName || bet.awayTeam === option.teamName);

    const pickObject = {
        teamName: option.teamName,
        type: option.type,
        value: option.value,
        commenceTime: currentMatchup.commenceTime
    };

    // Only add commenceTime if it exists
    if (option.commenceTime) {
        pickObject.commenceTime = option.commenceTime;
    }

    return pickObject;
}


// Immortal Lock handling
function handleImmortalLockSelection(pick) {
    if (isThursdayImmortalLockSet) {
        alert("Your current immortal lock has already commenced on Thursday!");
        document.getElementById('immortalLockCheck').checked = true;
        return;
    }

    if (userImmortalLock) {
        updateBetCell(userImmortalLock, false, true);
    }
    userImmortalLock = pick;
    updateBetCell(pick, true, true);
    document.getElementById('immortalLockCheck').checked = true;
}

function deselectImmortalLock() {
    if (userImmortalLock) {
        updateBetCell(userImmortalLock, false, true);
        userImmortalLock = null;

    }
}
let isInitialPageLoad = true;

function updateBetCell(option, isSelected, isImmortalLock = false) {
    const teamClass = option.teamName.replace(/\s+/g, '-').toLowerCase();
    const typeClass = option.type.toLowerCase();
    
    const updateClasses = () => {
        const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`);
        

        betButtons.forEach(button => {
            button.classList.remove('selected', 'immortal-lock-selected');
            if (isSelected) {
                button.classList.add('selected');
                if (isImmortalLock) {
                    button.classList.add('immortal-lock-selected');
                }
            }
        });
    };

    if (isInitialPageLoad) {
        setTimeout(updateClasses, 500);
    } else {
        updateClasses();
    }
}

async function submitToPool(poolName, data) {
    const response = await fetch(`/api/savePicks/${storedUsername}/${poolName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to submit picks to ${poolName}`);
    }

    return response.json();
}
async function resetPicks() {
    if (selectedPool === 'none') {
        alert('Join a pool to reset picks!');
        return;
    }

    try {
        // First check if we're in Thursday game time
        const timeResponse = await fetch('/api/timewindows');
        if (!timeResponse.ok) throw new Error('Failed to fetch time windows.');
        
        const { thursdayDeadline, sundayDeadline } = await timeResponse.json();
        const now = getCurrentTimeInUTC4();
        const thursdayTime = new Date(thursdayDeadline);
        const sundayTime = new Date(sundayDeadline);
        
        const isThursdayGameTime = now > thursdayTime && now < sundayTime;

        // Get current picks for the selected pool before resetting
        let currentPicks;
        if (selectedPool !== 'all') {
            const response = await fetch(`/api/getPicks/${storedUsername}/${selectedPool}`);
            currentPicks = await response.json();
        }

        if (selectedPool === 'all') {
            const confirmReset = confirm('Are you sure you want to reset all your picks? This cannot be undone.');
            
            if (confirmReset) {
                const poolsResponse = await fetch(`/pools/userPools/${encodeURIComponent(storedUsername)}`);
                if (!poolsResponse.ok) throw new Error('Failed to fetch user pools');
                
                const allPools = await poolsResponse.json();
                const classicPools = allPools.filter(pool => pool.mode === 'classic');

                // Check which pools have picks
                const poolsWithPicks = await Promise.all(classicPools.map(async pool => {
                    try {
                        const response = await fetch(`/api/getPicks/${storedUsername}/${pool.name}`);
                        const data = await response.json();
                        return {
                            poolName: pool.name,
                            hasPicks: !!(data.picks?.length || data.immortalLock?.length),
                            currentPicks: data
                        };
                    } catch (error) {
                        console.error(`Error checking picks for ${pool.name}:`, error);
                        return { poolName: pool.name, hasPicks: false };
                    }
                }));

                const poolsToReset = poolsWithPicks.filter(pool => pool.hasPicks);

                if (poolsToReset.length === 0) {
                    alert('No picks found to reset.');
                    return;
                }

                // Reset pools
                const results = await Promise.all(poolsToReset.map(async pool => {
                    try {
                        const poolPicks = pool.currentPicks;
                        let dataToSave;

                        if (isThursdayGameTime) {
                            // During Thursday game time, preserve Thursday picks
                            const poolLockedPicks = poolPicks.picks?.filter(pick => {
                                const matchup = betOptions.find(bet => 
                                    bet.homeTeam === pick.teamName || bet.awayTeam === pick.teamName
                                );
                                if (!matchup) return false;
                                return checkIfThursdayGame(pick.commenceTime);
                            }) || [];

                            const poolLockedImmortalLock = poolPicks.immortalLock?.find(lock => {
                                const matchup = betOptions.find(bet => 
                                    bet.homeTeam === lock.teamName || bet.awayTeam === lock.teamName
                                );
                                if (!matchup) return false;
                                return checkIfThursdayGame(lock.commenceTime);
                            });

                            dataToSave = {
                                picks: poolLockedPicks,
                                immortalLock: poolLockedImmortalLock ? [poolLockedImmortalLock] : []
                            };
                        } else {
                            // Outside Thursday game time, clear all picks
                            dataToSave = {
                                picks: [],
                                immortalLock: []
                            };
                        }
                        
                        await fetch(`/api/savePicks/${storedUsername}/${pool.poolName}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(dataToSave)
                        });
                        
                        return { poolName: pool.poolName, success: true };
                    } catch (error) {
                        return { poolName: pool.poolName, success: false };
                    }
                }));

                const successfulResets = results.filter(r => r.success).map(r => r.poolName);
                if (successfulResets.length > 0) {
                    alert(`Successfully reset picks for: ${successfulResets.join(', ')}`);
                }
            }
        } else {
            // For single pool reset
            if (currentPicks?.picks?.length || currentPicks?.immortalLock?.length) {
                let dataToSave;

                if (isThursdayGameTime) {
                    // During Thursday game time, preserve Thursday picks
                    const poolLockedPicks = currentPicks.picks?.filter(pick => {
                        const matchup = betOptions.find(bet => 
                            bet.homeTeam === pick.teamName || bet.awayTeam === pick.teamName
                        );
                        if (!matchup) return false;
                        return checkIfThursdayGame(pick.commenceTime);
                    }) || [];

                    const poolLockedImmortalLock = currentPicks.immortalLock?.find(lock => {
                        const matchup = betOptions.find(bet => 
                            bet.homeTeam === lock.teamName || bet.awayTeam === lock.teamName
                        );
                        if (!matchup) return false;
                        return checkIfThursdayGame(lock.commenceTime);
                    });

                    dataToSave = {
                        picks: poolLockedPicks,
                        immortalLock: poolLockedImmortalLock ? [poolLockedImmortalLock] : []
                    };
                } else {
                    // Outside Thursday game time, clear all picks
                    dataToSave = {
                        picks: [],
                        immortalLock: []
                    };
                }

                await fetch(`/api/savePicks/${storedUsername}/${selectedPool}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave)
                });
                
                alert('Picks reset successfully!');
            } else {
                alert('No picks found to reset.');
            }
        }
        
        // Update UI
        userPicks = [];
        userImmortalLock = null;
        
        // Only preserve locked picks during Thursday game time
        if (!isThursdayGameTime) {
            lockedPicks = [];
            lockedImmortalLock = null;
        }
        
        picksCount = lockedPicks.length;
        
        document.querySelectorAll('.bet-button').forEach(button => {
            if (!button.dataset.thursdayGame) {
                button.classList.remove('selected', 'immortal-lock-selected');
            }
        });
        
        document.getElementById('immortalLockCheck').checked = false;
        
        await fetchUserPicksAndRender(storedUsername, selectedPool);
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while resetting picks. Please try again.');
    }
}
// Remove the resetPoolPicks function since we're no longer using it

async function resetPoolPicks(poolName) {
    const response = await fetch(`/api/resetPicks/${storedUsername}/${poolName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to reset picks in ${poolName}`);
    }

    return response.json();
}


// Weekly Picks Management
async function loadWeeklyPicks() {
    try {
        const response = await fetch('/api/getWeeklyPicks');
        if (!response.ok) throw new Error('Failed to fetch weekly picks');
        
        betOptions = await response.json();
        renderBetOptions();
    } catch (error) {
        console.error('Failed to fetch weekly picks:', error);
    }
}

// Bet Options Rendering
function renderBetOptions() {
    const container = document.getElementById('picksContainer');
    if (!container) return;
    
    container.innerHTML = '';

    const games = betOptions.reduce((acc, bet) => {
        const gameKey = `${bet.awayTeam} vs ${bet.homeTeam}`;
        if (!acc[gameKey]) {
            acc[gameKey] = {
                awayTeam: bet.awayTeam,
                homeTeam: bet.homeTeam,
                bets: [],
                commenceTime: bet.commenceTime,
                logoAway: teamLogos[bet.awayTeam],
                logoHome: teamLogos[bet.homeTeam],
                colorClassAway: teamColorClasses[bet.awayTeam],
                colorClassHome: teamColorClasses[bet.homeTeam]
            };
        }
        let formattedValue = String(bet.value);
        formattedValue = formattedValue.startsWith('+') || formattedValue.startsWith('-') 
            ? formattedValue 
            : (formattedValue > 0 ? `+${formattedValue}` : formattedValue);
            
        acc[gameKey].bets.push({
            type: bet.type,
            value: formattedValue,
            team: bet.teamName
        });
        return acc;
    }, {});// Render each game
    Object.values(games).forEach(game => {
        const gameContainer = document.createElement('div');
        gameContainer.className = 'game-container';
        gameContainer.style.display = 'flex';
        gameContainer.style.flexDirection = 'column';
        gameContainer.style.alignItems = 'center';

        const teamsContainer = document.createElement('div');
        teamsContainer.style.display = 'flex';
        teamsContainer.style.alignItems = 'center';

        // Add away team
        const awayTeamContainer = createTeamContainer(game, 'away');
        
        // Add @ symbol
        const atSymbol = document.createElement('div');
        atSymbol.textContent = '@';
        atSymbol.className = 'at-symbol';
        
        // Add home team
        const homeTeamContainer = createTeamContainer(game, 'home');

        teamsContainer.appendChild(awayTeamContainer);
        teamsContainer.appendChild(atSymbol);
        teamsContainer.appendChild(homeTeamContainer);
        gameContainer.appendChild(teamsContainer);

        // Add commence time
        const commenceTime = document.createElement('div');
        commenceTime.textContent = new Date(game.commenceTime).toLocaleString('en-US', {
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        commenceTime.className = 'commence-time';
        gameContainer.appendChild(commenceTime);

        // Add matchup injuries button
        const matchupInjuryButton = document.createElement('button');
        matchupInjuryButton.className = 'matchup-injury-button';
        matchupInjuryButton.innerHTML = '<i class="fas fa-bone"></i> Matchup Injuries';
        matchupInjuryButton.addEventListener('click', (event) => {
            event.stopPropagation();
            fetchAndDisplayMatchupInjuries(game, matchupInjuryButton);
        });
        gameContainer.appendChild(matchupInjuryButton);

        container.appendChild(gameContainer);
    });

    blackOutPreviousBets();
}

function createTeamContainer(game, teamRole) {
    const teamData = game[teamRole + 'Team'];
    const teamContainer = document.createElement('div');
    teamContainer.className = `team-container ${game['colorClass' + teamRole.charAt(0).toUpperCase() + teamRole.slice(1)]}`;
   
    // Add team logo
    const teamLogo = document.createElement('img');
    teamLogo.src = teamRole === 'away' ? game.logoAway : game.logoHome;
    teamLogo.alt = teamData + ' logo';
    teamLogo.className = 'team-logo';
    teamContainer.appendChild(teamLogo);

    // Add bet buttons
    game.bets.filter(bet => bet.team === teamData).forEach(bet => {
        const betButton = document.createElement('button');
        betButton.className = `bet-button ${teamContainer.className}`;
        betButton.textContent = bet.value;
        betButton.dataset.team = teamData.replace(/\s+/g, '-').toLowerCase();
        betButton.dataset.type = bet.type.toLowerCase();
        betButton.onclick = () => selectBet({ 
            teamName: teamData, 
            type: bet.type, 
            value: bet.value 
        });
        teamContainer.appendChild(betButton);
    });
   
    return teamContainer;
}

// Time Management
function getCurrentTimeInUTC4() {
    const now = new Date();
    const nowUtc4 = new Date(now);
    nowUtc4.setMinutes(nowUtc4.getMinutes() + nowUtc4.getTimezoneOffset());
    nowUtc4.setHours(nowUtc4.getHours() - 4);
    return nowUtc4;
}

// Time window features
function enablePickTimeFeatures() {
    const submitPicksButton = document.getElementById('submitPicks');
    const resetPicksButton = document.getElementById('resetPicks');
    
    [submitPicksButton, resetPicksButton].forEach(button => {
        button.classList.remove('disabled');
        button.disabled = false;
        button.removeEventListener('click', showGameTimeAlert);
    });
}

let lockedPicks = [];
let lockedImmortalLock = null;
function checkIfThursdayGame(commenceTime) {
    const gameDate = new Date(commenceTime); // Parse the date
    const localDate = new Date(gameDate.getTime() - gameDate.getTimezoneOffset() * 60000); // Adjust to local time
    const dayLocal = localDate.getDay(); // Get the day of the week in local time
   /* console.log(`Original Date (UTC): ${commenceTime}`);
    console.log(`Adjusted Date (Local): ${localDate}`);
    console.log(`Day (Local): ${dayLocal}`);*/
    return dayLocal === 4; // Return true for Thursday in local timezone
}

function validatePickForThursday(option) {
    console.log("Validating Thursday Pick:", option);
    const currentMatchup = betOptions.find(bet => 
        bet.homeTeam === option.teamName || bet.awayTeam === option.teamName
    );
    
    if (!currentMatchup) {
        console.log("No current matchup found for:", option.teamName);
        return false;
    }

    // Check for opposing team bet
    const opposingTeamBet = lockedPicks.find(pick => 
        (currentMatchup.homeTeam !== option.teamName && pick.teamName === currentMatchup.homeTeam) ||
        (currentMatchup.awayTeam !== option.teamName && pick.teamName === currentMatchup.awayTeam)
    );

    const opposingImmortalLock = lockedImmortalLock && (
        (currentMatchup.homeTeam !== option.teamName && lockedImmortalLock.teamName === currentMatchup.homeTeam) ||
        (currentMatchup.awayTeam !== option.teamName && lockedImmortalLock.teamName === currentMatchup.awayTeam)
    );

    if (opposingTeamBet || opposingImmortalLock) {
        console.log("Opposing team bet or immortal lock found.");
        alert("You cannot select a pick from both teams in the same matchup.");
        return false;
    }

    // Check for multiple bets on the same team
    const existingTeamPick = lockedPicks.find(pick => pick.teamName === option.teamName);
    const existingImmortalLockOnSameTeam = lockedImmortalLock && lockedImmortalLock.teamName === option.teamName;

    if (existingTeamPick || existingImmortalLockOnSameTeam) {
        console.log("Existing pick or immortal lock on the same team found.");
        alert("Only one pick per team is allowed.");
        return false;
    }

    console.log("Thursday pick validated successfully.");
    return true;
}
async function enableThursdayGameFeatures() {
    console.log('Enabling Thursday game features...');
    const now = getCurrentTimeInUTC4();
    const blackedOutGames = new Set();
    const userThursdayPicks = new Set();

    // Deduplicate picks based on teamName and type combination
    const uniquePicks = Array.from(new Map(
        [...userPicks, ...lockedPicks].map(pick => 
            [`${pick.teamName}-${pick.type}`, pick]
        )
    ).values());

    // Only include immortal lock based on current pool selection
    let poolSpecificImmortalLock = null;
    if (selectedPool === 'all') {
        poolSpecificImmortalLock = userImmortalLock || lockedImmortalLock;
    } else {
        // For specific pool, only use immortal lock if it belongs to this pool
        const response = await fetch(`/api/getPicks/${storedUsername}/${selectedPool}`);
        const data = await response.json();
        if (data.immortalLock && data.immortalLock.length > 0) {
            poolSpecificImmortalLock = data.immortalLock[0];
        }
    }

    // Create allPicks with pool-specific immortal lock
    const allPicks = [
        ...uniquePicks,
        ...(poolSpecificImmortalLock ? [poolSpecificImmortalLock] : [])
    ];

    console.log('All picks being checked:', allPicks);

    // Check for Thursday immortal lock first
    const thursdayImmortalLock = poolSpecificImmortalLock && checkIfThursdayGame(poolSpecificImmortalLock.commenceTime) ? 
        poolSpecificImmortalLock : null;

    // If we found a Thursday immortal lock for this pool, set up the lock state
    if (thursdayImmortalLock) {
        console.log('Setting up Thursday immortal lock state for:', thursdayImmortalLock);
        
        isThursdayImmortalLockSet = true;
        thursdayImmortalLockTeam = thursdayImmortalLock.teamName;

        // Add visual indicator ONLY to the specific immortal lock pick
        const teamClass = thursdayImmortalLock.teamName.replace(/\s+/g, '-').toLowerCase();
        const typeClass = thursdayImmortalLock.type.toLowerCase();
        const betButtons = document.querySelectorAll(
            `.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`
        );
        
        betButtons.forEach(button => {
            button.classList.add('thursday-immortal-lock');
            button.setAttribute('title', 'Thursday Immortal Lock - Cannot be changed');
        });
    }

    // Handle immortal lock UI state
    const immortalLockCheckbox = document.getElementById('immortalLockCheck');
    if (immortalLockCheckbox) {
        if (poolSpecificImmortalLock) {
            // Keep the checkbox checked if there's any immortal lock
            immortalLockCheckbox.checked = true;
            
            if (checkIfThursdayGame(poolSpecificImmortalLock.commenceTime)) {
                // Lock the checkbox only if it's a Thursday game
                immortalLockCheckbox.disabled = true;
                immortalLockCheckbox.style.cursor = 'not-allowed';
                immortalLockCheckbox.parentElement?.classList.add('thursday-locked');
            } else {
                // Keep it enabled but checked for non-Thursday immortal locks
                immortalLockCheckbox.disabled = false;
                immortalLockCheckbox.style.cursor = 'pointer';
                immortalLockCheckbox.parentElement?.classList.remove('thursday-locked');
            }
        } else {
            // No immortal lock at all
            immortalLockCheckbox.checked = false;
            immortalLockCheckbox.disabled = false;
            immortalLockCheckbox.style.cursor = 'pointer';
            immortalLockCheckbox.parentElement?.classList.remove('thursday-locked');
        }
    }

    // Process all Thursday games and picks
    requestAnimationFrame(() => {
        // Track user's Thursday picks
        allPicks.forEach(pick => {
            if (!pick || !pick.commenceTime) return;

            if (checkIfThursdayGame(pick.commenceTime)) {
                userThursdayPicks.add(`${pick.teamName}-${pick.type}`);
            }
        });

        // Identify all Thursday games
        betOptions.forEach(bet => {
            if (checkIfThursdayGame(bet.commenceTime)) {
                blackedOutGames.add(`${bet.homeTeam} vs ${bet.awayTeam}`);
            }
        });

        // Apply classes and handlers to Thursday games
        blackedOutGames.forEach(gameKey => {
            const [awayTeam, homeTeam] = gameKey.split(' vs ');
            
            // Check if this matchup has any picks
            const matchupHasPicks = allPicks.some(pick => 
                pick.teamName === homeTeam || pick.teamName === awayTeam
            );
            
            [homeTeam, awayTeam].forEach(team => {
                const teamClass = team.replace(/\s+/g, '-').toLowerCase();
                const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"]`);
                
                betButtons.forEach(button => {
                    const matchingBet = betOptions.find(bet => 
                        (bet.homeTeam === team || bet.awayTeam === team) &&
                        bet.type.toLowerCase() === button.dataset.type
                    );

                    if (matchingBet) {
                        const buttonIdentifier = `${team}-${matchingBet.type}`;
                        
                        // Mark as Thursday game
                        button.dataset.thursdayGame = 'true';
                        
                        // Add handler for commenced Thursday games
                        button.onclick = (e) => {
                            e.stopPropagation();
                            
                            // Check if this specific button represents a current pick
                            const isExistingPick = allPicks.some(pick => 
                                pick.teamName === team && 
                                pick.type === matchingBet.type
                            );

                            // If it's not an existing pick and the matchup has no picks, show commenced alert
                            if (!isExistingPick && !matchupHasPicks) {
                                alert('Thursday game has already commenced');
                                return;
                            }

                            // Otherwise, allow normal selection/deselection
                            return true;
                        };

                        // Apply user pick styling if it's a current pick
                        const isUserPick = Array.from(userThursdayPicks).some(pick => 
                            pick.toLowerCase() === buttonIdentifier.toLowerCase()
                        );
                        
                        if (isUserPick) {
                            button.classList.add('user-thursday-pick');
                        }
                    }
                });
            });
        });
    });
}


// Lock specific pick function with updated pick count management
function lockSpecificPick(pick) {
    console.log('=== Before Locking Pick ===');
    console.log('Current Active Picks:', userPicks.length);
    console.log('Current Locked Picks:', lockedPicks.length);
    console.log('Current PicksCount:', picksCount);
    
    let pickWasLocked = false;

    // For regular picks
    const pickIndex = userPicks.findIndex(p => 
        p.teamName === pick.teamName && 
        p.type === pick.type
    );

    if (pickIndex !== -1) {
        // Move the specific pick to lockedPicks
        lockedPicks.push(userPicks[pickIndex]);
        userPicks.splice(pickIndex, 1);
        pickWasLocked = true;
    }

    // For immortal lock
    if (userImmortalLock && 
        userImmortalLock.teamName === pick.teamName && 
        userImmortalLock.type === pick.type
    ) {
        lockedImmortalLock = userImmortalLock;
        userImmortalLock = null;
        document.getElementById('immortalLockCheck').checked = false;
        pickWasLocked = true;
    }

    // Update total picks count to reflect ALL picks (locked and unlocked)
    picksCount = userPicks.length + lockedPicks.length;
    
    console.log('=== After Locking Pick ===');
    console.log('Updated Active Picks:', userPicks.length);
    console.log('Updated Locked Picks:', lockedPicks.length);
    console.log('Updated PicksCount:', picksCount);
    
    return pickWasLocked;
}

function lockCommencedGamePicks(homeTeam, awayTeam) {
    // Check regular picks
    const picksToLock = userPicks.filter(pick => 
        pick.teamName === homeTeam || pick.teamName === awayTeam
    );
    
    // Move matching picks to lockedPicks
    if (picksToLock.length > 0) {
        lockedPicks = [...lockedPicks, ...picksToLock];
        userPicks = userPicks.filter(pick => 
            pick.teamName !== homeTeam && pick.teamName !== awayTeam
        );
    }
    
    // Check immortal lock
    if (userImmortalLock && 
        (userImmortalLock.teamName === homeTeam || userImmortalLock.teamName === awayTeam)) {
        lockedImmortalLock = userImmortalLock;
        userImmortalLock = null;
        document.getElementById('immortalLockCheck').checked = false;
    }
    
    // picksCount remains unchanged as locked picks still count towards the total
}


function enableSundayGameFeatures() {
    const submitPicksButton = document.getElementById('submitPicks');
    const resetPicksButton = document.getElementById('resetPicks');
    
    [submitPicksButton, resetPicksButton].forEach(button => {
        button.classList.add('disabled');
        button.disabled = true;
        button.addEventListener('click', showGameTimeAlert);
    });
}

function showGameTimeAlert(event) {
    event.preventDefault();
    alert("It's game time! Pick selection page not available.");
}

// Injury Management
async function fetchAndDisplayMatchupInjuries(game, buttonElement) {
    const teamFilter = document.getElementById('teamFilter');
    const injuryContainer = document.getElementById('injuryContainer');
    const displayInjuriesBtn = document.getElementById('displayInjuriesBtn');

    teamFilter.value = game.homeTeam;
    injuryContainer.classList.add('visible', 'visible-border');
    teamFilter.classList.remove('hidden');

    injuryContainer.scrollIntoView({ behavior: 'smooth' });

    try {
        const response = await fetch('/api/getInjuries');
        if (!response.ok) throw new Error('Network response was not ok.');
        
        const injuries = await response.json();
        const gameInjuries = injuries.filter(injury =>
            mapInjuryTeamName(injury.team.name) === game.homeTeam || 
            mapInjuryTeamName(injury.team.name) === game.awayTeam
        );

        displayInjuries(gameInjuries, true);
        
        const injuryContainerRect = injuryContainer.getBoundingClientRect();
        window.scrollTo({
            top: window.pageYOffset + injuryContainerRect.top - 200,
            behavior: 'smooth'
        });
    } catch (error) {
        console.error('Error fetching injuries:', error);
    }
}

function displayInjuries(injuries, isFiltered = false) {
    const injuryList = document.getElementById('injuryList');
    const teamFilter = document.getElementById('teamFilter');
    const selectedTeam = isFiltered ? null : teamFilter.value;
    const filteredInjuries = selectedTeam
        ? injuries.filter(injury => injury.team.name === selectedTeam)
        : injuries;

    // Sort injuries by team name
    filteredInjuries.sort((a, b) => a.team.name.localeCompare(b.team.name));

    injuryList.innerHTML = filteredInjuries.map(injury => `
        <div class="injury-item">
            <img src="${injury.team.logo}" alt="${injury.team.name} Logo">
            <div class="injury-details">
                <h4>${injury.player.name}</h4>
                <p>Status: ${injury.status}</p>
                <p>Description: ${injury.description}</p>
            </div>
        </div>
    `).join('');
}



/*
// Time Window Management
async function checkCurrentTimeWindow() {
    try {
        const response = await fetch('/api/timewindows');
        if (!response.ok) throw new Error('Failed to fetch time windows.');

        const { tuesdayStartTime, thursdayDeadline } = await response.json();
        const now = getCurrentTimeInUTC4();
        const tuesdayTime = new Date(tuesdayStartTime);
        const thursdayTime = new Date(thursdayDeadline);

        if (now > tuesdayTime && now < thursdayTime) {
            enablePickTimeFeatures();
        } else {
            enableGameTimeFeatures();
        }
    } catch (error) {
        console.error('Error checking current time window:', error);
    }
}*/


async function checkCurrentTimeWindow() {
    try {
        const response = await fetch('/api/timewindows');
        if (!response.ok) {
            throw new Error('Failed to fetch time windows.');
        }

        const { tuesdayStartTime, thursdayDeadline, sundayDeadline } = await response.json();
        const now = getCurrentTimeInUTC4();
        
        const tuesdayTime = new Date(tuesdayStartTime);
        const thursdayTime = new Date(thursdayDeadline);
        const sundayTime = new Date(sundayDeadline);

       /* console.log("Current time: ", now);
        console.log("Tuesday Start time: ", tuesdayTime);
        console.log("Thursday deadline: ", thursdayTime);
        console.log("Sunday deadline: ", sundayTime);*/

        if (now > tuesdayTime && now < thursdayTime) {
           // console.log('Current time window: Pick Time');
            enablePickTimeFeatures();
        } else if (now > thursdayTime && now < sundayTime) {
            //console.log('Current time window: Thursday Game Time');
            setTimeout(() => {
                enableThursdayGameFeatures();
            }, 100);
        } else if (now > sundayTime && now < tuesdayTime) {
           // console.log('Current time window: Sunday Game Time');
            enableSundayGameFeatures();
        } else {
            console.log('Error determining the current time window');
        }
    } catch (error) {
        console.error('Error checking current time window:', error);
    }
}

// Injury Display Event Handler
async function handleDisplayInjuries() {
    try {
        const injuryContainer = document.getElementById('injuryContainer');
        const teamFilter = document.getElementById('teamFilter');
        
        const response = await fetch('/api/getInjuries');
        if (!response.ok) throw new Error('Network response was not ok.');
        
        const injuries = await response.json();
        displayInjuries(injuries);
        
        injuryContainer.classList.toggle('visible');
        teamFilter.classList.toggle('hidden');

        if (!teamFilter.classList.contains('hidden')) {
            // Populate team filter options
            let uniqueTeams = [...new Set(injuries.map(injury => injury.team.name))].sort();
            teamFilter.innerHTML = '<option value="">All Teams</option>';
            uniqueTeams.forEach(team => {
                const option = document.createElement('option');
                option.value = team;
                option.textContent = team;
                teamFilter.appendChild(option);
            });
        }

        // Toggle visibility classes
        if (injuryContainer.classList.contains('visible')) {
            injuryContainer.classList.remove('hidden-border');
        } else {
            injuryContainer.classList.add('hidden-border');
            injuryContainer.classList.remove('visible-border');
        }
    } catch (error) {
        console.error('Error fetching injuries:', error);
    }
}

// Team name mapping helper
function mapInjuryTeamName(name) {
    return injuryTeamNameMap[name] || name;
}

// Initialize teamFilter change handler
document.getElementById('teamFilter')?.addEventListener('change', async function() {
    try {
        const response = await fetch('/api/getInjuries');
        if (response.ok) {
            const injuries = await response.json();
            displayInjuries(injuries);
        }
    } catch (error) {
        console.error('Error updating injuries:', error);
    }
});


// Add these functions to handle playoff picks in the client-side code

// Add a global variable to track if we're in playoff mode
let isPlayoffMode = false;
let playoffCurrentWeek = null;

// Function to check if a pool is in playoff mode
async function checkIfPlayoffPool(poolName) {
    try {
        const response = await fetch(`/api/isPlayoffPool/${encodeURIComponent(poolName)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        isPlayoffMode = data.isPlayoffPool;
        playoffCurrentWeek = data.playoffCurrentWeek;
        
        console.log(`Pool ${poolName} playoff status:`, isPlayoffMode ? 'In Playoff Mode' : 'Regular Season');
        if (isPlayoffMode) {
            console.log(`Playoff Week: ${playoffCurrentWeek}`);
            // Add playoff indicator to UI if needed
            addPlayoffIndicator();
        } else {
            // Remove playoff indicator if exists
            removePlayoffIndicator();
        }
        
        return data.isPlayoffPool;
    } catch (error) {
        console.error('Error checking playoff status:', error);
        return false;
    }
}

// Add a visual indicator when in playoff mode
function addPlayoffIndicator() {
    // Check if the indicator already exists
    if (!document.getElementById('playoff-indicator')) {
        const indicator = document.createElement('div');
        indicator.id = 'playoff-indicator';
        indicator.className = 'playoff-indicator';
        indicator.innerHTML = `
            <i class="fas fa-trophy"></i> 
            PLAYOFF MODE - WEEK ${playoffCurrentWeek}
        `;
        
        // Add to the page near the pool selector
        const poolSelectorContainer = document.querySelector('.pool-selector-container');
        if (poolSelectorContainer) {
            poolSelectorContainer.insertAdjacentElement('afterend', indicator);
        }
        
        
    }
}

// Remove playoff indicator when not in playoff mode
function removePlayoffIndicator() {
    const indicator = document.getElementById('playoff-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Modified populatePoolSelector to handle playoff mode
async function populatePoolSelector() {
    const poolSelector = document.getElementById('poolSelector');
    if (!poolSelector) {
        console.error('Pool selector element not found');
        return;
    }
  
    const currentSelection = poolSelector.value;
    poolSelector.innerHTML = '<option value="loading">Loading pools...</option>';
  
    try {
        // First check if we're in Thursday game time
        const timeResponse = await fetch('/api/timewindows');
        if (!timeResponse.ok) throw new Error('Failed to fetch time windows.');
  
        const { thursdayDeadline, sundayDeadline } = await timeResponse.json();
        const now = getCurrentTimeInUTC4();
        const thursdayTime = new Date(thursdayDeadline);
        const sundayTime = new Date(sundayDeadline);
  
        const isThursdayGameTime = now > thursdayTime && now < sundayTime;
  
        // Fetch pools
        const response = await fetch(
            `/pools/userPools/${encodeURIComponent(storedUsername)}`
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const pools = await response.json();
        const classicPools = pools.filter((pool) => pool.mode === 'classic');
  
        if (classicPools.length === 0) {
            poolSelector.innerHTML =
                '<option value="none">User is in no classic pools</option>';
            return;
        }
  
        // Check if any pools are in playoff mode
        const poolPlayoffStatuses = await Promise.all(classicPools.map(async (pool) => {
            try {
                const playoffCheck = await checkIfPlayoffPool(pool.name);
                return {
                    ...pool,
                    isPlayoffPool: playoffCheck
                };
            } catch (error) {
                console.error(`Error checking playoff status for ${pool.name}:`, error);
                return {
                    ...pool,
                    isPlayoffPool: false
                };
            }
        }));
  
        // Clear any existing warnings
        const existingWarnings = document.querySelectorAll('.pool-warning');
        existingWarnings.forEach((warning) => warning.remove());
  
        // Reset the selector's content
        poolSelector.innerHTML = '';
  
        // If there's only one pool, just add that pool
        if (classicPools.length === 1) {
            const option = document.createElement('option');
            option.value = classicPools[0].name;
            option.textContent = classicPools[0].name + (poolPlayoffStatuses[0].isPlayoffPool ? ' (Playoffs)' : '');
            poolSelector.appendChild(option);
            selectedPool = classicPools[0].name;
            
            // Set global playoff mode flag
            isPlayoffMode = poolPlayoffStatuses[0].isPlayoffPool;
  
            // Fetch and store last week's picks for single pool
            const lastWeekResponse = await fetch(
                `/api/getLastWeekPicks/${encodeURIComponent(
                    storedUsername
                )}/${encodeURIComponent(classicPools[0].name)}`
            );
            const lastWeekData = await lastWeekResponse.json();
            lastWeekPicks[classicPools[0].name] = {
                picks:
                    lastWeekData.success && Array.isArray(lastWeekData.picks)
                        ? lastWeekData.picks
                        : [],
                immortalLockPick:
                    lastWeekData.success && lastWeekData.immortalLockPick
                        ? lastWeekData.immortalLockPick
                        : null,
            };
        } else {
            // Multiple pools - check for both current and last week's picks differences
            let shouldShowAllOption = true;
            let currentPicksMatch = true;
            let lastWeekPicksMatch = true;
  
            // We need to handle playoff pools separately, so no "All Pools" option
            // if some pools are in playoff mode and others aren't
            const hasAnyPlayoffPool = poolPlayoffStatuses.some(pool => pool.isPlayoffPool);
            const allPoolsArePlayoff = poolPlayoffStatuses.every(pool => pool.isPlayoffPool);
            
            if (hasAnyPlayoffPool && !allPoolsArePlayoff) {
                shouldShowAllOption = false;
                
                // Add warning about mixed pool types
                const container = poolSelector.closest('.pool-selector-container');
                if (container) {
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'pool-warning';
                    warningDiv.textContent = 'Some pools are in playoff mode while others are in regular season. Please manage picks in individual pools.';
                    container.insertAdjacentElement('afterend', warningDiv);
                }
            }
  
            // For remaining logic to check pick matches, we need to split pools
            // into playoff and regular season groups
            if (shouldShowAllOption) {
                // Fetch current picks for all pools
                const currentPoolPicks = await Promise.all(
                    classicPools.map(async (pool) => {
                        try {
                            // Need to use different endpoints based on playoff status
                            const isPoolPlayoff = poolPlayoffStatuses.find(p => p.name === pool.name)?.isPlayoffPool || false;
                            const endpoint = isPoolPlayoff 
                                ? `/api/getPlayoffPicks/${storedUsername}/${pool.name}`
                                : `/api/getPicks/${storedUsername}/${pool.name}`;
                            
                            const response = await fetch(endpoint);
                            const data = await response.json();
                            return {
                                poolName: pool.name,
                                picks: data.picks || [],
                                immortalLock: data.immortalLock || [],
                                isPlayoffPicks: isPoolPlayoff
                            };
                        } catch (error) {
                            console.error(`Error fetching picks for pool ${pool.name}:`, error);
                            return null;
                        }
                    })
                );
  
                // Filter out failed requests
                const validCurrentPicks = currentPoolPicks.filter((pick) => pick !== null);
  
                // Split into playoff and regular groups
                const playoffPicks = validCurrentPicks.filter(pool => pool.isPlayoffPicks);
                const regularPicks = validCurrentPicks.filter(pool => !pool.isPlayoffPicks);
                
                // Only compare within groups
                if (playoffPicks.length > 1) {
                    const firstPlayoffPool = playoffPicks[0];
                    const playoffPicksMatch = playoffPicks.every((poolPick) => {
                        const regularPicksMatch =
                            JSON.stringify(sortPicks(poolPick.picks)) ===
                            JSON.stringify(sortPicks(firstPlayoffPool.picks));
                        const immortalLockMatch =
                            JSON.stringify(poolPick.immortalLock) ===
                            JSON.stringify(firstPlayoffPool.immortalLock);
                        return regularPicksMatch && immortalLockMatch;
                    });
                    
                    if (!playoffPicksMatch) {
                        shouldShowAllOption = false;
                    }
                }
                
                if (regularPicks.length > 1) {
                    const firstRegularPool = regularPicks[0];
                    const regularPicksMatch = regularPicks.every((poolPick) => {
                        const regularPicksMatch =
                            JSON.stringify(sortPicks(poolPick.picks)) ===
                            JSON.stringify(sortPicks(firstRegularPool.picks));
                        const immortalLockMatch =
                            JSON.stringify(poolPick.immortalLock) ===
                            JSON.stringify(firstRegularPool.immortalLock);
                        return regularPicksMatch && immortalLockMatch;
                    });
                    
                    if (!regularPicksMatch) {
                        shouldShowAllOption = false;
                    }
                }
                
                // If both types have pools and all picks match within their types,
                // we still can't have "All Pools" because they're different types
                if (playoffPicks.length > 0 && regularPicks.length > 0) {
                    shouldShowAllOption = false;
                }
  
                const container = poolSelector.closest('.pool-selector-container');
  
                // If current picks don't match, add warning
                if (!currentPicksMatch && container) {
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'pool-warning';
                    warningDiv.textContent =
                        'Different current picks detected across pools. Please manage picks in individual pools, or select reset picks on all individual pools to obtain the "all pools" view.';
                    container.insertAdjacentElement('afterend', warningDiv);
                    shouldShowAllOption = false; // Ensure "All Pools" option is not shown
                }
  
                // If last week's picks don't match and current picks DO match, add warning
                else if (!lastWeekPicksMatch && currentPicksMatch && container) {
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'pool-warning';
                    warningDiv.textContent =
                        'Different last week picks detected across pools. Please manage picks in individual pools.';
                    container.insertAdjacentElement('afterend', warningDiv);
                    shouldShowAllOption = false; // Ensure "All Pools" option is not shown
                }
            }
  
            // Only add "All Pools" option if all picks match and same pool types
            if (shouldShowAllOption) {
                const allOption = document.createElement('option');
                allOption.value = 'all';
                allOption.textContent = allPoolsArePlayoff ? 'All Playoff Pools' : 'All Pools';
                poolSelector.appendChild(allOption);
            }
  
            // Add individual pool options
            poolPlayoffStatuses.forEach((pool) => {
                const option = document.createElement('option');
                option.value = pool.name;
                option.textContent = pool.name + (pool.isPlayoffPool ? ' (Playoffs)' : '');
                poolSelector.appendChild(option);
            });
  
            // Set appropriate selection
            if (!shouldShowAllOption && selectedPool === 'all') {
                // If currently on "all" but picks don't match, switch to first pool
                poolSelector.value = classicPools[0].name;
                selectedPool = classicPools[0].name;
                
                // Set playoff mode based on the selected pool
                isPlayoffMode = poolPlayoffStatuses.find(p => p.name === selectedPool)?.isPlayoffPool || false;
  
                // Clear current picks state
                userPicks = [];
                userImmortalLock = null;
                picksCount = 0;
  
                // Clear UI selections
                document.querySelectorAll('.bet-button').forEach((button) => {
                    if (!button.dataset.thursdayGame) {
                        button.classList.remove('selected', 'immortal-lock-selected');
                    }
                });
            } else if (currentSelection && currentSelection !== 'loading') {
                poolSelector.value = currentSelection;
                selectedPool = currentSelection;
                
                // Set playoff mode based on the selected pool
                isPlayoffMode = poolPlayoffStatuses.find(p => p.name === selectedPool)?.isPlayoffPool || false;
            }
        }
  
        // Fetch and render picks
        await fetchUserPicksAndRender(storedUsername, selectedPool);
  
        // If it's Thursday game time, apply features after rendering
        if (isThursdayGameTime) {
            setTimeout(() => {
                enableThursdayGameFeatures();
            }, 100);
        }
    } catch (error) {
        console.error('Error fetching pools:', error);
        poolSelector.innerHTML = '<option value="error">Error loading pools</option>';
        poolSelector.classList.add('error');
    }
}

// Modified fetchUserPicksAndRender function to handle playoff picks
async function fetchUserPicksAndRender(username, poolSelection) {
    console.log('\n=== Fetching User Picks ===');
    console.log('Username:', username);
    console.log('Pool Selection:', poolSelection);

    try {
        // Reset state and ensure betOptions are loaded
        await initializeState();

        // Check if the selected pool is in playoff mode
        if (poolSelection !== 'all') {
            isPlayoffMode = await checkIfPlayoffPool(poolSelection);
        }

        if (poolSelection === 'all') {
            await handleAllPoolsView(username);
        } else {
            await handleSinglePoolView(username, poolSelection);
        }

        // After rendering picks, recalculate total picks count using Set for deduplication
        picksCount = new Set([
            ...userPicks.map(pick => `${pick.teamName}-${pick.type}`),
            ...lockedPicks.map(pick => `${pick.teamName}-${pick.type}`)
        ]).size;

        console.log('Updated Pick Count:', picksCount);
        logPickState();

        // After rendering picks, apply blackout
        await blackOutPreviousBets();
    } catch (error) {
        console.error('Error fetching user picks:', error);
        clearAllSelections();
    }
}

// Modified handleSinglePoolView to handle playoff picks
async function handleSinglePoolView(username, poolSelection) {
    // First check if this is a playoff pool
    const isPoolPlayoff = await checkIfPlayoffPool(poolSelection);
    
    // Fetch last week's picks for this pool
    await fetchLastWeekPicks(username, poolSelection);
    
    // Fetch current picks using the appropriate endpoint
    const endpoint = isPoolPlayoff 
        ? `/api/getPlayoffPicks/${username}/${poolSelection}`
        : `/api/getPicks/${username}/${poolSelection}`;
    
    console.log(`Fetching picks from endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint);
    let data;
    
    if (response.ok) {
        data = await response.json();
    } else {
        console.log(`No picks found. Status: ${response.status}`);
        data = { picks: [], immortalLock: [] };
    }
    
    // Clear UI and render picks with deduplication
    clearAllSelections();
    
    // Deduplicate picks before rendering
    const uniquePicks = Array.from(new Map(
        (data.picks || []).map(pick => [`${pick.teamName}-${pick.type}`, pick])
    ).values());
    
    renderCurrentPicks({
        picks: uniquePicks,
        immortalLock: data.immortalLock
    });

    logPickState();
}

// Modified submitUserPicks function to handle playoff picks
async function submitUserPicks() {
    if (!storedUsername) {
        alert('Please log in to submit picks');
        return;
    }

    if (selectedPool === 'none') {
        alert('Join a pool to submit picks!');
        return;
    }

    if (userPicks.length === 0 && lockedPicks.length === 0) {
        alert('Please add at least one pick before submitting.');
        return;
    }

    const validateDate = (date) => {
        const parsedDate = Date.parse(date);
        return !isNaN(parsedDate) ? new Date(parsedDate).toISOString() : null;
    };

    // IMPORTANT FIX: Deduplicate picks before submission
    // Create a Map with team-type as key to ensure uniqueness
    const uniquePicksMap = new Map();
    
    // Process userPicks
    userPicks.forEach(pick => {
        const key = `${pick.teamName}-${pick.type}`;
        uniquePicksMap.set(key, {
            teamName: pick.teamName,
            type: pick.type,
            value: pick.value,
            commenceTime: validateDate(pick.commenceTime)
        });
    });
    
    // Process lockedPicks (these will override userPicks if there's a duplicate)
    lockedPicks.forEach(pick => {
        const key = `${pick.teamName}-${pick.type}`;
        uniquePicksMap.set(key, {
            teamName: pick.teamName,
            type: pick.type,
            value: pick.value,
            commenceTime: validateDate(pick.commenceTime),
            isLocked: true
        });
    });
    
    // Convert Map values to array for submission
    const uniquePicks = Array.from(uniquePicksMap.values());

    // Create the data object with deduplicated picks
    const data = {
        picks: uniquePicks,
        immortalLock: userImmortalLock || lockedImmortalLock ? [{
            teamName: (userImmortalLock || lockedImmortalLock).teamName,
            type: (userImmortalLock || lockedImmortalLock).type,
            value: (userImmortalLock || lockedImmortalLock).value,
            commenceTime: validateDate((userImmortalLock || lockedImmortalLock).commenceTime),
            isLocked: !!lockedImmortalLock
        }] : []
    };

    console.log("Deduplicated Picks Data Before Submission:", data);
    console.log("Total unique picks:", uniquePicks.length);
    console.log("Submitting to playoff mode:", isPlayoffMode);

    try {
        if (selectedPool === 'all') {
            // Get all classic pools for the user
            const poolsResponse = await fetch(`/pools/userPools/${encodeURIComponent(storedUsername)}`);
            if (!poolsResponse.ok) throw new Error('Failed to fetch user pools');
            
            const allPools = await poolsResponse.json();
            const classicPools = allPools.filter(pool => pool.mode === 'classic');

            if (classicPools.length === 0) {
                alert('No classic pools found to submit picks to.');
                return;
            }

            // Check playoff status for each pool
            const poolPlayoffStatuses = await Promise.all(classicPools.map(async pool => {
                try {
                    const isPlayoff = await checkIfPlayoffPool(pool.name);
                    return {
                        ...pool,
                        isPlayoffPool: isPlayoff
                    };
                } catch (error) {
                    console.error(`Error checking playoff status for ${pool.name}:`, error);
                    return {
                        ...pool,
                        isPlayoffPool: false
                    };
                }
            }));

            // Submit to each pool based on its playoff status
            const results = await Promise.all(poolPlayoffStatuses.map(async pool => {
                try {
                    if (pool.isPlayoffPool) {
                        // Use playoff endpoint
                        await submitToPlayoffPool(pool.name, data);
                    } else {
                        // Use regular endpoint
                        await submitToPool(pool.name, data);
                    }
                    return { poolName: pool.name, success: true, isPlayoff: pool.isPlayoffPool };
                } catch (error) {
                    return { poolName: pool.name, success: false, error: error.message, isPlayoff: pool.isPlayoffPool };
                }
            }));

            // Check results and provide feedback
            const failures = results.filter(result => !result.success);
            if (failures.length === 0) {
                // Count playoff and regular pools
                const playoffCount = results.filter(r => r.isPlayoff).length;
                const regularCount = results.filter(r => !r.isPlayoff).length;
                
                let message = `Picks successfully submitted to all ${classicPools.length} pools!`;
                if (playoffCount > 0 && regularCount > 0) {
                    message += ` (${playoffCount} playoff, ${regularCount} regular)`;
                }
                
                alert(message);
            } else {
                const failedPools = failures.map(f => f.poolName).join(', ');
                alert(`Successfully submitted to ${classicPools.length - failures.length} pools.\nFailed for pools: ${failedPools}`);
            }
        } else {
            // Submit to single pool based on its playoff status
            if (isPlayoffMode) {
                await submitToPlayoffPool(selectedPool, data);
                alert('Playoff picks submitted successfully!');
            } else {
                await submitToPool(selectedPool, data);
                alert('Picks submitted successfully!');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while submitting picks. Please try again.');
    }
}

// New function to submit picks to a playoff pool
async function submitToPlayoffPool(poolName, data) {
    const response = await fetch(`/api/savePlayoffPicks/${storedUsername}/${poolName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to submit playoff picks to ${poolName}`);
    }

    return response.json();
}

// Update existing event listeners in setupEventListeners
function setupEventListeners() {
    // Pool selector change
    const poolSelector = document.getElementById('poolSelector');
    if (poolSelector) {
        // Update the pool change handler in setupEventListeners
        poolSelector.addEventListener('change', async function(e) {
            console.log('Pool changed to:', e.target.value);
            selectedPool = e.target.value;
            
            try {
                // Clear state first
                userPicks = [];
                userImmortalLock = null;
                lockedPicks = [];
                lockedImmortalLock = null;
                picksCount = 0;
                
                // Clear Thursday-specific states
                isThursdayImmortalLockSet = false;
                thursdayImmortalLockTeam = null;

                // If changing to a specific pool, check if it's in playoff mode
                if (selectedPool !== 'all') {
                    isPlayoffMode = await checkIfPlayoffPool(selectedPool);
                }

                // Clear UI selections and states but preserve base click functionality
                document.querySelectorAll('.bet-button').forEach(button => {
                    button.classList.remove('selected', 'immortal-lock-selected', 'user-thursday-pick', 'thursday-immortal-lock');
                    button.style.backgroundColor = '';
                    button.style.color = '';
                    button.dataset.previousPick = '';
                    button.dataset.previousImmortalLock = '';
                    button.dataset.thursdayGame = '';
                    button.title = '';
                });

                // Reset immortal lock checkbox
                const immortalLockCheck = document.getElementById('immortalLockCheck');
                if (immortalLockCheck) {
                    immortalLockCheck.checked = false;
                    immortalLockCheck.disabled = false;
                    immortalLockCheck.style.cursor = 'pointer';
                    immortalLockCheck.parentElement?.classList.remove('thursday-locked');
                }

                if (selectedPool === 'all') {
                    // For "all" view, ONLY get first pool's picks since we know they match
                    const poolsResponse = await fetch(`/pools/userPools/${encodeURIComponent(storedUsername)}`);
                    const allPools = await poolsResponse.json();
                    const classicPools = allPools.filter(pool => pool.mode === 'classic');
                    
                    if (classicPools.length > 0) {
                        // Check if the first pool is in playoff mode
                        isPlayoffMode = await checkIfPlayoffPool(classicPools[0].name);
                        
                        // Use the appropriate endpoint
                        const endpoint = isPlayoffMode 
                            ? `/api/getPlayoffPicks/${storedUsername}/${classicPools[0].name}`
                            : `/api/getPicks/${storedUsername}/${classicPools[0].name}`;
                        
                        const response = await fetch(endpoint);
                        if (response.ok) {
                            const data = await response.json();
                            
                            if (data.picks) {
                                data.picks.forEach(pick => renderPick(pick, false));
                            }
                            if (data.immortalLock && data.immortalLock.length > 0) {
                                renderPick(data.immortalLock[0], true);
                            }
                        }
                    }
                } else {
                    // For individual pool, fetch using appropriate endpoint
                    const endpoint = isPlayoffMode 
                        ? `/api/getPlayoffPicks/${storedUsername}/${selectedPool}`
                        : `/api/getPicks/${storedUsername}/${selectedPool}`;
                        
                    const response = await fetch(endpoint);
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.picks) {
                            data.picks.forEach(pick => renderPick(pick, false));
                        }
                        if (data.immortalLock && data.immortalLock.length > 0) {
                            renderPick(data.immortalLock[0], true);
                        }
                    }
                }

                // Re-apply last week's picks blackout
                await fetchLastWeekPicks(storedUsername, selectedPool);
                await blackOutPreviousBets();

                // Check for Thursday features
                const timeResponse = await fetch('/api/timewindows');
                if (timeResponse.ok) {
                    const { thursdayDeadline, sundayDeadline } = await timeResponse.json();
                    const now = getCurrentTimeInUTC4();
                    const thursdayTime = new Date(thursdayDeadline);
                    const sundayTime = new Date(sundayDeadline);
                    
                    if (now > thursdayTime && now < sundayTime) {
                        setTimeout(() => {
                            enableThursdayGameFeatures();
                        }, 300);
                    }
                }
            } catch (error) {
                console.error('Error handling pool change:', error);
            }
        });
    }

    // Other event listeners remain the same...
    document.getElementById('submitPicks')?.addEventListener('click', submitUserPicks);
    document.getElementById('resetPicks')?.addEventListener('click', resetPicks);
    document.getElementById('displayInjuriesBtn')?.addEventListener('click', handleDisplayInjuries);
}

// Add this CSS to your page to style playoff elements
const playoffStyles = `
.playoffs-badge {
    background-color: #00e9fa;
    color: black;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7em;
    margin-left: 6px;
    font-weight: bold;
    max-width: 400px;
}

option[data-playoff="true"] {
    background-color: rgba(0, 174, 255, 0.2);
    font-weight: bold;
}

.playoff-indicator {
    background-color:rgb(0, 192, 250);
    color: #000;
    padding: 8px 12px;
    border-radius: 4px;
    margin: 8px auto; /* Changed from "8px 0" to "8px auto" */
    font-weight: bold;
    text-align: center;
    animation: pulse 2s infinite;
    max-width: 400px;
    
    /* Center the content inside the indicator */
    display: flex;
    justify-content: center;
    margin-top: 20px;
}
@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(0, 217, 255, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(0, 255, 234, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 204, 255, 0); }
}
`;

// Document ready function to initialize styles
document.addEventListener('DOMContentLoaded', function() {
    // Add playoff styles to head
    const styleElement = document.createElement('style');
    styleElement.textContent = playoffStyles;
    document.head.appendChild(styleElement);
    

});

