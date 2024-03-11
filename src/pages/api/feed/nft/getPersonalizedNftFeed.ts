import getDisplayName from "@/apiUtils";
import { GetPersonalizedNftFeedResponse } from "@/components/types/API";
import { NftDocDataInServer } from "@/components/types/NFT";
import { PostItemData } from "@/components/types/Post";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  /**
   * Get NFT Docs
   * Extract postDocPaths
   * Get Posts
   * Personalize them (likei follow status)
   * Return them
   */

  let postsThatCovertedNFTsPathsArray: string[] = [];
  try {
    const nftDocCollectionSnapshot = await firestore.collection(`/nfts`).get();
    if (nftDocCollectionSnapshot.empty)
      throw new Error("There is no nft doc at nft collection");
    for (const nftDoc of nftDocCollectionSnapshot.docs) {
      postsThatCovertedNFTsPathsArray.push(
        (nftDoc.data() as NftDocDataInServer).postDocPath
      );
    }
  } catch (error) {
    console.error("Error while getting 'nfts' collection: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  const postItemCreationPromisesArray: Promise<void | PostItemData>[] = [];
  for (const postDocPath of postsThatCovertedNFTsPathsArray) {
    postItemCreationPromisesArray.push(
      handleCreatePostItemDataFromPostDocPath(
        postDocPath,
        operationFromUsername
      )
    );
  }

  const postItemCreationResultArray = await Promise.all(
    postItemCreationPromisesArray
  );

  const postItemDatasArray: PostItemData[] = [];
  for (const result of postItemCreationResultArray) {
    // If result is void, skip.
    if (!result) continue;

    // If result is PostItemData push it to array.
    postItemDatasArray.push(result);
  }

  const response: GetPersonalizedNftFeedResponse = {
    postItemDatasArray: postItemDatasArray,
  };

  return res.status(200).json({ ...response });
}

const handleCreatePostItemDataFromPostDocPath = async (
  postDocPath: string,
  operationFromUsername: string
) => {
  let postDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  try {
    postDoc = await firestore.doc(postDocPath).get();
  } catch (error) {
    return console.error(
      "Error while creating post item data from postDocPath via provider.",
      error
    );
  }

  if (!postDoc.exists)
    return console.error("This post doesn't exist anymore.", postDocPath);

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

  const newPostItemData: PostItemData = {
    senderUsername: postDoc.data()?.senderUsername,

    description: postDoc.data()?.description,
    image: postDoc.data()?.image,

    likeCount: postDoc.data()?.likeCount,
    currentUserLikedThisPost: likeStatus,
    commentCount: postDoc.data()?.commentCount,

    postDocId: postDoc.id,

    nftStatus: postDoc.data()?.nftStatus,

    currentUserFollowThisSender: followStatus,

    creationTime: postDoc.data()?.creationTime,
  };

  return newPostItemData;
};

const handleGetLikeStatus = async (
  operationFromUsername: string,
  postDoc:
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
) => {
  let likeStatus = false;
  try {
    likeStatus = (
      await postDoc.ref.collection("likes").doc(operationFromUsername).get()
    ).exists;
  } catch (error) {
    return console.error(
      `Error while creating feed for ${operationFromUsername}. (We were retriving like status from ${postDoc.ref.path})`
    );
  }
  return likeStatus;
};

const handleGetFollowStatus = async (
  operationFromUsername: string,
  postDoc:
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
) => {
  let followStatus = false;
  try {
    followStatus = (
      await firestore
        .doc(
          `users/${operationFromUsername}/followings/${
            postDoc.data()?.senderUsername
          }`
        )
        .get()
    ).exists;
  } catch (error) {
    return console.error(
      `Error while creating feed for ${operationFromUsername}. (We were getting follow status from post: ${postDoc.ref.path})`
    );
  }

  return followStatus;
};
