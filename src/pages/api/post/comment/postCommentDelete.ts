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

    // Decrease direct comment count on post.
    try {
      await firestore.doc(postDocPath).update({
        commentCount: fieldValue.increment(-1),
      });
    } catch (error) {
      console.error("ERROR-2", error);
    }

    // Decrease sub-commect count (like user1 has 2 comments)
    try {
      await firestore
        .doc(
          `${(commentDocPathOnPost as string).split("/").slice(0, 6).join("/")}`
        )
        .update({
          count: fieldValue.increment(-1),
        });
    } catch (error) {
      console.error("ERROR-3", error);
    }

    // Delete user doc on post for comment if user has no comments on that post...

    try {
      const commentCountOnThatPostByUserOnPostDoc = await firestore
        .doc(
          `${(commentDocPathOnPost as string).split("/").slice(0, 6).join("/")}`
        )
        .get();
      const commentCountOnThatPostByUserOnPostDocData =
        commentCountOnThatPostByUserOnPostDoc.data();

      if (!commentCountOnThatPostByUserOnPostDocData)
        throw new Error(
          "commentCountOnThatPostByUserOnPostDocData is undefined"
        );

      const commentCountOnThatPostByUserOnPost =
        commentCountOnThatPostByUserOnPostDocData.count;

      if (commentCountOnThatPostByUserOnPost === 0) {
        await commentCountOnThatPostByUserOnPostDoc.ref.delete();
      }
    } catch (error) {
      console.error("ERROR-7", error);
    }

    // Prepare Variables...
    const postDocId = (postDocPath as string).split("/")[
      (postDocPath as string).split("/").length - 2
    ];
    const commentDocId = (commentDocPathOnPost as string).split("/")[
      (commentDocPathOnPost as string).split("/").length - 1
    ];

    // Delete Comment On User
    const commentPathOnUser = `users/${operationFromUsername}/personal/postInteractions/commentedPosts/${postDocId}/comments/${commentDocId}`;
    try {
      await firestore.doc(commentPathOnUser).delete();
    } catch (error) {
      console.error("ERROR-4", error);
    }

    // Decrease personal comment count on that post again interaction part...
    try {
      await firestore
        .doc(
          `users/${operationFromUsername}/personal/postInteractions/commentedPosts/${postDocId}`
        )
        .update({
          count: fieldValue.increment(-1),
        });
    } catch (error) {
      console.error("Error-5", error);
    }

    // Delete doc if there is no comment made by user...
    try {
      const commentCountMadeByUserOnAPostAtInteractionsDoc = await firestore
        .doc(
          `users/${operationFromUsername}/personal/postInteractions/commentedPosts/${postDocId}`
        )
        .get();

      const commentCountMadeByUserOnAPostAtInteractionsDocData =
        commentCountMadeByUserOnAPostAtInteractionsDoc.data();
      if (!commentCountMadeByUserOnAPostAtInteractionsDocData)
        throw new Error(
          "Comment Count Mde By User On A Post At Interactions Doc Data is undefined."
        );
      const commentCountMadeByUserOnAPostAtInteraction =
        commentCountMadeByUserOnAPostAtInteractionsDocData.count;

      if (commentCountMadeByUserOnAPostAtInteraction === 0) {
        await commentCountMadeByUserOnAPostAtInteractionsDoc.ref.delete();
      }
    } catch (error) {
      console.error("Error-6", error);
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
