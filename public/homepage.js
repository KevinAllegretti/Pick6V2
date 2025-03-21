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
                if (data.success && data.results) {
                    rebuildUIWithResults(data.results);
                } else {
                    console.error('No results found or unable to fetch results:', data.message);
                }
            })
            .catch(error => console.error('Failed to fetch results:', error));
    }, 3000); // Delay for load time
})


function rebuildUIWithResults(results) {
    const allPicks = document.querySelectorAll('.player-picks .pick, .immortal-lock');

    if (allPicks.length === 0) {
        console.warn('No pick elements found, check if the DOM has fully loaded');
        return;
    }

   // console.log(`Processing ${results.length} results to match against ${allPicks.length} picks on screen.`);

    // Iterate over each pick element to process results
    allPicks.forEach(pickElement => {
        const teamLogo = pickElement.querySelector('.team-logo');
        const displayedBetValue = pickElement.querySelector('span').textContent.trim(); // Get the displayed bet value
        
        if (!teamLogo) {
            console.warn('Team logo not found in pick element', pickElement);
            return; // Skip if no logo is found
        }
        
        const teamName = teamLogo.alt;
       // console.log(`Processing pick for team: ${teamName} with bet value ${displayedBetValue}`);

        // Find the result for this specific team and bet value
        const matchingResult = results.find(r => 
            r.teamName === teamName && r.betValue.toString().trim() === displayedBetValue
        );

        if (matchingResult) {
          //  console.log(`Matching result found for ${teamName}:`, matchingResult);

            // Apply color based on the result
            let color;
            if (matchingResult.result === "hit") {
                color = "#39FF14"; // Green for a win
            } else if (matchingResult.result === "miss") {
                color = "red"; // Red for a loss
            } else if (matchingResult.result === "push") {
                color = "yellow"; // Yellow for a push
            } else {
                console.warn(`Unknown result for ${teamName}: ${matchingResult.result}`);
                color = "gray"; // Gray for any unknown result
            }

            // Apply the color to the pick element (in this case, the span with the bet value)
            pickElement.querySelector('span').style.setProperty('color', color, 'important');
           // console.log(`Applied ${color} to ${teamName} for bet value ${displayedBetValue}`);
        } else {
            //console.warn(`No matching result found for ${teamName} with bet value ${displayedBetValue}`);
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


// Save the calculated times to the database
async function saveInitialTimes() {
    try {
        await fetch('/api/timewindows', {
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

        console.log("Current time: ", now);
        console.log("Tuesday Start time: ", tuesdayTime);
        console.log("Thursday deadline: ", thursdayTime);
        console.log("Sunday deadline: ", sundayTime);

        if (now > tuesdayTime && now < thursdayTime) {
            console.log('Current time window: Pick Time');
            enablePickTimeFeatures();
        } else if (now > thursdayTime && now < sundayTime) {
            console.log('Current time window: Thursday Game Time');
            enableThursdayGameFeatures();
        } else if (now > sundayTime && now < tuesdayTime) {
            console.log('Current time window: Sunday Game Time');
            enableSundayGameFeatures();
        } else {
            console.log('Error determining the current time window');
        }
    } catch (error) {
        console.error('Error checking current time window:', error);
    }
}

function enableThursdayGameFeatures() {
    console.log('Enabling Thursday game features...');
    const now = getCurrentTimeInUTC4();
    const blackedOutGames = new Set();
    const userThursdayPicks = new Set();

    // Track all picks
    const allPicks = [
        ...userPicks,
        ...lockedPicks,
        ...(userImmortalLock ? [userImmortalLock] : []),
        ...(lockedImmortalLock ? [lockedImmortalLock] : [])
    ];

    // Check for Thursday immortal lock first
    const thursdayImmortalLock = allPicks.find(pick => {
        if (!pick || !pick.commenceTime) return false;
        
        const isThursdayGame = checkIfThursdayGame(pick.commenceTime);
        const matchingBet = betOptions.find(bet => 
            (bet.homeTeam === pick.teamName || bet.awayTeam === pick.teamName)
        );
        
        const isImmortalLock = (pick === userImmortalLock || pick === lockedImmortalLock);
        
        return isThursdayGame && matchingBet && isImmortalLock;
    });

    // If we found a Thursday immortal lock, set up the lock state
    if (thursdayImmortalLock) {
        // Set global state
        isThursdayImmortalLockSet = true;
        thursdayImmortalLockTeam = thursdayImmortalLock.teamName;

        // Lock the UI
        const immortalLockCheckbox = document.getElementById('immortalLockCheck');
        if (immortalLockCheckbox) {
            immortalLockCheckbox.checked = true;
            immortalLockCheckbox.disabled = true;
            immortalLockCheckbox.style.cursor = 'not-allowed';
            immortalLockCheckbox.parentElement?.classList.add('thursday-locked');
        }

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

    // Process Thursday games
    requestAnimationFrame(() => {
        // Track user's Thursday picks
        allPicks.forEach(pick => {
            if (!pick || !pick.commenceTime) return;

            if (checkIfThursdayGame(pick.commenceTime)) {
                userThursdayPicks.add(`${pick.teamName}-${pick.type}`);
            }
        });

        // Identify Thursday games
        betOptions.forEach(bet => {
            if (checkIfThursdayGame(bet.commenceTime)) {
                blackedOutGames.add(`${bet.homeTeam} vs ${bet.awayTeam}`);
            }
        });

        // Apply handlers to Thursday games
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
                        // Mark as Thursday game
                        button.dataset.thursdayGame = 'true';

                        // Store original click handler
                        const originalOnClick = button.onclick;
                        
                        // Replace with new handler
                        button.onclick = (e) => {
                            e.stopPropagation();
                            
                            // Check if this specific button represents a current pick
                            const isExistingPick = allPicks.some(pick => 
                                pick.teamName === team && 
                                pick.type === matchingBet.type
                            );

                            // If trying to pick in a fresh matchup, show commenced alert
                            if (!isExistingPick && !matchupHasPicks) {
                                alert('Thursday game has already commenced');
                                return;
                            }

                            // If it's a Thursday immortal lock pick
                            if (thursdayImmortalLock && 
                                thursdayImmortalLock.teamName === team && 
                                thursdayImmortalLock.type === matchingBet.type) {
                                alert('Cannot change immortal lock - Thursday game is locked as your immortal lock!');
                                return;
                            }

                            // If it's an existing pick, allow normal selection logic
                            const option = {
                                teamName: team,
                                type: matchingBet.type,
                                value: matchingBet.value
                            };
                            selectBet(option);
                        };

                        // Apply user pick styling if it's a current pick
                        const isUserPick = Array.from(userThursdayPicks).some(pick => 
                            pick.toLowerCase() === `${team}-${matchingBet.type}`.toLowerCase()
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

function enableSundayGameFeatures() {
    const choosePicksButtons = document.querySelectorAll('.global-picks-button');
    if (choosePicksButtons.length > 0) {
        choosePicksButtons.forEach(button => {
            button.classList.add('disabled');
            button.textContent = 'Selections Unavailable';
        });
    } else {
        console.error('No choose picks buttons found');
    }

    // Set up click handlers for buttons
    choosePicksButtons.forEach(button => {
        button.onclick = (event) => {
            showGameTimeAlert(event); // Pass the event object
        };
    });
}

function enablePickTimeFeatures() {
    const choosePicksButtons = document.querySelectorAll('.global-picks-button');
    if (choosePicksButtons.length > 0) {
        choosePicksButtons.forEach(button => {
            button.classList.remove('disabled');
        });
    } else {
        console.error('No choose picks buttons found');
    }

    // Reset click handlers to default behavior
    choosePicksButtons.forEach(button => {
        const poolName = button.closest('.pool-wrapper')?.getAttribute('data-pool-name');
        if (poolName) {
            button.onclick = () => redirectToDashboard(poolName);
        }
    });
}

// Helper function to determine which time window we're in
async function getCurrentTimePhase() {
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

        if (now > tuesdayTime && now < thursdayTime) {
            console.log("its pcik tioeeeee")
            return 'pick';
        } else if (now > thursdayTime && now < sundayTime) {
            return 'thursday';
        } else if (now > sundayTime && now < tuesdayTime) {
            return 'sunday';
        }
        return 'unknown';
    } catch (error) {
        console.error('Error determining time phase:', error);
        return 'unknown';
    }
}

// Helper function to check if it's pick time (used by other components)
async function isCurrentTimePickTime() {
    const phase = await getCurrentTimePhase();
    return phase === 'pick';
}


function showGameTimeAlert(event) {
    if (event) {
        event.preventDefault(); // Prevent default action
    }
    alert("It's Game Time! Pick selection page not available.");
}

function updateNavUsername() {
    const username = localStorage.getItem('username');
    if (username) {
      document.getElementById('navUsername').textContent = username;
    }
  }
  function updateCountdown() {
    const container = document.getElementById('countdown-container');
    if (!container) return;

    fetch('/api/timewindows')
        .then(response => response.json())
        .then(data => {
            const now = new Date();
            const tuesdayTime = new Date(data.tuesdayStartTime);
            const sundayTime = new Date(data.sundayDeadline);

            if (now > tuesdayTime && now < sundayTime) {
                // Pick Time (continues until Sunday deadline)
                const timeLeft = sundayTime - now;
const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)) + 1;

                container.innerHTML = `
                <div class="countdown-title">Pick Time</div>
                <div class="countdown-timer">
                    <div class="time-unit">
                        <div class="time-value">${String(days).padStart(2, '0')}</div>
                        <div class="time-label">Days</div>
                    </div>
                    <div class="time-unit">
                        <div class="time-value">${String(hours).padStart(2, '0')}</div>
                        <div class="time-label">Hours</div>
                    </div>
                    <div class="time-unit">
                        <div class="time-value">${String(minutes).padStart(2, '0')}</div>
                        <div class="time-label">Minutes</div>
                    </div>
                </div>
                <div class="deadline-text">until deadline</div>
            `;
            } else if (now > sundayTime && now < tuesdayTime) {
                // Game Time
                container.innerHTML = `
                    <div class="game-time">
                        IT'S GAME TIME!
                    </div>
                `;
            }
        })
        .catch(error => console.error('Error fetching time windows:', error));
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
    updateCountdown();
    setInterval(updateCountdown, 1000);
    updateNavUsername();
    const profileIcon = document.getElementById('profileIconTemplate');
    const slideOutPanel = document.getElementById('slideOutPanel');
    const closePanelBtn = document.getElementById('closePanelBtn');
    const saveBioButton = document.getElementById('saveBioButton');

    if (profileIcon) {
        profileIcon.addEventListener('click', async () => {
            console.log('Profile icon clicked');
            if (!slideOutPanel.classList.contains('visible')) {
                // Only load profile and bio when opening
                await loadUserProfile();
                await loadUserBio();
            }
            slideOutPanel.classList.toggle('visible');
        });
    }

    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', () => {
            slideOutPanel.classList.remove('visible');
        });
    }

    // Event listener for in-pool profile clicks
    document.addEventListener('click', function(event) {
        // Check for both classic and survivor pool profile clicks
        if (event.target.closest('.player-username') || event.target.closest('.player-profile-pic') ||
            event.target.closest('.survivor-player-user')) {
            // Find the username element in either classic or survivor layout
            const playerElement = event.target.closest('.player-user') || event.target.closest('.survivor-player-user');
            if (playerElement) {
                const username = playerElement.querySelector('.player-username').textContent.trim();
                showInPoolUserProfile(username);
            }
        }
    });

    // Handle closing panels when clicking outside
    document.addEventListener('click', function(event) {
        const mainPanel = document.getElementById('slideOutPanel');
        const inPoolPanel = document.getElementById('slideOutPanelInPool');
        
        // Handle main profile panel
        if (mainPanel && mainPanel.classList.contains('visible')) {
            const clickedInMainPanel = event.composedPath().includes(mainPanel);
            const clickedOnProfileIcon = event.composedPath().includes(profileIcon);
            if (!clickedInMainPanel && !clickedOnProfileIcon) {
                mainPanel.classList.remove('visible');
            }
        }

        // Handle in-pool profile panel
        if (inPoolPanel && inPoolPanel.classList.contains('visible')) {
            const clickedInPoolPanel = event.composedPath().includes(inPoolPanel);
            const clickedOnUsername = event.target.closest('.player-username');
            const clickedOnProfilePic = event.target.closest('.player-profile-pic');
            if (!clickedInPoolPanel && !clickedOnUsername && !clickedOnProfilePic) {
                inPoolPanel.classList.remove('visible');
            }
        }
    });

    if (saveBioButton) {
        saveBioButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const bio = document.getElementById('userBio').value;
            await saveUserBio(bio);
        });
    }

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
});

// Helper functions
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
}// First, modify the event listener for profile clicks to pass the points data directly
document.addEventListener('click', function(event) {
    // Check for both classic and survivor pool profile clicks
    if (event.target.closest('.player-username') || event.target.closest('.player-profile-pic') ||
        event.target.closest('.survivor-player-user')) {
        
        // Find the containing player row
        const playerRow = event.target.closest('.player-row') || event.target.closest('.survivor-player-row');
        
        if (playerRow) {
            // Get the username
            const usernameElement = playerRow.querySelector('.player-username');
            const username = usernameElement ? usernameElement.textContent.trim() : '';
            
            // Get the points directly from the same row
            const pointsElement = playerRow.querySelector('.player-points');
            const points = pointsElement ? parseFloat(pointsElement.textContent.trim()) || 0 : 0;
            
            console.log(`Profile clicked: ${username}, Points: ${points}`);
            
            // Show profile with the points we just grabbed
            showInPoolUserProfile(username, points);
        }
    }
});

// Event listener for profile clicks
document.addEventListener('click', function(event) {
    // Check for profile clicks in classic pools
    if (event.target.closest('.player-username') || event.target.closest('.player-profile-pic')) {
        // Find the player row
        const playerRow = event.target.closest('.player-row');
        if (playerRow) {
            // Get the username
            const usernameEl = playerRow.querySelector('.player-username');
            if (!usernameEl) return;
            
            const username = usernameEl.textContent.trim();
            
            // Get the points
            const pointsEl = playerRow.querySelector('.player-points');
            if (!pointsEl) return;
            
            const pointsText = pointsEl.textContent.trim();
            let pointsValue = 0;
            try {
                const cleanPointsText = pointsText.replace(/[^\d.]/g, '');
                pointsValue = parseFloat(cleanPointsText);
                if (isNaN(pointsValue)) pointsValue = 0;
            } catch (error) {
                console.error('Error parsing points:', error);
            }
            
            // Find the pool container to determine pool type
            const poolWrapper = playerRow.closest('.pool-wrapper');
            const isClassicPool = !poolWrapper.classList.contains('survivor-mode');
            
            console.log(`Profile clicked: ${username}, Points: ${pointsValue}, Pool type: ${isClassicPool ? 'Classic' : 'Survivor'}`);
            
            // Pass all info to the profile function
            showProfileWithContext(username, pointsValue, isClassicPool);
        }
    }
    
    // Check for profile clicks in survivor pools
    if (event.target.closest('.survivor-player-user')) {
        const playerRow = event.target.closest('.survivor-player-row');
        if (playerRow) {
            const usernameEl = playerRow.querySelector('.player-username');
            if (!usernameEl) return;
            
            const username = usernameEl.textContent.trim();
            
            // For survivor pools, check if player is eliminated
            const isEliminated = playerRow.classList.contains('eliminated-player');
            
            console.log(`Survivor profile clicked: ${username}, Status: ${isEliminated ? 'Eliminated' : 'Active'}`);
            
            // Pass survivor-specific info
            showProfileWithContext(username, 0, false, isEliminated);
        }
    }
});

// Handler function with pool type context
function showProfileWithContext(username, pointsValue, isClassicPool, isEliminated = false) {
    // Store values in global variables to ensure they're not lost
    window.currentProfilePoints = pointsValue;
    window.currentProfileIsClassic = isClassicPool;
    window.currentProfileIsEliminated = isEliminated;
    
    // Call the main function
    showInPoolUserProfile(username);
}

// Main profile function
async function showInPoolUserProfile(username) {
    // Get stored context values
    const points = window.currentProfilePoints || 0;
    const isClassicPool = window.currentProfileIsClassic;
    const isEliminated = window.currentProfileIsEliminated;
    
    console.log(`Processing profile: ${username}, Points: ${points}, Classic Pool: ${isClassicPool}, Eliminated: ${isEliminated}`);
    
    try {
        // Get user data
        const response = await fetch(`/api/getUserProfile/${username.toLowerCase()}`);
        const userData = await response.json();
        
        // Get bio data
        const bioResponse = await fetch(`/api/getUserBio/${username.toLowerCase()}`);
        const bioData = await bioResponse.json();
        userData.bio = bioData.bio || '';
        
        // For classic pools only, calculate weekly average
        if (isClassicPool) {
            const weekResponse = await fetch('/getCurrentWeek');
            let currentWeek = 1; // Default value
            
            if (weekResponse.ok) {
                const weekData = await weekResponse.json();
                currentWeek = parseInt(weekData.week) || 1;
            }
            
            // Calculate weekly average
            const numPoints = points;
            const numWeek = Math.max(1, currentWeek);
            const weeklyAverage = (numPoints / numWeek).toFixed(1);
            
            console.log(`Weekly average: ${weeklyAverage} (${numPoints}/${numWeek})`);
            
            userData.points = numPoints;
            userData.weeklyAverage = weeklyAverage;
        }
        
        // For survivor pools, add elimination status
        if (!isClassicPool) {
            userData.isEliminated = isEliminated;
        }
        
        // Add the pool type to userData
        userData.isClassicPool = isClassicPool;
        
        // Display the panel
        updateProfileDisplay(userData);
    } catch (error) {
        console.error('Error loading profile data:', error);
        
        // Fallback
        const fallbackData = {
            username: username,
            profilePicture: 'Default.png',
            bio: 'Unable to load bio',
            isClassicPool: isClassicPool,
            points: points
        };
        
        if (isClassicPool) {
            fallbackData.weeklyAverage = (points / 1).toFixed(1);
        } else {
            fallbackData.isEliminated = isEliminated;
        }
        
        updateProfileDisplay(fallbackData);
    }
}

// Display function with pool type awareness
function updateProfileDisplay(userData) {
    // Get or create the panel
    let panel = document.getElementById('slideOutPanelInPool');
    if (!panel) {
        const template = document.getElementById('in-pool-profile-template');
        if (template) {
            document.body.appendChild(template.content.cloneNode(true));
            panel = document.getElementById('slideOutPanelInPool');
        } else {
            console.error('Profile template not found!');
            return;
        }
    }
    
    // Update profile picture
    const profileImg = panel.querySelector('.profile-icon-center');
    if (profileImg) profileImg.src = userData.profilePicture || 'Default.png';
    
    // Update username
    const nameEl = document.getElementById('displayNameInPool');
    if (nameEl) nameEl.textContent = userData.username;
    
    // Update bio
    const bioEl = document.getElementById('userBioInPool');
    if (bioEl) bioEl.textContent = userData.bio || 'No bio available';
    
    // Update stats with pool type awareness
    const statsEl = document.getElementById('userRecordInPool');
    if (statsEl) {
        if (userData.isClassicPool) {
            // Classic pool - show weekly average
            const pointsDisplay = typeof userData.points === 'number' ? userData.points : 0;
            const avgDisplay = userData.weeklyAverage || '0.0';
            
            statsEl.innerHTML = `
                <div>Weekly Average: ${avgDisplay} pts </div>
            `;
        } else {
            // Survivor pool - show status
            const status = userData.isEliminated ? 'ELIMINATED' : 'ACTIVE';
            const statusClass = userData.isEliminated ? 'eliminated-status' : 'active-status';
            
            statsEl.innerHTML = `
                <div class="${statusClass}">${status}</div>
            `;
        }
    }
    
    // Show the panel
    panel.classList.add('visible');
}
//testing purposes

document.addEventListener('DOMContentLoaded', function() {
    // Get the current URL
    var currentUrl = window.location.href;

    // Parse the URL to remove query parameters
    var url = new URL(currentUrl);
    url.search = ''; // Remove query parameters

    // Use replaceState to update the URL in the browser without reloading the page
    window.history.replaceState({}, document.title, url.pathname);
});

document.addEventListener('DOMContentLoaded', function() {
    const globalPicksButton = document.getElementById('globalPicksButton');
    const survivorPicksButton = document.getElementById('survivorPicksButton');

    // Function to check if user is in any survivor pools
    async function checkForSurvivorPools() {
        try {
            const username = localStorage.getItem('username');
            if (!username) return false;

            const response = await fetch(`/pools/userPools/${encodeURIComponent(username.toLowerCase())}`);
            if (!response.ok) return false;

            const pools = await response.json();
            return pools.some(pool => pool.mode === 'survivor');
        } catch (error) {
            console.error('Error checking for survivor pools:', error);
            return false;
        }
    }

    // Initial check for survivor pools and button display
    checkForSurvivorPools().then(hasSurvivorPool => {
        if (hasSurvivorPool && survivorPicksButton) {
            survivorPicksButton.style.display = 'block';
        }
    });

    if (globalPicksButton) {
        globalPicksButton.addEventListener('click', async function() {
            const phase = await getCurrentTimePhase();
            if (phase === 'sunday') {
                showGameTimeAlert(event);
                return;
            }
            // Allow access during both pick time and Thursday games
            window.location.href = 'dashboard.html';
        });
    }

    if (survivorPicksButton) {
        survivorPicksButton.addEventListener('click', async function() {
            const phase = await getCurrentTimePhase();
            if (phase === 'sunday') {
                showGameTimeAlert(event);
                return;
            }
            // Allow access during both pick time and Thursday games
            window.location.href = 'SurvivorSelection.html';
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const globalPicksButton = document.getElementById('globalPicksButton');
    if (globalPicksButton) {
        globalPicksButton.addEventListener('click', async function() {
            const phase = await getCurrentTimePhase();
            if (phase === 'sunday') {
                showGameTimeAlert(event);
                return;
            }
            // Allow access during both pick time and Thursday games
            window.location.href = 'dashboard.html';
        });
    }
});
// V3 for pool man
document.addEventListener('DOMContentLoaded', function() {
    // Tab Switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    let selectedMode = 'classic'; // Default mode

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.add('hidden'));
            
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(`${tabId}-pool-content`).classList.remove('hidden');
        });
    });

    // Mode Selection
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            modeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedMode = card.dataset.mode;
        });
    });

    // Privacy Toggle
    const privacyBtn = document.getElementById('privacy-btn');
    const passwordGroup = document.querySelector('.password-group');
    let isPrivate = false;

    privacyBtn.addEventListener('click', () => {
        isPrivate = !isPrivate;
        privacyBtn.classList.toggle('private');
        passwordGroup.classList.toggle('hidden');
        
        const icon = privacyBtn.querySelector('i');
        const text = privacyBtn.querySelector('span');
        
        if (isPrivate) {
            icon.classList.replace('icon-unlock', 'icon-lock');
            text.textContent = 'Private';
        } else {
            icon.classList.replace('icon-lock', 'icon-unlock');
            text.textContent = 'Public';
        }
    });

    // Create Pool Form Submission
  // Create Pool Form Submission


    // Join Pool Form Submission
    // Join Pool Form Submission
