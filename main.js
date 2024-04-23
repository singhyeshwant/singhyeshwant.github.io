document.addEventListener('DOMContentLoaded', function() {
    fetchUserName();
});

function fetchUserName() {
    const apiUrl = 'https://6bkrr32uf0.execute-api.us-east-1.amazonaws.com/prod/user_area';
    const userEmail = sessionStorage.getItem('userEmail');

    if (!userEmail) {
        console.error('No user email available');
        document.getElementById('userName').textContent = 'No email provided';
        return;
    }

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.body) {
            const userData = JSON.parse(data.body);
            if (userData && userData.user_name) {
                document.getElementById('userName').textContent = userData.user_name;
            } else {
                throw new Error('User name not found in response');
            }
        } else {
            throw new Error('No body in response');
        }
    })
    .catch(error => {
        console.error('Error fetching user name:', error);
        document.getElementById('userName').textContent = 'Error loading user data';
    });
}

function queryMusic() {
    let title = document.getElementById('title').value;
    let year = document.getElementById('year').value;
    let artist = document.getElementById('artist').value;
    let apiUrl = 'https://6bkrr32uf0.execute-api.us-east-1.amazonaws.com/prod/query_lambda_function';

    fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title, year, artist})
    })
    .then(response => response.json())
    .then(data => {
        displayQueryResults(data);
    })
    .catch(error => console.error('Error querying music:', error));
}

function escapeHtml(string) {
    return string.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function displayQueryResults(data) {
    let resultsContainer = document.getElementById('queryResults');

    // Clearing previous results.
    resultsContainer.innerHTML = '';

    try {
        const musicData = JSON.parse(data.body);
        if (musicData.length === 0) {
            resultsContainer.textContent = 'No result is retrieved. Please query again.';
        } else {
            musicData.forEach(item => {
                // Creating the container for each music item.
                let musicDiv = document.createElement('div');
                musicDiv.className = 'musicItem';

                // Creating the image element.
                let image = document.createElement('img');
                const imageName = item.artist.replace(/ /g, '') + '.jpg'; // image name.
                const imageUrl = `https://s3994442.s3.amazonaws.com/${imageName}`;
                image.src = imageUrl;
                image.alt = 'Image of ' + item.artist;
                image.className = 'musicItemImage';

                // Creating the info container.
                let infoDiv = document.createElement('div');
                infoDiv.className = 'musicItemInfo';

                // Creating the title element.
                let title = document.createElement('h4');
                title.textContent = item.title;

                // Creating the artist paragraph.
                let artist = document.createElement('p');
                artist.textContent = 'Artist: ' + item.artist;

                // Creating the year paragraph.
                let year = document.createElement('p');
                year.textContent = 'Year: ' + item.year;

                // Creating the subscribe button.
                let button = document.createElement('button');
                button.textContent = 'Subscribe';
                button.onclick = function() {
                    subscribeMusic(item.title, item.artist, item.year);
                };

                // Appending elements to their respective containers.
                infoDiv.appendChild(title);
                infoDiv.appendChild(artist);
                infoDiv.appendChild(year);
                infoDiv.appendChild(button);

                musicDiv.appendChild(image);
                musicDiv.appendChild(infoDiv);

                resultsContainer.appendChild(musicDiv);
            });
        }
    } catch (error) {
        console.error('Error parsing music data:', error);
        resultsContainer.textContent = 'Error parsing results. Please try again.';
    }
}


function subscribeMusic(title, artist, year) {
    const apiUrl = 'https://6bkrr32uf0.execute-api.us-east-1.amazonaws.com/prod/subscribe_or_remove_lambda_function';
    const userEmail = sessionStorage.getItem('userEmail');
    const subscriptionArea = document.getElementById('subscriptionsList');
    const existingEntries = subscriptionArea.querySelectorAll('div');
    let exists = false;

    // Checking for existing subscriptions in the DOM before making the API call.
    existingEntries.forEach(entry => {
        if (entry.textContent.includes(title) && entry.textContent.includes(artist)) {
            exists = true;
        }
    });

    if (exists) {
        alert('You have already subscribed to this music.');

        // Stopping the function if the music is already subscribed.
        return;
    }

    fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: userEmail, action: 'subscribe', music_info: {title, artist, year}})
    })
    .then(response => response.json())
    .then(data => {
        const subsData = JSON.parse(data.body);
        if (subsData.result === 'success') {
            addSubscriptionToDOM(title, artist, year);
            alert('Subscribed successfully!');
        } else {
            throw new Error('Failed to subscribe');
        }
    })
    .catch(error => {
        console.error('Error subscribing to music:', error);
        alert('Error subscribing to music. Please try again.');
    });
}

function ensureTableExists() {
    const apiUrl = 'https://6bkrr32uf0.execute-api.us-east-1.amazonaws.com/prod/subscribe_or_remove_lambda_function';
    const userEmail = sessionStorage.getItem('userEmail');

    fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: userEmail, action: 'create'})
    })
    .then(response => response.json())
    .then(data => {
        console.log('Table check/creation response:', data);
        fetchSubscriptions();
    })
    .catch(error => {
        console.error('Error ensuring table exists:', error);
    });
}

