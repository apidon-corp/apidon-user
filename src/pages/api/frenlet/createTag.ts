import getDisplayName, { handleServerWarm } from "@/apiUtils";
import { fieldValue, firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

async function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to integrateModel API.");
    return false;
  }

  const operationFromUsername = await getDisplayName(key);
  if (!operationFromUsername) return false;

  return operationFromUsername;
}

function checkProps(tag: string) {
  if (!tag) {
    console.error("Tag is undefined.");
    return false;
  }

  if (tag.length > 10 || tag.length === 0 || tag.includes(" ")) return false;

  return true;
}

async function createTag(tag: string, username: string) {
  try {
    const frenletsDoc = firestore.doc(`/users/${username}/frenlets/frenlets`);
    await frenletsDoc.update({
      tags: fieldValue.arrayUnion(tag),
    });
    return true;
  } catch (error) {
    console.error("Error while creating tag: \n", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  handleServerWarm(req, res);

  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { authorization } = req.headers;
  const { tag } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(tag);
  if (!checkPropsResult) return res.status(500).send("Internal Server Error");

  const createTagResult = await createTag(tag, username);
  if (!createTagResult) return res.status(500).send("Internal Server Error");

  return res.status(200).send("OK");
}
