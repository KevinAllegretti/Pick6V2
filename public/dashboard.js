const queryParams = new URLSearchParams(window.location.search);
const currentPoolName = queryParams.get('poolName'); // Get the pool name from URL query parameters

if (!currentPoolName) {
    alert('Pool name is missing.');
    // Handle missing poolName appropriately, perhaps redirecting back or displaying an error message
}
const now = new Date();
let thursdayDeadline = new Date(now);
thursdayDeadline.setDate(now.getDate() + ((4 + 7 - now.getDay()) % 7));
thursdayDeadline.setHours(19, 0, 0, 0); // 7 PM EST
thursdayDeadline.setMinutes(thursdayDeadline.getMinutes() + thursdayDeadline.getTimezoneOffset());
thursdayDeadline.setHours(thursdayDeadline.getHours() - 5); // Convert UTC to EST (UTC-5)

// Define the end time for Tuesday 12 AM EST
let tuesdayEndTime = new Date(now);
tuesdayEndTime.setDate(now.getDate() + ((2 + 7 - now.getDay()) % 7));
tuesdayEndTime.setHours(0, 0, 0, 0); // 12 AM EST
tuesdayEndTime.setMinutes(tuesdayEndTime.getMinutes() + tuesdayEndTime.getTimezoneOffset());
tuesdayEndTime.setHours(tuesdayEndTime.getHours() - 5); // Convert UTC to EST (UTC-5)
// Assuming betOptions is an array of all bet options for the week
const betOptions = [
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
  { teamName: 'BUF Bills', type: 'ML', value: '-148' },
];

const teamColorClasses = {
    'ARI Cardinals': 'cardinals-color',
    'ATL Falcons': 'falcons-color',
    'BAL Ravens': 'ravens-color',
    'BUF Bills': 'bills-color',
    'CAR Panthers': 'panthers-color',
    'CHI Bears': 'bears-color',
    'CIN Bengals': 'bengals-color',
    'CLE Browns': 'browns-color',
    'DAL Cowboys': 'cowboys-color',
    'DEN Broncos': 'broncos-color',
    'DET Lions': 'lions-color',
    'GB Packers': 'packers-color',
    'HOU Texans': 'texans-color',
    'IND Colts': 'colts-color',
    'JAX Jaguars': 'jaguars-color',
    'KC Chiefs': 'chiefs-color',
    'LV Raiders': 'raiders-color',
    'LA Chargers': 'chargers-color',
    'LA Rams': 'rams-color',
    'MIA Dolphins': 'dolphins-color',
    'MIN Vikings': 'vikings-color',
    'NE Patriots': 'patriots-color',
    'NO Saints': 'saints-color',
    'NY Giants': 'giants-color',
    'NY Jets': 'jets-color',
    'PHI Eagles': 'eagles-color',
    'PIT Steelers': 'steelers-color',
    'SF 49ers': 'FortyNiners-color',
    'SEA Seahawks': 'seahawks-color',
    'TB Buccaneers': 'buccaneers-color',
    'TEN Titans': 'titans-color',
    'WAS Commanders': 'commanders-color'
};
  
const teamLogos = {
  'ARI Cardinals': '/ARILogo.png',
  'ATL Falcons': '/ATLLogo.png',
  'BAL Ravens': '/BALLogo.png',
  'BUF Bills': '/BUFLogo.png',
  'CAR Panthers': '/CARLogo.png',
  'CHI Bears': '/CHILogo.png',
  'CIN Bengals': '/CINLogo.png',
  'CLE Browns': '/CLELogo.png',
  'DAL Cowboys': '/DALLogo.png',
  'DEN Broncos': '/DENLogo.png',
  'DET Lions': '/DETLogo.png',
  'GB Packers': '/GBLogo.png',
  'HOU Texans': '/HOULogo.png',
  'IND Colts': '/INDLogo.png',
  'JAX Jaguars': '/JAXLogo.png',
  'KC Chiefs': '/KCLogo.png',
  'LV Raiders': '/LVLogo.png',
  'LA Chargers': '/LACLogo.png',
  'LA Rams': '/LARLogo.png',
  'MIA Dolphins': '/MIALogo.png',
  'MIN Vikings': '/MINLogo.png',
  'NE Patriots': '/NELogo.png',
  'NO Saints': '/NOLogo.png',
  'NY Giants': '/NYGLogo.png',
  'NY Jets': '/NYJLogo.png',
  'PHI Eagles': '/PHILogo.png',
  'PIT Steelers': '/PITLogo.png',
  'SF 49ers': '/SFLogo.png',
  'SEA Seahawks': '/SEALogo.png',
  'TB Buccaneers': '/TBLogo.png',
  'TEN Titans': '/TENLogo.png',
  'WAS Commanders': '/WASLogo.png'
};


