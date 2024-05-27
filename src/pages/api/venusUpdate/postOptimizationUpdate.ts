import {
  CommentData,
  CommentDataV2,
  LikeDataV2,
} from "@/components/types/Post";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

const handleAuthorization = (authorization: string | undefined) => {
  const updateAPIKey = process.env.VENUS_UPDATE_KEY;
  if (!updateAPIKey) return false;

  if (!authorization) return false;

  return updateAPIKey === authorization;
};

async function getAllUsers() {
  try {
    const usersCollectionQuery = await firestore.collection("/usernames").get();

    const allUsernames = usersCollectionQuery.docs.map((u) => u.id);
    return allUsernames;
  } catch (error) {
    console.error("Error on getting all users: \n", error);
    return false;
  }
}

async function getPostsOfUser(username: string) {
  try {
    const postsQuery = await firestore
      .collection(`/users/${username}/posts`)
      .get();
    const postsDocPaths = postsQuery.docs.map((p) => p.ref.path);
    return postsDocPaths;
  } catch (error) {
    console.error("Error on getting posts of user: \n", error);
    return false;
  }
}

async function getAllPostDocPaths(users: string[]) {
  const postDocPaths: string[] = [];

  const getPostsOfUserResults = await Promise.all(
    users.map((u) => getPostsOfUser(u))
  );

  for (const result of getPostsOfUserResults) {
    if (!result) continue;

    postDocPaths.push(...result);
  }

  return postDocPaths;
}

async function handleLikeUpdate(postDocPath: string) {
  try {
    const likesQuery = await firestore
      .doc(postDocPath)
      .collection("likes")
      .get();

    const likes = likesQuery.docs.map((likeDoc) => {
      const likerUsername = likeDoc.id;
      const likeDocData = likeDoc.data();

      const newLikeObject: LikeDataV2 = {
        sender: likerUsername,
        ts: likeDocData.likeTime,
      };

      return newLikeObject;
    });

    await firestore.doc(postDocPath).update({ likes: likes });

    return true;
  } catch (error) {
    console.error("Error on updating likes: \n", error);
    return false;
  }
}

async function handleCommentUpdate(postDocPath: string) {
  try {
    const comments: CommentDataV2[] = [];

    const commentsQuery = await firestore
      .doc(postDocPath)
      .collection("comments")
      .get();

    for (const commentDoc of commentsQuery.docs) {
      const commentQueryOfThisSender = await commentDoc.ref
        .collection("comments")
        .get();

      for (const commentDocOfThisSender of commentQueryOfThisSender.docs) {
        const commentData = commentDocOfThisSender.data() as CommentData;

        const newCommentData: CommentDataV2 = {
          message: commentData.comment,
          sender: commentData.commentSenderUsername,
          ts: commentData.creationTime,
        };

        comments.push(newCommentData);
      }
    }

    await firestore.doc(postDocPath).update({ comments: comments });

    return true;
  } catch (error) {
    console.error("Error on updating comments: \n", error);
    return false;
  }
}

async function executeLikeUpdate(postDocPaths: string[]) {
  try {
    await Promise.all(postDocPaths.map((p) => handleLikeUpdate(p)));
    return true;
  } catch (error) {
    console.error("Error on executing like update: \n", error);
    return false;
  }
}

async function executeCommentUpdate(postDocPath: string[]) {
  try {
    await Promise.all(postDocPath.map((p) => handleCommentUpdate(p)));
    return true;
  } catch (error) {
    console.error("Error on executing comment update: \n", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  const authResult = handleAuthorization(authorization);
  if (!authResult) return res.status(401).send("Unauthorized");

  console.log("postOptimizationUpdate started...");

  console.log("---------------");

  console.log("Getting all users....");
  const gettingAllUsersResult = await getAllUsers();
  if (!gettingAllUsersResult)
    return res.status(500).send("Internal Server Error");
  console.log("Getting all users done.");

  console.log("---------------");

  console.log("Getting all post doc paths....");
  const allPostDocPaths = await getAllPostDocPaths(gettingAllUsersResult);
  if (!allPostDocPaths) return res.status(500).send("Internal Server Error");
  console.log("Getting all post doc paths done.");

  console.log("---------------");

  console.log("Updating likes....");
  const likeUpdateResult = await executeLikeUpdate(allPostDocPaths);
  if (!likeUpdateResult) return res.status(500).send("Internal Server Error");
  console.log("Updating likes done.");

  console.log("---------------");

  console.log("Updating comments....");
  const commentUpdateResult = await executeCommentUpdate(allPostDocPaths);
  if (!commentUpdateResult)
    return res.status(500).send("Internal Server Error");
  console.log("Updating comments done.");

  console.log("---------------");

  console.log("Post Optimization Update is done.");

  return res.status(200).send("OK");
}
