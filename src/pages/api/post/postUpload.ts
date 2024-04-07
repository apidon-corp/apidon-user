import { PostServerData } from "@/components/types/Post";
import { NextApiRequest, NextApiResponse } from "next";
import { bucket, fieldValue, firestore } from "../../../firebase/adminApp";
import getDisplayName from "@/apiUtils";
import {
  PostClassifyBody,
  UploadedPostArrayObject,
} from "@/components/types/User";
import AsyncLock from "async-lock";

const lock = new AsyncLock();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { description, image: imageDataURL } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  if (!description && !imageDataURL) {
    return res.status(422).send({ error: "Invalid prop or props" });
  }

  await lock.acquire(`postUploadAPI-${operationFromUsername}`, async () => {
    /**
     * Both for image and post.
     */

    let newPostData: PostServerData = {
      senderUsername: operationFromUsername,
      description: description,
      image: "",
      likeCount: 0,
      commentCount: 0,
      nftStatus: {
        convertedToNft: false,
      },
      creationTime: Date.now(),
    };

    let createdPostDoc;
    try {
      createdPostDoc = await firestore
        .collection(`users/${operationFromUsername}/posts`)
        .add({ ...newPostData });
    } catch (error) {
      console.error(
        "Error while uploadingPost. (We were on creating doc for new post)",
        error
      );
      return res.status(503).send("Firebase Error");
    }

    let postImagePublicURL = "";
    if (imageDataURL) {
      try {
        const file = bucket.file(
          `users/${operationFromUsername}/postsFiles/${createdPostDoc.id}/image`
        );
        const buffer = Buffer.from(imageDataURL.split(",")[1], "base64");
        await file.save(buffer, {
          metadata: {
            contentType: "image/jpeg",
          },
        });
        await file.makePublic();
        postImagePublicURL = file.publicUrl();
      } catch (error) {
        console.error(
          "Error while uploading post. We were on uploading image",
          error
        );
        return res.status(503).send("Firebase Error");
      }

      try {
        await createdPostDoc.update({
          image: postImagePublicURL,
        });
      } catch (error) {
        console.error(
          "Error while uploading post. We were on updating image source.",
          error
        );
        return res.status(503).send("Internal Server Error.");
      }
    }

    newPostData = { ...newPostData, image: postImagePublicURL };

    // Updating "uploadedPostsArrasy" array from "/users/user1/personal/postInteractions"
    const newUploadedPostObject: UploadedPostArrayObject = {
      postDocPath: createdPostDoc.path,
      timestamp: Date.now(),
    };
    try {
      const postInteractionsDoc = await firestore
        .doc(`users/${operationFromUsername}/personal/postInteractions`)
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
      console.error(
        "Error om updating postDocInteractions while uploading posts",
        error
      );
      return res.status(500).send("Internal Server Error");
    }

    // Post Classify Send......
    let providerDoc;
    try {
      providerDoc = await firestore
        .doc(`/users/${operationFromUsername}/provider/currentProvider`)
        .get();

      if (!providerDoc.exists) {
        throw new Error("Provider Doc doesn't exist.");
      }

      if (providerDoc.data() === undefined) {
        throw new Error("Provider Doc doesn't exist.");
      }
    } catch (error) {
      console.error(
        "Erron on post uploading. We were getting provider doc.",
        error
      );
      return res.status(500).send("Internal Server Error");
    }

    // I don't care response.
    const bodyContent: PostClassifyBody = {
      imageURL: postImagePublicURL,
      postDocPath: createdPostDoc.path,
      providerId: providerDoc.data()!.name as string,
      username: operationFromUsername,
      startTime: providerDoc.data()!.startTime,
    };
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT_TO_APIDON_PROVIDER_SERVER}/client/classification/postUploadAction`,
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
      console.error(
        "Error while post uploading. We were sending request to 'createdPostClassify' API",
        error
      );
      return res.status(500).send("Internal Server Error");
    }

    return res.status(200).json({
      newPostData: newPostData,
      newPostDocId: createdPostDoc.id,
    });
  });
}
