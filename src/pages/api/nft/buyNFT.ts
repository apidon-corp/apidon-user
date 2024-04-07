import getDisplayName from "@/apiUtils";
import {
  BoughtNFTsArrayObject,
  NftDocDataInServer,
  SoldNFTsArrayObject,
} from "@/components/types/NFT";
import { PostServerData } from "@/components/types/Post";
import { fieldValue, firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  /**
   * NFT buying is disabled.
   */
  return res.status(500).send("NFT buying is temporarily disabled.");

  const { authorization } = req.headers;
  const { postDocPath } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  if (!operationFromUsername || !postDocPath) {
    return res.status(422).send("Invalid Prop or Props");
  }

  let postDocData: PostServerData;
  try {
    const postDocSnapshot = await firestore.doc(postDocPath).get();
    if (!postDocSnapshot.exists)
      throw new Error(`Doc (${postDocPath} doesn't exist anymore)`);

    postDocData = postDocSnapshot.data() as PostServerData;
  } catch (error) {
    console.error("Error while getting postDoc of requested NFT: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  if (
    !postDocData.nftStatus.convertedToNft ||
    !postDocData.nftStatus.nftDocPath
  ) {
    console.error(`Post Doc (${postDocPath}) didn't not converted to NFT.`);
    return res.status(500).send("Internal Server Error");
  }

  let nftDocData: NftDocDataInServer;
  let nftDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  try {
    // @ts-ignore: Unreachable code error
    nftDoc = await firestore.doc(postDocData.nftStatus.nftDocPath).get();
    if (!nftDoc.exists) {
      throw new Error(
        "NFT Doc Path doesn't exist even if postDoc says it has."
      );
    }

    nftDocData = nftDoc.data() as NftDocDataInServer;
  } catch (error) {
    console.error("Error while getting nftDocPath: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  if (!nftDocData.listStatus.isListed || !nftDocData.listStatus.price) {
    console.error("List status of nft is false or price is invalid.");
    return res.status(500).send("Internal Server Error");
  }

  if (nftDocData.listStatus.sold) {
    console.error("This nft is already sold.");
    return res.status(500).send("Internal Server Error");
  }

  /**
   * We need to connect wallet and getting payment then proceed but now it is not needed.
   */

  // I need to update data in firebase with firebase admin firestore.doc() function

  const updatedListStatusObject: NftDocDataInServer["listStatus"] = {
    isListed: true,
    buyer: operationFromUsername,
    currency: nftDocData.listStatus.currency,
    price: nftDocData.listStatus.price,
    sold: true,
  };

  try {
    await nftDoc.ref.update({
      listStatus: {
        ...updatedListStatusObject,
      },
    });
  } catch (error) {
    console.error("Error while updating list status after ");
    return res.status(500).send("Internal Server Error");
  }

  // We need to update nftTrade/nftTrade doc of buyer.
  const boughtNFTsArrayObject: BoughtNFTsArrayObject = {
    postDocPath: postDocPath,
    ts: Date.now(),
  };
  try {
    const nftTradeDocRef = firestore.doc(
      `users/${operationFromUsername}/nftTrade/nftTrade`
    );

    const nftTradeDocSnapshot = await nftTradeDocRef.get();

    if (nftTradeDocSnapshot.exists) {
      // We need to just update.
      nftTradeDocRef.update({
        boughtNFTs: fieldValue.arrayUnion({ ...boughtNFTsArrayObject }),
      });
    } else {
      // We need to create nftTrade doc, too.
      await nftTradeDocRef.set({
        boughtNFTs: [{ ...boughtNFTsArrayObject }],
      });
    }
  } catch (error) {
    console.error("Error while updating bought nfts array of buyer: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  // We need to update nftTrade/nftTrade doc of buyer.
  const soldNFTsArrayObject: SoldNFTsArrayObject = {
    postDocPath: postDocPath,
    ts: Date.now(),
  };

  try {
    const nftTradeDocRef = firestore.doc(
      `users/${postDocData.senderUsername}/nftTrade/nftTrade`
    );

    const nftTradeDocSnapshot = await nftTradeDocRef.get();

    if (nftTradeDocSnapshot.exists) {
      // We need to just update.
      nftTradeDocRef.update({
        soldNFTs: fieldValue.arrayUnion({ ...soldNFTsArrayObject }),
      });
    } else {
      // We need to create nftTrade doc, too.
      await nftTradeDocRef.set({
        soldNFTs: [{ ...soldNFTsArrayObject }],
      });
    }
  } catch (error) {
    console.error("Error while updating sold nfts array of seller: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("Success");
}