// Join Pool Form Submission
const joinPoolForm = document.getElementById('join-pool-form');
joinPoolForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const poolName = joinPoolForm.querySelector('input[type="text"]').value.trim();
    const poolPassword = joinPoolForm.querySelector('input[type="password"]').value;
    const username = localStorage.getItem('username');

    if (!username) {
        alert('Username not found. Please log in again.');
        return;
    }

    try {
        const response = await fetch('/pools/joinByName', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                poolName: poolName,
                username: username.toLowerCase(),
                poolPassword: poolPassword
            })
        });

        if (!response.ok) {
            if (response.status === 404) {
                alert('Pool not found.');
                return;
            }
            if (response.status === 401) {
                alert('Incorrect password.');
                return;
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.message) {
            // Reset form
            joinPoolForm.reset();
            
            // Show success message
            alert('Successfully joined the pool!');
            
            // Reload the page
            window.location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while joining the pool.');
    }
});
});
//here is end of v3

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





function updatePoolActionsList() {
    const poolActionsList = document.querySelector('.pool-actions-list');
    if (!poolActionsList) return;
    
    poolActionsList.innerHTML = '';
    const orderedContainer = document.getElementById('ordered-pools-container');
    if (!orderedContainer) return;

    const pools = Array.from(orderedContainer.querySelectorAll('.pool-wrapper'));
    const currentUsername = localStorage.getItem('username').toLowerCase();

    // Sort pools by their actual positions in the container
    const poolsWithIndices = pools.map(poolWrapper => {
        const memberOrder = parseInt(poolWrapper.style.order) || 0;
        // Since we're using negative orders in the display, we need to convert back
        const actualIndex = memberOrder;
        return {
            element: poolWrapper,
            index: actualIndex
        };
    });

    // Sort by index (ascending)
    poolsWithIndices.sort((a, b) => a.index - b.index);

    // Create action items in sorted order
    poolsWithIndices.forEach(({element: poolWrapper}, displayIndex) => {
        const poolName = poolWrapper.getAttribute('data-pool-name');
        const isSurvivorPool = poolWrapper.classList.contains('survivor-mode');
        const poolAdmin = poolWrapper.getAttribute('data-admin-username');
        const isAdmin = poolAdmin && poolAdmin.toLowerCase() === currentUsername;
    
        const actionItem = document.createElement('div');
        actionItem.className = 'pool-action-item';
        actionItem.dataset.order = displayIndex;
        
        // Add order buttons
        const orderButtons = document.createElement('div');
        orderButtons.className = 'pool-order-buttons';
        
        const upButton = document.createElement('button');
        upButton.className = 'order-button';
        upButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
        upButton.disabled = displayIndex === 0;

        const downButton = document.createElement('button');
        downButton.className = 'order-button';
        downButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
        downButton.disabled = displayIndex === pools.length - 1;

        orderButtons.appendChild(upButton);
        orderButtons.appendChild(downButton);

        // Add event listeners for reordering
        upButton.onclick = async () => {
            try {
                const response = await movePool(poolName, 'up');
                if (response.success) {
                    upButton.classList.add('success');
                    setTimeout(() => upButton.classList.remove('success'), 500);
                    loadAndDisplayUserPools();
                }
            } catch (error) {
                console.error('Error moving pool up:', error);
            }
        };

        downButton.onclick = async () => {
            try {
                const response = await movePool(poolName, 'down');
                if (response.success) {
                    downButton.classList.add('success');
                    setTimeout(() => downButton.classList.remove('success'), 500);
                    loadAndDisplayUserPools();
                }
            } catch (error) {
                console.error('Error moving pool down:', error);
            }
        };

        const nameSpan = document.createElement('span');
        nameSpan.className = 'pool-name-text';
        nameSpan.textContent = poolName + (isSurvivorPool ? ' (Survivor)' : '');

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'pool-action-buttons';

        if (isAdmin) {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'pool-action-button delete';
            deleteButton.textContent = 'Delete Pool';
            deleteButton.onclick = () => {
                const confirmation = confirm(`Are you sure you want to delete "${poolName}"?`);
                if (confirmation) {
                    deletePool(poolName);
                    actionItem.remove();
                }
            };
            buttonContainer.appendChild(deleteButton);
        } else {
            const leaveButton = document.createElement('button');
            leaveButton.className = 'pool-action-button leave';
            leaveButton.textContent = 'Leave Pool';
            leaveButton.onclick = () => {
                const confirmation = confirm(`Are you sure you want to leave "${poolName}"?`);
                if (confirmation) {
                    leavePool(poolName);
                    actionItem.remove();
                }
            };
            buttonContainer.appendChild(leaveButton);
        }

        actionItem.appendChild(orderButtons);
        actionItem.appendChild(nameSpan);
        actionItem.appendChild(buttonContainer);
        poolActionsList.appendChild(actionItem);
    });
}


async function movePool(poolName, direction) {
    const username = localStorage.getItem('username');
    if (!username) {
        throw new Error('No username found');
    }

    try {
        // Invert the direction for the backend since our display is inverted
        const backendDirection = direction === 'up' ? 'down' : 'up';
        
        const response = await fetch('/pools/reorder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                poolName: poolName,
                direction: backendDirection // Use inverted direction
            })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error('Server reorder failed');
        }

        // Reload pools after successful move
        await loadAndDisplayUserPools();
        
        return data;
    } catch (error) {
        console.error('Error reordering pools:', error);
        throw error;
    }
}

// Add this helper function to ensure clean animations
function forceRepaint(element) {
    void element.offsetHeight;
}


let chatMode = 'global';  // Default to global mode

// Initialize chat when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
    setupChatEventListeners();
});

function initializeChat() {
    const chatBtn = document.querySelector('.nav-button.chat-btn');
    const chatWrapper = document.querySelector('.chat-wrapper');
    
    if (chatBtn && chatWrapper) {
        // Set up click handler for chat button
        chatBtn.addEventListener('click', function() {
            chatWrapper.classList.toggle('show-chat');
            if (chatWrapper.classList.contains('show-chat')) {
                const chatBox = chatWrapper.querySelector('.chat-box');
                fetchMessages(null, chatBox); // Fetch global messages
            }
        });

        // Close chat when clicking outside
        document.addEventListener('click', function(e) {
            if (!chatWrapper.contains(e.target) && !chatBtn.contains(e.target)) {
                chatWrapper.classList.remove('show-chat');
            }
        });
    }
}

function setupChatEventListeners() {
    // Event listener for send button
    document.addEventListener('click', function(event) {
        if (event.target.matches('.send-chat-button')) {
            handleSendMessage(event);
        }
    });

    // Event listener for Enter key in chat input
    document.addEventListener('keypress', function(event) {
        if (event.target.matches('.chat-input') && event.key === 'Enter') {
            handleSendMessage(event);
        }
    });

    // Set up chat mode toggle buttons
    const toggleButtons = document.querySelectorAll('.chat-toggle-button');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            setChatMode(this);
        });
    });
}

function handleSendMessage(event) {
    const chatWrapper = event.target.closest('.chat-wrapper');
    const chatBox = chatWrapper.querySelector('.chat-box');
    const chatInput = chatWrapper.querySelector('.chat-input');
    const message = chatInput.value.trim();
    const username = localStorage.getItem('username');

    if (message && username) {
        sendMessage(username, null, message, chatBox); // null for global chat
        chatInput.value = '';
    }
}

function setChatMode(button) {
    // Update button styles
    const buttons = button.parentElement.querySelectorAll('.chat-toggle-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Set chat mode
    chatMode = button.getAttribute('data-mode');
    
    // Fetch messages for new mode
    const chatBox = button.closest('.chat-wrapper').querySelector('.chat-box');
    fetchMessages(null, chatBox);
}

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
    chatBox.innerHTML = '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    messages.forEach(msg => {
        const prefix = msg.poolName ? '[L]' : '[G]';
        const messageElement = document.createElement('div');
        
        const usernameSpan = document.createElement('span');
        usernameSpan.style.color = '#33d9ff';
        usernameSpan.textContent = `${msg.username}: `;

        const messageSpan = document.createElement('span');
        messageSpan.innerHTML = msg.message.replace(urlRegex, url => 
            `<a href="${url}" target="_blank">${url}</a>`
        );

        messageElement.appendChild(document.createTextNode(`${prefix} `));
        messageElement.appendChild(usernameSpan);
        messageElement.appendChild(messageSpan);

        chatBox.appendChild(messageElement);
    });
    
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Set up automatic message refresh
function startMessageRefresh() {
    setInterval(() => {
        const chatWrapper = document.querySelector('.chat-wrapper');
        if (chatWrapper && chatWrapper.classList.contains('show-chat')) {
            const chatBox = chatWrapper.querySelector('.chat-box');
            fetchMessages(null, chatBox);
        }
    }, 5000); // Refresh every 5 seconds
}

// Start the refresh cycle when the page loads
document.addEventListener('DOMContentLoaded', startMessageRefresh);

// Optional: Add loading indicator
function showLoadingIndicator(chatBox) {
    const loader = document.createElement('div');
    loader.className = 'chat-loader';
    loader.textContent = 'Loading messages...';
    chatBox.appendChild(loader);
}

function hideLoadingIndicator(chatBox) {
    const loader = chatBox.querySelector('.chat-loader');
    if (loader) {
        loader.remove();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Get the template content
    const template = document.getElementById('chat-template');
    if (template) {
        // Create a copy of the template content
        const chatElement = template.content.cloneNode(true);
        // Add it to the body
        document.body.appendChild(chatElement);
    }
    
    // Initialize chat
    initializeChat();
    setupChatEventListeners();
});


