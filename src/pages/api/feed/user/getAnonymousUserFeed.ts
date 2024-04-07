import { PostItemData } from "@/components/types/Post";
import { firestore } from "@/firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { username } = req.body;

  // We are disabling anonymous feed.
  return res.status(500).send("Anonymous user feed disabled temporarily.");

  if (!username) return res.status(422).send("Invalid Prop or Props");

  if (
    authorization !==
    (process.env.NEXT_PUBLIC_ANONYMOUS_ENTERANCE_KEY as string)
  )
    return res.status(401).send("unauthorized");

  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  let postItemDatas: PostItemData[] = [];

  let postsDocsQuerySnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
  try {
    postsDocsQuerySnapshot = await firestore
      .collection(`users/${username}/posts`)
      .get();
  } catch (error) {
    console.error(
      `Error while creating user (single) ${username} feed for anonymous users`,
      error
    );
    return res.status(503).send("Firebase Error");
  }

  if (postsDocsQuerySnapshot.size !== 0) {
    for (const postDoc of postsDocsQuerySnapshot.docs) {
      const newPostItemData: PostItemData = {
        senderUsername: postDoc.data().senderUsername,

        description: postDoc.data().description,
        image: postDoc.data().image,

        likeCount: postDoc.data().likeCount,
        currentUserLikedThisPost: false,
        commentCount: postDoc.data().commentCount,

        postDocId: postDoc.id,

        nftStatus: postDoc.data().nftStatus,

        currentUserFollowThisSender: false,

        creationTime: postDoc.data().creationTime,
      };

      postItemDatas.push(newPostItemData);
    }
  }

  return res.status(200).json({ postItemDatas: postItemDatas });
}
