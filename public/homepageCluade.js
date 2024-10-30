// Configuration and Constants
const CONFIG = {
    CACHE_DURATION: 300000,
    CHAT_CACHE_DURATION: 10000,
    CHUNK_SIZE: 5,
    CHUNK_DELAY: 50,
    DEFAULT_PROFILE_PIC: 'HalloweenDefault.png',
    TEAM_LOGOS: {
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
    }
};

// Utility Functions
const Utils = {
    getCurrentTimeInUTC4() {
        const now = new Date();
        const nowUtc4 = new Date(now);
        nowUtc4.setMinutes(nowUtc4.getMinutes() + nowUtc4.getTimezoneOffset());
        nowUtc4.setHours(nowUtc4.getHours() - 4);
        return nowUtc4;
    },

    async fetchWithRetry(url, options = {}, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response;
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            }
        }
    },

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    createDOMElement(type, className, attributes = {}) {
        const element = document.createElement(type);
        if (className) element.className = className;
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        return element;
    }
};

// DOM Cache Manager
const DOMCache = {
    elements: new Map(),
    
    get(selector, context = document) {
        if (!this.elements.has(selector)) {
            this.elements.set(selector, context.querySelector(selector));
        }
        return this.elements.get(selector);
    },
    
    getAll(selector, context = document) {
        return context.querySelectorAll(selector);
    },
    
    clear() {
        this.elements.clear();
    }
};

// Time Window Manager
const TimeManager = {
    cache: {
        windows: null,
        lastFetch: 0
    },

    async getTimeWindows() {
        const now = Date.now();
        if (this.cache.windows && (now - this.cache.lastFetch) < CONFIG.CACHE_DURATION) {
            return this.cache.windows;
        }

        try {
            const response = await Utils.fetchWithRetry('/api/timewindows');
            this.cache.windows = await response.json();
            this.cache.lastFetch = now;
            return this.cache.windows;
        } catch (error) {
            console.error('Error fetching time windows:', error);
            return null;
        }
    },

    async checkCurrentTimeWindow() {
        const timeWindows = await this.getTimeWindows();
        if (!timeWindows) return 'unknown';

        const now = Utils.getCurrentTimeInUTC4();
        const tuesdayTime = new Date(timeWindows.tuesdayStartTime);
        const thursdayTime = new Date(timeWindows.thursdayDeadline);

        if (now > tuesdayTime && now < thursdayTime) {
            return 'pickTime';
        } else if (now > thursdayTime) {
            return 'gameTime';
        }
        return 'unknown';
    }
};

