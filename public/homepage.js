// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the playoff picks panel
    initializePlayoffPicksPanel();
    
    setupCreatePoolForm();
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
    }, 3000);
});

  // Wait for the DOM to be fully loaded before executing any code
document.addEventListener('DOMContentLoaded', function() {
    //console.log('DOM fully loaded, initializing pool manager...');
    
    // Initialize all pool management functionality
    initPoolManager();
    
    // Update the current week display
    updateCurrentWeekDisplay();
    
    // Update the countdown if present
    if (typeof updateCountdown === 'function') {
      updateCountdown();
      setInterval(updateCountdown, 1000);
    }
    /*
    // Update the navigation username if present
    if (typeof updateNavUsername === 'function') {
      updateNavUsername();
    }*/
  });
  
  /**
   * Initialize all pool management functionality
   */
  function initPoolManager() {
    // Setup tab switching between create and join pool forms
    setupTabSwitching();
    
    // Setup interactive elements (privacy toggle, mode selection)
    setupFormInteractivity();
    
    // Setup form submission handlers
    setupPoolForms();
  }
  
  /**
   * Set up tab switching between create pool and join pool
   */
  function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (!tabButtons.length || !tabContents.length) {
      //console.log('Tab elements not found, skipping tab setup');
      return;
    }
    
    //console.log('Setting up tab switching...');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all tab buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Hide all tab contents
        tabContents.forEach(content => content.classList.add('hidden'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Show corresponding tab content
        const tabId = button.dataset.tab;
        const tabContent = document.getElementById(`${tabId}-pool-content`);
        if (tabContent) {
          tabContent.classList.remove('hidden');
        }
      });
    });
  }
  
  /**
   * Set up interactive elements for the form
   */
  function setupFormInteractivity() {
    // Setup privacy toggle button
    setupPrivacyToggle();
    
    // Setup mode selection
    setupModeSelection();
  }
  
  /**
   * Set up the privacy toggle button functionality
   */
 /**
 * Set up the privacy toggle button functionality
 */
function setupPrivacyToggle() {
    const privacyBtn = document.getElementById("privacy-btn")
    const passwordGroup = document.querySelector(".password-group")
  
    if (!privacyBtn || !passwordGroup) {
      //console.log("Privacy button or password group not found, skipping setup")
      return
    }
  
    //console.log("Setting up privacy toggle...")
  
    // Remove any existing event listeners
    const newBtn = privacyBtn.cloneNode(true)
    privacyBtn.parentNode.replaceChild(newBtn, privacyBtn)
  
    // Initialize button state
    let isPublic = true
  
    // Set initial button state
    newBtn.innerHTML = '<i class="icon fas fa-globe"></i><span>Public</span>'
  
    // Add the click event listener to the new button
    newBtn.addEventListener("click", function (e) {
      e.preventDefault()
  
      // Toggle state
      isPublic = !isPublic
  
      if (isPublic) {
        // Switching to public
        this.classList.remove("private")
        passwordGroup.classList.add("hidden")
        this.innerHTML = '<i class="icon fas fa-globe"></i><span>Public</span>'
      } else {
        // Switching to private
        this.classList.add("private")
        passwordGroup.classList.remove("hidden")
        this.innerHTML = '<i class="icon fas fa-lock"></i><span>Private</span>'
      }
  
      //console.log("Privacy toggled. Is public:", isPublic)
    })
  }
  
  
  // JavaScript to handle the privacy toggle functionality
document.addEventListener("DOMContentLoaded", () => {
    const privacyBtn = document.querySelector(".privacy-btn")
    let isPublic = true // Initial state
  
    privacyBtn.addEventListener("click", () => {
      isPublic = !isPublic
  
      if (isPublic) {
        privacyBtn.innerHTML = '<i class="icon fas fa-globe"></i><span>Public</span>'
      } else {
        privacyBtn.innerHTML = '<i class="icon fas fa-lock"></i><span>Private</span>'
      }
  
      // You might want to update a hidden input field with the actual value
      // const privacyInput = document.querySelector('input[name="privacy"]');
      // privacyInput.value = isPublic ? 'public' : 'private';
    })
  })
  
  
  /**
   * Set up the mode selection functionality
   */
  function setupModeSelection() {
    const modeCards = document.querySelectorAll('.mode-card');
    const playoffsToggle = document.getElementById('playoffs-toggle');
    
    if (!modeCards.length) {
      //console.log('Mode cards not found, skipping setup');
      return;
    }
    
    //console.log('Setting up mode selection...');
    
    // Initial state: Show/hide playoffs toggle based on current active mode
    const activeMode = document.querySelector('.mode-card.active');
    if (activeMode && playoffsToggle) {
      if (activeMode.dataset.mode === 'classic') {
        playoffsToggle.classList.remove('hidden');
      } else {
        playoffsToggle.classList.add('hidden');
      }
    }
    
    // Add click handlers to mode cards
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove active class from all cards
        modeCards.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked card
        card.classList.add('active');
        
        // Show/hide playoffs toggle based on selected mode
        if (playoffsToggle) {
          if (card.dataset.mode === 'classic') {
            playoffsToggle.classList.remove('hidden');
          } else {
            playoffsToggle.classList.add('hidden');
            
            // Reset checkbox when switching away from classic
            const checkbox = document.getElementById('hasPlayoffs');
            if (checkbox) checkbox.checked = false;
          }
        }
      });
    });
  }
  
  /**
   * Set up pool forms (create and join)
   */
  function setupPoolForms() {
    // Setup create pool form
    setupCreatePoolForm();
    
    // Setup join pool form
   // setupJoinPoolForm();
  }
  
  /**
   * Set up create pool form submission
   */
  function setupCreatePoolForm() {
    const createPoolForm = document.getElementById('create-pool-form');
    
    if (!createPoolForm) {
      //console.log('Create pool form not found, skipping setup');
      return;
    }
    
    //console.log('Setting up create pool form...');
    
    // Ensure the form doesn't have an action attribute
    createPoolForm.setAttribute('action', 'javascript:void(0);');
    createPoolForm.setAttribute('onsubmit', 'return false;');
    
    // Remove any existing event listeners
    const newForm = createPoolForm.cloneNode(true);
    createPoolForm.parentNode.replaceChild(newForm, createPoolForm);
    
    // Add the submit event listener to the new form
    newForm.addEventListener('submit', handleCreatePoolSubmit);
    
    // Get the submit button if it exists separately
    const submitBtn = newForm.querySelector('.submit-btn') || document.getElementById('create-pool-button');
    
    if (submitBtn) {
      //console.log('Found submit button, attaching click handler...');
      
      // Remove existing listeners
      const newBtn = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newBtn, submitBtn);
      
      // Add click handler
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        //console.log('Submit button clicked, triggering form submission...');
        
        // Manually trigger the form submission
        handleCreatePoolSubmit(e);
      });
    }
  }
  
  /**
   * Handle create pool form submission
 
  function handleCreatePoolSubmit(e) {
    e.preventDefault();
    //console.log('Processing create pool form submission...');
    
    // Get the form element
    const form = document.getElementById('create-pool-form');
    
    try {
      // Get form values
      const poolName = form.querySelector('input[type="text"]').value.trim();
      if (!poolName) {
        alert('Please enter a pool name');
        return;
      }
      
      const poolPasswordInput = form.querySelector('input[type="password"]');
      const poolPassword = poolPasswordInput ? poolPasswordInput.value : '';
      
      // Get privacy setting
      const privacyBtn = document.getElementById('privacy-btn');
      const isPrivate = privacyBtn && privacyBtn.classList.contains('private');
      //console.log('Privacy setting:', isPrivate);
      
      // Get mode setting
      const activeMode = document.querySelector('.mode-card.active');
      const selectedMode = activeMode ? activeMode.dataset.mode : 'classic';
      //console.log('Selected mode:', selectedMode);
      
      // Get hasPlayoffs setting (only applicable for classic mode)
      const hasPlayoffsCheckbox = document.getElementById('hasPlayoffs');
      const hasPlayoffs = hasPlayoffsCheckbox && hasPlayoffsCheckbox.checked;
      //console.log('Has playoffs:', hasPlayoffs);
      
      // Get username from local storage
      const username = localStorage.getItem('username');
      if (!username) {
        console.error('Username not found in localStorage');
        alert('Username not found. Please log in again.');
        return;
      }
      
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
      } else if (isPrivate) {
        alert('A password is required for private pools');
        return;
      }
      
      //console.log('Sending create pool request...');
      
      // Send the API request
      fetch('/pools/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(response => {
        //console.log('Received response:', response.status);
        
        if (!response.ok) {
          if (response.status === 409) {
            throw new Error('The pool name is already taken. Please choose another name.');
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return response.json();
      })
      .then(data => {
        //console.log('Response data:', data);
        
        if (data.message && data.pool) {
          // Show success message
          //console.log('Pool created successfully!');
          alert('Pool created successfully!');
          
          // Force page reload
          window.location.reload();
        } else {
          alert('Unexpected response from server.');
        }
      })
      .catch(error => {
        console.error('Error creating pool:', error);
        alert(error.message || 'An error occurred while creating the pool.');
      });
    } catch (error) {
      console.error('Error in form submission:', error);
      alert('An error occurred while processing your request.');
    }
  }*/

    //wWITH GOLF OG FUNCTION ABOVE
    // Modify the handleCreatePoolSubmit function to handle golf mode
    
function handleCreatePoolSubmit(e) {
    e.preventDefault();
    console.log('Processing create pool form submission...');
    
    const form = document.getElementById('create-pool-form');
    
    try {
      // Get form values
      const poolName = form.querySelector('input[type="text"]').value.trim();
      if (!poolName) {
        alert('Please enter a pool name');
        return;
      }
      
      const poolPasswordInput = form.querySelector('input[type="password"]');
      const poolPassword = poolPasswordInput ? poolPasswordInput.value : '';
      
      // Get privacy setting
      const privacyBtn = document.getElementById('privacy-btn');
      const isPrivate = privacyBtn && privacyBtn.classList.contains('private');
      
      // Get mode setting
      const activeMode = document.querySelector('.mode-card.active');
      const selectedMode = activeMode ? activeMode.dataset.mode : 'classic';
      
      // Get hasPlayoffs setting (only applicable for classic mode)
      const hasPlayoffsCheckbox = document.getElementById('hasPlayoffs');
      const hasPlayoffs = hasPlayoffsCheckbox && hasPlayoffsCheckbox.checked;
      
      // Get username from local storage
      const username = localStorage.getItem('username');
      if (!username) {
        console.error('Username not found in localStorage');
        alert('Username not found. Please log in again.');
        return;
      }
      
      // Prepare request payload
      const payload = {
        name: poolName,
        isPrivate,
        adminUsername: username.toLowerCase(),
        mode: selectedMode,
        hasPlayoffs: selectedMode === 'classic' ? hasPlayoffs : false
      };
      
      // Additional properties for golf mode
      if (selectedMode === 'golf') {
        payload.idleTime = true;
        payload.draftTime = false;
        payload.playTime = false;
      }
      
      // Add password if private
      if (isPrivate && poolPassword) {
        payload.password = poolPassword;
      } else if (isPrivate) {
        alert('A password is required for private pools');
        return;
      }
      
      console.log('Sending create pool request...');
      
      // Send the API request
      fetch('/pools/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(response => {
        console.log('Received response:', response.status);
        
        if (!response.ok) {
          if (response.status === 409) {
            throw new Error('The pool name is already taken. Please choose another name.');
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return response.json();
      })
      .then(data => {
        console.log('Response data:', data);
        
        if (data.message && data.pool) {
          // Show success message
          console.log('Pool created successfully!');
          alert('Pool created successfully!');
          
          // Force page reload
          window.location.reload();
        } else {
          alert('Unexpected response from server.');
        }
      })
      .catch(error => {
        console.error('Error creating pool:', error);
        alert(error.message || 'An error occurred while creating the pool.');
      });
    } catch (error) {
      console.error('Error in form submission:', error);
      alert('An error occurred while processing your request.');
    }
  }
  
  /**
   * Set up join pool form submission
   */
  function setupJoinPoolForm() {
    const joinPoolForm = document.getElementById('join-pool-form');
    
    if (!joinPoolForm) {
      //console.log('Join pool form not found, skipping setup');
      return;
    }
    
    //console.log('Setting up join pool form...');
    
    // Remove any existing event listeners
    const newForm = joinPoolForm.cloneNode(true);
    joinPoolForm.parentNode.replaceChild(newForm, joinPoolForm);
    
    // Add the submit event listener to the new form
    newForm.addEventListener('submit', function(e) {
      e.preventDefault();
      //console.log('Processing join pool form submission...');
      
      // Get form values
      const poolNameInput = this.querySelector('input[type="text"]');
      const passwordInput = this.querySelector('input[type="password"]');
      
      if (!poolNameInput) {
        console.error('Pool name input not found');
        return;
      }
      
      const poolName = poolNameInput.value.trim();
      const poolPassword = passwordInput ? passwordInput.value : '';
      
      if (!poolName) {
        alert('Please enter a pool name');
        return;
      }
      
      // Get username from local storage
      const username = localStorage.getItem('username');
      if (!username) {
        alert('You must be logged in to join a pool.');
        return;
      }
      
      // Prepare request payload
      const joinPayload = {
        poolName: poolName,
        username: username.toLowerCase(),
        poolPassword: poolPassword
      };
      
      //console.log('Sending join pool request...');
      
      // Send the API request
      fetch('/pools/joinByName', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(joinPayload)
      })
      .then(async response => { // Make this async to potentially read the body on error
        //console.log('Received response:', response.status);
    
        if (!response.ok) {
          let errorMessage = `Network response was not ok (${response.status} ${response.statusText})`; // Default error
    
          // --- START MODIFICATION ---
          if (response.status === 403) {
            // Try to get the specific message from the backend
            try {
              const errorData = await response.json();
              // Use the backend message or a custom one
              errorMessage = errorData.message || 'This pool is locked and cannot be joined at this time.';
            } catch (e) {
              // Fallback if reading JSON fails
              errorMessage = 'This pool is locked and cannot be joined at this time.';
            }
          } else if (response.status === 404) {
            errorMessage = 'Pool not found';
          } else if (response.status === 401) {
            errorMessage = 'Incorrect password';
          }
          // --- END MODIFICATION ---
    
          throw new Error(errorMessage); // Throw with the specific or default message
        }
    
        return response.json();
      })
      .then(data => {
        //console.log('Response data:', data);
    
        // Show success message (optional, depends on your flow)
        alert('Successfully joined the pool!'); // Or use data.message
    
        // Force page reload
        window.location.reload();
      })
      .catch(error => {
        console.error('Error joining pool:', error);
        // The alert will now display the specific error message thrown above
        alert(`Error: ${error.message || 'An error occurred while attempting to join the pool.'}`);
      });
    
    });
  }
  
  /**
   * Update the current week display
   */
  function updateCurrentWeekDisplay() {
    const weekDisplay = document.getElementById('currentWeekDisplay');
    
    if (!weekDisplay) {
      //console.log('Week display element not found, skipping update');
      return;
    }
    
    //console.log('Updating current week display...');
    
    fetch('/getCurrentWeek')
      .then(response => response.json())
      .then(data => {
        // Display the week number
        const weekNumber = parseInt(data.week);
        weekDisplay.textContent = `Week ${weekNumber}`;
      })
      .catch(error => {
        console.error('Error fetching current week:', error);
        weekDisplay.textContent = 'Week';
      });
  }
  
  /**
   * For fetching initial data after page load
   */
  function fetchInitialData() {
    // Add code here if you need to fetch any data when the page loads
    //console.log('Fetching initial data...');
    
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
            if (typeof rebuildUIWithResults === 'function') {
              rebuildUIWithResults(data.results);
            }
          } else {
            console.error('No results found or unable to fetch results:', data.message);
          }
        })
        .catch(error => console.error('Failed to fetch results:', error));
    }, 3000); // Delay for load time
  }
  
  // Also run immediately in case the DOM is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    //console.log('Document already loaded, initializing immediately...');
    initPoolManager();
  }


