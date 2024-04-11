
document.addEventListener('DOMContentLoaded', function() {
    // Handling username and redirection
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    if (username) {
        localStorage.setItem('username', username);
    }

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
    
    const loggedInUsername = localStorage.getItem('username');
   // console.log("Script is loaded!");
    console.log("Logged in user:", loggedInUsername);

    //PROFILE AND SLIDE
    const profileIcon = document.getElementById('profileIcon');
    const slideOutPanel = document.getElementById('slideOutPanel');
    const closePanelBtn = document.getElementById('closePanelBtn');

    
    profileIcon.addEventListener('click', () => {
        console.log('Profile icon clicked'); // Log on click
        slideOutPanel.classList.add('visible'); // Show the slide-out panel
    });

    closePanelBtn.addEventListener('click', () => {
        slideOutPanel.classList.remove('visible'); // Hide the slide-out panel

    });
    
    document.addEventListener('click', (event) => {
        const withinBoundaries = event.composedPath().includes(slideOutPanel);
        const clickedOnProfileIcon = event.composedPath().includes(profileIcon);
    
        if (!withinBoundaries && !clickedOnProfileIcon && slideOutPanel.classList.contains('visible')) {
            slideOutPanel.classList.remove('visible');
        }
    });
    
    document.getElementById('logout-button').addEventListener('click', function() {
        // Clear user session or local storage
        localStorage.removeItem('username'); 
    
        // Redirect to the login page
        window.location.href = '/login.html'; 
    });
    
    profileIcon.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from propagating to the document
        slideOutPanel.classList.add('visible');
    });
    
    slideOutPanel.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from propagating to the document
    });
    

    window.addEventListener('load', () => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            document.getElementById('displayName').textContent = storedUsername;
        }
    });
    
    // Gets user profile
    window.addEventListener('load', async () => {
        // Rest of your load event code...

        const username = localStorage.getItem('username').toLowerCase(); // Get the username from local storage

        try {
            // Fetch user data from the server
            const response = await fetch(`/api/getUserProfile/${username}`);
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            const userData = await response.json();

            // Set the user's profile image if it exists, otherwise set to default
            const profilePicSrc = userData.profilePicture || 'Default.png';
            document.querySelector('.profile-icon').src = profilePicSrc;
            document.querySelector('.profile-icon-center').src = profilePicSrc;
        } catch (error) {
            console.error('Error fetching user data:', error);
            // Set to default image in case of an error
            document.querySelector('.profile-icon').src = 'Default.png';
            document.querySelector('.profile-icon-center').src = 'Default.png';
        }
    });

    
    // Add event listener for file input to handle the upload
    document.getElementById('profilePic').addEventListener('change', async (event) => {
        const fileInput = event.target;
        const file = fileInput.files[0];
    
        if (file) {
            const formData = new FormData();
            formData.append('profilePic', file);
            formData.append('username', localStorage.getItem('username').toLowerCase());
    
            try {
                // Make the request to the server
                const response = await fetch('/api/uploadProfilePicture', {
                    method: 'POST',
                    body: formData, // Send the form data
                });
    
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }
    
                const result = await response.json();
    
                // Upload was successful
                //console.log(result.message);
                // Update the profile picture on the page
                document.querySelector('.profile-icon').src = result.filePath;
                document.querySelector('.profile-icon-center').src = result.filePath;
    
            } catch (error) {
                console.error('Upload error:', error);
            }
        } else {
           // console.log('No file selected.');
        }
    });
    



    const cards = document.querySelectorAll('.player-card');
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            const cardUsername = e.currentTarget.getAttribute('data-username');
            console.log("Card clicked:", cardUsername);  
            
            //comment out during play time
     
            //if ((now > thursdayDeadline && now < tuesdayEndTime && cardUsername && cardUsername === loggedInUsername)) {
                console.log("Redirecting to dashboard");
                window.location.href = `/dashboard?username=${cardUsername}`;
           /* }
            else{
                console.log("Cannot access selection page during game hours");
            } */
        
        });
    });
    
    tuesdayEndTime = 5;
    now = 4;
    thursdayDeadline = 6;


    async function pickWindowPlayerCard(){
        if (now > thursdayDeadline && now < tuesdayEndTime){
            const loggedInUsername = localStorage.getItem('username');
            const userCard = document.querySelector(`.player-card[data-username="${loggedInUsername}"]`);
    
               // Populate the picks for the user card
               const picksDiv = userCard.querySelector('.picks');
               picksDiv.innerHTML = ''; // Clear existing picks
                
               const response = await fetch(`/api/getPicks/${loggedInUsername}`);
                if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
                } else {
                const data = await response.json();

               if (data && data.picks) {
                   data.picks.forEach(pick => {
                       const pickDiv = document.createElement('div');
                       pickDiv.classList.add('pick');
                       // ... rest of your code to populate the pickDiv ...
                       // Extract the team name using a regular expression
                       const teamNameMatch = pick.match(/^(.*?)\s\[/);
                       const teamName = teamNameMatch ? teamNameMatch[1] : null;
                       const valueMatch = pick.match(/\[.*?([-+]\d+(?:\.\d+)?)\]/);
                       const value = valueMatch ? valueMatch[1] : null;
       
                       if (teamName && teamLogos[teamName]) {
                           const logoUrl = teamLogos[teamName];
                           const logoImg = document.createElement('img');
                           logoImg.src = logoUrl;
                           logoImg.alt = `${teamName}`;
                           logoImg.classList.add('team-logo');
                           pickDiv.appendChild(logoImg);
                       }
       
                       if (value) {
                           const valueSpan = document.createElement('span');
                           valueSpan.textContent = value;
                           pickDiv.appendChild(valueSpan);
                       }
       
                       picksDiv.appendChild(pickDiv);
                   });
               }
       
               // Populate the immortal lock for the user card
               const immortalLockDiv = userCard.querySelector('.immortal-lock');
               immortalLockDiv.innerHTML = ''; // Clear existing content
           
               if (data.immortalLock && data.immortalLock[0]) {
                   const immortalPick = data.immortalLock[0];
                   const pickDiv = document.createElement('div');
                   pickDiv.classList.add('pick', 'immortal-pick');
           
                   // Create and append the "Immortal Lock:" text
                   const immortalTextSpan = document.createElement('span');
                   immortalTextSpan.textContent = 'Immortal Lock: ';
                   pickDiv.appendChild(immortalTextSpan);
           
                   // Extract the team name and value using the same regex as before
                   const teamNameMatch = immortalPick.match(/^(.*?)\s\[/);
                   const teamName = teamNameMatch ? teamNameMatch[1] : null;
                   const valueMatch = immortalPick.match(/\[.*?([-+]\d+(?:\.\d+)?)\]/);
                   const value = valueMatch ? valueMatch[1] : null;
           
                   if (teamName && teamLogos[teamName]) {
                       const logoUrl = teamLogos[teamName];
                       const logoImg = document.createElement('img');
                       logoImg.src = logoUrl;
                       logoImg.alt = `${teamName}`; // The alt attribute remains for accessibility
                       logoImg.classList.add('team-logo');
                       pickDiv.appendChild(logoImg);
                   }
           
                   if (value) {
                       const valueSpan = document.createElement('span');
                       valueSpan.textContent = value; // Only the numeric value is displayed
                       pickDiv.appendChild(valueSpan);
                   }
           
                   // Append the Immortal Lock pick to the container
                   immortalLockDiv.appendChild(pickDiv);
               } else {
                   immortalLockDiv.textContent = 'Immortal Lock: Not Set';
               }
           }}
        else{
            populateUserData();
            console.log("Fetch all");
        }
        
    }
    
    
    
    async function populateUserData() {
        const userCards = document.querySelectorAll('.player-card');
        //start here
        for (let card of userCards) {
            const username = card.getAttribute('data-username');
            try {
                const response = await fetch(`/api/getPicks/${username}`);
                const data = await response.json();
                if (data && data.picks && data.immortalLock) {
                    const picksDiv = card.querySelector('.picks');
                    data.picks.forEach(pick => {
                        const pickDiv = document.createElement('div');
                        pickDiv.classList.add('pick');
    
                        // Extract the team name using a regular expression
                        const teamNameMatch = pick.match(/^(.*?)\s\[/);
                        const teamName = teamNameMatch ? teamNameMatch[1] : null;
                        // Extract the numeric value using a regular expression
                        const valueMatch = pick.match(/\[.*?([-+]\d+(?:\.\d+)?)\]/);
                        const value = valueMatch ? valueMatch[1] : null;
    
                        if (teamName && teamLogos[teamName]) {
                            const logoUrl = teamLogos[teamName];
                            const logoImg = document.createElement('img');
                            logoImg.src = logoUrl;
                            logoImg.alt = `${teamName}`; // The alt attribute remains for accessibility
                            logoImg.classList.add('team-logo');
                            pickDiv.appendChild(logoImg);
                        }
    
                        // Create a span for the numeric value and append it
                        if (value) {
                            const valueSpan = document.createElement('span');
                            valueSpan.textContent = value; // Only the numeric value is displayed
                            pickDiv.appendChild(valueSpan);
                        }
    
                        picksDiv.appendChild(pickDiv);
                    });

                    const immortalLockDiv = card.querySelector('.immortal-lock');
                    // Clear previous content
                    immortalLockDiv.innerHTML = '';
                    
                    if (data.immortalLock && data.immortalLock[0]) {
                        const immortalPick = data.immortalLock[0];
                        const pickDiv = document.createElement('div');
                        pickDiv.classList.add('pick', 'immortal-pick');
                    
                        // Create and append the "Immortal Lock:" text
                        const immortalTextSpan = document.createElement('span');
                        immortalTextSpan.textContent = 'Immortal Lock: ';
                        pickDiv.appendChild(immortalTextSpan);
                        // Extract the team name and value using the same regex as before
                        const teamNameMatch = immortalPick.match(/^(.*?)\s\[/);
                        const teamName = teamNameMatch ? teamNameMatch[1] : null;
                        const valueMatch = immortalPick.match(/\[.*?([-+]\d+(?:\.\d+)?)\]/);
                        const value = valueMatch ? valueMatch[1] : null;
                    
                        if (teamName && teamLogos[teamName]) {
                            const logoUrl = teamLogos[teamName];
                            const logoImg = document.createElement('img');
                            logoImg.src = logoUrl;
                            logoImg.alt = `${teamName}`; // The alt attribute remains for accessibility
                            logoImg.classList.add('team-logo');
                            pickDiv.appendChild(logoImg);
                        }
                    
                        if (value) {
                            const valueSpan = document.createElement('span');
                            valueSpan.textContent = value; // Only the numeric value is displayed
                            pickDiv.appendChild(valueSpan);
                        }
                    
                        // Append the Immortal Lock pick to the container
                        immortalLockDiv.appendChild(pickDiv);
                    } else {
                        immortalLockDiv.textContent = 'Immortal Lock: Not Set';
                    }
                }
            } catch (error) {
                console.error('Error fetching data for', username, error);
            }
        } //end here
        
    }  //uncomment at 7pm thursday
    
    
    
    // Animate points
    function triggerAnimation() {
      //  console.log("Triggering Animation");
        function animateValue(element, end, duration) {
            let startTimestamp = null;
            const start = parseFloat(element.textContent);
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                element.textContent = (progress * (end - start) + start).toFixed(1);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        }

        document.querySelectorAll('.player-card').forEach(card => {
            const pointsElement = card.querySelector('.points-value');
            if (pointsElement) {  // Make sure pointsElement is not null
                const pointsValue = parseFloat(card.getAttribute('data-points') || "0");
                if (!isNaN(pointsValue)) {  // Make sure pointsValue is a number
                    animateValue(pointsElement, pointsValue, 1500);
                } else {
                    console.error("Invalid data-points value:", card.getAttribute('data-points'));
                }
            } else {
                console.error("Missing .points-value element in card:", card);
            }
        });
        
    }

    // Calling the functions
   // populateUserData();
    triggerAnimation();
    pickWindowPlayerCard();
});


document.addEventListener('DOMContentLoaded', () => {
    let maxPoints = 0;
    let topPlayerCard;

    // Loop through each player card to find the one with the most points
    document.querySelectorAll('.player-card').forEach(card => {
        const points = parseFloat(card.getAttribute('data-points'));
        if (points > maxPoints) {
            maxPoints = points;
            topPlayerCard = card;
        }
    });

    // If a top player is found, append the crown icon to their card
    if (topPlayerCard) {
        const crownIcon = document.createElement('i');
        crownIcon.classList.add('fas', 'fa-crown', 'crown-icon');
        topPlayerCard.appendChild(crownIcon);
    }
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

        // Verify we have the admin's username in the pool object and log it
        // Make sure to convert to lowercase for comparison
        const isAdmin = currentUsername.toLowerCase() === pool.adminUsername.toLowerCase();

        console.log("Current username from local storage:", currentUsername);
        console.log("Admin username from pool object:", pool.adminUsername);
        console.log("Is admin:", isAdmin);

       // console.log(pool);
        const poolContainerWrapper = document.getElementById('pool-container-wrapper');

        // Create the pool wrapper
        const poolWrapper = document.createElement('div');
        poolWrapper.className = 'pool-wrapper';
        poolWrapper.setAttribute('data-pool-name', pool.name);
        // Create the pool name div
        const poolNameDiv = document.createElement('div');
        poolNameDiv.className = 'pool-name';
        poolNameDiv.innerText = pool.name;

        // Create the pool container
        const poolContainer = document.createElement('div');
        poolContainer.className = 'pool-container';

        // Create and append the pool header to the pool container
        const poolHeader = document.createElement('div');
        poolHeader.className = 'pool-header';
        poolHeader.innerHTML = `
            <span class="header-rank">Rank</span>
            <span class="header-user">User</span>
            <span class="header-points">Points</span>
            <span class="header-picks">
            <button class="choose-picks-button" onclick="redirectToDashboard('${pool.name}')">Make Picks</button>
        </span>
            <span class="header-win">Win</span>
            <span class="header-loss">Loss</span>
            <span class="header-push">Push</span>
        `;
        poolContainer.appendChild(poolHeader);

        // Add player rows to the pool container here...
        // ...

    
         
        pool.members.forEach((memberUsername, index) => {
            const rank = index + 1;
            const encodedMemberUsername = encodeURIComponent(memberUsername);
    
            // First fetch the user profile
            fetch(`/api/getUserProfile/${encodedMemberUsername}`)
                .then(response => response.json())
                .then(userProfile => {
                    if (!userProfile) {
                        throw new Error(`User profile for ${memberUsername} not found`);
                    }
                    
                    // Then fetch the picks
                    fetch(`/api/getPicks/${encodedMemberUsername}`)
                        .then(picksResponse => picksResponse.json())
                        .then(picksData => {

                            //console.log(picksData);

                         
                            // Create the player row here
                            const playerRow = createPlayerRow({
                                rank,
                                username: userProfile.username,
                                profilePic: userProfile.profilePicture,
                                points: userProfile.points,
                                wins: userProfile.wins,
                                losses: userProfile.losses,
                                pushes: userProfile.pushes,
                              }, memberUsername === pool.adminUsername);
                    
                              const picksContainer = playerRow.querySelector('.player-picks');
                            // Populate the picks
                     
                            picksContainer.className = 'player-picks';
                            if (picksData.picks && Array.isArray(picksData.picks)) {

                            picksData.picks.forEach(pick => {
                                const pickDiv = document.createElement('div');
                                pickDiv.className = 'pick';
                                
                                const teamNameMatch = pick.match(/^(.*?)\s\[/);
                                const teamName = teamNameMatch ? teamNameMatch[1] : null;
                                const valueMatch = pick.match(/\[.*?([-+]\d+(?:\.\d+)?)\]/);
                                const value = valueMatch ? valueMatch[1] : null;
    
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
                            });} else {
                                // If there are no picks, append a message to the picksContainer
                                const noPicksMessage = document.createElement('div');
                                noPicksMessage.className = 'no-picks-message';
                                noPicksMessage.textContent = ' ';
                                picksContainer.appendChild(noPicksMessage);
                            }
    
                           playerRow.appendChild(picksContainer);
                         poolContainer.appendChild(playerRow);
                        })
                        .catch(error => {
                            console.error('Error fetching picks:', error);
                        });
                })
                .catch(error => {
                    console.error('Error fetching user profile:', error);
                });
        });
          

            const poolAndDeleteContainer = document.createElement('div');
            poolAndDeleteContainer.className = 'pool-and-delete-container';

            // Append the pool name div and the pool container to the pool wrapper
            poolWrapper.appendChild(poolNameDiv);
            poolWrapper.appendChild(poolContainer);

        if (isAdmin) {
            // Create and append the delete button for admins
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete Pool';
            deleteButton.className = 'delete-pool-button';
            deleteButton.setAttribute('data-pool-name', pool.name); // Set the pool's name as a data attribute
            deleteButton.addEventListener('click', function() {
                const confirmation = confirm(`Are you sure you want to delete the pool "${this.getAttribute('data-pool-name')}"?`);
                if (confirmation) {
                    deletePool(this.getAttribute('data-pool-name')); // Use the pool's name for deletion
                } else {
                    console.log('Pool deletion cancelled by the user.');
                }
            });
            poolAndDeleteContainer.appendChild(deleteButton);
            poolWrapper.appendChild(deleteButton);
            console.log("Delete button should be added for:", pool.name);
        }

        // Append the pool name div and the pool container to the pool wrapper
        poolWrapper.appendChild(poolNameDiv);
        poolWrapper.appendChild(poolContainer);

        // Append the pool wrapper to the main pool container wrapper
        poolContainerWrapper.appendChild(poolWrapper);

        poolAndDeleteContainer.appendChild(poolWrapper);

// Append the new container to the main pool container wrapper
poolContainerWrapper.appendChild(poolAndDeleteContainer);

    }else{
        console.log("No username found in localStorage");
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

    fetch(`/pools/userPools/${encodeURIComponent(currentUsername.toLowerCase())}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        return response.json();
    })
    .then(pools => {
        const poolContainerWrapper = document.getElementById('pool-container-wrapper');
        poolContainerWrapper.innerHTML = '';
        pools.forEach(pool => {
            displayNewPoolContainer(pool);
        });
    })
    .catch(error => {
        console.error('Error fetching pools for user:', error);
    });
}

document.addEventListener('DOMContentLoaded', loadAndDisplayUserPools);



function createPlayerRow(memberData, isAdmin) {
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
    <div class="player-win">${memberData.wins}</div>
    <div class="player-loss">${memberData.losses}</div>
    <div class="player-push">${memberData.pushes}</div>
`;
        if (isAdmin) {
        const userSection = playerRow.querySelector('.player-user');
        const adminBadge = document.createElement('i');
        adminBadge.classList.add('fas', 'fa-shield-alt', 'admin-badge');
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

/*
if (memberData.rank === totalMembers) {
    const userSection = playerRow.querySelector('.player-user');
    const poopEmoji = document.createElement('span');
    poopEmoji.textContent = '💩'; // Using the Unicode emoji for poop
    poopEmoji.className = 'poop-icon';
    userSection.appendChild(poopEmoji); // Append poop emoji to the user div
}
*/
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
