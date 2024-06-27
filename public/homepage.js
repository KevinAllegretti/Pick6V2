document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      fetch('/api/getResults')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Received results:", data);
        if (data.success && data.results) {
          rebuildUIWithResults(data.results);
        } else {
          console.error('No results found or unable to fetch results:', data.message);
        }
      })
      .catch(error => console.error('Failed to fetch results:', error));
    }, 3000);  // Delay can be adjusted based on typical load times or removed if found unnecessary
  });
  
  function rebuildUIWithResults(results) {
    console.log('Received results for UI rebuild:', results);
    const allPicks = document.querySelectorAll('.player-picks .pick, .immortal-lock');
  
    if (allPicks.length === 0) {
      console.warn('No pick elements found, check if the DOM has fully loaded');
      return;
    }
  
    console.log(`Total picks found: ${allPicks.length}`);
  
    allPicks.forEach(pickElement => {
      const teamLogo = pickElement.querySelector('.team-logo');
      if (!teamLogo) {
        console.error('Team logo not found in pick element', pickElement);
        return; // Skip this iteration if no logo
      }
  
      const teamName = teamLogo.alt;
      console.log(`Processing UI update for team: ${teamName}`);
  
      const resultEntry = results.find(r => r.teamName === teamName);
      if (resultEntry) {
        console.log(`Applying UI result for ${teamName}:`, resultEntry);
        pickElement.style.color = resultEntry.result === "hit" ? "#39FF14" : resultEntry.result === "miss" ? "red" : "yellow";
      } else {
        console.warn(`No result found for ${teamName} or mismatch in team names`, {teamName, results});
      }
    });
}


function getCurrentTimeInUTC4() {
    const now = new Date();
    const nowUtc4 = new Date(now);
    nowUtc4.setMinutes(nowUtc4.getMinutes() + nowUtc4.getTimezoneOffset()); // Convert to UTC
    nowUtc4.setHours(nowUtc4.getHours() - 4); // Convert UTC to EDT (UTC-4)
    return nowUtc4;
}

const now = new Date();
console.log(now + "now");
console.log(getCurrentTimeInUTC4() + "now2");
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

/*
// Adjust if current time is past this week's Tuesday 12 AM
if (now > tuesdayStartTime) {
    tuesdayStartTime.setDate(tuesdayStartTime.getDate() + 7); // Move to next Tuesday
}
*/
// Adjust if current time is past this week's Thursday 7 PM
if (now > thursdayDeadline) {
    thursdayDeadline.setDate(thursdayDeadline.getDate() + 7); // Move to next Thursday
}


// Save the calculated times to the database
async function saveInitialTimes() {
    try {
        await fetch('/api/timeWindows', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tuesdayStartTime: tuesdayStartTime.toISOString(),
                thursdayDeadline: thursdayDeadline.toISOString(),
            }),
        });
        console.log('Initial times saved successfully.');
    } catch (error) {
        console.error('Error saving initial times:', error);
    }
}

//saveInitialTimes();

/*(function appendLog(message) {
    const logList = document.getElementById('poll-log-list');
    const logEntry = document.createElement('li');
    logEntry.textContent = `${new Date().toLocaleString()}: ${message}`;
    logList.appendChild(logEntry);
}
*/

// Scheduling function for the Monday night poll (for testing)
function scheduleTestPoll() {
    const now = new Date();
    const nextMondayNight = new Date(now);
    nextMondayNight.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7)); // Set to next Monday
    nextMondayNight.setHours(23, 30, 0, 0); // 11:30 PM

    const timeUntilPoll = nextMondayNight - now;
    //appendLog(`Time until next Monday night poll: ${timeUntilPoll}ms`);
    
    setTimeout(() => {
      //  appendLog("It's Monday Bet Poll time, now fetching scores");
        fetchMLBScores();
        scheduleTestPoll(); // Reschedule for the next week
    }, timeUntilPoll);

   // appendLog(`Scheduled test poll for: ${nextMondayNight.toLocaleString()}`);
}

// Call the test poll scheduler
scheduleTestPoll();

/*
// Function to immediately test poll execution
function scheduleImmediateTestPoll() {
    setTimeout(() => {
        appendLog("Immediate test poll: Fetching scores");
        fetchMLBScores();
    }, 5000); // 5 seconds for immediate test
}

// Call the immediate test poll scheduler
scheduleImmediateTestPoll();
*/

function calculateEverydayPollTime() {
    const now = getCurrentTimeInUTC4();
    let everydayPollTime = new Date(now);
    everydayPollTime.setHours(10, 0, 0, 0); // 10 AM

    // If the calculated poll time is in the past, set it to the next day
    if (now > everydayPollTime) {
        everydayPollTime.setDate(everydayPollTime.getDate() + 1);
    }

    return everydayPollTime;
}

// Initialize everyday poll time
const everydayPollTime = calculateEverydayPollTime();
console.log("Everyday Poll Time:", everydayPollTime);

function scheduleEverydayPoll() {
    const now = getCurrentTimeInUTC4();
    const everydayPollTime = calculateEverydayPollTime();

    const timeUntilEverydayPoll = everydayPollTime - now;
    setTimeout(() => {
        console.log('It is Everyday Poll time. Fetching Injuries.');
        scheduleEverydayPoll(); // Reschedule after execution
    }, timeUntilEverydayPoll);
}