async function isCurrentTimePickTime() {
    try {
        const response = await fetch('/api/timewindows');
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
/* old without new thursday
async function fetchPicks(username, poolName, playerRow, teamLogos) {
    const isPickTime = await isCurrentTimePickTime(); // Determine if it's pick time

    const encodedUsername = encodeURIComponent(username);
    const encodedPoolName = encodeURIComponent(poolName);
    const url = `/api/getPicks/${encodedUsername}/${encodedPoolName}`;

   // console.log(`Fetching picks for username: ${username}, poolName: ${poolName}, URL: ${url}, isPickTime: ${isPickTime}`);

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

              // Log commenceTime values before sorting
              //  console.log('Before sorting:', picksData.picks.map(pick => pick.commenceTime));

                // Sort picks by commenceTime before rendering
                picksData.picks.sort((a, b) => new Date(a.commenceTime) - new Date(b.commenceTime));

                // Log commenceTime values after sorting
               // console.log('After sorting:', picksData.picks.map(pick => pick.commenceTime));
            if (username === localStorage.getItem('username').toLowerCase() || !isPickTime) {
                // Existing logic to fetch and display picks
                if (picksData && picksData.picks && Array.isArray(picksData.picks) && picksData.picks.length > 0) {
                 //   console.log('Rendering picks for user:', username);

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
                bannerImage.src = 'PickTimeNew.png'; // Updated path
                bannerImage.alt = 'Player Making Selections';
                bannerImage.className = 'pick-banner';

                console.log('Banner image path:', bannerImage.src); // Log the banner image path

                picksContainer.appendChild(bannerImage);
            }
        })
        .catch(error => {
           // console.error('Error fetching picks for user:', username, 'in pool:', poolName, error);
            const picksContainer = playerRow.querySelector('.player-picks');
            picksContainer.innerHTML = '';
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = ' ';
            picksContainer.appendChild(errorMessage);
        });
}*/

function checkIfThursdayGame(commenceTime) {
    const gameDate = new Date(commenceTime); // Parse the date
    const localDate = new Date(gameDate.getTime() - gameDate.getTimezoneOffset() * 60000); // Adjust to local time
    const dayLocal = localDate.getDay(); // Get the day of the week in local time
    console.log(`Original Date (UTC): ${commenceTime}`);
    console.log(`Adjusted Date (Local): ${localDate}`);
    console.log(`Day (Local): ${dayLocal}`);
    return dayLocal === 4; // Return true for Thursday in local timezone
}

/*
async function fetchPicks(username, poolName, playerRow, teamLogos, isSurvivorPool = false) {
    const encodedUsername = encodeURIComponent(username);
    const encodedPoolName = encodeURIComponent(poolName);
    const url = `/api/getPicks/${encodedUsername}/${encodedPoolName}`;

    try {
        const timePhase = await getCurrentTimePhase();
        const picksResponse = await fetch(url);
        /*if (!picksResponse.ok) {
            throw new Error(`HTTP error! status: ${picksResponse.status}`);
        }
        const picksData = await picksResponse.json();
        
        const picksContainer = playerRow.querySelector(isSurvivorPool ? '.survivor-player-picks' : '.player-picks');
        picksContainer.innerHTML = '';

        // Get reference to the immortal lock container (only for non-survivor pools)
        const immortalLockContainer = !isSurvivorPool ? playerRow.querySelector('.player-immortal-lock') : null;
        if (immortalLockContainer) immortalLockContainer.innerHTML = '';

        const isCurrentUser = username === localStorage.getItem('username').toLowerCase();

        if (picksData && picksData.picks && Array.isArray(picksData.picks)) {
            // Sort picks by commence time
            picksData.picks.sort((a, b) => new Date(a.commenceTime) - new Date(b.commenceTime));
            
            if (isCurrentUser) {
                // Current user always sees their own picks
                if (isSurvivorPool) {
                    // For survivor pools, only show the first pick
                    if (picksData.picks.length > 0) {
                        await displaySurvivorPick(picksData.picks[0], picksContainer, teamLogos);
                    }
                } else {
                    await displayAllPicks(picksData.picks, picksContainer, teamLogos);
                }
            } else {
                switch (timePhase) {
                    case 'pick':
                        if(!isSurvivorPool){
                            displayPickTimeBanner(picksContainer);
                        }
                        else{
                            displaySurvivorPickTimeBanner(picksContainer);
                        }
                        break;
                    case 'thursday':
                        console.log('Processing Thursday game time picks');
                        
                        if (isSurvivorPool) {
                            // For survivor pools, check if they have a Thursday pick
                            const thursdayPick = picksData.picks.find(pick => 
                                checkIfThursdayGame(pick.commenceTime)
                            );
                            
                            if (thursdayPick) {
                                // If they have a Thursday pick, display it
                                await displaySurvivorPick(thursdayPick, picksContainer, teamLogos);
                            } else if (picksData.picks.length > 0) {
                                // Only show the banner if they have submitted a pick (just not a Thursday one)
                                displaySurvivorPickTimeBanner(picksContainer);
                            }
                            // If they have no picks at all, leave it blank (do nothing)
                        } else {
                            // Regular pool logic (unchanged)
                            // Filter for Thursday night games
                            const thursdayPicks = picksData.picks.filter(pick => 
                                checkIfThursdayGame(pick.commenceTime)
                            );
                            
                            if (thursdayPicks.length > 0) {
                                // User has Thursday picks - display them
                                await displayAllPicks(thursdayPicks, picksContainer, teamLogos);
                                
                                // Show locked banner for remaining picks in regular pools
                                if (picksData.picks.length > thursdayPicks.length) {
                                    displayThursdayPickTimeBanner(picksContainer)
                                }
                            } else {
                                // User has no Thursday picks - show pick time banner
                                displayPickTimeBanner(picksContainer);
                            }
                        }
                        break;
                    case 'sunday':
                        // Show all picks during Sunday phase
                        if (isSurvivorPool) {
                            if (picksData.picks.length > 0) {
                                await displaySurvivorPick(picksData.picks[0], picksContainer, teamLogos);
                            }
                        } else {
                            await displayAllPicks(picksData.picks, picksContainer, teamLogos);
                        }
                        break;
                }
            }

            // Handle immortal lock display (only for non-survivor pools)
            if (!isSurvivorPool && immortalLockContainer && picksData.immortalLock && picksData.immortalLock.length > 0) {
                const immortalPick = picksData.immortalLock[0];
                
                if (isCurrentUser) {
                    // Always show current user's immortal lock
                    displayImmortalLock(immortalPick, immortalLockContainer, teamLogos);
                } else {
                    switch (timePhase) {
                        case 'pick':
                            // Don't show immortal lock during pick time
                            break;
                        case 'thursday':
                            // Show immortal lock only if it's a Thursday game
                            if (await checkIfThursdayGame(immortalPick.commenceTime)) {
                                displayImmortalLock(immortalPick, immortalLockContainer, teamLogos);
                            }
                            break;
                        case 'sunday':
                            // Show all immortal locks
                            displayImmortalLock(immortalPick, immortalLockContainer, teamLogos);
                            break;
                    }
                }
            }
        } else {
            // If there are no picks, display appropriate message but not for survivor pools in Thursday phase
            // For survivor pools with no picks during Thursday phase, leave it blank
            if (!(isSurvivorPool && timePhase === 'thursday')) {
                displayNoPicks(picksContainer);
            }
        }
    } catch (error) {
        console.error('Error fetching picks:', error);
        handleFetchError(playerRow);
    }
}*/

async function displaySurvivorPick(pick, container, teamLogos) {
    const pickDiv = document.createElement('div');
    pickDiv.className = 'survivor-pick';

    if (pick.teamName && teamLogos[pick.teamName]) {
        const logoImg = document.createElement('img');
        logoImg.src = teamLogos[pick.teamName];
        logoImg.alt = pick.teamName;
        logoImg.className = 'team-logo';
        pickDiv.appendChild(logoImg);
    }

    container.appendChild(pickDiv);
}

async function displayAllPicks(picks, container, teamLogos) {
    // Clear container first
    container.innerHTML = '';
    
    for (const pick of picks) {
        const pickDiv = document.createElement('div');
        pickDiv.className = 'pick';

        if (teamLogos[pick.teamName]) {
            const logoImg = document.createElement('img');
            logoImg.src = teamLogos[pick.teamName];
            logoImg.alt = pick.teamName;
            logoImg.className = 'team-logo';
            pickDiv.appendChild(logoImg);
        }

        if (pick.value) {
            const valueSpan = document.createElement('span');
            valueSpan.textContent = pick.value;
            pickDiv.appendChild(valueSpan);
        }

        container.appendChild(pickDiv);
    }
}

function displayPickTimeBanner(container) {
    const bannerImage = document.createElement('img');
    bannerImage.src = 'PickTimeNew.png';
    bannerImage.alt = 'Player Making Selection';
    bannerImage.className = 'pick-banner';
    container.appendChild(bannerImage);
}

function displayThursdayPickTimeBanner(container) {
    const lockedBanner = document.createElement('img');
    lockedBanner.src = 'ThursdayLocked.png';
    lockedBanner.alt = 'Picks Locked';
    lockedBanner.className = 'locked-picks-banner';
    container.appendChild(lockedBanner);
}
function displaySurvivorPickTimeBanner(container) {
    const bannerImage = document.createElement('img');
    bannerImage.src = 'SurvivorPickBanner.png';
    bannerImage.alt = 'Player Making Selection';
    bannerImage.className = 'Survivor-pick-banner';
    container.appendChild(bannerImage);
}

function displayImmortalLock(immortalPick, container, teamLogos) {
    const lockDiv = document.createElement('div');
    lockDiv.className = 'immortal-lock';

    if (teamLogos[immortalPick.teamName]) {
        const logoImg = document.createElement('img');
        logoImg.src = teamLogos[immortalPick.teamName];
        logoImg.alt = immortalPick.teamName;
        logoImg.className = 'team-logo';
        lockDiv.appendChild(logoImg);
    }

    if (immortalPick.value) {
        const valueSpan = document.createElement('span');
        valueSpan.textContent = immortalPick.value;
        lockDiv.appendChild(valueSpan);
    }

    container.appendChild(lockDiv);
}

function displayNoPicks(container) {
    const noPicksMessage = document.createElement('div');
    noPicksMessage.className = 'no-picks-message';
    noPicksMessage.textContent = ' ';
    container.appendChild(noPicksMessage);
}

function handleFetchError(playerRow) {
    const picksContainer = playerRow.querySelector('.player-picks');
    picksContainer.innerHTML = '';
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = ' ';
    picksContainer.appendChild(errorMessage);
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
       /* if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }*/
        const data = await response.json();
        return data;
    } catch (error) {
        //console.error('Error fetching picks for user:', username, 'in pool:', poolName, error);
        return { picks: [], immortalLock: [] };
    }
}

/*
function displayNewPoolContainer(pool) {
    if (pool.mode === 'survivor') {
        displaySurvivorPool(pool);
        return;
    }

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

    let username = localStorage.getItem('username');
    if (!username) {
        console.error('No logged-in user found!');
        return;
    }

    // Find or create ordered container
    let orderedContainer = document.getElementById('ordered-pools-container');
    if (!orderedContainer) {
        orderedContainer = document.createElement('div');
        orderedContainer.id = 'ordered-pools-container';
        document.getElementById('pool-container-wrapper').appendChild(orderedContainer);
    }

    username = username.toLowerCase();
    const isAdmin = username === pool.adminUsername.toLowerCase();

    const poolWrapper = document.createElement('div');
    poolWrapper.className = 'pool-wrapper';
    poolWrapper.setAttribute('data-pool-name', pool.name);
    poolWrapper.setAttribute('data-admin-username', pool.adminUsername);

    // Get member's order index
    const memberOrder = pool.members.find(m => 
        m.username.toLowerCase() === username.toLowerCase()
    )?.orderIndex ?? 0;
    
    // Use negative order to reverse the display order (higher index = higher position)
    poolWrapper.style.order = -memberOrder;

    const poolNameContainer = document.createElement('div');
    poolNameContainer.className = 'pool-name-container';
    
    const poolNameDiv = document.createElement('div');
    poolNameDiv.className = 'pool-name';
    poolNameDiv.innerText = pool.name;

    const poolControls = document.createElement('div');
    poolControls.className = 'pool-controls';
    
    const userCountDiv = document.createElement('div');
    userCountDiv.className = 'user-count';
    userCountDiv.innerHTML = `
        <i class="fas fa-users"></i>
        <span>${pool.members.length}</span>
    `;

    const viewDropdown = document.createElement('div');
    viewDropdown.className = 'view-selector-container';
    viewDropdown.innerHTML = `
        <select class="view-selector">
            <option value="aroundMe">Around Me</option>
            <option value="all">All Players</option>
        </select>
        <span class="dropdown-arrow">▼</span>
    `;

    const select = viewDropdown.querySelector('select');
    select.addEventListener('change', (e) => {
        setTimeout(() => {
            const container = poolContainer;
            const allRows = [...container.querySelectorAll('.player-row')];
            const currentUserRow = container.querySelector('.current-user-row');
            const currentUserIndex = allRows.indexOf(currentUserRow);
            
            // Hide all rows initially
            allRows.forEach(row => row.style.display = 'none');
            
            if (e.target.value === 'aroundMe' && currentUserRow) {
                let startIndex = 0;
                let endIndex = Math.min(10, allRows.length);

                if (currentUserIndex >= 5 && currentUserIndex < allRows.length - 5) {
                    startIndex = currentUserIndex - 5;
                    endIndex = currentUserIndex + 5;
                } else if (currentUserIndex >= allRows.length - 5) {
                    startIndex = Math.max(0, allRows.length - 10);
                    endIndex = allRows.length;
                }

                for (let i = startIndex; i < endIndex; i++) {
                    allRows[i].style.display = '';
                }
            } else {
                allRows.slice(0, 10).forEach(row => row.style.display = '');
                allRows.slice(10).forEach(row => row.style.display = 'none');

                if (allRows.length > 10) {
                    const showMoreButton = document.createElement('button');
                    showMoreButton.className = 'show-more-button';
                    showMoreButton.innerHTML = `
                        <i class="fas fa-chevron-down"></i>
                        <i class="fas fa-users" style="font-size: 0.9em"></i>
                        <span>show ${allRows.length - 10} more</span>
                    `;
                    
                    // Add inline styles to ensure visibility
                    showMoreButton.style.display = 'flex';
                    showMoreButton.style.position = 'relative';
                    showMoreButton.style.zIndex = '100';
                    showMoreButton.style.visibility = 'visible';
                    showMoreButton.style.opacity = '1';
                    
                    let expanded = false;
                    showMoreButton.addEventListener('click', () => {
                        if (!expanded) {
                            allRows.forEach(row => row.style.display = '');
                            showMoreButton.innerHTML = `
                                <i class="fas fa-chevron-up"></i>
                                <i class="fas fa-users" style="font-size: 0.9em"></i>
                                <span>show less</span>
                            `;
                            showMoreButton.classList.add('expanded');
                        } else {
                            allRows.forEach((row, index) => {
                                row.style.display = index < 10 ? '' : 'none';
                            });
                            showMoreButton.innerHTML = `
                                <i class="fas fa-chevron-down"></i>
                                <i class="fas fa-users" style="font-size: 0.9em"></i>
                                <span>show ${allRows.length - 10} more</span>
                            `;
                            showMoreButton.classList.remove('expanded');
                        }
                        expanded = !expanded;
                    });
                
                    // Remove any existing button
                    const existingButton = document.querySelector('.show-more-button');
                    if (existingButton) existingButton.remove();
                    
                    // Append the button AFTER the pool container to ensure it's visible
                    const poolWrapper = poolScrollableContainer.closest('.pool-wrapper');
                    poolWrapper.appendChild(showMoreButton);
                }
            }
        }, 100);
    });

    poolNameContainer.appendChild(poolNameDiv);
    poolNameContainer.appendChild(userCountDiv);
    poolNameContainer.appendChild(viewDropdown);
    poolNameContainer.appendChild(poolControls);
    
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
        <span class="header-picks">Picks</span>
        <span class="header-immortal-lock"><i class="fas fa-lock"></i></span>
        <span class="header-win">Win</span>
        <span class="header-loss">Loss</span>
        <span class="header-push">Push</span>
    `;
    poolContainer.appendChild(poolHeader);

    pool.members.sort((a, b) => b.points - a.points || a.username.localeCompare(b.username));

    const memberDataPromises = pool.members.map(member => 
        fetchUserProfile(member.username).then(userProfile => ({
            rank: pool.members.indexOf(member) + 1,
            username: userProfile.username,
            profilePic: userProfile.profilePicture,
            points: member.points,
            wins: member.win,
            losses: member.loss,
            pushes: member.push
        }))
    );

    Promise.all(memberDataPromises).then(membersData => {
        membersData.forEach(memberData => {
            const playerRow = createPlayerRow(memberData, memberData.username === pool.adminUsername, pool.members.length);
            fetchPicks(memberData.username, pool.name, playerRow, teamLogos);
            poolContainer.appendChild(playerRow);
        });

        poolScrollableContainer.appendChild(poolContainer);
        poolWrapper.appendChild(poolNameContainer);
        poolWrapper.appendChild(poolScrollableContainer);

        // Append chat container from template
        const chatTemplate = document.getElementById('chat-template').content.cloneNode(true);
        poolWrapper.appendChild(chatTemplate);

        // Add to ordered container
        orderedContainer.appendChild(poolWrapper);

      
        setTimeout(() => {
            select.value = 'aroundMe';
            select.dispatchEvent(new Event('change'));
        }, 100);

        setTimeout(() => {
            checkCurrentTimeWindow();
        }, 50);

        // Update pool actions list after adding pool
        updatePoolActionsList();
    }).catch(error => {
        console.error('Error fetching member data:', error);
    });
}*/


function redirectToDashboard(poolName) {
    window.location.href = `dashboard.html?poolName=${encodeURIComponent(poolName)}`;
}

function redirectToNFLSchedule(source) {
    window.location.href = `scheduler.html?source=${encodeURIComponent(source)}`;
}

/*
async function loadAndDisplayUserPools() {
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername) {
        console.error('No logged-in user found!');
        return;
    }

    const poolContainerWrapper = document.getElementById('pool-container-wrapper');
    if (!poolContainerWrapper) {
        console.error('Pool container wrapper not found');
        return;
    }
    
    poolContainerWrapper.innerHTML = '';
    const newOrderedContainer = document.createElement('div');
    newOrderedContainer.id = 'ordered-pools-container';
    newOrderedContainer.style.display = 'flex';
    poolContainerWrapper.appendChild(newOrderedContainer);
    try {
        const response = await fetch(`/pools/userPools/${encodeURIComponent(currentUsername.toLowerCase())}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const pools = await response.json();
        
        // Sort pools by orderIndex (ascending order)
        pools.sort((a, b) => {
            const memberA = a.members.find(m => m.username.toLowerCase() === currentUsername.toLowerCase());
            const memberB = b.members.find(m => m.username.toLowerCase() === currentUsername.toLowerCase());
            
            const orderA = memberA?.orderIndex ?? 0;
            const orderB = memberB?.orderIndex ?? 0;
            
            // Sort by orderIndex (descending to show higher indices first)
            if (orderA !== orderB) {
                return orderB - orderA;
            }
            return a.name.localeCompare(b.name);
        });
        

        const poolPromises = pools.map(async (pool) => {
            try {
                if (pool.mode === 'survivor') {
                    await displaySurvivorPool(pool);
                } else {
                    await displayNewPoolContainer(pool);
                }
            } catch (error) {
                console.error(`Error processing pool ${pool.name}:`, error);
            }
        });

        await Promise.all(poolPromises);

        // Update pool actions list
        requestAnimationFrame(() => {
            const poolActionsList = document.querySelector('.pool-actions-list');
            if (poolActionsList) {
                poolActionsList.innerHTML = '';
                updatePoolActionsList();
            }
        });

    } catch (error) {
        console.error('Error fetching or processing pools:', error);
    }
}
*/


// Helper function to get the ordered index of a pool
function getPoolOrderIndex(poolWrapper) {
    return parseInt(poolWrapper.getAttribute('data-order-index')) || 0;
}
// Make sure these functions are defined before they're used
window.addEventListener('load', function() {
    // Initialize pool loading only after page is fully loaded
    loadAndDisplayUserPools();
});

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
  



function createPlayerRow(memberData, isAdmin, totalMembers) {

    const playerRow = document.createElement('div');
    playerRow.className = 'player-row';
    
    const currentUsername = localStorage.getItem('username');
    if (currentUsername && memberData.username.toLowerCase() === currentUsername.toLowerCase()) {
        playerRow.classList.add('current-user-row');
        }

     // Check for special backgrounds
     let playerUserStyle = '';
     const username = memberData.username.toLowerCase();
     
     if (username === 'huh') {
         playerUserStyle = `style="background-image: url('Immaculate Week.gif'); background-size: cover; background-position: center;Color: White; text-shadow: 
               -1px -1px 0 black,  
         1px -1px 0 black,
        -1px  1px 0 black,
         1px  1px 0 black;"`;
     } else if (username === 'slangmastergeneral') {
         playerUserStyle = `style="background-image: url('MajorMLNewgif.gif'); background-size: cover; background-position: center; text-shadow: 
           -1px -1px 0 black,  
         1px -1px 0 black,
        -1px  1px 0 black,
         1px  1px 0 black;"`;
       } else if (username === 'reallylongnameeee') {
        playerUserStyle = `style="background-image: url('MajorMLgif.gif'); background-size: cover; background-position: center; Color: White; text-shadow: 
           -1px -1px 0 black,  
         1px -1px 0 black,
        -1px  1px 0 black,
         1px  1px 0 black;"`;
    }else if (username === 'yuh') {
        playerUserStyle = `style="background-image: url('Colonel Covers.gif'); background-size: cover; background-position: center; Color: White; text-shadow: 
           -1px -1px 0 black,  
         1px -1px 0 black,
        -1px  1px 0 black,
         1px  1px 0 black;"`;
    }
    else if (username === 'sohigs') {
        playerUserStyle = `style="background-image: url('Devastating Week.gif'); background-size: cover; background-position: center; Color: White; text-shadow: 
           -1px -1px 0 black,  
         1px -1px 0 black,
        -1px  1px 0 black,
         1px  1px 0 black;"`;
    }
    else if (username === 'yuh2') {
        playerUserStyle = `style="background-image: url('Mile High Club.gif'); background-size: cover; background-position: center; Color: White; text-shadow: 
           -1px -1px 0 black,  
         1px -1px 0 black,
        -1px  1px 0 black,
         1px  1px 0 black;"`;
     }
    else if (username === 'test1') {
        playerUserStyle = `style="background-image: url('Top Dog.png'); background-size: cover; background-position: center; Color: White; text-shadow: 
           -1px -1px 0 black,  
         1px -1px 0 black,
        -1px  1px 0 black,
         1px  1px 0 black;"`;
    } else if (username === 'immortaltest') {
        playerUserStyle = `style="background-image: url('Immortal Legend.png'); background-size: cover; background-position: center; Color: White; text-shadow: 
           -1px -1px 0 black,  
         1px -1px 0 black,
        -1px  1px 0 black,
         1px  1px 0 black;"`;
     }
    else if (username === 'yuh3') {
        playerUserStyle = `style="background-image: url('Genius or Dunce.gif'); background-size: cover; background-position: center; Color: White; text-shadow: 
           -1px -1px 0 black,  
         1px -1px 0 black,
        -1px  1px 0 black,
         1px  1px 0 black;"`;
     }  else if (username === 'ztest') {
        playerUserStyle = `style="background-image: url('Runt.gif'); background-size: cover; background-position: center; Color: White; text-shadow: 
           -1px -1px 0 black,  
         1px -1px 0 black,
        -1px  1px 0 black,
         1px  1px 0 black;"`;
     }else if (username === 'lopotest') {
        playerUserStyle = `style="background-image: url('Nose Dive.png'); background-size: cover; background-position: center; Color: White; text-shadow: 
           -1px -1px 0 black,  
         1px -1px 0 black,
        -1px  1px 0 black,
         1px  1px 0 black;"`;
        }else if (username === 'zing') {
            playerUserStyle = `style="background-image: url('Doctor Who.png'); background-size: cover; background-position: center; Color: White; text-shadow: 
               -1px -1px 0 black,  
             1px -1px 0 black,
            -1px  1px 0 black,
             1px  1px 0 black;"`;
            }
            else if (username === 'zeta') {
                playerUserStyle = `style="background-image: url('Sisyphus.png'); background-size: cover; background-position: center; Color: White; text-shadow: 
                   -1px -1px 0 black,  
                 1px -1px 0 black,
                -1px  1px 0 black,
                 1px  1px 0 black;"`;
                }
     playerRow.innerHTML = `
         <div class="player-user" ${playerUserStyle}>
             <div class="player-profile-pic" style="background-image: url('${memberData.profilePic}')"></div>
             <span class="player-username">${memberData.username}</span>
         </div>
         <div class="player-rank">${memberData.rank}</div>
         <div class="player-points">${memberData.points}</div>
         <div class="player-picks"></div>
         <div class="player-immortal-lock"></div>
         <div class="player-win">${memberData.wins}</div>
         <div class="player-loss">${memberData.losses}</div>
         <div class="player-push">${memberData.pushes}</div>
     `;
    /*
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
    `;*/

    if (isAdmin) {
        const userSection = playerRow.querySelector('.player-user');
        const adminBadge = document.createElement('i');
        adminBadge.classList.add('fas', 'fa-shield', 'admin-badge');
        adminBadge.setAttribute('title', 'Admin');
        userSection.appendChild(adminBadge);
    }

    if (memberData.rank === 1) {
        const userSection = playerRow.querySelector('.player-user');
        const crownIcon = document.createElement('i');
        crownIcon.classList.add('fas', 'fa-crown', 'crown-icon');
        crownIcon.setAttribute('title', '1st Place');
        userSection.appendChild(crownIcon);
    }

    if (memberData.rank === totalMembers) {
        const userSection = playerRow.querySelector('.player-user');
        const poopIcon = document.createElement('i');
        poopIcon.classList.add('fas', 'fa-poop', 'dunce-icon');
        poopIcon.setAttribute('title', 'Dunce');
        userSection.appendChild(poopIcon);
    }

    const picksContainer = playerRow.querySelector('.player-picks');
    if (Array.isArray(memberData.picks)) {
        memberData.picks.forEach(pick => {
            const pickElement = document.createElement('div');
            pickElement.className = 'pick';
            pickElement.textContent = pick;
            picksContainer.appendChild(pickElement);
        });
    }

    return playerRow;
}


function deletePool(poolName) {
    const encodedPoolName = encodeURIComponent(poolName);

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
            const poolElement = document.querySelector(`[data-pool-name='${CSS.escape(poolName)}']`);
            if (poolElement) {
                poolElement.remove();
            }
            // Update the actions list
            updatePoolActionsList();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the pool.');
    });
}

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
        // Update the actions list
        updatePoolActionsList();
    })
    .catch(error => {
        console.error('Error leaving the pool:', error);
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
    const joinPoolForm = document.getElementById('join-pool-form-container'); 
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




  //var gameScores = {};

  var gameScores = [];

  


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
const usernames = [
    'tz', 'gilb17', 'keee', 'helen hlushko', 'brett.niermeier',
    'chrisruiz', 'liam azar', 'pedrissimo', 'patrickbrow', 'bear jew',
    'slimjesus', 'upperdeckysiuuup', 'matt allegretti', 'slangmastergeneral',
    'waltuh', 'azink', 'fallegretti', 'kevdoer island', 'keys to the yard',
    'mak4532', 'primitive picks', 'midnight professional', 'parlay prodigy'
  ];
  
  usernames.forEach(username => {
    resetUserStats(username, 'The Gauntlet');
    changeUserPoints(username, 0, 'The Gauntlet');
  });
//resetUserStats('kevdoer island', 'The Gauntlet');

//changeUserPoints('kevdoer island', 0, 'The Gauntlet'); 
*/// Replace with the actual username, new points value, and pool name

// Function to fetch survivor status
async function fetchSurvivorStatus(username, poolName) {
    try {
        const encodedUsername = encodeURIComponent(username);
        const encodedPoolName = encodeURIComponent(poolName);
        
        const response = await fetch(`/pools/getSurvivorStatus/${encodedUsername}/${encodedPoolName}`);
        
        // Check if response is ok and is JSON
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        const data = await response.json();
        return data.status || 'active'; // Return status or default to active
    } catch (error) {
        console.error('Error fetching survivor status:', error);
        return 'active'; // Default to active if there's an error
    }
}


// Helper function to check if response is valid JSON
async function isJsonResponse(response) {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        return false;
    }
    try {
        await response.json();
        return true;
    } catch {
        return false;
    }
}
// First, add this helper function to fetch elimination info
async function fetchEliminationInfo(username, poolName) {
    try {
        const encodedUsername = encodeURIComponent(username);
        const encodedPoolName = encodeURIComponent(poolName);
        
        const response = await fetch(`/pools/getEliminationInfo/${encodedUsername}/${encodedPoolName}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching elimination info:', error);
        return { isEliminated: false, eliminationWeek: null };
    }
}

// Updated createSurvivorPlayerRow function with elimination week info
function createSurvivorPlayerRow(memberData, currentUsername) {
    const playerRow = document.createElement('div');
    playerRow.className = 'survivor-player-row';
    
    if (memberData.username.toLowerCase() === currentUsername.toLowerCase()) {
        playerRow.classList.add('survivor-current-user-row');
    }

    if (memberData.isEliminated) {
        playerRow.classList.add('eliminated-player');
        
        // Create the structure first without elimination info
        playerRow.innerHTML = `
            <div class="survivor-player-user">
                <div class="survivor-profile-pic" style="background-image: url('${memberData.profilePic || 'Default.png'}')"></div>
                <span class="player-username">${memberData.username}</span>
            </div>
            <div class="survivor-player-picks"></div>
            <div class="survivor-player-eliminated">
                <span class="eliminated-status">
                    ELIMINATED
                    <span class="week-info"></span>
                </span>
            </div>
        `;
        
        // After creating the structure, fetch the elimination info
        fetchEliminationInfo(memberData.username, localStorage.getItem('currentPoolName'))
            .then(eliminationInfo => {
                const weekInfo = playerRow.querySelector('.week-info');
                if (eliminationInfo.eliminationWeek) {
                    weekInfo.innerHTML = `<span class="week-number">(Week ${eliminationInfo.eliminationWeek})</span>`;
                }
            })
            .catch(error => {
                console.error('Error fetching elimination info:', error);
            });
    } else {
        playerRow.innerHTML = `
            <div class="survivor-player-user">
                <div class="survivor-profile-pic" style="background-image: url('${memberData.profilePic || 'Default.png'}')"></div>
                <span class="player-username">${memberData.username}</span>
            </div>
            <div class="survivor-player-picks"></div>
            <div class="survivor-player-eliminated">
                <span class="active-status">ACTIVE</span>
            </div>
        `;
    }

    return playerRow;
}

// Complete displaySurvivorPool function with all changes
async function displaySurvivorPool(pool) {
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

    let username = localStorage.getItem('username');
    if (!username) {
        console.error('No logged-in user found!');
        return;
    }

    username = username.toLowerCase();

    // Set the current pool name in localStorage for later use
    localStorage.setItem('currentPoolName', pool.name);

    // Find or create ordered container
    let orderedContainer = document.getElementById('ordered-pools-container');
    if (!orderedContainer) {
        orderedContainer = document.createElement('div');
        orderedContainer.id = 'ordered-pools-container';
        document.getElementById('pool-container-wrapper').appendChild(orderedContainer);
    }

    const poolWrapper = document.createElement('div');
    poolWrapper.className = 'pool-wrapper survivor-mode';
    poolWrapper.setAttribute('data-pool-name', pool.name);
    poolWrapper.setAttribute('data-admin-username', pool.adminUsername);
    
    const memberOrder = pool.members.find(m => 
        m.username.toLowerCase() === username.toLowerCase()
    )?.orderIndex ?? 0;
    
    poolWrapper.style.order = -memberOrder;

    // Pool name container
    const poolNameContainer = document.createElement('div');
    poolNameContainer.className = 'pool-name-container';
    
    const poolNameDiv = document.createElement('div');
    poolNameDiv.className = 'survivor-pool-name';
    poolNameDiv.innerText = pool.name;

    // Stats container for counts
    const statsContainer = document.createElement('div');
    statsContainer.className = 'survivor-stats-container';
    statsContainer.style.display = 'flex';
    statsContainer.style.gap = '10px';

    // Total user count
    const userCountDiv = document.createElement('div');
    userCountDiv.className = 'survivor-user-count';
    userCountDiv.innerHTML = `
        <i class="fas fa-users"></i>
        <span>${pool.members.length}</span>
    `;

    // Active players count
    const activeCountDiv = document.createElement('div');
    activeCountDiv.className = 'survivor-user-count';
    activeCountDiv.innerHTML = `
        <i class="fas fa-user-check"></i>
        <span>Players Remaining: Loading...</span>
    `;

    statsContainer.appendChild(userCountDiv);
    statsContainer.appendChild(activeCountDiv);

    poolNameContainer.appendChild(poolNameDiv);
    poolNameContainer.appendChild(statsContainer);

    // Create scrollable container
    const poolScrollableContainer = document.createElement('div');
    poolScrollableContainer.className = 'pool-scrollable-container';

    // Create pool container
    const poolContainer = document.createElement('div');
    poolContainer.className = 'survivor-pool-container';

    // Create header
    const poolHeader = document.createElement('div');
    poolHeader.className = 'survivor-pool-header';
    poolHeader.innerHTML = `
        <span class="survivor-header-user">USER</span>
        <span class="survivor-header-picks">PICK</span>
        <span class="survivor-header-eliminated">STATUS</span>
    `;
    poolContainer.appendChild(poolHeader);

    try {
        const currentUsername = localStorage.getItem('username').toLowerCase();
        // Process members and fetch their statuses
        const membersData = await Promise.all(pool.members.map(async member => {
            try {
                const lowercaseUsername = member.username.toLowerCase();
                const userProfile = await fetchUserProfile(lowercaseUsername);
                const statusResponse = await fetch(`/pools/getSurvivorStatus/${encodeURIComponent(lowercaseUsername)}/${encodeURIComponent(pool.name)}`);
                const statusData = await statusResponse.json();
                return {
                    username: lowercaseUsername,
                    profilePic: userProfile.profilePicture,
                    isEliminated: statusData.status === 'eliminated',
                    isCurrentUser: lowercaseUsername === currentUsername
                };
            } catch (error) {
                console.error(`Error fetching data for member ${member.username}:`, error);
                return {
                    username: member.username.toLowerCase(),
                    profilePic: 'Default.png',
                    isEliminated: false,
                    isCurrentUser: member.username.toLowerCase() === currentUsername
                };
            }
        }));

        // Arrange players: current user first, then active players, then eliminated players
        const currentUser = membersData.find(p => p.isCurrentUser);
        const otherPlayers = membersData.filter(p => !p.isCurrentUser);
        const activePlayersList = otherPlayers.filter(p => !p.isEliminated);
        const eliminatedPlayers = otherPlayers.filter(p => p.isEliminated);
        
        // Update active players count
        const activePlayersCount = activePlayersList.length + (currentUser && !currentUser.isEliminated ? 1 : 0);
        activeCountDiv.innerHTML = `
            <i class="fas fa-user-check"></i>
            <span>Players Remaining: ${activePlayersCount}</span>
        `;

        const displayPlayers = [
            ...(currentUser ? [currentUser] : []),
            ...activePlayersList,
            ...eliminatedPlayers
        ];

        // Display first 10 players
        const initialPlayers = displayPlayers.slice(0, 10);
        for (const memberData of initialPlayers) {
            const playerRow = await createSurvivorPlayerRow(memberData, currentUsername);
            fetchPicks(memberData.username, pool.name, playerRow, teamLogos, true);
            poolContainer.appendChild(playerRow);
        }

        // Add show more button if there are more than 10 players
        if (displayPlayers.length > 10) {
            const showMoreButton = document.createElement('button');
            showMoreButton.className = 'survivor-show-more-button';
            showMoreButton.innerHTML = `
                <i class="fas fa-chevron-down"></i>
                <i class="fas fa-users" style="font-size: 0.9em"></i>
                <span>show ${displayPlayers.length - 10} more</span>
            `;

            let expanded = false;
            showMoreButton.addEventListener('click', async () => {
                if (!expanded) {
                    const remainingPlayers = displayPlayers.slice(10);
                    for (const memberData of remainingPlayers) {
                        const playerRow = await createSurvivorPlayerRow(memberData, currentUsername);
                        fetchPicks(memberData.username, pool.name, playerRow, teamLogos, true);
                        poolContainer.appendChild(playerRow);
                    }
                    showMoreButton.innerHTML = `
                        <i class="fas fa-chevron-up"></i>
                        <i class="fas fa-users" style="font-size: 0.9em"></i>
                        <span>show less</span>
                    `;
                } else {
                    const allRows = poolContainer.querySelectorAll('.survivor-player-row');
                    Array.from(allRows).slice(10).forEach(row => row.remove());
                    showMoreButton.innerHTML = `
                        <i class="fas fa-chevron-down"></i>
                        <i class="fas fa-users" style="font-size: 0.9em"></i>
                        <span>show ${displayPlayers.length - 10} more</span>
                    `;
                }
                expanded = !expanded;
            });

            poolScrollableContainer.appendChild(poolContainer);
            poolScrollableContainer.appendChild(showMoreButton);
        } else {
            poolScrollableContainer.appendChild(poolContainer);
        }

        poolWrapper.appendChild(poolNameContainer);
        poolWrapper.appendChild(poolScrollableContainer);

        // Add chat container from template
        const chatTemplate = document.getElementById('chat-template').content.cloneNode(true);
        poolWrapper.appendChild(chatTemplate);

        orderedContainer.appendChild(poolWrapper);

        // Update pool actions list after adding pool
        setTimeout(() => {
            updatePoolActionsList();
        }, 100);

    } catch (error) {
        console.error('Error displaying survivor pool:', error);
    }
}



// Helper function to add pool controls (admin/leave buttons)
function addPoolControls(poolWrapper, pool, currentUsername) {
    const isAdmin = currentUsername.toLowerCase() === pool.adminUsername.toLowerCase();
    
    if (isAdmin) {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Pool';
        deleteButton.className = 'delete-pool-button';
        deleteButton.setAttribute('data-pool-name', pool.name);
        deleteButton.addEventListener('click', function() {
            const confirmation = confirm(`Are you sure you want to delete the pool "${pool.name}"?`);
            if (confirmation) {
                deletePool(pool.name);
            }
        });
        poolWrapper.appendChild(deleteButton);
    } else {
        const leaveButton = document.createElement('button');
        leaveButton.textContent = 'Leave Pool';
        leaveButton.className = 'leave-pool-button';
        leaveButton.setAttribute('data-pool-name', pool.name);
        leaveButton.addEventListener('click', function() {
            const confirmation = confirm(`Are you sure you want to leave the pool "${pool.name}"?`);
            if (confirmation) {
                leavePool(pool.name);
            }
        });
        poolWrapper.appendChild(leaveButton);
    }
}


// Add this function to your existing homepage.js
// This will display playoff pools in a bracket format

function displayPlayoffPool(pool) {
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

    let username = localStorage.getItem('username');
    if (!username) {
        console.error('No logged-in user found!');
        return;
    }

    // Find or create ordered container
    let orderedContainer = document.getElementById('ordered-pools-container');
    if (!orderedContainer) {
        orderedContainer = document.createElement('div');
        orderedContainer.id = 'ordered-pools-container';
        document.getElementById('pool-container-wrapper').appendChild(orderedContainer);
    }

    username = username.toLowerCase();
    const isAdmin = username === pool.adminUsername.toLowerCase();

    const poolWrapper = document.createElement('div');
    poolWrapper.className = 'pool-wrapper playoff-mode';
    poolWrapper.setAttribute('data-pool-name', pool.name);
    poolWrapper.setAttribute('data-admin-username', pool.adminUsername);

    // Get member's order index
    const memberOrder = pool.members.find(m => 
        m.username.toLowerCase() === username.toLowerCase()
    )?.orderIndex ?? 0;
    
    // Use negative order to reverse the display order (higher index = higher position)
    poolWrapper.style.order = -memberOrder;

    const poolNameContainer = document.createElement('div');
    poolNameContainer.className = 'pool-name-container';
    
    const poolNameDiv = document.createElement('div');
    poolNameDiv.className = 'pool-name playoff-pool-name';
    poolNameDiv.innerHTML = `${pool.name} <span class="playoff-badge">PLAYOFFS</span>`;

    const poolControls = document.createElement('div');
    poolControls.className = 'pool-controls';
    
    const userCountDiv = document.createElement('div');
    userCountDiv.className = 'user-count playoff-user-count';
    userCountDiv.innerHTML = `
        <i class="fas fa-trophy"></i>
        <span id="playoffMemberCount-${pool.name}">Loading...</span>
    `;

    poolNameContainer.appendChild(poolNameDiv);
    poolNameContainer.appendChild(userCountDiv);
    poolNameContainer.appendChild(poolControls);
    
    // Create the playoff bracket container
    const poolScrollableContainer = document.createElement('div');
    poolScrollableContainer.className = 'pool-scrollable-container';

    const playoffBracketContainer = document.createElement('div');
    playoffBracketContainer.className = 'playoff-bracket-container';
    playoffBracketContainer.id = `playoff-bracket-${pool.name.replace(/\s+/g, '-')}`;
    playoffBracketContainer.innerHTML = `
        <div class="playoff-loading">
            <div class="playoff-spinner"></div>
            <p>Loading playoff bracket...</p>
        </div>
    `;
    
    poolScrollableContainer.appendChild(playoffBracketContainer);
    poolWrapper.appendChild(poolNameContainer);
    poolWrapper.appendChild(poolScrollableContainer);

    // Add to ordered container
    orderedContainer.appendChild(poolWrapper);

    // Add chat container from template
    const chatTemplate = document.getElementById('chat-template').content.cloneNode(true);
    poolWrapper.appendChild(chatTemplate);

        
        // Add event listener to close button
        document.getElementById('close-picks-panel-btn').addEventListener('click', () => {
            picksPanel.classList.remove('open');
        });
    }

    // Fetch and display bracket data
    fetchPlayoffBracket(pool.name);
    
    // Update pool actions list after adding pool
    setTimeout(() => {
        updatePoolActionsList();
    }, 100);


// Add this code to initialize the playoffs checkbox visibility
// 1. Make sure this code is in your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for the form submission
    const createPoolForm = document.getElementById('create-pool-form');
    
    if (createPoolForm) {
        createPoolForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const poolName = this.querySelector('input[type="text"]').value.trim();
            const poolPassword = this.querySelector('input[type="password"]')?.value;
            
            // Get privacy setting
            const privacyBtn = document.getElementById('privacy-btn');
            const isPrivate = privacyBtn.classList.contains('private');
            
            // Get mode setting
            const activeMode = document.querySelector('.mode-card.active');
            const selectedMode = activeMode ? activeMode.dataset.mode : 'classic';
            
            // Get hasPlayoffs setting (only applicable for classic mode)
            const hasPlayoffsCheckbox = document.getElementById('hasPlayoffs');
            const hasPlayoffs = hasPlayoffsCheckbox && hasPlayoffsCheckbox.checked;
            
            // Get username from local storage
            const username = localStorage.getItem('username');
            if (!username) {
                alert('Username not found. Please log in again.');
                return;
            }
            
            // Log what we're about to send
            console.log('Creating pool with:', {
                name: poolName,
                isPrivate,
                mode: selectedMode,
                hasPlayoffs: hasPlayoffs,
                adminUsername: username
            });
            
            // Prepare request payload
            const payload = {
                name: poolName,
                isPrivate,
                adminUsername: username.toLowerCase(),
                mode: selectedMode,
                hasPlayoffs: selectedMode === 'classic' ? hasPlayoffs : false
            };
            
            // Add password if private
            if (isPrivate && poolPassword) {
                payload.password = poolPassword;
            }
            
            try {
                const response = await fetch('/pools/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                // Check for HTTP error responses
                if (!response.ok) {
                    if (response.status === 409) {
                        throw new Error('The pool name is already taken. Please choose another name.');
                    }
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Log the response
                console.log('Server response:', data);
                
                if (data.message && data.pool) {
                    // Show success message
                    alert('Pool created successfully!');
                    
                    // Force page reload
                    window.location.reload();
                } else {
                    alert('Unexpected response from server.');
                }
            } catch (error) {
                console.error('Error creating pool:', error);
                alert(error.message || 'An error occurred while creating the pool.');
            }
        });
    } else {
        console.warn('Create pool form not found in the DOM');
    }
});

// Enhanced fetchPlayoffBracket function with better error handling
async function fetchPlayoffBracket(poolName) {
    console.log(`Fetching playoff bracket for pool: ${poolName}`);
    const bracketContainer = document.getElementById(`playoff-bracket-${poolName.replace(/\s+/g, '-')}`);
    const memberCountElement = document.getElementById(`playoffMemberCount-${poolName}`);
    
    if (!bracketContainer) {
        console.error(`Bracket container not found for pool: ${poolName}`);
        return;
    }
    
    try {
        const encodedPoolName = encodeURIComponent(poolName);
        const url = `/api/playoffs/${encodedPoolName}/bracket`;
        console.log(`Fetching bracket data from: ${url}`);
        
        const response = await fetch(url);
        console.log(`Bracket API response status: ${response.status}`);
        
        if (!response.ok) {
            console.error(`Failed to fetch bracket data: ${response.status}`);
            throw new Error(`Failed to fetch bracket data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Bracket API response data:', data);
        
        if (data.success && data.bracket) {
            console.log('Rendering bracket with data:', data.bracket);
            renderBracket(data.bracket, bracketContainer, poolName);
            
            // Update member count
            if (memberCountElement && data.bracket.members) {
                const activeMemberCount = data.bracket.members.filter(m => !m.eliminated).length;
                memberCountElement.textContent = `${activeMemberCount} Players Remaining`;
            }
        } else {
            console.error('API returned success: false or missing bracket data');
            bracketContainer.innerHTML = `
                <div class="playoff-error">
                    <p>${data.message || 'Failed to load bracket data'}</p>
                    <button onclick="fetchPlayoffBracket('${poolName}')" class="playoff-retry-btn">Retry</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching bracket data:', error);
        bracketContainer.innerHTML = `
            <div class="playoff-error">
                <p>Error: ${error.message || 'An error occurred'}</p>
                <button onclick="fetchPlayoffBracket('${poolName}')" class="playoff-retry-btn">Retry</button>
            </div>
        `;
    }
}

// Helper function to get team logos
function getTeamLogos() {
    return {
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
}

// Modified loadAndDisplayUserPools function to integrate playoff brackets with regular pools
async function loadAndDisplayUserPools() {
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername) {
        console.error('No logged-in user found!');
        return;
    }

    const poolContainerWrapper = document.getElementById('pool-container-wrapper');
    if (!poolContainerWrapper) {
        console.error('Pool container wrapper not found');
        return;
    }
    
    poolContainerWrapper.innerHTML = '';
    const newOrderedContainer = document.createElement('div');
    newOrderedContainer.id = 'ordered-pools-container';
    newOrderedContainer.style.display = 'flex';
    poolContainerWrapper.appendChild(newOrderedContainer);
    
    try {
        const response = await fetch(`/pools/userPools/${encodeURIComponent(currentUsername.toLowerCase())}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const pools = await response.json();
        
        // Get current week to check for playoff time
        const weekResponse = await fetch('/getCurrentWeek');
        let currentWeek = 1;
        
        if (weekResponse.ok) {
            const weekData = await weekResponse.json();
            currentWeek = parseInt(weekData.week) || 1;
        }
        
        // For testing purposes, you can force this to true
        // In production, uncomment the line below
        // const isPlayoffTime = currentWeek >= 14 && currentWeek <= 17;
        const isPlayoffTime = true; // For testing, force playoff time
        
        // Sort pools by orderIndex
        pools.sort((a, b) => {
            const memberA = a.members.find(m => m.username.toLowerCase() === currentUsername.toLowerCase());
            const memberB = b.members.find(m => m.username.toLowerCase() === currentUsername.toLowerCase());
            
            const orderA = memberA?.orderIndex ?? 0;
            const orderB = memberB?.orderIndex ?? 0;
            
            if (orderA !== orderB) {
                return orderB - orderA;
            }
            return a.name.localeCompare(b.name);
        });
        
        // Process each pool
        for (const pool of pools) {
            if (pool.mode === 'survivor') {
                // Regular survivor pool
                await displaySurvivorPool(pool);
            } else {
                // For classic pools, display them with playoff bracket if enabled and in playoff time
                const hasPlayoffBracket = pool.mode === 'classic' && pool.hasPlayoffs && isPlayoffTime;
                await displayNewPoolContainer(pool, hasPlayoffBracket);
            }
        }
        
        // Update pool actions list
        requestAnimationFrame(() => {
            updatePoolActionsList();
        });
        
    } catch (error) {
        console.error('Error fetching or processing pools:', error);
    }
}

// Modified displayNewPoolContainer to include the playoff bracket
async function displayNewPoolContainer(pool, includePlayoffBracket = false) {
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

    let username = localStorage.getItem('username');
    if (!username) {
        console.error('No logged-in user found!');
        return;
    }

    // Find or create ordered container
    let orderedContainer = document.getElementById('ordered-pools-container');
    if (!orderedContainer) {
        orderedContainer = document.createElement('div');
        orderedContainer.id = 'ordered-pools-container';
        document.getElementById('pool-container-wrapper').appendChild(orderedContainer);
    }

    username = username.toLowerCase();
    const isAdmin = username === pool.adminUsername.toLowerCase();

    const poolWrapper = document.createElement('div');
    poolWrapper.className = 'pool-wrapper';
    poolWrapper.setAttribute('data-pool-name', pool.name);
    poolWrapper.setAttribute('data-admin-username', pool.adminUsername);

    // Get member's order index
    const memberOrder = pool.members.find(m => 
        m.username.toLowerCase() === username.toLowerCase()
    )?.orderIndex ?? 0;
    
    // Use negative order to reverse the display order (higher index = higher position)
    poolWrapper.style.order = -memberOrder;

    // Add playoff bracket section if needed
    if (includePlayoffBracket) {
        const playoffSection = document.createElement('div');
        playoffSection.className = 'playoff-bracket-section';
        
        const playoffTitleBar = document.createElement('div');
        playoffTitleBar.className = 'playoff-title-bar';
        playoffTitleBar.innerHTML = `
            <h3><span class="playoff-icon"><i class="fas fa-trophy"></i></span> ${pool.name} Playoff Bracket</h3>
            <div class="playoff-user-count">
                <i class="fas fa-users"></i>
                <span id="playoffMemberCount-${pool.name}">Loading...</span>
            </div>
        `;
        
        const playoffBracketContainer = document.createElement('div');
        playoffBracketContainer.className = 'playoff-bracket-container';
        playoffBracketContainer.id = `playoff-bracket-${pool.name.replace(/\s+/g, '-')}`;
        playoffBracketContainer.innerHTML = `
            <div class="playoff-loading">
                <div class="playoff-spinner"></div>
                <p>Loading playoff bracket...</p>
            </div>
        `;
        
        playoffSection.appendChild(playoffTitleBar);
        playoffSection.appendChild(playoffBracketContainer);
        poolWrapper.appendChild(playoffSection);
        
        // We'll fetch the bracket data later after appending to DOM
    }

    // Continue with regular pool display
    const poolNameContainer = document.createElement('div');
    poolNameContainer.className = 'pool-name-container';
    
    const poolNameDiv = document.createElement('div');
    poolNameDiv.className = 'pool-name';
    poolNameDiv.innerText = pool.name;

    const poolControls = document.createElement('div');
    poolControls.className = 'pool-controls';
    
    const userCountDiv = document.createElement('div');
    userCountDiv.className = 'user-count';
    userCountDiv.innerHTML = `
        <i class="fas fa-users"></i>
        <span>${pool.members.length}</span>
    `;

    const viewDropdown = document.createElement('div');
    viewDropdown.className = 'view-selector-container';
    viewDropdown.innerHTML = `
        <select class="view-selector">
            <option value="aroundMe">Around Me</option>
            <option value="all">All Players</option>
        </select>
        <span class="dropdown-arrow">▼</span>
    `;

    const select = viewDropdown.querySelector('select');
    select.addEventListener('change', (e) => {
        setTimeout(() => {
            const container = poolContainer;
            const allRows = [...container.querySelectorAll('.player-row')];
            const currentUserRow = container.querySelector('.current-user-row');
            const currentUserIndex = allRows.indexOf(currentUserRow);
            
            // Hide all rows initially
            allRows.forEach(row => row.style.display = 'none');
            
            if (e.target.value === 'aroundMe' && currentUserRow) {
                let startIndex = 0;
                let endIndex = Math.min(10, allRows.length);

                if (currentUserIndex >= 5 && currentUserIndex < allRows.length - 5) {
                    startIndex = currentUserIndex - 5;
                    endIndex = currentUserIndex + 5;
                } else if (currentUserIndex >= allRows.length - 5) {
                    startIndex = Math.max(0, allRows.length - 10);
                    endIndex = allRows.length;
                }

                for (let i = startIndex; i < endIndex; i++) {
                    allRows[i].style.display = '';
                }
            } else {
                allRows.slice(0, 10).forEach(row => row.style.display = '');
                allRows.slice(10).forEach(row => row.style.display = 'none');

                if (allRows.length > 10) {
                    const showMoreButton = document.createElement('button');
                    showMoreButton.className = 'show-more-button';
                    showMoreButton.innerHTML = `
                        <i class="fas fa-chevron-down"></i>
                        <i class="fas fa-users" style="font-size: 0.9em"></i>
                        <span>show ${allRows.length - 10} more</span>
                    `;
                    
                    // Add inline styles to ensure visibility
                    showMoreButton.style.display = 'flex';
                    showMoreButton.style.position = 'relative';
                    showMoreButton.style.zIndex = '100';
                    showMoreButton.style.visibility = 'visible';
                    showMoreButton.style.opacity = '1';
                    
                    let expanded = false;
                    showMoreButton.addEventListener('click', () => {
                        if (!expanded) {
                            allRows.forEach(row => row.style.display = '');
                            showMoreButton.innerHTML = `
                                <i class="fas fa-chevron-up"></i>
                                <i class="fas fa-users" style="font-size: 0.9em"></i>
                                <span>show less</span>
                            `;
                            showMoreButton.classList.add('expanded');
                        } else {
                            allRows.forEach((row, index) => {
                                row.style.display = index < 10 ? '' : 'none';
                            });
                            showMoreButton.innerHTML = `
                                <i class="fas fa-chevron-down"></i>
                                <i class="fas fa-users" style="font-size: 0.9em"></i>
                                <span>show ${allRows.length - 10} more</span>
                            `;
                            showMoreButton.classList.remove('expanded');
                        }
                        expanded = !expanded;
                    });
                
                    // Remove any existing button
                    const existingButton = document.querySelector('.show-more-button');
                    if (existingButton) existingButton.remove();
                    
                    // Append the button AFTER the pool container to ensure it's visible
                    const poolWrapper = poolScrollableContainer.closest('.pool-wrapper');
                    poolWrapper.appendChild(showMoreButton);
                }
            }
        }, 100);
    });

    poolNameContainer.appendChild(poolNameDiv);
    poolNameContainer.appendChild(userCountDiv);
    poolNameContainer.appendChild(viewDropdown);
    poolNameContainer.appendChild(poolControls);
    
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
        <span class="header-picks">Picks</span>
        <span class="header-immortal-lock"><i class="fas fa-lock"></i></span>
        <span class="header-win">Win</span>
        <span class="header-loss">Loss</span>
        <span class="header-push">Push</span>
    `;
    poolContainer.appendChild(poolHeader);

    pool.members.sort((a, b) => b.points - a.points || a.username.localeCompare(b.username));

    const memberDataPromises = pool.members.map(member => 
        fetchUserProfile(member.username).then(userProfile => ({
            rank: pool.members.indexOf(member) + 1,
            username: userProfile.username,
            profilePic: userProfile.profilePicture,
            points: member.points,
            wins: member.win,
            losses: member.loss,
            pushes: member.push
        }))
    );

    Promise.all(memberDataPromises).then(membersData => {
        membersData.forEach(memberData => {
            const playerRow = createPlayerRow(memberData, memberData.username === pool.adminUsername, pool.members.length);
            fetchPicks(memberData.username, pool.name, playerRow, teamLogos);
            poolContainer.appendChild(playerRow);
        });

        poolScrollableContainer.appendChild(poolContainer);
        poolWrapper.appendChild(poolNameContainer);
        poolWrapper.appendChild(poolScrollableContainer);

        // Append chat container from template
        const chatTemplate = document.getElementById('chat-template').content.cloneNode(true);
        poolWrapper.appendChild(chatTemplate);

        // Add to ordered container
        orderedContainer.appendChild(poolWrapper);

        // If we have a playoff bracket, fetch the data now
        if (includePlayoffBracket) {
            
            
            // Fetch and display bracket data
            fetchPlayoffBracket(pool.name);
        }

        setTimeout(() => {
            select.value = 'aroundMe';
            select.dispatchEvent(new Event('change'));
        }, 100);

        setTimeout(() => {
            checkCurrentTimeWindow();
        }, 50);

        // Update pool actions list after adding pool
        updatePoolActionsList();
    }).catch(error => {
        console.error('Error fetching member data:', error);
    });
}

// New function to display only the playoff bracket without the regular pool
async function displayPlayoffBracketOnly(pool) {
    let username = localStorage.getItem('username');
    if (!username) {
        console.error('No logged-in user found!');
        return;
    }

    // Find ordered container
    let orderedContainer = document.getElementById('ordered-pools-container');
    if (!orderedContainer) {
        console.error('Ordered container not found');
        return;
    }

    username = username.toLowerCase();
    const isAdmin = username === pool.adminUsername.toLowerCase();

    const poolWrapper = document.createElement('div');
    poolWrapper.className = 'pool-wrapper playoff-mode playoff-bracket-only';
    poolWrapper.setAttribute('data-pool-name', `playoff_bracket_${pool.name}`);
    poolWrapper.setAttribute('data-admin-username', pool.adminUsername);

    // Get member's order index
    const memberOrder = pool.members.find(m => 
        m.username.toLowerCase() === username.toLowerCase()
    )?.orderIndex ?? 0;
    
    // Use negative order and subtract 0.5 to ensure bracket appears before regular pool
    poolWrapper.style.order = -(memberOrder + 0.5);

    const poolNameContainer = document.createElement('div');
    poolNameContainer.className = 'pool-name-container';
    
    const poolNameDiv = document.createElement('div');
    poolNameDiv.className = 'pool-name playoff-pool-name';
    poolNameDiv.innerHTML = `${pool.name} <span class="playoff-badge">PLAYOFF BRACKET</span>`;

    const userCountDiv = document.createElement('div');
    userCountDiv.className = 'user-count playoff-user-count';
    userCountDiv.innerHTML = `
        <i class="fas fa-trophy"></i>
        <span id="playoffMemberCount-${pool.name}">Loading...</span>
    `;

    poolNameContainer.appendChild(poolNameDiv);
    poolNameContainer.appendChild(userCountDiv);
    
    // Create the playoff bracket container
    const poolScrollableContainer = document.createElement('div');
    poolScrollableContainer.className = 'pool-scrollable-container';

    const playoffBracketContainer = document.createElement('div');
    playoffBracketContainer.className = 'playoff-bracket-container';
    playoffBracketContainer.id = `playoff-bracket-${pool.name.replace(/\s+/g, '-')}`;
    playoffBracketContainer.innerHTML = `
        <div class="playoff-loading">
            <div class="playoff-spinner"></div>
            <p>Loading playoff bracket...</p>
        </div>
    `;
    
    poolScrollableContainer.appendChild(playoffBracketContainer);
    poolWrapper.appendChild(poolNameContainer);
    poolWrapper.appendChild(poolScrollableContainer);

    // Add to ordered container
    orderedContainer.appendChild(poolWrapper);

    // Add player picks panel if it doesn't exist
    if (!document.getElementById('playoff-player-picks-panel')) {
        const picksPanel = document.createElement('div');
        picksPanel.id = 'playoff-player-picks-panel';
        picksPanel.className = 'player-picks-panel';
        picksPanel.innerHTML = `
            <div class="panel-header">
                <h3 id="selected-player-name">Player Name</h3>
                <button id="close-picks-panel-btn" class="close-panel-btn">&times;</button>
            </div>
            <div class="player-record">
                <div class="record-item"><span>W:</span> <span id="player-wins">0</span></div>
                <div class="record-item"><span>L:</span> <span id="player-losses">0</span></div>
                <div class="record-item"><span>P:</span> <span id="player-pushes">0</span></div>
            </div>
            <div class="player-picks-container">
                <!-- This will be populated by JavaScript -->
            </div>
        `;
        document.body.appendChild(picksPanel);
        
        // Add event listener to close button
        document.getElementById('close-picks-panel-btn').addEventListener('click', () => {
            picksPanel.classList.remove('open');
        });
    }

    // Fetch and display bracket data
    fetchPlayoffBracket(pool.name);
}

// Modified fetchPicks function to handle playoff picks separately
async function fetchPicks(username, poolName, playerRow, teamLogos, isSurvivorPool = false, isPlayoffPool = false) {
    const encodedUsername = encodeURIComponent(username);
    // For playoff pools, we need to use the playoff_ prefix
    const actualPoolName = isPlayoffPool ? `playoff_${poolName}` : poolName;
    const encodedPoolName = encodeURIComponent(actualPoolName);
    
    const url = `/api/getPicks/${encodedUsername}/${encodedPoolName}`;

    try {
        const timePhase = await getCurrentTimePhase();
        const picksResponse = await fetch(url);
        
        if (!picksResponse.ok) {
            throw new Error(`HTTP error! status: ${picksResponse.status}`);
        }
        
        const picksData = await picksResponse.json();
        
        // Rest of the function remains the same...
        // This handles displaying picks based on the data received
        
        const picksContainer = playerRow.querySelector(isSurvivorPool ? '.survivor-player-picks' : '.player-picks');
        picksContainer.innerHTML = '';

        // Get reference to the immortal lock container (only for non-survivor pools)
        const immortalLockContainer = !isSurvivorPool ? playerRow.querySelector('.player-immortal-lock') : null;
        if (immortalLockContainer) immortalLockContainer.innerHTML = '';

        const isCurrentUser = username === localStorage.getItem('username').toLowerCase();

        if (picksData && picksData.picks && Array.isArray(picksData.picks)) {
            // Sort picks by commence time
            picksData.picks.sort((a, b) => new Date(a.commenceTime) - new Date(b.commenceTime));
            
            if (isCurrentUser) {
                // Current user always sees their own picks
                if (isSurvivorPool) {
                    // For survivor pools, only show the first pick
                    if (picksData.picks.length > 0) {
                        await displaySurvivorPick(picksData.picks[0], picksContainer, teamLogos);
                    }
                } else {
                    await displayAllPicks(picksData.picks, picksContainer, teamLogos);
                }
            } else {
                switch (timePhase) {
                    case 'pick':
                        if(!isSurvivorPool){
                            displayPickTimeBanner(picksContainer);
                        }
                        else{
                            displaySurvivorPickTimeBanner(picksContainer);
                        }
                        break;
                    case 'thursday':
                        console.log('Processing Thursday game time picks');
                        
                        if (isSurvivorPool) {
                            // For survivor pools, check if they have a Thursday pick
                            const thursdayPick = picksData.picks.find(pick => 
                                checkIfThursdayGame(pick.commenceTime)
                            );
                            
                            if (thursdayPick) {
                                // If they have a Thursday pick, display it
                                await displaySurvivorPick(thursdayPick, picksContainer, teamLogos);
                            } else if (picksData.picks.length > 0) {
                                // Only show the banner if they have submitted a pick (just not a Thursday one)
                                displaySurvivorPickTimeBanner(picksContainer);
                            }
                            // If they have no picks at all, leave it blank (do nothing)
                        } else {
                            // Regular pool logic (unchanged)
                            // Filter for Thursday night games
                            const thursdayPicks = picksData.picks.filter(pick => 
                                checkIfThursdayGame(pick.commenceTime)
                            );
                            
                            if (thursdayPicks.length > 0) {
                                // User has Thursday picks - display them
                                await displayAllPicks(thursdayPicks, picksContainer, teamLogos);
                                
                                // Show locked banner for remaining picks in regular pools
                                if (picksData.picks.length > thursdayPicks.length) {
                                    displayThursdayPickTimeBanner(picksContainer)
                                }
                            } else {
                                // User has no Thursday picks - show pick time banner
                                displayPickTimeBanner(picksContainer);
                            }
                        }
                        break;
                    case 'sunday':
                        // Show all picks during Sunday phase
                        if (isSurvivorPool) {
                            if (picksData.picks.length > 0) {
                                await displaySurvivorPick(picksData.picks[0], picksContainer, teamLogos);
                            }
                        } else {
                            await displayAllPicks(picksData.picks, picksContainer, teamLogos);
                        }
                        break;
                }
            }

            // Handle immortal lock display (only for non-survivor pools)
            if (!isSurvivorPool && immortalLockContainer && picksData.immortalLock && picksData.immortalLock.length > 0) {
                const immortalPick = picksData.immortalLock[0];
                
                if (isCurrentUser) {
                    // Always show current user's immortal lock
                    displayImmortalLock(immortalPick, immortalLockContainer, teamLogos);
                } else {
                    switch (timePhase) {
                        case 'pick':
                            // Don't show immortal lock during pick time
                            break;
                        case 'thursday':
                            // Show immortal lock only if it's a Thursday game
                            if (await checkIfThursdayGame(immortalPick.commenceTime)) {
                                displayImmortalLock(immortalPick, immortalLockContainer, teamLogos);
                            }
                            break;
                        case 'sunday':
                            // Show all immortal locks
                            displayImmortalLock(immortalPick, immortalLockContainer, teamLogos);
                            break;
                    }
                }
            }
        } else {
            // If there are no picks, display appropriate message but not for survivor pools in Thursday phase
            // For survivor pools with no picks during Thursday phase, leave it blank
            if (!(isSurvivorPool && timePhase === 'thursday')) {
                displayNoPicks(picksContainer);
            }
        }
    } catch (error) {
        console.error('Error fetching picks:', error);
        handleFetchError(playerRow);
    }
}


// Add this helper function to detect playoff pools
function isPlayoffPool(poolName) {
    // A pool is considered a playoff pool if:
    // 1. The currentWeek is >= 14 (playoff weeks)
    // 2. The pool has hasPlayoffs set to true
    // For simplicity, we can check if we already have a prefix,
    // or we can make a specific API call to determine this
    
    // For now, let's assume we have a global variable or can fetch this info
    return poolName.startsWith('playoff_') || 
           (window.currentWeek >= 14 && window.poolsWithPlayoffs.includes(poolName));
}

// Modified function to handle submission of playoff picks
async function submitPlayoffPicks(picks, poolName) {
    const username = localStorage.getItem('username');
    if (!username) {
        alert('You must be logged in to submit picks');
        return;
    }
    
    try {
        const response = await fetch(`/api/playoffs/${poolName}/picks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-username': username
            },
            body: JSON.stringify({ picks })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            alert('Playoff picks submitted successfully!');
            // Reload or update UI as needed
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error submitting playoff picks:', error);
        alert('An error occurred while submitting picks');
    }
}

// Function to correctly fetch picks for the playoff player popup
async function fetchPicksForPlayoffPlayer(username, poolName) {
    try {
        const encodedUsername = encodeURIComponent(username);
        const encodedPoolName = encodeURIComponent(`playoff_${poolName}`);
        const url = `/api/getPicks/${encodedUsername}/${encodedPoolName}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching playoff picks:', error);
        return { picks: [], immortalLock: [] };
    }
}

// Modify the rebuildUIWithResults function to handle playoff picks too

function rebuildUIWithResults(results) {
    // Get ALL picks, including those in playoff brackets
    const allPicks = document.querySelectorAll('.player-picks .pick, .immortal-lock, .playoff-bracket-container .pick-item');

    if (allPicks.length === 0) {
        console.warn('No pick elements found, check if the DOM has fully loaded');
        return;
    }

    console.log(`Processing ${results.length} results to match against ${allPicks.length} picks on screen.`);

    // Iterate over each pick element to process results
    allPicks.forEach(pickElement => {
        const teamLogo = pickElement.querySelector('.team-logo');
        const displayedBetValue = pickElement.querySelector('span')?.textContent.trim(); // Get the displayed bet value
        
        if (!teamLogo || !displayedBetValue) {
            console.warn('Team logo or bet value not found in pick element', pickElement);
            return; // Skip if no logo or value is found
        }
        
        const teamName = teamLogo.alt;
        
        // Determine if this is a playoff pick
        const isPlayoffPick = pickElement.closest('.playoff-bracket-container') !== null;
        
        // Find the result - match both regular and playoff picks
        let matchingResult;
        
        if (isPlayoffPick) {
            // For playoff picks, look for results that have the playoff_ prefix
            matchingResult = results.find(r => 
                r.teamName === teamName && 
                r.betValue.toString().trim() === displayedBetValue && 
                r.isPlayoffPick === true
            );
        } else {
            // For regular picks, exclude playoff picks
            matchingResult = results.find(r => 
                r.teamName === teamName && 
                r.betValue.toString().trim() === displayedBetValue && 
                !r.isPlayoffPick
            );
        }

        if (matchingResult) {
            console.log(`Matching result found for ${teamName}:`, matchingResult);

            // Apply color based on the result
            let color;
            if (matchingResult.result === "hit") {
                color = "#39FF14"; // Green for a win
            } else if (matchingResult.result === "miss") {
                color = "red"; // Red for a loss
            } else if (matchingResult.result === "push") {
                color = "yellow"; // Yellow for a push
            } else {
                console.warn(`Unknown result for ${teamName}: ${matchingResult.result}`);
                color = "gray"; // Gray for any unknown result
            }

            // Apply the color to the pick element (in this case, the span with the bet value)
            const valueSpan = pickElement.querySelector('span');
            if (valueSpan) {
                valueSpan.style.setProperty('color', color, 'important');
                console.log(`Applied ${color} to ${teamName} for bet value ${displayedBetValue}`);
            }
        } else {
            console.warn(`No matching result found for ${teamName} with bet value ${displayedBetValue}`);
        }
    });
}

async function showPlayerPicks(player, poolName) {
    console.log(`Showing picks for player ${player.username} in pool ${poolName}`);
    
    const picksPanel = document.getElementById('playoff-player-picks-panel');
    if (!picksPanel) {
        console.error('Player picks panel not found');
        return;
    }
    
    // Update player name in panel
    document.getElementById('selected-player-name').textContent = player.username;
    
    // Clear existing picks
    const picksContainer = picksPanel.querySelector('.player-picks-container');
    picksContainer.innerHTML = '';
    
    try {
        // First, fetch the player's playoff stats from the new API endpoint
        const encodedPoolName = encodeURIComponent(poolName);
        const encodedUsername = encodeURIComponent(player.username);
        const statsUrl = `/api/playoffs/${encodedPoolName}/member/${encodedUsername}`;
        
        console.log(`Fetching player playoff stats from: ${statsUrl}`);
        const statsResponse = await fetch(statsUrl);
        
        if (!statsResponse.ok) {
            throw new Error(`HTTP error fetching stats! status: ${statsResponse.status}`);
        }
        
        const statsData = await statsResponse.json();
        
        if (statsData.success && statsData.member) {
            // Update player record with stats from API
            document.getElementById('player-wins').textContent = statsData.member.win || 0;
            document.getElementById('player-losses').textContent = statsData.member.loss || 0;
            document.getElementById('player-pushes').textContent = statsData.member.push || 0;
            
            // Could also display additional stats like position, seed, etc. if needed
        } else {
            console.warn('Stats data not found or invalid format', statsData);
            // Set default values if stats not found
            document.getElementById('player-wins').textContent = 0;
            document.getElementById('player-losses').textContent = 0;
            document.getElementById('player-pushes').textContent = 0;
        }
        
        // Get team logos
        const teamLogos = getTeamLogos();
        
        // Fetch player picks using playoff_ prefix
        const encodedPlayoffPoolName = encodeURIComponent(`playoff_${poolName}`);
        const picksUrl = `/api/getPicks/${encodedUsername}/${encodedPlayoffPoolName}`;
        
        console.log(`Fetching playoff picks from: ${picksUrl}`);
        const picksResponse = await fetch(picksUrl);
        
        if (!picksResponse.ok) {
            throw new Error(`HTTP error fetching picks! status: ${picksResponse.status}`);
        }
        
        const picksData = await picksResponse.json();
        
        // Fetch results to color the picks
        const resultsResponse = await fetch('/api/getResults');
        const resultsData = await resultsResponse.json();
        const results = resultsData.results || [];
        
        if (picksData && picksData.picks && picksData.picks.length > 0) {
            // Render picks
            picksData.picks.forEach(pick => {
                const pickElement = document.createElement('div');
                pickElement.className = 'pick-item';
                
                // Find matching result for playoff picks
                const matchingResult = results.find(r => 
                    r.username.toLowerCase() === player.username.toLowerCase() &&
                    r.teamName === pick.teamName &&
                    r.betValue === pick.value &&
                    r.poolName === `playoff_${poolName}`
                );
                
                let color = '';
                if (matchingResult) {
                    if (matchingResult.result === 'hit') {
                        color = '#39FF14'; // Green
                    } else if (matchingResult.result === 'miss') {
                        color = 'red';
                    } else if (matchingResult.result === 'push') {
                        color = 'yellow';
                    }
                }
                
                pickElement.innerHTML = `
                    <img src="${teamLogos[pick.teamName] || 'Default.png'}" alt="${pick.teamName}" class="team-logo">
                    <div class="pick-team">${pick.teamName}</div>
                    <div class="pick-value" style="color: ${color} !important">${pick.value}</div>
                `;
                
                picksContainer.appendChild(pickElement);
            });
            
            // Add immortal lock if exists
            if (picksData.immortalLock && picksData.immortalLock.length > 0) {
                const immortalPick = picksData.immortalLock[0];
                const pickElement = document.createElement('div');
                pickElement.className = 'pick-item immortal-lock-pick';
                
                // Find matching result for playoff immortal lock
                const matchingResult = results.find(r => 
                    r.username.toLowerCase() === player.username.toLowerCase() &&
                    r.teamName === immortalPick.teamName &&
                    r.betValue === immortalPick.value &&
                    r.poolName === `playoff_${poolName}` &&
                    r.isImmortalLock
                );
                
                let color = '';
                if (matchingResult) {
                    if (matchingResult.result === 'hit') {
                        color = '#39FF14'; // Green
                    } else if (matchingResult.result === 'miss') {
                        color = 'red';
                    } else if (matchingResult.result === 'push') {
                        color = 'yellow';
                    }
                }
                
                pickElement.innerHTML = `
                    <img src="${teamLogos[immortalPick.teamName] || 'Default.png'}" alt="${immortalPick.teamName}" class="team-logo">
                    <div class="pick-team">${immortalPick.teamName}</div>
                    <div class="pick-value" style="color: ${color} !important">${immortalPick.value}</div>
                    <span class="immortal-lock-badge">LOCK</span>
                `;
                
                picksContainer.appendChild(pickElement);
            }
        } else {
            // No picks message
            const noPicks = document.createElement('div');
            noPicks.className = 'no-picks-message';
            noPicks.textContent = 'No picks available for this player';
            picksContainer.appendChild(noPicks);
        }
        
        // Show the panel
        picksPanel.classList.add('open');
        
    } catch (error) {
        console.error('Error showing player picks:', error);
        
        // Show error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'picks-error-message';
        errorMsg.textContent = 'Failed to load player picks or stats';
        picksContainer.appendChild(errorMsg);
        
        // Still show the panel with the error
        picksPanel.classList.add('open');
    }
}

// Add this event listener to trigger rebuildUIWithResults after results are loaded
document.addEventListener('DOMContentLoaded', function() {
    // If we're in a playoff bracket view, fetch results and apply colors
    if (document.querySelector('.playoff-bracket-container')) {
        setTimeout(() => {
            fetch('/api/getResults')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success && data.results) {
                        rebuildUIWithResults(data.results);
                    } else {
                        console.error('No results found or unable to fetch results:', data.message);
                    }
                })
                .catch(error => console.error('Failed to fetch results:', error));
        }, 1000); // Delay to ensure DOM is fully loaded
    }
});


//neeehehehehe


  
  // Helper function to create bracket connectors
  function createBracketConnectors(bracketData) {
    // For each match, add a visual indicator of connections
    const matchContainers = document.querySelectorAll('.match-container');
    
    matchContainers.forEach(matchContainer => {
      const matchId = matchContainer.dataset.matchId;
      const match = bracketData.matches.find(m => m.id === matchId);
      
      if (match && match.nextMatch !== "WINNER") {
        matchContainer.classList.add('has-connector');
      }
    });
  }
  




  // Updated getInitialPosition function for 6 players
  function getInitialPosition(seed, totalPlayers) {
    // 6-player bracket positions
    if (totalPlayers === 6) {
      switch(seed) {
        case 1: return "R2_M1_P2"; // Seed 1 has a bye in Week 14
        case 2: return "R2_M2_P2"; // Seed 2 has a bye in Week 14
        case 3: return "R1_M1_P1"; // Seed 3 plays in Week 14 
        case 4: return "R1_M2_P1"; // Seed 4 plays in Week 14
        case 5: return "R1_M2_P2"; // Seed 5 plays in Week 14
        case 6: return "R1_M1_P2"; // Seed 6 plays in Week 14
        default: return "";
      }
    }
    
    // Other player count logic remains the same...
    // (keep the existing code for 7, 8, 9, and 10 players)
  
    return "";
  }
  
  // Additional debugging function that can help trace player positions
  function debugPlayoffBracket(poolName) {
    fetch(`/api/playoffs/${encodeURIComponent(poolName)}/bracket`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.bracket) {
          console.group('Playoff Bracket Debug');
          console.log('Current Week:', data.bracket.currentWeek);
          
          // Check positions for all members
          console.log('Members:');
          data.bracket.members.forEach(member => {
            console.log(`${member.username} (Seed ${member.seed}):`,
                        `position=${member.position}`,
                        `isAdvancing=${member.isAdvancing}`,
                        `eliminated=${member.eliminated}`);
          });
          
          // Log all matches 
          console.log('Matches:');
          data.bracket.matches.forEach(match => {
            console.log(`Match ${match.id} (Week ${match.week}):`,
                        `player1=${match.player1?.username || 'TBD'}`,
                        `player2=${match.player2?.username || 'TBD'}`,
                        `positions=${match.player1Position} vs ${match.player2Position}`,
                        `winner=${match.winner || 'none'}`);
          });
          console.groupEnd();
        }
      })
      .catch(error => console.error('Error debugging bracket:', error));
  }


  // Update the renderBracket function to include championship display
// This can be added to your existing frontend JavaScript file

// Updated renderBracket function
function renderBracket(bracketData, container, poolName) {
    console.log('Starting to render bracket with data:', bracketData);
    
    // Clear the bracket container
    container.innerHTML = '';
    
    // Check if playoffs are completed and there's a champion
    const isCompleted = bracketData.isCompleted;
    const champion = bracketData.champion;
    
    // Get the member count to determine bracket style
    const memberCount = bracketData.members ? bracketData.members.length : 0;
    
    // Add custom class based on player count for specific CSS styling
    container.classList.add(`bracket-size-${memberCount}`);
    
    // If playoffs are completed, show champion banner
    if (isCompleted && champion) {
      const championBanner = document.createElement('div');
      championBanner.className = 'playoff-champion-banner';
      championBanner.innerHTML = `

        <div class="champion-name">${champion.username} <i class="fas fa-crown"></i></div>
        <div class="champion-title">PLAYOFF CHAMPION!</div>
        <div class="champion-stats">
          Record: ${champion.win}-${champion.loss}-${champion.push}
          <br>
          Seed: #${champion.seed}
        </div>
      `;
      container.appendChild(championBanner);
      

    }
    
    // Create round headers
    const roundHeadersDiv = document.createElement('div');
    roundHeadersDiv.className = 'playoff-round-headers';
    
    bracketData.rounds.forEach((round, index) => {
      const headerDiv = document.createElement('div');
      headerDiv.className = `round-header ${round.week === bracketData.currentWeek ? 'current-round' : ''}`;
      headerDiv.innerHTML = `
        <h3>${round.name}</h3>
        <div class="round-week">Week ${round.week}</div>
      `;
      roundHeadersDiv.appendChild(headerDiv);
    });
    
    container.appendChild(roundHeadersDiv);
    
    // Create bracket rounds
    const bracketRoundsDiv = document.createElement('div');
    bracketRoundsDiv.className = 'playoff-rounds';
    
    // Filter matches to only include ones for the rounds we're showing
    const visibleWeeks = bracketData.rounds.map(r => r.week);
    const visibleMatches = bracketData.matches.filter(match => 
      visibleWeeks.includes(match.week)
    );
    
    // Group matches by round
    const roundGroups = {};
    bracketData.rounds.forEach(round => {
      roundGroups[round.round] = {
        name: round.name,
        week: round.week,
        matches: visibleMatches.filter(match => match.week === round.week)
      };
    });
    
    // Add rounds to the bracket
    Object.values(roundGroups).sort((a, b) => a.week - b.week).forEach(roundGroup => {
      const roundElement = document.createElement('div');
      roundElement.className = 'bracket-round';
      
      // Set data attributes for easier styling
      roundElement.dataset.round = roundGroup.week.toString();
      roundElement.dataset.totalRounds = bracketData.rounds.length.toString();
      roundElement.dataset.playerCount = memberCount.toString();
      
      // Sort matches by their position in the bracket
      const sortedMatches = roundGroup.matches.sort((a, b) => {
        const aPos = a.player1?.position || a.player2?.position || '';
        const bPos = b.player1?.position || b.player2?.position || '';
        return aPos.localeCompare(bPos);
      });
      
      // Add matches to the round
      sortedMatches.forEach(match => {
        const matchElement = createMatchElement(match, poolName, champion);
        roundElement.appendChild(matchElement);
      });
      
      bracketRoundsDiv.appendChild(roundElement);
    });
    
    container.appendChild(bracketRoundsDiv);
    
    // Add bracket connectors in a second pass
    createBracketConnectors(bracketData, visibleMatches, bracketData.rounds.length);
    
    console.log('Bracket rendered successfully with', memberCount, 'players');
    
  }
  
  // Modified createMatchElement function to highlight the champion
  function createMatchElement(match, poolName, champion) {
    const matchContainer = document.createElement('div');
    matchContainer.className = 'match-container';
    matchContainer.dataset.matchId = match.id;
    
    // Add a special class if this is the final match and we have a champion
    if (match.nextMatch === "WINNER" && champion) {
      matchContainer.classList.add('championship-match');
    }
    
    const matchBracket = document.createElement('div');
    matchBracket.className = 'match-bracket';
    
    // First player slot
    if (match.player1) {
      const isChampion = champion && match.player1.username === champion.username && match.nextMatch === "WINNER";
      const player1Element = createPlayerSlot(match.player1, match.winner, poolName, isChampion);
      matchBracket.appendChild(player1Element);
    } else {
      matchBracket.appendChild(createEmptySlot());
    }
    
    // Second player slot
    if (match.player2) {
      const isChampion = champion && match.player2.username === champion.username && match.nextMatch === "WINNER";
      const player2Element = createPlayerSlot(match.player2, match.winner, poolName, isChampion);
      matchBracket.appendChild(player2Element);
    } else {
      matchBracket.appendChild(createEmptySlot());
    }
    
    matchContainer.appendChild(matchBracket);
    return matchContainer;
  }
  
  // Modified createPlayerSlot function to highlight the champion
  function createPlayerSlot(player, winnerId, poolName, isChampion) {
    const playerSlot = document.createElement('div');
    playerSlot.className = `player-slot ${player.isAdvancing ? 'advancing' : ''} ${player.eliminated ? 'eliminated' : ''} ${isChampion ? 'champion-slot' : ''}`;
    playerSlot.dataset.playerId = player.id;
    playerSlot.dataset.position = player.position;
    playerSlot.dataset.poolName = poolName;
    
    // Get profile pic URL - fetch from server or use default
    const profilePicUrl = player.profilePic || 'Default.png';
    
    // Add profile picture and player info
    playerSlot.innerHTML = `
      <div class="player-profile-pic" style="background-image: url('${profilePicUrl}')"></div>
      <div class="player-seed">${player.seed}</div>
      <div class="player-info">
        <div class="player-name">${player.username}</div>
        <div class="player-points">${player.points || 0} pts</div>
      </div>
    `;
    
    // Add status indicators
    if (player.hasBye) {
      const byeBadge = document.createElement('div');
      byeBadge.className = 'player-status';
      byeBadge.innerHTML = `<span class="bye-badge">BYE</span>`;
      playerSlot.appendChild(byeBadge);
    }
    

    // Add champion crown if this player is the champion
    if (isChampion) {
      const championIcon = document.createElement('div');
      championIcon.className = 'player-status champion-icon';
      championIcon.innerHTML = `<i class="fas fa-crown"></i>`;
      playerSlot.appendChild(championIcon);
    }
    
    // Add click handler to show picks
    playerSlot.addEventListener('click', () => {
      showPlayerPicks(player, poolName);
    });
    
    return playerSlot;
  }
  
  // Simple function to create empty slot
  function createEmptySlot() {
    const emptySlot = document.createElement('div');
    emptySlot.className = 'empty-slot';
    emptySlot.textContent = 'TBD';
    return emptySlot;
  }
  

  
  // Show champion modal popup
  function showChampionshipModal(champion, poolName) {
    // First, check if there's already a modal
    let modal = document.getElementById('championship-modal');
    
    // If not, create one
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'championship-modal';
      modal.className = 'champion-modal';
      
      modal.innerHTML = `
        <div class="champion-modal-content">
          <button class="champion-modal-close">&times;</button>
          <div class="champion-modal-crown"><i class="fas fa-crown"></i></div>
          <div class="champion-modal-name">${champion.username}</div>
          <div class="champion-modal-title">IS THE CHAMPION!</div>
          <div class="champion-modal-details">
            Pool: ${poolName}<br>
            Seed: #${champion.seed}<br>
            Record: ${champion.win}W-${champion.loss}L-${champion.push}P
          </div>
          <button class="champion-modal-button">CELEBRATE!</button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add event listeners
      const closeBtn = modal.querySelector('.champion-modal-close');
      const celebrateBtn = modal.querySelector('.champion-modal-button');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modal.classList.remove('show');
          setTimeout(() => {
            if (window.confettiAnimationId) {
              stopConfetti();
            }
          }, 500);
        });
      }
      
      if (celebrateBtn) {
        celebrateBtn.addEventListener('click', () => {
          if (window.confettiAnimationId) {
            stopConfetti();
          } else {
            startConfetti();
            setTimeout(() => {
              if (window.confettiAnimationId) {
                stopConfetti();
              }
            }, 10000); // Run confetti for 10 seconds
          }
        });
      }
    } else {
      // Update existing modal with new champion data
      const nameEl = modal.querySelector('.champion-modal-name');
      const detailsEl = modal.querySelector('.champion-modal-details');
      if (nameEl) {
        nameEl.textContent = champion.username;
      }
      if (detailsEl) {
        detailsEl.innerHTML = `
          Pool: ${poolName}<br>
          Seed: #${champion.seed}<br>
          Record: ${champion.win}W-${champion.loss}L-${champion.push}P
        `;
      }
    }
    }

    
  // Add this code to fix the playoff bracket scrolling
