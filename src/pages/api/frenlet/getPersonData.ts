import getDisplayName, { isWarmingRequest } from "@/apiUtils";
import { UserInServer } from "@/components/types/User";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

async function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to getPersonData API.");
    return false;
  }

  const operationFromUsername = await getDisplayName(key);
  if (!operationFromUsername) return false;

  return operationFromUsername;
}

function checkProps(username: string) {
  if (!username) return false;
  return true;
}

async function getPersonData(username: string) {
  try {
    const userDocSnapshot = await firestore.doc(`/users/${username}`).get();
    if (!userDocSnapshot.exists) return false;

    const userDocData = userDocSnapshot.data() as UserInServer;
    if (userDocData === undefined) return false;

    return userDocData;
  } catch (error) {
    console.error("Error while getting user data: \n", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const isWarmingRequestResult = isWarmingRequest(req);
  if (isWarmingRequestResult) return res.status(200).send("OK");
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { authorization } = req.headers;
  const { username } = req.body;

  const authorizationResult = await handleAuthorization(authorization);
  if (!authorizationResult) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(username);
  if (!checkPropsResult) return res.status(422).send("Invalid Request");

  const personData = await getPersonData(username);
  return res.status(200).json({
    personData: personData,
  });
}
