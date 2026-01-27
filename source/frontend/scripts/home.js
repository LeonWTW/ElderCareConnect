const apiTestBtn = document.getElementById("apiTestBtn");
const apiStatus = document.getElementById("apiStatus");

apiTestBtn.addEventListener("click", async () => {
  apiStatus.textContent = "Checking...";
  try {
    const res = await fetch("http://localhost:3001/health");
    if (!res.ok) throw new Error("Bad response");
    const data = await res.json();
    apiStatus.textContent = data.ok ? "API is up" : "API down";
  } catch (err) {
    apiStatus.textContent = "API unreachable";
  }
});
