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
        await fetchGolfers();
        await fetchUserPicks();
        await fetchAllPoolPicks();
        await fetchDraftState();
        renderPicksContainer();
        updateDraftStatus();
        updateYourTeamDisplay();
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

/**
 * Fetch the current draft state (round, turn, order)
 */
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
    
    // Check if it's the current user's turn (only relevant in draft mode)
    const isUserTurn = currentPoolState.draftTime && draftOrder[currentUserTurn] === storedUsername;
    
    // Add "your turn" class to turn indicator if it's the user's turn
    const turnIndicator = document.querySelector('.turn-indicator');
    if (isUserTurn) {
        turnIndicator.classList.add('your-turn');
    } else {
        turnIndicator.classList.remove('your-turn');
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
            const foundPick = picks.find(pick => pick.golferName === golfer.name);
            if (foundPick) {
                isPicked = true;
                pickedBy = username === storedUsername ? 'You' : username;
            }
        });
        
        // Set appropriate classes based on selection state
        if (isPicked) {
            card.classList.add('picked');
        } else if (currentPoolState.draftTime && !isUserTurn) {
            card.classList.add('disabled');
        } else if (selectedGolfer && selectedGolfer.name === golfer.name) {
            card.classList.add('selected');
        }
        
        // Disable interaction if not in draft mode
        if (!currentPoolState.draftTime) {
            card.classList.add('view-only');
        }
        
        // Create card content
        card.innerHTML = `
            <div class="golfer-name">${golfer.name}</div>
            <div class="golfer-odds">Odds: ${golfer.oddsDisplay || golfer.odds}</div>
            ${isPicked ? `<div class="picked-by">Picked by: ${pickedBy}</div>` : ''}
        `;
        
        // Add click event handler only in draft mode and if it's the user's turn
        if (currentPoolState.draftTime && !isPicked && isUserTurn) {
            card.addEventListener('click', () => handleGolferSelection(golfer));
        }
        
        golfersContainer.appendChild(card);
    });
    
    pickContainer.appendChild(golfersContainer);
}

/**
 * Update the draft status indicators
 */
function updateDraftStatus() {
    currentRoundSpan.textContent = currentDraftRound;
    
    // Get the username of the current user's turn
    const currentUser = draftOrder[currentUserTurn] || 'Unknown';
    currentUserNameSpan.textContent = currentUser === storedUsername ? 'Your' : `${currentUser}'s`;
    
    // Highlight if it's the current user's turn
    if (currentUser === storedUsername) {
        document.querySelector('.turn-indicator').classList.add('your-turn');
    } else {
        document.querySelector('.turn-indicator').classList.remove('your-turn');
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
    document.querySelector('.container').appendChild(loadingDiv);
    
    // Validate that it's still the user's turn
    const isUserTurn = draftOrder[currentUserTurn] === storedUsername;
    if (!isUserTurn) {
        clearStatusMessages();
        showErrorMessage("It's no longer your turn. Please wait for your next turn.");
        return;
    }
    
    try {
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
        
        if (!response.ok) {
            throw new Error('Failed to submit pick');
        }
        
        // Add the pick to the user's picks
        userGolfPicks.push(pickData);
        
        // Clear the selected golfer
        selectedGolfer = null;
        
        // Remove loading state
        clearStatusMessages();
        
        // Show success message
        showSuccessMessage(`Successfully selected ${pickData.golferName}`);
        
        // Update UI
        updateYourTeamDisplay();
        
        // Wait for server to update the draft state
        setTimeout(async () => {
            await fetchDraftState();
            await fetchAllPoolPicks();
            renderPicksContainer();
            updateDraftStatus();
        }, 1000);
        
    } catch (error) {
        console.error('Error submitting pick:', error);
        clearStatusMessages();
        showErrorMessage('Failed to submit pick. Please try again.');
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

/**
 * Start polling for draft state updates
 */
function startDraftStatePolling() {
    // Poll every 5 seconds
    setInterval(async () => {
        if (selectedPool && currentPoolState.draftTime) {
            const prevDraftRound = currentDraftRound;
            const prevUserTurn = currentUserTurn;
            const prevState = {...currentPoolState};
            
            await loadPoolState();
            await fetchDraftState();
            
            // Only update UI if something changed
            if (prevDraftRound !== currentDraftRound || 
                prevUserTurn !== currentUserTurn || 
                prevState.idleTime !== currentPoolState.idleTime ||
                prevState.draftTime !== currentPoolState.draftTime ||
                prevState.playTime !== currentPoolState.playTime) {
                
                await fetchAllPoolPicks();
                renderPicksContainer();
                updateDraftStatus();
                
                // If it just became user's turn, notify them
                if (draftOrder[currentUserTurn] === storedUsername && 
                    (prevUserTurn !== currentUserTurn || prevDraftRound !== currentDraftRound)) {
                    showSuccessMessage("It's your turn to pick!");
                }
            }
        } else {
            // Check if the state changed from idle to draft or draft to play
            const prevState = {...currentPoolState};
            await loadPoolState();
            
            if (prevState.idleTime !== currentPoolState.idleTime ||
                prevState.draftTime !== currentPoolState.draftTime ||
                prevState.playTime !== currentPoolState.playTime) {
                
                await fetchDraftState();
                await fetchAllPoolPicks();
                renderPicksContainer();
                updateDraftStatus();
            }
        }
    }, 5000);
}

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
                        
                        // Only update UI if draft round or turn changed
                        if (prevDraftRound !== currentDraftRound || 
                            prevUserTurn !== currentUserTurn) {
                            
                            await fetchAllPoolPicks();
                            renderPicksContainer();
                            updateDraftStatus();
                            
                            // If it just became user's turn, notify them
                            if (draftOrder[currentUserTurn] === storedUsername && 
                                (prevUserTurn !== currentUserTurn || prevDraftRound !== currentDraftRound)) {
                                showSuccessMessage("It's your turn to pick!");
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error during polling:', error);
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
    }
    else if (currentPoolState.draftTime) {
        // Pool is in DraftTime - active drafting
        if (draftStatusElement) {
            draftStatusElement.style.display = 'flex';
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
    }
}

/**
 * Clear any status messages currently displayed
 */
function clearStatusMessages() {
    const statusMessages = document.querySelectorAll('.status-message');
    statusMessages.forEach(message => message.remove());
}