import getDisplayName from "@/apiUtils";
import AsyncLock from "async-lock";
import { NextApiRequest, NextApiResponse } from "next";

import { fieldValue, firestore } from "../../../../firebase/adminApp";

const lock = new AsyncLock();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { commentDocPathOnPost, postDocPath } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername)
    return res.status(401).json({ error: "unauthorized" });

  if (req.method !== "POST") return res.status(405).json("Method not allowed");

  if (!commentDocPathOnPost || !postDocPath) {
    return res.status(422).json({ error: "Invalid prop or props" });
  }

  await lock.acquire(`postCommentDelete-${operationFromUsername}`, async () => {
    // Check if we are owner of comment
    let isOwner = false;
    try {
      isOwner = await isOwnerOfComment(
        commentDocPathOnPost,
        operationFromUsername
      );
    } catch (error) {
      console.error(
        "Error while deleting comment from 'isOwner' function",
        error
      );
      return res.status(503).json({ error: "Firebase error" });
    }

    if (!isOwner) {
      console.error("Not owner of the comment");
      return res.status(522).json({ error: "Not-Owner" });
    }

    try {
      // Deleting Comment Object On Post
      await firestore.doc(commentDocPathOnPost).delete();
    } catch (error) {
      console.error("ERROR-1", error);
    }

    // Decremeant Comment Count on Post
    try {
      await firestore.doc(postDocPath).update({
        commentCount: fieldValue.increment(-1),
      });
    } catch (error) {
      console.error("ERROR-2", error);
    }

    try {
      await firestore
        .doc(
          `${(commentDocPathOnPost as string).split("/").slice(0, 6).join("/")}`
        )
        .set({
          count: fieldValue.increment(-1),
        });
    } catch (error) {
      console.error("ERROR-3", error);
    }

    // Decremant Sub Comment Count (On Post)

    const postDocId = (postDocPath as string).split("/")[
      (postDocPath as string).split("/").length - 2
    ];
    const commentDocId = (commentDocPathOnPost as string).split("/")[
      (commentDocPathOnPost as string).split("/").length - 1
    ];

    const commentPathOnUser = `users/${operationFromUsername}/personal/postInteractions/commentedPosts/${postDocId}/comments/${commentDocId}`;

    try {
      await firestore.doc(commentPathOnUser).delete();
    } catch (error) {
      console.error("ERROR-4", error);
    }

    try {
      await firestore
        .doc(
          `users/${operationFromUsername}/personal/postInteractions/commentedPosts/${postDocId}`
        )
        .set({
          count: fieldValue.increment(-1),
        });
    } catch (error) {
      console.error("Error-5", error);
    }

    // send notification
    try {
      const postSenderUsername = (await firestore.doc(postDocPath).get()).data()
        ?.senderUsername;

      const notificationDoc = (
        await firestore
          .collection(`users/${postSenderUsername}/notifications`)
          .where("cause", "==", "comment")
          .where("sender", "==", operationFromUsername)
          .where("commentDocPath", "==", commentDocPathOnPost)
          .get()
      ).docs[0];
      if (notificationDoc) await notificationDoc.ref.delete();
    } catch (error) {
      console.error(
        "Error while sending comment. (We were sending notification)",
        error
      );
      return res.status(503).json({ error: "Firebase error" });
    }

    return res.status(200).json({});
  });
}

/**
 * Checks if requester is owner of comment.
 * @param commentDocPath
 * @param operationFromUsername
 * @returns a boolen indicates whether requester is owner or not.
 */
async function isOwnerOfComment(
  commentDocPath: string,
  operationFromUsername: string
) {
  const ss = await firestore.doc(commentDocPath).get();
  return ss.data()?.commentSenderUsername === operationFromUsername;
}
