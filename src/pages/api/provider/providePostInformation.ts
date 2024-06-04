import { isWarmingRequest } from "@/apiUtils";
import { PostServerDataV2 } from "@/components/types/Post";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * Handling cors policy stuff.
 * @param res
 */
function handlePreflightRequest(res: NextApiResponse) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.PROVIDER_ROOT_ADDRESS_URL as string
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,authorization");
  res.status(200).end();
}

function handleAuthorization(authorization: string | undefined) {
  if (!authorization) {
    console.error("Authorization key is undefined.");
    return false;
  }

  const apiKey = process.env.API_KEY_BETWEEN_SERVICES;
  if (!apiKey) {
    console.error("API KEY is undefined from .env file.");
    return false;
  }

  return authorization === apiKey;
}

function handleProps(postDocPath: string) {
  if (!postDocPath) return false;

  return true;
}

async function preparePostDataResult(postDocPath: string) {
  try {
    const postDocSnapshot = await firestore.doc(postDocPath).get();

    if (!postDocSnapshot.exists) {
      console.error("This doc doesn't exist anymore: ", postDocPath);
      return {
        postDocData: false,
      };
    }

    const postDocData = postDocSnapshot.data() as PostServerDataV2;
    if (postDocData === undefined) {
      console.error("Post doc data is undefined.");
      return false;
    }

    return {
      postDocData: postDocData,
    };
  } catch (error) {
    console.error("Error on preparing post data: \n", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const isWarmingRequestResult = isWarmingRequest(req);
  if (isWarmingRequestResult) return res.status(200).send("OK");

  if (req.method === "OPTIONS") return handlePreflightRequest(res);
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { authorization } = req.headers;
  const { postDocPath } = req.body;

  const authorizationResult = handleAuthorization(authorization);
  if (!authorizationResult) return res.status(401).send("Unauthorized");

  const handlePropResult = handleProps(postDocPath);
  if (!handlePropResult) return res.status(422).send("Invalid prop or props");

  const postDataResult = await preparePostDataResult(postDocPath);
  if (!postDataResult) return res.status(500).send("Internal server error");

  return res.status(200).json({
    postDocData: postDataResult.postDocData,
  });
}
