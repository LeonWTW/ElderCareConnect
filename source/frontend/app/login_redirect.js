const elderBtn = document.getElementById('elderBtn');
const caregiverBtn = document.getElementById('caregiverBtn');

elderBtn.addEventListener('click', async () => {

    // Redirct to account login page
    window.location.href = "elder_login.html";
});

caregiverBtn.addEventListener('click', async () => {

    // Redirct to account login page
    window.location.href = "login.html";
    
});