// Making sure table exists when the page loads.
document.addEventListener('DOMContentLoaded', ensureTableExists);


function fetchSubscriptions() {
    let apiUrl = 'https://6bkrr32uf0.execute-api.us-east-1.amazonaws.com/prod/subscribe_or_remove_lambda_function';
    let userEmail = sessionStorage.getItem('userEmail');

    fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: userEmail, action: 'fetch'})
    })
    .then(response => response.json())
    .then(data => {

        // Making sure the 'data.body' is not undefined before parsing.
        const subsData = JSON.parse(data.body);
        if (subsData.subscriptions && subsData.subscriptions.length > 0) {

            // Clearing any previous messages.
            document.getElementById('subscriptionsList').innerHTML = '';
            subsData.subscriptions.forEach(sub => {
                addSubscriptionToDOM(sub.title, sub.artist, sub.year);
            });
        } else {
            document.getElementById('subscriptionsList').textContent = 'No subscriptions yet.';
        }
    })
    .catch(error => {
        console.error('Error fetching subscriptions:', error);
        document.getElementById('subscriptionsList').textContent = 'Failed to load subscriptions.';
    });
}

// Fetching subscriptions when the page loads.
document.addEventListener('DOMContentLoaded', fetchSubscriptions);


function removeSubscription(title, artist) {
    const apiUrl = 'https://6bkrr32uf0.execute-api.us-east-1.amazonaws.com/prod/subscribe_or_remove_lambda_function';
    const userEmail = sessionStorage.getItem('userEmail');

    fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            email: userEmail, 
            action: 'remove', 
            music_info: {title: title, artist: artist}
        })
    })
    .then(response => response.json())
    .then(data => {
        const result = JSON.parse(data.body);
        if (result.result === 'success') {

            // Removing the element from the DOM.
            removeSubscriptionFromDOM(title, artist);
            alert('Subscription removed successfully!');
        } else {
            throw new Error('Failed to remove subscription');
        }
    })
    .catch(error => {
        console.error('Error removing subscription:', error);
        alert('Error removing subscription. Please try again.');
    });
}

function removeSubscriptionFromDOM(title, artist) {
    const subscriptionArea = document.getElementById('subscriptionsList');
    let foundAndRemoved = false;

    Array.from(subscriptionArea.children).forEach(child => {
        if (child.textContent.includes(title) && child.textContent.includes(artist)) {
            subscriptionArea.removeChild(child);
            foundAndRemoved = true;
        }
    });

    if (foundAndRemoved && subscriptionArea.children.length === 0) {
        subscriptionArea.textContent = 'No subscriptions yet.';
    }
}

function addSubscriptionToDOM(title, artist, year) {
    const subscriptionArea = document.getElementById('subscriptionsList');
    const existingEntries = subscriptionArea.querySelectorAll('.musicItem');
    let exists = false;

    // Checking if the default message is displayed and clear it if it is.
    if (subscriptionArea.textContent === 'No subscriptions yet.') {
        
        // Clearing the placeholder text.
        subscriptionArea.textContent = '';
    }

    // Checking for existing subscriptions in the DOM before adding a new one.
    existingEntries.forEach(entry => {
        if (entry.textContent.includes(title) && entry.textContent.includes(artist)) {
            exists = true;
        }
    });

    if (exists) {
        alert('You have already subscribed to this music.');
        return;
    }

    // Creating the container for each music item.
    let musicDiv = document.createElement('div');
    musicDiv.className = 'musicItem';

    // Creating the image element.
    let image = document.createElement('img');
    const imageName = artist.replace(/ /g, '') + '.jpg'; // image name.
    const imageUrl = `https://s3994442.s3.amazonaws.com/${imageName}`;
    image.src = imageUrl;
    image.alt = 'Image of ' + artist;
    image.className = 'musicItemImage';

    // Creating the info container.
    let infoDiv = document.createElement('div');
    infoDiv.className = 'musicItemInfo';

    // Creating the title element.
    let titleEl = document.createElement('h4');
    titleEl.textContent = title;

    // Creating the artist paragraph.
    let artistEl = document.createElement('p');
    artistEl.textContent = 'Artist: ' + artist;

    // Creating the year paragraph.
    let yearEl = document.createElement('p');
    yearEl.textContent = 'Year: ' + year;

    // Creating the remove button.
    let button = document.createElement('button');
    button.textContent = 'Remove';
    button.onclick = function() {
        removeSubscription(title, artist);
    };

    // Appending elements to their respective containers.
    infoDiv.appendChild(titleEl);
    infoDiv.appendChild(artistEl);
    infoDiv.appendChild(yearEl);
    infoDiv.appendChild(button);

    musicDiv.appendChild(image);
    musicDiv.appendChild(infoDiv);

    subscriptionArea.appendChild(musicDiv);
}


document.getElementById('logoutLink').addEventListener('click', function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
});