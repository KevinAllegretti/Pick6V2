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
           // console.log('Fetched pool data:', poolData);

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
        document.querySelector('#slideOutPanelInPool .profile-icon-center').src = userData.profilePicture ||'Default.png';
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
        if (event.target.closest('.player-username') || event.target.closest('.player-profile-pic')) {
            const username = event.target.closest('.player-user').querySelector('.player-username').textContent.trim()
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


/*
// V3 for pool man
document.addEventListener('DOMContentLoaded', function() {
    // Tab Switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.add('hidden'));

            // Add active class to clicked button and show corresponding content
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
            const selectedMode = card.dataset.mode;
            // You can store the selected mode or trigger other actions here
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
        
        // Update button text and icon
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

    // Form Submission
    const createPoolForm = document.getElementById('create-pool-form');
    const joinPoolForm = document.getElementById('join-pool-form');

    createPoolForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Add your pool creation logic here
        const formData = new FormData(createPoolForm);
        // You can access the selected mode and other form data here
    });

    joinPoolForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Add your pool joining logic here
        const formData = new FormData(joinPoolForm);
    });
});
*/

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

           // In your displayNewPoolContainer function, replace the existing button setup with:
const choosePicksButton = poolContainer.querySelector('.choose-picks-button');
choosePicksButton.onclick = (event) => {
    if (choosePicksButton.classList.contains('disabled')) {
        event.preventDefault();
        showGameTimeAlert(event);
    } else {
        redirectToDashboard(pool.name);
    }
};

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
    const urlRegex = /(https?:\/\/[^\s]+)/g; // Regex to identify URLs

    messages.forEach(msg => {
        const prefix = msg.poolName ? '[L]' : '[G]';
        const messageElement = document.createElement('div');

        // Create a span for the username with a specific color
        const usernameSpan = document.createElement('span');
       //usernameSpan.style.color= '#ff7b00 '; //halloween version
         usernameSpan.style.color = '#33d9ff';
        usernameSpan.textContent = `${msg.username}: `;

        // Create a span for the message
        const messageSpan = document.createElement('span');
        messageSpan.innerHTML = msg.message.replace(urlRegex, function(url) {
            return `<a href="${url}" target="_blank">${url}</a>`; // Replace URLs with anchor tags
        });

        // Append the username and message spans to the message element
        messageElement.appendChild(document.createTextNode(`${prefix} `));
        messageElement.appendChild(usernameSpan);
        messageElement.appendChild(messageSpan);

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

function redirectToNFLSchedule(source) {
    window.location.href = `scheduler.html?source=${encodeURIComponent(source)}`;
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
       // console.log(`Fetching data for username: ${member.username}`); // This should log the actual username, not [object Object]
        // Directly use member.username since it is already a direct property of the member object
        const username = member.username;
      
        // Fetch user profile
        return fetch(`/api/getUserProfile/${member.username}`)
          .then(response => response.json())
          .then(userProfile => {
            // Fetch the user picks
            const poolName = pool.name; 
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
    const playoffSeeds = {
        'matt allegretti': 1,
        'keys to the yard': 2,
        'brett.niermeier': 3,
        'kevdoer island': 4,
        'parlay prodigy': 5,
        'midnight professional': 7,
        'pedrissimo': 8,
        'helen hlushko': 6,
        'chrisruiz': 10,
        'upperdeckysiuuup': 9
    };
    
       // Color pairs for playoff matchups
       const seedColors = {
        // 7 vs 10 - Red pairing
        7: '#ff3333',
        10: '#ff3333',
        // 4 vs 5 - Green pairing
        4: '#33cc33',
        5: '#33cc33',
        // 8 vs 9 - Orange pairing
        8: '#ff9933',
        9: '#ff9933',
        // 3 vs 6 - Purple pairing
        3: '#9933ff',
        6: '#9933ff',
        // 1 vs 2 - Blue pairing
        1: '#3366ff',
        2: '#ff9933'
    };
    
    console.log('Creating row for user:', memberData.username);
    console.log('Seed mapping for this user:', playoffSeeds[memberData.username.toLowerCase()]);
    
    const playerRow = document.createElement('div');
    playerRow.className = 'player-row';
    
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

    // Get the pool name from the DOM (needs a slight delay to ensure DOM is ready)
    setTimeout(() => {
        const poolWrapper = playerRow.closest('.pool-wrapper');
        if (poolWrapper) {
            const poolName = poolWrapper.getAttribute('data-pool-name');
            const userSection = playerRow.querySelector('.player-user');
            
            if (poolName === 'Gauntlet Playoffs' && playoffSeeds[memberData.username.toLowerCase()]) {
                const seedNumber = playoffSeeds[memberData.username.toLowerCase()];
                const seedColor = seedColors[seedNumber];
                
                const hexToRgb = (hex) => {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? {
                        r: parseInt(result[1], 16),
                        g: parseInt(result[2], 16),
                        b: parseInt(result[3], 16)
                    } : null;
                };

                const rgbColor = hexToRgb(seedColor);
                if (rgbColor) {
                    // Set the RGB values as a CSS variable on the player-user element
                    userSection.style.setProperty('--seed-rgb', `${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}`);
                }
                const seedBadge = document.createElement('span');
                seedBadge.className = 'seed-badge';
                seedBadge.textContent = `#${seedNumber}`;
                
                // Enhanced styling with color pairing
                seedBadge.style.marginLeft = '2px';
                seedBadge.style.marginRight = '2px';
                seedBadge.style.padding = '2px 8px';
                seedBadge.style.backgroundColor = '#0a192f';
                seedBadge.style.color = seedColor;
                seedBadge.style.borderRadius = '4px';
                seedBadge.style.fontSize = '0.9em';
                seedBadge.style.fontWeight = 'bold';
                seedBadge.style.border = `1px solid ${seedColor}`;
                seedBadge.style.boxShadow = `0 0 5px ${seedColor}80`; // 80 adds 50% opacity to the glow
                
                // Add hover effect to show matchup
               // seedBadge.title = `Matchup: ${getMatchupText(seedNumber)}`;
                
                userSection.appendChild(seedBadge);
            }
        }
    }, 100);
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
