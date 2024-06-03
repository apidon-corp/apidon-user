import getDisplayName, { handleServerWarm } from "@/apiUtils";
import { PostLikeActionAPIBody } from "@/components/types/API";
import { LikeDataV2, PostServerDataV2 } from "@/components/types/Post";
import {
  ICurrentProviderData,
  NotificationData,
  LikedPostArrayObject,
} from "@/components/types/User";
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
      postDocData: postDocData,
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

async function updatePostInteractions(
  username: string,
  likeObject: LikeDataV2,
  postDocPath: string,
  action: "like" | "delike"
) {
  const likeDataForInteraction: LikedPostArrayObject = {
    postDocPath: postDocPath,
    timestamp: likeObject.ts,
  };

  try {
    const postInteractionsDoc = firestore.doc(
      `users/${username}/personal/postInteractions`
    );

    await postInteractionsDoc.update({
      likedPostsArray:
        action === "like"
          ? fieldValue.arrayUnion(likeDataForInteraction)
          : fieldValue.arrayRemove(likeDataForInteraction),
    });

    return true;
  } catch (error) {
    console.error("Error while updating post interactions");
    return false;
  }
}

async function updateNotification(
  username: string,
  postSender: string,
  ts: number,
  action: "like" | "delike"
) {
  // There is no need to send notification to the post sender
  if (username === postSender) return true;

  const notificationData: NotificationData = {
    cause: "like",
    ts: ts,
    sender: username,
  };

  try {
    const notificationDoc = firestore.doc(
      `/users/${postSender}/notifications/notifications`
    );

    if (action === "like") {
      await notificationDoc.update({
        notifications: fieldValue.arrayUnion(notificationData),
      });

      return true;
    }

    if (action === "delike") {
      await notificationDoc.update({
        notifications: fieldValue.arrayRemove(notificationData),
      });

      return true;
    }

    return true;
  } catch (error) {}
}

async function getProviderData(username: string) {
  try {
    const providerDocSnaphot = await firestore
      .doc(`/users/${username}/provider/currentProvider`)
      .get();

    if (!providerDocSnaphot.exists) {
      console.error("Provider doc does not exist");
      return false;
    }

    const providerDocData = providerDocSnaphot.data() as ICurrentProviderData;
    if (providerDocData === undefined) {
      console.error("Provider doc data is undefined");
      return false;
    }

    return {
      startTime: providerDocData.startTime,
      providerId: providerDocData.name,
    };
  } catch (error) {
    console.error("Error while getting provider data");
    return false;
  }
}

async function sendLikeToProvider(
  username: string,
  providerId: string,
  startTime: number,
  postDocPath: string
) {
  const apiKey = process.env.API_KEY_BETWEEN_SERVICES;
  if (!apiKey) {
    console.error("API key is undefined");
    return false;
  }

  const likeActionBody: PostLikeActionAPIBody = {
    username: username,
    providerId: providerId,
    startTime: startTime,
    postDocPath: postDocPath,
  };

  try {
    const response = await fetch(
      `${process.env.API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/classification/likeAction`,
      {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...likeActionBody }),
        keepalive: true,
      }
    );

    if (!response.ok) {
      console.error(
        `commentAction from provider API side's response not okay: ${await response.text()} `
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error while sending comment to provider");
    return false;
  }
}

async function like(
  postDocPath: string,
  alreadyLiked: boolean,
  username: string,
  postSender: string
) {
  if (alreadyLiked) return false;

  const likeObject: LikeDataV2 = {
    sender: username,
    ts: Date.now(),
  };

  const [
    changeLikeCountResult,
    changeLikesArrayResult,
    updatePostInteractionsResult,
    updateNotificationResult,
    getProviderDataResult,
  ] = await Promise.all([
    changeLikeCount(postDocPath, "like"),
    changeLikesArray(postDocPath, "like", likeObject),
    updatePostInteractions(username, likeObject, postDocPath, "like"),
    updateNotification(username, postSender, likeObject.ts, "like"),
    getProviderData(username),
  ]);

  if (
    !changeLikeCountResult ||
    !changeLikesArrayResult ||
    !updatePostInteractionsResult ||
    !updateNotificationResult ||
    !getProviderDataResult
  )
    return false;

  sendLikeToProvider(
    username,
    getProviderDataResult.providerId,
    getProviderDataResult.startTime,
    postDocPath
  );

  await delay(500);

  return true;
}

async function delike(
  postDocPath: string,
  alreadyLiked: boolean,
  likeObject: LikeDataV2 | undefined,
  postSender: string
) {
  if (!alreadyLiked) return false;
  if (!likeObject) return false;

  const [
    changeLikeCountResult,
    changeLikesArrayResult,
    updatePostInteractionsResult,
    updateNotificationResult,
  ] = await Promise.all([
    changeLikeCount(postDocPath, "delike"),
    changeLikesArray(postDocPath, "delike", likeObject),
    updatePostInteractions(
      likeObject.sender,
      likeObject,
      postDocPath,
      "delike"
    ),
    updateNotification(likeObject.sender, postSender, likeObject.ts, "delike"),
  ]);

  if (
    !changeLikeCountResult ||
    !changeLikesArrayResult ||
    !updatePostInteractionsResult ||
    !updateNotificationResult
  )
    return false;

  return true;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const lock = new AsyncLock();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  handleServerWarm(req, res);
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
          username,
          likeStatus.postDocData.senderUsername
        );
        if (!likeResult) return res.status(500).send("Internal Server Error");
        return res.status(200).send("OK");
      }

      if (action === "delike") {
        const delikeResult = await delike(
          postDocPath,
          likeStatus.alreadyLiked,
          likeStatus.likeObject,
          likeStatus.postDocData.senderUsername
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
