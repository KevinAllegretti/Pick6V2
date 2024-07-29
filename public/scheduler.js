document.addEventListener('DOMContentLoaded', async () => {
    const teamSelect = document.getElementById('teamSelect');
    const weekSelect = document.getElementById('weekSelect');
    const gamesContainer = document.getElementById('gamesContainer');

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

    const teamColorClasses = {
        'Arizona Cardinals': 'cardinals-color',
        'Atlanta Falcons': 'falcons-color',
        'Baltimore Ravens': 'ravens-color',
        'Buffalo Bills': 'bills-color',
        'Carolina Panthers': 'panthers-color',
        'Chicago Bears': 'bears-color',
        'Cincinnati Bengals': 'bengals-color',
        'Cleveland Browns': 'browns-color',
        'Dallas Cowboys': 'cowboys-color',
        'Denver Broncos': 'broncos-color',
        'Detroit Lions': 'lions-color',
        'Green Bay Packers': 'packers-color',
        'Houston Texans': 'texans-color',
        'Indianapolis Colts': 'colts-color',
        'Jacksonville Jaguars': 'jaguars-color',
        'Kansas City Chiefs': 'chiefs-color',
        'Las Vegas Raiders': 'raiders-color',
        'Los Angeles Chargers': 'chargers-color',
        'Los Angeles Rams': 'rams-color',
        'Miami Dolphins': 'dolphins-color',
        'Minnesota Vikings': 'vikings-color',
        'New England Patriots': 'patriots-color',
        'New Orleans Saints': 'saints-color',
        'New York Giants': 'giants-color',
        'New York Jets': 'jets-color',
        'Philadelphia Eagles': 'eagles-color',
        'Pittsburgh Steelers': 'steelers-color',
        'San Francisco 49ers': 'FortyNiners-color',
        'Seattle Seahawks': 'seahawks-color',
        'Tampa Bay Buccaneers': 'buccaneers-color',
        'Tennessee Titans': 'titans-color',
        'Washington Commanders': 'commanders-color'
    };

    const fetchTeamsAndWeeks = async () => {
        const response = await fetch('/api/fetchTeamsAndWeeks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        return data;
    };

    const fetchGamesByFilter = async (filter) => {
        const response = await fetch('/api/fetchGamesByFilter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filter)
        });
        const data = await response.json();
        return data;
    };

    const populateDropdowns = (teams, weeks) => {
        teams.sort().forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            teamSelect.appendChild(option);
        });

        weeks.forEach(week => {
            const option = document.createElement('option');
            option.value = week;
            option.textContent = `Week ${week}`;
            weekSelect.appendChild(option);
        });
    };

    const renderGames = (games) => {
        gamesContainer.innerHTML = '';
        games.forEach(game => {
            const gameContainer = document.createElement('div');
            gameContainer.className = 'game-container';

            const teamsContainer = document.createElement('div');
            teamsContainer.className = 'teams-container';

            const awayTeamContainer = createTeamContainer(game, 'away');
            const homeTeamContainer = createTeamContainer(game, 'home');

            teamsContainer.appendChild(awayTeamContainer);
            const atSymbol = document.createElement('div');
            atSymbol.className = 'at-symbol';
            atSymbol.textContent = '@';
            teamsContainer.appendChild(atSymbol);
            teamsContainer.appendChild(homeTeamContainer);

            gameContainer.appendChild(teamsContainer);

            const commenceTime = document.createElement('div');
            commenceTime.className = 'commence-time';
            commenceTime.textContent = new Date(game.commenceTime).toLocaleString();
            gameContainer.appendChild(commenceTime);

            gamesContainer.appendChild(gameContainer);
        });
    };

    const createTeamContainer = (game, teamRole) => {
        const teamContainer = document.createElement('div');
        const teamName = teamRole === 'away' ? game.awayTeam : game.homeTeam;
        const colorClass = teamColorClasses[teamName];
        teamContainer.className = `team-container ${colorClass}`;

        const teamLogo = document.createElement('img');
        teamLogo.src = teamLogos[teamName];
        teamLogo.alt = `${teamName} logo`;
        teamLogo.className = 'team-logo';

        const teamNameDiv = document.createElement('div');


        teamContainer.appendChild(teamLogo);
        teamContainer.appendChild(teamNameDiv);

        return teamContainer;
    };

    const teamsAndWeeks = await fetchTeamsAndWeeks();
    if (teamsAndWeeks.success) {
        populateDropdowns(teamsAndWeeks.teams, teamsAndWeeks.weeks);
    }

    teamSelect.addEventListener('change', async () => {
        weekSelect.value = ''; // Reset week select
        const selectedTeam = teamSelect.value;
        const filteredGames = await fetchGamesByFilter({ team: selectedTeam });
        if (filteredGames.success) {
            renderGames(filteredGames.games);
        }
    });

    weekSelect.addEventListener('change', async () => {
        teamSelect.value = ''; // Reset team select
        const selectedWeek = weekSelect.value;
        const filteredGames = await fetchGamesByFilter({ week: selectedWeek });
        if (filteredGames.success) {
            renderGames(filteredGames.games);
        }
    });
});



document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    const poolName = urlParams.get('poolName');
    const backButton = document.querySelector('.back-button');
    
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (source === 'dashboard') {
                // You'll need to handle getting the poolName if coming from dashboard
                window.location.href = `dashboard.html?poolName=${encodeURIComponent(poolName)}`;
            } else {
                window.location.href = 'homepage.html'; // or 'index.html', whatever your homepage is called
            }
        });
    }
});