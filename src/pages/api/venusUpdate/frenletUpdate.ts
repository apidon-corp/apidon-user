import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

const handleAuthorization = (authorization: string | undefined) => {
  const updateAPIKey = process.env.VENUS_UPDATE_KEY;
  if (!updateAPIKey) return false;

  if (!authorization) return false;

  return updateAPIKey === authorization;
};

async function getAllUsers() {
  try {
    const usersCollectionQuery = await firestore.collection("/usernames").get();

    const allUsernames = usersCollectionQuery.docs.map((u) => u.id);
    return allUsernames;
  } catch (error) {
    console.error("Error on getting all users: \n", error);
    return false;
  }
}

async function addFrenscoreToUserDoc(username: string) {
  try {
    const userDocRef = firestore.doc(`/users/${username}`);

    await userDocRef.update({
      frenScore: 0,
    });
    return true;
  } catch (error) {
    console.error("Error while adding fren score: \n", error);
    return false;
  }
}

async function handleFrenscoreUpdate(users: string[]) {
  try {
    await Promise.all(users.map((u) => addFrenscoreToUserDoc(u)));
    return true;
  } catch (error) {
    console.error(
      "Error while executing addFrenscoreToUserDoc promises...: \n",
      error
    );
    return false;
  }
}

async function createFrenletsDocAndTagsArray(username: string) {
  try {
    await firestore.doc(`/users/${username}/frenlets/frenlets`).set({
      tags: ["general"],
    });
    return true;
  } catch (error) {
    console.error(
      "Error while creating frenlets doc and tags array: \n",
      error
    );
    return false;
  }
}

async function handleFrenletsDocUpdate(users: string[]) {
  try {
    await Promise.all(users.map((u) => createFrenletsDocAndTagsArray(u)));
    return true;
  } catch (error) {
    console.error(
      "Error while executing createFrenletsDocAndTagsArray promises...: \n",
      error
    );
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  const authResult = handleAuthorization(authorization);
  if (!authResult) return res.status(401).send("Unauthorized");

  console.log("Frenlet Update Started....");

  console.log("----------------");

  console.log("Getting all users....");
  const allUsers = await getAllUsers();
  if (!allUsers) return res.status(500).send("Internal Server Error");
  console.log("Getting all users done.");

  console.log("----------------");

  console.log("Adding frenscore to all users....");
  const handleFrenscoreUpdateResult = await handleFrenscoreUpdate(allUsers);
  if (!handleFrenscoreUpdateResult)
    return res.status(500).send("Internal Server Error");
  console.log("Adding frenscore to all users done.");

  console.log("----------------");

  console.log("Creating frenlets doc for all users....");
  const handleFrenletsDocUpdateResult = await handleFrenletsDocUpdate(allUsers);
  if (!handleFrenletsDocUpdateResult)
    return res.status(500).send("Internal Server Error");
  console.log("Creating frenlets doc for all users done.");

  console.log("----------------");

  console.log("Frenlet Update is done.");

  return res.status(200).send("OK");
}
