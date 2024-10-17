const storedUsername = localStorage.getItem('username')?.toLowerCase();
const queryParams = new URLSearchParams(window.location.search);
const currentPoolName = queryParams.get('poolName'); // Get the pool name from URL query parameters

if (!currentPoolName) {
 //alert('Pool name is missing.');
 // Handle missing poolName appropriately, perhaps redirecting back or displaying an error message
} else {
 localStorage.setItem('currentPoolName', currentPoolName);
}
function redirectToNFLScheduleWithPoolName(source) {
    window.location.href = `scheduler.html?source=${encodeURIComponent(source)}&poolName=${encodeURIComponent(currentPoolName)}`;
}

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



let betOptions = [
 /*
 // Steelers vs Ravens
 { teamName: 'HOU Texans', type: 'Spread', value: '+9.5' },
 { teamName: 'HOU Texans', type: 'ML', value: '+330' },
 { teamName: 'BAL Ravens', type: 'Spread', value: '-9.5' },
 { teamName: 'BAL Ravens', type: 'ML', value: '-425' },

 // Texans vs Colts
 { teamName: 'GB Packers', type: 'Spread', value: '+9.5' },
 { teamName: 'GB Packers', type: 'ML', value: '+320' },
 { teamName: 'SF 49ers', type: 'Spread', value: '-9.5' },
 { teamName: 'SF 49ers', type: 'ML', value: '-410' },

 // Jaguars vs Titans
 { teamName: 'TB Buccaneers', type: 'Spread', value: '+6.5' },
 { teamName: 'TB Buccaneers', type: 'ML', value: '+245' },
 { teamName: 'DET Lions', type: 'Spread', value: '-6.5' },
 { teamName: 'DET Lions', type: 'ML', value: '-305' },

 // Vikings vs Lions
 { teamName: 'KC Chiefs', type: 'Spread', value: '+2.5' },
 { teamName: 'KC Chiefs', type: 'ML', value: '+124' },
 { teamName: 'BUF Bills', type: 'Spread', value: '-2.5' },
 { teamName: 'BUF Bills', type: 'ML', value: '-148' },*/
];

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
   



let lastWeekPicks = {}; // This will store last week's picks fetched from the server

// Fetch last week's picks when the page loads
// General Fetch Wrapper for Logging
async function fetchWithLogging(url, options = {}) {
 // console.log(`Making fetch request to URL: ${url} with options:`, options);
 try {
 const response = await fetch(url, options);
 // console.log(`Received response from URL: ${url}`, response);
 if (!response.ok) {
 console.error(`Error response from URL: ${url} - ${response.statusText}`);
 }
 return response;
 } catch (error) {
 console.error(`Fetch error for URL: ${url}`, error);
 throw error; // Re-throw the error after logging it
 }
}

// Fetch Last Week's Picks
async function fetchLastWeekPicks(username, poolName) {
 const url = `/api/getLastWeekPicks/${encodeURIComponent(username)}/${encodeURIComponent(poolName)}`;
 const response = await fetchWithLogging(url);
 if (response.ok) {
 const data = await response.json();
  console.log('Fetched data:', data);
 if (data.success) {
 lastWeekPicks[`${username}-${poolName}`] = {
 picks: data.picks,
 immortalLockPick: data.immortalLockPick
 };
 } else {
 lastWeekPicks[`${username}-${poolName}`] = {
 picks: [],
 immortalLockPick: []
 }; // Ensure it initializes even if no picks are found
 }
  console.log('Last week picks:', lastWeekPicks);
 } else {
 console.error('Failed to fetch last week picks:', response.statusText);
 }
}
// Document Ready Function
document.addEventListener('DOMContentLoaded', async () => {
    const storedUsername = localStorage.getItem('username')?.toLowerCase();
    const storedPoolName = localStorage.getItem('currentPoolName');

    if (storedUsername && storedPoolName) {
        await fetchLastWeekPicks(storedUsername, storedPoolName); // Fetch last week's picks
        await loadWeeklyPicks(); // Load weekly picks and render options
    } else {
        console.error('Username or Pool Name is missing.');
    }
});


