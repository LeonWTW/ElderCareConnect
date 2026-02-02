const submitBtn = document.getElementById('submitBtn');
const messageDisplay = document.getElementById('message');

submitBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    
    //Validation
    if ((username == "") || (password == "")) {
        messageDisplay.innerText = "At least one entry was empty";
        return;
    }
    
    //Add another check for username username exists

    //Add another check for username/password pair is valid


    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (!response.ok) {
            messageDisplay.innerText = "Login failed";
            return;
        }

        const data = await response.json();
        if (data.user) {
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('username', data.user.username);
        }
        window.location.href = "caregiver_home.html";
    } catch (error) {
        console.error('Network error:', error);
        messageDisplay.innerText = "Unable to connect to server";
    }

});