const lastWeekPicks = {
  "TheDiggler": [

  ],
  "Parlay Prodigy": [

  ],
  "Midnight Professional": [

  ],
  "Primitive Picks": [

  ],
  "Bear Jew": [
    // No new picks listed, assuming they remain unchanged
  ],
  "L to the OG": [

  ],
  "porkSkinGooner": [
 // Immortal Lock
  ],
  "LazyAhhGamer": [
// Immortal Lock
  ]
};




async function wasPickMadeLastWeek(username, currentPick) {
  // Check if the current pick was part of the user's picks last week
  if (lastWeekPicks[username]) {
    return lastWeekPicks[username].some((pick) => {
      // Split the string into components
      const [pickTeamName, pickDetails] = pick.split(' [');
      const [currentTeamName, currentDetails] = currentPick.split(' [');
      // Extract the bet type (Spread or ML) from the details
      const pickType = pickDetails.split(': ')[0];
      const currentType = currentDetails.split(': ')[0];
      // Compare team names and bet types
      return pickTeamName === currentTeamName && pickType === currentType;
    });
  }
  return false;
}

  
  let picksCount = 0;
  let userPicks = [];
  let userImortalLock = [];
  const storedUsername = localStorage.getItem('username');
  console.log(storedUsername);
  
  // If the username exists in localStorage, update the h1 element
  if (storedUsername) {
    document.querySelector('h1').textContent = `Welcome, ${storedUsername}!`;
  }

  //setting this here for test
  //another test
  
  function renderBetOptions() {
    const container = document.getElementById('picksContainer');
  
    // Create an object to group bets by team name
    const betsByTeam = betOptions.reduce((acc, bet) => {
      if (!acc[bet.teamName]) {
        acc[bet.teamName] = {
          Spread: '',
          ML: '',
          logo: teamLogos[bet.teamName],
          colorClass: teamColorClasses[bet.teamName]
        };
      }
      acc[bet.teamName][bet.type] = bet.value;
      return acc;
    }, {});
  
    Object.entries(betsByTeam).forEach(([teamName, bets]) => {
      // Create main bet container
      const betContainer = document.createElement('div');
      betContainer.className = 'bet-container ' + bets.colorClass;
  
      // Create team logo element
      const teamLogo = document.createElement('img');
      teamLogo.src = bets.logo;
      teamLogo.alt = teamName + ' logo';
      teamLogo.className = 'team-logo';
      betContainer.appendChild(teamLogo);
  
      // Create bets options container
      const betOptionsContainer = document.createElement('div');
      betOptionsContainer.className = 'bet-options';
  
      // Add spread and moneyline buttons
      ['Spread', 'ML'].forEach(type => {
        const betButton = document.createElement('button');
        betButton.className = `bet-button ${bets.colorClass}`;
        betButton.textContent = bets[type];
        betButton.dataset.team = teamName.replace(/\s+/g, '-').toLowerCase(); // Data attribute for the team
        betButton.dataset.type = type.toLowerCase(); // Data attribute for the bet type
        betButton.onclick = () => selectBet({ teamName, type, value: bets[type] });
        betOptionsContainer.appendChild(betButton);
      });
      
  
      betContainer.appendChild(betOptionsContainer);
      container.appendChild(betContainer);
    });
  }
  
  function updateBetCell(option, isSelected, isImmortalLock = false) {
    const teamClass = option.teamName.replace(/\s+/g, '-').toLowerCase();
    const typeClass = option.type.toLowerCase();
    const betButtons = document.querySelectorAll(`.bet-button[data-team="${teamClass}"][data-type="${typeClass}"]`);
  
    betButtons.forEach(button => {
      button.classList.toggle('selected', isSelected);
      button.classList.toggle('immortal-lock-selected', isSelected && isImmortalLock);
    });
  }
  
  
  
