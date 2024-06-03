import getDisplayName, { isWarmingRequest } from "@/apiUtils";
import {
  FrenletServerData,
  FrenletsServerData,
} from "@/components/types/Frenlet";
import { PostServerDataV2 } from "@/components/types/Post";

import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

async function getPostsDocPaths(username: string) {
  try {
    const postsSnapshot = await firestore
      .collection(`/users/${username}/posts`)
      .get();

    return postsSnapshot.docs
      .sort(
        (a, b) =>
          (b.data() as PostServerDataV2).creationTime -
          (a.data() as PostServerDataV2).creationTime
      )
      .map((d) => d.ref.path);
  } catch (error) {
    console.error(`Error while getting posts for ${username}`);
    return false;
  }
}

async function getReceviedFrenlets(username: string) {
  try {
    const receivedFrenletsSnapshot = await firestore
      .collection(`/users/${username}/frenlets/frenlets/incoming`)
      .get();
    return receivedFrenletsSnapshot.docs.map(
      (doc) => doc.data() as FrenletServerData
    );
  } catch (error) {
    console.error(`Error while getting received frenlets of ${username}`);
    return false;
  }
}

async function getSentFronlets(username: string) {
  try {
    const sentFrenletsSnapshot = await firestore
      .collection(`/users/${username}/frenlets/frenlets/outgoing`)
      .get();
    return sentFrenletsSnapshot.docs.map(
      (doc) => doc.data() as FrenletServerData
    );
  } catch (error) {
    console.error(`Error while getting sent frenlets of ${username}`);
    return false;
  }
}

async function getFrenlets(username: string) {
  const receivedFronlets = await getReceviedFrenlets(username);
  //const sentFrenlets = await getSentFronlets(username);

  if (!receivedFronlets) return false;
  //if (!sentFrenlets) return false;

  return receivedFronlets; //.concat(sentFrenlets);
}

async function getTags(username: string) {
  try {
    const frenletsDocSnapshot = await firestore
      .doc(`/users/${username}/frenlets/frenlets`)
      .get();
    if (!frenletsDocSnapshot.exists) {
      console.error("frenletsDoc doesn't exist");
      return false;
    }
    const frenletsDocData = frenletsDocSnapshot.data() as FrenletsServerData;
    if (frenletsDocData === undefined) {
      console.error("frenletsDocData is undefined");
      return false;
    }

    const tags = frenletsDocData.tags;
    return tags;
  } catch (error) {
    console.error(`Error while getting tags of ${username}`);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const isWarmingRequestResult = isWarmingRequest(req);
  if (isWarmingRequestResult) return res.status(200).send("OK");

  const { authorization } = req.headers;
  const { username } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (!username) return res.status(422).send("Invalid Prop or Props");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const postDocPaths = await getPostsDocPaths(username);
  if (!postDocPaths) return res.status(500).send("Internal Server Error");

  const [frenlets, tags] = await Promise.all([
    getFrenlets(username),
    getTags(username),
  ]);
  if (!frenlets || !tags) return res.status(500).send("Internal Server Error");

  return res
    .status(200)
    .json({ postDocPaths: postDocPaths, frenlets: frenlets, tags: tags });
}
