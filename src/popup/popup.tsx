import React, { useEffect, useState } from "react";
import "./popup.css";
import { fetchRepos, fetchUser } from "../actions/api-actions";
import { GithubRepository, GithubUser } from "../models/github";
import { getRepos, getUser } from "../actions/idb-actions";

const Popup = () => {
  const [user, setUser] = useState<GithubUser | null | undefined>();
  const [repos, setRepos] = useState<GithubRepository[]>([]);
  const [accessToken, setAccessToken] = useState<string | undefined>();

  useEffect(() => {
    async function fetchData() {
      console.log("fetching user");
      const userFromIDB = await getUser();
      console.log("userfromidb: ", userFromIDB);
      if (userFromIDB) {
        setUser(userFromIDB);
        const repoFromIDB = await getRepos(userFromIDB.login);
        if (repoFromIDB) setRepos(repoFromIDB);
      } else {
        if (!accessToken) {
          setUser(null);
          return;
        }
        const userData = await fetchUser(accessToken);
        setUser(userData);

        if (userData) {
          const reposData = await fetchRepos(userData.login, accessToken);
          setRepos(reposData);
        }
      }
    }

    fetchData();
  }, [accessToken]);

  useEffect(() => {
    const source = new EventSource(`http://localhost:3000/lists/github/events`);

    source.addEventListener("open", () => {
      console.log("SSE opened!");
    });

    source.addEventListener("message", (e) => {
      const data = JSON.parse(e.data);
      const message = `pushed to repo: ${data.repository.name} by ${data.pusher.name}`;
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.jpg",
        title: "github extension",
        message,
      });
    });

    source.addEventListener("error", (e) => {
      console.error("Error: ", e);
    });

    return () => {
      alert("closed the extension");
      source.close();
    };
  }, []);

  async function handleLogin() {
    const clientId = "753bb6e221d65be5b88a";
    const redirectUri = encodeURIComponent(
      "http://localhost:3000/lists/github/callback"
    );
    const scope = encodeURIComponent("repo");
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    chrome.identity.launchWebAuthFlow(
      {
        url,
        interactive: true,
      },
      function (redirectUrl: string) {
        const urlParams = new URLSearchParams(redirectUrl.split("?")[1]);
        const token = urlParams.get("token");
        setAccessToken(token);
      }
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-8 mt-4">Github OAuth</h1>

      {user === null ? (
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Login with GitHub
        </button>
      ) : (
        <>
          {user ? (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Welcome, {user.login}
                </h2>
                <img
                  src={user.avatar_url}
                  className="mx-auto mb-4 rounded-full"
                  width={"100px"}
                  alt="Avatar"
                />
                <p className="mb-2">
                  <span className="font-bold">Name:</span> {user.name}
                </p>
                <p className="mb-2">
                  <span className="font-bold">Followers:</span> {user.followers}
                </p>
                <p className="mb-2">
                  <span className="font-bold">User Repos:</span>{" "}
                  {user.public_repos}
                </p>
                <h3 className="text-xl font-bold mt-6">
                  Repos ({repos.length})
                </h3>
                <ul className="list-disc ml-8">
                  {repos.map((repo) => {
                    return (
                      <li key={repo.id} className="mb-2">
                        {repo.name}{" "}
                        {repo.private ? (
                          <span className="text-red-600">private</span>
                        ) : (
                          <span className="text-green-600">public</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center mt-8">
              <p className="text-xl font-bold">Loading...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Popup;
