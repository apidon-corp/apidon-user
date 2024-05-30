import getDisplayName from "@/apiUtils";
import {
  NFTListResponseBody,
  NftDocDataInServer,
  NftListRequestBody,
} from "@/components/types/NFT";
import { PostServerDataV2 } from "@/components/types/Post";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const nftListRequestBody: NftListRequestBody = req.body;

  const postDocId = nftListRequestBody.postDocId;
  const price = nftListRequestBody.price;
  const currency = nftListRequestBody.currency;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  if (!operationFromUsername || !postDocId || !price) {
    return res.status(422).send("Invalid Prop or Props");
  }

  let postDocData: PostServerDataV2;
  try {
    const postDocSnapshot = await firestore
      .doc(`users/${operationFromUsername}/posts/${postDocId}`)
      .get();
    if (!postDocSnapshot.exists)
      throw new Error(
        "Post doc doesn't exists with given postDocId and requester."
      );
    postDocData = postDocSnapshot.data() as PostServerDataV2;
  } catch (error) {
    console.error("Error on getting postDocData while listing nft: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  if (postDocData.senderUsername !== operationFromUsername) {
    console.error(
      "Error while listing nft: \n",
      "Requester and postdocpath sender doesn't match."
    );
    return res.status(500).send("Internal Server Error");
  }

  if (
    !postDocData.nftStatus.convertedToNft ||
    !postDocData.nftStatus.nftDocPath
  ) {
    console.error(
      "Error while listing nft: \n",
      "NFT that trying to be listed, actually not a NFT. (It has no nftDocPath at postDocData)"
    );
    return res.status(500).send("Internal Server Error");
  }

  let nftDocData: NftDocDataInServer;
  let nftDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  try {
    const nftDocSnapshot = await firestore
      .doc(postDocData.nftStatus.nftDocPath)
      .get();
    if (!nftDocSnapshot.exists)
      throw new Error(
        "Post doc doesn't exists with given postDocId and requester."
      );
    nftDocData = nftDocSnapshot.data() as NftDocDataInServer;
    nftDoc = nftDocSnapshot;
  } catch (error) {
    console.error("Error on getting nftDocData from Firebase: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  if (nftDocData.listStatus.isListed) {
    console.error("Error on listing NFT: This NFT is already listed.");
    return res.status(500).send("Internal Server Error");
  }

  try {
    const newListingStatus: NftDocDataInServer["listStatus"] = {
      isListed: true,
      price: price,
      currency: currency,
      sold: false,
    };
    await nftDoc.ref.update({
      listStatus: {
        ...newListingStatus,
      },
    });
  } catch (error) {
    console.error(
      "Error while updating nftDocPath with new listStatus item: \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  const response: NFTListResponseBody = {
    currency: currency,
    price: price,
  };

  return res.status(200).json({ ...response });
}
