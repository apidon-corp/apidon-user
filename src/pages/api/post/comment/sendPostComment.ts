import { NextApiRequest, NextApiResponse } from "next";

import { CommentData, CommentInteractionData } from "@/components/types/Post";

import { fieldValue, firestore } from "../../../../firebase/adminApp";

import getDisplayName from "@/apiUtils";
import { INotificationServerData } from "@/components/types/User";
import AsyncLock from "async-lock";
import { v4 as uuidv4 } from "uuid";
import { sendEmailVerification } from "firebase/auth";
import { collection, increment } from "firebase/firestore";

const lock = new AsyncLock();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { comment, postDocPath } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername)
    return res.status(401).json({ error: "unauthorized" });

  if (req.method !== "POST") return res.status(405).json("Method not allowed");

  if (!comment || !operationFromUsername || !postDocPath) {
    return res.status(422).json({ error: "Invalid prop or props" });
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
    await firestore
      .doc(`${postDocPath}/comments/${operationFromUsername}`)
      .set({
        count: fieldValue.increment(1),
      });

    const createdDocumentIdForCommentOnPost = result.id;
    const createdCommentPathForPost = result.path;

    // Increase Comment Count
    await increaseCommentCount(postDocPath);

    // -----------------

    // Updating User Interactions

    // Getting Post Doc Id from Post Doc Path

    const postDocPathSeperated = (postDocPath as string).split("/");
    const postDocId = postDocPathSeperated[postDocPathSeperated.length - 1];

    console.log(postDocId);

    const commentDocPathForUserOnUser = firestore.doc(
      `users/${operationFromUsername}/personal/postInteractions/commentedPosts/${postDocId}/comments/${createdDocumentIdForCommentOnPost}`
    );

    // Create comment object to use on User
    const commentObjectForUserInteractions =
      createCommentObjectForInteraction(postDocPath);

    await commentDocPathForUserOnUser.set({
      ...commentObjectForUserInteractions,
    });

    // To make parent visible...
    await firestore
      .doc(
        `users/${operationFromUsername}/personal/postInteractions/commentedPosts/${postDocId}`
      )
      .set({
        count: fieldValue.increment(1),
      });

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
          return res.status(503).json({ error: "Firebase error" });
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