function selectBet(option) {
  console.log('selectBet called with option:', option);
  const immortalLockCheckbox = document.getElementById('immortalLockCheck');

  // Find if a pick for the same team and type already exists
  let existingPickIndex = userPicks.findIndex(pick => pick.teamName === option.teamName && pick.type === option.type);

  // If the same pick was already selected, remove it (toggle off)
  if (existingPickIndex !== -1) {
      userPicks.splice(existingPickIndex, 1);
      picksCount--;
      updateBetCell(option, false);
      return; // Exit the function after toggling off
  }

  // Check if a different pick for the same team already exists
  let existingTeamPickIndex = userPicks.findIndex(pick => pick.teamName === option.teamName);

  // If a different bet for the same team exists, alert the user
  if (existingTeamPickIndex !== -1) {
      alert("Only one bet per team is allowed.");
      return; // Exit the function without adding the new bet
  }

  const currentPick = `${option.teamName} [${option.type}: ${option.value}]`;
  /*
  // Check if this pick was made last week
  if (wasPickMadeLastWeek(storedUsername, currentPick)) {
    alert('You cannot select the same bet as last week!');
    return;
  }
*/
  // Check if the user has already selected 6 picks and Immortal Lock is not set
  if (picksCount >= 6 && !immortalLockCheckbox.checked) {
      alert('You can only select 6 picks. Set your Immortal Lock or deselect a pick.');
      return; // Exit the function if pick limit is reached
  }

  // If Immortal Lock is checked and we already have 6 picks, the next pick is the Immortal Lock
  if (immortalLockCheckbox.checked && picksCount >= 6) {
      // Replace the existing Immortal Lock with the new selection
      if (userImortalLock.length > 0) {
          alert('Replacing the existing Immortal Lock with the new selection.');
          updateBetCell(userImortalLock[0], false); // Remove highlighting from the old Immortal Lock
      }
      userImortalLock[0] = option; // Set the new Immortal Lock
      updateBetCell(option, true, true); // Highlight the Immortal Lock pick
      return; // Exit the function after setting Immortal Lock
  }

  // Add the new pick if none of the above conditions are met
  userPicks.push(option);
  picksCount++;
  updateBetCell(option, true);
}


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
            console.log('Picks reset successfully on server.');
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
  console.log(thursdayDeadline, tuesdayEndTime);
 
  isDeadline = false;
  
  function submitUserPicks() {

    if (!currentPoolName) {
      alert('Current pool name is not set.');
      return;
  }
    let data; // Declare data at the top of the function
/*
    // Check deadlines first
    if (now >= thursdayDeadline || now >= tuesdayEndTime) {
        alert('Deadline has passed, can no longer submit picks!');
        return; // Exit the function
    }
*/
    // Continue if the deadline has not passed
    if (userPicks.length === 0) {
        alert('Please add at least one pick before submitting.');
        return; // Exit the function
    }

    // Convert each pick object into a string representation
    const picksAsString = userPicks.map(pick => `${pick.teamName} [${pick.type}: ${pick.value}]`);
    const userImmortalLockAsString = userImortalLock.map(pick => `${pick.teamName} [${pick.type}: ${pick.value}]`);

    // Create the data object with picks
    data = {
        picks: picksAsString,
        immortalLock: userImmortalLockAsString,
        poolName: currentPoolName
    };

    // Proceed with the fetch call
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
  
  // Initialization
  renderBetOptions();


  
/*
// This function fetches the current user's picks and displays them
async function fetchAndDisplayUserPicks() {
  try {
    const response = await fetch(`/api/getPicks/${storedUsername}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    displayPicks(data.picks);
    // Assuming data.immortalLock is an object with teamName and value properties
    displayImmortalLock(data.immortalLock);
  } catch (error) {
    console.error('Error fetching user picks:', error);
  }
}
*/
/*
// Function to display picks with only the logo and the line
function displayPicks(picks) {
  const picksContainer = document.getElementById('userPicksContainer');
  picksContainer.innerHTML = ''; // Clear previous content

  picks.forEach(pick => {
    const pickDiv = document.createElement('div');
    pickDiv.classList.add('pick');

    // Assuming pick is a string like "NY Giants [ML: +700]"
    const teamNameMatch = pick.match(/^(.*?)\s\[/);
    const teamName = teamNameMatch ? teamNameMatch[1] : null;
    const valueMatch = pick.match(/\[.*?([-+]\d+(?:\.\d+)?)\]/);
    const value = valueMatch ? valueMatch[1] : null;

    if (teamName && teamLogos[teamName]) {
      const logoImg = document.createElement('img');
      logoImg.src = teamLogos[teamName];
      logoImg.alt = `${teamName} logo`;
      logoImg.classList.add('team-logo');
      pickDiv.appendChild(logoImg);
    }

    if (value) {
      const valueSpan = document.createElement('span');
      valueSpan.textContent = value;
      pickDiv.appendChild(valueSpan);
    }

    picksContainer.appendChild(pickDiv);
  });
}

function displayImmortalLock(immortalLockArray) {
  const userImmortalLockContainer = document.getElementById('userImmortalLockContainer');
  userImmortalLockContainer.innerHTML = ''; // Clear previous content

  if (Array.isArray(immortalLockArray) && immortalLockArray.length > 0) {
    // Extract the team name and value from the string
    const immortalLockString = immortalLockArray[0];
    const [fullMatch, teamName, type, value] = immortalLockString.match(/^(.*?)\s\[(.*?):\s([-+]\d+(?:\.\d+)?)\]$/) || [];

    if (teamName && teamLogos[teamName]) {
      const lockDiv = document.createElement('div');
      lockDiv.classList.add('immortal-lock');
        // Create and append the line span with the value
        const line = document.createElement('string');
        line.textContent = `Immortal Lock: `;
        lockDiv.appendChild(line);
  

      // Create and append the team logo image
      const logoImg = document.createElement('img');
      logoImg.src = teamLogos[teamName];
      logoImg.alt = `${teamName} logo`;
      logoImg.classList.add('team-logo');
      lockDiv.appendChild(logoImg);

      // Create and append the line span with the value
      const lineSpan = document.createElement('span');
      lineSpan.textContent = `${value}`;
      lockDiv.appendChild(lineSpan);

      // Append the lock div to the container
      userImmortalLockContainer.appendChild(lockDiv);
    }
  } else {
    userImmortalLockContainer.textContent = 'Immortal Lock: Not Set';
  }
}

// Call this function when the page loads and after picks are submitted
fetchAndDisplayUserPicks();




// Call this function when the page loads and after picks are submitted
fetchAndDisplayUserPicks();

function updatePicksDisplay() {
  // Function to update the user picks display
  const userPicksContainer = document.getElementById('userPicksContainer');
  userPicksContainer.innerHTML = ''; // Clear previous picks

  userPicks.forEach(pick => {
    const pickDiv = document.createElement('div');
    pickDiv.classList.add('pick');

    // Assuming each pick object has properties like { teamName: "Team", type: "Spread", value: "+3.5" }
    if (teamLogos[pick.teamName]) {
      const logoImg = document.createElement('img');
      logoImg.src = teamLogos[pick.teamName];
      logoImg.alt = `${pick.teamName} logo`;
      logoImg.classList.add('team-logo');
      pickDiv.appendChild(logoImg);
    }

    const lineSpan = document.createElement('span');
    lineSpan.textContent = pick.value; // Only the line is displayed, not the team name or type
    pickDiv.appendChild(lineSpan);

    userPicksContainer.appendChild(pickDiv);
  });

  // Update the immortal lock display in a similar way
  const userImmortalLockContainer = document.getElementById('userImmortalLockContainer');
  userImmortalLockContainer.innerHTML = ''; // Clear previous immortal lock

  if (userImortalLock.length > 0) {
    const lockDiv = document.createElement('div');
    lockDiv.classList.add('pick', 'immortal-lock');

    const line = document.createElement('string');
    line.textContent = `Immortal Lock: `;
    lockDiv.appendChild(line);

    if (teamLogos[userImortalLock[0].teamName]) {
      const logoImg = document.createElement('img');
      logoImg.src = teamLogos[userImortalLock[0].teamName];
      logoImg.alt = `${userImortalLock[0].teamName} logo`;
      logoImg.classList.add('team-logo');
      lockDiv.appendChild(logoImg);
    }

    const lineSpan = document.createElement('span');
    lineSpan.textContent = `${userImortalLock[0].value}`;
    lockDiv.appendChild(lineSpan);

    userImmortalLockContainer.appendChild(lockDiv);
  }
}

updatePicksDisplay();
*/