const submitBtn = document.getElementById('submitBtn');
const addBtn = document.getElementById('addBtn');
const container = document.getElementById('primary-container')
const messageDisplay = document.getElementById('message');

let count = 0

addBtn.addEventListener('click', async () => {
    if(count != 0){
        const lastId = `primary-${count}`;
        const last = document.getElementById(lastId).value;
        if(last == ""){
            messageDisplay.innerText = "Please fill empty Primary input before adding another";
            return;
        }
    }
    
    count++;
    
    // Create a unique ID for accessibility
    const uniqueId = `primary-${count}`;

    // Create the wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group'; // Better for styling than inline styles
    wrapper.style.marginBottom = "10px";

    // Create the label linked to the input ID
    const label = document.createElement('label');
    label.setAttribute('for', uniqueId);
    label.innerText = `Primary ${count}: `;
    
    // Create the input
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.id = uniqueId;
    newInput.name = `primary_${count}`; // Good for form data
    newInput.placeholder = `Enter primary info #${count}`;
    newInput.className = 'dynamic-input';

    // Assemble and inject
    wrapper.appendChild(label);
    wrapper.appendChild(newInput);
    container.appendChild(wrapper);
});


submitBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;
    const email = document.getElementById('email').value;
    const elderList = Array.from(document.querySelectorAll('.dynamic-input'))
    .map(input => input.value.trim())
    .filter(val => val !== "");


    
    //Validation
    if ((username == "") || (password == "") || (password2 == "") || (email == "")) {
        messageDisplay.innerText = "At least one entry was empty";
        return;
    }

    if (password !== password2) {
        messageDisplay.innerText = "Passwords do not match";
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
                eldersList: elderList
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