// Schedule the everyday poll function
scheduleEverydayPoll();
/*
async function updateTuesdayStartTime() {
    const now = getCurrentTimeInUTC4();
    const nextTuesday = new Date(now);
    nextTuesday.setDate(nextTuesday.getDate() + ((2 + 7 - now.getDay()) % 7));
    nextTuesday.setHours(0, 0, 0, 0); // 12 AM EST
    nextTuesday.setMinutes(nextTuesday.getMinutes() + nextTuesday.getTimezoneOffset());
    nextTuesday.setHours(nextTuesday.getHours() - 4); // Convert UTC to EST (UTC-5)

    // Ensure it's the next Tuesday
    if (now > nextTuesday) {
        nextTuesday.setDate(nextTuesday.getDate() + 7); // Move to next Tuesday
    }

    try {
        await fetch('/api/timeWindows/tuesday', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tuesdayStartTime: nextTuesday.toISOString(),
            }),
        });
        console.log('Tuesday start time updated successfully.');
    } catch (error) {
        console.error('Error updating Tuesday start time:', error);
    }
}
//setInterval(attachFunctionsToTimes, 1000 * 60); // Check every minute
//attachFunctionsToTimes();

async function updateThursdayDeadline() {
    const now = getCurrentTimeInUTC4();
    const nextThursday = new Date(now);
    nextThursday.setDate(nextThursday.getDate() + ((4 + 7 - now.getDay()) % 7));
    nextThursday.setHours(19, 0, 0, 0); // 7 PM EST
    nextThursday.setMinutes(nextThursday.getMinutes() + nextThursday.getTimezoneOffset());
    nextThursday.setHours(nextThursday.getHours() - 4); // Convert UTC to EST (UTC-5)

    // Ensure it's the next Thursday
    if (now > nextThursday) {
        nextThursday.setDate(nextThursday.getDate() + 7); // Move to next Thursday
    }

    try {
        await fetch('/api/timeWindows/thursday', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                thursdayDeadline: nextThursday.toISOString(),
            }),
        });
        console.log('Thursday deadline updated successfully.');
    } catch (error) {
        console.error('Error updating Thursday deadline:', error);
    }
}
*/
/* In the updates, alos put in the ones that are one timers.
then put the ones that need to stay constant within the respective enable feature function
*/
/*

function scheduleAllTasks() {
    // Fetch the stored times from the database
    fetch('/api/timeWindows')
        .then(response => response.json())
        .then(times => {
            const { tuesdayStartTime, thursdayDeadline } = times;

            const tuesdayTime = new Date(tuesdayStartTime);
            const thursdayTime = new Date(thursdayDeadline);

            console.log("Tuesday Start Time:", tuesdayStartTime);
            console.log("Thursday Deadline Time:", thursdayDeadline);
          //  appendLog("Fetched stored times from the database.");

            const now = getCurrentTimeInUTC4();

            const scheduleTask = (time, taskFunction) => {
                const timeUntilTask = time - now;
                const updatedTimeUntilTask = timeUntilTask <= 0 ? (time.setDate(time.getDate() + 7) - now) : timeUntilTask;

                setTimeout(() => {
                    taskFunction();
                    scheduleTask(new Date(time), taskFunction); // Reschedule for the next week
                }, updatedTimeUntilTask);
            };

            scheduleTask(tuesdayTime, () => {
                console.log("Executing Tuesday update tasks");
               // appendLog("Executing Tuesday update tasks");
                deleteResultsFromServer();
                updateThursdayDeadline();
            });

            scheduleTask(thursdayTime, () => {
                console.log("Executing Thursday update tasks");
               // appendLog("Executing Thursday update tasks");
                //savePicksToLastWeek();
                updateTuesdayStartTime();
            });


        })
        .catch(error => {
            console.error('Error fetching time windows:', error);
           // appendLog(`Error fetching time windows: ${error.message}`);
        });
}

// Call this function to start the scheduling process
scheduleAllTasks();
*/
async function fetchTimeWindows() {
    try {
        const response = await fetch('/api/timeWindows');
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
        const response = await fetch('/api/timeWindows');
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




// Function to enable pick time features

function enableGameTimeFeatures() {
    const choosePicksButton = document.querySelector('.choose-picks-button');
    if (choosePicksButton) {
        choosePicksButton.classList.add('disabled'); // Add visual indicator
        choosePicksButton.textContent = 'Selections Unavailable';
    } else {
        console.error('choosePicksButton not found');
    }
}

function enablePickTimeFeatures() {
    const choosePicksButton = document.querySelector('.choose-picks-button');
    if (choosePicksButton) {
        choosePicksButton.classList.remove('disabled');
        choosePicksButton.textContent = 'Make Picks';

    } else {
        console.error('choosePicksButton not found');
    }
}



function showGameTimeAlert(event) {
    event.preventDefault(); // Prevent default action
    alert("It's Game Time! Pick selection page not available.");
}



//START OF HOMEPAGE
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    if (username) {
        localStorage.setItem('username', username);
    }

    const loggedInUsername = localStorage.getItem('username');
    console.log("Logged in user:", loggedInUsername);

    const profileIcon = document.getElementById('profileIconTemplate');
    const slideOutPanel = document.getElementById('slideOutPanel');
    const closePanelBtn = document.getElementById('closePanelBtn');

    if (profileIcon) {
        profileIcon.addEventListener('click', () => {
            console.log('Profile icon clicked');
            slideOutPanel.classList.add('visible');
        });
    }

    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', () => {
            slideOutPanel.classList.remove('visible');
        });
    }

    document.addEventListener('click', (event) => {
        const withinBoundaries = event.composedPath().includes(slideOutPanel);
        const clickedOnProfileIcon = event.composedPath().includes(profileIcon);

        if (!withinBoundaries && !clickedOnProfileIcon && slideOutPanel.classList.contains('visible')) {
            slideOutPanel.classList.remove('visible');
        }
    });

    document.getElementById('logout-button').addEventListener('click', function() {
        localStorage.removeItem('username');
        window.location.href = '/login.html';
    });

    window.addEventListener('load', async () => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            document.getElementById('displayName').textContent = storedUsername;
        }

        const username = storedUsername.toLowerCase();
        try {
            const response = await fetch(`/api/getUserProfile/${username}`);
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            const userData = await response.json();
            const profilePicSrc = userData.profilePicture || 'Default.png';
            document.querySelector('.profile-icon').src = profilePicSrc;
            document.querySelector('.profile-icon-center').src = profilePicSrc;

            const poolResponse = await fetch(`/pools/userPoolInfo/${username}`);
            if (!poolResponse.ok) {
                throw new Error('Network response was not ok.');
            }
            const poolData = await poolResponse.json();
            console.log('Fetched pool data:', poolData);

            const userPoolElement = document.getElementById('userPool');
            if (userPoolElement) {
                userPoolElement.innerHTML = poolData.map(pool => `
                    <div>
                        <strong>Pool:</strong> ${pool.poolName}<br>
                        <strong>Rank:</strong> ${pool.rank}<br>
                        <strong>Points:</strong> ${pool.points}
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error fetching user data or pool data:', error);
            document.querySelector('.profile-icon').src = 'Default.png';
            document.querySelector('.profile-icon-center').src = 'Default.png';
        }
    });

    document.getElementById('profilePic').addEventListener('change', async (event) => {
        const fileInput = event.target;
        const file = fileInput.files[0];

        if (file) {
            const formData = new FormData();
            formData.append('profilePic', file);
            formData.append('username', localStorage.getItem('username').toLowerCase());

            try {
                const response = await fetch('/api/uploadProfilePicture', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }

                const result = await response.json();
                document.querySelector('.profile-icon').src = result.filePath;
                document.querySelector('.profile-icon-center').src = result.filePath;

            } catch (error) {
                console.error('Upload error:', error);
            }
        }
    });

    const profileIconTemplate = document.getElementById('profileIconTemplate');
    const slideOutPanelTemplate = document.getElementById('slideOutPanel');
    const closePanelBtnTemplate = document.getElementById('closePanelBtn');
    const saveBioButton = document.getElementById('saveBioButton');

    if (profileIconTemplate) {
        profileIconTemplate.addEventListener('click', async () => {
            slideOutPanelTemplate.classList.add('visible'); // Show the template slide-out panel
            await loadUserProfile(); // Load the user's profile when the panel is opened
            await loadUserBio(); // Load the user's bio when the panel is opened
        });
    }

    if (closePanelBtnTemplate) {
        closePanelBtnTemplate.addEventListener('click', () => {
            slideOutPanelTemplate.classList.remove('visible'); // Hide the template slide-out panel
        });
    }

    if (saveBioButton) {
        saveBioButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent form submission
            const bio = document.getElementById('userBio').value;
            await saveUserBio(bio);
        });
    }

    async function loadUserProfile() {
        const username = localStorage.getItem('username').toLowerCase();
        const response = await fetch(`/api/getUserProfile/${username}`);
        const userData = await response.json();
        document.querySelector('.profile-icon-center').src = userData.profilePicture || 'Default.png';
        document.getElementById('displayName').textContent = userData.username;
    }

    async function loadUserBio() {
        const username = localStorage.getItem('username').toLowerCase();
        const response = await fetch(`/api/getUserBio/${username}`);
        const userData = await response.json();
        document.getElementById('userBio').value = userData.bio || '';
    }

    async function saveUserBio(bio) {
        const username = localStorage.getItem('username').toLowerCase();
        const response = await fetch(`/api/saveUserBio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, bio }),
        });
        if (response.ok) {
            alert('Bio saved successfully!');
        } else {
            alert('Failed to save bio');
        }
    }

    async function showInPoolUserProfile(username) {
        const url = `/api/getUserProfile/${username.toLowerCase()}`;
        try {
            const response = await fetch(url);
            const userData = await response.json();
            const poolInfoResponse = await fetch(`/pools/userPools/${username.toLowerCase()}`);
            const poolInfo = await poolInfoResponse.json();

            let win = 0;
            let loss = 0;
            let push = 0;
            if (poolInfo.length > 0) {
                const userPool = poolInfo.find(pool => pool.name === localStorage.getItem('currentPoolName'));
                if (userPool) {
                    const userMember = userPool.members.find(member => member.username.toLowerCase() === username.toLowerCase());
                    if (userMember) {
                        win = userMember.win;
                        loss = userMember.loss;
                        push = userMember.push;
                    }
                }
            }
            userData.win = win;
            userData.loss = loss;
            userData.push = push;

            const bioResponse = await fetch(`/api/getUserBio/${username.toLowerCase()}`);
            const bioData = await bioResponse.json();
            userData.bio = bioData.bio;

            updateSlideOutPanelInPool(userData);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }

    function updateSlideOutPanelInPool(userData) {
        let panelContent = document.getElementById('slideOutPanelInPool');
        if (!panelContent) {
            const template = document.getElementById('in-pool-profile-template').content.cloneNode(true);
            document.body.appendChild(template);
            panelContent = document.getElementById('slideOutPanelInPool');
        }
        document.querySelector('#slideOutPanelInPool .profile-icon-center').src = userData.profilePicture || 'Default.png';
        document.getElementById('displayNameInPool').textContent = userData.username;
        document.getElementById('userBioInPool').textContent = userData.bio || 'No bio available';
        const userRecordContainer = document.getElementById('userRecordInPool');
        userRecordContainer.innerHTML = `
            <div>Win: ${userData.win} | Loss: ${userData.loss} | Push: ${userData.push}</div>
        `;
        panelContent.classList.add('visible');
        document.getElementById('closePanelBtnInPool').addEventListener('click', () => {
            panelContent.classList.remove('visible');
        });
    }

    document.addEventListener('click', function(event) {
        if (event.target.closest('.player-username')) {
            const username = event.target.closest('.player-username').textContent.trim();
            showInPoolUserProfile(username);
        }
    });

    window.addEventListener('load', async () => {
        const username = localStorage.getItem('username').toLowerCase();
        try {
            const response = await fetch(`/api/getUserProfile/${username}`);
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            const userData = await response.json();
            const profilePicSrc = userData.profilePicture || 'Default.png';
            document.querySelector('.profile-icon').src = profilePicSrc;
            document.querySelector('.profile-icon-center').src = profilePicSrc;
        } catch (error) {
            console.error('Error fetching user data:', error);
            document.querySelector('.profile-icon').src = 'Default.png';
            document.querySelector('.profile-icon-center').src = 'Default.png';
        }
    });

    document.getElementById('profilePic').addEventListener('change', async (event) => {
        const fileInput = event.target;
        const file = fileInput.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('profilePic', file);
            formData.append('username', localStorage.getItem('username').toLowerCase());
            try {
                const response = await fetch('/api/uploadProfilePicture', {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }
                const result = await response.json();
                document.querySelector('.profile-icon').src = result.filePath;
                document.querySelector('.profile-icon-center').src = result.filePath;
            } catch (error) {
                console.error('Upload error:', error);
            }
        }
    });

    // Close slide-out panels when clicking outside
    document.addEventListener('click', function(event) {
        const templatePanel = document.getElementById('slideOutPanel');
        const inPoolPanel = document.getElementById('slideOutPanelInPool');
        if (templatePanel && !templatePanel.contains(event.target) && !profileIconTemplate.contains(event.target)) {
            templatePanel.classList.remove('visible');
        }
        if (inPoolPanel && !inPoolPanel.contains(event.target) && !event.target.closest('.player-username')) {
            inPoolPanel.classList.remove('visible');
        }
    });
    
    
});
    


