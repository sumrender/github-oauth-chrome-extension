import { openDB } from "idb";
import { GithubRepository, GithubUser } from "../models/github";

export async function addDemoData() {
  const db = await openDB("github-db", 1);
  await db.put("data", "hello", "world");
  console.log("demo data added");
}

export async function createDatabase(): Promise<void> {
  try {
    await openDB("github-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("data")) {
          db.createObjectStore("data");
          console.log("data store created");
        }
      },
    });
  } catch (error) {
    console.error("Error creating database:", error);
  }
}

export async function storeUser(
  user: GithubUser | null | undefined
): Promise<void> {
  if (!user) return;

  try {
    const db = await openDB("github-db", 1);
    await db.put("data", user, "user");
  } catch (error) {
    console.error("Error storing user data:", error);
  }
}

export async function storeRepos(
  username: string,
  repos: GithubRepository[]
): Promise<void> {
  try {
    const db = await openDB("github-db", 1);
    await db.put("data", repos, `repos_${username}`);
  } catch (error) {
    console.error("Error storing repositories:", error);
  }
}

export async function getUser(): Promise<GithubUser | undefined> {
  try {
    await createDatabase();
    const db = await openDB("github-db", 1);
    const user = await db.get("data", "user");

    return user as GithubUser | undefined;
  } catch (error) {
    console.error("Error getting user data:", error);
    return undefined;
  }
}

export async function getRepos(
  username: string
): Promise<GithubRepository[] | undefined> {
  try {
    const db = await openDB("github-db", 1);
    return db.get("data", `repos_${username}`) as Promise<
      GithubRepository[] | undefined
    >;
  } catch (error) {
    console.error("Error getting repositories:", error);
    return undefined;
  }
}
