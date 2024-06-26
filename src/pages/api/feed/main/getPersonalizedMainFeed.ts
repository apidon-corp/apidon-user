import getDisplayName, { isWarmingRequest } from "@/apiUtils";
import { CurrentProvider } from "@/components/types/User";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

async function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to sendReply API.");
    return false;
  }

  const operationFromUsername = await getDisplayName(key);
  if (!operationFromUsername) return false;

  return operationFromUsername;
}

async function getFollowingsOfUser(username: string) {
  try {
    const followingQuery = await firestore
      .collection(`/users/${username}/followings`)
      .get();

    const followings = followingQuery.docs.map((f) => f.id);

    return followings;
  } catch (error) {
    console.error("Error while getting followings of user: ", error);
    return false;
  }
}

async function getProviderInformation(username: string) {
  try {
    const providerDocSnapshot = await firestore
      .doc(`/users/${username}/provider/currentProvider`)
      .get();
    if (!providerDocSnapshot.exists) {
      console.error("Provider information does not exist.");
      return false;
    }

    const providerDocData = providerDocSnapshot.data() as CurrentProvider;
    if (!providerDocData) {
      console.error("Provider information is undefined.");
      return false;
    }

    const providerId = providerDocData.name;
    const startTime = providerDocData.startTime;

    return {
      providerId: providerId,
      startTime: startTime,
    };
  } catch (error) {
    console.error("Error while getting provider information: ", error);
    return false;
  }
}

async function getPostPredictionsFromProvider(
  username: string,
  providerName: string,
  startTime: number
) {
  const apiEndPointToProviderServer =
    process.env.API_ENDPOINT_TO_APIDON_PROVIDER_SERVER;

  if (!apiEndPointToProviderServer) {
    console.error(
      "API Endpoint to provider server is invalid (we were getting it from .env file)"
    );
    return false;
  }

  const apikeyBetweenServices = process.env.API_KEY_BETWEEN_SERVICES;
  if (!apikeyBetweenServices) {
    console.error(
      "API Key between services is invalid (we were getting it from .env file)"
    );
    return false;
  }

  try {
    const response = await fetch(
      `${apiEndPointToProviderServer}/client/provideFeed`,
      {
        method: "POST",
        headers: {
          authorization: apikeyBetweenServices,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          provider: providerName,
          startTime: startTime,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Resposne from provideFeed API (provider side) is not okay: \n",
        await response.text()
      );
      return false;
    }

    const result = await response.json();

    const postDocPathArray = result.postDocPathArray as string[];
    return {
      postDocPathArray: postDocPathArray,
    };
  } catch (error) {
    console.error(
      "Error while getting post predictions from provider: ",
      error
    );
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

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  const followingsOfUser = await getFollowingsOfUser(username);
  if (!followingsOfUser) return res.status(500).send("Internal Server Error");

  const providerData = await getProviderInformation(username);
  if (!providerData) return res.status(500).send("Internal Server Error");

  const getPostPredictionsFromProviderResult =
    await getPostPredictionsFromProvider(
      username,
      providerData.providerId,
      providerData.startTime
    );
  if (!getPostPredictionsFromProviderResult)
    return res.status(500).send("Internal Server Error");

  return res.status(200).json({
    postDocPathArray: getPostPredictionsFromProviderResult.postDocPathArray,
  });
}
