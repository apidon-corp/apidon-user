import PostPageLayout from "@/components/Layout/PostPageLayout";
import { PostItemData, PostServerData } from "@/components/types/Post";
import { firestore } from "@/firebase/adminApp";
import { Flex, Text } from "@chakra-ui/react";
import { GetServerSidePropsContext } from "next";
import getDisplayName from "@/apiUtils";
import { IPagePreviewData } from "@/components/types/User";

type Props = {
  postInformation: PostItemData | undefined;
};

export default function index({ postInformation }: Props) {
  if (!postInformation) {
    return (
      <Flex
        justify="center"
        align="center"
        width="100%"
        minHeight={innerHeight}
      >
        <Text as="b" textColor="white" fontSize="20pt">
          Post couldn&apos;t be found.
        </Text>
      </Flex>
    );
  } else {
    return (
      <Flex width="100%" height="100%" justify="center" align="center">
        <PostPageLayout postInformation={postInformation} />
      </Flex>
    );
  }
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const userDisplayname = await getDisplayName(
    `Bearer ${context.req.cookies["firebase-auth.session-token"]}`
  );
  if (!userDisplayname)
    return {
      props: {
        postInformation: null,
      },
    };

  const username = context.query.username;
  const postDocId = context.query.postId;

  const postDocPath = `/users/${username}/posts/${postDocId}`;

  let postInformationDoc;
  try {
    postInformationDoc = await firestore.doc(postDocPath).get();
    if (!postInformationDoc.exists)
      throw new Error("'Post Doc' does not exist");
  } catch (error) {
    console.error(
      "Error while creating single post page. (We were getting post doc",
      error
    );
    return {
      props: {
        postInformation: null,
      },
    };
  }

  const postInformationServer: PostServerData =
    postInformationDoc.data() as PostServerData;

  // Get Like and Comment Status....
  const [likeStatus, followStatus] = await Promise.all([
    handleGetLikeStatus(userDisplayname, postInformationDoc),
    handleGetFollowStatus(userDisplayname, postInformationDoc),
  ]);

  const postInformation: PostItemData = {
    commentCount: postInformationServer.commentCount,
    creationTime: postInformationServer.creationTime,
    currentUserFollowThisSender: followStatus,
    currentUserLikedThisPost: likeStatus,
    description: postInformationServer.description,
    image: postInformationServer.image,
    likeCount: postInformationServer.likeCount,
    nftStatus: postInformationServer.nftStatus,
    postDocId: postInformationDoc.ref.id,
    senderUsername: postInformationServer.senderUsername,
  };

  const pagePreviewData: IPagePreviewData = {
    title: "Apidon",
    description: postInformation.description
      ? postInformation.description
      : `Look at ${postInformation.senderUsername}'s post!`,
    type: "website",
    url: `${process.env.NEXT_PUBLIC_USER_PANEL_BASE_URL}/${postInformation.senderUsername}/posts/${postInformation.postDocId}`,
    image: postInformation.image
      ? postInformation.image
      : "https://apidon.vercel.app/og.png",
  };

  console.log("Page Preview Data: ",pagePreviewData)

  return {
    props: {
      postInformation: postInformation,
      pagePreviewData: pagePreviewData,
    },
  };
}

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
    console.error(
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
    console.error(
      `Error while creating feed for ${operationFromUsername}. (We were getting follow status from post: ${postDoc.ref.path})`
    );
  }

  return followStatus;
};
