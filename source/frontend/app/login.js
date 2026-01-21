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


    //Redirct to account homepage
    window.location.href = "caregiver_home.html";

});