//START OF POOLS AND PLAYERROWS

document.getElementById('show-create-pool-form').addEventListener('click', function() {
    // This line toggles the form's visibility.
    var formContainer = document.getElementById('create-pool-form-container');
    formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
    
    // These lines change the button text depending on the form's visibility.
    if (formContainer.style.display === 'block') {
        this.textContent = 'Go Back';
    } else {
        this.textContent = 'Create Pool';
    }
});


document.getElementById('is-private').addEventListener('change', function() {
    const passwordInput = document.getElementById('pool-password');
    const passwordLabel = document.querySelector('label[for="pool-password"]');
    const displayStyle = this.checked ? 'block' : 'none';

    passwordInput.style.display = displayStyle;
    passwordLabel.style.display = displayStyle;
});

document.getElementById('create-pool-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const poolName = document.getElementById('pool-name').value.trim();
    const isPrivate = document.getElementById('is-private').checked;
    const poolPassword = document.getElementById('pool-password').value;
    let username = localStorage.getItem('username'); // Retrieve username from local storage

    if (!username) {
        alert('Username not found. Please log in again.');
        return;
    }

    username = username.toLowerCase(); // Ensure username is in lowercase

    const payload = {
      name: poolName,
      isPrivate: isPrivate,
      adminUsername: username.toLowerCase(),
      ...(isPrivate && { password: poolPassword })
    };
    
    fetch('/pools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 409){
                alert('The pool name is already taken. Please choose another name.')
            } else {
            throw new Error(`HTTP error! Status: ${response.status}`);}
        }
        return response.json();
    })
    .then(data => {
        if (data.message && data.pool) {
            document.getElementById('create-pool-form-container').style.display = 'none';
            displayNewPoolContainer(data.pool);
            document.getElementById('pool-name').value = '';
            document.getElementById('is-private').checked = false;
            document.getElementById('pool-password').value = '';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while creating the pool.');
    });
});

