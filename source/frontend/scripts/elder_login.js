const submitBtn = document.getElementById('submitBtn');
const forgotPinBtn = document.getElementById('forgotPinBtn');
const messageDisplay = document.getElementById('message');

async function readApiResponse(response) {
    const raw = await response.text();
    if (!raw) {
        return {};
    }
    try {
        return JSON.parse(raw);
    } catch {
        return { error: `Server returned ${response.status} (${response.statusText})` };
    }
}

submitBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    const caregiver_name = document.getElementById('caregiver').value.trim();
    const pin = document.getElementById('pin').value.trim();

    
    //Validation
    if ((username == "") || (caregiver_name == "") || (pin == "")) {
        messageDisplay.style.color = 'red';
        messageDisplay.innerText = "At least one entry was empty";
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3002/api/auth/elderLogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                elderName: username,
                caregiverName: caregiver_name,
                pin
            })
        });

        if (!response.ok) {
            const data = await readApiResponse(response);
            messageDisplay.style.color = 'red';
            messageDisplay.innerText = data.error || "Unable to link elder to caregiver";
            return;
        }

        const data = await readApiResponse(response);
        localStorage.setItem('elderName', data.elderName);
        localStorage.setItem('caregiverId', data.caregiverId);

        window.location.href = "elder_home.html";
    } catch (error) {
        console.error('Network error:', error);
        messageDisplay.style.color = 'red';
        messageDisplay.innerText = "Unable to connect to server";
        return;
    }

});

forgotPinBtn.addEventListener('click', async () => {
    const elderName = document.getElementById('username').value.trim();
    const caregiverName = document.getElementById('caregiver').value.trim();

    if (!elderName || !caregiverName) {
        messageDisplay.style.color = 'red';
        messageDisplay.innerText = "Enter your name and caregiver name first";
        return;
    }

    try {
        const response = await fetch('http://localhost:3002/api/auth/elderForgotPin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                elderName,
                caregiverName
            })
        });

        const data = await readApiResponse(response);
        if (!response.ok) {
            messageDisplay.style.color = 'red';
            messageDisplay.innerText = data.error || "Unable to send PIN request.";
            return;
        }

        messageDisplay.style.color = '#097969';
        messageDisplay.innerText = data.message || "PIN request sent to caregiver";
    } catch (error) {
        console.error('Network error:', error);
        messageDisplay.style.color = 'red';
        messageDisplay.innerText = "Unable to connect to server";
    }
});
