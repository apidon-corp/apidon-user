import getDisplayName from "@/apiUtils";
import { PostServerDataV2 } from "@/components/types/Post";
import {
  PostClassifyBody,
  UploadedPostArrayObject,
} from "@/components/types/User";
import { bucket, fieldValue, firestore } from "@/firebase/adminApp";
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

function checkProps(description: string, image: string) {
  if (!description && !image) {
    console.error("Both description and image is undefined.");
    return false;
  }
  return true;
}

function createPostServerData(description: string, username: string) {
  const ts = Date.now();

  const newPostServerData: PostServerDataV2 = {
    commentCount: 0,
    comments: [],
    creationTime: ts,
    description: description,
    image: "",
    likeCount: 0,
    likes: [],
    nftStatus: { convertedToNft: false },
    senderUsername: username,
    id: ts.toString(),
  };

  return newPostServerData;
}

async function uploadImage(username: string, image: string) {
  const postDocId = Date.now().toString();

  try {
    const file = bucket.file(`/users/${username}/postFiles/${postDocId}/image`);
    const buffer = Buffer.from(image.split(",")[1], "base64");
    await file.save(buffer, { metadata: { contentType: "image/jpeg" } });
    await file.makePublic();
    const postImagePublicURL = file.publicUrl();

    return {
      postDocId: postDocId,
      postImagePublicURL: postImagePublicURL,
    };
  } catch (error) {
    console.error("Error on uploading image to Firebase Storage.");
    return false;
  }
}

async function createPostOnFirestore(
  postServerData: PostServerDataV2,
  username: string
) {
  try {
    await firestore.doc(`/users/${username}/posts/${postServerData.id}`).set({
      ...postServerData,
    });
    return true;
  } catch (error) {
    console.error("Error on creating post on Firestore Database.");
    return false;
  }
}

async function updateUploadedPostArray(username: string, postDocPath: string) {
  try {
    const newUploadedPostObject: UploadedPostArrayObject = {
      postDocPath: postDocPath,
      timestamp: Date.now(),
    };

    const postInteractionsDoc = await firestore
      .doc(`users/${username}/personal/postInteractions`)
      .get();

    if (!postInteractionsDoc.exists) {
      postInteractionsDoc.ref.set({
        uploadedPostsArray: fieldValue.arrayUnion(newUploadedPostObject),
      });
    } else {
      postInteractionsDoc.ref.update({
        uploadedPostsArray: fieldValue.arrayUnion(newUploadedPostObject),
      });
    }
  } catch (error) {
    console.error("Error while updating uploadedPostArray");
    return false;
  }

  return true;
}

async function getProviderData(username: string) {
  try {
    const providerDocSnapshot = await firestore
      .doc(`/users/${username}/provider/currentProvider`)
      .get();
    if (!providerDocSnapshot.exists) {
      console.error("Provider doc doesn't exist.");
      return false;
    }
    const providerDocData = providerDocSnapshot.data();
    if (providerDocData === undefined) {
      console.error("Provider doc data is undefined.");
      return false;
    }

    return {
      providerId: providerDocData.name,
      startTime: Number(providerDocData.startTime),
    };
  } catch (error) {
    console.error("Error while getting provider data");
    return false;
  }
}

async function sendPostForClassification(
  username: string,
  imageURL: string,
  postDocPath: string,
  providerId: string,
  providerStartTime: number
) {
  const bodyContent: PostClassifyBody = {
    imageURL: imageURL,
    postDocPath: postDocPath,
    providerId: providerId,
    username: username,
    startTime: providerStartTime,
  };

  try {
    const response = await fetch(
      `${process.env.API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/classification/postUploadAction`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `${process.env.API_KEY_BETWEEN_SERVICES}`,
        },
        body: JSON.stringify({ ...bodyContent }),
      }
    );
    if (!response.ok) {
      console.error(
        "Response from postUploadAction(providerside) API is not okay: \n",
        await response.text()
      );
      return false;
    }
  } catch (error) {
    console.error("Error while sending post for classification: \n", error);
    return false;
  }

  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { authorization } = req.headers;
  const { description, image } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const checkPropsResult = checkProps(description, image);
  if (!checkPropsResult) return res.status(422).send("Invalid Request");

  let postServerData = createPostServerData(description, username);

  if (image) {
    const imageUploadResult = await uploadImage(username, image);
    if (!imageUploadResult)
      return res.status(500).send("Internal Server Error");

    postServerData = {
      ...postServerData,
      id: imageUploadResult.postDocId,
      image: imageUploadResult.postImagePublicURL,
    };
  }

  const [
    createPostOnFirestoreResult,
    updateUploadedPostArrayResult,
    currentProviderData,
  ] = await Promise.all([
    createPostOnFirestore(postServerData, username),
    updateUploadedPostArray(
      username,
      `/users/${username}/posts/${postServerData.id}`
    ),
    getProviderData(username),
  ]);

  if (
    !createPostOnFirestoreResult ||
    !updateUploadedPostArrayResult ||
    !currentProviderData
  )
    return res.status(500).send("Internal Server Error");

  await sendPostForClassification(
    username,
    postServerData.image,
    `/users/${username}/posts/${postServerData.id}`,
    currentProviderData.providerId,
    currentProviderData.startTime
  );

  return res.status(200).json({
    newPostData: postServerData,
    newPostDocId: postServerData.id,
  });
}
