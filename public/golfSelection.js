// Core variables
const storedUsername = localStorage.getItem('username')?.toLowerCase();
let selectedPool = null;
let golferOptions = [];
let selectedGolfer = null;
let userGolfPicks = [];
let allGolfPicks = {}; // Stores picks from all users in the pool
let currentDraftRound = 1;
let draftOrder = [];
let currentUserTurn = 0;
let currentPoolState = {
    idleTime: false,
    draftTime: false,
    playTime: false
};
let draftTimer = null;
let timerSeconds = 60;
let isTimerRunning = false;


// DOM elements
const confirmationModal = document.getElementById('confirmationModal');
const selectedGolferNameSpan = document.getElementById('selectedGolferName');
const selectedRoundSpan = document.getElementById('selectedRound');
const confirmSelectionBtn = document.getElementById('confirmSelection');
const cancelSelectionBtn = document.getElementById('cancelSelection');
const currentRoundSpan = document.getElementById('currentRound');
const currentUserNameSpan = document.getElementById('currentUserName');
const poolSelector = document.getElementById('poolSelector');
const yourTeamContainer = document.getElementById('yourTeamContainer');
const pickContainer = document.getElementById('pickContainer');
// Add these DOM elements
const timerProgressBar = document.getElementById('timerProgress');
const timerSecondsDisplay = document.getElementById('timerSeconds');

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    if (storedUsername) {
        try {
            // Initialize the page
            await initializeGolfSelection();
        } catch (error) {
            console.error('Error during initialization:', error);
            showErrorMessage('Failed to load golf selection page. Please try again later.');
        }
    } else {
        window.location.href = '/login.html';
    }
});

// Event listeners for the confirmation modal
confirmSelectionBtn.addEventListener('click', handleGolferConfirmation);
cancelSelectionBtn.addEventListener('click', closeConfirmationModal);

// Pool selector change handler
poolSelector.addEventListener('change', async (e) => {
    selectedPool = e.target.value;
    await loadPoolState();
    await fetchGolfers();
    await fetchUserPicks();
    await fetchAllPoolPicks();
    await fetchDraftState();
    renderPicksContainer();
    updateDraftStatus();
    updateYourTeamDisplay();
});

/**
 * Initialize the golf selection page
 */
async function initializeGolfSelection() {
    // Show loading state
    showLoadingState();
    
    // Populate pool selector
    await populateGolfPoolSelector();
    
    // Load initial state for the selected pool
    if (selectedPool) {
        await loadPoolState();
        
        // Add this line to fetch the draft state FIRST
        await fetchDraftState();
        
        await fetchGolfers();
        await fetchUserPicks();
        await fetchAllPoolPicks();
        renderPicksContainer();
        updateDraftStatus();
        updateYourTeamDisplay();
        
        // Start timer if in draft mode AFTER getting current time from server
        if (currentPoolState.draftTime && !isTimerRunning) {
            startDraftTimer();
        }
    }
    
    // Hide loading state
    hideLoadingState();
    
    // Start polling for draft state updates
    startDraftStatePolling();
}
/**
 * Show loading state
 */
function showLoadingState() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingState';
    loadingDiv.className = 'status-message';
    loadingDiv.innerHTML = `
        <h2>Loading Draft</h2>
        <p>Please wait while we set up your golf draft...</p>
    `;
    
    document.querySelector('.container').appendChild(loadingDiv);
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const loadingDiv = document.getElementById('loadingState');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

/**
 * Populate the pool selector with golf mode pools
 */
async function populateGolfPoolSelector() {
    try {
        // Fetch all pools for the user
        const response = await fetch(`/pools/userPools/${encodeURIComponent(storedUsername)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const pools = await response.json();
        const golfPools = pools.filter(pool => pool.mode === 'golf');
        
        poolSelector.innerHTML = '';
        
        if (golfPools.length === 0) {
            poolSelector.innerHTML = '<option value="none">Not in any golf pools</option>';
            return;
        }
        
        golfPools.forEach(pool => {
            const option = document.createElement('option');
            option.value = pool.name;
            option.textContent = pool.name;
            poolSelector.appendChild(option);
        });
        
        // Select the first pool by default
        selectedPool = golfPools[0].name;
        poolSelector.value = selectedPool;
        
    } catch (error) {
        console.error('Error fetching pools:', error);
        poolSelector.innerHTML = '<option value="error">Error loading pools</option>';
        showErrorMessage('Failed to load golf pools. Please refresh the page and try again.');
    }
}

/**
 * Load the current state of the selected pool (IdleTime, DraftTime, PlayTime)
 */
async function loadPoolState() {
    try {
        const response = await fetch(`/api/getPoolState/${selectedPool}`);
        if (!response.ok) {
            throw new Error('Failed to fetch pool state');
        }
        
        const state = await response.json();
        currentPoolState = {
            idleTime: state.idleTime || false,
            draftTime: state.draftTime || false,
            playTime: state.playTime || false
        };
        
        // Update UI based on pool state
        updateUIForPoolState();
        
    } catch (error) {
        console.error('Error loading pool state:', error);
        showErrorMessage('Failed to load pool state. Please try again.');
    }
}

/**
 * Update UI elements based on the current pool state
 */
function updateUIForPoolState() {
    // Clear any existing status messages
    clearStatusMessages();
    
    // Update draft status visibility
    const draftStatusElement = document.querySelector('.draft-status');
    const picksContainer = document.getElementById('pickContainer');
    
    if (currentPoolState.idleTime) {
        // Pool is in IdleTime - waiting for draft to start
        const idleMessage = document.createElement('div');
        idleMessage.className = 'status-message idle-message';
        idleMessage.innerHTML = `
            <h2>Waiting for Draft to Start</h2>
            <p>The admin will start the draft soon. Please check back later or wait for the draft to begin.</p>
        `;
        
        // Insert the message BEFORE the picks container instead of inside it
        if (picksContainer && picksContainer.parentNode) {
            picksContainer.parentNode.insertBefore(idleMessage, picksContainer);
        } else {
            // Fallback to the old behavior if picks container isn't found
            document.querySelector('.container').appendChild(idleMessage);
        }
        
        draftStatusElement.style.display = 'none';
    }
    else if (currentPoolState.draftTime) {
        // Pool is in DraftTime - active drafting
        draftStatusElement.style.display = 'flex';
    }
    else if (currentPoolState.playTime) {
        // Pool is in PlayTime - draft is complete, tournament has started
        const playMessage = document.createElement('div');
        playMessage.className = 'status-message play-message';
        playMessage.innerHTML = `
            <h2>Draft Complete</h2>
            <p>The tournament has started. View your team and track scores on the homepage.</p>
        `;
        
        // Insert the play message BEFORE the picks container too
        if (picksContainer && picksContainer.parentNode) {
            picksContainer.parentNode.insertBefore(playMessage, picksContainer);
        } else {
            document.querySelector('.container').appendChild(playMessage);
        }
        
        draftStatusElement.style.display = 'none';
    }
}

/**
 * Clear any status messages currently displayed
 */
function clearStatusMessages() {
    const statusMessages = document.querySelectorAll('.status-message');
    statusMessages.forEach(message => message.remove());
}
/**
 * Fetch available golfers from the database
 */
async function fetchGolfers() {
    try {
        const response = await fetch('/api/getTournamentGolfers');
        if (!response.ok) {
            throw new Error('Failed to fetch golfers');
        }
        
        golferOptions = await response.json();
        
    } catch (error) {
        console.error('Error fetching golfers:', error);
        showErrorMessage('Failed to load golfers. Please try again.');
    }
}

/**
 * Fetch the user's current golf picks
 */
async function fetchUserPicks() {
    try {
        const response = await fetch(`/api/getUserGolfPicks/${storedUsername}/${selectedPool}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user golf picks');
        }
        
        const data = await response.json();
        userGolfPicks = data.picks || [];
        
    } catch (error) {
        console.error('Error fetching user golf picks:', error);
        userGolfPicks = [];
    }
}

