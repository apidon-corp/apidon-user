import getDisplayName from "@/apiUtils";
import {
  FrenletServerData,
  FrenletsServerData,
} from "@/components/types/Frenlet";
import { PostItemDataV2 } from "@/components/types/Post";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

async function getPosts(username: string) {
  try {
    const postsSnapshot = await firestore
      .collection(`/users/${username}/posts`)
      .get();

    return postsSnapshot.docs;
  } catch (error) {
    console.error(`Error while getting posts for ${username}`);
    return false;
  }
}

const handleGetLikeStatus = async (
  operationFromUsername: string,
  postDoc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
) => {
  let likeStatus = false;
  try {
    likeStatus = (
      await postDoc.ref.collection("likes").doc(operationFromUsername).get()
    ).exists;
  } catch (error) {
    console.error(
      `Error while creating user (single) feed for ${operationFromUsername}. (We were retriving like status from ${postDoc.ref.path})`
    );
    return false;
  }
  return likeStatus;
};

const handleGetFollowStatus = async (
  operationFromUsername: string,
  postDoc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
) => {
  let followStatus = false;
  try {
    followStatus = (
      await firestore
        .doc(
          `users/${operationFromUsername}/followings/${
            postDoc.data().senderUsername
          }`
        )
        .get()
    ).exists;
  } catch (error) {
    console.error(
      `Error while creating user (single) feed for ${operationFromUsername}. (We were getting follow status from post: ${postDoc.ref.path})`
    );
    return false;
  }

  return followStatus;
};

const handleCreatePostItemData = async (
  postDoc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>,
  operationFromUsername: string
) => {
  let likeStatus = false;

  // getting following status
  let followStatus = false;

  const [likeResponse, followResponse] = await Promise.all([
    handleGetLikeStatus(operationFromUsername, postDoc),
    handleGetFollowStatus(operationFromUsername, postDoc),
  ]);

  // undefined is false default.
  likeStatus = likeResponse as boolean;
  followStatus = followResponse as boolean;

  const newPostItemData: PostItemDataV2 = {
    senderUsername: postDoc.data().senderUsername,

    description: postDoc.data().description,
    image: postDoc.data().image,

    likeCount: postDoc.data().likeCount,
    likes: postDoc.data().likes,
    currentUserLikedThisPost: likeStatus,

    commentCount: postDoc.data().commentCount,
    comments: postDoc.data().comments,

    postDocId: postDoc.id,

    nftStatus: postDoc.data().nftStatus,

    currentUserFollowThisSender: followStatus,

    creationTime: postDoc.data().creationTime,
  };

  return newPostItemData;
};

async function handlePreparePosts(
  postDocs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[],
  requester: string
) {
  const postItemDatas = await Promise.all(
    postDocs.map((postDoc) => handleCreatePostItemData(postDoc, requester))
  );

  return postItemDatas;
}

async function getReceviedFrenlets(username: string) {
  try {
    const receivedFrenletsSnapshot = await firestore
      .collection(`/users/${username}/frenlets/frenlets/incoming`)
      .get();
    return receivedFrenletsSnapshot.docs.map(
      (doc) => doc.data() as FrenletServerData
    );
  } catch (error) {
    console.error(`Error while getting received frenlets of ${username}`);
    return false;
  }
}

async function getSentFronlets(username: string) {
  try {
    const sentFrenletsSnapshot = await firestore
      .collection(`/users/${username}/frenlets/frenlets/outgoing`)
      .get();
    return sentFrenletsSnapshot.docs.map(
      (doc) => doc.data() as FrenletServerData
    );
  } catch (error) {
    console.error(`Error while getting sent frenlets of ${username}`);
    return false;
  }
}

async function getFrenlets(username: string) {
  const receivedFronlets = await getReceviedFrenlets(username);
  //const sentFrenlets = await getSentFronlets(username);

  if (!receivedFronlets) return false;
  //if (!sentFrenlets) return false;

  return receivedFronlets; //.concat(sentFrenlets);
}

async function getTags(username: string) {
  try {
    const frenletsDocSnapshot = await firestore
      .doc(`/users/${username}/frenlets/frenlets`)
      .get();
    if (!frenletsDocSnapshot.exists) {
      console.error("frenletsDoc doesn't exist");
      return false;
    }
    const frenletsDocData = frenletsDocSnapshot.data() as FrenletsServerData;
    if (frenletsDocData === undefined) {
      console.error("frenletsDocData is undefined");
      return false;
    }

    const tags = frenletsDocData.tags;
    return tags;
  } catch (error) {
    console.error(`Error while getting tags of ${username}`);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { username } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (!username) return res.status(422).send("Invalid Prop or Props");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const postsServerDatas = await getPosts(username);
  if (!postsServerDatas) return res.status(500).send("Internal Server Error");

  const postItemDatas = await handlePreparePosts(
    postsServerDatas,
    operationFromUsername
  );

  const [frenlets, tags] = await Promise.all([
    getFrenlets(username),
    getTags(username),
  ]);
  if (!frenlets || !tags) return res.status(500).send("Internal Server Error");

  return res
    .status(200)
    .json({ postItemDatas: postItemDatas, frenlets: frenlets, tags: tags });
}
