import getDisplayName from "@/apiUtils";
import { LikeDataV2, PostServerDataV2 } from "@/components/types/Post";
import { fieldValue, firestore } from "@/firebase/adminApp";
import AsyncLock from "async-lock";
import { NextApiRequest, NextApiResponse } from "next";

async function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to sendReply API.");
    return false;
  }

  const operationFromUsername = await getDisplayName(key);
  if (!operationFromUsername) return false;

  return operationFromUsername;
}

function checkProps(postDocPath: string, action: string) {
  if (!postDocPath || !action) {
    console.error("Both postDocPath and action is undefined.");
    return false;
  }

  if (!(action == "like" || action === "delike")) {
    console.error("Invalid action");
    return false;
  }

  return true;
}

async function getLikeStatus(username: string, postDocPath: string) {
  try {
    const postDocSnapshot = await firestore.doc(postDocPath).get();
    if (!postDocSnapshot.exists) {
      console.error("Post doc not found");
      return false;
    }

    const postDocData = postDocSnapshot.data() as PostServerDataV2;

    if (postDocData === undefined) {
      console.error("Post doc data is undefined");
      return false;
    }

    const likedUsers = postDocData.likes.map((like) => like.sender);

    return {
      alreadyLiked: likedUsers.includes(username),
      likeObject: postDocData.likes.find((like) => like.sender === username),
    };
  } catch (error) {
    console.error("Error while getting like status");
    return false;
  }
}

async function changeLikeCount(postDocPath: string, action: "like" | "delike") {
  try {
    const postDocRef = firestore.doc(postDocPath);
    postDocRef.update({
      likeCount: fieldValue.increment(action === "like" ? 1 : -1),
    });
    return true;
  } catch (error) {
    console.error("Error while changing like count");
    return false;
  }
}

async function changeLikesArray(
  postDocPath: string,
  action: "like" | "delike",
  likeObject: LikeDataV2
) {
  try {
    const postDocRef = firestore.doc(postDocPath);

    await postDocRef.update({
      likes:
        action === "like"
          ? fieldValue.arrayUnion(likeObject)
          : fieldValue.arrayRemove(likeObject),
    });

    return true;
  } catch (error) {
    console.error("Error while changing likes array");
    return false;
  }
}

async function like(
  postDocPath: string,
  alreadyLiked: boolean,
  username: string
) {
  if (alreadyLiked) return false;

  const [changeLikeCountResult, changeLikesArrayResult] = await Promise.all([
    changeLikeCount(postDocPath, "like"),
    changeLikesArray(postDocPath, "like", {
      sender: username,
      ts: Date.now(),
    }),
  ]);

  if (!changeLikeCountResult || !changeLikesArrayResult) return false;

  return true;
}

async function delike(
  postDocPath: string,
  alreadyLiked: boolean,
  likeObject: LikeDataV2 | undefined
) {
  if (!alreadyLiked) return false;
  if (!likeObject) return false;

  const [changeLikeCountResult, changeLikesArrayResult] = await Promise.all([
    changeLikeCount(postDocPath, "delike"),
    changeLikesArray(postDocPath, "delike", likeObject),
  ]);

  if (!changeLikeCountResult || !changeLikesArrayResult) return false;

  return true;
}

const lock = new AsyncLock();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { authorization } = req.headers;
  const { postDocPath, action } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(postDocPath, action);
  if (!checkPropsResult) return res.status(422).send("Invalid Request");

  try {
    await lock.acquire(username, async () => {
      const likeStatus = await getLikeStatus(username, postDocPath);
      if (!likeStatus) return res.status(500).send("Internal Server Error");

      if (action === "like") {
        const likeResult = await like(
          postDocPath,
          likeStatus.alreadyLiked,
          username
        );
        if (!likeResult) return res.status(500).send("Internal Server Error");
        return res.status(200).send("OK");
      }

      if (action === "delike") {
        const delikeResult = await delike(
          postDocPath,
          likeStatus.alreadyLiked,
          likeStatus.likeObject
        );
        if (!delikeResult) return res.status(500).send("Internal Server Error");
        return res.status(200).send("OK");
      }

      return res.status(422).send("Invalid Request");
    });
  } catch (error) {
    console.error("Error on acquiring lock for like operation: \n", error);
    return res.status(500).send("Internal Server Error");
  }
}
