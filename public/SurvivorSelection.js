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
        // Fetch time windows and pools in parallel
        const [timeResponse, poolsResponse] = await Promise.all([
            fetch('/api/timewindows'),
            fetch(`/pools/userPools/${encodeURIComponent(storedUsername)}`)
        ]);

        if (!timeResponse.ok || !poolsResponse.ok) {
            throw new Error('Failed to fetch required data');
        }

        // Process time windows
        const { thursdayDeadline, sundayDeadline } = await timeResponse.json();
        const now = getCurrentTimeInUTC4();
        const thursdayTime = new Date(thursdayDeadline);
        const sundayTime = new Date(sundayDeadline);
        const isThursdayGameTime = now > thursdayTime && now < sundayTime;

        // Process pools
        const pools = await poolsResponse.json();
        const survivorPools = pools.filter(pool => pool.mode === 'survivor');

        if (survivorPools.length === 0) {
            poolSelector.innerHTML = '<option value="none">User is in no Survivor pools</option>';
            return;
        }

        // Clear existing warnings
        document.querySelectorAll('.thursday-warning').forEach(warning => warning.remove());

        // Only show "All Pools" if there are multiple pools and we need to check Thursday picks
        let shouldShowAllOption = survivorPools.length > 1;
        let allPoolsThursdayPicks = [];

        if (isThursdayGameTime && shouldShowAllOption) {
            const poolPicks = await Promise.all(survivorPools.map(async pool => {
                try {
                    const picksResponse = await fetch(`/api/getPicks/${storedUsername}/${pool.name}`);
                    const data = await picksResponse.json();
                    const thursdayPicks = (data.picks || []).filter(pick =>
                        checkIfThursdayGame(pick.commenceTime) &&
                        new Date(pick.commenceTime) < now
                    );
                    const thursdayImmortalLock = (data.immortalLock || []).filter(lock =>
                        checkIfThursdayGame(lock.commenceTime) &&
                        new Date(lock.commenceTime) < now
                    );

                    return {
                        poolName: pool.name,
                        thursdayPicks,
                        thursdayImmortalLock
                    };
                } catch (error) {
                    console.error(`Error checking picks for pool ${pool.name}:`, error);
                    return null;
                }
            }));

            const validPoolPicks = poolPicks.filter(Boolean);
            const hasThursdayPicks = validPoolPicks.some(pool =>
                pool.thursdayPicks.length > 0 || pool.thursdayImmortalLock.length > 0
            );

            if (hasThursdayPicks) {
                const firstPoolWithPicks = validPoolPicks.find(pool =>
                    pool.thursdayPicks.length > 0 || pool.thursdayImmortalLock.length > 0
                );

                const allPoolsMatch = validPoolPicks.every(pool => {
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

        // Populate pool selector
        poolSelector.innerHTML = '';
        
        // Only add "All Pools" if we have multiple pools and they match Thursday picks criteria
        if (shouldShowAllOption) {
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'All Pools';
            poolSelector.appendChild(allOption);
        }

        // Add individual pool options
        survivorPools.forEach(pool => {
            const option = document.createElement('option');
            option.value = pool.name;
            option.textContent = pool.name;
            poolSelector.appendChild(option);
        });

        // Set appropriate selection
        if (survivorPools.length === 1) {
            // If only one pool, select it
            poolSelector.value = survivorPools[0].name;
            selectedPool = survivorPools[0].name;
        } else if (isThursdayGameTime && !shouldShowAllOption) {
            // Different Thursday picks, default to first pool
            poolSelector.value = survivorPools[0].name;
            selectedPool = survivorPools[0].name;
        } else if (currentSelection && currentSelection !== 'loading') {
            // Use current selection if valid
            poolSelector.value = currentSelection;
            selectedPool = currentSelection;
        }

        // Store Thursday picks if they exist
        if (allPoolsThursdayPicks.picks?.length > 0 || allPoolsThursdayPicks.immortalLock?.length > 0) {
            window.allPoolsThursdayPicks = allPoolsThursdayPicks;
        }

        // Fetch and render picks
        await fetchUserPicksAndRender(storedUsername, poolSelector.value);

        if (isThursdayGameTime) {
            setTimeout(() => enableThursdayGameFeatures(), 100);
        }

    } catch (error) {
        console.error('Error fetching pools:', error);
        poolSelector.innerHTML = '<option value="error">Error loading pools</option>';
        poolSelector.classList.add('error');
    }
}*/
const style = document.createElement('style');
style.textContent = `
    .pool-warning {
        color: rgb(237, 216, 99);
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
      const classicPools = pools.filter((pool) => pool.mode === 'survivor');
  
      if (classicPools.length === 0) {
        poolSelector.innerHTML =
          '<option value="none">User is in no survivor pools</option>';
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


// Update fetchUserPicksAndRender to handle the all pools view with Thursday picks
/*
async function fetchUserPicksAndRender(username, poolSelection) {
    try {
        // Reset state
        userPicks = [];
        userImmortalLock = null;
        lockedPicks = [];
        lockedImmortalLock = null;
        picksCount = 0;


        if (poolSelection === 'all' && window.allPoolsThursdayPicks) {
            // For "all" view, preserve the common Thursday picks
            lockedPicks = window.allPoolsThursdayPicks.picks || [];
            lockedImmortalLock = window.allPoolsThursdayPicks.immortalLock?.[0] || null;
            picksCount = lockedPicks.length;
        }


        // Rest of the existing fetchUserPicksAndRender logic...
        // [Previous implementation continues here]
    } catch (error) {
        console.error('Error fetching user picks:', error);
        clearAllSelections();
    }
}*/




// Helper function to sort picks for comparison
function sortPicks(picks) {
    return picks.sort((a, b) => {
        if (a.teamName !== b.teamName) return a.teamName.localeCompare(b.teamName);
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.value - b.value;
    });
}




// Add logging to renderPick function
function renderPick(pick, isImmortalLock) {
    console.log('\n=== Rendering Pick ===');
    console.log('Pick:', pick);
    console.log('Is Immortal Lock:', isImmortalLock);
    
    const option = {
        teamName: pick.teamName,
        type: pick.type,
        value: pick.value,
        commenceTime: pick.commenceTime
    };
    
    console.log('Created option:', option);
    selectBet(option, true);
}

document.head.appendChild(style);
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
async function submitUserPicks() {
    if (!storedUsername) {
        alert('Please log in to submit picks');
        return;
    }

    if (selectedPool === 'none') {
        alert('Join a pool to submit picks!');
        return;
    }

    // Check if we have either user picks or locked picks
    if (userPicks.length === 0 && lockedPicks.length === 0) {
        alert('Please add at least one pick before submitting.');
        return;
    }

    // Combine picks, ensuring we only have one pick total (survivor mode)
    const combinedPicks = [...lockedPicks, ...userPicks];
    if (combinedPicks.length > 1) {
        console.error('Invalid state: Multiple picks detected in survivor mode');
        alert('Error: Multiple picks detected. Please reset and try again.');
        return;
    }

    // Create the data object with the single pick
    const data = {
        picks: combinedPicks
    };

    try {
        if (selectedPool === 'all') {
            // Get the pools directly from the selector instead of fetching all pools
            const poolSelector = document.getElementById('poolSelector');
            const availablePools = Array.from(poolSelector.options)
                .map(option => option.value)
                .filter(value => value !== 'all'); // Exclude the "All Pools" option

            if (availablePools.length === 0) {
                alert('No pools found to submit picks to.');
                return;
            }

            // Submit to each available pool
            const results = await Promise.all(availablePools.map(async poolName => {
                try {
                    await submitToPool(poolName, data);
                    return { poolName, success: true };
                } catch (error) {
                    return { poolName, success: false, error: error.message };
                }
            }));

            // Check results and provide feedback
            const failures = results.filter(result => !result.success);
            if (failures.length === 0) {
                alert(`Picks successfully submitted to all ${availablePools.length} pools!`);
            } else {
                const failedPools = failures.map(f => f.poolName).join(', ');
                alert(`Successfully submitted to ${availablePools.length - failures.length} pools.\nFailed for pools: ${failedPools}`);
            }
        } else {
            // Submit to single pool
            await submitToPool(selectedPool, data);
            alert('Pick submitted successfully!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while submitting pick. Please try again.');
    }
}

function setupEventListeners() {
    // Pool selector change
    const poolSelector = document.getElementById('poolSelector');
    if (poolSelector) {
        poolSelector.addEventListener('change', async function(e) {
            console.log('Pool changed to:', e.target.value);
            
            // Update selected pool
            selectedPool = e.target.value;
            
            try {
                // Clear all current picks state
                userPicks = [];
                userImmortalLock = null;
                lockedPicks = [];
                lockedImmortalLock = null;
                picksCount = 0;
        
                // Clear UI selections first
                document.querySelectorAll('.bet-button').forEach(button => {
                    button.classList.remove('selected', 'immortal-lock-selected', 'user-thursday-pick');
                });

                // Safely handle checkbox state
                const immortalLockCheck = document.getElementById('immortalLockCheck');
                if (immortalLockCheck) {
                    immortalLockCheck.checked = false;
                }
        
                // Fetch picks for the new pool
                const response = await fetch(`/api/getPicks/${storedUsername}/${selectedPool}`);
                const data = await response.json();
                console.log('Fetched picks for pool:', data);
        
                // Handle regular picks
                if (data.picks && Array.isArray(data.picks)) {
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
                if (data.immortalLock && Array.isArray(data.immortalLock) && data.immortalLock.length > 0) {
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
        
                // Check if we need to apply Thursday features
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
        
                console.log('Final state after pool change:', {
                    userPicks,
                    lockedPicks,
                    userImmortalLock,
                    lockedImmortalLock,
                    picksCount,
                    selectedPool
                });
        
            } catch (error) {
                console.error('Error handling pool change:', error);
            }
        });
    }

    // Other event listeners
    const submitButton = document.getElementById('submitPicks');
    if (submitButton) {
        submitButton.addEventListener('click', submitUserPicks);
    }

    const resetButton = document.getElementById('resetPicks');
    if (resetButton) {
        resetButton.addEventListener('click', resetPicks);
    }

    const displayInjuriesBtn = document.getElementById('displayInjuriesBtn');
    if (displayInjuriesBtn) {
        displayInjuriesBtn.addEventListener('click', handleDisplayInjuries);
    }
}

async function handlePoolChange(e) {
    console.log('Pool changed to:', e.target.value);
    selectedPool = e.target.value;
    
    try {
        // Clear all current state before fetching new data
        userPicks = [];
        userImmortalLock = null;
        lockedPicks = [];
        lockedImmortalLock = null;
        picksCount = 0;

        // Clear UI selections
        const betButtons = document.querySelectorAll('.bet-button');
        betButtons.forEach(button => {
            button.classList.remove('selected', 'immortal-lock-selected', 'user-thursday-pick');
        });

        // Safely handle the checkbox - check if it exists first
        const immortalLockCheck = document.getElementById('immortalLockCheck');
        if (immortalLockCheck) {
            try {
                immortalLockCheck.checked = false;
            } catch (checkboxError) {
                console.warn('Could not reset checkbox:', checkboxError);
            }
        }

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

        console.log('Pool change completed successfully');
    } catch (error) {
        console.error('Error handling pool change:', error);
        // Attempt to gracefully recover
        clearAllSelections();
    }
}

// Helper function to safely clear all selections
function clearAllSelections() {
    userPicks = [];
    userImmortalLock = null;
    lockedPicks = [];
    lockedImmortalLock = null;
    picksCount = 0;

    // Clear UI elements safely
    try {
        // Clear bet buttons
        document.querySelectorAll('.bet-button').forEach(button => {
            button.classList.remove('selected', 'immortal-lock-selected', 'user-thursday-pick');
        });

        // Clear immortal lock checkbox if it exists
        const immortalLockCheck = document.getElementById('immortalLockCheck');
        if (immortalLockCheck) {
            immortalLockCheck.checked = false;
        }
    } catch (error) {
        console.warn('Error clearing UI elements:', error);
    }
}


async function fetchUserPicksAndRender(username, poolSelection) {
    console.log('\n=== Fetching User Picks ===');
    console.log('Username:', username);
    console.log('Pool Selection:', poolSelection);

    try {
        // Reset all state
        userPicks = [];
        userImmortalLock = null;
        lockedPicks = [];
        lockedImmortalLock = null;
        picksCount = 0;

        // Clear UI first
        clearAllSelections();

        // Ensure betOptions are loaded
        if (!betOptions || betOptions.length === 0) {
            await loadWeeklyPicks();
        }

        // Get current time window
        const timeResponse = await fetch('/api/timewindows');
        const { thursdayDeadline, sundayDeadline } = await timeResponse.json();
        const now = getCurrentTimeInUTC4();
        const thursdayTime = new Date(thursdayDeadline);
        const sundayTime = new Date(sundayDeadline);
        const isThursdayGameTime = now > thursdayTime && now < sundayTime;

        // Handle single pool selection
        if (poolSelection !== 'all') {
            const response = await fetch(`/api/getPicks/${username}/${poolSelection}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch picks for pool ${poolSelection}`);
            }
            
            const data = await response.json();
            console.log(`Picks for pool ${poolSelection}:`, data);

            // Render regular picks
            if (data.picks && Array.isArray(data.picks)) {
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

            // Render immortal lock
            if (data.immortalLock && Array.isArray(data.immortalLock) && data.immortalLock.length > 0) {
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

            // Update locked picks for Thursday games if needed
            if (isThursdayGameTime) {
                // Move Thursday picks to locked state
                const thursdayPicks = userPicks.filter(pick => {
                    const matchingBet = betOptions.find(bet => 
                        (bet.homeTeam === pick.teamName || bet.awayTeam === pick.teamName) &&
                        bet.type === pick.type
                    );
                    return matchingBet && checkIfThursdayGame(matchingBet.commenceTime);
                });

                const thursdayLock = userImmortalLock && checkIfThursdayGame(userImmortalLock.commenceTime) 
                    ? userImmortalLock 
                    : null;

                if (thursdayPicks.length > 0 || thursdayLock) {
                    lockedPicks = thursdayPicks;
                    lockedImmortalLock = thursdayLock;
                    userPicks = userPicks.filter(pick => !thursdayPicks.includes(pick));
                    userImmortalLock = thursdayLock ? null : userImmortalLock;
                }
            }
        } else {
            // Get all survivor pools
            const poolsResponse = await fetch(`/pools/userPools/${encodeURIComponent(username)}`);
            const allPools = await poolsResponse.json();
            const survivorPools = allPools.filter(pool => pool.mode === 'survivor');

            if (survivorPools.length < 2) {
                console.log('Not enough pools to compare for "all" view');
                return;
            }

            // Fetch all pool picks in parallel
            const allPoolPicks = await Promise.all(survivorPools.map(async pool => {
                const response = await fetch(`/api/getPicks/${username}/${pool.name}`);
                const data = await response.json();
                return {
                    poolName: pool.name,
                    picks: data.picks || [],
                    immortalLock: data.immortalLock || []
                };
            }));

            // Compare picks across pools
            const firstPool = allPoolPicks[0];
            const allPicksMatch = allPoolPicks.every(poolPick => 
                JSON.stringify(sortPicks(poolPick.picks)) === JSON.stringify(sortPicks(firstPool.picks)) &&
                JSON.stringify(sortPicks(poolPick.immortalLock)) === JSON.stringify(sortPicks(firstPool.immortalLock))
            );

            if (allPicksMatch) {
                // Render picks from first pool
                firstPool.picks.forEach(pick => renderPick(pick, false));
                if (firstPool.immortalLock.length > 0) {
                    renderPick(firstPool.immortalLock[0], true);
                }
            } else {
                console.log('Picks do not match across pools');
                // Could add a UI message here if needed
            }
        }

        // Apply Thursday features if needed
        if (isThursdayGameTime) {
            setTimeout(() => {
                enableThursdayGameFeatures();
            }, 300);
        }

    } catch (error) {
        console.error('Error fetching user picks:', error);
        clearAllSelections();
        
        // Show error message to user
        const container = document.getElementById('picksContainer');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Failed to load picks. Please try again.';
            container.appendChild(errorDiv);
        }
    }
}
// Clear all selections


// Simplified bet selection logic for single pick
function selectBet(option, isRendering = false) {
    // For initial rendering
    if (isRendering) {
        updateBetCell(option, true);
        userPicks = [createPickObject(option)]; // Replace any existing pick
        picksCount = 1;
        return;
    }

    // Check if this is a commenced Thursday game
    const betButton = document.querySelector(
        `.bet-button[data-team="${option.teamName.replace(/\s+/g, '-').toLowerCase()}"][data-type="${option.type.toLowerCase()}"]`
    );

    if (betButton && betButton.dataset.thursdayGame === 'true' && !isRendering) {
        alert('Thursday game has already commenced!');
        return;
    }

    // Handle previous week's pick check
    if (betButton && betButton.dataset.previousPick === 'true' && !isRendering) {
        alert("You made this pick last week. You cannot select it again.");
        return;
    }

    // Handle deselection of current pick
    if (userPicks.length === 1 && 
        userPicks[0].teamName === option.teamName && 
        userPicks[0].type === option.type) {
        userPicks = [];
        picksCount = 0;
        updateBetCell(option, false);
        return;
    }

    // Validate the new pick
    if (!validatePickForThursday(option)) return;

    // Clear any existing picks and select the new one
    clearAllSelections();
    const currentPick = createPickObject(option);
    userPicks = [currentPick];
    picksCount = 1;
    updateBetCell(option, true);
}

// Simplified validation for single pick
function validatePick(option) {
    const currentMatchup = betOptions.find(bet => 
        bet.homeTeam === option.teamName || bet.awayTeam === option.teamName
    );
    
    return !!currentMatchup; // Just make sure it's a valid matchup
}

function updateBetCell(option, isSelected) {
    // Get current time to check if this is a Thursday game that has commenced
    const now = getCurrentTimeInUTC4();
    const currentMatchup = betOptions.find(bet => 
        bet.homeTeam === option.teamName || bet.awayTeam === option.teamName
    );
    
    const isThursdayGame = currentMatchup && checkIfThursdayGame(currentMatchup.commenceTime);
    const hasCommenced = currentMatchup && new Date(currentMatchup.commenceTime) < now;
    
    // First, remove selection from all buttons that aren't locked Thursday picks
    document.querySelectorAll('.bet-button').forEach(button => {
        if (!button.dataset.thursdayGame) {
            button.classList.remove('selected');
        }
    });
    
    // Then update the specific button if selected
    if (isSelected) {
        const teamClass = option.teamName.replace(/\s+/g, '-').toLowerCase();
        const typeClass = option.type.toLowerCase();
        const betButtons = document.querySelectorAll(
            `.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`
        );
        
        betButtons.forEach(button => {
            button.classList.add('selected');
            
            // If this is a Thursday game that has commenced, mark it as locked
            if (isThursdayGame && hasCommenced) {
                button.dataset.thursdayGame = 'true';
                button.classList.add('user-thursday-pick');
            }
        });
    }
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

// Pick validation and creation
function validatePick(option) {
    const currentMatchup = betOptions.find(bet => 
        bet.homeTeam === option.teamName || bet.awayTeam === option.teamName
    );
    
    if (!currentMatchup) return false;

    // Check for opposing team bet
    const opposingTeamBet = userPicks.find(pick => 
        (currentMatchup.homeTeam !== option.teamName && pick.teamName === currentMatchup.homeTeam) ||
        (currentMatchup.awayTeam !== option.teamName && pick.teamName === currentMatchup.awayTeam)
    );

    const opposingImmortalLock = userImmortalLock && (
        (currentMatchup.homeTeam !== option.teamName && userImmortalLock.teamName === currentMatchup.homeTeam) ||
        (currentMatchup.awayTeam !== option.teamName && userImmortalLock.teamName === currentMatchup.awayTeam)
    );

    if (opposingTeamBet || opposingImmortalLock) {
        alert("You cannot select a pick from both teams in the same matchup.");
        return false;
    }

    // Check for multiple bets on same team
    const existingTeamPick = userPicks.find(pick => pick.teamName === option.teamName);
    const existingImmortalLockOnSameTeam = userImmortalLock && userImmortalLock.teamName === option.teamName;

    if (existingTeamPick || existingImmortalLockOnSameTeam) {
        alert("Only one pick per team is allowed.");
        return false;
    }

    return true;
}function validatePick(option) {
    const currentMatchup = betOptions.find(bet => 
        bet.homeTeam === option.teamName || bet.awayTeam === option.teamName
    );
    
    return !!currentMatchup; // Just make sure it's a valid matchup
}

function createPickObject(option) {
    const currentMatchup = betOptions.find(bet => 
        bet.homeTeam === option.teamName || bet.awayTeam === option.teamName
    );

    const pickObject = {
        teamName: option.teamName,
        type: option.type,
        value: option.value,
    };

    // Only add commenceTime if it exists in the option or we can find it
    if (option.commenceTime) {
        pickObject.commenceTime = option.commenceTime;
    } else if (currentMatchup && currentMatchup.commenceTime) {
        pickObject.commenceTime = currentMatchup.commenceTime;
    }

    return pickObject;
}


// Immortal Lock handling
function handleImmortalLockSelection(pick) {
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

function updateBetCell(option, isSelected) {
    // First, remove selection from all buttons
    document.querySelectorAll('.bet-button').forEach(button => {
        button.classList.remove('selected');
    });
    
    // Then update the specific button if selected
    if (isSelected) {
        const teamClass = option.teamName.replace(/\s+/g, '-').toLowerCase();
        const typeClass = option.type.toLowerCase();
        const betButtons = document.querySelectorAll(
            `.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`
        );
        
        betButtons.forEach(button => {
            button.classList.add('selected');
        });
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
                const classicPools = allPools.filter(pool => pool.mode === 'survivor');

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
        
        // Only process moneyline bets
        if (bet.type === 'ML') {
            acc[gameKey].bets.push({
                type: bet.type,
                value: '0', // Default value for ML bets
                team: bet.teamName,
                commenceTime: bet.commenceTime // Make sure to include commence time
            });
        }
        return acc;
    }, {});

    // Render each game
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

    // Create odds info container with vertical layout
    const oddsContainer = document.createElement('div');
    oddsContainer.className = 'odds-info';

    // Find matching bets for this team from betOptions
    const teamBets = betOptions.filter(bet => bet.teamName === teamData);
    const mlBet = teamBets.find(bet => bet.type === 'ML');
    const spreadBet = teamBets.find(bet => bet.type === 'Spread');

    // Add moneyline value (on top)
    const mlInfo = document.createElement('div');
    mlInfo.className = 'odds-value ml-value';
    if (mlBet) {
        mlInfo.textContent = mlBet.value;
        oddsContainer.appendChild(mlInfo);
    }

    // Add spread value (below ML)
    const spreadInfo = document.createElement('div');
    spreadInfo.className = 'odds-value spread-value';
    if (spreadBet) {
        spreadInfo.textContent = spreadBet.value;
        oddsContainer.appendChild(spreadInfo);
    }

    teamContainer.appendChild(oddsContainer);

    // Add ML button with proper data
    const betButton = document.createElement('button');
    betButton.className = `bet-button ml-button ${teamContainer.className}`;
    betButton.dataset.team = teamData.replace(/\s+/g, '-').toLowerCase();
    betButton.dataset.type = 'ml';
    betButton.textContent = 'Select Team';
    
    if (game.isThursdayGame) {
        betButton.dataset.thursdayGame = 'true';
    }
    
    betButton.onclick = () => {
        const betData = {
            teamName: teamData,
            type: 'ML',
            value: mlBet ? mlBet.value : '0',
            commenceTime: game.commenceTime
        };
        selectBet(betData);
    };
    
    teamContainer.appendChild(betButton);
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
    console.log("Validating pick for Thursday constraints:", option);
    
    // If we already have a locked Thursday pick, prevent selecting a different team
    if (lockedPicks.length > 0) {
        console.log("Already have locked Thursday picks:", lockedPicks);
        alert("You already have a locked Thursday pick that cannot be changed.");
        return false;
    }
    
    // Validate against the current game matchup
    const currentMatchup = betOptions.find(bet => 
        bet.homeTeam === option.teamName || bet.awayTeam === option.teamName
    );
    
    if (!currentMatchup) {
        console.log("No current matchup found for:", option.teamName);
        return false;
    }
    
    // Check if this is a Thursday game that has already commenced
    if (checkIfThursdayGame(currentMatchup.commenceTime)) {
        const now = getCurrentTimeInUTC4();
        if (new Date(currentMatchup.commenceTime) < now) {
            console.log("This Thursday game has already commenced");
            alert("Thursday game has already commenced. You cannot select teams from this game.");
            return false;
        }
    }
    
    return true;
}

function enableThursdayGameFeatures() {
    console.log('Enabling Thursday game features...');
    const now = getCurrentTimeInUTC4();
    const blackedOutGames = new Set();
    
    // Track all picks (user picks and already locked picks)
    const allUserPicks = [
        ...userPicks,
        ...lockedPicks
    ];
    
    console.log('All picks to process for Thursday features:', allUserPicks);
    
    // Identify Thursday games that have commenced
    betOptions.forEach(bet => {
        if (checkIfThursdayGame(bet.commenceTime)) {
            const commenceTime = new Date(bet.commenceTime);
            const hasCommenced = commenceTime < now;
            
            if (hasCommenced) {
                blackedOutGames.add(`${bet.homeTeam} vs ${bet.awayTeam}`);
                
                // Check if user has a pick for this game
                const userPickForGame = allUserPicks.find(pick => 
                    pick.teamName === bet.homeTeam || pick.teamName === bet.awayTeam
                );
                
                // If user has a pick for this game, lock it
                if (userPickForGame && !lockedPicks.some(p => p.teamName === userPickForGame.teamName)) {
                    console.log('Moving pick to locked picks:', userPickForGame);
                    
                    // Remove from userPicks if it exists there
                    userPicks = userPicks.filter(p => 
                        p.teamName !== userPickForGame.teamName
                    );
                    
                    // Add to lockedPicks if not already there
                    if (!lockedPicks.some(p => p.teamName === userPickForGame.teamName)) {
                        lockedPicks = [userPickForGame]; // Replace with the new locked pick
                    }
                }
            }
        }
    });
    
    console.log('Games with commenced Thursday games:', blackedOutGames);
    console.log('User picks after locking Thursday games:', userPicks);
    console.log('Locked picks after processing:', lockedPicks);
    
    // Update UI to reflect locked Thursday picks
    blackedOutGames.forEach(gameKey => {
        const [awayTeam, homeTeam] = gameKey.split(' vs ');
        
        // Process both home and away team buttons
        [homeTeam, awayTeam].forEach(team => {
            const teamClass = team.replace(/\s+/g, '-').toLowerCase();
            const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"]`);
            
            betButtons.forEach(button => {
                // Set all buttons in commenced Thursday games as locked
                button.dataset.thursdayGame = 'true';
                
                // Check if this is the user's pick
                const isUserPick = lockedPicks.some(pick => 
                    pick.teamName === team && pick.type.toLowerCase() === button.dataset.type
                );
                
                if (isUserPick) {
                    console.log(`Marking button as user's Thursday pick: ${team}-${button.dataset.type}`);
                    button.classList.add('selected', 'user-thursday-pick');
                }
                
                // Update click handler to prevent changes to locked picks
                button.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (isUserPick) {
                        alert('This pick is locked for Thursday games and cannot be changed.');
                    } else if (lockedPicks.length > 0) {
                        alert('You already have a locked Thursday pick. You cannot select a different team.');
                    } else {
                        alert('Thursday game has already commenced. You cannot select teams from this game.');
                    }
                };
            });
        });
    });
    
    // If user has any locked picks, disable the ability to select other picks
    if (lockedPicks.length > 0) {
        document.querySelectorAll('.bet-button').forEach(button => {
            if (!button.classList.contains('user-thursday-pick')) {
                button.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('You already have a locked Thursday pick. You cannot select a different team.');
                };
            }
        });
    }
    
  
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

