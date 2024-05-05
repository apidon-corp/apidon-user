import { NextApiRequest, NextApiResponse } from "next";

import { CommentData, CommentInteractionData } from "@/components/types/Post";

import { fieldValue, firestore } from "../../../../firebase/adminApp";

import getDisplayName from "@/apiUtils";
import { CommentActionAPIBody } from "@/components/types/API";
import {
  CommentedPostArrayObject,
  INotificationServerData,
} from "@/components/types/User";
import AsyncLock from "async-lock";

const lock = new AsyncLock();

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { comment, postDocPath } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  if (!comment || !operationFromUsername || !postDocPath) {
    return res.status(422).send("Invalid prop or props");
  }

  await lock.acquire(`postCommentAPI-${operationFromUsername}`, async () => {
    /**
     * Comment Object to use in Database on Post.
     */
    const commentObject = createCommentObject(comment, operationFromUsername);

    // Creating Path For Comment To Use on Post, in Database.
    const commentCollectionForUserOnPost = firestore.collection(
      `${postDocPath}/comments/${operationFromUsername}/comments`
    );

    const result = await commentCollectionForUserOnPost.add({
      ...commentObject,
    });

    // To Make Main Doc (username) avaliable...

    const createdDocumentIdForCommentOnPost = result.id;
    const createdCommentPathForPost = result.path;

    // Increase Comment Count on Post Directly
    await increaseCommentCount(postDocPath);

    // Increae sub-Comment Count on Post
    const subCommentDoc = await firestore
      .doc(`${postDocPath}/comments/${operationFromUsername}`)
      .get();

    const subCommentDocExist = subCommentDoc.exists;

    if (subCommentDocExist) {
      await firestore
        .doc(`${postDocPath}/comments/${operationFromUsername}`)
        .update({
          count: fieldValue.increment(1),
        });
    } else {
      await firestore
        .doc(`${postDocPath}/comments/${operationFromUsername}`)
        .set({
          count: fieldValue.increment(1),
        });
    }

    // -----------------

    // Updating User Interactions

    // Getting Post Doc Id from Post Doc Path

    const postDocPathSeperated = (postDocPath as string).split("/");
    const postDocId = postDocPathSeperated[postDocPathSeperated.length - 1];

    const commentDocPathForUserOnUser = firestore.doc(
      `users/${operationFromUsername}/personal/postInteractions/commentedPosts/${postDocId}/comments/${createdDocumentIdForCommentOnPost}`
    );

    // Create comment object to use on User
    const commentObjectForUserInteractions =
      createCommentObjectForInteraction(postDocPath);

    await commentDocPathForUserOnUser.set({
      ...commentObjectForUserInteractions,
    });

    // Update Post Interactions
    const commentedPostsArrayObject: CommentedPostArrayObject = {
      postDocPath: postDocPath,
      timestamp: Date.now(),
    };

    const postInteractionsDoc = await firestore
      .doc(`/users/${operationFromUsername}/personal/postInteractions`)
      .get();

    if (!postInteractionsDoc.exists) {
      await postInteractionsDoc.ref.set({
        commentedPostsArray: fieldValue.arrayUnion(commentedPostsArrayObject),
      });
    } else {
      await postInteractionsDoc.ref.update({
        commentedPostsArray: fieldValue.arrayUnion(commentedPostsArrayObject),
      });
    }

    // To make parent visible...
    const mainCommentDocOnUserForInteractionExists = (
      await firestore
        .doc(
          `users/${operationFromUsername}/personal/postInteractions/commentedPosts/${postDocId}`
        )
        .get()
    ).exists;

    if (mainCommentDocOnUserForInteractionExists) {
      await firestore
        .doc(
          `users/${operationFromUsername}/personal/postInteractions/commentedPosts/${postDocId}`
        )
        .update({
          count: fieldValue.increment(1),
        });
    } else {
      await firestore
        .doc(
          `users/${operationFromUsername}/personal/postInteractions/commentedPosts/${postDocId}`
        )
        .set({
          count: fieldValue.increment(1),
        });
    }

    /**
     * Classificiaton Part
     */

    let startTime: number;
    let providerId: string;
    try {
      const currentProviderDoc = await firestore
        .doc(`users/${operationFromUsername}/provider/currentProvider`)
        .get();
      if (!currentProviderDoc.exists)
        throw new Error("User's provider doc doesn't exist.");
      startTime = currentProviderDoc.data()!.startTime;
      providerId = currentProviderDoc.data()!.name;
    } catch (error) {
      console.error("Erron while getting currentProviderDoc: ", error);
      return res.status(500).send("Internal Server Error");
    }

    const commentActionBody: CommentActionAPIBody = {
      username: operationFromUsername,
      providerId: providerId,
      startTime: startTime,
      postDocPath: postDocPath,
    };

    try {
      const response = await fetch(
        `${process.env.API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/classification/commentAction`,
        {
          method: "POST",
          headers: {
            authorization: process.env.API_KEY_BETWEEN_SERVICES as string,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...commentActionBody }),
        }
      );
      if (!response.ok)
        throw new Error(
          `Response from 'commentActionAPI' is NOT okey. Here is the message: ${await response.text()}`
        );
    } catch (error) {
      console.error(
        "Error on fetch to commentActionAPI at Provider side: ",
        error
      );
      return res.status(500).send("Internal Server Error");
    }

    // send notification
    let postSenderUsername = "";
    try {
      postSenderUsername = (await firestore.doc(postDocPath).get()).data()
        ?.senderUsername;
    } catch (error) {
      console.error("Error while like. (We were getting post sender username");
    }

    if (postSenderUsername)
      if (operationFromUsername !== postSenderUsername)
        try {
          const newcommentNotificationObject: INotificationServerData = {
            cause: "comment",
            notificationTime: Date.now(),
            seen: false,
            sender: operationFromUsername,
            commentDocPath: createdCommentPathForPost,
          };
          await firestore
            .collection(`users/${postSenderUsername}/notifications`)
            .add({
              ...newcommentNotificationObject,
            });
        } catch (error) {
          console.error(
            "Error while sending comment. (We were sending notification)",
            error
          );
          return res.status(503).send("Firebase Error");
        }

    return res
      .status(200)
      .json({ newCommentDocPath: createdCommentPathForPost });
  });
}

async function increaseCommentCount(postDocPath: string) {
  try {
    await firestore.doc(postDocPath).update({
      commentCount: fieldValue.increment(1),
    });
  } catch (error) {
    throw new Error(
      `Error while commenting from increaseComment function: ${error}`
    );
  }
}

/**
 * Creates Comment Object for 'Post'/Comments/...
 * @param comment
 * @param sender
 * @returns
 */
function createCommentObject(comment: string, sender: string) {
  const commentObjcet: CommentData = {
    comment: comment,
    commentSenderUsername: sender,
    creationTime: Date.now(),
  };
  return commentObjcet;
}

/**
 * Creates Comment Object for 'User'/Personal/Activities/Comments/...
 * @param postDocPath
 * @returns
 */
function createCommentObjectForInteraction(postDocPath: string) {
  const commentObjcet: CommentInteractionData = {
    postDocPath: postDocPath,
    creationTime: Date.now(),
  };
  return commentObjcet;
}
