import axios, { AxiosResponse } from "axios";
import { GithubRepository, GithubUser } from "../models/github";
import { storeRepos, storeUser } from "./idb-actions";

export async function fetchUser(
  accessToken: string
): Promise<GithubUser | null> {
  try {
    const response: AxiosResponse<GithubUser> = await axios.post(
      "http://localhost:3000/lists/github/user",
      { accessToken }
    );
    const user = response.data;
    await storeUser(user);
    return user;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

export async function fetchRepos(
  username: string,
  accessToken: string
): Promise<GithubRepository[]> {
  try {
    const response = await axios.post(
      `http://localhost:3000/lists/github/repos`,
      {
        accessToken,
      }
    );
    await storeRepos(username, response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return [];
  }
}

export async function createWebhook(username: string, repoName: string) {
  try {
    const data = { username, repo: repoName };
    const response = await axios.post(
      "http://localhost:3000/lists/github/create-webhook",
      data,
      { withCredentials: true }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating webhook:", error);
  }
}
