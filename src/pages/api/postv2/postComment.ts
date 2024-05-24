import getDisplayName from "@/apiUtils";
import { CommendDataV2, CommentInteractionData } from "@/components/types/Post";
import { ICurrentProviderData } from "@/components/types/User";
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
  const commentData: CommendDataV2 = {
    message: message,
    sender: sender,
    ts: ts,
  };
  return commentData;
}

async function changeCommentsArray(
  postDocPath: string,
  commendData: CommendDataV2
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
  ] = await Promise.all([
    changeCommentsArray(postDocPath, commendData),
    increaseCommentCount(postDocPath),
    updateInteractions(commentInteractionData, username),
    getProviderData(username),
  ]);

  if (
    !changeCommentsArrayResult ||
    !increaseCommentCountResult ||
    !updateInteractionsResult ||
    !providerData
  ) {
    return res.status(500).send("Internal Server Error");
  }

  sendCommentToProvider(
    username,
    providerData.providerId,
    providerData.startTime,
    postDocPath
  );

  return res.status(200).json({
    commentData: commendData,
  });
}