// You can add this directly to your page or include it in a script tag

document.addEventListener('DOMContentLoaded', function() {
    // Apply immediate fixes to all playoff brackets
    applyPlayoffBracketFixes();
    
    // Also run this after a short delay to catch dynamically created elements
    setTimeout(applyPlayoffBracketFixes, 1000);
    setTimeout(applyPlayoffBracketFixes, 3000);
  });
  
  function applyPlayoffBracketFixes() {
    // Target all playoff bracket containers
    const bracketContainers = document.querySelectorAll('.playoff-bracket-container');
    
    bracketContainers.forEach(container => {
      // Set critical styles directly
      container.style.overflowX = 'scroll';
      container.style.overflowY = 'visible';
      container.style.maxWidth = '100%';
      container.style.width = '100%';
      container.style.whiteSpace = 'nowrap';
      
      // Fix round headers and rounds
      const roundHeaders = container.querySelector('.playoff-round-headers');
      const rounds = container.querySelector('.playoff-rounds');
      
      if (roundHeaders) {
        roundHeaders.style.display = 'flex';
        roundHeaders.style.flexWrap = 'nowrap';
        roundHeaders.style.minWidth = 'max-content';
        roundHeaders.style.width = 'max-content';
        roundHeaders.style.gap = '50px';
        
        // Fix individual round headers
        const headers = roundHeaders.querySelectorAll('.round-header');
        headers.forEach(header => {
          header.style.minWidth = '150px';
          header.style.flex = '0 0 auto';
        });
      }
      
      if (rounds) {
        rounds.style.display = 'flex';
        rounds.style.flexWrap = 'nowrap';
        rounds.style.minWidth = 'max-content';
        rounds.style.width = 'max-content';
        rounds.style.gap = '50px';
        
        // Fix bracket rounds
        const bracketRounds = rounds.querySelectorAll('.bracket-round');
        bracketRounds.forEach(round => {
          round.style.minWidth = '150px';
          round.style.flex = '0 0 auto';
        });
      }
      
      // Add a class to indicate this bracket has been fixed
      container.classList.add('bracket-fixed');
      
      // Log success
      console.log('Playoff bracket fixed for scrolling:', container);
    });
  }
  
  // Call this function if you dynamically load brackets
  function fixNewBrackets() {
    applyPlayoffBracketFixes();
  }

  // Updated createPlayerSlot function that avoids using conflicting class names