async function wasPickMadeLastWeek(username, poolName, currentPick) {
 const key = `${username}-${poolName}`;
 if (lastWeekPicks[key]) {
 return lastWeekPicks[key].some(pick => {
 return pick.teamName === currentPick.teamName && pick.type === currentPick.type;
 });
 }
 return false;
}


 let picksCount = 0;
 let userPicks = [];
 let userImortalLock = [];
 console.log(storedUsername);
 
 // If the username exists in localStorage, update the h1 element
 if (storedUsername) {
 document.querySelector('h1').textContent = `Welcome ${storedUsername}, to the Pick Selection page!`;
 }

 //setting this here for test
 //another test
 
 let userImmortalLock = null;

// Fetch user picks and render them
async function fetchUserPicksAndRender(username, poolName) {
    try {
        const response = await fetch(`/api/getPicks/${encodeURIComponent(username)}/${encodeURIComponent(poolName)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user picks');
        }
        const userPicksData = await response.json();
        
        // Render regular picks
        userPicksData.picks.forEach(pick => renderPick(pick, false));
        
        // Render Immortal Lock if present
        if (userPicksData.immortalLock && userPicksData.immortalLock.length > 0) {
            renderPick(userPicksData.immortalLock[0], true);
        }
    } catch (error) {
        console.error('Error fetching user picks:', error);
    }
}

// Render a single pick
function renderPick(pick, isImmortalLock) {
    const option = {
        teamName: pick.teamName,
        type: pick.type,
        value: pick.value
    };
    selectBet(option, true, isImmortalLock);
}

// Main function to handle bet selection
function selectBet(option, isRendering = false, isImmortalLock = false) {
    const immortalLockCheckbox = document.getElementById('immortalLockCheck');


    const betButton = document.querySelector(`.bet-button[data-team="${option.teamName.replace(/\s+/g, '-').toLowerCase()}"][data-type="${option.type.toLowerCase()}"]`);
    if (betButton && betButton.dataset.previousPick === 'true' && !isRendering) {
        alert("You made this pick last week. You cannot select it again.");
        return;
    }
    // Handle deselection of Immortal Lock
    if (userImmortalLock && userImmortalLock.teamName === option.teamName && userImmortalLock.type === option.type) {
        deselectImmortalLock();
        return;
    }


    // Check for existing pick
    const existingPickIndex = userPicks.findIndex(pick => pick.teamName === option.teamName && pick.type === option.type);


    // Toggle off existing pick
    if (existingPickIndex !== -1 && !isRendering) {
        userPicks.splice(existingPickIndex, 1);
        picksCount--;
        updateBetCell(option, false);
        return;
    }


    // Validate pick
    if (!validatePick(option)) return;


    const currentPick = createPickObject(option);


    // Handle pick selection
    if (isImmortalLock || (immortalLockCheckbox.checked && picksCount === 6 && !userImmortalLock)) {
        // Set Immortal Lock as 7th pick
        handleImmortalLockSelection(currentPick);
    } else if (picksCount < 6) {
        // Add regular pick
        userPicks.push(currentPick);
        picksCount++;
        updateBetCell(option, true);
    } else if (!immortalLockCheckbox.checked) {
        // Alert when 6 picks are selected but Immortal Lock is not toggled
        alert('You can only select 6 picks. Toggle Immortal Lock to select your 7th pick as Immortal Lock.');
    } else {
        // Alert when all picks (including Immortal Lock) are already selected
        alert('You already selected all your picks! Deselect one to change them.');
    }
}


// Handle Immortal Lock selection
function handleImmortalLockSelection(pick) {
    if (userImmortalLock) {
        updateBetCell(userImmortalLock, false, true);
    }
    userImmortalLock = pick;
    updateBetCell(pick, true, true);
    document.getElementById('immortalLockCheck').checked = true;
}


// Update the Immortal Lock checkbox event listener
document.getElementById('immortalLockCheck').addEventListener('change', function() {
    const immortalLockDiv = document.getElementById('immortalLock');
    if (this.checked) {
        immortalLockDiv.style.display = 'block';
        if (picksCount === 6 && !userImmortalLock) {
            alert('Please select your 7th pick as the Immortal Lock.');
        } else if (picksCount < 6) {
            alert('Please select 6 regular picks before choosing your Immortal Lock.');
            this.checked = false;
            immortalLockDiv.style.display = 'none';
        }
    } else {
        immortalLockDiv.style.display = 'none';
        if (userImmortalLock) {
            deselectImmortalLock();
        }
    }
});


// Fetch user picks and render them (unchanged)
async function fetchUserPicksAndRender(username, poolName) {
    try {
        const response = await fetch(`/api/getPicks/${encodeURIComponent(username)}/${encodeURIComponent(poolName)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user picks');
        }
        const userPicksData = await response.json();
       
        // Render regular picks
        userPicksData.picks.forEach(pick => renderPick(pick, false));
       
        // Render Immortal Lock if present
        if (userPicksData.immortalLock && userPicksData.immortalLock.length > 0) {
            renderPick(userPicksData.immortalLock[0], true);
        }
    } catch (error) {
        console.error('Error fetching user picks:', error);
    }
}


function deselectImmortalLock() {
    if (userImmortalLock) {
        updateBetCell(userImmortalLock, false, true);
        userImmortalLock = null;
    }
}


function validatePick(option, isImmortalLock = false) {
    const currentMatchup = betOptions.find(bet => bet.homeTeam === option.teamName || bet.awayTeam === option.teamName);
    
    // Check for opposing team bet
    const opposingTeamBet = userPicks.find(pick => 
        (currentMatchup.homeTeam !== option.teamName && pick.teamName === currentMatchup.homeTeam) ||
        (currentMatchup.awayTeam !== option.teamName && pick.teamName === currentMatchup.awayTeam)
    );
    // Also check if the Immortal Lock is on the opposing team
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

    if (existingTeamPick || (existingImmortalLockOnSameTeam && !isImmortalLock)) {
        alert("Only one pick per team is allowed.");
        return false;
    }

    return true;
}


// Create a pick object (unchanged)
function createPickObject(option) {
    const currentMatchup = betOptions.find(bet => bet.homeTeam === option.teamName || bet.awayTeam === option.teamName);
    return {
        teamName: option.teamName,
        type: option.type,
        value: option.value,
        commenceTime: currentMatchup.commenceTime
    };
}


// Update bet cell styling (unchanged)
function updateBetCell(option, isSelected, isImmortalLock = false) {
    const teamClass = option.teamName.replace(/\s+/g, '-').toLowerCase();
    const typeClass = option.type.toLowerCase();
    const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`);
    betButtons.forEach(button => {
        button.classList.toggle('selected', isSelected);
        button.classList.toggle('immortal-lock-selected', isSelected && isImmortalLock);
    });
}

// Submit user picks
function submitUserPicks() {
    // ... (existing submitUserPicks function logic)
}

// Initialize dashboard
window.addEventListener('load', () => {
    setTimeout(() => {
        const storedUsername = localStorage.getItem('username');
        const currentPoolName = localStorage.getItem('currentPoolName');
        if (storedUsername && currentPoolName) {
            fetchUserPicksAndRender(storedUsername.toLowerCase(), currentPoolName);
        }
    }, 500); // Delay to ensure DOM is ready
});


function resetPicks() {
 picksCount = 0;
 userPicks = [];
 userImortalLock = [];
 
 // Ensure that the immortalLock element exists before trying to access its properties
 const immortalLockElement = document.getElementById('immortalLock');
 if (immortalLockElement) {
 immortalLockElement.style.display = 'none';
 }

 const statusMessageElement = document.getElementById('statusMessage');
 if (statusMessageElement) {
 statusMessageElement.textContent = '';
 }

 // Reset the visual state of all bet cells
 const betCells = document.querySelectorAll('.betCell');
 betCells.forEach(cell => {
 cell.classList.remove('selected');
 });

 // Show the addPick div if it's hidden
 const addPickElement = document.getElementById('addPick');
 if (addPickElement) {
 addPickElement.style.display = 'block';
 }

 // Uncheck the immortalLockCheck if it's checked
 const immortalLockCheckElement = document.getElementById('immortalLockCheck');
 if (immortalLockCheckElement) {
 immortalLockCheckElement.checked = false;
 }

 // Make the API call to reset the picks on the server
 fetch(`/api/resetPicks/${storedUsername}/${currentPoolName}`, { 
 method: 'POST',
 headers: {
 'Content-Type': 'application/json'
 }
 })
 .then(response => response.json())
 .then(data => {
 if (data && data.success) {
 // console.log('Picks reset successfully on server.');
 alert('Picks reset successfully on server.')
 //updatePicksDisplay();
 } else {
 console.error('Error resetting picks on server.', data);
 }
 })
 .catch(error => {
 console.error('Error:', error);
 alert('An error occurred when resetting picks. Please try again later.');
 });
 }


 document.getElementById('resetPicks').addEventListener('click', resetPicks);
 // console.log(thursdayDeadline, tuesdayEndTime);
 
 isDeadline = false;
 
 function submitUserPicks() {
    if (!currentPoolName) {
        alert('Current pool name is not set.');
        return;
    }
    if (userPicks.length === 0) {
        alert('Please add at least one pick before submitting.');
        return;
    }

    const validateDate = (date) => {
        const parsedDate = Date.parse(date);
        return !isNaN(parsedDate) ? new Date(parsedDate).toISOString() : null;
    };

    // Create the data object with picks
    const data = {
        picks: userPicks.map(pick => ({
            teamName: pick.teamName,
            type: pick.type,
            value: pick.value,
            commenceTime: validateDate(pick.commenceTime)
        })),
        immortalLock: userImmortalLock ? [{
            teamName: userImmortalLock.teamName,
            type: userImmortalLock.type,
            value: userImmortalLock.value,
            commenceTime: validateDate(userImmortalLock.commenceTime)
        }] : [],
        poolName: currentPoolName
    };

    console.log('Submitting picks data:', data); // Log the data being submitted

    fetch(`/api/savePicks/${storedUsername}/${currentPoolName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Picks successfully submitted!');
            // Additional code to handle successful submission
        } else {
            alert('Error submitting picks. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
}



 
 
 // Event Listeners
 document.getElementById('immortalLockCheck').addEventListener('change', function() {
 const immortalLockDiv = document.getElementById('immortalLock');
 if (this.checked) {
 immortalLockDiv.style.display = 'block';
 } else {
 immortalLockDiv.style.display = 'none';
 }
 });
 
 document.getElementById('resetPicks').addEventListener('click', resetPicks);
 document.getElementById('submitPicks').addEventListener('click', submitUserPicks);
 
 function blackOutPreviousBets() {
 const storedUsername = localStorage.getItem('username')?.toLowerCase();
 const currentPoolName = localStorage.getItem('currentPoolName');
 const key = `${storedUsername}-${currentPoolName}`;

 if (lastWeekPicks[key] && lastWeekPicks[key].picks) {
 lastWeekPicks[key].picks.forEach(pick => {
 const teamClass = pick.teamName.replace(/\s+/g, '-').toLowerCase();
 const typeClass = pick.type.toLowerCase();
 const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`);

 betButtons.forEach(button => {
 button.style.backgroundColor = 'black';
 button.style.color = 'red';
 button.dataset.previousPick = 'true'; // Add a custom data attribute to mark it as a previous pick
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
 button.dataset.previousPick = 'true'; // Add a custom data attribute to mark it as a previous pick
 });
 });
 }
}


// Fetch and display injuries for the specific game
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

function mapInjuryTeamName(name) {
    return injuryTeamNameMap[name] || name;
}


async function fetchAndDisplayMatchupInjuries(game, buttonElement) {
    console.log('Fetching and displaying matchup injuries...');

    const teamFilter = document.getElementById('teamFilter');
    const injuryContainer = document.getElementById('injuryContainer');
    const displayInjuriesBtn = document.getElementById('displayInjuriesBtn');

    // Set the team filter to match the teams in the game
    teamFilter.value = game.homeTeam;
    injuryContainer.classList.add('visible', 'visible-border');
    teamFilter.classList.remove('hidden');

    // Scroll to the injury section
    injuryContainer.scrollIntoView({ behavior: 'smooth' });

    // Fetch and display the injuries for the specific matchup
    try {
        const response = await fetch('/api/getInjuries');
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        const injuries = await response.json();
        const gameInjuries = injuries.filter(injury =>
            mapInjuryTeamName(injury.team.name) === game.homeTeam || mapInjuryTeamName(injury.team.name) === game.awayTeam
        );

        displayInjuries(gameInjuries, true);
         // Adjust the scroll position
         const injuryContainerRect = injuryContainer.getBoundingClientRect();
         const offset = -200; // Adjust this value as needed to scroll higher or lower
         window.scrollTo({
             top: window.pageYOffset + injuryContainerRect.top + offset,
             behavior: 'smooth'
         });
    } catch (error) {
        console.error('Error fetching injuries:', error);
    }
}

// Update displayInjuries to support filtering
function displayInjuries(injuries, isFiltered = false) {
    const injuryList = document.getElementById('injuryList');
    const teamFilter = document.getElementById('teamFilter');
    const selectedTeam = isFiltered ? null : teamFilter.value;

    const filteredInjuries = selectedTeam
        ? injuries.filter(injury => injury.team.name === selectedTeam)
        : injuries;

    // Sort the filtered injuries by team name
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

    console.log("Injury list updated HTML:", injuryList.innerHTML);
}



function createTeamContainer(game, teamRole) {
    const teamData = game[teamRole + 'Team'];
    const teamContainer = document.createElement('div');
    teamContainer.className = `team-container ${game['colorClass' + teamRole.charAt(0).toUpperCase() + teamRole.slice(1)]}`;
   
    // Create the team logo
    const teamLogo = document.createElement('img');
    teamLogo.src = teamRole === 'away' ? game.logoAway : game.logoHome;
    teamLogo.alt = teamData + ' logo';
    teamLogo.className = 'team-logo';
    teamContainer.appendChild(teamLogo);
   
    // Create the popup container for displaying next week's matchups
    const popupContainer = document.createElement('div');
    popupContainer.className = 'popup-container';
    popupContainer.innerHTML = ' ';
    teamContainer.appendChild(popupContainer);
   
    // Add bet buttons dynamically (Reintroducing this logic)
    game.bets.filter(bet => bet.team === teamData).forEach(bet => {
        const betButton = document.createElement('button');
        betButton.className = `bet-button ${teamContainer.className}`;
        betButton.textContent = bet.value;
        betButton.dataset.team = teamData.replace(/\s+/g, '-').toLowerCase();
        betButton.dataset.type = bet.type.toLowerCase();
        betButton.onclick = () => selectBet({ teamName: teamData, type: bet.type, value: bet.value });
        teamContainer.appendChild(betButton);
    });
   
    return teamContainer;
}

function renderBetOptions() {
    const container = document.getElementById('picksContainer');
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
        formattedValue = formattedValue.startsWith('+') || formattedValue.startsWith('-') ? formattedValue : (formattedValue > 0 ? `+${formattedValue}` : formattedValue);
        acc[gameKey].bets.push({ type: bet.type, value: formattedValue, team: bet.teamName });
        return acc;
    }, {});

    Object.values(games).forEach(game => {
        const gameContainer = document.createElement('div');
        gameContainer.className = 'game-container';
        gameContainer.style.display = 'flex';
        gameContainer.style.flexDirection = 'column';
        gameContainer.style.alignItems = 'center';

        // Create "Next Week Matchups" button (Move to the top of the game container)
        const nextWeekButton = document.createElement('button');
        nextWeekButton.className = 'next-week-matchup-button';
        nextWeekButton.textContent = 'Next Week Matchups';

        // Add event listener for the button to toggle both popups
        nextWeekButton.addEventListener('click', function() {
            const homePopupContainer = homeTeamContainer.querySelector('.popup-container');
            const awayPopupContainer = awayTeamContainer.querySelector('.popup-container');

            const homeActive = homePopupContainer.classList.contains('active');
            const awayActive = awayPopupContainer.classList.contains('active');

            if (homeActive && awayActive) {
                // Collapse both popups
                homePopupContainer.classList.remove('active');
                awayPopupContainer.classList.remove('active');
                homePopupContainer.style.maxHeight = '0';
                awayPopupContainer.style.maxHeight = '0';
                homePopupContainer.style.opacity = '0';
                awayPopupContainer.style.opacity = '0';
            } else {
                // Expand both popups
                homePopupContainer.classList.add('active');
                awayPopupContainer.classList.add('active');
                homePopupContainer.style.maxHeight = '150px'; // Adjust the height as needed
                awayPopupContainer.style.maxHeight = '150px';
                homePopupContainer.style.opacity = '1';
                awayPopupContainer.style.opacity = '1';

                // Fetch and update the popup content
                fetchAndUpdatePopupContent(homeTeamContainer, game, 'home');
                fetchAndUpdatePopupContent(awayTeamContainer, game, 'away');
            }
        });

        gameContainer.appendChild(nextWeekButton); // Ensure the button is at the top

        const teamsContainer = document.createElement('div');
        teamsContainer.style.display = 'flex';
        teamsContainer.style.alignItems = 'center';

        const awayTeamContainer = createTeamContainer(game, 'away');
        const homeTeamContainer = createTeamContainer(game, 'home');

        teamsContainer.appendChild(awayTeamContainer);
        const atSymbol = document.createElement('div');
        atSymbol.textContent = '@';
        atSymbol.className = 'at-symbol';
        teamsContainer.appendChild(atSymbol);
        teamsContainer.appendChild(homeTeamContainer);

        gameContainer.appendChild(teamsContainer);

        const commenceTime = document.createElement('div');
        commenceTime.textContent = new Date(game.commenceTime).toLocaleString('en-US', {
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        commenceTime.className = 'commence-time';
        gameContainer.appendChild(commenceTime);

        // Add the "Matchup Injuries" button
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

// Fetch and update the popup content with next week’s matchups
async function fetchAndUpdatePopupContent(teamContainer, game, teamRole) {
    const teamName = game[teamRole + 'Team'];
    const popupContainer = teamContainer.querySelector('.popup-container');

    // Fetch the games two weeks ahead from the back-end
    const response = await fetch('/api/fetchGamesTwoWeeksAhead');
    const data = await response.json();

    if (data.success && data.games) {
        const teamGames = data.games.filter(game =>
            game.homeTeam === teamName || game.awayTeam === teamName
        );

        if (teamGames.length > 0) {
            const nextGame = teamGames[0]; // Assuming you want the first available game

            // Retrieve the logos for home and away teams
            const awayLogo = `<img src="${teamLogos[nextGame.awayTeam]}" alt="${nextGame.awayTeam} logo" class="popup-team-logo">`;
            const homeLogo = `<img src="${teamLogos[nextGame.homeTeam]}" alt="${nextGame.homeTeam} logo" class="popup-team-logo">`;

            // Update the popup content with the team's logos and @ symbol
            popupContainer.innerHTML = `
                <div class="popup-matchup">
                    ${awayLogo}
                    <div class="popup-at-symbol">@</div>
                    ${homeLogo}
                </div>
            `;
        } else {
            popupContainer.innerHTML = '<p>No upcoming matchups found for this team.</p>';
        }
    } else {
        popupContainer.innerHTML = '<p>Failed to fetch matchups.</p>';
    }
}

function createBetButtons(teamData) {
 const container = document.createElement('div');
 container.className = 'bet-buttons';

 ['Spread', 'ML'].forEach(type => {
 if (teamData[type]) {
 const button = document.createElement('button');
 button.className = `bet-button ${teamColorClasses[teamData.teamName]}`;
 button.textContent = teamData[type]; 
 button.onclick = () => selectBet({
 teamName: teamData.teamName,
 type: type,
 value: teamData[type]
 });
 container.appendChild(button);
 }
 });

 return container;
}
function groupBetsByGame(betOptions) {
// Group bets by game using team names and commence time
// Group bets by game using the unique identifier
const games = betOptions.reduce((acc, bet) => {
 const gameKey = bet.gameIdentifier; // Using the new unique game identifier
 if (!acc[gameKey]) {
 acc[gameKey] = {
 awayTeam: bet.teamRole === 'away' ? bet.teamName : undefined,
 homeTeam: bet.teamRole === 'home' ? bet.teamName : undefined,
 bets: [],
 commenceTime: bet.commenceTime,
 logoAway: teamLogos[bet.teamRole === 'away' ? bet.teamName : ''],
 logoHome: teamLogos[bet.teamRole === 'home' ? bet.teamName : ''],
 colorClassAway: teamColorClasses[bet.teamRole === 'away' ? bet.teamName : ''],
 colorClassHome: teamColorClasses[bet.teamRole === 'home' ? bet.teamName : '']
 };
 }
 acc[gameKey].bets.push({ type: bet.type, value: bet.value, team: bet.teamName });
 return acc;
}, {});

}


 // Initialization
 //renderBetOptions();
 async function fetchMLBData() {
 const url = 'https://odds.p.rapidapi.com/v4/sports/baseball_mlb/odds';
 const params = {
 regions: 'us',
 markets: 'h2h,spreads',
 oddsFormat: 'american',
 };
 const queryParams = new URLSearchParams(params);
 betOptions = [];
 try {
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
 console.log("Full API Data:", data); // Log the entire data set received from the API

 data.forEach(event => {
 console.log('Processing event:', event);
 
 if (!event.teams || !Array.isArray(event.teams)) {
 if (event.home_team && event.away_team) {
 const nflHomeTeam = mlbToNflMap[event.home_team] || event.home_team;
 const nflAwayTeam = mlbToNflMap[event.away_team] || event.away_team;
 processBookmakers([nflHomeTeam, nflAwayTeam], event.bookmakers, event.commence_time, event.home_team, event.away_team);
 } else {
 console.error('Valid teams data is missing:', event);
 return; // Skip this event if teams data is not usable
 }
 } else {
 const nflTeams = event.teams.map(team => mlbToNflMap[team] || team);
 processBookmakers(nflTeams, event.bookmakers, event.commence_time, event.home_team, event.away_team);
 }
 });
 
 } catch (error) {
 console.error('Error fetching MLB data:', error);
 }
}



function processBookmakers(nflTeams, bookmakers, commenceTime, homeTeam, awayTeam) {
 // Map MLB team names to NFL names
 const nflHomeTeam = mlbToNflMap[homeTeam] || homeTeam;
 const nflAwayTeam = mlbToNflMap[awayTeam] || awayTeam;

 bookmakers.forEach(bookmaker => {
 if (bookmaker.key === 'draftkings') {
 bookmaker.markets.forEach(market => {
 market.outcomes.forEach(outcome => {
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


//document.getElementById('savePicksButton').addEventListener('click', saveWeeklyPicks);
//document.getElementById('fetchOddsButton').addEventListener('click', fetchMLBData);


async function saveWeeklyPicks() {
 const picksData = betOptions;
 fetch('/api/saveWeeklyPicks', {
 method: 'POST',
 headers: {'Content-Type': 'application/json'},
 body: JSON.stringify({ picks: picksData })
 })
 .then(handleResponse)
 .catch(handleError);
}

async function loadWeeklyPicks() {
 fetch('/api/getWeeklyPicks')
 .then(handleResponse)
 .then(picks => {
 betOptions = Array.isArray(picks) ? picks : [];
 renderBetOptions();
 })
 .catch(handleError);
}

async function handleResponse(response) {
 if (!response.ok) throw new Error('Network response was not ok');
 return response.json();
}

async function handleError(error) {
 console.error('Failed to fetch data:', error);
}


function getCurrentTimeInUTC4() {
    const now = new Date();
    const nowUtc4 = new Date(now);
    nowUtc4.setMinutes(nowUtc4.getMinutes() + nowUtc4.getTimezoneOffset()); // Convert to UTC
    nowUtc4.setHours(nowUtc4.getHours() - 4); // Convert UTC to EDT (UTC-4)
    return nowUtc4;
}

const now = getCurrentTimeInUTC4();

// Set Thursday deadline
let thursdayDeadline = new Date(now);
thursdayDeadline.setDate(now.getDate() + ((4 + 7 - now.getDay()) % 7));
thursdayDeadline.setHours(19, 0, 0, 0); // 7 PM EST
thursdayDeadline.setMinutes(thursdayDeadline.getMinutes() + thursdayDeadline.getTimezoneOffset());
thursdayDeadline.setHours(thursdayDeadline.getHours() - 4); // Convert UTC to EST (UTC-4)

// Set Tuesday start time
let tuesdayStartTime = new Date(now);
tuesdayStartTime.setDate(now.getDate() + ((2 + 7 - now.getDay()) % 7));
tuesdayStartTime.setHours(0, 0, 0, 0); // 12 AM EST
tuesdayStartTime.setMinutes(tuesdayStartTime.getMinutes() + tuesdayStartTime.getTimezoneOffset());
tuesdayStartTime.setHours(tuesdayStartTime.getHours() - 4); // Convert UTC to EST (UTC-4)

// Adjust if current time is past this week's Tuesday 12 AM
if (now > tuesdayStartTime) {
    tuesdayStartTime.setDate(tuesdayStartTime.getDate() + 7); // Move to next Tuesday
}

// Adjust if current time is past this week's Thursday 7 PM
if (now > thursdayDeadline) {
    thursdayDeadline.setDate(thursdayDeadline.getDate() + 7); // Move to next Thursday
}





async function fetchTimeWindows() {
    try {
        const response = await fetch('/api/timewindows');
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        const times = await response.json();
        return times;
    } catch (error) {
        console.error('Error fetching time windows:', error);
    }
}
async function checkCurrentTimeWindow() {
    try {
        const response = await fetch('/api/timewindows');
        if (!response.ok) {
            throw new Error('Failed to fetch time windows.');
        }

        const { tuesdayStartTime, thursdayDeadline } = await response.json();
        const now = getCurrentTimeInUTC4();

        const tuesdayTime = new Date(tuesdayStartTime);
        const thursdayTime = new Date(thursdayDeadline);

        // Check if it is Pick Time or Game Time
        if (now > tuesdayTime && now < thursdayTime) {
            console.log('Current time window: Pick Time');
        } else if (now > thursdayTime && now < tuesdayTime) {
            console.log('Current time window: Game Time');
            enableGameTimeFeatures();
        } else {
            console.log('Error determining the current time window');
        }
    } catch (error) {
        console.error('Error checking current time window:', error);
    }
}

// Function to check if it's game time
function checkGameTime() {
    const now = getCurrentTimeInUTC4();
    if (now > thursdayDeadline && now < tuesdayStartTime) {
        enableGameTimeFeatures();
    } else {
        enablePickTimeFeatures();
    }
}


    // Function to enable pick buttons
    function enablePickTimeFeatures() {
        const submitPicksButton = document.getElementById('submitPicks');
        const resetPicksButton = document.getElementById('resetPicks');
        
       submitPicksButton.classList.remove('disabled');
        resetPicksButton.classList.remove('disabled');

        submitPicksButton.disabled = false;
        resetPicksButton.disabled = false;

        submitPicksButton.removeEventListener('click', showGameTimeAlert);
        resetPicksButton.removeEventListener('click', showGameTimeAlert);
    }

    // Function to disable pick buttons
    function enableGameTimeFeatures() {
        const submitPicksButton = document.getElementById('submitPicks');
        const resetPicksButton = document.getElementById('resetPicks');
        
        submitPicksButton.classList.add('disabled');
        resetPicksButton.classList.add('disabled');

        submitPicksButton.disabled = true;
        resetPicksButton.disabled = true;

        submitPicksButton.addEventListener('click', showGameTimeAlert);
        resetPicksButton.addEventListener('click', showGameTimeAlert);
    }

    // Function to show game time alert
    function showGameTimeAlert(event) {
        event.preventDefault();
        alert("It's game time! Pick selection page not available.");
    }

    // Call checkGameTime on DOMContentLoaded
    setTimeout(checkCurrentTimeWindow, 100);

    // Rest of your existing code
    document.getElementById('resetPicks').addEventListener('click', resetPicks);
    document.getElementById('submitPicks').addEventListener('click', submitUserPicks);

async function fetchAndSaveInjuries() {
    try {
        const response = await fetch('/api/fetchAndSaveInjuries');
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        console.log('Injuries fetched and saved successfully.');
    } catch (error) {
        console.error('Error fetching and saving injuries:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
   // const fetchAndSaveInjuriesBtn = document.getElementById('fetchAndSaveInjuriesBtn');
    const displayInjuriesBtn = document.getElementById('displayInjuriesBtn');
    const injuryContainer = document.getElementById('injuryContainer');
    const teamFilter = document.getElementById('teamFilter');

    // Initially hide the injury container
    injuryContainer.classList.add('hidden-border'); // Add the hidden-border class initially

  /*  fetchAndSaveInjuriesBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/fetchAndSaveInjuries');
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            console.log('Injuries fetched and saved successfully.');
        } catch (error) {
            console.error('Error fetching and saving injuries:', error);
        }
    });*/

    displayInjuriesBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/getInjuries');
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            const injuries = await response.json();
            console.log("Injuries fetched:", injuries);
            displayInjuries(injuries);
            injuryContainer.classList.toggle('visible');
            teamFilter.classList.toggle('hidden');

            if (!teamFilter.classList.contains('hidden')) {
                // Populate team filter options
                let uniqueTeams = [...new Set(injuries.map(injury => injury.team.name))];
                uniqueTeams = uniqueTeams.sort(); // Sort teams alphabetically
                teamFilter.innerHTML = '<option value="">All Teams</option>';
                uniqueTeams.forEach(team => {
                    const option = document.createElement('option');
                    option.value = team;
                    option.textContent = team;
                    teamFilter.appendChild(option);
                });
            }

            // Toggle the hidden-border class based on visibility
            if (injuryContainer.classList.contains('visible')) {
                injuryContainer.classList.remove('hidden-border');
            } else {
                injuryContainer.classList.add('hidden-border');
                injuryContainer.classList.remove('visible-border');
            }
        } catch (error) {
            console.error('Error fetching injuries:', error);
        }
    });

    teamFilter.addEventListener('change', async () => {
        const response = await fetch('/api/getInjuries');
        if (response.ok) {
            const injuries = await response.json();
            displayInjuries(injuries);
        }
    });
});