function getCurrentTimeInUTC4() {
    const now = new Date();
    const nowUtc4 = new Date(now);
    nowUtc4.setMinutes(nowUtc4.getMinutes() + nowUtc4.getTimezoneOffset()); // Convert to UTC
    nowUtc4.setHours(nowUtc4.getHours() - 4); // Convert UTC to EDT (UTC-4)
    return nowUtc4;
}

const now = new Date();
//console.log(now + "now");
//console.log(getCurrentTimeInUTC4() + "now2");


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
        //console.log('Initial times saved successfully.');
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

        //console.log("Current time: ", now);
        //console.log("Tuesday Start time: ", tuesdayTime);
        //console.log("Thursday deadline: ", thursdayTime);
        //console.log("Sunday deadline: ", sundayTime);

        if (now > tuesdayTime && now < thursdayTime) {
            //console.log('Current time window: Pick Time');
            enablePickTimeFeatures();
        } else if (now > thursdayTime && now < sundayTime) {
            //console.log('Current time window: Thursday Game Time');
            enableThursdayGameFeatures();
        } else if (now > sundayTime && now < tuesdayTime) {
            //console.log('Current time window: Sunday Game Time');
            enableSundayGameFeatures();
        } else {
            //console.log('Error determining the current time window');
        }
    } catch (error) {
        console.error('Error checking current time window:', error);
    }
}

