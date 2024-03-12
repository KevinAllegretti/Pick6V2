
    const now = new Date();
    let thursdayDeadline = new Date(now);
    thursdayDeadline.setDate(now.getDate() + ((4 + 7 - now.getDay()) % 7));
    thursdayDeadline.setHours(19, 0, 0, 0); // 7 PM EST
    thursdayDeadline.setMinutes(thursdayDeadline.getMinutes() + thursdayDeadline.getTimezoneOffset());
    thursdayDeadline.setHours(thursdayDeadline.getHours() - 5); // Convert UTC to EST (UTC-5)

    // Define the end time for Tuesday 12 AM EST
    let tuesdayEndTime = new Date(now);
    tuesdayEndTime.setDate(now.getDate() + ((2 + 7 - now.getDay()) % 7));
    tuesdayEndTime.setHours(0, 0, 0, 0); // 12 AM EST
    tuesdayEndTime.setMinutes(tuesdayEndTime.getMinutes() + tuesdayEndTime.getTimezoneOffset());
    tuesdayEndTime.setHours(tuesdayEndTime.getHours() - 5); // Convert UTC to EST (UTC-5)
    
    function getLastThursday() {
        var now = new Date();
        var dayOfWeek = now.getDay(); // Day of the week (0 is Sunday)
        var daysSinceThursday;
    
        // If it's Thursday, determine whether it's before or after 7 PM
        if (dayOfWeek === 4) {
            now.setMinutes(now.getMinutes() + now.getTimezoneOffset()); // Convert to UTC
            now.setHours(now.getHours() - 5); // Assuming Eastern Standard Time (EST)
            now.setHours(19, 0, 0, 0); // Set to 7 PM on the current day
    
            var sevenPM = new Date(now);
            now = new Date(); // Reset to the current time
            
            if (now >= sevenPM) {
                // If it's past 7 PM, today is "last Thursday"
                daysSinceThursday = 0;
            } else {
                // If it's before 7 PM, last Thursday was 7 days ago
                daysSinceThursday = 7;
            }
        } else {
            // If it's not Thursday, calculate the days since last Thursday
            daysSinceThursday = dayOfWeek > 4 ? dayOfWeek - 4 : 7 - (4 - dayOfWeek);
        }
    
        // Calculate last Thursday date by subtracting the days since last Thursday
        var lastThursday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceThursday);
        lastThursday.setHours(19, 0, 0, 0); // Set to 7 PM
    
        // Adjust for daylight saving time in Eastern Time if needed
        if (isDstObserved(lastThursday)) {
            lastThursday.setHours(lastThursday.getHours() + 1); // EDT is UTC-4
        }
    
        return lastThursday;
    }
    
    // Helper function to check if DST is observed on the given date in Eastern Time
    function isDstObserved(date) {
        var jan = new Date(date.getFullYear(), 0, 1);
        var jul = new Date(date.getFullYear(), 6, 1);
        return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset()) > date.getTimezoneOffset();
    }
    
    var lastThursdayDate = getLastThursday();
    console.log(lastThursdayDate); // This will log the last Thursday at 7 PM EST/EDT
    
      
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



 // Function to calculate time remaining until next Thursday at 7 PM EST/EDT
 function getTimeRemaining() {
    const now = new Date();

    // Set the target time to 7 PM EST Thursday
    let targetTime = new Date(now);
    targetTime.setDate(now.getDate() + ((4 + 7 - now.getDay()) % 7));
    targetTime.setHours(19, 0, 0, 0); // 7 PM EST
    targetTime.setMinutes(targetTime.getMinutes() + targetTime.getTimezoneOffset()); // Convert to UTC
    targetTime.setHours(targetTime.getHours() - 5); // Convert UTC to EST (UTC-5)

    // Determine if it's Daylight Saving Time in Eastern Time Zone
    const isDst = now.dst();
    if (isDst) {
        targetTime.setHours(targetTime.getHours() + 1); // Adjust for EDT (UTC-4)
    }

    // Calculate the time remaining until the target time
    const total = targetTime - now;
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return {
        total,
        days,
        hours,
        minutes,
        seconds
    };
}

// Add a method to Date.prototype to determine if DST is in effect
Date.prototype.dst = function() {
    const jan = new Date(this.getFullYear(), 0, 1).getTimezoneOffset();
    const jul = new Date(this.getFullYear(), 6, 1).getTimezoneOffset();
    return Math.max(jan, jul) != this.getTimezoneOffset();    
};

let timeInterval; // Declare this at the top of your script or outside your functions

function initializeCountdown() {
    const countdownDisplay = document.getElementById('countdownDisplay');

    function updateCountdown() {
        const t = getTimeRemaining();

        countdownDisplay.innerHTML = 
            'Time until Pick deadline: ' +
            `${t.days} days: ` +
            `${t.hours} hours: ` +
            `${t.minutes} minutes: ` +
            `${t.seconds} seconds`;

        // If countdown finished, stop updating
        if (t.total <= 0) {
            clearInterval(timeInterval);
            countdownDisplay.innerHTML = 'Deadline passed!';
        }
    }

    // Update the countdown every second
    updateCountdown(); // Run once immediately
    timeInterval = setInterval(updateCountdown, 1000);
}

// The rest of your script...


  
  // Call initializeCountdown somewhere in your code when you want to start the timer
  // For example, in a window.onload or document.addEventListener('DOMContentLoaded', ...) handler
  initializeCountdown();
  

    const cards = document.querySelectorAll('.player-card');
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            const cardUsername = e.currentTarget.getAttribute('data-username');
            console.log("Card clicked:", cardUsername);  
            
            //comment out during play time
     
            if ((now > thursdayDeadline && now < tuesdayEndTime && cardUsername && cardUsername === loggedInUsername)) {
                console.log("Redirecting to dashboard");
                window.location.href = `/dashboard?username=${cardUsername}`;
            }
            else{
                console.log("Cannot access selection page during game hours");
            }
        
        });
    });
    


    async function pickWindowPlayerCard(){

        console.log(tuesdayEndTime);
        console.log(thursdayDeadline);
        console.log(now);
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


