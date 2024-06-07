import getDisplayName, { isWarmingRequest } from "@/apiUtils";
import {
  CommentDataV2,
  CommentInteractionData,
  PostServerDataV2,
} from "@/components/types/Post";
import {
  ICurrentProviderData,
  NotificationData,
} from "@/components/types/User";
import { fieldValue, firestore } from "@/firebase/adminApp";
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

function checkProps(postDocPath: string, message: string) {
  if (!postDocPath || !message) {
    console.error("Both postDocPath and message is undefined.");
    return false;
  }

  return true;
}

function createCommentData(message: string, sender: string, ts: number) {
  const commentData: CommentDataV2 = {
    message: message,
    sender: sender,
    ts: ts,
  };
  return commentData;
}

async function changeCommentsArray(
  postDocPath: string,
  commendData: CommentDataV2
) {
  try {
    const postDocRef = firestore.doc(postDocPath);
    await postDocRef.update({
      comments: fieldValue.arrayUnion(commendData),
    });
    return true;
  } catch (error) {
    console.error("Error while changing comments array");
    return false;
  }
}

async function increaseCommentCount(postDocPath: string) {
  try {
    const postDocRef = firestore.doc(postDocPath);
    await postDocRef.update({
      commentCount: fieldValue.increment(1),
    });
    return true;
  } catch (error) {
    console.error("Error while increasing comment count");
    return false;
  }
}

function createCommentInteractionData(postDocPath: string, ts: number) {
  const commentInteractionData: CommentInteractionData = {
    postDocPath: postDocPath,
    creationTime: ts,
  };
  return commentInteractionData;
}

async function updateInteractions(
  commentInteractionData: CommentInteractionData,
  username: string
) {
  try {
    const postInteractionsDoc = firestore.doc(
      `/users/${username}/personal/postInteractions`
    );
    await postInteractionsDoc.update({
      commentedPostsArray: fieldValue.arrayUnion(commentInteractionData),
    });
    return true;
  } catch (error) {
    console.error("Error while updating interactions");
    return false;
  }
}

async function sendNotification(
  username: string,
  postDocPath: string,
  ts: number
) {
  try {
    const postDocSnapshot = await firestore.doc(postDocPath).get();
    if (!postDocSnapshot.exists) return false;

    const postDocData = postDocSnapshot.data() as PostServerDataV2;
    if (!postDocData) return false;

    const postSender = postDocData.senderUsername;
    if (!postSender) return false;

    if (username === postSender) return true;

    const notificationObject: NotificationData = {
      cause: "comment",
      postDocPath: postDocPath,
      ts: ts,
      sender: username,
    };

    const notificationDocRef = firestore.doc(
      `/users/${postSender}/notifications/notifications`
    );

    await notificationDocRef.update({
      notifications: fieldValue.arrayUnion(notificationObject),
    });

    return true;
  } catch (error) {
    console.error("Error while sending notification");
    return false;
  }
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

async function sendCommentToProvider(
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

  try {
    const response = await fetch(
      `${process.env.API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/classification/commentAction`,
      {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          providerId: providerId,
          startTime: startTime,
          postDocPath: postDocPath,
        }),
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const isWarmingRequestResult = isWarmingRequest(req);
  if (isWarmingRequestResult) return res.status(200).send("OK");

  const { authorization } = req.headers;
  const { message, postDocPath } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(postDocPath, message);
  if (!checkPropsResult) return res.status(422).send("Invalid Request");

  const commendData = createCommentData(message, username, Date.now());
  const commentInteractionData = createCommentInteractionData(
    postDocPath,
    commendData.ts
  );

  const [
    changeCommentsArrayResult,
    increaseCommentCountResult,
    updateInteractionsResult,
    providerData,
    sendNotificationResult,
  ] = await Promise.all([
    changeCommentsArray(postDocPath, commendData),
    increaseCommentCount(postDocPath),
    updateInteractions(commentInteractionData, username),
    getProviderData(username),
    sendNotification(username, postDocPath, commendData.ts),
  ]);

  if (
    !changeCommentsArrayResult ||
    !increaseCommentCountResult ||
    !updateInteractionsResult ||
    !providerData ||
    !sendNotificationResult
  ) {
    return res.status(500).send("Internal Server Error");
  }

  sendCommentToProvider(
    username,
    providerData.providerId,
    providerData.startTime,
    postDocPath
  );

  await delay(500);

  return res.status(200).json({
    commentData: commendData,
  });
}