// User Manager
const UserManager = {
    getUsername() {
        return localStorage.getItem('username')?.toLowerCase();
    },

    setUsername(username) {
        localStorage.setItem('username', username.toLowerCase());
    },

    async getUserProfile(username) {
        try {
            const response = await Utils.fetchWithRetry(`/api/getUserProfile/${encodeURIComponent(username)}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },

    async updateUserBio(username, bio) {
        try {
            const response = await Utils.fetchWithRetry('/api/saveUserBio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, bio })
            });
            return response.ok;
        } catch (error) {
            console.error('Error updating bio:', error);
            return false;
        }
    },

    async uploadProfilePicture(file, username) {
        const formData = new FormData();
        formData.append('profilePic', file);
        formData.append('username', username.toLowerCase());

        try {
            const response = await Utils.fetchWithRetry('/api/uploadProfilePicture', {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    }
};

// Pool Manager
const PoolManager = {
    cache: {
        pools: new Map(),
        lastFetch: new Map()
    },

    async getUserPools(username) {
        const cacheKey = username.toLowerCase();
        const now = Date.now();
        const cached = this.cache.pools.get(cacheKey);
        const lastFetch = this.cache.lastFetch.get(cacheKey) || 0;

        if (cached && (now - lastFetch) < CONFIG.CACHE_DURATION) {
            return cached;
        }

        try {
            const response = await Utils.fetchWithRetry(`/pools/userPools/${encodeURIComponent(username)}`);
            const pools = await response.json();
            
            this.cache.pools.set(cacheKey, pools);
            this.cache.lastFetch.set(cacheKey, now);
            
            return pools;
        } catch (error) {
            console.error('Error fetching user pools:', error);
            return [];
        }
    },

    async createPool(poolData) {
        try {
            const response = await Utils.fetchWithRetry('/pools/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(poolData)
            });
            
            const result = await response.json();
            await this.refreshPools(poolData.adminUsername);
            return result;
        } catch (error) {
            console.error('Error creating pool:', error);
            throw error;
        }
    },

    async deletePool(poolName, username) {
        try {
            const response = await Utils.fetchWithRetry(`/pools/delete/${encodeURIComponent(poolName)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-username': username
                }
            });
            
            const result = await response.json();
            await this.refreshPools(username);
            return result;
        } catch (error) {
            console.error('Error deleting pool:', error);
            throw error;
        }
    },

    async leavePool(username, poolName) {
        try {
            const response = await Utils.fetchWithRetry(`/pools/leave/${encodeURIComponent(username)}/${encodeURIComponent(poolName)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            await this.refreshPools(username);
            return result;
        } catch (error) {
            console.error('Error leaving pool:', error);
            throw error;
        }
    },

    async joinPool(poolName, username, password = '') {
        try {
            const response = await Utils.fetchWithRetry('/pools/joinByName', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    poolName,
                    username: username.toLowerCase(),
                    poolPassword: password
                })
            });
            
            const result = await response.json();
            await this.refreshPools(username);
            return result;
        } catch (error) {
            console.error('Error joining pool:', error);
            throw error;
        }
    },

    async refreshPools(username) {
        const cacheKey = username.toLowerCase();
        this.cache.pools.delete(cacheKey);
        this.cache.lastFetch.delete(cacheKey);
        return await this.getUserPools(username);
    }
};

// Picks Manager
const PicksManager = {
    cache: {
        picks: new Map(),
        lastFetch: new Map()
    },

    async getUserPicks(username, poolName) {
        const cacheKey = `${username.toLowerCase()}-${poolName}`;
        const now = Date.now();
        const cached = this.cache.picks.get(cacheKey);
        const lastFetch = this.cache.lastFetch.get(cacheKey) || 0;

        if (cached && (now - lastFetch) < CONFIG.CACHE_DURATION) {
            return cached;
        }

        try {
            const response = await Utils.fetchWithRetry(
                `/api/getPicks/${encodeURIComponent(username)}/${encodeURIComponent(poolName)}`
            );
            const picks = await response.json();
            
            this.cache.picks.set(cacheKey, picks);
            this.cache.lastFetch.set(cacheKey, now);
            
            return picks;
        } catch (error) {
            console.error('Error fetching user picks:', error);
            return null;
        }
    },

    async updateUserStats(username, poolName, stats) {
        try {
            const response = await Utils.fetchWithRetry('/pools/updateUserStatsInPoolByName', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    poolName,
                    ...stats
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating user stats:', error);
            return null;
        }
    },

    async resetUserStats(username, poolName) {
        try {
            const response = await Utils.fetchWithRetry('/pools/resetUserStatsInPoolByName', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, poolName })
            });
            return await response.json();
        } catch (error) {
            console.error('Error resetting user stats:', error);
            return null;
        }
    }
};

// Chat Manager
const ChatManager = {
    chatMode: 'local',
    cache: {
        messages: new Map(),
        lastFetch: new Map()
    },

    setChatMode(mode) {
        this.chatMode = mode;
    },

    async getMessages(poolName) {
        const cacheKey = `${poolName}-${this.chatMode}`;
        const now = Date.now();
        const cached = this.cache.messages.get(cacheKey);
        const lastFetch = this.cache.lastFetch.get(cacheKey) || 0;

        if (cached && (now - lastFetch) < CONFIG.CHAT_CACHE_DURATION) {
            return cached;
        }

        try {
            const queryParam = this.chatMode === 'global' ? '' : `?poolName=${encodeURIComponent(poolName)}`;
            const response = await Utils.fetchWithRetry(`/pools/getChatMessages${queryParam}`);
            const data = await response.json();
            
            if (data.success) {
                this.cache.messages.set(cacheKey, data.messages);
                this.cache.lastFetch.set(cacheKey, now);
                return data.messages;
            }
            return [];
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            return [];
        }
    },

    async sendMessage(username, poolName, message) {
        try {
            const response = await Utils.fetchWithRetry('/pools/sendChatMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    poolName: this.chatMode === 'global' ? null : poolName,
                    message
                })
            });

            if (!response.ok) throw new Error('Failed to send message');
            
            const cacheKey = `${poolName}-${this.chatMode}`;
            this.cache.messages.delete(cacheKey);
            this.cache.lastFetch.delete(cacheKey);
            
            return await response.json();
        } catch (error) {
            console.error('Error sending chat message:', error);
            throw error;
        }
    }
};

// UI Manager
const UIManager = {
    renderPool(pool, isAdmin) {
        const poolWrapper = Utils.createDOMElement('div', 'pool-wrapper', {
            'data-pool-name': pool.name
        });

        const poolNameDiv = Utils.createDOMElement('div', 'pool-name');
        poolNameDiv.textContent = pool.name;

        const poolScrollableContainer = Utils.createDOMElement('div', 'pool-scrollable-container');
        const poolContainer = Utils.createDOMElement('div', 'pool-container');

        // Create pool header
        const poolHeader = Utils.createDOMElement('div', 'pool-header');
        poolHeader.innerHTML = `
            <span class="header-rank"></span>
            <span class="header-user">User</span>
            <span class="header-points">Points</span>
            <span class="header-picks">
                <button class="choose-picks-button">Make Picks</button>
            </span>
            <span class="header-immortal-lock"><i class="fas fa-lock"></i></span>
            <span class="header-win">Win</span>
            <span class="header-loss">Loss</span>
            <span class="header-push">Push</span>
        `;
        poolContainer.appendChild(poolHeader);

        // Sort and render members
        const sortedMembers = [...pool.members].sort((a, b) => b.points - a.points);
        sortedMembers.forEach((member, index) => {
            const playerRow = this.createPlayerRow(member, index + 1, member.username === pool.adminUsername);
            poolContainer.appendChild(playerRow);
        });

        poolScrollableContainer.appendChild(poolContainer);
        poolWrapper.appendChild(poolNameDiv);
        poolWrapper.appendChild(poolScrollableContainer);

        // Add chat container from template
        const chatTemplate = document.getElementById('chat-template');
        if (chatTemplate) {
            poolWrapper.appendChild(chatTemplate.content.cloneNode(true));
        }

        // Add pool controls (delete/leave buttons)
        const poolControls = this.createPoolControls(pool.name, isAdmin);
        poolWrapper.appendChild(poolControls);

        return poolWrapper;
    },

    createPlayerRow(member, rank, isAdmin) {
        const playerRow = Utils.createDOMElement('div', 'player-row');
        playerRow.innerHTML = `
            <div class="player-rank">${rank}</div>
            <div class="player-user">
                <div class="player-profile-pic" style="background-image: url('${member.profilePicture || CONFIG.DEFAULT_PROFILE_PIC}')"></div>
                <span class="player-username">${member.username}</span>
                ${isAdmin ? '<i class="fas fa-shield admin-badge" title="Admin"></i>' : ''}
                ${rank === 1 ? '<i class="fas fa-crown crown-icon" title="1st Place"></i>' : ''}
            </div>
            <div class="player-points">${member.points}</div>
            <div class="player-picks"></div>
            <div class="player-immortal-lock"></div>
            <div class="player-win">${member.win || 0}</div>
            <div class="player-loss">${member.loss || 0}</div>
            <div class="player-push">${member.push || 0}</div>
        `;
        return playerRow;
    },

    createPoolControls(poolName, isAdmin) {
        const controls = Utils.createDOMElement('div', 'pool-controls');
        
        if (isAdmin) {
            const deleteButton = Utils.createDOMElement('button', 'delete-pool-button');
            deleteButton.textContent = 'Delete Pool';
            deleteButton.setAttribute('data-pool-name', poolName);
            controls.appendChild(deleteButton);
        } else {
            const leaveButton = Utils.createDOMElement('button', 'leave-pool-button');
            leaveButton.textContent = 'Leave Pool';
            leaveButton.setAttribute('data-pool-name', poolName);
            controls.appendChild(leaveButton);
        }

        return controls;
    },

    async renderPicks(picksData, playerRow, teamLogos) {
        const picksContainer = playerRow.querySelector('.player-picks');
        const immortalLockContainer = playerRow.querySelector('.player-immortal-lock');
        picksContainer.innerHTML = '';
        immortalLockContainer.innerHTML = '';

        if (picksData?.picks?.length > 0) {
            picksData.picks
                .sort((a, b) => new Date(a.commenceTime) - new Date(b.commenceTime))
                .forEach(pick => {
                    const pickDiv = Utils.createDOMElement('div', 'pick');
                    
                    if (pick.teamName && teamLogos[pick.teamName]) {
                        const logoImg = Utils.createDOMElement('img', 'team-logo', {
                            src: teamLogos[pick.teamName],
                            alt: pick.teamName
                        });
                        pickDiv.appendChild(logoImg);
                    }

                    if (pick.value) {
                        const valueSpan = Utils.createDOMElement('span');
                        valueSpan.textContent = pick.value;
                        pickDiv.appendChild(valueSpan);
                    }

                    picksContainer.appendChild(pickDiv);
                });
        }

        if (picksData?.immortalLock?.length > 0) {
            const immortalPick = picksData.immortalLock[0];
            const lockDiv = Utils.createDOMElement('div', 'immortal-lock');
            
            if (immortalPick.teamName && teamLogos[immortalPick.teamName]) {
                const logoImg = Utils.createDOMElement('img', 'team-logo', {
                    src: teamLogos[immortalPick.teamName],
                    alt: immortalPick.teamName
                });
                lockDiv.appendChild(logoImg);
            }

            if (immortalPick.value) {
                const valueSpan = Utils.createDOMElement('span');
                valueSpan.textContent = immortalPick.value;
                lockDiv.appendChild(valueSpan);
            }

            immortalLockContainer.appendChild(lockDiv);
        }
    }
};

// Event Handler
class EventHandler {
    constructor() {
        this.bindEvents();
        this.initializeApp();
    }

    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => this.handleDOMContentLoaded());
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
        window.addEventListener('load', () => this.handleWindowLoad());
    }

    initializeApp() {
        const username = UserManager.getUsername();
        if (username) {
            this.loadAndDisplayUserPools(username);
            this.setupUserProfile();
        }

        // Setup periodic cleanup
        setInterval(() => {
            ChatManager.cache.messages.clear();
            PicksManager.cache.picks.clear();
        }, 300000); // Clear caches every 5 minutes
    }

    updateUserProfileUI(userProfile) {
        const profileIcon = DOMCache.get('.profile-icon');
        const profileIconCenter = DOMCache.get('.profile-icon-center');
        const displayName = DOMCache.get('#displayName');

        if (profileIcon) profileIcon.src = userProfile.profilePicture || CONFIG.DEFAULT_PROFILE_PIC;
        if (profileIconCenter) profileIconCenter.src = userProfile.profilePicture || CONFIG.DEFAULT_PROFILE_PIC;
        if (displayName) displayName.textContent = userProfile.username;
    }

    updatePoolsUI(pools) {
        const poolContainerWrapper = DOMCache.get('pool-container-wrapper');
        if (!poolContainerWrapper) return;

        poolContainerWrapper.innerHTML = '';
        
        pools.forEach(pool => {
            const isAdmin = pool.adminUsername.toLowerCase() === UserManager.getUsername().toLowerCase();
            const poolElement = UIManager.renderPool(pool, isAdmin);
            poolContainerWrapper.appendChild(poolElement);

            // Load picks for each member
            pool.members.forEach(member => {
                const playerRow = poolElement.querySelector(`[data-username="${member.username}"]`);
                if (playerRow) {
                    this.loadUserPicks(member.username, pool.name, playerRow);
                }
            });
        });
    }

    handleProfilePicChange(event) {
        const file = event.target.files[0];
        const username = UserManager.getUsername();

        if (!file || !username) return;

        UserManager.uploadProfilePicture(file, username)
            .then(result => {
                if (result?.filePath) {
                    DOMCache.getAll('.profile-icon').forEach(icon => icon.src = result.filePath);
                    DOMCache.getAll('.profile-icon-center').forEach(icon => icon.src = result.filePath);
                }
            })
            .catch(error => {
                console.error('Profile picture upload failed:', error);
                alert('Failed to upload profile picture. Please try again.');
            });
    }
    setupUserProfile() {
        const profilePicInput = DOMCache.get('#profilePic');
        if (profilePicInput) {
            profilePicInput.addEventListener('change', (event) => this.handleProfilePicChange(event));
        }
    }
    async handleDOMContentLoaded() {
        // Clean URL parameters
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, document.title, url.pathname);

        // Initialize forms visibility
        const createPoolForm = DOMCache.get('create-pool-form-container');
        const joinPoolForm = DOMCache.get('join-pool-form-container');
        if (createPoolForm) createPoolForm.style.display = 'none';
        if (joinPoolForm) joinPoolForm.style.display = 'none';

        // Set up chat mode
        ChatManager.setChatMode('local');

        // Load user pools
        const username = UserManager.getUsername();
        if (username) {
            await this.loadAndDisplayUserPools(username);
        }
    }

    async handleWindowLoad() {
        const username = UserManager.getUsername();
        if (!username) return;

        try {
            const [userProfile, pools] = await Promise.all([
                UserManager.getUserProfile(username),
                PoolManager.getUserPools(username)
            ]);

            if (userProfile) {
                this.updateUserProfileUI(userProfile);
            }

            if (pools) {
                this.updatePoolsUI(pools);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    handleGlobalClick(event) {
        const target = event.target;

        if (target.matches('#show-create-pool-form')) {
            this.toggleCreatePoolForm(target);
        } else if (target.matches('#show-join-pool-form')) {
            this.toggleJoinPoolForm(target);
        } else if (target.matches('.choose-picks-button')) {
            this.handlePicksButtonClick(event, target);
        } else if (target.matches('.delete-pool-button')) {
            this.handleDeletePool(target);
        } else if (target.matches('.leave-pool-button')) {
            this.handleLeavePool(target);
        } else if (target.matches('.chat-mode-button')) {
            this.handleChatModeChange(target);
        } else if (target.matches('.send-chat-button')) {
            this.handleChatSend(target);
        }
    }

    async loadAndDisplayUserPools(username) {
        const pools = await PoolManager.getUserPools(username);
        const poolContainerWrapper = DOMCache.get('pool-container-wrapper');
        if (!poolContainerWrapper) return;

        poolContainerWrapper.innerHTML = '';
        for (const pool of pools) {
            const isAdmin = pool.adminUsername.toLowerCase() === username.toLowerCase();
            const poolElement = UIManager.renderPool(pool, isAdmin);
            poolContainerWrapper.appendChild(poolElement);

            // Load picks for each member
            pool.members.forEach(member => {
                const playerRow = poolElement.querySelector(`[data-username="${member.username}"]`);
                if (playerRow) {
                    this.loadUserPicks(member.username, pool.name, playerRow);
                }
            });
        }
    }

    async loadUserPicks(username, poolName, playerRow) {
        const picksData = await PicksManager.getUserPicks(username, poolName);
        if (picksData) {
            await UIManager.renderPicks(picksData, playerRow, CONFIG.TEAM_LOGOS);
        }
    }

    // Form handling methods
    toggleCreatePoolForm(button) {
        const formContainer = DOMCache.get('create-pool-form-container');
        const isVisible = formContainer.style.display === 'block';
        formContainer.style.display = isVisible ? 'none' : 'block';
        button.textContent = isVisible ? 'Create Pool' : 'Go Back';
    }

    toggleJoinPoolForm(button) {
        const formContainer = DOMCache.get('join-pool-form-container');
        const isVisible = formContainer.style.display === 'block';
        formContainer.style.display = isVisible ? 'none' : 'block';
        button.textContent = isVisible ? 'Join Pool' : 'Go Back';
    }

    // Pool action handlers
    async handleDeletePool(button) {
        const poolName = button.getAttribute('data-pool-name');
        if (!poolName) return;

        const confirmed = confirm(`Are you sure you want to delete the pool "${poolName}"?`);
        if (!confirmed) return;

        const username = UserManager.getUsername();
        if (!username) return;

        try {
            await PoolManager.deletePool(poolName, username);
            await this.loadAndDisplayUserPools(username);
        } catch (error) {
            console.error('Error deleting pool:', error);
            alert('Failed to delete pool. Please try again.');
        }
    }

    async handleLeavePool(button) {
        const poolName = button.getAttribute('data-pool-name');
        if (!poolName) return;

        const confirmed = confirm(`Are you sure you want to leave the pool "${poolName}"?`);
        if (!confirmed) return;

        const username = UserManager.getUsername();
        if (!username) return;

        try {
            await PoolManager.leavePool(username, poolName);
            await this.loadAndDisplayUserPools(username);
        } catch (error) {
            console.error('Error leaving pool:', error);
            alert('Failed to leave pool. Please try again.');
        }
    }

    // Chat handlers
    handleChatModeChange(button) {
        const mode = button.getAttribute('data-mode');
        ChatManager.setChatMode(mode);
        const poolWrapper = button.closest('.pool-wrapper');
        if (poolWrapper) {
            const poolName = poolWrapper.getAttribute('data-pool-name');
            const chatBox = poolWrapper.querySelector('.chat-box');
            if (chatBox) {
                this.refreshChat(poolName, chatBox);
            }
        }
    }

    async handleChatSend(button) {
        const chatWrapper = button.closest('.chat-wrapper');
        if (!chatWrapper) return;

        const poolWrapper = chatWrapper.closest('.pool-wrapper');
        const poolName = poolWrapper?.getAttribute('data-pool-name');
        const chatInput = chatWrapper.querySelector('.chat-input');
        const chatBox = chatWrapper.querySelector('.chat-box');

        if (!chatInput || !chatBox) return;

        const message = chatInput.value.trim();
        const username = UserManager.getUsername();

        if (message && username) {
            try {
                await ChatManager.sendMessage(username, poolName, message);
                chatInput.value = '';
                await this.refreshChat(poolName, chatBox);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    }

    async refreshChat(poolName, chatBox) {
        const messages = await ChatManager.getMessages(poolName);
        this.renderChatMessages(messages, chatBox);
    }

    renderChatMessages(messages, chatBox) {
        chatBox.innerHTML = '';
        messages.forEach(msg => {
            const messageElement = Utils.createDOMElement('div', 'chat-message');
            
            const prefix = msg.poolName ? '[L]' : '[G]';
            const usernameSpan = Utils.createDOMElement('span', 'chat-username');
            usernameSpan.style.color = '#ff7b00';
            usernameSpan.textContent = `${msg.username}: `;

            const messageSpan = Utils.createDOMElement('span', 'chat-text');
            messageSpan.innerHTML = msg.message.replace(
                /(https?:\/\/[^\s]+)/g,
                '<a href="$1" target="_blank">$1</a>'
            );

            messageElement.appendChild(document.createTextNode(prefix + ' '));
            messageElement.appendChild(usernameSpan);
            messageElement.appendChild(messageSpan);
            chatBox.appendChild(messageElement);
        });

        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Initialize the application
const app = new EventHandler();

// Form submissions
document.getElementById('create-pool-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const poolData = {
        name: formData.get('pool-name'),
        isPrivate: formData.get('is-private') === 'on',
        adminUsername: UserManager.getUsername(),
        password: formData.get('pool-password')
    };

    try {
        await PoolManager.createPool(poolData);
        e.target.reset();
        DOMCache.get('create-pool-form-container').style.display = 'none';
        await app.loadAndDisplayUserPools(UserManager.getUsername());
    } catch (error) {
        console.error('Error creating pool:', error);
        alert(error.message);
    }
});

document.getElementById('join-pool-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const poolName = DOMCache.get('pool-name2')?.value;
    const poolPassword = DOMCache.get('join-password')?.value;
    const username = UserManager.getUsername();

    if (!username || !poolName) return;

    try {
        await PoolManager.joinPool(poolName, username, poolPassword);
        e.target.reset();
        DOMCache.get('join-pool-form-container').style.display = 'none';
        await app.loadAndDisplayUserPools(username);
        alert('Successfully joined pool!');
    } catch (error) {
        console.error('Error joining pool:', error);
        alert('Failed to join pool. Please check the pool name and password.');
    }
});

// Profile picture upload handler
document.getElementById('profilePic')?.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const username = UserManager.getUsername();

    if (!file || !username) return;

    try {
        const result = await UserManager.uploadProfilePicture(file, username);
        if (result?.filePath) {
            DOMCache.getAll('.profile-icon').forEach(icon => icon.src = result.filePath);
            DOMCache.getAll('.profile-icon-center').forEach(icon => icon.src = result.filePath);
        }
    } catch (error) {
        console.error('Profile picture upload failed:', error);
        alert('Failed to upload profile picture. Please try again.');
    }
});

// Bio save handler
document.getElementById('saveBioButton')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const bio = DOMCache.get('userBio')?.value;
    const username = UserManager.getUsername();

    if (!username) return;

    try {
        const success = await UserManager.updateUserBio(username, bio);
        if (success) {
            alert('Bio saved successfully!');
        } else {
            throw new Error('Failed to save bio');
        }
    } catch (error) {
        console.error('Error saving bio:', error);
        alert('Failed to save bio. Please try again.');
    }
});

// Private event handlers
const handlePicksButtonClick = async (event) => {
    const timeWindow = await TimeManager.checkCurrentTimeWindow();
    const button = event.target;
    
    if (timeWindow === 'gameTime') {
        event.preventDefault();
        alert("It's Game Time! Pick selection page not available.");
        return;
    }

    const poolWrapper = button.closest('.pool-wrapper');
    const poolName = poolWrapper?.getAttribute('data-pool-name');
    
    if (poolName) {
        window.location.href = `dashboard.html?poolName=${encodeURIComponent(poolName)}`;
    }
};

const handleProfileClick = async (username, poolName) => {
    try {
        const [userProfile, poolInfo] = await Promise.all([
            UserManager.getUserProfile(username),
            PoolManager.getUserPools(username)
        ]);

        if (!userProfile || !poolInfo) return;

        const userPool = poolInfo.find(pool => pool.name === poolName);
        if (!userPool) return;

        const userMember = userPool.members.find(
            member => member.username.toLowerCase() === username.toLowerCase()
        );

        if (!userMember) return;

        const userData = {
            ...userProfile,
            win: userMember.win || 0,
            loss: userMember.loss || 0,
            push: userMember.push || 0
        };

        updateProfileSlideout(userData);
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
};

const updateProfileSlideout = (userData) => {
    const slideout = document.getElementById('slideOutPanelInPool');
    if (!slideout) return;

    const profileIcon = slideout.querySelector('.profile-icon-center');
    const displayName = slideout.querySelector('#displayNameInPool');
    const userBio = slideout.querySelector('#userBioInPool');
    const userRecord = slideout.querySelector('#userRecordInPool');

    if (profileIcon) profileIcon.src = userData.profilePicture || CONFIG.DEFAULT_PROFILE_PIC;
    if (displayName) displayName.textContent = userData.username;
    if (userBio) userBio.textContent = userData.bio || 'No bio available';
    if (userRecord) {
        userRecord.innerHTML = `
            <div>Win: ${userData.win} | Loss: ${userData.loss} | Push: ${userData.push}</div>
        `;
    }

    slideout.classList.add('visible');
};

// Initialize theme and preferences
const initializePreferences = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
};

// Handle theme toggle
document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Initialize the application
initializePreferences();

// Clean up function for page unload
window.addEventListener('unload', () => {
    DOMCache.clear();
    ChatManager.cache.messages.clear();
    PicksManager.cache.picks.clear();
});

// Export necessary functions and objects for external use
window.App = {
    UserManager,
    PoolManager,
    PicksManager,
    ChatManager,
    TimeManager,
    UIManager,
    Utils
};