/**
 * Fetch all users' golf picks for the current pool
 */
async function fetchAllPoolPicks() {
    try {
        const response = await fetch(`/api/getAllGolfPicks/${selectedPool}`);
        if (!response.ok) {
            throw new Error('Failed to fetch all golf picks');
        }
        
        const data = await response.json();
        allGolfPicks = data.picks || {};
        
    } catch (error) {
        console.error('Error fetching all golf picks:', error);
        allGolfPicks = {};
    }
}

async function fetchDraftState() {
    try {
        const response = await fetch(`/api/getDraftState/${selectedPool}`);
        if (!response.ok) {
            throw new Error('Failed to fetch draft state');
        }
        
        const data = await response.json();
        
        currentDraftRound = data.currentRound || 1;
        draftOrder = data.draftOrder || [];
        currentUserTurn = data.currentTurn || 0;
        
        // Update timer based on server time - use the timeRemainingSeconds directly
        if (data.timeRemainingSeconds !== undefined) {
            timerSeconds = data.timeRemainingSeconds;
            updateTimerDisplay();
            
            // Add warning classes based on time remaining
            const timerContainer = document.querySelector('.timer-container');
            if (timerContainer) {
                timerContainer.classList.remove('timer-warning', 'timer-danger');
                
                if (timerSeconds <= 10) {
                    timerContainer.classList.add('timer-danger');
                } else if (timerSeconds <= 20) {
                    timerContainer.classList.add('timer-warning');
                }
            }
        }
        
    } catch (error) {
        console.error('Error fetching draft state:', error);
        // Set defaults
        currentDraftRound = 1;
        draftOrder = [];
        currentUserTurn = 0;
    }
}

/**
 * Render the golfer selection container
 */
