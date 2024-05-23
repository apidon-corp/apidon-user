import getDisplayName from "@/apiUtils";
import { PostServerData } from "@/components/types/Post";
import {
  PostClassifyBody,
  UploadedPostArrayObject,
} from "@/components/types/User";
import { NextApiRequest, NextApiResponse } from "next";
import { bucket, fieldValue, firestore } from "../../../firebase/adminApp";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

async function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to integrateModel API.");
    return false;
  }

  const operationFromUsername = await getDisplayName(key);
  if (!operationFromUsername) return false;

  return operationFromUsername;
}

async function checkProps(description: string, image: string) {
  if (!description && !image) {
    console.error("Both description and image is undefined.");
    return false;
  }
  return true;
}

async function createPostOnFirestore(username: string, description: string) {
  const newPostData: PostServerData = {
    senderUsername: username,
    description: description,
    image: "",
    likeCount: 0,
    commentCount: 0,
    nftStatus: {
      convertedToNft: false,
    },
    creationTime: Date.now(),
  };

  try {
    const createdPostDoc = await firestore
      .collection(`users/${username}/posts`)
      .add({ ...newPostData });

    return createdPostDoc;
  } catch (error) {
    console.error(
      "Error while uploadingPost. (We were on creating doc for new post)",
      error
    );
    return false;
  }
}

async function uploadImage(username: string, image: string, postDocId: string) {
  try {
    const file = bucket.file(
      `/users/${username}/postsFiles/${postDocId}/image`
    );
    const buffer = Buffer.from(image.split(",")[1], "base64");
    await file.save(buffer, { metadata: { contentType: "image/jpeg" } });
    await file.makePublic();
    const postImagePublicURL = file.publicUrl();

    return postImagePublicURL;
  } catch (error) {
    console.error("Error while image of post to Firebase Storage");
    return false;
  }
}

async function updateImageFieldOnPost(postDocPath: string, imageURL: string) {
  try {
    await firestore.doc(postDocPath).update({
      image: imageURL,
    });
  } catch (error) {
    console.error("Error on updating image field");
    return false;
  }
  return true;
}

async function uploadAndUpdateImage(
  username: string,
  image: string,
  postDocId: string,
  postDocPath: string
) {
  const imageURL = await uploadImage(username, image, postDocId);

  if (!imageURL) {
    return false;
  }

  const updateImageFieldOnPostResult = await updateImageFieldOnPost(
    postDocPath,
    imageURL
  );
  if (!updateImageFieldOnPostResult) return false;

  return true;
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

function sendPostForClassification(
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
    fetch(
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
  } catch (error) {
    console.error("Error while sending post for classification");
    return false;
  }

  return true;
}

async function getFinalPostData(postDocPath: string) {
  try {
    const postDocSnapshot = await firestore.doc(postDocPath).get();
    if (!postDocSnapshot.exists) {
      console.error("Post doc doesn't exist.");
      return false;
    }
    const postDocData = postDocSnapshot.data() as PostServerData;
    if (postDocData === undefined) {
      console.error("Post doc data is undefined.");
      return false;
    }

    return postDocData;
  } catch (error) {
    console.error("Error while getting final post data");
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { description, image } = req.body;

  const operationFromUsername = await handleAuthorization(authorization);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const checkPropsResult = await checkProps(description, image);
  if (!checkPropsResult) return res.status(422).send("Invalid props.");

  const createdPostDoc = await createPostOnFirestore(
    operationFromUsername,
    description
  );

  if (!createdPostDoc) return res.status(500).send("Internal Server Error.");

  if (image) {
    const uploadAndUpdateImageResult = await uploadAndUpdateImage(
      operationFromUsername,
      image,
      createdPostDoc.id,
      createdPostDoc.path
    );
    if (!uploadAndUpdateImageResult)
      return res.status(500).send("Internal Server Error.");
  }

  const updateUploadedPostArrayResult = await updateUploadedPostArray(
    operationFromUsername,
    createdPostDoc.path
  );
  if (!updateUploadedPostArrayResult)
    return res.status(500).send("Internal Server Error.");

  const providerData = await getProviderData(operationFromUsername);
  if (!providerData) return res.status(500).send("Internal Server Error.");


  sendPostForClassification(
    operationFromUsername,
    image,
    createdPostDoc.path,
    providerData.providerId,
    providerData.startTime
  );

  const finalPostData = await getFinalPostData(createdPostDoc.path);
  if (!finalPostData) return res.status(500).send("Internal Server Error.");

  return res.status(200).json({
    newPostData: finalPostData,
    newPostDocId: createdPostDoc.id,
  });
}