function sortPlayersByPoints(players) {
    // Sort players in descending order of points
    return players.sort((a, b) => b.points - a.points);
  }
  
  function fetchUserProfile(username) {
    const encodedUsername = encodeURIComponent(username);
    return fetch(`/api/getUserProfile/${encodedUsername}`)
        .then(response => response.json())
        .then(userProfile => {
            if (!userProfile) {
                throw new Error(`User profile for ${username} not found`);
            }
            return userProfile;
        });
}

function displayNewPoolContainer(pool) {
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

    let currentUsername = localStorage.getItem('username'); // Retrieve username from local storage

    if (currentUsername) {
        currentUsername = currentUsername.toLowerCase(); // Convert to lower case

        const isAdmin = currentUsername === pool.adminUsername.toLowerCase();

        const poolContainerWrapper = document.getElementById('pool-container-wrapper');
        const poolWrapper = document.createElement('div');
        poolWrapper.className = 'pool-wrapper';
        poolWrapper.setAttribute('data-pool-name', pool.name);

        const poolNameDiv = document.createElement('div');
        poolNameDiv.className = 'pool-name';
        poolNameDiv.innerText = pool.name;


        const poolScrollableContainer = document.createElement('div');
        poolScrollableContainer.className = 'pool-scrollable-container';

        const poolContainer = document.createElement('div');
        poolContainer.className = 'pool-container';

        const poolHeader = document.createElement('div');
        poolHeader.className = 'pool-header';
        poolHeader.innerHTML = `
            <span class="header-rank"></span>
            <span class="header-user">User</span>
            <span class="header-points">Points</span>
            <span class="header-picks">
                <button id="choosePicksButton" class="choose-picks-button">Make Picks</button>
            </span>
            <span class="header-immortal-lock"> <i class="fas fa-lock"></i></span>
            <span class="header-win">Win</span>
            <span class="header-loss">Loss</span>
            <span class="header-push">Push</span>
        `;
        poolContainer.appendChild(poolHeader);

        pool.members.sort((a, b) => b.points - a.points || a.username.localeCompare(b.username));

        const memberDataPromises = pool.members.map(member => fetchUserProfile(member.username).then(userProfile => ({
            rank: pool.members.indexOf(member) + 1,
            username: userProfile.username,
            profilePic: userProfile.profilePicture,
            points: member.points,
            wins: member.win,
            losses: member.loss,
            pushes: member.push
        })));

        Promise.all(memberDataPromises).then(membersData => {
            membersData.forEach(memberData => {
                const playerRow = createPlayerRow(memberData, memberData.username === pool.adminUsername, pool.members.length);
                fetchPicks(memberData.username, pool.name, playerRow, teamLogos);
                poolContainer.appendChild(playerRow);
            });

            const poolAndDeleteContainer = document.createElement('div');
            poolAndDeleteContainer.className = 'pool-and-delete-container';

            poolScrollableContainer.appendChild(poolContainer);
            poolWrapper.appendChild(poolNameDiv);
            poolWrapper.appendChild(poolScrollableContainer);

       
            // Append chat container from template
            const chatTemplate = document.getElementById('chat-template').content.cloneNode(true);
            poolWrapper.appendChild(chatTemplate);

            poolAndDeleteContainer.appendChild(poolWrapper);

            if (isAdmin) {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete Pool';
                deleteButton.className = 'delete-pool-button';
                deleteButton.setAttribute('data-pool-name', pool.name);
                deleteButton.addEventListener('click', function () {
                    const confirmation = confirm(`Are you sure you want to delete the pool "${this.getAttribute('data-pool-name')}"?`);
                    if (confirmation) {
                        deletePool(this.getAttribute('data-pool-name'));
                        this.remove();
                    } else {
                        console.log('Pool deletion cancelled by the user.');
                    }
                });
                poolAndDeleteContainer.appendChild(deleteButton);
            } else {
                const leaveButton = document.createElement('button');
                leaveButton.textContent = 'Leave Pool';
                leaveButton.className = 'leave-pool-button';
                leaveButton.setAttribute('data-pool-name', pool.name);
                leaveButton.addEventListener('click', function () {
                    const confirmation = confirm(`Are you sure you want to leave the pool "${this.getAttribute('data-pool-name')}"?`);
                    if (confirmation) {
                        leavePool(this.getAttribute('data-pool-name'));
                        this.remove();
                    } else {
                        console.log('Leaving pool cancelled by the user.');
                    }
                });
                poolAndDeleteContainer.appendChild(leaveButton);
            }

            poolContainerWrapper.appendChild(poolAndDeleteContainer);

            const choosePicksButton = poolContainer.querySelector('.choose-picks-button');
            choosePicksButton.addEventListener('click', (event) => {
                if (choosePicksButton.classList.contains('disabled')) {
                    event.preventDefault();
                    showGameTimeAlert(event);
                } else {
                    redirectToDashboard(pool.name); // Call the redirect function
                }
            });

            // Delay to ensure elements are rendered
            setTimeout(() => {
                checkCurrentTimeWindow(); // Check time window after the header is added
            }, 50); // Adjust the delay as needed
        }).catch(error => {
            console.error('Error fetching member data:', error);
        });
    } else {
        console.log("No username found in localStorage");
    }
}
let chatMode = 'local';  // Default chat mode

function setChatMode(button) {
    const mode = button.getAttribute('data-mode');
    chatMode = mode;
    const chatWrapper = button.closest('.chat-wrapper');
    const poolName = chatWrapper.closest('.pool-wrapper') ? chatWrapper.closest('.pool-wrapper').getAttribute('data-pool-name') : null;
    const chatBox = chatWrapper.querySelector('.chat-box');
    fetchMessages(poolName, chatBox);
}

