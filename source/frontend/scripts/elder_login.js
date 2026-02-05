const submitBtn = document.getElementById('submitBtn');
const messageDisplay = document.getElementById('message');

submitBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const caregiver_name = document.getElementById('caregiver').value;

    
    //Validation
    if ((username == "") || (caregiver_name == "")) {
        messageDisplay.innerText = "At least one entry was empty";
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/auth/elderLogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                elderName: username,
                caregiverName: caregiver_name
            })
        });

        if (!response.ok) {
            const data = await response.json();
            messageDisplay.innerText = data.error || "Unable to link elder to caregiver";
            return;
        }

        const data = await response.json();
        localStorage.setItem('elderName', data.elderName);
        localStorage.setItem('caregiverId', data.caregiverId);

        window.location.href = "elder_home.html";
    } catch (error) {
        console.error('Network error:', error);
        messageDisplay.innerText = "Unable to connect to server";
        return;
    }

});