function renderPicksContainer() {
    // Clear the current container
    pickContainer.innerHTML = '';

    // If there are no golfers to display
    if (!golferOptions || golferOptions.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No golfers available for selection';
        pickContainer.appendChild(emptyMessage);
        return;
    }

    // --- Debugging the state right before turn calculation ---
    console.log(`[DEBUG renderPicksContainer] Running. Round: ${currentDraftRound}, Turn Index: ${currentUserTurn}, Pool State:`, currentPoolState);
    console.log(`[DEBUG renderPicksContainer] Draft Order:`, JSON.stringify(draftOrder)); // Log draft order
    console.log(`[DEBUG renderPicksContainer] Stored Username: '${storedUsername}'`);     // Log username

    // --- Determine who is picking ---
    let currentUserForTurn = 'Unknown';
    const numberOfDrafters = draftOrder.length;
    let isUserTurn = false; // Default to false

    if (draftOrder && numberOfDrafters > 0 && currentPoolState.draftTime) {
        const isEvenRound = currentDraftRound % 2 === 0;
        console.log(`[DEBUG renderPicksContainer] Is Even Round?: ${isEvenRound}`); // Debug

        if (isEvenRound) {
            // Even round (snake)
            const reverseIndex = numberOfDrafters - 1 - currentUserTurn;
            console.log(`[DEBUG renderPicksContainer] Even Round - Reverse Index: ${reverseIndex}`); // Debug
            if (reverseIndex >= 0 && reverseIndex < numberOfDrafters) {
                currentUserForTurn = draftOrder[reverseIndex];
            } else {
                 console.log(`[DEBUG renderPicksContainer] Calculated Reverse Index ${reverseIndex} is out of bounds for draftOrder length ${numberOfDrafters}`);
            }
        } else {
            // Odd round (normal)
             console.log(`[DEBUG renderPicksContainer] Odd Round - Turn Index: ${currentUserTurn}`); // Debug
             if (currentUserTurn >= 0 && currentUserTurn < numberOfDrafters) {
                currentUserForTurn = draftOrder[currentUserTurn];
             } else {
                  console.log(`[DEBUG renderPicksContainer] Turn Index ${currentUserTurn} is out of bounds for draftOrder length ${numberOfDrafters}`);
             }
        }
        console.log(`[DEBUG renderPicksContainer] Calculated User For Turn: '${currentUserForTurn}'`); // Debug
        // Perform the comparison
        isUserTurn = currentUserForTurn === storedUsername;
        console.log(`[DEBUG renderPicksContainer] Comparison Result: Is User Turn? ${isUserTurn} (Comparing '${currentUserForTurn}' vs '${storedUsername}')`); // Debug the final result
    } else {
         console.log(`[DEBUG renderPicksContainer] Turn calculation skipped. DraftTime: ${currentPoolState.draftTime}, Drafters: ${numberOfDrafters}`); // Debug why skipped
    }
    // --- End of turn determination ---


    // Update turn indicator (can be redundant, but helps confirm)
    const turnIndicator = document.querySelector('.turn-indicator');
     if (turnIndicator) {
         if (isUserTurn && currentPoolState.draftTime) { // Make sure draft is active for highlight
            turnIndicator.classList.add('your-turn');
        } else {
            turnIndicator.classList.remove('your-turn');
        }
     }

    // Create the golfers grid
    const golfersContainer = document.createElement('div');
    golfersContainer.className = 'golfers-container';

    // Render each golfer
    golferOptions.forEach(golfer => {
        const card = document.createElement('div');
        card.className = 'golfer-card';
        card.dataset.name = golfer.name;

        // Check if golfer is already picked by any user
        let isPicked = false;
        let pickedBy = '';

        Object.entries(allGolfPicks).forEach(([username, picks]) => {
            // Ensure picks is an array before calling find
            if (Array.isArray(picks)) {
                const foundPick = picks.find(pick => pick.golferName === golfer.name);
                if (foundPick) {
                    isPicked = true;
                    pickedBy = username === storedUsername ? 'You' : username;
                }
            } else {
                 // Log if a user's picks aren't an array, might indicate data issue
                 // console.warn(`[DEBUG renderPicksContainer] Picks for user '${username}' is not an array:`, picks);
            }
        });

        // Set appropriate classes based on selection state
        if (isPicked) {
            card.classList.add('picked');
        } else if (currentPoolState.draftTime && !isUserTurn) { // Condition for disabling
            card.classList.add('disabled');
             console.log(`[DEBUG renderPicksContainer] Golfer '${golfer.name}': Adding 'disabled' class because isUserTurn is ${isUserTurn}`); // Debug disabling
        } else if (selectedGolfer && selectedGolfer.name === golfer.name) {
            card.classList.add('selected');
        }

        // Disable interaction if not in draft mode (view-only state)
        if (!currentPoolState.draftTime) {
            card.classList.add('view-only');
        }

        // Create card content
        card.innerHTML = `
            <div class="golfer-name">${golfer.name}</div>
            <div class="golfer-odds">Odds: ${golfer.oddsDisplay || golfer.odds}</div>
            ${isPicked ? `<div class="picked-by">Picked by: ${pickedBy}</div>` : ''}
        `;

        // Add click event handler only in draft mode, if not picked, AND if it's the user's turn
        if (currentPoolState.draftTime && !isPicked && isUserTurn) { // Condition for adding listener
            card.addEventListener('click', () => handleGolferSelection(golfer));
             console.log(`[DEBUG renderPicksContainer] Golfer '${golfer.name}': Adding click listener because isUserTurn is ${isUserTurn}`); // Debug adding listener
        } else {
             // Optional: Log why listener wasn't added for non-picked golfers during draft time
             if(currentPoolState.draftTime && !isPicked && !isUserTurn) {
                 console.log(`[DEBUG renderPicksContainer] Golfer '${golfer.name}': NOT adding listener. DraftTime: ${currentPoolState.draftTime}, isPicked: ${isPicked}, isUserTurn: ${isUserTurn}`);
             }
        }

        golfersContainer.appendChild(card);
    });

    pickContainer.appendChild(golfersContainer);
}
/**
 * Update the draft status indicators
 */
/**
 * Update the draft status indicators
 */
function updateDraftStatus() {
    currentRoundSpan.textContent = currentDraftRound;

    let currentUser = 'Unknown';
    const numberOfDrafters = draftOrder.length; // Get the number of users

    if (draftOrder && numberOfDrafters > 0) {
        const isEvenRound = currentDraftRound % 2 === 0;

        if (isEvenRound) {
            // Even round (snake): Calculate the index from the end of the draftOrder
            const reverseIndex = numberOfDrafters - 1 - currentUserTurn;
            // Ensure the calculated index is valid
            if (reverseIndex >= 0 && reverseIndex < numberOfDrafters) {
                currentUser = draftOrder[reverseIndex];
            }
        } else {
            // Odd round (normal): Use the currentUserTurn directly
            // Ensure the index is valid
             if (currentUserTurn >= 0 && currentUserTurn < numberOfDrafters) {
                currentUser = draftOrder[currentUserTurn];
             }
        }
    }

    // Display the calculated user, checking if it's the logged-in user
    currentUserNameSpan.textContent = currentUser;

    // Highlight if it's the current user's turn based on the correct calculation
    const isMyTurn = currentUser === storedUsername;
    const turnIndicator = document.querySelector('.turn-indicator'); // Make sure this selector is correct

    // Add a check to ensure the element exists before modifying classList
    if (turnIndicator) {
        if (isMyTurn && currentPoolState.draftTime) { // Also check if drafting is active
           turnIndicator.classList.add('your-turn');
        } else {
            turnIndicator.classList.remove('your-turn');
        }
    } else {
        console.warn('Could not find element with class .turn-indicator');
    }
}

/**
 * Handle golfer selection
 */