// Update fetchMessages function
function fetchMessages(poolName, chatBox) {
    const queryParam = chatMode === 'global' ? '' : `?poolName=${encodeURIComponent(poolName)}`;
    fetch(`/pools/getChatMessages${queryParam}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderMessages(data.messages, chatBox);
            }
        })
        .catch(error => console.error('Error fetching chat messages:', error));
}

// Update sendMessage function
function sendMessage(username, poolName, message, chatBox) {
    const pool = chatMode === 'global' ? null : poolName;
    fetch('/pools/sendChatMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, poolName: pool, message })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            fetchMessages(poolName, chatBox);
        }
    })
    .catch(error => console.error('Error sending chat message:', error));
}

function renderMessages(messages, chatBox) {
    chatBox.innerHTML = ''; // Clear the chat box before rendering new messages
    messages.forEach(msg => {
        const prefix = msg.poolName ? '[L]' : '[G]';
        const messageElement = document.createElement('div');
        messageElement.textContent = `${prefix} ${msg.username}: ${msg.message}`;
        chatBox.appendChild(messageElement);
    });
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom of the chat box
}

// Ensure the mode is set and messages are fetched accordingly when the chat is toggled
function toggleChat(chatTab) {
    const chatWrapper = chatTab.parentElement;
    chatWrapper.classList.toggle('show-chat');
    document.querySelectorAll('.pool-wrapper').forEach(poolWrapper => {
        const poolName = poolWrapper.getAttribute('data-pool-name');
        const chatBox = poolWrapper.querySelector('.chat-box');
        fetchMessages(poolName, chatBox);
    });
}

// Adjust event listener to fetch messages according to the current mode
document.addEventListener('DOMContentLoaded', () => {
    // Event listener for chat buttons
    document.addEventListener('click', function(event) {
        if (event.target.matches('.send-chat-button')) {
            const chatWrapper = event.target.closest('.chat-wrapper');
            const poolName = chatWrapper.closest('.pool-wrapper') ? chatWrapper.closest('.pool-wrapper').getAttribute('data-pool-name') : null;
            const chatBox = chatWrapper.querySelector('.chat-box');
            const chatInput = chatWrapper.querySelector('.chat-input');
            const message = chatInput.value.trim();
            const storedUsername = localStorage.getItem('username');

            if (message) {
                sendMessage(storedUsername, poolName, message, chatBox);
                chatInput.value = '';
            }
        }
    });

    // Initial fetch of messages for all pools
    document.querySelectorAll('.pool-wrapper').forEach(poolWrapper => {
        const poolName = poolWrapper.getAttribute('data-pool-name');
        const chatBox = poolWrapper.querySelector('.chat-box');
        fetchMessages(poolName, chatBox);
    });
});


function leavePool(poolName) {
    const currentUsername = localStorage.getItem('username');

    if (!currentUsername) {
        console.error('No logged-in user found!');
        return;
    }

    const encodedUsername = encodeURIComponent(currentUsername).toLowerCase();
    const encodedPoolName = encodeURIComponent(poolName);

    fetch(`/pools/leave/${encodedUsername}/${encodedPoolName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Successfully left the pool:', data);
            // Remove the pool from the UI
            const poolWrapper = document.querySelector(`.pool-wrapper[data-pool-name="${poolName}"]`);
            if (poolWrapper) {
                poolWrapper.remove();
            }
        })
        .catch(error => {
            console.error('Error leaving the pool:', error);
        });
}

async function isCurrentTimePickTime() {
    try {
        const response = await fetch('/api/timeWindows');
        if (!response.ok) {
            throw new Error('Failed to fetch time windows.');
        }

        const { tuesdayStartTime, thursdayDeadline } = await response.json();
        const now = getCurrentTimeInUTC4();

        const tuesdayTime = new Date(tuesdayStartTime);
        const thursdayTime = new Date(thursdayDeadline);

        return now > tuesdayTime && now < thursdayTime;
    } catch (error) {
        console.error('Error determining the current time window:', error);
        return false; // Default to game time if there's an error
    }
}
async function fetchPicks(username, poolName, playerRow, teamLogos) {
    const isPickTime = await isCurrentTimePickTime(); // Determine if it's pick time

    const encodedUsername = encodeURIComponent(username);
    const encodedPoolName = encodeURIComponent(poolName);
    const url = `/api/getPicks/${encodedUsername}/${encodedPoolName}`;

    console.log(`Fetching picks for username: ${username}, poolName: ${poolName}, URL: ${url}, isPickTime: ${isPickTime}`);

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(picksData => {
            const picksContainer = playerRow.querySelector('.player-picks');
            picksContainer.innerHTML = '';

            if (username === localStorage.getItem('username').toLowerCase() || !isPickTime) {
                // Existing logic to fetch and display picks
                if (picksData && picksData.picks && Array.isArray(picksData.picks) && picksData.picks.length > 0) {
                    console.log('Rendering picks for user:', username);

                    picksData.picks.forEach(pick => {
                        const pickDiv = document.createElement('div');
                        pickDiv.className = 'pick';

                        const teamName = pick.teamName;
                        const value = pick.value;

                        if (teamName && teamLogos[teamName]) {
                            const logoImg = document.createElement('img');
                            logoImg.src = teamLogos[teamName];
                            logoImg.alt = `${teamName}`;
                            logoImg.className = 'team-logo';
                            pickDiv.appendChild(logoImg);
                        }

                        if (value) {
                            const valueSpan = document.createElement('span');
                            valueSpan.textContent = value;
                            pickDiv.appendChild(valueSpan);
                        }

                        picksContainer.appendChild(pickDiv);
                    });
                } else {
                    const noPicksMessage = document.createElement('div');
                    noPicksMessage.className = 'no-picks-message';
                    noPicksMessage.textContent = 'No picks made';
                    picksContainer.appendChild(noPicksMessage);
                }

                const immortalLockContainer = playerRow.querySelector('.player-immortal-lock');
                if (picksData.immortalLock && picksData.immortalLock.length > 0) {
                    const immortalPick = picksData.immortalLock[0];
                    const lockDiv = document.createElement('div');
                    lockDiv.className = 'immortal-lock';

                    const teamName = immortalPick.teamName;
                    const value = immortalPick.value;

                    if (teamName && teamLogos[teamName]) {
                        const logoImg = document.createElement('img');
                        logoImg.src = teamLogos[teamName];
                        logoImg.alt = `${teamName}`;
                        logoImg.className = 'team-logo';
                        lockDiv.appendChild(logoImg);
                    }

                    if (value) {
                        const valueSpan = document.createElement('span');
                        valueSpan.textContent = value;
                        lockDiv.appendChild(valueSpan);
                    }

                    immortalLockContainer.appendChild(lockDiv);
                } else {
                    immortalLockContainer.textContent = '';
                }
            } else {
                console.log(`Displaying pick time banner for user: ${username}`);

                const bannerImage = document.createElement('img');
                bannerImage.src = '/PickTime.png'; // Ensure the path is correct
                bannerImage.alt = 'Player Making Selections';
                bannerImage.className = 'pick-banner';

                console.log('Banner image path:', bannerImage.src); // Log the banner image path

                picksContainer.appendChild(bannerImage);
            }
        })
        .catch(error => {
            console.error('Error fetching picks for user:', username, 'in pool:', poolName, error);
            const picksContainer = playerRow.querySelector('.player-picks');
            picksContainer.innerHTML = '';
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = ' ';
            picksContainer.appendChild(errorMessage);
        });
}



/*document.getElementById('savePicksButton').addEventListener('click', () => {
    savePicksToLastWeek();
});*/

async function savePicksToLastWeek() {
    try {
        const poolContainerWrapper = document.getElementById('pool-container-wrapper');
        const poolWrappers = poolContainerWrapper.querySelectorAll('.pool-wrapper');

        let allPicks = [];

        for (const poolWrapper of poolWrappers) {
            const poolName = poolWrapper.getAttribute('data-pool-name');
            const playerRows = poolWrapper.querySelectorAll('.player-row');

            for (const playerRow of playerRows) {
                const username = playerRow.querySelector('.player-username').textContent.trim();
                const picksData = await fetchPicksData(username, poolName);

                const picks = picksData.picks || [];
                const immortalLockPick = picksData.immortalLock || [];

                allPicks.push({ username, poolName, picks, immortalLockPick });
            }
        }

        const response = await fetch('/api/savePicksToLastWeek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allPicks })
        });

        const data = await response.json();
        if (data.success) {
            alert('Picks saved to last week collection successfully');
        } else {
            alert('Failed to save picks to last week collection');
        }
    } catch (error) {
        console.error('Error saving picks to last week collection:', error);
        alert('Failed to save picks to last week collection');
    }
}

