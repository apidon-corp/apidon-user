import { PostServerData } from "@/components/types/Post";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  /**
   * To handle cors policy...
   */
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.PROVIDER_ROOT_ADDRESS_URL as string
  );

  res.setHeader("Access-Control-Allow-Headers", "Content-Type,authorization");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    // Respond with a 200 OK status code
    res.status(200).end();
    return;
  }

  const { authorization } = req.headers;
  const { postDocPath } = req.body;

  if (!authorization) return res.status(401).send("Unauthorized");

  const apiKey = process.env.API_KEY_BETWEEN_SERVICES;
  if (apiKey === undefined) {
    console.error("API KEY is undefined.");
    return res.status(500).send("Internal Server Error");
  }
  if (authorization !== apiKey) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  if (!postDocPath) return res.status(422).send("Invalid prop or props");

  try {
    const postDocSnapshot = await firestore.doc(postDocPath).get();

    if (!postDocSnapshot.exists) {
      console.error("This post doesn't exist anymore.");
      return res.status(200).json({
        postDocData: false,
      });
    }

    const postDocData = postDocSnapshot.data() as PostServerData;

    if (postDocData === undefined) {
      console.error("Post doc data is undefined.");
      return res.status(500).send("Internal Server Error");
    }

    return res.status(200).json({
      postDocData: postDocData,
    });
  } catch (error) {
    console.error("Error on providing image url of post: \n", error);
    return res.status(500).send("Internal Server Error");
  }
}