// Previous Bets Management
async function fetchLastWeekPicks(username, poolName) {
    try {
        const response = await fetch(`/api/getLastWeekPicks/${encodeURIComponent(username)}/${encodeURIComponent(poolName)}`);
        if (!response.ok) throw new Error('Failed to fetch last week picks');
        
        const data = await response.json();
        if (data.success) {
            lastWeekPicks[`${username}-${poolName}`] = {
                picks: data.picks,
                immortalLockPick: data.immortalLockPick
            };
        } else {
            lastWeekPicks[`${username}-${poolName}`] = {
                picks: [],
                immortalLockPick: []
            };
        }
    } catch (error) {
        console.error('Error fetching last week picks:', error);
    }
}

function blackOutPreviousBets() {
    const key = `${storedUsername}-${selectedPool}`;
    
    if (lastWeekPicks[key] && lastWeekPicks[key].picks) {
        lastWeekPicks[key].picks.forEach(pick => {
            const teamClass = pick.teamName.replace(/\s+/g, '-').toLowerCase();
            const typeClass = pick.type.toLowerCase();
            const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`);

            betButtons.forEach(button => {
                button.style.backgroundColor = 'black';
                button.style.color = 'red';
                button.dataset.previousPick = 'true';
            });
        });
    }

    // Black out immortal lock pick
    if (lastWeekPicks[key] && lastWeekPicks[key].immortalLockPick) {
        lastWeekPicks[key].immortalLockPick.forEach(pick => {
            const teamClass = pick.teamName.replace(/\s+/g, '-').toLowerCase();
            const typeClass = pick.type.toLowerCase();
            const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`);

            betButtons.forEach(button => {
                button.style.backgroundColor = 'black';
                button.style.color = 'red';
                button.dataset.previousPick = 'true';
            });
        });
    }
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

