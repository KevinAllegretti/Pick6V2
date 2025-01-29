// Core variables
const storedUsername = localStorage.getItem('username')?.toLowerCase();
let selectedPool = 'all';
let picksCount = 0;
let userPicks = [];
let userImmortalLock = null;
let betOptions = [];
let isDeadline = false;
let lastWeekPicks = {}; // Add this line to fix the ReferenceError

// Modified loadWeeklyPicks function to handle the case where no picks exist
async function loadWeeklyPicks() {
    try {
        const response = await fetch('/api/getWeeklyPicks');
        if (!response.ok) throw new Error('Failed to fetch weekly picks');
        
        const data = await response.json();
        betOptions = Array.isArray(data) ? data : [];
        
        if (betOptions.length > 0) {
            renderBetOptions();
        } else {
            console.log('No weekly picks available');
            document.getElementById('picksContainer').innerHTML = '<p class="no-picks-message">No picks available at this time.</p>';
        }
    } catch (error) {
        console.error('Failed to fetch weekly picks:', error);
        document.getElementById('picksContainer').innerHTML = '<p class="error-message">Failed to load picks. Please try again later.</p>';
    }
}

// Modified fetchLastWeekPicks to handle errors better
async function fetchLastWeekPicks(username, poolName) {
    try {
        const response = await fetch(`/api/getLastWeekPicks/${encodeURIComponent(username)}/${encodeURIComponent(poolName)}`);
        if (!response.ok) throw new Error('Failed to fetch last week picks');
        
        const data = await response.json();
        const key = `${username}-${poolName}`;
        
        lastWeekPicks[key] = {
            picks: data.success ? data.picks : [],
            immortalLockPick: data.success ? data.immortalLockPick : []
        };
    } catch (error) {
        console.error('Error fetching last week picks:', error);
        // Initialize with empty arrays if there's an error
        const key = `${username}-${poolName}`;
        lastWeekPicks[key] = {
            picks: [],
            immortalLockPick: []
        };
    }
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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (storedUsername) {
        document.querySelector('h1').textContent = `Welcome ${storedUsername}, to the Pick Selection page!`;
        await initializeDashboard();
        // Set flag to false after initial load
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
        // Add pool selector if it doesn't exist
        if (!document.getElementById('poolSelector')) {
            const poolSelectorContainer = document.createElement('div');
            poolSelectorContainer.className = 'pool-selector-container';
            const selector = document.createElement('select');
            selector.id = 'poolSelector';
            selector.className = 'pool-selector';
            selector.innerHTML = '<option value="loading">Loading pools...</option>';
            poolSelectorContainer.appendChild(selector);
            document.querySelector('.back-button-container').after(poolSelectorContainer);
        }

        // Set up event listeners
        setupEventListeners();

        // Initialize components with proper error handling
        try {
            await populatePoolSelector();
            // Add this line to fetch picks for 'all' on initialization
            await fetchUserPicksAndRender(storedUsername, 'all');
        } catch (error) {
            console.error('Error populating pool selector:', error);
            updatePoolSelectorError();
        }

        try {
            await loadWeeklyPicks();
        } catch (error) {
            console.error('Error loading weekly picks:', error);
            document.getElementById('picksContainer').innerHTML = 
                '<p class="error-message">Failed to load picks. Please try again later.</p>';
        }

        try {
            await fetchLastWeekPicks(storedUsername, 'all');
        } catch (error) {
            console.error('Error fetching last week picks:', error);
        }

        try {
            await checkCurrentTimeWindow();
        } catch (error) {
            console.error('Error checking time window:', error);
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

async function populatePoolSelector() {
    const poolSelector = document.getElementById('poolSelector');
    if (!poolSelector) {
        console.error('Pool selector element not found');
        return;
    }

    poolSelector.innerHTML = '<option value="loading">Loading pools...</option>';

    try {
        const response = await fetch(`/pools/userPools/${encodeURIComponent(storedUsername)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pools = await response.json();
        
        // Filter for classic mode pools only
        const classicPools = pools.filter(pool => pool.mode === 'classic');

        if (classicPools.length === 0) {
            poolSelector.innerHTML = '<option value="none">User is in no classic pools</option>';
            return;
        }

        poolSelector.innerHTML = '<option value="all">All Classic Pools</option>';
        classicPools.forEach(pool => {
            if (pool && pool.name) {
                const option = document.createElement('option');
                option.value = pool.name;
                option.textContent = pool.name;
                poolSelector.appendChild(option);
            }
        });

    } catch (error) {
        console.error('Error fetching pools:', error);
        poolSelector.innerHTML = '<option value="error">Error loading pools</option>';
        poolSelector.classList.add('error');
    }
}
// Make sure this is included in your initialization
document.addEventListener('DOMContentLoaded', async () => {
    if (storedUsername) {
        document.querySelector('h1').textContent = `Welcome ${storedUsername}, to the Pick Selection page!`;
        await initializeDashboard();
    } else {
        console.error('No username found in storage');
    }
});
// Helper function to update pool selector on error
function updatePoolSelectorError() {
    const poolSelector = document.getElementById('poolSelector');
    if (poolSelector) {
        poolSelector.innerHTML = '<option value="error">Error loading pools</option>';
        poolSelector.classList.add('error');
    }
}

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

    if (userPicks.length === 0) {
        alert('Please add at least one pick before submitting.');
        return;
    }

    const data = {
        picks: userPicks.map(pick => ({
            teamName: pick.teamName,
            type: pick.type,
            value: pick.value,
            commenceTime: pick.commenceTime
        })),
        immortalLock: userImmortalLock ? [{
            teamName: userImmortalLock.teamName,
            type: userImmortalLock.type,
            value: userImmortalLock.value,
            commenceTime: userImmortalLock.commenceTime
        }] : []
    };

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

// Event listener setup
function setupEventListeners() {
    // Pool selector change
    document.getElementById('poolSelector').addEventListener('change', function(e) {
        selectedPool = e.target.value;
        fetchUserPicksAndRender(storedUsername, selectedPool);
    });

    // Immortal lock checkbox
    document.getElementById('immortalLockCheck').addEventListener('change', function() {
        if (this.checked && picksCount < 6) {
            alert('Please select 6 regular picks before choosing your Immortal Lock.');
            this.checked = false;
        }
    });

    // Submit and reset buttons
    document.getElementById('resetPicks').addEventListener('click', resetPicks);
    document.getElementById('submitPicks').addEventListener('click', submitUserPicks);

    // Display injuries button
    document.getElementById('displayInjuriesBtn').addEventListener('click', handleDisplayInjuries);
}


async function fetchUserPicksAndRender(username, poolSelection) {
    try {
        if (poolSelection === 'all') {
            // Get all classic pools first
            const poolsResponse = await fetch(`/pools/userPools/${encodeURIComponent(username)}`);
            const allPools = await poolsResponse.json();
            const classicPools = allPools.filter(pool => pool.mode === 'classic');
            console.log('Classic pools found:', classicPools);

            // Fetch picks for each classic pool
            const allPoolPicks = await Promise.all(classicPools.map(async pool => {
                const response = await fetch(`/api/getPicks/${username}/${pool.name}`);
                const data = await response.json();
                return {
                    poolName: pool.name,
                    picks: data.picks || [],
                    immortalLock: data.immortalLock || []
                };
            }));

            console.log('All pool picks:', allPoolPicks);

            // Don't proceed if we don't have at least 2 pools to compare
            if (allPoolPicks.length < 2) {
                console.log('Not enough pools to compare');
                return;
            }

            // More strict comparison of picks across pools
            const areSamePicksAcrossPools = allPoolPicks.every((poolPick, index) => {
                if (index === 0) return true; // Skip comparing first pool with itself
                
                const firstPoolPicks = allPoolPicks[0].picks;
                const currentPoolPicks = poolPick.picks;

                // First check if they have the same number of picks
                if (firstPoolPicks.length !== currentPoolPicks.length) {
                    console.log('Different number of picks between pools');
                    return false;
                }

                // Check each pick matches exactly
                return firstPoolPicks.every(firstPick => 
                    currentPoolPicks.some(currentPick => 
                        firstPick.teamName === currentPick.teamName &&
                        firstPick.type === currentPick.type &&
                        firstPick.value === currentPick.value
                    )
                );
            });

            // Similar strict comparison for immortal locks
            const areSameImmortalLocks = allPoolPicks.every((poolPick, index) => {
                if (index === 0) return true;

                const firstPoolLock = allPoolPicks[0].immortalLock;
                const currentPoolLock = poolPick.immortalLock;

                if (!firstPoolLock.length && !currentPoolLock.length) return true;
                if (firstPoolLock.length !== currentPoolLock.length) return false;

                return firstPoolLock.every(firstLock => 
                    currentPoolLock.some(currentLock => 
                        firstLock.teamName === currentLock.teamName &&
                        firstLock.type === currentLock.type &&
                        firstLock.value === currentLock.value
                    )
                );
            });

            console.log('Are picks same across pools?', areSamePicksAcrossPools);
            console.log('Are immortal locks same?', areSameImmortalLocks);

            if (areSamePicksAcrossPools && areSameImmortalLocks) {
                // Only render if everything matches
                clearAllSelections();
                const firstPoolPicks = allPoolPicks[0];
                firstPoolPicks.picks.forEach(pick => renderPick(pick, false));
                if (firstPoolPicks.immortalLock && firstPoolPicks.immortalLock.length > 0) {
                    firstPoolPicks.immortalLock.forEach(lock => renderPick(lock, true));
                }
            } else {
                // Clear selections if picks don't match
                clearAllSelections();
            }
        } else {
            // Original single pool logic
            const response = await fetch(`/api/getPicks/${username}/${poolSelection}`);
            const data = await response.json();
            
            clearAllSelections();
            if (data.picks) {
                data.picks.forEach(pick => renderPick(pick, false));
            }
            if (data.immortalLock) {
                data.immortalLock.forEach(lock => renderPick(lock, true));
            }
        }
    } catch (error) {
        console.error('Error fetching user picks:', error);
        clearAllSelections();
    }
}
// Clear all selections
function clearAllSelections() {
    userPicks = [];
    userImmortalLock = null;
    picksCount = 0;
    document.querySelectorAll('.bet-button').forEach(button => {
        button.classList.remove('selected', 'immortal-lock-selected');
    });
    document.getElementById('immortalLockCheck').checked = false;
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

    // For initial rendering of picks
    if (isRendering) {
        console.log('Rendering pick:', { option, isImmortalLock });
        updateBetCell(option, true, isImmortalLock);
        
        // Create pick object without requiring commenceTime
        if (isImmortalLock) {
            userImmortalLock = {
                teamName: option.teamName,
                type: option.type,
                value: option.value
            };
            immortalLockCheckbox.checked = true;
        } else {
            userPicks.push({
                teamName: option.teamName,
                type: option.type,
                value: option.value
            });
            picksCount++;
        }
        return;
    }

    // Rest of the selectBet function remains the same
    const betButton = document.querySelector(`.bet-button[data-team="${option.teamName.replace(/\s+/g, '-').toLowerCase()}"][data-type="${option.type.toLowerCase()}"]`);
    if (betButton && betButton.dataset.previousPick === 'true' && !isRendering) {
        alert("You made this pick last week. You cannot select it again.");
        return;
    }

    if (userImmortalLock && userImmortalLock.teamName === option.teamName && userImmortalLock.type === option.type) {
        deselectImmortalLock();
        return;
    }

    const existingPickIndex = userPicks.findIndex(pick => 
        pick.teamName === option.teamName && pick.type === option.type
    );

    if (existingPickIndex !== -1 && !isRendering) {
        userPicks.splice(existingPickIndex, 1);
        picksCount--;
        updateBetCell(option, false);
        return;
    }

    if (!validatePick(option)) return;

    const currentPick = createPickObject(option);

    if (isImmortalLock || (immortalLockCheckbox.checked && picksCount === 6 && !userImmortalLock)) {
        handleImmortalLockSelection(currentPick);
    } else if (picksCount < 6) {
        userPicks.push(currentPick);
        picksCount++;
        updateBetCell(option, true);
    } else if (!immortalLockCheckbox.checked) {
        alert('You can only select 6 picks. Toggle Immortal Lock to select your 7th pick as Immortal Lock.');
    } else {
        alert('You already selected all your picks! Deselect one to change them.');
    }
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
}

function createPickObject(option) {
    // Add check for commenceTime, make it optional
    const pickObject = {
        teamName: option.teamName,
        type: option.type,
        value: option.value
    };

    // Only add commenceTime if it exists
    if (option.commenceTime) {
        pickObject.commenceTime = option.commenceTime;
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
        document.getElementById('immortalLockCheck').checked = false;
    }
}
let isInitialPageLoad = true;

function updateBetCell(option, isSelected, isImmortalLock = false) {
    const teamClass = option.teamName.replace(/\s+/g, '-').toLowerCase();
    const typeClass = option.type.toLowerCase();
    
    const updateClasses = () => {
        const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`);
        
        console.log('Updating bet cell:', {
            teamClass,
            typeClass,
            isSelected,
            isImmortalLock,
            buttonCount: betButtons.length
        });

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
        if (selectedPool === 'all') {
            const confirmReset = confirm('Are you sure you want to reset all your picks? This cannot be undone.');
            
            if (confirmReset) {
                // Get all classic pools
                const poolsResponse = await fetch(`/pools/userPools/${encodeURIComponent(storedUsername)}`);
                if (!poolsResponse.ok) throw new Error('Failed to fetch user pools');
                
                const allPools = await poolsResponse.json();
                const classicPools = allPools.filter(pool => pool.mode === 'classic');

                // First, fetch which pools have picks
                const poolsWithPicks = await Promise.all(classicPools.map(async pool => {
                    try {
                        const response = await fetch(`/api/getPicks/${storedUsername}/${pool.name}`);
                        const data = await response.json();
                        return {
                            poolName: pool.name,
                            hasPicks: !!(data.picks?.length || data.immortalLock?.length)
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

                // Reset only pools that have picks
                const results = await Promise.all(poolsToReset.map(async pool => {
                    try {
                        await resetPoolPicks(pool.poolName);
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
            // Check if single pool has picks before resetting
            const response = await fetch(`/api/getPicks/${storedUsername}/${selectedPool}`);
            const data = await response.json();
            
            if (data.picks?.length || data.immortalLock?.length) {
                await resetPoolPicks(selectedPool);
                alert('Picks reset successfully!');
            } else {
                alert('No picks found to reset.');
            }
        }
        
        clearAllSelections();
        await fetchUserPicksAndRender(storedUsername, selectedPool);
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while resetting picks. Please try again.');
    }
}

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

function enableGameTimeFeatures() {
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

// Optional: Add window resize handler if needed
window.addEventListener('resize', () => {
    // Add any responsive design handling here
});

// Export any functions that need to be accessed from other files