async function fetchPicksData(username, poolName) {
    const encodedUsername = encodeURIComponent(username);
    const encodedPoolName = encodeURIComponent(poolName);
    const url = `/api/getPicks/${encodedUsername}/${encodedPoolName}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching picks for user:', username, 'in pool:', poolName, error);
        return { picks: [], immortalLock: [] };
    }
}





function redirectToDashboard(poolName) {
    window.location.href = `dashboard.html?poolName=${encodeURIComponent(poolName)}`;
}


function loadAndDisplayUserPools() {

  const currentUsername = localStorage.getItem('username');
  if (!currentUsername) {
    console.error('No logged-in user found!');
    return;
  }

  // Fetch the pools the user is a part of
  fetch(`/pools/userPools/${encodeURIComponent(currentUsername.toLowerCase())}`)
    .then(response => response.json())
    .then(pools => {
        
        const poolContainerWrapper = document.getElementById('pool-container-wrapper');
        poolContainerWrapper.innerHTML = '';

       
      pools.forEach(pool => {
        pool.members.sort((a, b) => b.points - a.points);


        const poolContainer = document.createElement('div');
        poolContainer.className = 'pool-container';


      // Fetch the user profiles and user picks for each member
      const membersDataPromises = pool.members.map(member => {
        console.log(`Fetching data for username: ${member.username}`); // This should log the actual username, not [object Object]
        // Directly use member.username since it is already a direct property of the member object
        const username = member.username;
      
        // Fetch user profile
        return fetch(`/api/getUserProfile/${member.username}`)
          .then(response => response.json())
          .then(userProfile => {
            // Fetch the user picks
            const poolName = pool.name; // Assuming 'pool' is available in this scope and contains the pool name
            const encodedPoolName = encodeURIComponent(poolName);
            return fetch(`/api/getPicks/${member.username}/${encodedPoolName}`)
              .then(response => response.json())
              .then(userPicks => {
                return { userProfile, userPicks };
              });
          });
      });
      
      
        // When all members data has been fetched
        Promise.all(membersDataPromises).then(membersData => {

          membersData.forEach((data, index) => {
            const { userProfile, userPicks } = data;
            // Construct the member's player row
            const playerRow = createPlayerRow({
              rank: index + 1, // Rank is the index in the array + 1
              username: userProfile.username,
              profilePic: userProfile.profilePicture,
              points: userProfile.points,
              wins: userProfile.wins,
              losses: userProfile.losses,
              pushes: userProfile.pushes,
              picks: userPicks ? userPicks.picks : [] // Provide an empty array as fallback
            }, userProfile.username === pool.adminUsername);

            // Append the player row to the pool container
            poolContainer.appendChild(playerRow);
          });

          // Display the new pool container
          displayNewPoolContainer(pool);
        })
        .catch(error => {
          console.error('Error fetching member data:', error);
        });
      });
    })
    .catch(error => console.error('Error fetching pools for user:', error));
}

  
document.addEventListener('DOMContentLoaded', loadAndDisplayUserPools);



function createPlayerRow(memberData, isAdmin, totalMembers) {
    const playerRow = document.createElement('div');
    playerRow.className = 'player-row';
    // Populate player row with member data
    // You will need to adapt this to the actual structure of your member data and the required HTML
    playerRow.innerHTML = `
    <div class="player-rank">${memberData.rank}</div>
    <div class="player-user">
        <div class="player-profile-pic" style="background-image: url('${memberData.profilePic}')"></div>
        <span class="player-username">${memberData.username}</span>
    </div>
    <div class="player-points">${memberData.points}</div>
    <div class="player-picks"></div>
    <div class="player-immortal-lock"></div>
    <div class="player-win">${memberData.wins}</div>
    <div class="player-loss">${memberData.losses}</div>
    <div class="player-push">${memberData.pushes}</div>
`;
        if (isAdmin) {
        const userSection = playerRow.querySelector('.player-user');
        const adminBadge = document.createElement('i');
        adminBadge.classList.add('fas', 'fa-shield', 'admin-badge');
        adminBadge.setAttribute('title', 'Admin'); // This sets the hover text
        userSection.appendChild(adminBadge);
        }

 // Add a crown icon to the rank 1 player card
 if (memberData.rank === 1) {
    const userSection = playerRow.querySelector('.player-user');
    const crownIcon = document.createElement('i');
    crownIcon.classList.add('fas', 'fa-crown', 'crown-icon');
    crownIcon.setAttribute('title', '1st Place'); // This sets the hover text
    userSection.appendChild(crownIcon); // Append crown icon to the user div
}


if (memberData.rank === totalMembers) {
    const userSection = playerRow.querySelector('.player-user');
    const poopIcon = document.createElement('i');
    poopIcon.classList.add('fas', 'fa-poop', 'dunce-icon'); // Font Awesome Poop icon
    poopIcon.setAttribute('title', 'Dunce');
    userSection.appendChild(poopIcon);
}

        // Create and append picks to the player-picks container
        const picksContainer = playerRow.querySelector('.player-picks');
        if (Array.isArray(memberData.picks)) {
        memberData.picks.forEach(pick => {
            const pickElement = document.createElement('div');
            pickElement.className = 'pick';
            pickElement.textContent = pick; // Replace with actual content/formatting
            picksContainer.appendChild(pickElement);
        }); } else {
        //console.error('picks is not an array:', memberData.picks);
        }

    // Add any additional data or elements you need


    return playerRow;
}


// Assume this function is called when you want to delete a pool
function deletePool(poolName) {
    // Since you're using the pool's name, let's ensure it's URI-encoded to handle special characters
    const encodedPoolName = encodeURIComponent(poolName);

    // Proceed with the delete request if the user confirmed
    fetch(`/pools/delete/${encodedPoolName}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-username': localStorage.getItem('username')
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.message) {
            console.log('Pool deleted successfully:', poolName);
            // Remove the pool from the UI
            removePoolFromUI(poolName);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the pool.');
    });
}

