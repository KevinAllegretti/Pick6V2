
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
    await fetchDraftState();
    renderPicksContainer();
    updateDraftStatus();
    updateYourTeamDisplay();
});

/**
 * Initialize the golf selection page
 */
async function initializeGolfSelection() {
    // Populate pool selector
    await populateGolfPoolSelector();
    
    // Load initial state for the selected pool
    if (selectedPool) {
        await loadPoolState();
        await fetchGolfers();
        await fetchUserPicks();
        await fetchDraftState();
        renderPicksContainer();
        updateDraftStatus();
        updateYourTeamDisplay();
    }
    
    // Start polling for draft state updates
    startDraftStatePolling();
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
    const pickContainer = document.getElementById('pickContainer');
    
    if (currentPoolState.idleTime) {
        // Pool is in IdleTime - waiting for draft to start
        pickContainer.innerHTML = `
            <div class="idle-message">
                <h2>Waiting for Draft to Start</h2>
                <p>The admin will start the draft soon. Please wait.</p>
            </div>
        `;
        pickContainer.classList.add('idle-state');
        document.querySelector('.draft-status').style.display = 'none';
    }
    else if (currentPoolState.draftTime) {
        // Pool is in DraftTime - active drafting
        pickContainer.classList.remove('idle-state');
        document.querySelector('.draft-status').style.display = 'flex';
    }
    else if (currentPoolState.playTime) {
        // Pool is in PlayTime - draft is complete, tournament has started
        pickContainer.innerHTML = `
            <div class="play-message">
                <h2>Draft Complete</h2>
                <p>The tournament has started. View your team on the homepage.</p>
            </div>
        `;
        pickContainer.classList.add('play-state');
        document.querySelector('.draft-status').style.display = 'none';
    }
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
        console.log('Loaded golfers:', golferOptions); // Debug log
        renderPicksContainer(); // Call render after fetching
        
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
    const pickContainer = document.getElementById('pickContainer');
    pickContainer.innerHTML = '';
    
    // Always display golfers, but with different interaction based on state
    if (currentPoolState.idleTime) {
        // Add a message about the pool being in idle time
        const messageDiv = document.createElement('div');
        messageDiv.className = 'idle-message';
        messageDiv.innerHTML = `
            <h2>Waiting for Draft to Start</h2>
            <p>The admin will start the draft soon. Please wait.</p>
        `;
        pickContainer.appendChild(messageDiv);
    }
    
    if (currentPoolState.playTime) {
        // Add a message about the pool being in play time
        const messageDiv = document.createElement('div');
        messageDiv.className = 'play-message';
        messageDiv.innerHTML = `
            <h2>Draft Complete</h2>
            <p>The tournament has started. View your team on the homepage.</p>
        `;
        pickContainer.appendChild(messageDiv);
    }
    
    // Always show available golfers, regardless of state
    const golfersContainer = document.createElement('div');
    golfersContainer.className = 'golfers-container';
    
    // Check if it's the current user's turn (only relevant in draft mode)
    const isUserTurn = currentPoolState.draftTime && draftOrder[currentUserTurn] === storedUsername;
    
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
    
    // Validate that it's still the user's turn
    const isUserTurn = draftOrder[currentUserTurn] === storedUsername;
    if (!isUserTurn) {
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
        
        golferElement.innerHTML = `
            <div class="selected-golfer-name">${pick.golferName}</div>
            <div class="selected-golfer-round">Round ${pick.round}</div>
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
            
            await loadPoolState();
            await fetchDraftState();
            
            // Only update UI if something changed
            if (prevDraftRound !== currentDraftRound || prevUserTurn !== currentUserTurn) {
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
    
    // Remove after 3 seconds
    setTimeout(() => {
        errorToast.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(errorToast);
        }, 500);
    }, 3000);
}