const submitBtn = document.getElementById('submitBtn');
const messageDisplay = document.getElementById('message');

submitBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;

    
    //Validation
    if ((username == "") || (password == "") || (password2 == "")) {
        messageDisplay.innerText = "At least one entry was empty";
        return;
    }

    if (password !== password2) {
        messageDisplay.innerText = "Passwords do not match";
        return;
    }

});