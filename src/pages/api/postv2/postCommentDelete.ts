import getDisplayName, { isWarmingRequest } from "@/apiUtils";
import {
  CommentDataV2,
  CommentInteractionData,
  PostServerDataV2,
} from "@/components/types/Post";
import { NotificationData, NotificationDocData } from "@/components/types/User";
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

function checkProps(postDocPath: string, commentObject: CommentDataV2) {
  if (!postDocPath || !commentObject) {
    console.error("Both postDocPath and commentObject is undefined.");
    return false;
  }

  return true;
}

async function checkCanDeleteComment(
  username: string,
  postDocPath: string,
  commentObject: CommentDataV2
) {
  try {
    const postDocSnapshot = await firestore.doc(postDocPath).get();
    if (!postDocSnapshot.exists) {
      console.error("Post doc not found");
      return false;
    }

    const postDocData = postDocSnapshot.data() as PostServerDataV2;
    if (!postDocData) {
      console.error("Post doc data is undefined");
      return false;
    }

    const foundComment = postDocData.comments.find(
      (comment) =>
        comment.message === commentObject.message &&
        comment.sender === commentObject.sender &&
        comment.ts === commentObject.ts
    );

    if (!foundComment) {
      console.error("Comment not found to delete");
      return false;
    }

    return {
      postDocData: postDocData,
      canDeleteComment: foundComment.sender === username,
    };
  } catch (error) {
    console.error("Error while checking can delete comment");
    return false;
  }
}

async function deleteCommentFromPost(
  postDocPath: string,
  commentObject: CommentDataV2
) {
  try {
    const postDocRef = firestore.doc(postDocPath);
    await postDocRef.update({
      comments: fieldValue.arrayRemove(commentObject),
    });
    return true;
  } catch (error) {
    console.error("Error while deleting comment from post");
    return false;
  }
}

async function decreaseCommentCount(postDocPath: string) {
  try {
    const postDocRef = firestore.doc(postDocPath);
    await postDocRef.update({
      commentCount: fieldValue.increment(-1),
    });
    return true;
  } catch (error) {
    console.error("Error while decreasing comment count");
    return false;
  }
}

async function deleteCommentFromInteractions(
  username: string,
  commentObject: CommentDataV2,
  postDocPath: string
) {
  const commentInteractionData: CommentInteractionData = {
    creationTime: commentObject.ts,
    postDocPath: postDocPath,
  };

  try {
    const postInteractionsDoc = firestore.doc(
      `/users/${username}/personal/postInteractions`
    );

    await postInteractionsDoc.update({
      commentedPostsArray: fieldValue.arrayRemove(commentInteractionData),
    });

    return true;
  } catch (error) {
    console.error("Error while deleting comment from interactions");
    return false;
  }
}

async function deleteNotification(
  postSender: string,
  commentObject: CommentDataV2
) {
  // There will be no notification doc to delete so....
  if (postSender === commentObject.sender) return true;

  try {
    const notificationDocRef = firestore.doc(
      `/users/${postSender}/notifications/notifications`
    );

    const notificationDocSnapshot = await notificationDocRef.get();
    if (!notificationDocSnapshot.exists) {
      console.error("NotificationDoc doesn't exist");
      return false;
    }

    const notificationDocData =
      notificationDocSnapshot.data() as NotificationDocData;
    if (!notificationDocData) {
      console.error("NotificationDocData is undefined");
      return false;
    }

    const notificationsArray = notificationDocData.notifications;

    const deletedObject = notificationsArray.find(
      (a) =>
        a.cause === "comment" &&
        a.sender === commentObject.sender &&
        a.ts === commentObject.ts
    );
    if (!deletedObject) {
      console.error("Deleted object is undefined");
      return false;
    }

    await notificationDocRef.update({
      notifications: fieldValue.arrayRemove(deletedObject),
    });

    return true;
  } catch (error) {
    console.error("Error while deleting notification");
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
  const { postDocPath, commentObject } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(postDocPath, commentObject);
  if (!checkPropsResult) return res.status(422).send("Invalid Request");

  const checkCanDeleteCommentResult = await checkCanDeleteComment(
    username,
    postDocPath,
    commentObject
  );
  if (!checkCanDeleteCommentResult)
    return res.status(500).send("Internal Server Error");

  if (!checkCanDeleteCommentResult.canDeleteComment)
    return res.status(403).send("Forbidden");

  const [
    deleteCommentFromPostResult,
    decreaseCommentCountResult,
    deleteCommentFromInteractionsResult,
    deleteNotificationResult,
  ] = await Promise.all([
    deleteCommentFromPost(postDocPath, commentObject),
    decreaseCommentCount(postDocPath),
    deleteCommentFromInteractions(
      username,
      commentObject,
      `/users/${checkCanDeleteCommentResult.postDocData.senderUsername}/posts/${checkCanDeleteCommentResult.postDocData.id}`
    ),
    deleteNotification(
      checkCanDeleteCommentResult.postDocData.senderUsername,
      commentObject
    ),
  ]);

  if (
    !deleteCommentFromPostResult ||
    !deleteCommentFromInteractionsResult ||
    !deleteNotificationResult ||
    !decreaseCommentCountResult
  ) {
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("Success");
}
