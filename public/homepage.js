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
            console.warn(`No matching result found for ${teamName} with bet value ${displayedBetValue}`);
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
        console.log("now: ", now);
        const tuesdayTime = new Date(tuesdayStartTime);
        const thursdayTime = new Date(thursdayDeadline);
        console.log("Tuesday Start time: ", tuesdayTime);
        console.log("thursday deadline: ", thursdayTime);
        
        if (now > tuesdayTime && now < thursdayTime) {
            console.log('Current time window: Pick Time');
            enablePickTimeFeatures();
        } else if (now > thursdayTime && now < tuesdayTime) {
            console.log('Current time window: Game Time');
            enableGameTimeFeatures();
            setupGameTimeListeners(); // Add this line
        } else {
            console.log('Error determining the current time window');
        }
    } catch (error) {
        console.error('Error checking current time window:', error);
    }
}




// Function to enable pick time features
function enableGameTimeFeatures() {
    // Select all choose picks buttons across all pools
    const choosePicksButtons = document.querySelectorAll('.choose-picks-button');
    
    if (choosePicksButtons.length > 0) {
        choosePicksButtons.forEach(button => {
            button.classList.add('disabled');
            button.textContent = 'Selections Unavailable';
        });
    } else {
        console.error('No choose picks buttons found');
    }
}

function enablePickTimeFeatures() {
    // Select all choose picks buttons across all pools
    const choosePicksButtons = document.querySelectorAll('.choose-picks-button');
    
    if (choosePicksButtons.length > 0) {
        choosePicksButtons.forEach(button => {
            button.classList.remove('disabled');
            button.textContent = 'Make Picks';
        });
    } else {
        console.error('No choose picks buttons found');
    }
}



function showGameTimeAlert(event) {
    event.preventDefault(); // Prevent default action
    alert("It's Game Time! Pick selection page not available.");
}

