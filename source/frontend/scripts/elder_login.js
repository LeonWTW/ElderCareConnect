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
    
    //Add another check for name, caregiver name exists

    //Add another check for username/password pair is valid


    //Redirct to account homepage
    window.location.href = "elder_home.html";

});