function enableThursdayGameFeatures() {
    //console.log('Enabling Thursday game features...');
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
    // Handle regular picks button
    const choosePicksButtons = document.querySelectorAll('.global-picks-button');
    if (choosePicksButtons.length > 0) {
        choosePicksButtons.forEach(button => {
            button.classList.add('disabled');
            button.textContent = 'SELECTIONS UNAVAILABLE';
        });
    } else {
        console.error('No choose picks buttons found');
    }

    // Handle survivor picks button
    const survivorPicksButtons = document.querySelectorAll('#survivorPicksButton');
    if (survivorPicksButtons.length > 0) {
        survivorPicksButtons.forEach(button => {
            button.classList.add('disabled');
            button.textContent = 'SURVIVOR SELECTIONS UNAVAILABLE';
        });
    }

    // Set up click handlers for buttons
    const allButtons = document.querySelectorAll('.global-picks-button.disabled, #survivorPicksButton.disabled');
    allButtons.forEach(button => {
        button.onclick = (event) => {
            showGameTimeAlert(event);
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
            ////console.log("its pcik tioeeeee")
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


// Add a flag to track if the alert has been shown
let gameTimeAlertShown = false;

function showGameTimeAlert(event) {
    if (event) {
        event.preventDefault(); // Prevent default action
    }
    
    // Only show the alert if it hasn't been shown yet
    if (!gameTimeAlertShown) {
        alert("It's Game Time! Pick selection page not available.");
        gameTimeAlertShown = true;
        
        // Reset the flag after some time so the alert can be shown again if needed
        setTimeout(() => {
            gameTimeAlertShown = false;
        }, 100); // Reset after 5 seconds
    }
}

/*function updateNavUsername() {
    const username = localStorage.getItem('username');
    if (username) {
      document.getElementById('navUsername').textContent = username;
    }
  }*/
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
                        GAME TIME
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
    //console.log("Logged in user:", loggedInUsername);
    updateCountdown();
    setInterval(updateCountdown, 1000);
    //updateNavUsername();
    const profileIcon = document.getElementById('profileIconTemplate');
    const slideOutPanel = document.getElementById('slideOutPanel');
    const closePanelBtn = document.getElementById('closePanelBtn');
    const saveBioButton = document.getElementById('saveBioButton');

    if (profileIcon) {
        profileIcon.addEventListener('click', async () => {
            //console.log('Profile icon clicked');
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
            
            //console.log(`Profile clicked: ${username}, Points: ${points}`);
            
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
            
            //console.log(`Profile clicked: ${username}, Points: ${pointsValue}, Pool type: ${isClassicPool ? 'Classic' : 'Survivor'}`);
            
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
            
            //console.log(`Survivor profile clicked: ${username}, Status: ${isEliminated ? 'Eliminated' : 'Active'}`);
            
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
    
    //console.log(`Processing profile: ${username}, Points: ${points}, Classic Pool: ${isClassicPool}, Eliminated: ${isEliminated}`);
    
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
            
            //console.log(`Weekly average: ${weeklyAverage} (${numPoints}/${numWeek})`);
            
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

    async function checkForGolfPools() {
        try {
            const username = localStorage.getItem('username');
            if (!username) return false;

            const response = await fetch(`/pools/userPools/${encodeURIComponent(username.toLowerCase())}`);
            if (!response.ok) return false;

            const pools = await response.json();
            return pools.some(pool => pool.mode === 'golf');
        } catch (error) {
            console.error('Error checking for golf pools:', error);
            return false;
        }
    }

    // Initial check for golf pools and button display
    checkForGolfPools().then(hasGolfPool => {
        if (hasGolfPool) {
            displayGolfSelectionButton();
        }
    });
    
    // Add event handler for the golf picks button, similar to your global picks button
    const golfPicksButton = document.getElementById('golfPicksButton');
    if (golfPicksButton) {
        golfPicksButton.addEventListener('click', async function() {
            const phase = await getCurrentTimePhase();
            if (phase === 'sunday') {
                showGameTimeAlert(event);
                return;
            }
            // Allow access during both pick time and Thursday games
            window.location.href = 'golfSelection.html';
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


// Join Pool Form Submission
// Join Pool Form Submission (V3 - Modified)
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

    // Ensure pool name is entered
    if (!poolName) {
        alert('Please enter a pool name.');
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
            // --- START MODIFICATION ---
            if (response.status === 403) {
                // Specific check for locked survivor pool
                alert('This survivor pool is locked and cannot be joined at this time.');
                return; // Stop execution
            }
            // --- END MODIFICATION ---
            else if (response.status === 404) {
                alert('Pool not found.');
                return; // Stop execution
            }
            else if (response.status === 401) {
                alert('Incorrect password.');
                return; // Stop execution
            }
            // For any other non-ok status, throw a generic error
            else {
                 // Optional: Try to get a message from the body for other errors
                 let errorMsg = `HTTP error! Status: ${response.status}`;
                 try {
                     const errorData = await response.json();
                     if (errorData && errorData.message) {
                         errorMsg = errorData.message; // Use backend message if available
                     }
                 } catch (jsonError) {
                     // Ignore if body isn't valid JSON or empty
                 }
                 // Throw the error to be caught by the catch block
                 throw new Error(errorMsg);
            }
        }

        // If response.ok is true, proceed with success logic
        const data = await response.json();
        if (data.message) { // Or check for data.pool or other success indicators
            // Reset form
            joinPoolForm.reset();

            // Show success message
            alert('Successfully joined the pool!'); // Use data.message if preferred

            // Reload the page
            window.location.reload();
        } else {
             // Handle cases where response is ok, but data isn't as expected
             console.warn('Joined pool, but unexpected response structure:', data);
             alert('Joined pool, but received an unexpected response from the server.');
             window.location.reload(); // Still reload perhaps?
        }

    } catch (error) {
        // This catch block will now handle the generic errors thrown above
        console.error('Error joining pool:', error);
        // Display the error message from the thrown Error object
        alert(`Error: ${error.message || 'An error occurred while joining the pool.'}`);
    }
});
// The closing }); for the DOMContentLoaded might be further down in your original file
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
        const isGolfPool = poolWrapper.classList.contains('golf-mode');
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
        nameSpan.textContent = poolName + (isSurvivorPool ? ' (Survivor)' : isGolfPool ? ' (Golf)' : '');

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
function checkIfThursdayGame(commenceTime) {
    const gameDate = new Date(commenceTime); // Parse the date
    const localDate = new Date(gameDate.getTime() - gameDate.getTimezoneOffset() * 60000); // Adjust to local time
    const dayLocal = localDate.getDay(); // Get the day of the week in local time
    //console.log(`Original Date (UTC): ${commenceTime}`);
    //console.log(`Adjusted Date (Local): ${localDate}`);
    //console.log(`Day (Local): ${dayLocal}`);
    return dayLocal === 4; // Return true for Thursday in local timezone
}


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



function redirectToDashboard(poolName) {
    window.location.href = `dashboard.html?poolName=${encodeURIComponent(poolName)}`;
}

function redirectToNFLSchedule(source) {
    window.location.href = `scheduler.html?source=${encodeURIComponent(source)}`;
}

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
     /*
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
                }*/
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
            //console.log('Pool deleted successfully:', poolName);
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
        //console.log('Successfully left the pool:', data);
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
    
       // //console.log('Attempting to join pool with the following details:', joinPayload);
    
        // Make sure the URL matches your API route
        const apiEndpoint = '/pools/joinByName'; // This should match your server route
        //console.log(`Making POST request to: ${apiEndpoint}`);
    
        fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(joinPayload)
        })
        .then(response => {
            //console.log(`Received response with status: ${response.status}`);
            if (!response.ok) {
                throw new Error(`Network response was not ok ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            //console.log('Server response:', data);
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
            //console.log('User points updated successfully:', updateData.message);
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
            //console.log('User points set successfully:', updateData.message);
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
            //console.log('User stats updated successfully:', updateData.message);
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
            //console.log('User stats reset successfully:', updateData.message);
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
    console.log('Starting displaySurvivorPool for pool:', pool.name);
    
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
    const isAdmin = username.toLowerCase() === pool.adminUsername.toLowerCase();
    console.log('Current user is admin?', isAdmin);
    
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

    // Append the pool name container to the wrapper BEFORE adding the lock control
    poolWrapper.appendChild(poolNameContainer);
    
    // Now that poolNameContainer is in the DOM, add the lock control
    console.log('About to call addSurvivorPoolLockControl');
    addSurvivorPoolLockControl(poolWrapper, isAdmin, pool.name, pool.isLocked || false);
    console.log('Returned from addSurvivorPoolLockControl');

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


    document.addEventListener('DOMContentLoaded', function() {
        // Existing code...
        
        // Add this line to initialize the form listeners
        setupPoolFormListeners();
        
        // Rest of your existing code...
    });
// Enhanced fetchPlayoffBracket function with better error handling
async function fetchPlayoffBracket(poolName) {
    //console.log(`Fetching playoff bracket for pool: ${poolName}`);
    const bracketContainer = document.getElementById(`playoff-bracket-${poolName.replace(/\s+/g, '-')}`);
    const memberCountElement = document.getElementById(`playoffMemberCount-${poolName}`);
    
    if (!bracketContainer) {
        console.error(`Bracket container not found for pool: ${poolName}`);
        return;
    }
    
    try {
        const encodedPoolName = encodeURIComponent(poolName);
        const url = `/api/playoffs/${encodedPoolName}/bracket`;
        //console.log(`Fetching bracket data from: ${url}`);
        
        const response = await fetch(url);
        //console.log(`Bracket API response status: ${response.status}`);
        
        if (!response.ok) {
            console.error(`Failed to fetch bracket data: ${response.status}`);
            throw new Error(`Failed to fetch bracket data: ${response.status}`);
        }
        
        const data = await response.json();
        //console.log('Bracket API response data:', data);
        
        if (data.success && data.bracket) {
            //console.log('Rendering bracket with data:', data.bracket);
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
        const isPlayoffTime = currentWeek >= 14 && currentWeek <= 17;
        
       
        // Check if user is in any survivor pools
        const hasSurvivorPool = pools.some(pool => pool.mode === 'survivor');
        
        // Show the survivor button if the user is in a survivor pool
        if (hasSurvivorPool && document.getElementById('survivorPicksButton')) {
            document.getElementById('survivorPicksButton').style.display = 'block';
        }



         // Check if user is in any golf pools
         const hasGolfPool = pools.some(pool => pool.mode === 'golf');
        
         // Show the golf button if the user is in a golf pool
         if (hasGolfPool) {
             displayGolfSelectionButton();
         }
         
        
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
            } else if (pool.mode === 'golf') {
                await displayGolfPoolContainer(pool);
            } else {
                // For classic pools, display them with playoff bracket if enabled and in playoff time
                const hasPlayoffBracket = pool.mode === 'classic' && pool.hasPlayoffs && isPlayoffTime;
                await displayNewPoolContainer(pool, hasPlayoffBracket, currentWeek);
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
function displayGolfSelectionButton() {
    // Check if the button already exists
    if (document.getElementById('golfPicksButton')) {
        return; // Button already exists
    }
    
    // Find the survivor button first
    const survivorButton = document.getElementById('survivorPicksButton');
    
    // Create container if it doesn't exist
    let picksButtonsContainer = document.querySelector('.picks-buttons-container');
    if (!picksButtonsContainer) {
        picksButtonsContainer = document.createElement('div');
        picksButtonsContainer.className = 'picks-buttons-container';
        
        // Find where to insert - after the global picks button
        const globalPicksButton = document.getElementById('globalPicksButton');
        if (globalPicksButton) {
            globalPicksButton.parentNode.insertBefore(picksButtonsContainer, globalPicksButton.nextSibling);
        } else {
            // If no global picks button, add to main content
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.appendChild(picksButtonsContainer);
            }
        }
    }
    
    // Create the Golf Selections button
    const golfButton = document.createElement('button');
    golfButton.id = 'golfPicksButton';
    golfButton.className = 'golf-selections-button';
    golfButton.innerHTML = 'GOLF PICK 6 SELECTION';
    
    // Add event listener
    golfButton.addEventListener('click', async function() {
        const phase = await getCurrentTimePhase();
        if (phase === 'sunday') {
            showGameTimeAlert(event);
            return;
        }
        // Allow access during both pick time and Thursday games
        window.location.href = 'golfSelection.html';
    });
    
    // Position logic:
    // If survivor button exists, add golf button after it
    if (survivorButton) {
        survivorButton.parentNode.insertBefore(golfButton, survivorButton.nextSibling);
    } else {
        // If no survivor button, add to the container
        picksButtonsContainer.appendChild(golfButton);
    }
}
// Modified displayNewPoolContainer to include the playoff bracket
async function displayNewPoolContainer(pool, includePlayoffBracket = false, currentweek) {
  const teamLogos = {
    "Arizona Cardinals": "/ARILogo.png",
    "Atlanta Falcons": "/ATLLogo.png",
    "Baltimore Ravens": "/BALLogo.png",
    "Buffalo Bills": "/BUFLogo.png",
    "Carolina Panthers": "/CARLogo.png",
    "Chicago Bears": "/CHILogo.png",
    "Cincinnati Bengals": "/CINLogo.png",
    "Cleveland Browns": "/CLELogo.png",
    "Dallas Cowboys": "/DALLogo.png",
    "Denver Broncos": "/DENLogo.png",
    "Detroit Lions": "/DETLogo.png",
    "Green Bay Packers": "/GBLogo.png",
    "Houston Texans": "/HOULogo.png",
    "Indianapolis Colts": "/INDLogo.png",
    "Jacksonville Jaguars": "/JAXLogo.png",
    "Kansas City Chiefs": "/KCLogo.png",
    "Las Vegas Raiders": "/LVLogo.png",
    "Los Angeles Chargers": "/LACLogo.png",
    "Los Angeles Rams": "/LARLogo.png",
    "Miami Dolphins": "/MIALogo.png",
    "Minnesota Vikings": "/MINLogo.png",
    "New England Patriots": "/NELogo.png",
    "New Orleans Saints": "/NOLogo.png",
    "New York Giants": "/NYGLogo.png",
    "New York Jets": "/NYJLogo.png",
    "Philadelphia Eagles": "/PHILogo.png",
    "Pittsburgh Steelers": "/PITLogo.png",
    "San Francisco 49ers": "/SFLogo.png",
    "Seattle Seahawks": "/SEALogo.png",
    "Tampa Bay Buccaneers": "/TBLogo.png",
    "Tennessee Titans": "/TENLogo.png",
    "Washington Commanders": "/WASLogo.png",
  }

  let username = localStorage.getItem("username")
  if (!username) {
    console.error("No logged-in user found!")
    return
  }

  // Find or create ordered container
  let orderedContainer = document.getElementById("ordered-pools-container")
  if (!orderedContainer) {
    orderedContainer = document.createElement("div")
    orderedContainer.id = "ordered-pools-container"
    document.getElementById("pool-container-wrapper").appendChild(orderedContainer)
  }

  username = username.toLowerCase()
  const isAdmin = username === pool.adminUsername.toLowerCase()

  const poolWrapper = document.createElement("div")
  poolWrapper.className = "pool-wrapper"
  poolWrapper.setAttribute("data-pool-name", pool.name)
  poolWrapper.setAttribute("data-admin-username", pool.adminUsername)

  // Get member's order index
  const memberOrder = pool.members.find((m) => m.username.toLowerCase() === username.toLowerCase())?.orderIndex ?? 0

  // Use negative order to reverse the display order (higher index = higher position)
  poolWrapper.style.order = -memberOrder

  // Add playoff bracket section if needed
  if (includePlayoffBracket) {
    const playoffSection = document.createElement("div")
    playoffSection.className = "playoff-bracket-section"

    const playoffTitleBar = document.createElement("div")
    playoffTitleBar.className = "playoff-title-bar"
    playoffTitleBar.innerHTML = `
            <h3><span class="playoff-icon"><i class="fas fa-trophy"></i></span> ${pool.name} Playoff Bracket</h3>
            <div class="playoff-user-count">
                <i class="fas fa-users"></i>
                <span id="playoffMemberCount-${pool.name}">Loading...</span>
            </div>
        `

    const playoffBracketContainer = document.createElement("div")
    playoffBracketContainer.className = "playoff-bracket-container"
    playoffBracketContainer.id = `playoff-bracket-${pool.name.replace(/\s+/g, "-")}`
    playoffBracketContainer.innerHTML = `
            <div class="playoff-loading">
                <div class="playoff-spinner"></div>
                <p>Loading playoff bracket...</p>
            </div>
        `

    playoffSection.appendChild(playoffTitleBar)
    playoffSection.appendChild(playoffBracketContainer)
    poolWrapper.appendChild(playoffSection)

    // We'll fetch the bracket data later after appending to DOM
  }

  // Continue with regular pool display
  const poolNameContainer = document.createElement("div")
  poolNameContainer.className = "pool-name-container"

  const poolNameDiv = document.createElement("div")
  poolNameDiv.className = "pool-name"
  poolNameDiv.innerText = pool.name

  const poolControls = document.createElement("div")
  poolControls.className = "pool-controls"

  const userCountDiv = document.createElement("div")
  userCountDiv.className = "user-count"
  userCountDiv.innerHTML = `
        <i class="fas fa-users"></i>
        <span>${pool.members.length}</span>
    `

  const viewDropdown = document.createElement("div")
  viewDropdown.className = "view-selector-container"
  viewDropdown.innerHTML = `
        <select class="view-selector">
            <option value="aroundMe">Around Me</option>
            <option value="all">All Players</option>
        </select>
        <span class="dropdown-arrow">▼</span>
    `

  const select = viewDropdown.querySelector("select")
  select.addEventListener("change", (e) => {
    setTimeout(() => {
      const container = poolContainer
      const allRows = [...container.querySelectorAll(".player-row")]
      const currentUserRow = container.querySelector(".current-user-row")
      const currentUserIndex = allRows.indexOf(currentUserRow)

      // Hide all rows initially
      allRows.forEach((row) => (row.style.display = "none"))

      if (e.target.value === "aroundMe" && currentUserRow) {
        let startIndex = 0
        let endIndex = Math.min(10, allRows.length)

        if (currentUserIndex >= 5 && currentUserIndex < allRows.length - 5) {
          startIndex = currentUserIndex - 5
          endIndex = currentUserIndex + 5
        } else if (currentUserIndex >= allRows.length - 5) {
          startIndex = Math.max(0, allRows.length - 10)
          endIndex = allRows.length
        }

        for (let i = startIndex; i < endIndex; i++) {
          allRows[i].style.display = ""
        }
      } else {
        allRows.slice(0, 10).forEach((row) => (row.style.display = ""))
        allRows.slice(10).forEach((row) => (row.style.display = "none"))

        if (allRows.length > 10) {
          const showMoreButton = document.createElement("button")
          showMoreButton.className = "show-more-button"
          showMoreButton.innerHTML = `
                        <i class="fas fa-chevron-down"></i>
                        <i class="fas fa-users" style="font-size: 0.9em"></i>
                        <span>show ${allRows.length - 10} more</span>
                    `

          // Add inline styles to ensure visibility
          showMoreButton.style.display = "flex"
          showMoreButton.style.position = "relative"
          showMoreButton.style.zIndex = "100"
          showMoreButton.style.visibility = "visible"
          showMoreButton.style.opacity = "1"

          let expanded = false
          showMoreButton.addEventListener("click", () => {
            if (!expanded) {
              allRows.forEach((row) => (row.style.display = ""))
              showMoreButton.innerHTML = `
                                <i class="fas fa-chevron-up"></i>
                                <i class="fas fa-users" style="font-size: 0.9em"></i>
                                <span>show less</span>
                            `
              showMoreButton.classList.add("expanded")
            } else {
              allRows.forEach((row, index) => {
                row.style.display = index < 10 ? "" : "none"
              })
              showMoreButton.innerHTML = `
                                <i class="fas fa-chevron-down"></i>
                                <i class="fas fa-users" style="font-size: 0.9em"></i>
                                <span>show ${allRows.length - 10} more</span>
                            `
              showMoreButton.classList.remove("expanded")
            }
            expanded = !expanded
          })

          // Remove any existing button
          const existingButton = document.querySelector(".show-more-button")
          if (existingButton) existingButton.remove()

          // Append the button AFTER the pool container to ensure it's visible
          const poolWrapper = poolScrollableContainer.closest(".pool-wrapper")
          poolWrapper.appendChild(showMoreButton)
        }
      }
    }, 100)
  })

  // Modified structure: First add poolNameDiv to poolNameContainer
  poolNameContainer.appendChild(poolNameDiv)

  // Then add userCountDiv and viewDropdown to poolControls
  poolControls.appendChild(userCountDiv)
  poolControls.appendChild(viewDropdown)

  // Finally add poolControls to poolNameContainer
  poolNameContainer.appendChild(poolControls)

  const poolScrollableContainer = document.createElement("div")
  poolScrollableContainer.className = "pool-scrollable-container"

  const poolContainer = document.createElement("div")
  poolContainer.className = "pool-container"

  const poolHeader = document.createElement("div")
  poolHeader.className = "pool-header"
  poolHeader.innerHTML = `
        <span class="header-rank"></span>
        <span class="header-user">User</span>
        <span class="header-points">Points</span>
        <span class="header-picks">Picks</span>
        <span class="header-immortal-lock"><i class="fas fa-lock"></i></span>
        <span class="header-win">Win</span>
        <span class="header-loss">Loss</span>
        <span class="header-push">Push</span>
    `
  poolContainer.appendChild(poolHeader)

  pool.members.sort((a, b) => b.points - a.points || a.username.localeCompare(b.username))

  const memberDataPromises = pool.members.map((member) =>
    fetchUserProfile(member.username).then((userProfile) => ({
      rank: pool.members.indexOf(member) + 1,
      username: userProfile.username,
      profilePic: userProfile.profilePicture,
      points: member.points,
      wins: member.win,
      losses: member.loss,
      pushes: member.push,
    })),
  )

  Promise.all(memberDataPromises)
    .then((membersData) => {
      membersData.forEach((memberData) => {
        const playerRow = createPlayerRow(memberData, memberData.username === pool.adminUsername, pool.members.length)
        fetchPicks(memberData.username, pool.name, playerRow, teamLogos)
        poolContainer.appendChild(playerRow)
      })

      poolScrollableContainer.appendChild(poolContainer)
      poolWrapper.appendChild(poolNameContainer)
      poolWrapper.appendChild(poolScrollableContainer)

      // Append chat container from template
      const chatTemplate = document.getElementById("chat-template").content.cloneNode(true)
      poolWrapper.appendChild(chatTemplate)

      // Add to ordered container
      orderedContainer.appendChild(poolWrapper)

      console.log("CURRENT WEEEEEK", currentweek);
      // If we have a playoff bracket, fetch the data now
      if (includePlayoffBracket && currentweek == 14 || 15 || 16 || 17) {
        // Fetch and display bracket data
        fetchPlayoffBracket(pool.name)
      }

      setTimeout(() => {
        select.value = "aroundMe"
        select.dispatchEvent(new Event("change"))
      }, 100)

      setTimeout(() => {
        checkCurrentTimeWindow()
      }, 50)

      // Update pool actions list after adding pool
      updatePoolActionsList()
    })
    .catch((error) => {
      console.error("Error fetching member data:", error)
    })
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
                        //console.log('Processing Thursday game time picks');
                        
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





// Initialize everything on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add the CSS styles immediately
   // addPlayerPicksPanelStyles();
    
    // Initialize the panel but don't create it right away
    // It will be created on first click and then reused
    //console.log('Player picks panel styles initialized');
    
    // Add a global error handler for fetch operations
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message && 
            event.reason.message.includes('HTTP error')) {
            console.warn('Caught fetch error:', event.reason);
            // Prevent the error from appearing in the console
            event.preventDefault();
        }
    });
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
          //console.log('Current Week:', data.bracket.currentWeek);
          
          // Check positions for all members
          //console.log('Members:');
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
    
    //console.log('Bracket rendered successfully with', memberCount, 'players');
    
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
      //console.log('Playoff bracket fixed for scrolling:', container);
    });
  }
  
  // Call this function if you dynamically load brackets
  function fixNewBrackets() {
    applyPlayoffBracketFixes();
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





// Updated renderBracket function to pass currentWeek and isLastWeek to createMatchElement
function renderBracket(bracketData, container, poolName) {
    //console.log('Starting to render bracket with data:', bracketData);
    
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
    
    //console.log('Bracket rendered successfully with', memberCount, 'players');
}

// Simple function to create empty slot
function createEmptySlot() {
    const emptySlot = document.createElement('div');
    emptySlot.className = 'empty-slot';
    emptySlot.textContent = 'TBD';
    return emptySlot;
}




function createMatchHistoryElement(match) {
    // Only create history display for completed matches
    if (!match.history) return null;
    
    const historyElement = document.createElement('div');
    historyElement.className = 'match-history';
    
    historyElement.innerHTML = `
      <div class="match-history-title">Week ${match.week} Results</div>
      <div class="match-history-score">
        <div class="history-player ${match.history.winner.username === match.player1.username ? 'winner' : 'loser'}">
          ${match.player1.username}: ${match.history.winner.username === match.player1.username ? 
            match.history.winner.points : match.history.loser.points} pts
        </div>
        <div class="match-separator">vs</div>
        <div class="history-player ${match.history.winner.username === match.player2.username ? 'winner' : 'loser'}">
          ${match.player2.username}: ${match.history.winner.username === match.player2.username ? 
            match.history.winner.points : match.history.loser.points} pts
        </div>
      </div>
    `;
    
    return historyElement;
  }


  // Helper function to create the match history element
  function createMatchHistoryElement(match) {
    // Only create history display for completed matches
    if (!match.history) return null;
    
    const historyElement = document.createElement('div');
    historyElement.className = 'match-history';
    
    // Calculate which player was the winner/loser
    const player1IsWinner = match.history.winner.position === match.player1.position;
    const player1Score = player1IsWinner ? match.history.winner.points : match.history.loser.points;
    const player2Score = player1IsWinner ? match.history.loser.points : match.history.winner.points;
    
    historyElement.innerHTML = `
      <div class="match-history-title">Week ${match.week} Results</div>
      <div class="match-history-score">
        <div class="history-player ${player1IsWinner ? 'winner' : 'loser'}">
          ${player1Score} pts
        </div>
        <div class="match-separator">vs</div>
        <div class="history-player ${!player1IsWinner ? 'winner' : 'loser'}">
          ${player2Score} pts
        </div>
      </div>
    `;
    
    return historyElement;
  }


  async function fetchPlayoffBracket(poolName) {
    try {
      const response = await fetch(`/api/playoffs/${encodeURIComponent(poolName)}/bracket`);
      if (!response.ok) {
        throw new Error(`Failed to fetch bracket data: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.bracket) {
        // Process the data to include match history
        const processedData = processMatchHistory(data.bracket);
        
        // Render the bracket with history
        renderBracket(processedData, document.getElementById(`playoff-bracket-${poolName.replace(/\s+/g, '-')}`), poolName);
        
        // Update member count
        const memberCountElement = document.getElementById(`playoffMemberCount-${poolName}`);
        if (memberCountElement && data.bracket.members) {
          const activeMemberCount = data.bracket.members.filter(m => !m.eliminated).length;
          memberCountElement.textContent = `${activeMemberCount} Players Remaining`;
        }
      } else {
        console.error('API returned success: false or missing bracket data');
      }
    } catch (error) {
      console.error('Error fetching bracket data:', error);
    }
  }



  function processMatchHistory(bracketData) {
    // Make a deep copy to avoid modifying the original data
    const processedData = JSON.parse(JSON.stringify(bracketData));
    const currentWeek = processedData.currentWeek;
    
    // For each completed match (from previous weeks), add history data
    processedData.matches.forEach(match => {
      // Only process matches from previous weeks
      if (match.week < currentWeek && match.winner) {
        // Find the players from the members array for this match
        const player1 = processedData.members.find(m => m.position === match.player1Position);
        const player2 = processedData.members.find(m => m.position === match.player2Position);
        
        if (!player1 || !player2) return;
        
        // Determine winner and loser
        const winnerPosition = match.winner;
        const winnerMember = winnerPosition === player1.position ? player1 : player2;
        const loserMember = winnerPosition === player1.position ? player2 : player1;
        
        // Find historical points data for both players
        let winnerPoints = winnerMember.points || winnerMember.weeklyPoints || 0;
        let loserPoints = loserMember.points || loserMember.weeklyPoints || 0;
        
        // Try to get more accurate historical data from history arrays if available
        if (winnerMember.history) {
          const historyEntry = winnerMember.history.find(h => h.week === match.week && h.matchId === match.id);
          if (historyEntry) {
            winnerPoints = historyEntry.points;
          }
        }
        
        if (loserMember.history) {
          const historyEntry = loserMember.history.find(h => h.week === match.week && h.matchId === match.id);
          if (historyEntry) {
            loserPoints = historyEntry.points;
          }
        }
        
        // Create and attach history data to the match
        match.history = {
          week: match.week,
          round: match.round,
          matchId: match.id,
          winner: {
            username: winnerMember.username,
            seed: winnerMember.seed,
            points: winnerPoints,
            position: winnerMember.position
          },
          loser: {
            username: loserMember.username,
            seed: loserMember.seed,
            points: loserPoints,
            position: loserMember.position
          }
        };
      }
    });
    
    return processedData;
  }

  // Function to create match element without the extra results display
function createMatchElement(match, poolName, champion, currentWeek, isLastWeek) {
    const matchContainer = document.createElement('div');
    matchContainer.className = 'match-container';
    matchContainer.dataset.matchId = match.id;
    
    // Add a special class if this is the final match and we have a champion
    if (match.nextMatch === "WINNER" && champion) {
      matchContainer.classList.add('championship-match');
    }
    
    // Add a completed match class if the match has history
    if (match.history) {
      matchContainer.classList.add('completed-match');
    }
    
    const matchBracket = document.createElement('div');
    matchBracket.className = 'match-bracket';
    
    // First player slot
    if (match.player1) {
      const isChampion = champion && match.player1.username === champion.username && match.nextMatch === "WINNER";
      
      // For completed matches in previous weeks, try to get the historical data
      let historicalData = null;
      if (match.week < currentWeek && match.history) {
        // If this player was the winner, use winner data from history
        if (match.history.winner.position === match.player1.position) {
          historicalData = {
            points: match.history.winner.points
          };
        } else {
          // Otherwise use loser data
          historicalData = {
            points: match.history.loser.points
          };
        }
      }
      
      // Create the player slot with historical data if available
      const player1Element = createPlayerSlot(
        match.player1, 
        match.winner, 
        poolName, 
        isChampion, 
        match.week,
        historicalData // Pass historical data
      );
      
      matchBracket.appendChild(player1Element);
    } else {
      matchBracket.appendChild(createEmptySlot());
    }
    
    // Second player slot (similar logic as player1)
    if (match.player2) {
      const isChampion = champion && match.player2.username === champion.username && match.nextMatch === "WINNER";
      
      // For completed matches in previous weeks, try to get the historical data
      let historicalData = null;
      if (match.week < currentWeek && match.history) {
        // If this player was the winner, use winner data from history
        if (match.history.winner.position === match.player2.position) {
          historicalData = {
            points: match.history.winner.points
          };
        } else {
          // Otherwise use loser data
          historicalData = {
            points: match.history.loser.points
          };
        }
      }
      
      const player2Element = createPlayerSlot(
        match.player2, 
        match.winner, 
        poolName, 
        isChampion, 
        match.week,
        historicalData // Pass historical data
      );
      
      matchBracket.appendChild(player2Element);
    } else {
      matchBracket.appendChild(createEmptySlot());
    }
    
    matchContainer.appendChild(matchBracket);
    
    // Add subtle historical indicator without the full results display
    if (match.history && match.week < currentWeek) {
      const historyIndicator = document.createElement('div');
      historyIndicator.className = 'match-history-indicator';
      matchContainer.appendChild(historyIndicator);
    }
    
    return matchContainer;
  }
  
  // Updated createPlayerSlot function to use historical data when available
  function createPlayerSlot(player, winnerId, poolName, isChampion, week, historicalData) {
    const playerSlot = document.createElement('div');
    
    // Add base classes
    playerSlot.className = 'player-slot';
    
    // Add conditional classes
    if (player.isAdvancing) playerSlot.classList.add('advancing');
    if (player.eliminated) playerSlot.classList.add('eliminated');
    if (isChampion) playerSlot.classList.add('championship-winner');
    
    // Add winner class if this player is the winner
    if (winnerId && player.position === winnerId) playerSlot.classList.add('winner');
    
    // Determine which points value to show - prefer historical data if available
    let displayPoints = 0;
    
    if (historicalData && historicalData.points !== undefined) {
      // Use historical points if we have it
      displayPoints = historicalData.points;
    } else if (player.points !== undefined) {
      // Fall back to current points
      displayPoints = player.points;
    } else if (player.weeklyPoints !== undefined) {
      // Try weeklyPoints as last resort
      displayPoints = player.weeklyPoints;
    }
    
    // Format the points with one decimal place if needed
    const formattedPoints = Number.isInteger(displayPoints) 
      ? displayPoints 
      : parseFloat(displayPoints).toFixed(1);
    
    playerSlot.innerHTML = `
      <div class="playoff-profile-pic" style="background-image: url('${player.profilePic || 'Default.png'}')"></div>
      <div class="player-seed">${player.seed}</div>
      <div class="playoff-player-info">
        <div class="playoff-player-username">${player.username}</div>
        <div class="playoff-player-score">${formattedPoints} pts</div>
      </div>
    `;
    
    // Add status indicators if needed
    if (player.hasBye) {
      const byeBadge = document.createElement('span');
      byeBadge.className = 'bye-badge';
      byeBadge.textContent = 'BYE';
      playerSlot.appendChild(byeBadge);
    }
    

    // Add click handler to show picks
    playerSlot.addEventListener('click', () => {
      showPlayerPicks(player, poolName);
    });
    
    return playerSlot;
  }
  

  // 1. Unified function to initialize the player picks panel (KEEP THIS ONE)
function initializePlayerPicksPanel() {
    if (!document.getElementById('playoff-player-picks-panel')) {
        //console.log('Creating player picks panel');
        
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
        
        const closeBtn = picksPanel.querySelector('#close-picks-panel-btn');
        closeBtn.addEventListener('click', () => {
            picksPanel.classList.remove('open');
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', function(event) {
            const panel = document.getElementById('playoff-player-picks-panel');
            if (panel && panel.classList.contains('open')) {
                if (!panel.contains(event.target) && !event.target.closest('.player-slot')) {
                    panel.classList.remove('open');
                }
            }
        });
    }
    
    return document.getElementById('playoff-player-picks-panel');
}
/*
// 2. Corrected function to fetch playoff picks (KEEP THIS ONE)
async function fetchPlayoffPicks(username, poolName) {
    try {
        const encodedUsername = encodeURIComponent(username);
        const encodedPoolName = encodeURIComponent(poolName);
        
        // Use the correct endpoint from your server-side routes
        const url = `/api/playoffs/${encodedPoolName}/picks/${encodedUsername}`;
        
        //console.log(`Fetching playoff picks from: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`Picks API returned status: ${response.status}`);
            throw new Error(`Failed to fetch picks: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching playoff picks:', error);
        return { picks: [], immortalLock: [] 
    }
}*/

async function showPlayerPicks(player, poolName) {
    //console.log('Player data received:', player);
    
    // Get the current week first
    let currentPlayoffWeek = null;
    try {
        const weekResponse = await fetch(`/api/playoffs/isPlayoff/${poolName}`);
        if (weekResponse.ok) {
            const weekData = await weekResponse.json();
            if (weekData.success) {
                currentPlayoffWeek = weekData.playoffCurrentWeek;
                //console.log('Current playoff week from API:', currentPlayoffWeek);
            }
        }
    } catch (error) {
        console.warn('Error fetching current playoff week:', error);
    }
    
    // Initialize panel
    initializePlayerPicksPanel();
    const picksPanel = document.getElementById('playoff-player-picks-panel');
    
    // Update player name in panel
    document.getElementById('selected-player-name').textContent = player.username;
    
    // Clear existing picks
    const picksContainer = picksPanel.querySelector('.player-picks-container');
    picksContainer.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        // First fetch the full bracket data to get complete player stats and match info
        let playerStats = { win: 0, loss: 0, push: 0 };
        let bracketData = null;
        let isCurrentWeekPlayer = false;
        
        try {
            const bracketResponse = await fetch(`/api/playoffs/${poolName}/bracket`);
            if (bracketResponse.ok) {
                bracketData = await bracketResponse.json();
                if (bracketData.success && bracketData.bracket && bracketData.bracket.members) {
                    // Find this player in the members array to get their stats
                    const fullPlayerData = bracketData.bracket.members.find(
                        m => m.username.toLowerCase() === player.username.toLowerCase()
                    );
                    
                    if (fullPlayerData) {
                        //console.log('Found full player data:', fullPlayerData);
                        // Get stats either from stats object or directly from player
                        playerStats.win = fullPlayerData.stats?.win || fullPlayerData.win || 0;
                        playerStats.loss = fullPlayerData.stats?.loss || fullPlayerData.loss || 0;
                        playerStats.push = fullPlayerData.stats?.push || fullPlayerData.push || 0;
                        
                        // The most important check - is this player in the current week's matches?
                        isCurrentWeekPlayer = fullPlayerData.inCurrentWeekMatch === true;
                        
                        if (!isCurrentWeekPlayer) {
                            //console.log(`Player ${player.username} is not in a current week match`);
                            alert(`Picks viewing is only available for players in current week (Week ${currentPlayoffWeek}) matchups.`);
                            picksPanel.classList.remove('open');
                            return;
                        }
                        
                        // Next, find the specific match the user clicked on to verify it's current
                        if (player.position) {
                            // Try to find the match containing this position
                            const clickedMatch = bracketData.bracket.matches.find(match => 
                                (match.player1?.position === player.position || 
                                 match.player2?.position === player.position)
                            );
                            
                            if (clickedMatch && clickedMatch.week !== currentPlayoffWeek) {
                                //console.log(`Player clicked from week ${clickedMatch.week}, not current week ${currentPlayoffWeek}`);
                                alert(`Picks viewing is only available for current week (Week ${currentPlayoffWeek}) matchups.`);
                                picksPanel.classList.remove('open');
                                return;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Error fetching bracket data:', error);
        }
        
        //console.log('Using player stats:', playerStats);
        
        // Update the record in the UI
        const recordContainer = picksPanel.querySelector('.player-record');
        if (recordContainer) {
            const recordItems = recordContainer.querySelectorAll('.record-item');
            
            // Directly set the HTML of the record items for more reliable updating
            if (recordItems.length >= 1) recordItems[0].innerHTML = `<span>W:</span> <span>${playerStats.win}</span>`;
            if (recordItems.length >= 2) recordItems[1].innerHTML = `<span>L:</span> <span>${playerStats.loss}</span>`;
            if (recordItems.length >= 3) recordItems[2].innerHTML = `<span>P:</span> <span>${playerStats.push}</span>`;
        }
        
        // Get team logos map for displaying team logos
        const teamLogos = getTeamLogos();
        
        // Fetch player picks
        const picksData = await fetchPlayoffPicks(player.username, poolName);
        
        // Fetch results to color the picks
        let results = [];
        try {
            const resultsResponse = await fetch('/api/getResults');
            if (resultsResponse.ok) {
                const resultsData = await resultsResponse.json();
                results = resultsData.success ? resultsData.results || [] : [];
            }
        } catch (error) {
            console.warn('Error fetching results:', error);
        }
        
        // Clear loading spinner
        picksContainer.innerHTML = '';
        
        if (picksData && picksData.picks && picksData.picks.length > 0) {
            // Render picks
            picksData.picks.forEach(pick => {
                const pickElement = document.createElement('div');
                pickElement.className = 'pick-item';
                
                // Find matching result for playoff picks
                const matchingResult = results.find(r => 
                    r.username?.toLowerCase() === player.username.toLowerCase() &&
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
                    <img src="${teamLogos[pick.teamName] || '/Default.png'}" alt="${pick.teamName}" class="team-logo">
                    <div class="pick-details">
                        <div class="pick-team">${pick.teamName}</div>
                        <div class="pick-value" style="color: ${color} !important">${pick.value}</div>
                    </div>
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
                    r.username?.toLowerCase() === player.username.toLowerCase() &&
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
                    <img src="${teamLogos[immortalPick.teamName] || '/Default.png'}" alt="${immortalPick.teamName}" class="team-logo">
                    <div class="pick-details">
                        <div class="pick-team">${immortalPick.teamName}</div>
                        <div class="pick-value" style="color: ${color} !important">${immortalPick.value}</div>
                    </div>
                    <span class="immortal-lock-badge">LOCK</span>
                `;
                
                picksContainer.appendChild(pickElement);
            }
        } else {
            // No picks message
            const noPicks = document.createElement('div');
            noPicks.className = 'no-picks-message';
            noPicks.textContent = 'Submitted picks will show up here!';
            picksContainer.appendChild(noPicks);
        }
        
        // Show the panel
        picksPanel.classList.add('open');
        
    } catch (error) {
        console.error('Error showing player picks:', error);
        
        // Show error message
        picksContainer.innerHTML = `
            <div class="picks-error-message">Failed to load player picks</div>
            <button class="playoff-retry-btn" onclick="showPlayerPicks(${JSON.stringify(player)}, '${poolName}')">
                Retry
            </button>
        `;
        
        // Still show the panel with the error
        picksPanel.classList.add('open');
    }
}
// Add this function to your code - it's missing in your implementation
async function fetchPlayoffPicks(username, poolName) {
    try {
        const encodedUsername = encodeURIComponent(username);
        const encodedPoolName = encodeURIComponent(poolName);
        
        // Use the correct endpoint from your server-side routes
        const url = `/api/playoffs/${encodedPoolName}/picks/${encodedUsername}`;
        
        //console.log(`Fetching playoff picks from: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`Picks API returned status: ${response.status}`);
            throw new Error(`Failed to fetch picks: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching playoff picks:', error);
        return { picks: [], immortalLock: [] };
    }
}

function renderBracket(bracketData, container, poolName) {
    //console.log('Starting to render bracket with data:', bracketData);
    
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
    
    // Custom sort function that considers tournament structure
    function customSortMatches(a, b, memberCount) {
      // Special case for 7-player brackets
      if (memberCount === 7) {
        // For the semifinal round (week 15)
        if (a.round === 2 && b.round === 2) {
          // Ensure seed 1's match is always first (at the top)
          const aHasSeed1 = 
            (a.player1 && a.player1.seed === 1) || 
            (a.player2 && a.player2.seed === 1);
          const bHasSeed1 = 
            (b.player1 && b.player1.seed === 1) || 
            (b.player2 && b.player2.seed === 1);
          
          if (aHasSeed1 && !bHasSeed1) return -1;
          if (!aHasSeed1 && bHasSeed1) return 1;
        }
        
        // For the first round (week 14)
        if (a.round === 1 && b.round === 1) {
          // Put the 4/5 matchup first (at the top)
          const aHas4or5 = 
            (a.player1 && (a.player1.seed === 4 || a.player1.seed === 5)) || 
            (a.player2 && (a.player2.seed === 4 || a.player2.seed === 5));
          const bHas4or5 = 
            (b.player1 && (b.player1.seed === 4 || b.player1.seed === 5)) || 
            (b.player2 && (b.player2.seed === 4 || b.player2.seed === 5));
          
          if (aHas4or5 && !bHas4or5) return -1;
          if (!aHas4or5 && bHas4or5) return 1;
        }
      }
      
      // Special case for 8-player brackets
      if (memberCount === 8) {
        // Put 1/8 match at the top, followed by 4/5, then 3/6, then 2/7
        const getMatchPriority = (match) => {
          const seeds = [
            match.player1 ? match.player1.seed : 999,
            match.player2 ? match.player2.seed : 999
          ].sort((x, y) => x - y);
          
          // Priority based on lowest seed in match
          if (seeds[0] === 1) return 0; // 1/8 match
          if (seeds[0] === 4) return 1; // 4/5 match
          if (seeds[0] === 3) return 2; // 3/6 match
          if (seeds[0] === 2) return 3; // 2/7 match
          return 4; // Any other match
        };
        
        const aPriority = getMatchPriority(a);
        const bPriority = getMatchPriority(b);
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
      }
      
      // Special case for 9-player brackets
      if (memberCount === 9) {
        // For the quarterfinal round
        if (a.round === 2 && b.round === 2) {
          // Order: 1 vs 8/9 winner, 4 vs 5, 3 vs 6, 2 vs 7
          const getMatchPriority = (match) => {
            const seeds = [
              match.player1 ? match.player1.seed : 999,
              match.player2 ? match.player2.seed : 999
            ].sort((x, y) => x - y);
            
            if (seeds[0] === 1) return 0;
            if (seeds[0] === 4) return 1;
            if (seeds[0] === 3) return 2;
            if (seeds[0] === 2) return 3;
            return 4;
          };
          
          const aPriority = getMatchPriority(a);
          const bPriority = getMatchPriority(b);
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
        }
      }
      
      // Special case for 10-player brackets
      if (memberCount === 10) {
        // Similar to 9-player bracket but with two play-in games
        if (a.round === 2 && b.round === 2) {
          // Order: 1 vs 8/9 winner, 4 vs 5, 3 vs 6, 2 vs 7/10 winner
          const getMatchPriority = (match) => {
            const seeds = [
              match.player1 ? match.player1.seed : 999,
              match.player2 ? match.player2.seed : 999
            ].sort((x, y) => x - y);
            
            if (seeds[0] === 1) return 0;
            if (seeds[0] === 4) return 1;
            if (seeds[0] === 3) return 2;
            if (seeds[0] === 2) return 3;
            return 4;
          };
          
          const aPriority = getMatchPriority(a);
          const bPriority = getMatchPriority(b);
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
        }
      }
      
      // Default to comparing positions
      const aPos = a.player1?.position || a.player2?.position || '';
      const bPos = b.player1?.position || b.player2?.position || '';
      return aPos.localeCompare(bPos);
    }
    
    // Add rounds to the bracket
    Object.values(roundGroups).sort((a, b) => a.week - b.week).forEach(roundGroup => {
      const roundElement = document.createElement('div');
      roundElement.className = 'bracket-round';
      
      // Set data attributes for easier styling
      roundElement.dataset.round = roundGroup.week.toString();
      roundElement.dataset.totalRounds = bracketData.rounds.length.toString();
      roundElement.dataset.playerCount = memberCount.toString();
      
      // Sort matches using our custom sort function
      const sortedMatches = roundGroup.matches.sort((a, b) => {
        return customSortMatches(a, b, memberCount);
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
    
    setTimeout(() => {
        //console.log("Delayed bracket connector creation starting...");
        createBracketConnectors(bracketData, visibleMatches, bracketData.rounds.length);
      }, 500); // 500ms delay
    //console.log('Bracket rendered successfully with', memberCount, 'players');
}
// Bracket connectors for 6, 7, 8, 9, and 10-player brackets
// Bracket connectors for 6, 7, 8, 9, and 10-player brackets
function createBracketConnectors() {
    //console.log("Starting createBracketConnectors function...");
    
    // Wait for DOM to be fully loaded
    setTimeout(() => {
      // Find ALL bracket containers (not just the first one)
      const bracketContainers = document.querySelectorAll('.playoff-bracket-container');
      //console.log(`Found ${bracketContainers.length} bracket containers on the page`);
      
      // Process each bracket container separately
      bracketContainers.forEach((bracketContainer, index) => {
        //console.log(`Processing bracket container ${index + 1}...`);
        
        // Check player count from data attribute or class
        const playerCount = parseInt(bracketContainer.querySelector('.bracket-round')?.dataset.playerCount || '0');
        const containerHas10PlayerClass = bracketContainer.classList.contains('bracket-size-10');
        const containerHas9PlayerClass = bracketContainer.classList.contains('bracket-size-9');
        const containerHas8PlayerClass = bracketContainer.classList.contains('bracket-size-8');
        const containerHas7PlayerClass = bracketContainer.classList.contains('bracket-size-7');
        const containerHas6PlayerClass = bracketContainer.classList.contains('bracket-size-6');
        
        // Get all rounds for this specific bracket
        const rounds = bracketContainer.querySelectorAll('.bracket-round');
        
        // Determine bracket type
        let bracketType = null;
        
        // 10-player brackets have 4 rounds with 2 matches in first round
        if (playerCount === 10 || containerHas10PlayerClass || 
            (rounds.length === 4 && rounds[0].querySelectorAll('.match-container').length === 2)) {
          bracketType = 10;
        }
        // 9-player brackets have 4 rounds with 1 match in first round
        else if (playerCount === 9 || containerHas9PlayerClass || 
            (rounds.length === 4 && rounds[0].querySelectorAll('.match-container').length === 1)) {
          bracketType = 9;
        }
        // 8-player brackets have exactly 4 matches in first round (or 3 rounds total)
        else if (playerCount === 8 || containerHas8PlayerClass || 
                (rounds.length === 3 && rounds[0].querySelectorAll('.match-container').length === 4)) {
          bracketType = 8;
        }
        // 7-player brackets have exactly 3 matches in first round
        else if (playerCount === 7 || containerHas7PlayerClass || 
                (rounds.length === 3 && rounds[0].querySelectorAll('.match-container').length === 3)) {
          bracketType = 7;
        }
        // 6-player brackets have exactly 2 matches in first round
        else if (playerCount === 6 || containerHas6PlayerClass || 
                (rounds.length === 3 && rounds[0].querySelectorAll('.match-container').length === 2)) {
          bracketType = 6;
        }
        
        if (!bracketType) {
          //console.log(`Bracket ${index + 1} is not a 6, 7, 8, 9, or 10-player bracket, skipping`);
          return; // Skip this bracket container
        }
        
        //console.log(`Creating connectors for ${bracketType}-player bracket ${index + 1}`);
        
        // Make sure the container has position relative
        bracketContainer.style.position = 'relative';
        
        // Clear any existing connectors for this specific bracket
        const existingConnectors = bracketContainer.querySelectorAll('.bracket-connector');
        existingConnectors.forEach(conn => conn.remove());
        //console.log(`Cleared ${existingConnectors.length} existing connectors from bracket ${index + 1}`);
        
        try {
          if (bracketType === 10) {
            // 10-player bracket connectors
            if (rounds.length < 4) {
              //console.log(`Bracket ${index + 1} doesn't have enough rounds (${rounds.length}) for a 10-player bracket, skipping`);
              return;
            }
            
            // Get matches from each round
            const firstRoundMatches = rounds[0].querySelectorAll('.match-container');
            const quarterFinalMatches = rounds[1].querySelectorAll('.match-container');
            const semiFinalMatches = rounds[2].querySelectorAll('.match-container');
            const finalMatch = rounds[3].querySelector('.match-container');
            
            // Verify structure
            if (firstRoundMatches.length !== 2 || quarterFinalMatches.length !== 4 || 
                semiFinalMatches.length !== 2 || !finalMatch) {
              //console.log(`Bracket ${index + 1} does not have the correct match structure for a 10-player bracket`);
              return;
            }
            
            // Connect first round to quarter finals
            // First match (top) to bottom slot of first quarter-final
            createConnector(bracketContainer, firstRoundMatches[0], quarterFinalMatches[0], 'bottom');
            
            // Second match (bottom) to bottom slot of fourth quarter-final
            createConnector(bracketContainer, firstRoundMatches[1], quarterFinalMatches[3], 'bottom');
            
            // Connect quarter finals to semi finals
            createConnector(bracketContainer, quarterFinalMatches[0], semiFinalMatches[0], 'top');
            createConnector(bracketContainer, quarterFinalMatches[1], semiFinalMatches[0], 'bottom');
            createConnector(bracketContainer, quarterFinalMatches[2], semiFinalMatches[1], 'top');
            createConnector(bracketContainer, quarterFinalMatches[3], semiFinalMatches[1], 'bottom');
            
            // Connect semi finals to finals
            createConnector(bracketContainer, semiFinalMatches[0], finalMatch, 'top');
            createConnector(bracketContainer, semiFinalMatches[1], finalMatch, 'bottom');
            
          } else if (bracketType === 9) {
            // 9-player bracket connectors
            if (rounds.length < 4) {
              //console.log(`Bracket ${index + 1} doesn't have enough rounds (${rounds.length}) for a 9-player bracket, skipping`);
              return;
            }
            
            // Get matches from each round
            const firstRoundMatches = rounds[0].querySelectorAll('.match-container');
            const quarterFinalMatches = rounds[1].querySelectorAll('.match-container');
            const semiFinalMatches = rounds[2].querySelectorAll('.match-container');
            const finalMatch = rounds[3].querySelector('.match-container');
            
            // Verify structure
            if (firstRoundMatches.length !== 1 || quarterFinalMatches.length !== 4 || 
                semiFinalMatches.length !== 2 || !finalMatch) {
              //console.log(`Bracket ${index + 1} does not have the correct match structure for a 9-player bracket`);
              return;
            }
            
            // Connect first round to quarter finals (first match, bottom slot - TBD spot)
            createConnector(bracketContainer, firstRoundMatches[0], quarterFinalMatches[0], 'bottom');
            
            // Connect quarter finals to semi finals
            createConnector(bracketContainer, quarterFinalMatches[0], semiFinalMatches[0], 'top');
            createConnector(bracketContainer, quarterFinalMatches[1], semiFinalMatches[0], 'bottom');
            createConnector(bracketContainer, quarterFinalMatches[2], semiFinalMatches[1], 'top');
            createConnector(bracketContainer, quarterFinalMatches[3], semiFinalMatches[1], 'bottom');
            
            // Connect semi finals to finals
            createConnector(bracketContainer, semiFinalMatches[0], finalMatch, 'top');
            createConnector(bracketContainer, semiFinalMatches[1], finalMatch, 'bottom');
            
          } else if (bracketType === 8) {
            // 8-player bracket connectors
            if (rounds.length < 3) {
              //console.log(`Bracket ${index + 1} doesn't have enough rounds (${rounds.length}), skipping`);
              return;
            }
            
            const firstRoundMatches = rounds[0].querySelectorAll('.match-container');
            const semiFinalMatches = rounds[1].querySelectorAll('.match-container');
            const finalMatch = rounds[2].querySelector('.match-container');
            
            // Proceed only if we have the correct structure for an 8-player bracket
            if (firstRoundMatches.length !== 4 || semiFinalMatches.length !== 2 || !finalMatch) {
              //console.log(`Bracket ${index + 1} does not have the correct match structure for an 8-player bracket`);
              return;
            }
            
            // Create connectors for quarter finals to semi-finals
            // First match to top slot of first semi-final
            createConnector(bracketContainer, firstRoundMatches[0], semiFinalMatches[0], 'top');
            
            // Second match to bottom slot of first semi-final
            createConnector(bracketContainer, firstRoundMatches[1], semiFinalMatches[0], 'bottom');
            
            // Third match to top slot of second semi-final
            createConnector(bracketContainer, firstRoundMatches[2], semiFinalMatches[1], 'top');
            
            // Fourth match to bottom slot of second semi-final
            createConnector(bracketContainer, firstRoundMatches[3], semiFinalMatches[1], 'bottom');
            
            // Create connectors for semi-finals to final
            createConnector(bracketContainer, semiFinalMatches[0], finalMatch, 'top');
            createConnector(bracketContainer, semiFinalMatches[1], finalMatch, 'bottom');
            
          } else if (bracketType === 7) {
            // 7-player bracket connectors
            if (rounds.length < 3) {
              //console.log(`Bracket ${index + 1} doesn't have enough rounds (${rounds.length}), skipping`);
              return;
            }
            
            const firstRoundMatches = rounds[0].querySelectorAll('.match-container');
            const semiFinalMatches = rounds[1].querySelectorAll('.match-container');
            const finalMatch = rounds[2].querySelector('.match-container');
            
            // Proceed only if we have the correct structure for a 7-player bracket
            if (firstRoundMatches.length !== 3 || semiFinalMatches.length !== 2 || !finalMatch) {
              //console.log(`Bracket ${index + 1} does not have the correct match structure for a 7-player bracket`);
              return;
            }
            
            // Create connectors for first round to semi-finals
            // Top match to bottom slot of top semi-final (TBD spot)
            createConnector(bracketContainer, firstRoundMatches[0], semiFinalMatches[0], 'bottom');
            
            // Second match to top slot of bottom semi-final
            createConnector(bracketContainer, firstRoundMatches[1], semiFinalMatches[1], 'top');
            
            // Third match to bottom slot of bottom semi-final
            createConnector(bracketContainer, firstRoundMatches[2], semiFinalMatches[1], 'bottom');
            
            // Create connectors for semi-finals to final
            createConnector(bracketContainer, semiFinalMatches[0], finalMatch, 'top');
            createConnector(bracketContainer, semiFinalMatches[1], finalMatch, 'bottom');
            
          } else if (bracketType === 6) {
            // 6-player bracket connectors
            if (rounds.length < 3) {
              //console.log(`Bracket ${index + 1} doesn't have enough rounds (${rounds.length}), skipping`);
              return;
            }
            
            const firstRoundMatches = rounds[0].querySelectorAll('.match-container');
            const semiFinalMatches = rounds[1].querySelectorAll('.match-container');
            const finalMatch = rounds[2].querySelector('.match-container');
            
            // Proceed only if we have the correct structure for a 6-player bracket
            if (firstRoundMatches.length !== 2 || semiFinalMatches.length !== 2 || !finalMatch) {
              //console.log(`Bracket ${index + 1} does not have the correct match structure for a 6-player bracket`);
              return;
            }
            
            // Create connectors for first round to semi-finals
            // Top match to top slot of top semi-final (TBD spot)
            createConnector(bracketContainer, firstRoundMatches[0], semiFinalMatches[0], 'top');
            
            // Bottom match to top slot of bottom semi-final (TBD spot)
            createConnector(bracketContainer, firstRoundMatches[1], semiFinalMatches[1], 'top');
            
            // Create connectors for semi-finals to final
            createConnector(bracketContainer, semiFinalMatches[0], finalMatch, 'top');
            createConnector(bracketContainer, semiFinalMatches[1], finalMatch, 'bottom');
          }

        } catch (error) {
          console.error(`Error creating connectors for bracket ${index + 1}:`, error);
        }
      });
    }, 1000); // Delay to ensure all elements are rendered
}

// Function to create a single connector
function createConnector(container, fromMatch, toMatch, position) {
  if (!fromMatch || !toMatch) return;
  
  // Get positions
  const containerRect = container.getBoundingClientRect();
  const fromRect = fromMatch.getBoundingClientRect();
  const toRect = toMatch.getBoundingClientRect();
  
  // Calculate relative positions
  const startX = fromRect.right - containerRect.left;
  const startY = fromRect.top + (fromRect.height / 2) - containerRect.top;
  const endX = toRect.left - containerRect.left;
  const endY = toRect.top + (position === 'top' ? 0.25 : 0.75) * toRect.height - containerRect.top;
  
  // Calculate the midpoint X (horizontal distance / 2)
  const midX = startX + (endX - startX) * 0.5;
  
  // Create horizontal connector from match
  const horizontalConnector1 = document.createElement('div');
  horizontalConnector1.className = 'bracket-connector horizontal-connector';
  horizontalConnector1.style.position = 'absolute';
  horizontalConnector1.style.left = `${startX}px`;
  horizontalConnector1.style.top = `${startY}px`;
  horizontalConnector1.style.width = `${midX - startX}px`;
  horizontalConnector1.style.height = '2px';
  horizontalConnector1.style.backgroundColor = '#33d9ff';
  horizontalConnector1.style.boxShadow = '0 0 8px #33d9ff, 0 0 16px #33d9ff';
  horizontalConnector1.style.zIndex = '5';
  
  // Create vertical connector
  const verticalConnector = document.createElement('div');
  verticalConnector.className = 'bracket-connector vertical-connector';
  verticalConnector.style.position = 'absolute';
  verticalConnector.style.left = `${midX}px`;
  verticalConnector.style.top = `${Math.min(startY, endY)}px`;
  verticalConnector.style.width = '2px';
  verticalConnector.style.height = `${Math.abs(endY - startY)}px`;
  verticalConnector.style.backgroundColor = '#33d9ff';
  verticalConnector.style.boxShadow = '0 0 8px #33d9ff, 0 0 16px #33d9ff';
  verticalConnector.style.zIndex = '5';
  
  // Create horizontal connector to next match
  const horizontalConnector2 = document.createElement('div');
  horizontalConnector2.className = 'bracket-connector horizontal-connector';
  horizontalConnector2.style.position = 'absolute';
  horizontalConnector2.style.left = `${midX}px`;
  horizontalConnector2.style.top = `${endY}px`;
  horizontalConnector2.style.width = `${endX - midX}px`;
  horizontalConnector2.style.height = '2px';
  horizontalConnector2.style.backgroundColor = '#33d9ff';
  horizontalConnector2.style.boxShadow = '0 0 8px #33d9ff, 0 0 16px #33d9ff';
  horizontalConnector2.style.zIndex = '5';
  
  // Add connectors to container
  container.appendChild(horizontalConnector1);
  container.appendChild(verticalConnector);
  container.appendChild(horizontalConnector2);
}

// Function to handle window resize
function handleResize() {
  // Remove existing connectors
  const existingConnectors = document.querySelectorAll('.bracket-connector');
  existingConnectors.forEach(conn => conn.remove());
  
  // Recreate connectors
  createBracketConnectors();
}

// Initialize connectors
document.addEventListener('DOMContentLoaded', function() {
  // Create connectors initially
  createBracketConnectors();
  
  // Add resize event listener
  window.addEventListener('resize', function() {
    // Debounce resize event
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(handleResize, 250);
  });
  
  // Also run after a longer delay to catch any late-loading brackets
  setTimeout(createBracketConnectors, 2000);
  setTimeout(createBracketConnectors, 3000);
});

// Add CSS for connectors
const connectorStyles = document.createElement('style');
connectorStyles.textContent = `
  .bracket-connector {
    position: absolute;
    background-color: #33d9ff;
    box-shadow: 0 0 8px #33d9ff, 0 0 16px #33d9ff;
    z-index: 5;
    pointer-events: none;
  }
  
  .horizontal-connector {
    height: 2px;
  }
  
  .vertical-connector {
    width: 2px;
  }
  
  /* Make sure the bracket container has position relative */
  .playoff-bracket-container {
    position: relative !important;
  }
`;
document.head.appendChild(connectorStyles);
function rebuildUIWithResults(results) {
    if (!results || !Array.isArray(results) || results.length === 0) {
        console.warn('No results provided to rebuildUIWithResults');
        return;
    }

    console.log(`Processing ${results.length} results to match against picks on screen`);
    
    // Log a few sample results to understand the structure
    if (results.length > 0) {
        console.log('Sample result structure:', results[0]);
    }

    // Process regular pool picks (both with and without playoffs)
    const regularPicks = document.querySelectorAll('.player-picks .pick, .player-immortal-lock .immortal-lock');
    console.log(`Found ${regularPicks.length} regular pick elements on the page`);
    processPickElements(regularPicks, results, false);

    // Process playoff-specific picks
    const playoffPicks = document.querySelectorAll('.playoff-bracket-container .pick-item');
    console.log(`Found ${playoffPicks.length} playoff pick elements on the page`);
    processPickElements(playoffPicks, results, true);
}

// Helper function to process pick elements
function processPickElements(pickElements, results, isPlayoffPick) {
    if (pickElements.length === 0) {
        console.log(`No ${isPlayoffPick ? 'playoff' : 'regular'} pick elements found`);
        return;
    }

  //  console.log(`Processing ${pickElements.length} ${isPlayoffPick ? 'playoff' : 'regular'} pick elements`);

    pickElements.forEach((pickElement, index) => {
        console.log(`Processing ${isPlayoffPick ? 'playoff' : 'regular'} pick ${index + 1}/${pickElements.length}`);
        console.log('Pick element HTML:', pickElement.outerHTML);
        
        // Handle different element structures for playoff vs regular picks
        let teamLogo, displayedBetValue;

        if (isPlayoffPick) {
            // Playoff pick structure
            teamLogo = pickElement.querySelector('.team-logo');
            displayedBetValue = pickElement.querySelector('.pick-value')?.textContent.trim();
        } else {
            // Regular pick structure
            teamLogo = pickElement.querySelector('.team-logo');
            displayedBetValue = pickElement.querySelector('span')?.textContent.trim();
        }

     //   console.log('Team logo found:', !!teamLogo);
      //  console.log('Displayed bet value:', displayedBetValue);

        if (!teamLogo || !displayedBetValue) {
            console.warn('Team logo or bet value not found in pick element', pickElement);
            return; // Skip if no logo or value is found
        }

        const teamName = teamLogo.alt;
     //   console.log('Team name:', teamName);

        // Find the matching result
        let matchFound = false;
        let matchingResult = null;
        
        results.forEach((result, resultIndex) => {
            const resultIsPlayoff = result.isPlayoffPick === true;
            const resultTeamMatches = result.teamName === teamName;
            const resultValueMatches = result.betValue.toString().trim() === displayedBetValue;
            const typeMatches = (resultIsPlayoff === isPlayoffPick);
            
            if (resultTeamMatches && resultValueMatches) {
       //         console.log(`Result ${resultIndex} matches team and value:`, result);
      //          console.log(`- Type match: ${typeMatches} (result playoff: ${resultIsPlayoff}, current is playoff: ${isPlayoffPick})`);
                
                if (typeMatches) {
                    matchFound = true;
                    matchingResult = result;
     //               console.log('FULL MATCH FOUND');
                }
            }
        });

        if (matchingResult) {
           // console.log(`Found matching result for ${teamName} with value ${displayedBetValue}:`, matchingResult);
            
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

           // console.log(`Will apply color ${color} based on result: ${matchingResult.result}`);

            // Apply the color to the element (different structure based on type)
            if (isPlayoffPick) {
                const valueElement = pickElement.querySelector('.pick-value');
                if (valueElement) {
          //          console.log('Applying color to playoff pick value element');
                    valueElement.style.setProperty('color', color, 'important');
                } else {
                    console.warn('No pick-value element found in playoff pick');
                }
            } else {
                const valueSpan = pickElement.querySelector('span');
                if (valueSpan) {
          //          console.log('Applying color to regular pick span element');
                    valueSpan.style.setProperty('color', color, 'important');
                } else {
                    console.warn('No span element found in regular pick');
                }
            }
            
          //  console.log(`Applied ${color} to ${teamName} for bet value ${displayedBetValue}`);
        } else {
            console.warn(`No matching result found for ${teamName} with bet value ${displayedBetValue}`);
        }
    });
    
    // Log a final summary
 //   console.log(`Finished processing ${pickElements.length} ${isPlayoffPick ? 'playoff' : 'regular'} picks`);
}

async function showPlayerPicks(player, poolName) {
    console.log('Player data received:', player);
    
    // Get the current week first
    let currentPlayoffWeek = null;
    try {
        const weekResponse = await fetch(`/api/playoffs/isPlayoff/${poolName}`);
        if (weekResponse.ok) {
            const weekData = await weekResponse.json();
            if (weekData.success) {
                currentPlayoffWeek = weekData.playoffCurrentWeek;
                console.log('Current playoff week from API:', currentPlayoffWeek);
            }
        }
    } catch (error) {
        console.warn('Error fetching current playoff week:', error);
    }
    
    // Initialize panel
    initializePlayerPicksPanel();
    const picksPanel = document.getElementById('playoff-player-picks-panel');
    
    // Update player name in panel
    document.getElementById('selected-player-name').textContent = player.username;
    
    // Clear existing picks
    const picksContainer = picksPanel.querySelector('.player-picks-container');
    picksContainer.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        // Check what time phase we're in
        const timePhase = await getCurrentTimePhase();
        
        // If the current user is viewing someone else's picks during pick time
        const isCurrentUser = player.username.toLowerCase() === localStorage.getItem('username').toLowerCase();
        
        if (timePhase === 'pick' && !isCurrentUser) {
            // Show pick time banner instead of picks for other users
            picksContainer.innerHTML = '';
            const bannerImage = document.createElement('img');
            bannerImage.src = 'PlayoffPickBanner.png'; // Create a new banner image specifically for playoffs
            bannerImage.alt = 'Picks Hidden During Selection Period';
            bannerImage.className = 'playoff-pick-banner';
            picksContainer.appendChild(bannerImage);
            
            // First fetch the full bracket data to get complete player stats
            let playerStats = { win: 0, loss: 0, push: 0 };
            
            try {
                const bracketResponse = await fetch(`/api/playoffs/${poolName}/bracket`);
                if (bracketResponse.ok) {
                    const bracketData = await bracketResponse.json();
                    if (bracketData.success && bracketData.bracket && bracketData.bracket.members) {
                        // Find this player in the members array to get their stats
                        const fullPlayerData = bracketData.bracket.members.find(
                            m => m.username.toLowerCase() === player.username.toLowerCase()
                        );
                        
                        if (fullPlayerData) {
                            // Get stats either from stats object or directly from player
                            playerStats.win = fullPlayerData.stats?.win || fullPlayerData.win || 0;
                            playerStats.loss = fullPlayerData.stats?.loss || fullPlayerData.loss || 0;
                            playerStats.push = fullPlayerData.stats?.push || fullPlayerData.push || 0;
                        }
                    }
                }
            } catch (error) {
                console.warn('Error fetching bracket data:', error);
            }
            
            // Update the record in the UI
            const recordContainer = picksPanel.querySelector('.player-record');
            if (recordContainer) {
                const recordItems = recordContainer.querySelectorAll('.record-item');
                
                // Directly set the HTML of the record items for more reliable updating
                if (recordItems.length >= 1) recordItems[0].innerHTML = `<span>W:</span> <span>${playerStats.win}</span>`;
                if (recordItems.length >= 2) recordItems[1].innerHTML = `<span>L:</span> <span>${playerStats.loss}</span>`;
                if (recordItems.length >= 3) recordItems[2].innerHTML = `<span>P:</span> <span>${playerStats.push}</span>`;
            }
            
            // Show the panel
            picksPanel.classList.add('open');
            return;
        }
        
        // First fetch the full bracket data to get complete player stats and match info
        let playerStats = { win: 0, loss: 0, push: 0 };
        let bracketData = null;
        let isCurrentWeekPlayer = false;
        
        try {
            const bracketResponse = await fetch(`/api/playoffs/${poolName}/bracket`);
            if (bracketResponse.ok) {
                bracketData = await bracketResponse.json();
                if (bracketData.success && bracketData.bracket && bracketData.bracket.members) {
                    // Find this player in the members array to get their stats
                    const fullPlayerData = bracketData.bracket.members.find(
                        m => m.username.toLowerCase() === player.username.toLowerCase()
                    );
                    
                    if (fullPlayerData) {
                        console.log('Found full player data:', fullPlayerData);
                        // Get stats either from stats object or directly from player
                        playerStats.win = fullPlayerData.stats?.win || fullPlayerData.win || 0;
                        playerStats.loss = fullPlayerData.stats?.loss || fullPlayerData.loss || 0;
                        playerStats.push = fullPlayerData.stats?.push || fullPlayerData.push || 0;
                        
                        // The most important check - is this player in the current week's matches?
                        isCurrentWeekPlayer = fullPlayerData.inCurrentWeekMatch === true;
                        
                        if (!isCurrentWeekPlayer) {
                            console.log(`Player ${player.username} is not in a current week match`);
                            alert(`Picks viewing is only available for players in current week (Week ${currentPlayoffWeek}) matchups.`);
                            picksPanel.classList.remove('open');
                            return;
                        }
                        
                        // Next, find the specific match the user clicked on to verify it's current
                        if (player.position) {
                            // Try to find the match containing this position
                            const clickedMatch = bracketData.bracket.matches.find(match => 
                                (match.player1?.position === player.position || 
                                 match.player2?.position === player.position)
                            );
                            
                            if (clickedMatch && clickedMatch.week !== currentPlayoffWeek) {
                                console.log(`Player clicked from week ${clickedMatch.week}, not current week ${currentPlayoffWeek}`);
                                alert(`Picks viewing is only available for current week (Week ${currentPlayoffWeek}) matchups.`);
                                picksPanel.classList.remove('open');
                                return;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Error fetching bracket data:', error);
        }
        
        console.log('Using player stats:', playerStats);
        
        // Update the record in the UI
        const recordContainer = picksPanel.querySelector('.player-record');
        if (recordContainer) {
            const recordItems = recordContainer.querySelectorAll('.record-item');
            
            // Directly set the HTML of the record items for more reliable updating
            if (recordItems.length >= 1) recordItems[0].innerHTML = `<span>W:</span> <span>${playerStats.win}</span>`;
            if (recordItems.length >= 2) recordItems[1].innerHTML = `<span>L:</span> <span>${playerStats.loss}</span>`;
            if (recordItems.length >= 3) recordItems[2].innerHTML = `<span>P:</span> <span>${playerStats.push}</span>`;
        }
        
        // Get team logos map for displaying team logos
        const teamLogos = getTeamLogos();
        
        // Fetch player picks
        const picksData = await fetchPlayoffPicks(player.username, poolName);
        
        // Fetch results to color the picks
        let results = [];
        try {
            const resultsResponse = await fetch('/api/getResults');
            if (resultsResponse.ok) {
                const resultsData = await resultsResponse.json();
                results = resultsData.success ? resultsData.results || [] : [];
            }
        } catch (error) {
            console.warn('Error fetching results:', error);
        }
        
        // Clear loading spinner
        picksContainer.innerHTML = '';
        
        if (picksData && picksData.picks && picksData.picks.length > 0) {
            // Render picks
            picksData.picks.forEach(pick => {
                const pickElement = document.createElement('div');
                pickElement.className = 'pick-item';
                
                // Find matching result for playoff picks
                const matchingResult = results.find(r => 
                    r.username?.toLowerCase() === player.username.toLowerCase() &&
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
                    <img src="${teamLogos[pick.teamName] || '/Default.png'}" alt="${pick.teamName}" class="team-logo">
                    <div class="pick-details">
                        <div class="pick-team">${pick.teamName}</div>
                        <div class="pick-value" style="color: ${color} !important">${pick.value}</div>
                    </div>
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
                    r.username?.toLowerCase() === player.username.toLowerCase() &&
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
                    <img src="${teamLogos[immortalPick.teamName] || '/Default.png'}" alt="${immortalPick.teamName}" class="team-logo">
                    <div class="pick-details">
                        <div class="pick-team">${immortalPick.teamName}</div>
                        <div class="pick-value" style="color: ${color} !important">${immortalPick.value}</div>
                    </div>
                    <span class="immortal-lock-badge">LOCK</span>
                `;
                
                picksContainer.appendChild(pickElement);
            }
        } else {
            // No picks message
            const noPicks = document.createElement('div');
            noPicks.className = 'no-picks-message';
            noPicks.textContent = 'Submitted picks will show up here!';
            picksContainer.appendChild(noPicks);
        }
        
        // Show the panel
        picksPanel.classList.add('open');
        
    } catch (error) {
        console.error('Error showing player picks:', error);
        
        // Show error message
        picksContainer.innerHTML = `
            <div class="picks-error-message">Failed to load player picks</div>
            <button class="playoff-retry-btn" onclick="showPlayerPicks(${JSON.stringify(player)}, '${poolName}')">
                Retry
            </button>
        `;
        
        // Still show the panel with the error
        picksPanel.classList.add('open');
    }
}

// Add this function to your homepage.js file
function addSurvivorPoolLockControl(poolWrapper, isAdmin, poolName, isLocked) {
    console.log('Starting addSurvivorPoolLockControl function');
    console.log('Parameters:', { 
        poolWrapperExists: !!poolWrapper, 
        isAdmin: isAdmin, 
        poolName: poolName, 
        isLocked: isLocked 
    });
    
    // Only add to survivor pools and only for admins
    if (!isAdmin || !poolWrapper.classList.contains('survivor-mode')) {
        console.log('Not adding control - either not admin or not survivor mode');
        console.log('isAdmin:', isAdmin);
        console.log('isSurvivorMode:', poolWrapper.classList.contains('survivor-mode'));
        return;
    }
    
    // Find the pool name container to add our toggle
    const poolNameContainer = poolWrapper.querySelector('.pool-name-container');
    console.log('PoolNameContainer found:', !!poolNameContainer);
    
    if (!poolNameContainer) {
        console.log('Pool name container not found, returning');
        return;
    }
    
    // Find the stats container (where we want to add the toggle)
    const statsContainer = poolNameContainer.querySelector('.survivor-stats-container');
    if (!statsContainer) {
        console.log('Stats container not found, falling back to pool name container');
        return;
    }
    
    console.log('Creating lock toggle container');
    // Create the lock toggle container
    const lockToggleContainer = document.createElement('div');
    lockToggleContainer.className = 'survivor-lock-toggle';
    
    // Create the toggle switch
    const toggleSwitch = document.createElement('label');
    toggleSwitch.className = 'switch';
    toggleSwitch.innerHTML = `
      <input type="checkbox" ${isLocked ? 'checked' : ''}>
      <span class="slider round"></span>
    `;
    
    // Create lock icon and status text
    const lockIcon = document.createElement('i');
    lockIcon.className = `fas fa-lock${isLocked ? '' : '-open'} lock-icon`;
    lockIcon.style.color = isLocked ? 'gold' : '#777';
    
    const statusText = document.createElement('span');
    statusText.className = 'lock-status-text';
    statusText.textContent = isLocked ? 'Closed' : 'Open';
    
    // Add everything to the container
    lockToggleContainer.appendChild(toggleSwitch);
    lockToggleContainer.appendChild(lockIcon);
    lockToggleContainer.appendChild(statusText);
    
    // Add the container to the stats container instead of the pool name container
    statsContainer.appendChild(lockToggleContainer);
    console.log('Lock toggle container added to stats container');
    
    // Add event listener to the toggle
    const checkbox = toggleSwitch.querySelector('input');
    checkbox.addEventListener('change', async (event) => {
      console.log('Toggle changed, new isLocked value:', event.target.checked);
      const isLocked = event.target.checked;
      try {
        console.log('Sending request to toggle survivor lock');
        const response = await fetch('/pools/toggleSurvivorLock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            poolName,
            isLocked
          })
        });
        
        console.log('Response received:', response.status);
        if (response.ok) {
          // Update the UI
          lockIcon.className = `fas fa-lock${isLocked ? '' : '-open'} lock-icon`;
          lockIcon.style.color = isLocked ? 'gold' : '#777';
          statusText.textContent = isLocked ? 'Closed Pool' : 'Open Pool';
          console.log('UI updated successfully');
        } else {
          // Revert the toggle if there was an error
          checkbox.checked = !isLocked;
          alert('Failed to update pool lock status');
          console.log('Error updating lock status, checkbox reverted');
        }
      } catch (error) {
        console.error('Error toggling pool lock:', error);
        checkbox.checked = !isLocked;
        alert('Error updating pool status');
        console.log('Exception caught, checkbox reverted');
      }
    });
    
    console.log('Event listener added to checkbox');
    console.log('addSurvivorPoolLockControl function completed');
}


/*GOLF*/


// First, let's add the new mode card to the pool manager UI
// Function to add Golf mode card to the pool manager
function addGolfModeCard() {
    // Find the mode selection container
    const modeSelection = document.querySelector('.mode-selection');
    
    if (!modeSelection) {
        console.error('Mode selection container not found');
        return;
    }
    
    // Create the golf mode card as a button (matching your existing cards)
    const golfModeCard = document.createElement('button');
    golfModeCard.className = 'mode-card';
    golfModeCard.setAttribute('data-mode', 'golf');
    
    // Add the title (matching your existing cards' simple structure)
    golfModeCard.innerHTML = `
        <div class="mode-title">Golf Pick 6</div>
    `;
    
    // Add the click handler (similar to your existing cards)
    golfModeCard.addEventListener('click', function() {
        // Remove active class from all cards
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Add active class to this card
        golfModeCard.classList.add('active');
        
        // Hide playoffs toggle since it's only for classic mode
        const playoffsToggle = document.getElementById('playoffs-toggle');
        if (playoffsToggle) {
            playoffsToggle.classList.add('hidden');
            // Reset checkbox when switching away from classic
            const checkbox = document.getElementById('hasPlayoffs');
            if (checkbox) checkbox.checked = false;
        }
    });
    
    // Add the golf mode card to the mode selection container
    modeSelection.appendChild(golfModeCard);
}

// Add this to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Add the golf mode card
    addGolfModeCard();
});


async function displayGolfPoolContainer(pool) {
    console.log('Starting displayGolfPoolContainer for pool:', pool.name);
    
    let username = localStorage.getItem("username");
    if (!username) {
      console.error("No logged-in user found!");
      return;
    }
  
    // Find or create ordered container
    let orderedContainer = document.getElementById("ordered-pools-container");
    if (!orderedContainer) {
      orderedContainer = document.createElement("div");
      orderedContainer.id = "ordered-pools-container";
      document.getElementById("pool-container-wrapper").appendChild(orderedContainer);
    }
  
    // Set the current pool name in localStorage for later use
    localStorage.setItem('currentPoolName', pool.name);
  
    const poolWrapper = document.createElement("div");
    poolWrapper.className = "pool-wrapper golf-mode";
    poolWrapper.setAttribute("data-pool-name", pool.name);
    poolWrapper.setAttribute("data-admin-username", pool.adminUsername);
    
    const memberOrder = pool.members.find(m => 
      m.username.toLowerCase() === username.toLowerCase()
    )?.orderIndex ?? 0;
    
    poolWrapper.style.order = -memberOrder;
  
    // Determine phase
    let phaseText = "Joining";
    if (pool.draftTime) phaseText = "Draft";
    if (pool.playTime) phaseText = "Tournament";
    
    // Create header container with improved styling
    const poolHeaderContainer = document.createElement("div");
    poolHeaderContainer.className = "golf-header-container";
    
    // Create top row with pool name and draft button
    const headerTop = document.createElement("div");
    headerTop.className = "golf-header-top";
    
    // Pool name with golf icon
    const poolNameDiv = document.createElement("div");
    poolNameDiv.className = "golf-pool-name";
    poolNameDiv.innerHTML = `<i class="fas fa-golf-ball"></i> ${pool.name}`;
    
    headerTop.appendChild(poolNameDiv);
    
    // START DRAFT button - when in idle phase and user is admin
    if (username.toLowerCase() === pool.adminUsername.toLowerCase() && pool.idleTime) {
      const startDraftBtn = document.createElement("button");
      startDraftBtn.className = "start-draft-button";
      startDraftBtn.innerHTML = 'START DRAFT';
      startDraftBtn.onclick = () => startGolfDraft(pool.name);
      headerTop.appendChild(startDraftBtn);
    }
    
    poolHeaderContainer.appendChild(headerTop);
    
    // Create bottom row with stats
    const headerBottom = document.createElement("div");
    headerBottom.className = "golf-header-bottom";
    
    // Phase indicator
    const phaseIndicator = document.createElement("div");
    phaseIndicator.className = "golf-phase-indicator";
    phaseIndicator.innerHTML = `
      <i class="fas fa-flag"></i>
      <span>Phase: ${phaseText}</span>
    `;
    
    // User count
    const userCountDiv = document.createElement("div");
    userCountDiv.className = "golf-user-count";
    userCountDiv.innerHTML = `
      <i class="fas fa-users"></i>
      <span>${pool.members.length} Players</span>
    `;
    
    headerBottom.appendChild(phaseIndicator);
    headerBottom.appendChild(userCountDiv);
    
    poolHeaderContainer.appendChild(headerBottom);
    poolWrapper.appendChild(poolHeaderContainer);
    
    // Create table header with improved styling
    const tableHeader = document.createElement("div");
    tableHeader.className = "golf-table-header";
    tableHeader.innerHTML = `
      <div class="golf-header-user">USER</div>
      <div class="golf-header-picks">SELECTIONS</div>
      <div class="golf-header-sum">SCORE</div>
    `;
    
    // Create scrollable container
    const poolScrollableContainer = document.createElement("div");
    poolScrollableContainer.className = "pool-scrollable-container";
    
    // Create golf pool container with improved styling
    const poolContainer = document.createElement("div");
    poolContainer.className = "golf-pool-container";
    
    poolContainer.appendChild(tableHeader);
    
    // Process members and create rows
    pool.members.forEach(member => {
      const playerRow = createGolfPlayerRow(member, username, pool, phaseText);
      poolContainer.appendChild(playerRow);
    });
    
    poolScrollableContainer.appendChild(poolContainer);
    poolWrapper.appendChild(poolScrollableContainer);
    
    // Add Golf Selections button if in draft phase - improved positioning and styling
    if (pool.draftTime) {
      const golfSelectionsBtn = document.createElement("button");
      golfSelectionsBtn.id = "golfPicksButton";
      golfSelectionsBtn.className = "golf-picks-button";
      golfSelectionsBtn.innerHTML = '<i class="fas fa-golf-ball"></i> GOLF SELECTIONS';
      golfSelectionsBtn.addEventListener("click", () => redirectToGolfSelections(pool.name));
      poolWrapper.appendChild(golfSelectionsBtn);
    }
    
    // Add chat template
    const chatTemplate = document.getElementById("chat-template")?.content.cloneNode(true);
    if (chatTemplate) {
      poolWrapper.appendChild(chatTemplate);
    }
    
    orderedContainer.appendChild(poolWrapper);
    
    // Update pool actions list
    setTimeout(() => {
      updatePoolActionsList();
    }, 100);
}


// Function to start the draft (admin only)
function startGolfDraft(poolName) {
  if (confirm(`Are you sure you want to start the draft for "${poolName}"? This cannot be undone.`)) {
    fetch(`/api/startGolfDraft/${encodeURIComponent(poolName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        username: localStorage.getItem('username')
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Draft started successfully! Redirecting to the golf selection page...');
        // Redirect to the golf selection page instead of reloading
        window.location.href = `golfSelection.html`;
      } else {
        alert(`Error starting draft: ${data.message}`);
      }
    })
    .catch(error => {
      console.error('Error starting draft:', error);
      alert('An error occurred while starting the draft.');
    });
  }
}

  
  // Function to redirect to golf selections page
  function redirectToGolfSelections(poolName) {
    window.location.href = `golfSelection.html`;
  }

  // Add this function to fetch golf picks for a specific user in a specific pool
async function fetchGolfPicks(username, poolName) {
  try {
    const encodedUsername = encodeURIComponent(username);
    const encodedPoolName = encodeURIComponent(poolName);
    
    const response = await fetch(`/api/golfPicks/${encodedUsername}/${encodedPoolName}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch golf picks: ${response.status}`);
      return { picks: [] };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching golf picks:', error);
    return { picks: [] };
  }
}

async function displayGolfPoolContainer(pool) {
  console.log('Starting displayGolfPoolContainer for pool:', pool.name);
  
  let username = localStorage.getItem("username");
  if (!username) {
    console.error("No logged-in user found!");
    return;
  }

  // Find or create ordered container
  let orderedContainer = document.getElementById("ordered-pools-container");
  if (!orderedContainer) {
    orderedContainer = document.createElement("div");
    orderedContainer.id = "ordered-pools-container";
    document.getElementById("pool-container-wrapper").appendChild(orderedContainer);
  }

  // Set the current pool name in localStorage for later use
  localStorage.setItem('currentPoolName', pool.name);

  const poolWrapper = document.createElement("div");
  poolWrapper.className = "pool-wrapper golf-mode";
  poolWrapper.setAttribute("data-pool-name", pool.name);
  poolWrapper.setAttribute("data-admin-username", pool.adminUsername);
  
  const memberOrder = pool.members.find(m => 
    m.username.toLowerCase() === username.toLowerCase()
  )?.orderIndex ?? 0;
  
  poolWrapper.style.order = -memberOrder;

  // Determine phase
  let phaseText = "Joining";
  if (pool.draftTime) phaseText = "Draft";
  if (pool.playTime) phaseText = "Tournament";
  
  // Create header container with improved styling
  const poolHeaderContainer = document.createElement("div");
  poolHeaderContainer.className = "golf-header-container";
  
  // Create top row with pool name and draft button
  const headerTop = document.createElement("div");
  headerTop.className = "golf-header-top";
  
  // Pool name with golf icon
  const poolNameDiv = document.createElement("div");
  poolNameDiv.className = "golf-pool-name";
  //poolNameDiv.innerHTML = `<i class="fas fa-golf-ball"></i> ${pool.name}`;
    poolNameDiv.innerHTML = `${pool.name}`;
  headerTop.appendChild(poolNameDiv);
  
  // START DRAFT button - when in idle phase and user is admin
  if (username.toLowerCase() === pool.adminUsername.toLowerCase() && pool.idleTime) {
    const startDraftBtn = document.createElement("button");
    startDraftBtn.className = "start-draft-button";
    startDraftBtn.innerHTML = 'START DRAFT';
    startDraftBtn.onclick = () => startGolfDraft(pool.name);
    headerTop.appendChild(startDraftBtn);
  }
  
  poolHeaderContainer.appendChild(headerTop);
  
  // Create bottom row with stats and last updated timestamp
  const headerBottom = document.createElement("div");
  headerBottom.className = "golf-header-bottom";
  
  // Phase indicator
  const phaseIndicator = document.createElement("div");
  phaseIndicator.className = "golf-phase-indicator";
  phaseIndicator.innerHTML = `
    <i class="fas fa-flag"></i>
    <span>Phase: ${phaseText}</span>
  `;
  
  // User count
  const userCountDiv = document.createElement("div");
  userCountDiv.className = "golf-user-count";
  userCountDiv.innerHTML = `
    <i class="fas fa-users"></i>
    <span>${pool.members.length} Players</span>
  `;
  
  headerBottom.appendChild(phaseIndicator);
  headerBottom.appendChild(userCountDiv);
  
  // Add last updated timestamp if it exists and only for Tournament phase
  if (pool.playTime && pool.lastGolfScoresUpdate) {
    const lastUpdateDiv = document.createElement("div");
    lastUpdateDiv.className = "golf-last-update";
    
    const updateTime = new Date(pool.lastGolfScoresUpdate);
    
    // Format date and time in a user-friendly way
    const options = { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    
    const formattedDateTime = updateTime.toLocaleString('en-US', options);
    
    lastUpdateDiv.innerHTML = `
      <i class="fas fa-sync-alt"></i>
      <span>Scores last updated: ${formattedDateTime}</span>
    `;
    
    headerBottom.appendChild(lastUpdateDiv);
  }
  
  poolHeaderContainer.appendChild(headerBottom);
  poolWrapper.appendChild(poolHeaderContainer);

  let golfDraftState = null; // Variable to hold draft state for this pool
  if (pool.draftTime) {
    console.log(`Pool ${pool.name} is in draft time, fetching state...`);
    golfDraftState = await fetchGolfDraftState(pool.name); // Fetch state if drafting
    if (!golfDraftState) {
      console.warn(`Could not fetch draft state for ${pool.name}, indicator will not be shown.`);
    }
  }

  // Create table header with improved styling
  const tableHeader = document.createElement("div");
  tableHeader.className = "golf-table-header";
  tableHeader.innerHTML = `
    <div class="golf-header-user">USER</div>
    <div class="golf-header-sum">SCORE</div>
    <div class="golf-header-picks">PICKS</div>
  `;
  
  // Create scrollable container
  const poolScrollableContainer = document.createElement("div");
  poolScrollableContainer.className = "pool-scrollable-container";
  
  // Create golf pool container with improved styling
  const poolContainer = document.createElement("div");
  poolContainer.className = "golf-pool-container";
  
  poolContainer.appendChild(tableHeader);
  
  // Process members and create rows
  // Since createGolfPlayerRow is now async, we need to handle this differently
  const playerRowPromises = pool.members.map(member => 
    createGolfPlayerRow(member, username, pool, phaseText, golfDraftState) // Pass draft state
  );
  
  // Wait for all player rows to be created
  const playerRows = await Promise.all(playerRowPromises);
  
  // Add all rows to the container
  playerRows.forEach(row => {
    poolContainer.appendChild(row);
  });
  
  poolScrollableContainer.appendChild(poolContainer);
  poolWrapper.appendChild(poolScrollableContainer);

  // Only update scores if the pool is in tournament phase
  if (pool.playTime && poolWrapper) {
    // Update golf scores for this pool
    await updateGolfScoresDisplay(poolWrapper);
  }

  orderedContainer.appendChild(poolWrapper);
  
  // Update pool actions list
  setTimeout(() => {
    updatePoolActionsList();
  }, 100);
}

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
    const isPlayoffTime = currentWeek >= 14 && currentWeek <= 17;
    
    // Check if user is in any survivor pools
    const hasSurvivorPool = pools.some(pool => pool.mode === 'survivor');
    
    // Show the survivor button if the user is in a survivor pool
    if (hasSurvivorPool && document.getElementById('survivorPicksButton')) {
      document.getElementById('survivorPicksButton').style.display = 'block';
    }
    
    // Check if user is in any golf pools
    const hasGolfPool = pools.some(pool => pool.mode === 'golf');
    
    // Show the golf button if the user is in a golf pool
    if (hasGolfPool) {
      displayGolfSelectionButton();
    }
    
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
      } else if (pool.mode === 'golf') {
        await displayGolfPoolContainer(pool);
      } else {
        // For classic pools, display them with playoff bracket if enabled and in playoff time
        const hasPlayoffBracket = pool.mode === 'classic' && pool.hasPlayoffs && isPlayoffTime;
        await displayNewPoolContainer(pool, hasPlayoffBracket, currentWeek);
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

async function fetchGolfDraftState(poolName) {
  try {
      const response = await fetch(`/api/getDraftState/${encodeURIComponent(poolName)}`);
      if (!response.ok) {
          console.error(`Failed to fetch draft state for ${poolName}: ${response.status}`);
          return null; // Return null on failure
      }
      const data = await response.json();
      console.log(`Draft state for ${poolName}:`, data); // Debug log
      return data; // Return the fetched data
  } catch (error) {
      console.error(`Error fetching draft state for ${poolName}:`, error);
      return null;
  }
}

// Function to fetch golf scores for a pool
async function fetchGolfScores(poolName) {
  try {
    const response = await fetch(`/api/getGolfScores/${encodeURIComponent(poolName)}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch golf scores: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.golfScores : null;
  } catch (error) {
    console.error('Error fetching golf scores:', error);
    return null;
  }
}

// Sort player rows by score
function sortPlayerRowsByScore(poolWrapper) {
  const container = poolWrapper.querySelector('.golf-pool-container');
  if (!container) return;
  
  // Get the header row
  const headerRow = container.querySelector('.golf-table-header');
  if (!headerRow) return;
  
  // Get all player rows
  const playerRows = Array.from(container.querySelectorAll('.golf-player-row'));
  
  // Sort by score (lowest first)
  playerRows.sort((a, b) => {
    const scoreA = getScoreFromRow(a);
    const scoreB = getScoreFromRow(b);
    return scoreA - scoreB;
  });
  
  // Clear container and re-add header and sorted rows
  container.innerHTML = '';
  container.appendChild(headerRow);
  
  playerRows.forEach(row => {
    container.appendChild(row);
  });
}


// Updated createGolfPlayerRow function with CUT handling
async function createGolfPlayerRow(member, currentUsername, pool, phase, golfDraftState = null) {
  const playerRow = document.createElement("div");
  playerRow.className = "golf-player-row";

  // Highlight current user
  if (member.username.toLowerCase() === currentUsername.toLowerCase()) {
      playerRow.classList.add("current-user-row");
  }

  // Create user section
  const userSection = document.createElement("div");
  userSection.className = "golf-player-user";

  // Profile Pic
  const profilePic = document.createElement("div");
  profilePic.className = "golf-profile-pic";
  profilePic.style.backgroundImage = `url('Default.png')`;

  fetchUserProfile(member.username.toLowerCase())
    .then(userProfile => {
      if (userProfile && userProfile.profilePicture) {
        profilePic.style.backgroundImage = `url('${userProfile.profilePicture}')`;
      }
    })
    .catch(err => {
      console.error(`Error fetching profile for ${member.username}:`, err);
    });

  // Username Span
  const usernameSpan = document.createElement("span");
  usernameSpan.className = "player-username";
  usernameSpan.textContent = member.username;

  userSection.appendChild(profilePic);
  userSection.appendChild(usernameSpan);

  // Add "On the Clock" Indicator if applicable
  if (phase === "Draft" && golfDraftState && golfDraftState.draftOrder && golfDraftState.draftOrder.length > 0) {
      let currentUserOnClock = 'Unknown';
      const numberOfDrafters = golfDraftState.draftOrder.length;
      const isEvenRound = golfDraftState.currentRound % 2 === 0;

      if (isEvenRound) {
          const reverseIndex = numberOfDrafters - 1 - golfDraftState.currentTurn;
          if (reverseIndex >= 0 && reverseIndex < numberOfDrafters) {
              currentUserOnClock = golfDraftState.draftOrder[reverseIndex];
          }
      } else {
          if (golfDraftState.currentTurn >= 0 && golfDraftState.currentTurn < numberOfDrafters) {
              currentUserOnClock = golfDraftState.draftOrder[golfDraftState.currentTurn];
          }
      }

      if (currentUserOnClock.toLowerCase() === member.username.toLowerCase()) {
          console.log(`Match! Adding clock icon for ${member.username}`);
          const clockIcon = document.createElement('i');
          clockIcon.className = 'fas fa-clock golf-on-the-clock';
          clockIcon.title = 'On the Clock';
          userSection.appendChild(clockIcon);
      }
  }

  // Add user section first
  playerRow.appendChild(userSection);

  // Create SCORE section - NOW SECOND
  const sumSection = document.createElement("div");
  sumSection.className = "golf-player-sum";
  sumSection.textContent = "-"; // Default
  playerRow.appendChild(sumSection);

  // Create picks section - NOW THIRD (Add loading indicator initially)
  const picksSection = document.createElement("div");
  picksSection.className = "golf-player-picks";
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "loading-picks";
  loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  picksSection.appendChild(loadingDiv);
  playerRow.appendChild(picksSection);

  // --- ASYNCHRONOUSLY Fetch and Populate Picks/Score ---
  if (phase !== "Joining") {
      try {
          const golfPicksData = await fetchGolfPicks(member.username, pool.name);

          // Clear loading indicator from picks section
          picksSection.innerHTML = '';

          if (golfPicksData.success && golfPicksData.picks && golfPicksData.picks.length > 0) {
              const picksContainer = document.createElement("div");
              picksContainer.className = "golf-picks-container";
              let totalScore = 0;
              let validScoresCount = 0; // Count golfers with valid scores

              // Sort picks: First by CUT status (non-cut first), then by score (lowest first)
              golfPicksData.picks.sort((a, b) => {
                  // Check if either golfer is cut
                  const aIsCut = a.status && (a.status.toLowerCase() === 'cut' || a.status.toLowerCase() === 'wd');
                  const bIsCut = b.status && (b.status.toLowerCase() === 'cut' || b.status.toLowerCase() === 'wd');
                  
                  // If cut status is different, sort by cut status (non-cut first)
                  if (aIsCut !== bIsCut) {
                      return aIsCut ? 1 : -1;
                  }
                  
                  // If both have same cut status, sort by score (lowest first)
                  const scoreA = typeof a.score === 'number' ? a.score : 999;
                  const scoreB = typeof b.score === 'number' ? b.score : 999;
                  return scoreA - scoreB;
              });

              golfPicksData.picks.forEach(pick => {
                  const pickElement = document.createElement("div");
                  pickElement.className = "golf-pick";

                  // Check for CUT status
                  const isCut = pick.status && (pick.status.toLowerCase() === 'cut' || pick.status.toLowerCase() === 'wd');
                  
                  // Add CUT class for styling
                  if (isCut) {
                      pickElement.classList.add('golf-pick-cut');
                  }

                  if (phase === "Draft") {
                      pickElement.innerHTML = `
                          <span class="golf-pick-round">R${pick.round || '?'}</span>
                          <span class="golf-pick-name">${pick.golferName}</span>
                      `;
                  } else if (phase === "Tournament") {
                       // Use score from fetched data if available, default to 0 otherwise
                       const score = typeof pick.score === 'number' ? pick.score : 0;
                       // Only include in total score calculation if it's a valid number and not cut
                       if (typeof pick.score === 'number' && !isCut) {
                          totalScore += score;
                          validScoresCount++;
                       }

                      // Use "E" for even par (score of 0)
                      const scoreDisplay = typeof pick.score !== 'number' ? 'E' : 
                                         (score === 0 ? 'E' : (score > 0 ? `+${score}` : score));
                      const scoreClass = typeof pick.score !== 'number' ? 'score-tbd' : 
                                       (score > 0 ? 'score-over' : (score < 0 ? 'score-under' : 'score-even'));

                      // Create the pick element HTML without CUT status inside
                      pickElement.innerHTML = `
                          <div class="golf-pick-header">
                              <span class="golf-pick-name">${pick.golferName}</span>
                              <span class="golf-pick-score ${scoreClass}">${scoreDisplay}</span>
                          </div>
                      `;
                  }
                  
                  picksContainer.appendChild(pickElement);
                  
                  // Add CUT status OUTSIDE the pick element if golfer is cut
                  if (isCut && phase === "Tournament") {
                      const cutIndicator = document.createElement('div');
                      cutIndicator.className = 'golf-cut-indicator-outside';
                      cutIndicator.textContent = 'CUT';
                      picksContainer.appendChild(cutIndicator);
                  }
              });
              
              picksSection.appendChild(picksContainer);

              // Update score section for Tournament phase using only golfers with scores (excluding cut players)
              if (phase === "Tournament" && validScoresCount > 0) {
                   // Calculate sum based on the best 4 scores from non-cut players
                   const nonCutScores = golfPicksData.picks
                      .filter(p => !(p.status && (p.status.toLowerCase() === 'cut' || p.status.toLowerCase() === 'wd')))
                      .map(p => typeof p.score === 'number' ? p.score : Infinity)
                      .filter(s => s !== Infinity)
                      .sort((a, b) => a - b);

                   const scoresToSum = nonCutScores.slice(0, 4); // Take the best (lowest) 4 scores
                   const finalTotalScore = scoresToSum.reduce((sum, score) => sum + score, 0);

                  // Use "E" for even par (score of 0)
                  const formattedScore = finalTotalScore === 0 ? 'E' : 
                                       (finalTotalScore > 0 ? `+${finalTotalScore}` : finalTotalScore);
                  const scoreClass = finalTotalScore > 0 ? 'score-over' : 
                                    (finalTotalScore < 0 ? 'score-under' : 'score-even');
                  sumSection.innerHTML = `<span class="${scoreClass}">${formattedScore}</span>`;
              } else if (phase === "Tournament") {
                  sumSection.textContent = "-"; // Show dash if no valid scores yet
              } else if (phase === "Draft") {
                   sumSection.textContent = "-"; // Show dash during draft
              }
          } else {
              // Handle case where picks array is empty or fetch failed but didn't throw error
              const noPicks = document.createElement("div");
              noPicks.className = phase === "Draft" ? "no-picks-yet" : "no-picks";
              noPicks.textContent = phase === "Draft" ? "No selections yet" : "No golfers selected";
              picksSection.appendChild(noPicks);
              sumSection.textContent = "-"; // Show dash if no picks
          }
      } catch (error) {
          console.error(`Error loading picks/score for ${member.username}:`, error);
          picksSection.innerHTML = '<div class="picks-error">Error</div>'; // Simple error in picks section
          sumSection.textContent = "ERR"; // Indicate error in score
      }
  } else {
      // If in Joining phase, clear loading and show waiting message
      picksSection.innerHTML = '';
      const waitingDiv = document.createElement("div");
      waitingDiv.className = "waiting-for-draft";
      waitingDiv.textContent = "Waiting for draft to begin";
      picksSection.appendChild(waitingDiv);
      sumSection.textContent = "-"; // Show dash during joining phase
  }

  return playerRow;
}
async function updateGolfScoresDisplay(poolWrapper) {
  const poolName = poolWrapper.getAttribute('data-pool-name');
  if (!poolName) {
    console.error('Pool name not found on wrapper element');
    return;
  }
  
  const golfScores = await fetchGolfScores(poolName);
  
  if (!golfScores) {
    console.warn(`No golf scores available for ${poolName}`);
    return;
  }
  
  console.log(`Updating display with golf scores for ${poolName}`, golfScores);
  
  // Update each player row
  golfScores.forEach(userScore => {
    const username = userScore.username;
    console.log(`User ${username} data:`, userScore);
    
    // Find the player row by username
    const playerRow = Array.from(poolWrapper.querySelectorAll('.golf-player-row')).find(row => {
      const usernameEl = row.querySelector('.player-username');
      return usernameEl && usernameEl.textContent.trim().toLowerCase() === username.toLowerCase();
    });
    
    if (!playerRow) {
      console.warn(`Player row not found for ${username}`);
      return;
    }
    
    // Update picks section
    const picksSection = playerRow.querySelector('.golf-player-picks');
    if (picksSection) {
      // Clear existing content
      picksSection.innerHTML = '';
      
      // Create container for golfer picks
      const picksContainer = document.createElement('div');
      picksContainer.className = 'golf-picks-container';
      
      // Sort golfers: First by CUT status (non-cut first), then by score (lowest first)
      const sortedGolfers = [...(userScore.golfers || [])].sort((a, b) => {
        // Check if either golfer is cut
        const aIsCut = a.status && (a.status.toLowerCase() === 'cut' || a.status.toLowerCase() === 'wd');
        const bIsCut = b.status && (b.status.toLowerCase() === 'cut' || b.status.toLowerCase() === 'wd');
        
        // If cut status is different, sort by cut status (non-cut first)
        if (aIsCut !== bIsCut) {
          return aIsCut ? 1 : -1;
        }
        
        // If both have same cut status, sort by score (lowest first)
        const scoreA = typeof a.score === 'number' ? a.score : 999;
        const scoreB = typeof b.score === 'number' ? b.score : 999;
        return scoreA - scoreB;
      });
      
      // Add each golfer with their score
      sortedGolfers.forEach(golfer => {
        const pickElement = document.createElement('div');
        pickElement.className = 'golf-pick';
        
        // IMPORTANT FIX: Ensure we have a name before proceeding
        const golferName = golfer.golferName || golfer.name || "Unknown Golfer";
        
        // CRITICAL FIX: Always ensure score is a number, default to 0
        const score = (typeof golfer.score === 'number') ? golfer.score : 0;
        
        // CRITICAL FIX: Always generate a proper display string, don't use the API's scoreDisplay
        // This ensures "E" for even par instead of "undefined"
        const scoreDisplay = score === 0 ? "E" : (score > 0 ? `+${score}` : `${score}`);
        
        const scoreClass = score > 0 ? 'score-over' : (score < 0 ? 'score-under' : 'score-even');
        
        // Check if golfer is cut
        const isCut = golfer.status && (golfer.status.toLowerCase() === 'cut' || golfer.status.toLowerCase() === 'wd');
        
        // Add CUT class for styling
        if (isCut) {
          pickElement.classList.add('golf-pick-cut');
        }
        
        // Debug to verify our variables are correct
        console.log(`Rendering ${golferName}: score=${score}, display=${scoreDisplay}, class=${scoreClass}, cut=${isCut}`);
        
        // Create the HTML for the pick
        pickElement.innerHTML = `
          <span class="golf-pick-name">${golferName}</span>
          <span class="golf-pick-score ${scoreClass}">${scoreDisplay}</span>
        `;
        
        picksContainer.appendChild(pickElement);
        
     
      });
      
      picksSection.appendChild(picksContainer);
    }
    
    // Update total score section (including ALL golfers in calculation)
    const sumSection = playerRow.querySelector('.golf-player-sum');
    if (sumSection) {
      // Calculate total from ALL golfers (including cut players) - sum ALL scores
      const totalScore = (userScore.golfers || [])
        .map(g => typeof g.score === 'number' ? g.score : 0)
        .reduce((sum, score) => sum + score, 0);
      
      const scoreClass = totalScore > 0 ? 'score-over' : 
                        (totalScore < 0 ? 'score-under' : 'score-even');
      
      // CRITICAL FIX: Always generate display value, don't rely on totalScoreDisplay
      const displayValue = totalScore === 0 ? "E" : 
                          (totalScore > 0 ? `+${totalScore}` : `${totalScore}`);
      
      console.log(`Setting display value for ${username}: ${displayValue} (sum of ALL ${userScore.golfers?.length || 0} golfers)`);
      
      sumSection.innerHTML = `<span class="${scoreClass}">${displayValue}</span>`;
    }
  });
  
  // Sort player rows by score
  sortPlayerRowsByScore(poolWrapper);
}
// 5. getScoreFromRow helper function - should handle "E" scores
function getScoreFromRow(row) {
  const sumSection = row.querySelector('.golf-player-sum');
  if (!sumSection) return 0;
  
  const scoreText = sumSection.textContent.trim();
  
  if (scoreText === 'E' || scoreText === '-') return 0;
  if (scoreText === 'ERR') return 9999; // Put error rows at the bottom
  if (scoreText.startsWith('+')) return parseFloat(scoreText.substring(1));
  return parseFloat(scoreText);
}