function removePoolFromUI(poolName) {
    const poolElement = document.querySelector(`[data-pool-name='${CSS.escape(poolName)}']`);
    if (poolElement && poolElement.parentNode) {
        // This will remove the pool element from the UI
        poolElement.parentNode.removeChild(poolElement);
    } else {
        console.error('Pool element not found:', poolName);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const joinPoolForm = document.getElementById('join-pool-form-container'); // Assuming you have a container around your form
    const toggleJoinFormButton = document.getElementById('show-join-pool-form'); // This is the button to show the join form
    const poolNameInput = document.getElementById('pool-name2');
    const passwordInput = document.getElementById('join-password');


            // Initially hide the join pool form
        joinPoolForm.style.display = 'none';
   // Toggle the form display on button click
   toggleJoinFormButton.addEventListener('click', function() {
    if (joinPoolForm.style.display === 'none') {
        joinPoolForm.style.display = 'block';
        this.textContent = 'Go Back'; // Change the text to 'Go Back' when form is visible
    } else {
        joinPoolForm.style.display = 'none';
        this.textContent = 'Join Pool'; // Change the text back to 'Join Pool' when form is hidden
    }
});
    joinPoolForm.addEventListener('submit', function(event) {
        event.preventDefault();
    
        const poolName = poolNameInput.value;
        const poolPassword = passwordInput.value;
        const currentUsername = localStorage.getItem('username').toLowerCase();
    
        if (!currentUsername) {
            alert('You must be logged in to join a pool.');
            return;
        }
    
        const joinPayload = {
            poolName: poolName,
            username: currentUsername,
            poolPassword: poolPassword
        };
    
       // console.log('Attempting to join pool with the following details:', joinPayload);
    
        // Make sure the URL matches your API route
        const apiEndpoint = '/pools/joinByName'; // This should match your server route
        console.log(`Making POST request to: ${apiEndpoint}`);
    
        fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(joinPayload)
        })
        .then(response => {
            console.log(`Received response with status: ${response.status}`);
            if (!response.ok) {
                throw new Error(`Network response was not ok ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Server response:', data);
            alert('You have joined the pool successfully!');
            window.location.reload();
        })
        .catch(error => {
            console.error('Error joining pool:', error);
            alert('An error occurred while attempting to join the pool.');
        });
    });
    
});


function updateUserPoints(username, additionalPoints, poolName) {
    fetch('/pools/updateUserPointsInPoolByName', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, additionalPoints, poolName })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update points: ' + response.statusText);
        }
        return response.json();
    })
    .then(updateData => {
        if (updateData.success) {
            console.log('User points updated successfully:', updateData.message);
            // Optionally update the UI here
        } else {
            console.error('Failed to update user points:', updateData.message);
        }
    })
    .catch(error => {
        console.error('Error during the update process:', error);
    });
}

function changeUserPoints(username, points, poolName) {
    fetch('/pools/setUserPointsInPoolByName', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, points, poolName })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to set points: ' + response.statusText);
        }
        return response.json();
    })
    .then(updateData => {
        if (updateData.success) {
            console.log('User points set successfully:', updateData.message);
            // Optionally update the UI here to reflect the new points
        } else {
            console.error('Failed to set user points:', updateData.message);
        }
    })
    .catch(error => {
        console.error('Error during the set points process:', error);
    });
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


  //var gameScores = {};

  var gameScores = [];

  async function fetchMLBScores() {
   // appendLog('fetchMLBScores function started.');
      const url = 'https://odds.p.rapidapi.com/v4/sports/baseball_mlb/scores';
      const params = {
          daysFrom: 1,  
          apiKey: '3decff06f7mshbc96e9118345205p136794jsn629db332340e'  
      };
      const queryParams = new URLSearchParams(params);
  
      try {
          const response = await fetch(`${url}?${queryParams}`, {
              method: 'GET',
              headers: {
                  'x-rapidapi-host': 'odds.p.rapidapi.com',
                  'x-rapidapi-key': '3decff06f7mshbc96e9118345205p136794jsn629db332340e' 
              }
          });
  
          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
          }
  
          const scores = await response.json();
          console.log("Scores data:", scores);
         // appendLog('Scores fetched successfully.');
          gameScores = scores.map(event => {
              if (!event.scores || !Array.isArray(event.scores)) {
                  console.log(`Skipping event due to missing or invalid scores:`, event);
                  return null; // Return null for events without valid scores to filter them out later
              }
  
              const homeTeam = mlbToNflMap[event.home_team] || event.home_team;
              const awayTeam = mlbToNflMap[event.away_team] || event.away_team;
              const homeScore = event.scores.find(s => mlbToNflMap[s.name] === homeTeam || s.name === event.home_team)?.score;
              const awayScore = event.scores.find(s => mlbToNflMap[s.name] === awayTeam || s.name === event.away_team)?.score;
  
              return {
                  home_team: homeTeam,
                  away_team: awayTeam,
                  home_score: parseInt(homeScore, 10),
                  away_score: parseInt(awayScore, 10)
              };
          }).filter(match => match !== null);  // Filter out the null entries
  
          console.log('Scores fetched:', gameScores);
          updateUIWithScores();
      } catch (error) {

          console.error('Error fetching MLB scores:', error);
         // appendLog(`Error: ${error.message}`);
      }
  }
  
 /* document.getElementById('fetchScoresButton').addEventListener('click', function() {
      fetchMLBScores();
      submitResults();
      console.log("Fetching MLB scores...");
  });*/
  
  function getBetResult(pick, homeTeamScore, awayTeamScore) {
    let result = 'error';  // Default to error in case conditions fail
    const numericValue = parseFloat(pick.replace(/[^-+\d.]/g, ''));  // Strip to just numeric, including negative

    console.log('Evaluating Bet:', {pick, homeTeamScore, awayTeamScore, numericValue});

    // Determine if it's a spread or moneyline based on the absolute value of numericValue
    if (Math.abs(numericValue) < 100) {  // Spread logic
        console.log('Handling as Spread');
        // Calculate adjusted home team score with spread
        const adjustedHomeScore = homeTeamScore + numericValue;
        if (adjustedHomeScore > awayTeamScore) {
            console.log('Spread result: hit');
            return { result: "hit", odds: numericValue };
        } else if (adjustedHomeScore < awayTeamScore) {
            console.log('Spread result: miss');
            return { result: "miss", odds: numericValue };
        } else {
            console.log('Spread result: push');
            return { result: "push", odds: numericValue };  // This is a push condition
        }
    } else {  // Moneyline logic
        console.log('Handling as Moneyline');
        const didWin = (numericValue < 0 && homeTeamScore > awayTeamScore) || (numericValue > 0 && homeTeamScore < awayTeamScore);
        const isFavorite = numericValue < 0;
        console.log(`Moneyline details: { isFavorite: ${isFavorite}, didWin: ${didWin} }`);

        if (didWin) {
            console.log('Moneyline result: hit');
            return { result: "hit", odds: numericValue };
        } else {
            console.log('Moneyline result: miss');
            return { result: "miss", odds: numericValue };
        }
    }
}


// Function to find the pool name
function getPoolName() {
    const poolNameElement = document.querySelector('.pool-name');
    return poolNameElement ? poolNameElement.textContent : null;
}

// Function to find the username for a given pick element
function getUsernameForPick(pickElement) {
    const playerRow = pickElement.closest('.player-row');
    const usernameElement = playerRow.querySelector('.player-username');
    return usernameElement ? usernameElement.textContent.trim() : null;
}

function updateUIWithScores() {
    console.log('gameScores at update:', gameScores);
    let allResults = []; // Store all results for the current session

    document.querySelectorAll('.player-picks .pick, .immortal-lock').forEach(pickElement => {
        const teamLogo = pickElement.querySelector('.team-logo');
        console.log('Processing element:', pickElement);
        if (!teamLogo) {
            console.error('Team logo not found in pick element', pickElement);
            return; // Skip if no logo
        }

        const teamName = teamLogo.alt;
        const match = gameScores.find(m => m.home_team === teamName || m.away_team === teamName);
        if (!match) {
            console.log(`No game score available for ${teamName}, skipping...`);
            return;
        }

        const homeTeamScore = match.home_team === teamName ? match.home_score : match.away_score;
        const awayTeamScore = match.home_team === teamName ? match.away_score : match.home_score;
        const betValue = pickElement.querySelector('span')?.textContent;
        if (!betValue) {
            console.error('Bet value not found in pick element', pickElement);
            return; // Skip if no bet value
        }

        try {
            const { result, odds } = getBetResult(betValue, homeTeamScore, awayTeamScore);
            const points = calculatePointsForResult({ result, odds });
            allResults.push({ teamName, betValue, result, points });
            pickElement.style.color = result === "hit" ? "#39FF14" : result === "miss" ? "red" : "yellow";

            const username = getUsernameForPick(pickElement);
            const poolName = getPoolName();

            // Update user points
            updateUserPoints(username, points, poolName);

            // Determine the increments for win, loss, and push
            let winIncrement = 0, lossIncrement = 0, pushIncrement = 0;
            if (result === 'hit') {
                winIncrement = 1;
            } else if (result === 'miss') {
                lossIncrement = 1;
            } else if (result === 'push') {
                pushIncrement = 1;
            }

            // Update user stats
            updateUserStats(username, poolName, winIncrement, lossIncrement, pushIncrement);
        } catch (error) {
            console.error('Error processing bet result:', error);
        }
    });

    console.log('All Results:', allResults);
    saveResultsToServer(allResults);
}



function calculatePointsForResult({ result, odds, type }) {
    let points = 0;

    console.log(`Calculating points for result: ${result}, odds: ${odds}, type: ${type}`);

    switch (result) {
        case 'hit':
            if (Math.abs(odds) > 99) {
                if (odds < 0) {
                    // Favorite
                    if (odds <= -250) {
                        points += 0.5; // Less points for high favorites
                        console.log("Favorite ML win with high odds");
                    } else {
                        points += 1; // Regular win for favorites
                        console.log("Favorite ML win with normal odds");
                    }
                } else {
                    // Underdog
                    if (odds >= 400) {
                        points += 4; // Additional points for extreme underdogs
                        console.log("Underdog ML win with extreme odds");
                    } else if (odds >= 250) {
                        points += 2.5; // Extra points for big underdogs
                        console.log("Underdog ML win with high odds");
                    } else {
                        points += 2; // Standard win for underdogs
                        console.log("Underdog ML win with standard odds");
                    }
                }
            } else if (Math.abs(odds) < 100) {
                points += 1.5; // Points for spread win
                console.log("Spread win");
            } else if (type === "ImmortalLock") {
                points += 1; // Points for immortal lock win
                console.log("Immortal lock win");
            }
            break;
        case 'miss':
            if (type === "ImmortalLock") {
                points -= 2; // Penalty for immortal lock loss
                console.log("Immortal lock loss");
            }
            break;
        case 'push':
            points += 0.5; // Points for a push
            console.log("Push");
            break;
    }

    console.log(`Total points calculated: ${points}`);
    return points;
}



function saveResultsToServer(results) {
    fetch('/api/saveResults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Error saving results:', data.message);
        }
    })
    .catch(error => console.error('Failed to save results:', error));
}

//deleteResultsFromServer();
async function deleteResultsFromServer() {
    fetch('/api/deleteResults', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Error deleting results:', data.message);
        } else {
            console.log('Results deleted successfully');
        }
    })
    .catch(error => console.error('Failed to delete results:', error));
}

function rebuildUIWithResults(results) {
    console.log('Received results for UI rebuild:', results);
    const allPicks = document.querySelectorAll('.player-picks .pick, .immortal-lock');

    if (allPicks.length === 0) {
        console.warn('No pick elements found, check if the DOM has fully loaded');
        return;
    }

    console.log(`Total picks found: ${allPicks.length}`);

    allPicks.forEach(pickElement => {
        const teamLogo = pickElement.querySelector('.team-logo');
        if (!teamLogo) {
            console.error('Team logo not found in pick element', pickElement);
            return; // Skip this iteration if no logo
        }

        const teamName = teamLogo.alt;
        console.log(`Processing UI update for team: ${teamName}`);

        const resultEntry = results.find(r => r.teamName === teamName);
        if (resultEntry) {
            console.log(`Applying UI result for ${teamName}:`, resultEntry);
            pickElement.style.color = resultEntry.result === "hit" ? "#39FF14" : resultEntry.result === "miss" ? "red" : "yellow";
        } else {
            console.warn(`No result found for ${teamName} or mismatch in team names`, {teamName, results});
        }
    });
}


/*
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {  // Delay execution to ensure all scripts have processed
        fetch('/api/getResults')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received results:", data);
            if (data.success && data.results) {
                rebuildUIWithResults(data.results);
            } else {
                console.error('No results found or unable to fetch results:', data.message);
            }
        })
        .catch(error => console.error('Failed to fetch results:', error));
    }, 4000);  // Delay can be adjusted based on typical load times or removed if found unnecessary
});

*/
//'3decff06f7mshbc96e9118345205p136794jsn629db332340e'

function updateUserStats(username, poolName, winIncrement = 0, lossIncrement = 0, pushIncrement = 0) {
    fetch('/pools/updateUserStatsInPoolByName', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, poolName, winIncrement, lossIncrement, pushIncrement })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update stats: ' + response.statusText);
        }
        return response.json();
    })
    .then(updateData => {
        if (updateData.success) {
            console.log('User stats updated successfully:', updateData.message);
            // Optionally update the UI here
        } else {
            console.error('Failed to update user stats:', updateData.message);
        }
    })
    .catch(error => {
        console.error('Error during the update process:', error);
    });
}
function resetUserStats(username, poolName) {
    fetch('/pools/resetUserStatsInPoolByName', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, poolName })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to reset stats: ' + response.statusText);
        }
        return response.json();
    })
    .then(updateData => {
        if (updateData.success) {
            console.log('User stats reset successfully:', updateData.message);
            // Optionally update the UI here
        } else {
            console.error('Failed to reset user stats:', updateData.message);
        }
    })
    .catch(error => {
        console.error('Error during the reset process:', error);
    });
}

/*
resetUserStats('test2', 'testPool');
resetUserStats('testuser', 'testPool');
resetUserStats('testuser2', 'testPool');

changeUserPoints('test2', 0, 'testPool'); // Replace with the actual username, new points value, and pool name
changeUserPoints('testuser', 0, 'testPool');
changeUserPoints('testuser2', 0, 'testPool');
*/