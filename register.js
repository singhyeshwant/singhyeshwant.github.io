function register() {
    var email = document.getElementById('email').value;
    var user_name = document.getElementById('user_name').value;
    var password = document.getElementById('password').value;
    var apiGatewayUrl = 'https://xo1kjp81o3.execute-api.us-east-1.amazonaws.com/prod/register';

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showNotification('Please enter a valid email address', true);
        return;
    }

    fetch(apiGatewayUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: email, user_name: user_name, password: password})
    })
    .then(response => response.json())
    .then(data => {
        var responseData = JSON.parse(data.body);
        if (responseData.userExists) {
            showNotification('The email already exists', true);
        } else {
            showNotification('Registration successful! Redirecting...', false);
            setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('There was a problem with the registration process', true);
    });
}

function showNotification(message, isError) {
    var notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.backgroundColor = isError ? '#f44336' : '#4CAF50'; // Red for error, green for success.
    notification.style.display = 'block';

    setTimeout(() => {
        notification.classList.add('fadeOut');
        setTimeout(() => { 
            notification.style.display = 'none'; 
            notification.classList.remove('fadeOut');
        }, 2000);
    }, 3000);
}
