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

async function handleUpdatePostIdField(postDocPath: string) {
  try {
    const postDocSnapshot = await firestore.doc(postDocPath).get();

    if (!postDocSnapshot.exists) {
      console.error("Post doc not found: ", postDocPath);
      return false;
    }

    const postDocId = postDocSnapshot.ref.id;

    await postDocSnapshot.ref.update({
      id: postDocId,
    });

    return true;
  } catch (error) {
    console.error("Error on updating post id field: \n", error);
    return false;
  }
}

async function updateAllPosts(posts: string[]) {
  try {
    await Promise.all(posts.map((p) => handleUpdatePostIdField(p)));

    return true;
  } catch (error) {
    console.error("Error on updating all posts: \n", error);
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

  console.log("postIdUpdate started...");

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

  console.log("Updating all posts....");
  const updateResult = await updateAllPosts(allPostDocPaths);
  if (!updateResult) return res.status(500).send("Internal Server Error");
  console.log("Updating all posts done.");

  console.log("---------------");

  return res.status(200).send("OK");
}
