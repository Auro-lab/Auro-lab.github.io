const username = "yourusername"; // change this!
const list = document.getElementById("repo-list");

async function loadRepos() {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated`);
    const repos = await res.json();

    list.innerHTML = "";

    repos
      .filter(repo => !repo.fork)
      .forEach(repo => {
        const card = document.createElement("div");
        card.className = "repo-card";
        card.innerHTML = `
          <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
          <p>${repo.description || "No description yet."}</p>
          <small>${repo.language || ""} · ⭐ ${repo.stargazers_count}</small>
        `;
        list.appendChild(card);
      });
  } catch (err) {
    list.textContent = "Couldn't load projects right now.";
  }
}

loadRepos();