function createPlayerSlot(player, winnerId, poolName, isChampion) {
    const playerSlot = document.createElement('div');
    playerSlot.className = `player-slot ${player.isAdvancing ? 'advancing' : ''} ${player.eliminated ? 'eliminated' : ''} ${isChampion ? 'championship-winner' : ''}`;
    playerSlot.dataset.playerId = player.id;
    playerSlot.dataset.position = player.position;
    playerSlot.dataset.poolName = poolName;
    
    // Get profile pic URL - fetch from server or use default
    const profilePicUrl = player.profilePic || 'Default.png';
    
    // Create the player seed element
    const seedElement = document.createElement('div');
    seedElement.className = 'player-seed';
    seedElement.textContent = player.seed;
    playerSlot.appendChild(seedElement);
    
    // Create profile pic element with UNIQUE CLASS NAME
    const profilePicElement = document.createElement('div');
    profilePicElement.className = 'playoff-profile-pic'; // Changed class name
    profilePicElement.style.backgroundImage = `url('${profilePicUrl}')`;
    playerSlot.appendChild(profilePicElement);
    
    // Create player info container
    const playerInfoElement = document.createElement('div');
    playerInfoElement.className = 'playoff-player-info'; // Changed class name
    
    // Create player name element with UNIQUE CLASS NAME
    const playerNameElement = document.createElement('div');
    playerNameElement.className = 'playoff-player-username'; // Changed class name
    playerNameElement.textContent = player.username;
    playerInfoElement.appendChild(playerNameElement);
    
    // Create player points element with UNIQUE CLASS NAME
    const playerPointsElement = document.createElement('div');
    playerPointsElement.className = 'playoff-player-score'; // Changed class name
    playerPointsElement.textContent = `${player.points || 0} pts`;
    playerInfoElement.appendChild(playerPointsElement);
    
    playerSlot.appendChild(playerInfoElement);
    
    // Add status indicators
    if (player.hasBye) {
      const byeBadge = document.createElement('div');
      byeBadge.className = 'player-status';
      byeBadge.innerHTML = `<span class="bye-badge">BYE</span>`;
      playerSlot.appendChild(byeBadge);
    }
    
    // Add champion crown if this player is the champion
    if (isChampion) {
      const championIcon = document.createElement('div');
      championIcon.className = 'player-status champion-icon';
      championIcon.innerHTML = `<i class="fas fa-crown"></i>`;
      playerSlot.appendChild(championIcon);
    }
    
    // Add click handler to show picks
    playerSlot.addEventListener('click', () => {
      showPlayerPicks(player, poolName);
    });
    
    return playerSlot;
}