function handleGolferSelection(golfer) {
    // Store the selected golfer
    selectedGolfer = golfer;
    
    // Update the confirmation modal
    selectedGolferNameSpan.textContent = golfer.name;
    selectedRoundSpan.textContent = currentDraftRound;
    
    // Show the confirmation modal
    confirmationModal.style.display = 'flex';
}

/**
 * Handle confirmation of golfer selection
 */
/**
 * Handle confirmation of golfer selection
 */
async function handleGolferConfirmation() {
    // Close the modal
    closeConfirmationModal();

    // Show loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'submittingPick';
    loadingDiv.className = 'status-message';
    loadingDiv.innerHTML = `
        <h2>Submitting Your Pick</h2>
        <p>Please wait while we process your selection...</p>
    `;
    
    const controlsContainer = document.querySelector('.controls-container');
    if (controlsContainer) {
        controlsContainer.appendChild(loadingDiv);
    } else {
        document.body.appendChild(loadingDiv);
    }

    // Validate turn
    let currentUserForTurn = 'Unknown';
    const numberOfDrafters = draftOrder.length;
    let isValidTurn = false;

    if (draftOrder && numberOfDrafters > 0 && currentPoolState.draftTime) {
        const isEvenRound = currentDraftRound % 2 === 0;
        if (isEvenRound) {
            // Even round (snake)
            const reverseIndex = numberOfDrafters - 1 - currentUserTurn;
            if (reverseIndex >= 0 && reverseIndex < numberOfDrafters) {
                currentUserForTurn = draftOrder[reverseIndex];
            }
        } else {
            // Odd round (normal)
            if (currentUserTurn >= 0 && currentUserTurn < numberOfDrafters) {
                currentUserForTurn = draftOrder[currentUserTurn];
            }
        }
        // Final check: Does the calculated current user match the logged-in user?
        isValidTurn = currentUserForTurn.toLowerCase() === storedUsername.toLowerCase();
    }

    // Check the validation result
    if (!isValidTurn) {
        // Remove the loading message before showing the error
        const submittingDiv = document.getElementById('submittingPick');
        if (submittingDiv) submittingDiv.remove();

        showErrorMessage("It's no longer your turn. Please wait for your next turn.");
        console.warn(`Validation Failed in handleGolferConfirmation: Expected turn for ${currentUserForTurn}, but current user is ${storedUsername}. Round: ${currentDraftRound}, Turn Index: ${currentUserTurn}`);
        return;
    }

    try {
        // Ensure a golfer is actually selected before proceeding
        if (!selectedGolfer) {
            throw new Error("No golfer selected to confirm.");
        }

        // Stop the timer
        resetDraftTimer();

        // Prepare the pick data
        const pickData = {
            golferName: selectedGolfer.name,
            round: currentDraftRound,
            odds: selectedGolfer.odds,
            timestamp: new Date().toISOString()
        };

        // Submit the pick
        const response = await fetch(`/api/submitGolfPick/${storedUsername}/${selectedPool}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pickData)
        });

        // Remove the loading message
        const submittingDiv = document.getElementById('submittingPick');
        if (submittingDiv) submittingDiv.remove();

        if (!response.ok) {
            // Try to get a more specific error message from the server response
            let errorMsg = `Failed to submit pick (${response.status})`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch (e) {
                // Ignore if response is not JSON
            }
            console.error("Server error response:", errorMsg);
            throw new Error(errorMsg);
        }

        // Pick submitted successfully
        // Add the pick to the local user's picks array
        userGolfPicks.push(pickData);

        // Clear the selected golfer state
        selectedGolfer = null;

        // Show success message
        showSuccessMessage(`Successfully selected ${pickData.golferName}`);

        // Update the 'Your Team' display immediately
        updateYourTeamDisplay();

        // Fetch updated state
        await fetchDraftState();
        await fetchAllPoolPicks();
        renderPicksContainer();
        updateDraftStatus();
        
        // Start timer for next user
        if (currentPoolState.draftTime) {
            startDraftTimer();
        }

    } catch (error) {
        console.error('Error during pick submission process:', error);

        // Ensure loading message is removed on error
        const submittingDiv = document.getElementById('submittingPick');
        if (submittingDiv) submittingDiv.remove();

        // Show a user-friendly error message
        showErrorMessage(error.message || 'An error occurred while submitting your pick. Please try again.');

        // Clear selected golfer state
        selectedGolfer = null;
        
        // Restart timer if still in draft mode
        if (currentPoolState.draftTime) {
            startDraftTimer();
        }
    }
}
/**
 * Close the confirmation modal
 */
function closeConfirmationModal() {
    confirmationModal.style.display = 'none';
}

/**
 * Update the display of the user's team
 */
function updateYourTeamDisplay() {
    yourTeamContainer.innerHTML = '';
    
    if (userGolfPicks.length === 0) {
        yourTeamContainer.innerHTML = '<div class="empty-message">No golfers selected yet</div>';
        return;
    }
    
    // Sort picks by round
    const sortedPicks = [...userGolfPicks].sort((a, b) => a.round - b.round);
    
    sortedPicks.forEach(pick => {
        const golferElement = document.createElement('div');
        golferElement.className = 'selected-golfer';
        
        // Find the golfer's odds for display
        const golferInfo = golferOptions.find(g => g.name === pick.golferName) || { odds: pick.odds };
        
        golferElement.innerHTML = `
            <div class="selected-golfer-name">${pick.golferName}</div>
            <div class="selected-golfer-round">Round ${pick.round}</div>
            <div class="selected-golfer-odds">Odds: ${golferInfo.oddsDisplay || golferInfo.odds}</div>
        `;
        
        yourTeamContainer.appendChild(golferElement);
    });
}
/*
function startDraftStatePolling() {
    // Poll every 5 seconds
    setInterval(async () => {
        if (selectedPool) {
            try {
                // First check if the pool state changed
                const prevState = {...currentPoolState};
                
                // Fetch updated pool state
                const stateResponse = await fetch(`/api/getPoolState/${selectedPool}`);
                if (stateResponse.ok) {
                    const state = await stateResponse.json();
                    const newState = {
                        idleTime: state.idleTime || false,
                        draftTime: state.draftTime || false,
                        playTime: state.playTime || false
                    };
                    
                    // Check if we transitioned into draft mode
                    const enteringDraftMode = !prevState.draftTime && newState.draftTime;
                    
                    // Only update the UI if the pool state changed
                    const stateChanged = 
                        prevState.idleTime !== newState.idleTime ||
                        prevState.draftTime !== newState.draftTime ||
                        prevState.playTime !== newState.playTime;
                    
                    if (stateChanged) {
                        console.log('Pool state changed, updating UI');
                        currentPoolState = newState;
                        updateUIForPoolState();
                    }
                    
                    // If in draft mode, check for changes to draft state
                    if (currentPoolState.draftTime) {
                        const prevDraftRound = currentDraftRound;
                        const prevUserTurn = currentUserTurn;
                        
                        await fetchDraftState();
                        
                        // If we just entered draft mode or timer isn't running, start it
                        if ((enteringDraftMode || !isTimerRunning) && currentPoolState.draftTime) {
                            startDraftTimer();
                        }
                        
                        // Only update UI if draft round or turn changed
                        if (prevDraftRound !== currentDraftRound || 
                            prevUserTurn !== currentUserTurn) {
                            
                            await fetchAllPoolPicks();
                            renderPicksContainer();
                            updateDraftStatus();
                            
                            // If it just became user's turn, notify them
                            let currentUser = 'Unknown';
                            const numberOfDrafters = draftOrder.length;
                            
                            if (draftOrder && numberOfDrafters > 0) {
                                const isEvenRound = currentDraftRound % 2 === 0;
                                
                                if (isEvenRound) {
                                    // Even round (snake)
                                    const reverseIndex = numberOfDrafters - 1 - currentUserTurn;
                                    if (reverseIndex >= 0 && reverseIndex < numberOfDrafters) {
                                        currentUser = draftOrder[reverseIndex];
                                    }
                                } else {
                                    // Odd round (normal)
                                    if (currentUserTurn >= 0 && currentUserTurn < numberOfDrafters) {
                                        currentUser = draftOrder[currentUserTurn];
                                    }
                                }
                            }
                            
                            // Check if it just became the user's turn
                            if (currentUser.toLowerCase() === storedUsername.toLowerCase() && 
                                (prevUserTurn !== currentUserTurn || prevDraftRound !== currentDraftRound)) {
                                showSuccessMessage("It's your turn to pick!");
                            }
                        }
                    } else if (prevState.draftTime && !currentPoolState.draftTime) {
                        // If we just left draft mode, stop the timer
                        resetDraftTimer();
                    }
                }
            } catch (error) {
                console.error('Error during polling:', error);
            }
        }
    }, 5000);
}*/

function startDraftStatePolling() {
    // Keep track of previous pool state to avoid unnecessary UI updates
    let prevPoolState = {...currentPoolState};
    
    // Poll every 5 seconds
    setInterval(async () => {
        if (selectedPool) {
            try {
                // First check if the pool state changed
                const prevState = {...currentPoolState};
                
                // Fetch updated pool state
                const stateResponse = await fetch(`/api/getPoolState/${selectedPool}`);
                if (stateResponse.ok) {
                    const state = await stateResponse.json();
                    const newState = {
                        idleTime: state.idleTime || false,
                        draftTime: state.draftTime || false,
                        playTime: state.playTime || false
                    };
                    
                    // Check if we're transitioning FROM idle TO draft mode
                    const draftJustStarted = prevState.idleTime && newState.draftTime;
                    
                    // Only update the UI if the pool state changed
                    const stateChanged = 
                        prevState.idleTime !== newState.idleTime ||
                        prevState.draftTime !== newState.draftTime ||
                        prevState.playTime !== newState.playTime;
                    
                    if (stateChanged) {
                        console.log('Pool state changed, updating UI');
                        currentPoolState = newState;
                        
                        // If draft just started, refresh the entire page
                        if (draftJustStarted) {
                            console.log('Draft just started! Refreshing page...');
                            // Show a quick notification before refreshing
                            showSuccessMessage('Draft is starting! Page will refresh...');
                            // Give a slight delay so the message is visible
                            setTimeout(() => {
                                window.location.reload();
                            }, 500);
                            return; // Exit early since we're refreshing
                        }
                        
                        updateUIForPoolState();
                    }
                    
                    // If in draft mode, check for changes to draft state
                    if (currentPoolState.draftTime) {
                        const prevDraftRound = currentDraftRound;
                        const prevUserTurn = currentUserTurn;
                        
                        await fetchDraftState();
                        
                        // If we just entered draft mode or timer isn't running, start it
                        if ((draftJustStarted || !isTimerRunning) && currentPoolState.draftTime) {
                            startDraftTimer();
                        }
                        
                        // Only update UI if draft round or turn changed
                        if (prevDraftRound !== currentDraftRound || 
                            prevUserTurn !== currentUserTurn) {
                            
                            await fetchAllPoolPicks();
                            renderPicksContainer();
                            updateDraftStatus();
                            
                            // If it just became user's turn, notify them
                            let currentUser = 'Unknown';
                            const numberOfDrafters = draftOrder.length;
                            
                            if (draftOrder && numberOfDrafters > 0) {
                                const isEvenRound = currentDraftRound % 2 === 0;
                                
                                if (isEvenRound) {
                                    // Even round (snake)
                                    const reverseIndex = numberOfDrafters - 1 - currentUserTurn;
                                    if (reverseIndex >= 0 && reverseIndex < numberOfDrafters) {
                                        currentUser = draftOrder[reverseIndex];
                                    }
                                } else {
                                    // Odd round (normal)
                                    if (currentUserTurn >= 0 && currentUserTurn < numberOfDrafters) {
                                        currentUser = draftOrder[currentUserTurn];
                                    }
                                }
                            }
                            
                            // Check if it just became the user's turn
                            if (currentUser.toLowerCase() === storedUsername.toLowerCase() && 
                                (prevUserTurn !== currentUserTurn || prevDraftRound !== currentDraftRound)) {
                                showSuccessMessage("It's your turn to pick!");
                            }
                        }
                    } else if (prevState.draftTime && !currentPoolState.draftTime) {
                        // If we just left draft mode, stop the timer
                        resetDraftTimer();
                    }
                }
            } catch (error) {
                console.error('Error during polling:', error);
            }
        }
    }, 5000);
}
/**
 * Show error message to the user
 */
/**
 * Show error message to the user
 */
function showErrorMessage(message) {
    // Create error toast
    const errorToast = document.createElement('div');
    errorToast.className = 'error-toast';
    errorToast.textContent = message;
    
    // Add to body
    document.body.appendChild(errorToast);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorToast.classList.add('fade-out');
        setTimeout(() => {
            errorToast.remove();
        }, 500); // Match the animation duration
    }, 5000);
}

/**
 * Show success message to the user
 */
function showSuccessMessage(message) {
    // Create success toast (reusing error toast styles with modifications)
    const successToast = document.createElement('div');
    successToast.className = 'error-toast'; // Reuse the same class for animation
    successToast.style.background = 'rgba(30, 150, 60, 0.9)'; // Override with green
    successToast.textContent = message;
    
    // Add to body
    document.body.appendChild(successToast);
    
    // Remove after 5 seconds
    setTimeout(() => {
        successToast.classList.add('fade-out');
        setTimeout(() => {
            successToast.remove();
        }, 500); // Match the animation duration
    }, 5000);
}
/**
 * Update UI elements based on the current pool state
 */
function updateUIForPoolState() {
    // Clear any existing status messages
    clearStatusMessages();
    
    // Update draft status visibility
    const draftStatusElement = document.querySelector('.draft-status');
    
    // Important: Find the right place to insert the message
    // We want it between the pool selector and the main container
    const poolSelectorContainer = document.querySelector('.pool-selector-container');
    const mainContainer = document.querySelector('.container');
    
    if (currentPoolState.idleTime) {
        // Pool is in IdleTime - waiting for draft to start
        const idleMessage = document.createElement('div');
        idleMessage.className = 'status-message idle-message';
        idleMessage.innerHTML = `
            <h2>Waiting for Draft to Start</h2>
            <p>The admin will start the draft soon. Please check back later or wait for the draft to begin.</p>
        `;
        
        // Insert the message after the pool selector but before the main container
        if (poolSelectorContainer && poolSelectorContainer.parentNode) {
            // Find the controls container (parent of pool selector)
            const controlsContainer = poolSelectorContainer.closest('.controls-container');
            if (controlsContainer) {
                // Append to the controls container - this will put it after the pool selector
                // but before the main container
                controlsContainer.appendChild(idleMessage);
            } else {
                // Fallback - insert before the main container
                document.body.insertBefore(idleMessage, mainContainer);
            }
        } else {
            // Last resort fallback
            document.body.appendChild(idleMessage);
        }
        
        draftStatusElement.style.display = 'none';
    }
    else if (currentPoolState.draftTime) {
        // Pool is in DraftTime - active drafting
        draftStatusElement.style.display = 'flex';
    }
    else if (currentPoolState.playTime) {
        // Pool is in PlayTime - draft is complete, tournament has started
        const playMessage = document.createElement('div');
        playMessage.className = 'status-message play-message';
        playMessage.innerHTML = `
            <h2>Draft Complete</h2>
            <p>The tournament has started. View your team and track scores on the homepage.</p>
        `;
        
        // Insert the play message in the same place as the idle message
        if (poolSelectorContainer && poolSelectorContainer.parentNode) {
            const controlsContainer = poolSelectorContainer.closest('.controls-container');
            if (controlsContainer) {
                controlsContainer.appendChild(playMessage);
            } else {
                document.body.insertBefore(playMessage, mainContainer);
            }
        } else {
            document.body.appendChild(playMessage);
        }
        
        draftStatusElement.style.display = 'none';
    }
}

/**
 * Clear any status messages currently displayed
 */
function clearStatusMessages() {
    const statusMessages = document.querySelectorAll('.status-message');
    statusMessages.forEach(message => message.remove());
}

/**
 * Show loading state
 */
function showLoadingState() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingState';
    loadingDiv.className = 'status-message';
    loadingDiv.innerHTML = `
        <h2>Loading Draft</h2>
        <p>Please wait while we set up your golf draft...</p>
    `;
    
    // Find the right place to insert the loading message
    const mainContainer = document.querySelector('.container');
    const poolSelectorContainer = document.querySelector('.pool-selector-container');
    
    if (poolSelectorContainer) {
        const controlsContainer = poolSelectorContainer.closest('.controls-container');
        if (controlsContainer) {
            controlsContainer.appendChild(loadingDiv);
            return;
        }
    }
    
    // Fallback - insert before the main container
    if (mainContainer && mainContainer.parentNode) {
        mainContainer.parentNode.insertBefore(loadingDiv, mainContainer);
    } else {
        // Last resort
        document.body.appendChild(loadingDiv);
    }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const loadingDiv = document.getElementById('loadingState');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

/**
 * Start polling for draft state updates
 */
function startDraftStatePolling() {
    // Keep track of previous pool state to avoid unnecessary UI updates
    let prevPoolState = {...currentPoolState};
    
    // Poll every 5 seconds
    setInterval(async () => {
        console.log("hello")
        if (selectedPool) {
            try {
                // First check if the pool state changed
                const prevState = {...currentPoolState};
                
                // Fetch updated pool state
                const stateResponse = await fetch(`/api/getPoolState/${selectedPool}`);
                if (stateResponse.ok) {
                    const state = await stateResponse.json();
                    const newState = {
                        idleTime: state.idleTime || false,
                        draftTime: state.draftTime || false,
                        playTime: state.playTime || false
                    };
                    
                    // Check if we're transitioning FROM idle TO draft mode
                    const draftJustStarted = prevState.idleTime && newState.draftTime;
                    
                    // Only update the UI if the pool state changed
                    const stateChanged = 
                        prevState.idleTime !== newState.idleTime ||
                        prevState.draftTime !== newState.draftTime ||
                        prevState.playTime !== newState.playTime;
                    
                    if (stateChanged) {
                        console.log('Pool state changed, updating UI');
                        currentPoolState = newState;
                        
                        // If draft just started, refresh the entire page
                        if (draftJustStarted) {
                            console.log('Draft just started! Refreshing page...');
                            // Show a quick notification before refreshing
                            showSuccessMessage('Draft is starting! Page will refresh...');
                            // Give a slight delay so the message is visible
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                            return; // Exit early since we're refreshing
                        }
                        
                        // Otherwise update UI without refreshing
                        updateUIForPoolState();
                    }
                    
                    // Only proceed with draft state updates if we're in draft mode
                    // and we're not about to refresh the page
                    if (currentPoolState.draftTime && !draftJustStarted) {
                        try {
                            const prevDraftRound = currentDraftRound;
                            const prevUserTurn = currentUserTurn;
                            
                            await fetchDraftState();
                            
                            // If we just entered draft mode or timer isn't running, start it
                            if (!isTimerRunning) {
                                startDraftTimer();
                            }
                            
                            // Only update UI if draft round or turn changed
                            if (prevDraftRound !== currentDraftRound || 
                                prevUserTurn !== currentUserTurn) {
                                
                                await fetchAllPoolPicks();
                                renderPicksContainer();
                                updateDraftStatus();
                                
                                // If it just became user's turn, notify them
                                let currentUser = 'Unknown';
                                const numberOfDrafters = draftOrder.length;
                                
                                if (draftOrder && numberOfDrafters > 0) {
                                    const isEvenRound = currentDraftRound % 2 === 0;
                                    
                                    if (isEvenRound) {
                                        // Even round (snake)
                                        const reverseIndex = numberOfDrafters - 1 - currentUserTurn;
                                        if (reverseIndex >= 0 && reverseIndex < numberOfDrafters) {
                                            currentUser = draftOrder[reverseIndex];
                                        }
                                    } else {
                                        // Odd round (normal)
                                        if (currentUserTurn >= 0 && currentUserTurn < numberOfDrafters) {
                                            currentUser = draftOrder[currentUserTurn];
                                        }
                                    }
                                }
                                
                                // Check if it just became the user's turn
                                if (currentUser.toLowerCase() === storedUsername.toLowerCase() && 
                                    (prevUserTurn !== currentUserTurn || prevDraftRound !== currentDraftRound)) {
                                    showSuccessMessage("It's your turn to pick!");
                                }
                            }
                        } catch (draftError) {
                            console.error('Error fetching draft state:', draftError);
                            // Don't abort polling just because draft state fetch failed
                        }
                    } else if (prevState.draftTime && !currentPoolState.draftTime) {
                        // If we just left draft mode, stop the timer
                        resetDraftTimer();
                    }
                }
            } catch (error) {
                console.error('Error during polling:', error);
                // Even if there's an error, we should try again on the next interval
            }
        }
    }, 5000);
}

/**
 * Update UI elements based on the current pool state
 * Modified to prevent flicker/reanimation when state hasn't changed
 */
function updateUIForPoolState() {
    // Clear any existing status messages first
    clearStatusMessages();
    
    // Get reference to the draft status element
    const draftStatusElement = document.querySelector('.draft-status');
    
    // Find the controls container to append messages to
    const controlsContainer = document.querySelector('.controls-container');
    
    if (currentPoolState.idleTime) {
        // Pool is in IdleTime - waiting for draft to start
        const idleMessage = document.createElement('div');
        idleMessage.className = 'status-message idle-message';
        idleMessage.id = 'idle-message'; // Add an ID for easy reference
        idleMessage.innerHTML = `
            <h2>Waiting for Draft to Start</h2>
            <p>The admin will start the draft soon. Please check back later or wait for the draft to begin.</p>
        `;
        
        // Add to the controls container
        if (controlsContainer) {
            controlsContainer.appendChild(idleMessage);
        }
        
        // Hide draft status
        if (draftStatusElement) {
            draftStatusElement.style.display = 'none';
        }
        resetDraftTimer();
    }
    else if (currentPoolState.draftTime) {
        // Pool is in DraftTime - active drafting
        draftStatusElement.style.display = 'flex';
        
        // Start timer if not already running
        if (!isTimerRunning) {
            startDraftTimer();
        }
    }
    else if (currentPoolState.playTime) {
        // Pool is in PlayTime - draft is complete, tournament has started
        const playMessage = document.createElement('div');
        playMessage.className = 'status-message play-message';
        playMessage.id = 'play-message'; // Add an ID for easy reference
        playMessage.innerHTML = `
            <h2>Draft Complete</h2>
            <p>The tournament has started. View your team and track scores on the homepage.</p>
        `;
        
        // Add to the controls container
        if (controlsContainer) {
            controlsContainer.appendChild(playMessage);
        }
        
        // Hide draft status
        if (draftStatusElement) {
            draftStatusElement.style.display = 'none';
        }
        resetDraftTimer();
    }
}

/**
 * Clear any status messages currently displayed
 */
function clearStatusMessages() {
    const statusMessages = document.querySelectorAll('.status-message');
    statusMessages.forEach(message => message.remove());
}

/**
 * Start the draft timer
 */
function startDraftTimer() {
    // Clear any existing timer
    resetDraftTimer();
    
    // Only start timer if in draft mode
    if (!currentPoolState.draftTime) {
        return;
    }
    
    // Initialize timer variables
   // timerSeconds = 60;
    isTimerRunning = true;
    
    // Reset UI
    updateTimerDisplay();
    
    // Get timer container elements
    const timerContainer = document.querySelector('.timer-container');
    
    // Remove any existing timer classes
    timerContainer?.classList.remove('timer-warning', 'timer-danger');
    
    // Start the timer
    draftTimer = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();
        
        // Add warning class at 20 seconds
        if (timerSeconds === 20) {
            timerContainer?.classList.add('timer-warning');
        }
        
        // Add danger class at 10 seconds
        if (timerSeconds === 10) {
            timerContainer?.classList.add('timer-danger');
        }
        
        // When timer expires
        if (timerSeconds <= 0) {
            clearInterval(draftTimer);
            isTimerRunning = false;
            
            // Auto-select best available golfer
            autoSelectBestGolfer();
        }
    }, 1000);
}

/**
 * Update the timer display
 */
function updateTimerDisplay() {
    if (timerSecondsDisplay) {
        timerSecondsDisplay.textContent = timerSeconds;
    }
    
    if (timerProgressBar) {
        const progressPercentage = (timerSeconds / 60) * 100;
        timerProgressBar.style.width = `${progressPercentage}%`;
    }
}

function resetDraftTimer() {
    if (draftTimer) {
        clearInterval(draftTimer);
        draftTimer = null;
    }
    
    isTimerRunning = false;
    
    // Remove this line - we want to keep the server time
    // timerSeconds = 60; <- REMOVE THIS
    
    // Reset UI
    updateTimerDisplay();
    
    // Remove warning classes
    const timerContainer = document.querySelector('.timer-container');
    timerContainer?.classList.remove('timer-warning', 'timer-danger');
}

/**
 * Auto-select the best available golfer (lowest odds)
 */
async function autoSelectBestGolfer() {
    console.log('Time expired - auto-selecting best available golfer');
    
    try {
        // Get current user for turn
        let currentUser = 'Unknown';
        const numberOfDrafters = draftOrder.length;
        
        if (draftOrder && numberOfDrafters > 0 && currentPoolState.draftTime) {
            const isEvenRound = currentDraftRound % 2 === 0;
            
            if (isEvenRound) {
                // Even round (snake)
                const reverseIndex = numberOfDrafters - 1 - currentUserTurn;
                if (reverseIndex >= 0 && reverseIndex < numberOfDrafters) {
                    currentUser = draftOrder[reverseIndex];
                }
            } else {
                // Odd round (normal)
                if (currentUserTurn >= 0 && currentUserTurn < numberOfDrafters) {
                    currentUser = draftOrder[currentUserTurn];
                }
            }
        }
        
        // Find all available golfers (not picked)
        const availableGolfers = golferOptions.filter(golfer => {
            // Check if golfer is already picked by any user
            let isPicked = false;
            
            Object.entries(allGolfPicks).forEach(([username, picks]) => {
                if (Array.isArray(picks)) {
                    const foundPick = picks.find(pick => pick.golferName === golfer.name);
                    if (foundPick) {
                        isPicked = true;
                    }
                }
            });
            
            return !isPicked;
        });
        
        // Sort by odds (lowest to highest - better odds first)
        availableGolfers.sort((a, b) => {
            const oddsA = parseInt(a.odds);
            const oddsB = parseInt(b.odds);
            return oddsA - oddsB;
        });
        
        // Get the best available golfer (first in sorted list)
        const bestGolfer = availableGolfers[0];
        
        if (!bestGolfer) {
            console.error('No available golfers to auto-select');
            return;
        }
        
        console.log(`Auto-selecting ${bestGolfer.name} for user ${currentUser}`);
        
        // Prepare the pick data
        const pickData = {
            golferName: bestGolfer.name,
            round: currentDraftRound,
            odds: bestGolfer.odds,
            timestamp: new Date().toISOString(),
            autoSelected: true  // Flag that this was auto-selected
        };
        
        // Submit the pick
        const response = await fetch(`/api/submitGolfPick/${currentUser}/${selectedPool}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pickData)
        });
        
        if (!response.ok) {
            let errorMsg = `Failed to auto-submit pick (${response.status})`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch (e) {
                // Ignore if response is not JSON
            }
            console.error("Server error during auto-pick:", errorMsg);
            throw new Error(errorMsg);
        }
        
        // Show notification of auto-selection
        showInfoMessage(`Time expired! ${bestGolfer.name} auto-selected for ${currentUser}.`);
        
        // Update state
        await fetchDraftState();
        await fetchAllPoolPicks();
        renderPicksContainer();
        updateDraftStatus();
        updateYourTeamDisplay();
        
        // Start new timer for next user
        startDraftTimer();
        
    } catch (error) {
        console.error('Error auto-selecting golfer:', error);
        showErrorMessage('Error auto-selecting golfer. The draft will continue to the next user.');
        
        // Try to update the state anyway to continue the draft
        await fetchDraftState();
        await fetchAllPoolPicks();
        renderPicksContainer();
        updateDraftStatus();
        
        // Start new timer
        startDraftTimer();
    }
}

/**
 * Show info message to the user (blue notification)
 */
function showInfoMessage(message) {
    // Create info toast
    const infoToast = document.createElement('div');
    infoToast.className = 'error-toast'; // Reuse the same class for animation
    infoToast.style.background = 'rgba(30, 100, 200, 0.9)'; // Override with blue
    infoToast.textContent = message;
    
    // Add to body
    document.body.appendChild(infoToast);
    
    // Remove after 5 seconds
    setTimeout(() => {
        infoToast.classList.add('fade-out');
        setTimeout(() => {
            infoToast.remove();
        }, 500); // Match the animation duration
    }, 5000);
}