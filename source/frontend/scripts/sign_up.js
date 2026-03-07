const submitBtn = document.getElementById('submitBtn');
const addBtn = document.getElementById('addBtn');
const container = document.getElementById('primary-container')
const messageDisplay = document.getElementById('message');
const pinPattern = /^\d{4}$/;

let count = 0

addBtn.addEventListener('click', async () => {
    if (count !== 0) {
        const lastName = document.getElementById(`primary-${count}`)?.value.trim();
        const lastPin = document.getElementById(`primary-pin-${count}`)?.value.trim();
        if (!lastName || !lastPin) {
            messageDisplay.innerText = "Please finish the last elder entry before adding another";
            return;
        }
    }
    
    count++;
    
    const uniqueId = `primary-${count}`;
    const uniquePinId = `primary-pin-${count}`;

    const wrapper = document.createElement('fieldset');
    wrapper.className = 'input-group';
    wrapper.style.marginBottom = "10px";

    const legend = document.createElement('legend');
    legend.innerText = `Elder ${count}`;
    
    const elderLabel = document.createElement('label');
    elderLabel.setAttribute('for', uniqueId);
    elderLabel.innerText = 'Elder name';

    const elderInput = document.createElement('input');
    elderInput.type = 'text';
    elderInput.id = uniqueId;
    elderInput.name = `elder_name_${count}`;
    elderInput.placeholder = 'Enter elder name';
    elderInput.className = 'elder-name-input';

    const pinLabel = document.createElement('label');
    pinLabel.setAttribute('for', uniquePinId);
    pinLabel.innerText = '4-digit PIN';

    const pinInput = document.createElement('input');
    pinInput.type = 'password';
    pinInput.inputMode = 'numeric';
    pinInput.pattern = '\\d{4}';
    pinInput.maxLength = 4;
    pinInput.id = uniquePinId;
    pinInput.name = `elder_pin_${count}`;
    pinInput.placeholder = '1234';
    pinInput.className = 'elder-pin-input';

    wrapper.appendChild(legend);
    wrapper.appendChild(elderLabel);
    wrapper.appendChild(elderInput);
    wrapper.appendChild(pinLabel);
    wrapper.appendChild(pinInput);
    container.appendChild(wrapper);
});


submitBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;
    const email = document.getElementById('email').value;
    const elderEntries = Array.from(document.querySelectorAll('.input-group')).map(group => {
        const elderName = group.querySelector('.elder-name-input')?.value.trim() || "";
        const pin = group.querySelector('.elder-pin-input')?.value.trim() || "";
        return { elderName, pin };
    }).filter(entry => entry.elderName !== "" || entry.pin !== "");
    const elderNameKeys = elderEntries.map(entry => entry.elderName.toLowerCase());


    
    //Validation
    if ((username == "") || (password == "") || (password2 == "") || (email == "")) {
        messageDisplay.innerText = "At least one entry was empty";
        return;
    }

    if (password !== password2) {
        messageDisplay.innerText = "Passwords do not match";
        return;
    }

    if (new Set(elderNameKeys).size !== elderNameKeys.length) {
        messageDisplay.innerText = "Duplicate elder names are not allowed";
        return;
    }

    if (elderEntries.some(entry => entry.elderName === "" || entry.pin === "")) {
        messageDisplay.innerText = "Each elder entry needs both a name and a PIN";
        return;
    }

    if (elderEntries.some(entry => !pinPattern.test(entry.pin))) {
        messageDisplay.innerText = "Each elder PIN must be exactly 4 digits";
        return;
    }
    
    //Check to make sure no duplicate elder names
    //Check email is right format

    try {
        const response = await fetch('http://localhost:3002/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                eldersList: elderEntries
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Success:', data);
            if (data.user) {
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('username', username);
            }
            window.location.href = "caregiver_home.html";
        }
        else{
            const data = await response.json();
            messageDisplay.innerText = data.error;
        }

    }

    catch(error) {
        console.error('Network error:', error);
        messageDisplay.innerText = "Unable to connect to server"
        return;
    }

});