// Corresponding CSS to add to your stylesheet
// This needs to be added to your CSS file for the new class names
function addStylesForNewClassNames() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* New unique class names for playoff elements */
        .playoff-profile-pic {
            width: 20px !important;
            height: 20px !important;
            border-radius: 50% !important;
            margin-right: 5px !important;
            flex-shrink: 0 !important;
            border: 1px solid #33d9ff !important;
            background-size: cover !important;
            background-position: center !important;
            display: inline-block !important;
            vertical-align: middle !important;
        }
        
        .playoff-player-username {
            font-size: 11px !important;
            line-height: 1.2 !important;
            color: #ffffff !important;
            font-family: 'Montserrat', sans-serif !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 70px !important;
            display: block !important;
        }
        
        .playoff-player-score {
            font-size: 9px !important;
            color: #33d9ff !important;
            font-family: 'Quantico', sans-serif !important;
            display: block !important;
            margin-top: 2px !important;
        }
        
        .playoff-player-info {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            flex: 1 !important;
            min-width: 0 !important;
            padding-left: 3px !important;
        }
    `;
    document.head.appendChild(styleElement);
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add the new styles
    addStylesForNewClassNames();
});

// Updated rebuildUIWithResults function to work with new class names
function rebuildUIWithResults(results) {
    // Get regular pool picks
    const regularPicks = document.querySelectorAll('.player-picks .pick, .immortal-lock');
    
    // Get playoff picks with the new class names
    const playoffPicks = document.querySelectorAll('.playoff-bracket-container .pick-item');
    
    // Process regular picks
    regularPicks.forEach(pickElement => {
        const teamLogo = pickElement.querySelector('.team-logo');
        const displayedBetValue = pickElement.querySelector('span')?.textContent.trim();
        
        if (!teamLogo || !displayedBetValue) {
            return; // Skip if no logo or value is found
        }
        
        const teamName = teamLogo.alt;
        
        // Find matching result for regular picks
        const matchingResult = results.find(r => 
            r.teamName === teamName && 
            r.betValue.toString().trim() === displayedBetValue && 
            !r.isPlayoffPick
        );
        
        if (matchingResult) {
            // Apply color based on the result
            let color;
            if (matchingResult.result === "hit") {
                color = "#39FF14"; // Green for a win
            } else if (matchingResult.result === "miss") {
                color = "red"; // Red for a loss
            } else if (matchingResult.result === "push") {
                color = "yellow"; // Yellow for a push
            } else {
                color = "gray"; // Gray for any unknown result
            }
            
            // Apply the color to the pick element
            const valueSpan = pickElement.querySelector('span');
            if (valueSpan) {
                valueSpan.style.setProperty('color', color, 'important');
            }
        }
    });
    
    // Process playoff picks
    playoffPicks.forEach(pickElement => {
        const teamLogo = pickElement.querySelector('.team-logo');
        const displayedBetValue = pickElement.querySelector('.pick-value')?.textContent.trim();
        
        if (!teamLogo || !displayedBetValue) {
            return; // Skip if no logo or value is found
        }
        
        const teamName = teamLogo.alt;
        
        // Find matching result for playoff picks
        const matchingResult = results.find(r => 
            r.teamName === teamName && 
            r.betValue.toString().trim() === displayedBetValue && 
            r.isPlayoffPick === true
        );
        
        if (matchingResult) {
            // Apply color based on the result
            let color;
            if (matchingResult.result === "hit") {
                color = "#39FF14"; // Green for a win
            } else if (matchingResult.result === "miss") {
                color = "red"; // Red for a loss
            } else if (matchingResult.result === "push") {
                color = "yellow"; // Yellow for a push
            } else {
                color = "gray"; // Gray for any unknown result
            }
            
            // Apply the color to the pick element
            const valueElement = pickElement.querySelector('.pick-value');
            if (valueElement) {
                valueElement.style.setProperty('color', color, 'important');
            }
        }
    });
}

// Use this function to initialize your playoff player picks panel
function initializePlayoffPicksPanel() {
    if (!document.getElementById('playoff-player-picks-panel')) {
        const picksPanel = document.createElement('div');
        picksPanel.id = 'playoff-player-picks-panel';
        picksPanel.className = 'player-picks-panel';
        picksPanel.innerHTML = `
            <div class="panel-header">
                <h3 id="selected-player-name">Player Name</h3>
                <button id="close-picks-panel-btn" class="close-panel-btn">&times;</button>
            </div>
            <div class="player-record">
                <div class="record-item"><span>W:</span> <span id="player-wins">0</span></div>
                <div class="record-item"><span>L:</span> <span id="player-losses">0</span></div>
                <div class="record-item"><span>P:</span> <span id="player-pushes">0</span></div>
            </div>
            <div class="player-picks-container">
                <!-- This will be populated by JavaScript -->
            </div>
        `;
        document.body.appendChild(picksPanel);
        
        // Add event listener to close button
        document.getElementById('close-picks-panel-btn').addEventListener('click', () => {
            picksPanel.classList.remove('open');
        });
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the playoff picks panel
    initializePlayoffPicksPanel();
    
    // Add the new styles
    addStylesForNewClassNames();
    
    // Process results for any picks on the page
    setTimeout(() => {
        fetch('/api/getResults')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.results) {
                    rebuildUIWithResults(data.results);
                }
            })
            .catch(error => console.error('Failed to fetch results:', error));
    }, 1000);
});

// Modified createMatchElement function to pass currentWeek to createPlayerSlot
function createMatchElement(match, poolName, champion, currentWeek, isLastWeek) {
    const matchContainer = document.createElement('div');
    matchContainer.className = 'match-container';
    matchContainer.dataset.matchId = match.id;
    
    // Add a special class if this is the final match and we have a champion
    if (match.nextMatch === "WINNER" && champion) {
      matchContainer.classList.add('championship-match');
    }
    
    const matchBracket = document.createElement('div');
    matchBracket.className = 'match-bracket';
    
    // First player slot
    if (match.player1) {
      const isChampion = champion && match.player1.username === champion.username && match.nextMatch === "WINNER";
      const player1Element = createPlayerSlot(match.player1, match.winner, poolName, isChampion, currentWeek, isLastWeek);
      matchBracket.appendChild(player1Element);
    } else {
      matchBracket.appendChild(createEmptySlot());
    }
    
    // Second player slot
    if (match.player2) {
      const isChampion = champion && match.player2.username === champion.username && match.nextMatch === "WINNER";
      const player2Element = createPlayerSlot(match.player2, match.winner, poolName, isChampion, currentWeek, isLastWeek);
      matchBracket.appendChild(player2Element);
    } else {
      matchBracket.appendChild(createEmptySlot());
    }
    
    matchContainer.appendChild(matchBracket);
    return matchContainer;
}

// Modified createPlayerSlot function to consider currentWeek and isLastWeek
function createPlayerSlot(player, winnerId, poolName, isChampion, currentWeek, isLastWeek) {
    const playerSlot = document.createElement('div');
    playerSlot.className = `player-slot ${player.isAdvancing ? 'advancing' : ''} ${player.eliminated ? 'eliminated' : ''} ${isChampion ? 'championship-winner' : ''}`;
    playerSlot.dataset.playerId = player.id;
    playerSlot.dataset.position = player.position;
    playerSlot.dataset.poolName = poolName;
    
    // Get profile pic URL - fetch from server or use default
    const profilePicUrl = player.profilePic || 'Default.png';
    
    // Create the player seed element
    const seedElement = document.createElement('div');
    seedElement.className = 'player-seed';
    seedElement.textContent = player.seed;
    playerSlot.appendChild(seedElement);
    
    // Create profile pic element with UNIQUE CLASS NAME
    const profilePicElement = document.createElement('div');
    profilePicElement.className = 'playoff-profile-pic'; // Changed class name
    profilePicElement.style.backgroundImage = `url('${profilePicUrl}')`;
    playerSlot.appendChild(profilePicElement);
    
    // Create player info container
    const playerInfoElement = document.createElement('div');
    playerInfoElement.className = 'playoff-player-info'; // Changed class name
    
    // Create player name element with UNIQUE CLASS NAME
    const playerNameElement = document.createElement('div');
    playerNameElement.className = 'playoff-player-username'; // Changed class name
    playerNameElement.textContent = player.username;
    playerInfoElement.appendChild(playerNameElement);
    
    // Create player points element with UNIQUE CLASS NAME
    const playerPointsElement = document.createElement('div');
    playerPointsElement.className = 'playoff-player-score'; // Changed class name
    playerPointsElement.textContent = `${player.points || 0} pts`;
    playerInfoElement.appendChild(playerPointsElement);
    
    playerSlot.appendChild(playerInfoElement);
    
    // Add status indicators - Only show bye badge if:
    // 1. Player has a bye
    // 2. It's not the current week
    // 3. It's not the final week of playoffs
    if (player.hasBye && player.position && player.position.startsWith('R2_') && currentWeek !== 14 && !isLastWeek) {
      const byeBadge = document.createElement('div');
      byeBadge.className = 'player-status';
      byeBadge.innerHTML = `<span class="bye-badge">BYE</span>`;
      playerSlot.appendChild(byeBadge);
    }
    

    
    // Add click handler to show picks
    playerSlot.addEventListener('click', () => {
      showPlayerPicks(player, poolName);
    });
    
    return playerSlot;
}

// Updated renderBracket function to pass currentWeek and isLastWeek to createMatchElement
function renderBracket(bracketData, container, poolName) {
    console.log('Starting to render bracket with data:', bracketData);
    
    // Clear the bracket container
    container.innerHTML = '';
    
    // Check if playoffs are completed and there's a champion
    const isCompleted = bracketData.isCompleted;
    const champion = bracketData.champion;
    const currentWeek = bracketData.currentWeek; // Extract current week from bracket data
    
    // Determine if it's the last week of playoffs
    const rounds = bracketData.rounds || [];
    const lastWeek = rounds.length > 0 ? Math.max(...rounds.map(r => r.week)) : 0;
    const isLastWeek = currentWeek === lastWeek;
    
    // Get the member count to determine bracket style
    const memberCount = bracketData.members ? bracketData.members.length : 0;
    
    // Add custom class based on player count for specific CSS styling
    container.classList.add(`bracket-size-${memberCount}`);
    
    // If playoffs are completed, show champion banner
    if (isCompleted && champion) {
      const championBanner = document.createElement('div');
      championBanner.className = 'playoff-champion-banner';
      championBanner.innerHTML = `
        <div class="champion-name">${champion.username} <i class="fas fa-crown"></i></div>
        <div class="champion-title">PLAYOFF CHAMPION!</div>
        <div class="champion-stats">
          Record: ${champion.win}-${champion.loss}-${champion.push}
          <br>
          Seed: #${champion.seed}
        </div>
      `;
      container.appendChild(championBanner);
    }
    
    // Create round headers
    const roundHeadersDiv = document.createElement('div');
    roundHeadersDiv.className = 'playoff-round-headers';
    
    bracketData.rounds.forEach((round, index) => {
      const headerDiv = document.createElement('div');
      headerDiv.className = `round-header ${round.week === bracketData.currentWeek ? 'current-round' : ''}`;
      headerDiv.innerHTML = `
        <h3>${round.name}</h3>
        <div class="round-week">Week ${round.week}</div>
      `;
      roundHeadersDiv.appendChild(headerDiv);
    });
    
    container.appendChild(roundHeadersDiv);
    
    // Create bracket rounds
    const bracketRoundsDiv = document.createElement('div');
    bracketRoundsDiv.className = 'playoff-rounds';
    
    // Filter matches to only include ones for the rounds we're showing
    const visibleWeeks = bracketData.rounds.map(r => r.week);
    const visibleMatches = bracketData.matches.filter(match => 
      visibleWeeks.includes(match.week)
    );
    
    // Group matches by round
    const roundGroups = {};
    bracketData.rounds.forEach(round => {
      roundGroups[round.round] = {
        name: round.name,
        week: round.week,
        matches: visibleMatches.filter(match => match.week === round.week)
      };
    });
    
    // Add rounds to the bracket
    Object.values(roundGroups).sort((a, b) => a.week - b.week).forEach(roundGroup => {
      const roundElement = document.createElement('div');
      roundElement.className = 'bracket-round';
      
      // Set data attributes for easier styling
      roundElement.dataset.round = roundGroup.week.toString();
      roundElement.dataset.totalRounds = bracketData.rounds.length.toString();
      roundElement.dataset.playerCount = memberCount.toString();
      
      // Sort matches by their position in the bracket
      const sortedMatches = roundGroup.matches.sort((a, b) => {
        const aPos = a.player1?.position || a.player2?.position || '';
        const bPos = b.player1?.position || b.player2?.position || '';
        return aPos.localeCompare(bPos);
      });
      
      // Add matches to the round
      sortedMatches.forEach(match => {
        // Pass currentWeek and isLastWeek to createMatchElement
        const matchElement = createMatchElement(match, poolName, champion, currentWeek, isLastWeek);
        roundElement.appendChild(matchElement);
      });
      
      bracketRoundsDiv.appendChild(roundElement);
    });
    
    container.appendChild(bracketRoundsDiv);
    
    // Add bracket connectors in a second pass
    createBracketConnectors(bracketData, visibleMatches, bracketData.rounds.length);
    
    console.log('Bracket rendered successfully with', memberCount, 'players');
}

// Simple function to create empty slot
function createEmptySlot() {
    const emptySlot = document.createElement('div');
    emptySlot.className = 'empty-slot';
    emptySlot.textContent = 'TBD';
    return emptySlot;
}

/*

    // Playoff Bracket JavaScript - Compact Version

// Helper function to create bracket connectors
function createBracketConnectors(bracketData, matches, totalRounds) {
  // Wait for DOM to be ready
  setTimeout(() => {
    const rounds = document.querySelectorAll(".round-column")
    if (!rounds.length) return

    // Create connector container
    const connectorContainer = document.createElement("div")
    connectorContainer.className = "bracket-connectors"
    document.querySelector(".bracket-content").appendChild(connectorContainer)

    // Process each match to create connectors
    matches.forEach((match) => {
      if (match.nextMatch && match.nextMatch !== "WINNER") {
        // Find the current match element
        const currentMatchEl = document.querySelector(`[data-match-id="${match.id}"]`)
        if (!currentMatchEl) return

        // Find the next match element
        const nextMatchEl = document.querySelector(`[data-match-id="${match.nextMatch}"]`)
        if (!nextMatchEl) return

        // Get positions
        const currentRect = currentMatchEl.getBoundingClientRect()
        const nextRect = nextMatchEl.getBoundingClientRect()
        const containerRect = document.querySelector(".bracket-content").getBoundingClientRect()

        // Create horizontal line
        const horizontalLine = document.createElement("div")
        horizontalLine.className = "connector horizontal"

        // Calculate positions relative to container
        const startX = currentRect.right - containerRect.left
        const startY = currentRect.top + currentRect.height / 2 - containerRect.top
        const endX = nextRect.left - containerRect.left
        const endY = nextRect.top + nextRect.height / 2 - containerRect.top

        // Position horizontal line
        horizontalLine.style.left = `${startX}px`
        horizontalLine.style.top = `${startY}px`
        horizontalLine.style.width = `${(endX - startX) / 2}px`

        // Create vertical line if needed
        if (Math.abs(startY - endY) > 5) {
          const verticalLine = document.createElement("div")
          verticalLine.className = "connector vertical"

          verticalLine.style.left = `${startX + (endX - startX) / 2}px`
          verticalLine.style.top = startY < endY ? `${startY}px` : `${endY}px`
          verticalLine.style.height = `${Math.abs(endY - startY)}px`

          connectorContainer.appendChild(verticalLine)
        }

        connectorContainer.appendChild(horizontalLine)
      }
    })
  }, 100)
}

// Updated renderBracket function with more compact structure
function renderBracket(bracketData, container, poolName) {
  console.log("Rendering compact bracket with data:", bracketData)

  // Clear the bracket container
  container.innerHTML = ""

  // Add main bracket container with improved styling
  const bracketContainer = document.createElement("div")
  bracketContainer.className = "playoff-bracket-container"

  // Add playoff title
  const playoffTitle = document.createElement("div")
  playoffTitle.className = "playoff-title"
  playoffTitle.innerHTML = `
    <div class="playoff-name">PICK ${bracketData.members.length}</div>
    <div class="playoff-week">Playoff Week ${bracketData.currentWeek - 13}</div>
  `
  bracketContainer.appendChild(playoffTitle)

  // Create round headers
  const roundHeadersDiv = document.createElement("div")
  roundHeadersDiv.className = "round-headers"

  bracketData.rounds.forEach((round) => {
    const headerDiv = document.createElement("div")
    headerDiv.className = `round-header ${round.week === bracketData.currentWeek ? "current" : ""}`
    headerDiv.innerHTML = `
      <div class="round-title">${round.name}</div>
      <div class="round-week">Week ${round.week}</div>
    `
    roundHeadersDiv.appendChild(headerDiv)
  })

  bracketContainer.appendChild(roundHeadersDiv)

  // Create bracket content
  const bracketContent = document.createElement("div")
  bracketContent.className = "bracket-content"

  // Filter matches to only include ones for the rounds we're showing
  const visibleWeeks = bracketData.rounds.map((r) => r.week)
  const visibleMatches = bracketData.matches.filter((match) => visibleWeeks.includes(match.week))

  // Group matches by round
  const roundGroups = {}
  bracketData.rounds.forEach((round) => {
    roundGroups[round.round] = {
      name: round.name,
      week: round.week,
      matches: visibleMatches.filter((match) => match.week === round.week),
    }
  })

  // Add rounds to the bracket
  Object.values(roundGroups)
    .sort((a, b) => a.week - b.week)
    .forEach((roundGroup) => {
      const roundColumn = document.createElement("div")
      roundColumn.className = "round-column"
      roundColumn.dataset.round = roundGroup.week.toString()

      // Sort matches by their position in the bracket
      const sortedMatches = roundGroup.matches.sort((a, b) => {
        const aPos = a.player1?.position || a.player2?.position || ""
        const bPos = b.player1?.position || b.player2?.position || ""
        return aPos.localeCompare(bPos)
      })

      // Add matches to the round
      sortedMatches.forEach((match) => {
        const matchCard = createMatchCard(match, poolName)
        roundColumn.appendChild(matchCard)
      })

      bracketContent.appendChild(roundColumn)
    })

  bracketContainer.appendChild(bracketContent)
  container.appendChild(bracketContainer)

  // Add bracket connectors in a second pass
  createBracketConnectors(bracketData, visibleMatches, bracketData.rounds.length)

  console.log("Compact bracket rendered successfully")
}

// Create a match card with compact styling
function createMatchCard(match, poolName) {
  const matchCard = document.createElement("div")
  matchCard.className = "matchup-card"
  matchCard.dataset.matchId = match.id

  const matchup = document.createElement("div")
  matchup.className = "matchup"

  // First player slot
  if (match.player1) {
    const player1Element = createPlayerSlot(match.player1, match.winner, poolName)
    matchup.appendChild(player1Element)
  } else {
    matchup.appendChild(createEmptySlot())
  }

  // Second player slot
  if (match.player2) {
    const player2Element = createPlayerSlot(match.player2, match.winner, poolName)
    matchup.appendChild(player2Element)
  } else {
    matchup.appendChild(createEmptySlot())
  }

  matchCard.appendChild(matchup)
  return matchCard
}

// Create a player slot with compact styling
function createPlayerSlot(player, winnerId, poolName) {
  const playerSlot = document.createElement("div")
  playerSlot.className = `player-slot ${player.isAdvancing ? "advancing" : ""}`
  playerSlot.dataset.playerId = player.id
  playerSlot.dataset.username = player.username

  // Create seed number
  const seedNumber = document.createElement("div")
  seedNumber.className = "seed-number"
  seedNumber.textContent = player.seed

  // Create player name
  const playerName = document.createElement("div")
  playerName.className = "player-name"
  playerName.textContent = player.username

  // Create player record
  const playerRecord = document.createElement("div")
  playerRecord.className = "player-record"
  playerRecord.textContent = `${player.win || 0}-${player.loss || 0}`

  // Add elements to player slot
  playerSlot.appendChild(seedNumber)
  playerSlot.appendChild(playerName)
  playerSlot.appendChild(playerRecord)

  // Add click handler to show picks
  playerSlot.addEventListener("click", () => {
    showPlayerPicks(player, poolName)
  })

  return playerSlot
}

// Create an empty TBD slot
function createEmptySlot() {
  const emptySlot = document.createElement("div")
  emptySlot.className = "tbd-slot"
  emptySlot.textContent = "TBD"
  return emptySlot
}

// Show player picks panel
function showPlayerPicks(player, poolName) {
  console.log(`Showing picks for ${player.username} in ${poolName}`)

  // Check if panel exists, create if not
  let picksPanel = document.getElementById("player-picks-panel")
  if (!picksPanel) {
    picksPanel = document.createElement("div")
    picksPanel.id = "player-picks-panel"
    picksPanel.className = "player-picks-panel"

    picksPanel.innerHTML = `
      <div class="panel-header">
        <h3 class="panel-title"><span id="selected-player-name">${player.username}</span>'s Picks</h3>
        <button class="close-btn">&times;</button>
      </div>
      <div class="player-record">
        <div class="record-item"><span>W:</span> <span id="player-wins">0</span></div>
        <div class="record-item"><span>L:</span> <span id="player-losses">0</span></div>
        <div class="record-item"><span>P:</span> <span id="player-pushes">0</span></div>
      </div>
      <div class="picks-container"></div>
    `

    document.body.appendChild(picksPanel)

    // Add close button event listener
    picksPanel.querySelector(".close-btn").addEventListener("click", () => {
      picksPanel.classList.remove("open")
    })
  } else {
    // Update player name
    document.getElementById("selected-player-name").textContent = player.username
  }

  // Clear existing picks
  const picksContainer = picksPanel.querySelector(".picks-container")
  picksContainer.innerHTML = '<div class="loading-spinner"></div>'

  // Fetch player picks and update panel
  fetchPicksForPlayoffPlayer(player.username, poolName)
    .then((picksData) => {
      picksContainer.innerHTML = ""

      // Update record
      document.getElementById("player-wins").textContent = player.win || "0"
      document.getElementById("player-losses").textContent = player.loss || "0"
      document.getElementById("player-pushes").textContent = player.push || "0"

      // Display picks
      if (picksData.picks && picksData.picks.length > 0) {
        picksData.picks.forEach((pick) => {
          const pickItem = document.createElement("div")
          pickItem.className = "pick-item"

          pickItem.innerHTML = `
            <img src="${pick.teamLogo || "/images/teams/Default.png"}" alt="${pick.teamName}" class="team-logo">
            <div class="pick-details">
              <div class="team-name">${pick.teamName}</div>
              <div class="line-value">${pick.value}</div>
            </div>
          `

          picksContainer.appendChild(pickItem)
        })
      } else {
        // No picks message
        const noPicks = document.createElement("div")
        noPicks.className = "no-picks-message"
        noPicks.textContent = "No picks available for this player"
        picksContainer.appendChild(noPicks)
      }
    })
    .catch((error) => {
      console.error("Error fetching picks:", error)
      picksContainer.innerHTML = `
        <div class="error-message">Failed to load picks</div>
        <button class="retry-button">Retry</button>
      `

      // Add retry button event listener
      picksContainer.querySelector(".retry-button").addEventListener("click", () => {
        showPlayerPicks(player, poolName)
      })
    })

  // Show the panel
  picksPanel.classList.add("open")
}

// Fetch picks for playoff player
async function fetchPicksForPlayoffPlayer(username, poolName) {
  try {
    const encodedUsername = encodeURIComponent(username)
    const encodedPoolName = encodeURIComponent(`playoff_${poolName}`)
    const url = `/api/getPicks/${encodedUsername}/${encodedPoolName}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching playoff picks:", error)
    return { picks: [], immortalLock: [] }
  }
}

// Initialize bracket when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const bracketContainer = document.querySelector(".playoff-bracket-container")
  if (bracketContainer) {
    const poolName = bracketContainer.dataset.poolName
    if (poolName) {
      // Show loading state
      bracketContainer.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading bracket...</div>
        </div>
      `

      // Fetch bracket data
      fetch(`/api/playoffs/${encodeURIComponent(poolName)}/bracket`)
        .then((response) => response.json())
        .then((data) => {
          if (data.success && data.bracket) {
            renderBracket(data.bracket, bracketContainer, poolName)
          } else {
            throw new Error(data.message || "Failed to load bracket data")
          }
        })
        .catch((error) => {
          console.error("Error loading bracket:", error)
          bracketContainer.innerHTML = `
            <div class="error-container">
              <div class="error-message">Failed to load bracket</div>
              <button class="retry-button">Retry</button>
            </div>
          `

          // Add retry button event listener
          bracketContainer.querySelector(".retry-button").addEventListener("click", () => {
            location.reload()
          })
        })
    }
  }
})

*/