import getDisplayName, { isWarmingRequest } from "@/apiUtils";
import { PostServerDataV2 } from "@/components/types/Post";
import { bucket, fieldValue, firestore } from "@/firebase/adminApp";

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

function checkProps(postDocPath: string) {
  if (!postDocPath) {
    console.error("postDocPath is undefined to delete.");
    return false;
  }
  return true;
}

async function checkCanDeletePost(postDocPath: string, username: string) {
  try {
    const postDocSnapshot = await firestore.doc(postDocPath).get();

    if (!postDocSnapshot.exists) {
      console.error("postDoc doesn't exist");
      return false;
    }

    const postDocData = postDocSnapshot.data() as PostServerDataV2;

    if (!postDocData) {
      console.error("postDocData is undefined");
      return false;
    }

    return {
      postServerData: postDocData,
      canDelete: postDocData.senderUsername === username,
    };
  } catch (error) {
    console.error("Error while checking can delete post", error);
    return false;
  }
}

async function deleteStoredFiles(
  postId: string,
  username: string,
  postDocData: PostServerDataV2
) {
  if (postDocData.image.length === 0 && !postDocData.nftStatus.convertedToNft)
    return true;

  try {
    const postFilesPath = `users/${username}/postFiles/${postId}`;
    await bucket.deleteFiles({
      prefix: postFilesPath + "/",
    });
    return true;
  } catch (error) {
    console.error("Error while deleting stored files", error);
    return false;
  }
}

async function decreaseNFTCount(
  username: string,
  postServerData: PostServerDataV2
) {
  if (!postServerData.nftStatus.convertedToNft) return true;

  try {
    const userDocRef = firestore.doc(`/users/${username}`);
    await userDocRef.update({
      nftCount: fieldValue.increment(-1),
    });
    return true;
  } catch (error) {
    console.error("Error while decreasing nft count", error);
    return false;
  }
}

async function deleteNFTDoc(postServerData: PostServerDataV2) {
  if (!postServerData.nftStatus.convertedToNft) return true;
  if (!postServerData.nftStatus.nftDocPath) return true;

  try {
    const nftDocRef = firestore.doc(postServerData.nftStatus.nftDocPath);

    await nftDocRef.delete();

    return true;
  } catch (error) {
    console.error("Error while deleting nft doc", error);
    return false;
  }
}

async function deletePostDoc(postDocPath: string) {
  try {
    const postDocRef = firestore.doc(postDocPath);

    await postDocRef.delete();

    return true;
  } catch (error) {
    console.error("Error while deleting post doc", error);
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
  const { postDocPath } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("UnAuthorized");

  const checkPropsResult = checkProps(postDocPath);
  if (!checkPropsResult) return res.status(422).send("Invalid prop");

  const checkCanDeleteResult = await checkCanDeletePost(postDocPath, username);
  if (!checkCanDeleteResult) return res.status(401).send("UnAuthorized");
  if (!checkCanDeleteResult.canDelete) return res.status(403).send("Forbidden");

  const postData = checkCanDeleteResult.postServerData;

  const [
    deleteStoredFilesResult,
    decreaseNFTCountResult,
    deleteNFTDocResult,
    deletePostDocResult,
  ] = await Promise.all([
    deleteStoredFiles(postData.id, username, postData),
    decreaseNFTCount(username, postData),
    deleteNFTDoc(postData),
    deletePostDoc(`/users/${username}/posts/${postData.id}`),
  ]);

  if (
    !deleteStoredFilesResult ||
    !decreaseNFTCountResult ||
    !deleteNFTDocResult ||
    !deletePostDocResult
  ) {
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("OK");
}
