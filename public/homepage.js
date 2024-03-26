
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
    console.log("Script is loaded!");
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
                console.log(result.message);
                // Update the profile picture on the page
                document.querySelector('.profile-icon').src = result.filePath;
                document.querySelector('.profile-icon-center').src = result.filePath;
    
            } catch (error) {
                console.error('Upload error:', error);
            }
        } else {
            console.log('No file selected.');
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
        console.log("Triggering Animation");
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


document.getElementById('show-create-pool-form').addEventListener('click', function() {
    const formContainer = document.getElementById('create-pool-form-container');
    formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
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
            throw new Error(`HTTP error! Status: ${response.status}`);
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

   


    let currentUsername = localStorage.getItem('username'); // Retrieve username from local storage

    if (currentUsername) {
        currentUsername = currentUsername.toLowerCase(); // Convert to lower case

        // Verify we have the admin's username in the pool object and log it
        // Make sure to convert to lowercase for comparison
        const isAdmin = currentUsername === pool.adminUsername.toLowerCase();

        console.log("Current username from local storage:", currentUsername);
        console.log("Admin username from pool object:", pool.adminUsername);
        console.log("Is admin:", isAdmin);

        console.log(pool);
        const poolContainerWrapper = document.getElementById('pool-container-wrapper');

        // Create the pool wrapper
        const poolWrapper = document.createElement('div');
        poolWrapper.className = 'pool-wrapper';
        poolWrapper.id = `pool-${pool._id}`; 
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
            <span class="header-picks">Picks</span>
            <span class="header-win">Win</span>
            <span class="header-loss">Loss</span>
            <span class="header-push">Push</span>
        `;
        poolContainer.appendChild(poolHeader);

        // Add player rows to the pool container here...
        // ...
        if (isAdmin) {
            // Create and append the delete button for admins
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete Pool';
            deleteButton.className = 'delete-pool-button';
            deleteButton.setAttribute('data-pool-name', pool.name); // Set the pool's name as a data attribute
            deleteButton.addEventListener('click', function() {
                deletePool(this.getAttribute('data-pool-name')); // Use the pool's name for deletion
            });
            poolWrapper.appendChild(deleteButton);
            console.log("Delete button should be added for:", pool.name);
            
        }
        // Append the pool name div and the pool container to the pool wrapper
        poolWrapper.appendChild(poolNameDiv);
        poolWrapper.appendChild(poolContainer);

        // Append the pool wrapper to the main pool container wrapper
        poolContainerWrapper.appendChild(poolWrapper);

    }else{
        console.log("No username found in localStorage");
    }

}


function loadAndDisplayPools() {
    fetch('/pools/get-all') // Make sure this endpoint exists and returns pool data
        .then(response => response.json())
        .then(pools => {
            pools.forEach(pool => {
                displayNewPoolContainer(pool); // Ensure this is the correct data structure
            });
        })
        .catch(error => {
            console.error('Error fetching pools:', error);
        });
}

// Initiate the pool loading when the page is ready.
document.addEventListener('DOMContentLoaded', loadAndDisplayPools);

function createPlayerRow(player, isAdmin) {
    const playerRow = document.createElement('div');
    playerRow.className = 'player-row';
  
    // Add an admin icon if the player is an admin
    if (isAdmin) {
      playerRow.classList.add('player-admin'); // Apply admin-specific styling
      // Insert admin icon HTML here, if you have an icon
    }
  
    // Populate player row with data
    playerRow.innerHTML = `
      <span class="player-rank">${player.rank}</span>
      <div class="player-user">
        <img class="player-profile-pic" src="${player.profilePic}" alt="${player.username}" />
        <span class="player-name">${player.username}</span>
      </div>
      <span class="player-points">${player.points}</span>
      <div class="player-picks">${player.picks}</div>
      <span class="player-win">${player.wins}</span>
      <span class="player-loss">${player.losses}</span>
      <span class="player-push">${player.pushes}</span>
    `;
  
    return playerRow;
  }
  
  
// Assume this function is called when you want to delete a pool
function deletePool(poolName) {
    const username = localStorage.getItem('username'); // Assuming username is stored in local storage
    if (!username) {
        alert('Username not found. Please log in again.');
        return;
    }

    fetch(`/pools/delete/${encodeURIComponent(poolName)}`, { // Encode the poolName to ensure a valid URL
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-username': username.toLowerCase() // Send username for server-side verification
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
            // Here you would also remove the pool from the UI
             // Remove the pool from the UI
             const poolWrapper = document.getElementById(`pool-${poolName}`);
             if (poolWrapper) {
                 poolWrapper.remove();}

        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the pool.');
    });
}
  