function updateNavUsername() {
    const username = localStorage.getItem('username');
    if (username) {
      document.getElementById('navUsername').textContent = username;
    }
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
        if (event.target.closest('.player-username') || event.target.closest('.player-profile-pic')) {
            const username = event.target.closest('.player-user').querySelector('.player-username').textContent.trim()
            showInPoolUserProfile(username);
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


//START OF POOLS AND PLAYERROWS
/*
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
*/
document.addEventListener('DOMContentLoaded', function() {
    const globalPicksButton = document.getElementById('globalPicksButton');
    if (globalPicksButton) {
        globalPicksButton.addEventListener('click', async function() {
            // Check if it's pick time before allowing access
            const isPickTime = await isCurrentTimePickTime();
            if (!isPickTime) {
                showGameTimeAlert(event);
                return;
            }
            // Redirect to dashboard without specific pool parameter
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
const createPoolForm = document.getElementById('create-pool-form');
createPoolForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const poolName = createPoolForm.querySelector('input[type="text"]').value.trim();
    const poolPassword = createPoolForm.querySelector('input[type="password"]')?.value;
    const username = localStorage.getItem('username');

    if (!username) {
        alert('Username not found. Please log in again.');
        return;
    }

    const payload = {
        name: poolName,
        isPrivate: isPrivate,
        adminUsername: username.toLowerCase(),
        mode: selectedMode,
        ...(isPrivate && { password: poolPassword })
    };

    try {
        const response = await fetch('/pools/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 409) {
                alert('The pool name is already taken. Please choose another name.');
                return;
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.message && data.pool) {
            // Show quick success message
            alert('Pool created successfully!');
            // Force page reload
            window.location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while creating the pool.');
    }
});

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
            const response = await fetch('/pools/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    poolName: poolName,
                    username: username.toLowerCase(),
                    password: poolPassword
                })
            });

            if (!response.ok) {
                if (response.status === 404) {
                    alert('Pool not found.');
                    return;
                }
                if (response.status === 403) {
                    alert('Incorrect password.');
                    return;
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            if (data.message) {
                // Reset form
                joinPoolForm.reset();
                
                // Show success message or redirect
                alert('Successfully joined the pool!');
                // Optional: redirect to the pool
                // window.location.href = `/pool/${data.poolId}`;
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
function displayNewPoolContainer(pool) {
    if (pool.mode === 'survivor') {
        displaySurvivorPool(pool);
        return; // Exit early since we're using the survivor display
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
    let currentUsername = localStorage.getItem('username');

    if (currentUsername) {
        currentUsername = currentUsername.toLowerCase();
        const isAdmin = currentUsername === pool.adminUsername.toLowerCase();

        const poolContainerWrapper = document.getElementById('pool-container-wrapper');
        const poolWrapper = document.createElement('div');
        poolWrapper.className = 'pool-wrapper';
        poolWrapper.setAttribute('data-pool-name', pool.name);

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
                <option value="all">View All</option>
            </select>
            <span class="dropdown-arrow">▼</span>
        `;

        poolWrapper.setAttribute('data-admin-username', pool.adminUsername);


        const select = viewDropdown.querySelector('select');
        select.addEventListener('change', (e) => {
            setTimeout(() => {
                const container = poolContainer;
                const allRows = [...container.querySelectorAll('.player-row')];
                const currentUserRow = container.querySelector('.current-user-row');
                const currentUserIndex = allRows.indexOf(currentUserRow);
                
                console.log('Total rows:', allRows.length);
                console.log('Current user row found:', !!currentUserRow);
                console.log('Current user index:', currentUserIndex);
                console.log('Selected view:', e.target.value);
                
                // Hide all rows initially
                allRows.forEach(row => row.style.display = 'none');
                
                if (e.target.value === 'aroundMe' && currentUserRow) {
                    console.log('Entering aroundMe mode with current user');
                    // Remove any existing "Show More" button
                    const existingButton = container.querySelector('.show-more-button');
                    if (existingButton) existingButton.remove();

                    let startIndex = 0;
                    let endIndex = Math.min(10, allRows.length);

                    if (currentUserIndex >= 5 && currentUserIndex < allRows.length - 5) {
                        startIndex = currentUserIndex - 5;
                        endIndex = currentUserIndex + 5;
                    } else if (currentUserIndex >= allRows.length - 5) {
                        startIndex = Math.max(0, allRows.length - 10);
                        endIndex = allRows.length;
                    }

                    console.log('Showing rows from index', startIndex, 'to', endIndex);
                    // Show only the selected range of rows (maximum 10)
                    for (let i = startIndex; i < endIndex; i++) {
                        allRows[i].style.display = '';
                    }
                } else {
                    console.log('Entering default/view all mode');
                    // View All mode or no current user found
                    // Show first 10 rows only by default
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
                        
                        let expanded = false;
                        showMoreButton.addEventListener('click', () => {
                            if (!expanded) {
                                allRows.forEach(row => row.style.display = '');
                                showMoreButton.innerHTML = `
                                    <i class="fas fa-chevron-down"></i>
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
                    
                        const existingButton = container.querySelector('.show-more-button');
                        if (existingButton) existingButton.remove();
                        
                        container.appendChild(showMoreButton);
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
            <span class="header-picks">
               <!-- <button id="choosePicksButton" class="choose-picks-button">Make Picks</button> -->
             Picks
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
            poolWrapper.appendChild(poolNameContainer);
            poolWrapper.appendChild(poolScrollableContainer);

            // Append chat container from template
            const chatTemplate = document.getElementById('chat-template').content.cloneNode(true);
            poolWrapper.appendChild(chatTemplate);

            poolAndDeleteContainer.appendChild(poolWrapper);


            poolContainerWrapper.appendChild(poolAndDeleteContainer);

            const choosePicksButton = poolContainer.querySelector('.choose-picks-button');
            if (choosePicksButton) {
                choosePicksButton.onclick = (event) => {
                    if (choosePicksButton.classList.contains('disabled')) {
                        event.preventDefault();
                        showGameTimeAlert(event);
                    } else {
                        redirectToDashboard(pool.name);
                    }
                };
            }
            updatePoolActionsList();
            // Move this code here, after all rows are created
            setTimeout(() => {
                select.value = 'aroundMe';
                select.dispatchEvent(new Event('change'));
            }, 100);

            setTimeout(() => {
                checkCurrentTimeWindow();
            }, 50);
        }).catch(error => {
            console.error('Error fetching member data:', error);
        });
    } else {
        console.log("No username found in localStorage");
    }
}
function updatePoolActionsList() {
    const poolActionsList = document.querySelector('.pool-actions-list');
    if (!poolActionsList) return;

    poolActionsList.innerHTML = '';
    const pools = document.querySelectorAll('.pool-wrapper');
    const currentUsername = localStorage.getItem('username').toLowerCase();

    // Add reorder hint
    const hintDiv = document.createElement('div');
    hintDiv.className = 'reorder-hint';
    hintDiv.innerHTML = '<i class="fas fa-sort"></i> Rearrange pools using arrows';
    poolActionsList.appendChild(hintDiv);

    const poolsArray = Array.from(pools);
    poolsArray.forEach((poolWrapper, index) => {
        const poolName = poolWrapper.getAttribute('data-pool-name');
        const isSurvivorPool = poolWrapper.classList.contains('survivor-mode');
        const poolAdmin = poolWrapper.getAttribute('data-admin-username');
        const isAdmin = poolAdmin && poolAdmin.toLowerCase() === currentUsername;

        const actionItem = document.createElement('div');
        actionItem.className = 'pool-action-item';

        // Add order buttons
        const orderButtons = document.createElement('div');
        orderButtons.className = 'pool-order-buttons';
        
        const upButton = document.createElement('button');
        upButton.className = 'order-button';
        upButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
        upButton.disabled = index === 0;
        upButton.onclick = () => movePool(poolName, 'up');

        const downButton = document.createElement('button');
        downButton.className = 'order-button';
        downButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
        downButton.disabled = index === poolsArray.length - 1;
        downButton.onclick = () => movePool(poolName, 'down');

        orderButtons.appendChild(upButton);
        orderButtons.appendChild(downButton);

        // Existing pool name and buttons
        const nameSpan = document.createElement('span');
        nameSpan.className = 'pool-name-text';
        nameSpan.textContent = poolName;

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'pool-action-buttons';

        upButton.onclick = async () => {
            try {
                const response = await movePool(poolName, 'up');
                if (response.success) {
                    // Add visual feedback
                    upButton.classList.add('success');
                    setTimeout(() => upButton.classList.remove('success'), 500);
                    loadAndDisplayUserPools();
                } else {
                    console.error('Failed to move pool:', response.message);
                }
            } catch (error) {
                console.error('Error moving pool:', error);
            }
        };
        downButton.onclick = async () => {
            try {
                const response = await movePool(poolName, 'down');
                if (response.success) {
                    // Add visual feedback
                    downButton.classList.add('success');
                    setTimeout(() => downButton.classList.remove('success'), 500);
                    loadAndDisplayUserPools();
                } else {
                    console.error('Failed to move pool:', response.message);
                }
            } catch (error) {
                console.error('Error moving pool:', error);
            }
        };
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

    const payload = {
        username: username,
        poolName: poolName,
        direction: direction
    };

    console.log('Sending reorder request with payload:', payload); // Add this

    try {
        const response = await fetch('/pools/reorder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Received response:', data); // Add this
        return data;
    } catch (error) {
        console.error('Error reordering pools:', error);
        throw error;
    }
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

function redirectToNFLSchedule(source) {
    window.location.href = `scheduler.html?source=${encodeURIComponent(source)}`;
}
function loadAndDisplayUserPools() {
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername) {
        console.error('No logged-in user found!');
        return;
    }

    fetch(`/pools/userPools/${encodeURIComponent(currentUsername.toLowerCase())}`)
        .then(response => response.json())
        .then(pools => {
            const poolContainerWrapper = document.getElementById('pool-container-wrapper');
            poolContainerWrapper.innerHTML = '';

            // More robust sorting with backup criteria
            pools.sort((a, b) => {
                const memberA = a.members.find(m => m.username.toLowerCase() === currentUsername.toLowerCase());
                const memberB = b.members.find(m => m.username.toLowerCase() === currentUsername.toLowerCase());
                
                // Primary sort by orderIndex
                const orderA = memberA?.orderIndex ?? Number.MAX_SAFE_INTEGER;
                const orderB = memberB?.orderIndex ?? Number.MAX_SAFE_INTEGER;
                
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                
                // Secondary sort by pool name if orderIndex is the same
                return a.name.localeCompare(b.name);
            });

            // Force browser to respect the order by using async rendering
            const renderPool = (index) => {
                if (index >= pools.length) return;
                
                const pool = pools[index];
                if (pool.mode === 'survivor') {
                    displaySurvivorPool(pool);
                } else {
                    // Keep existing classic pool display logic
                    pool.members.sort((a, b) => b.points - a.points);

                    const poolContainer = document.createElement('div');
                    poolContainer.className = 'pool-container';

                    const membersDataPromises = pool.members.map(member => {
                        return fetch(`/api/getUserProfile/${member.username}`)
                            .then(response => response.json())
                            .then(userProfile => {
                                const poolName = pool.name;
                                const encodedPoolName = encodeURIComponent(poolName);
                                return fetch(`/api/getPicks/${member.username}/${encodedPoolName}`)
                                    .then(response => response.json())
                                    .then(userPicks => {
                                        return { userProfile, userPicks };
                                    });
                            });
                    });

                    Promise.all(membersDataPromises)
                        .then(membersData => {
                            membersData.forEach((data, index) => {
                                const { userProfile, userPicks } = data;
                                const playerRow = createPlayerRow({
                                    rank: index + 1,
                                    username: userProfile.username,
                                    profilePic: userProfile.profilePicture,
                                    points: userProfile.points,
                                    wins: userProfile.wins,
                                    losses: userProfile.losses,
                                    pushes: userProfile.pushes,
                                    picks: userPicks ? userPicks.picks : []
                                }, userProfile.username === pool.adminUsername);

                                fetchPicks(userProfile.username, pool.name, playerRow, teamLogos);
                                poolContainer.appendChild(playerRow);
                            });

                            displayNewPoolContainer(pool);
                        })
                        .catch(error => {
                            console.error('Error fetching member data:', error);
                        });
                }

                // Render next pool in next tick
                setTimeout(() => renderPool(index + 1), 0);
            };

            // Start the sequential rendering
            renderPool(0);
        })
        .catch(error => console.error('Error fetching pools for user:', error));

    document.addEventListener('DOMContentLoaded', startMessageRefresh);
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
  
document.addEventListener('DOMContentLoaded', loadAndDisplayUserPools);


function createPlayerRow(memberData, isAdmin, totalMembers) {

    const playerRow = document.createElement('div');
    playerRow.className = 'player-row';
    
    const currentUsername = localStorage.getItem('username');
    if (currentUsername && memberData.username.toLowerCase() === currentUsername.toLowerCase()) {
        playerRow.classList.add('current-user-row');
    }
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

function displaySurvivorPool(pool) {
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername) {
        console.error('No logged-in user found!');
        return;
    }

    const teamLogos = {
        'Arizona Cardinals': '/ARILogo.png',
        'Atlanta Falcons': '/ATLLogo.png',
        // ... (rest of your team logos)
    };

    const poolContainerWrapper = document.getElementById('pool-container-wrapper');
    const poolWrapper = document.createElement('div');
    poolWrapper.className = 'pool-wrapper survivor-mode';
    poolWrapper.setAttribute('data-pool-name', pool.name);
    poolWrapper.setAttribute('data-admin-username', pool.adminUsername); 
    // Pool name container
    const poolNameContainer = document.createElement('div');
    poolNameContainer.className = 'pool-name-container';
    
    const poolNameDiv = document.createElement('div');
    poolNameDiv.className = 'survivor-pool-name';
    poolNameDiv.innerText = pool.name;

    // User count
    const userCountDiv = document.createElement('div');
    userCountDiv.className = 'survivor-user-count';
    userCountDiv.innerHTML = `
        <i class="fas fa-users"></i>
        <span>${pool.members.length}</span>
    `;

    poolNameContainer.appendChild(poolNameDiv);
    poolNameContainer.appendChild(userCountDiv);

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
        <span class="survivor-header-user">User</span>
        <span class="survivor-header-picks">Pick</span>
        <span class="survivor-header-eliminated">Status</span>
    `;
    poolContainer.appendChild(poolHeader);

    // Process members
    const memberDataPromises = pool.members.map(member => 
        fetchUserProfile(member.username).then(userProfile => ({
            username: userProfile.username,
            profilePic: userProfile.profilePicture,
            isEliminated: member.isEliminated || false
        }))
    );

    Promise.all(memberDataPromises).then(membersData => {
        membersData.forEach(memberData => {
            const playerRow = createSurvivorPlayerRow(memberData, currentUsername);
            fetchSurvivorPick(memberData.username, pool.name, playerRow, teamLogos);
            poolContainer.appendChild(playerRow);
        });

        poolScrollableContainer.appendChild(poolContainer);
        poolWrapper.appendChild(poolNameContainer);
        poolWrapper.appendChild(poolScrollableContainer);

        // Add admin/leave button if necessary
        addPoolControls(poolWrapper, pool, currentUsername);

        poolContainerWrapper.appendChild(poolWrapper);
    });
}

function createSurvivorPlayerRow(memberData, currentUsername) {
    const playerRow = document.createElement('div');
    playerRow.className = 'survivor-player-row';
    
    if (memberData.username.toLowerCase() === currentUsername.toLowerCase()) {
        playerRow.classList.add('survivor-current-user-row');
    }

    playerRow.innerHTML = `
        <div class="survivor-player-user">
            <div class="survivor-profile-pic" style="background-image: url('${memberData.profilePic}')"></div>
            <span class="player-username">${memberData.username}</span>
        </div>
        <div class="survivor-player-picks"></div>
        <div class="survivor-player-eliminated">
            <span class="${memberData.isEliminated ? 'eliminated-status' : 'active-status'}">
                ${memberData.isEliminated ? 'ELIMINATED' : 'ACTIVE'}
            </span>
        </div>
    `;

    return playerRow;
}

async function fetchSurvivorPick(username, poolName, playerRow, teamLogos) {
    const isPickTime = await isCurrentTimePickTime();
    const encodedUsername = encodeURIComponent(username);
    const encodedPoolName = encodeURIComponent(poolName);
    
    try {
        const response = await fetch(`/api/getSurvivorPick/${encodedUsername}/${encodedPoolName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const pickData = await response.json();
        const picksContainer = playerRow.querySelector('.survivor-player-picks');
        picksContainer.innerHTML = '';

        if (username === localStorage.getItem('username').toLowerCase() || !isPickTime) {
            if (pickData && pickData.pick) {
                const pickDiv = document.createElement('div');
                pickDiv.className = 'survivor-pick';

                const teamName = pickData.pick.teamName;
                if (teamName && teamLogos[teamName]) {
                    const logoImg = document.createElement('img');
                    logoImg.src = teamLogos[teamName];
                    logoImg.alt = teamName;
                    logoImg.className = 'team-logo';
                    pickDiv.appendChild(logoImg);
                }

                picksContainer.appendChild(pickDiv);
            } else {
                const noPickMessage = document.createElement('div');
                noPickMessage.className = 'no-picks-message';
                noPickMessage.textContent = 'No pick made';
                picksContainer.appendChild(noPickMessage);
            }
        } else {
            const bannerImage = document.createElement('img');
            bannerImage.src = 'PickTimeNew.png';
            bannerImage.alt = 'Player Making Selection';
            bannerImage.className = 'pick-banner';
            picksContainer.appendChild(bannerImage);
        }
    } catch (error) {
        console.error('Error fetching survivor pick:', error);
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