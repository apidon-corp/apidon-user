import PostPageLayout from "@/components/Layout/PostPageLayout";
import { PostServerDataV2 } from "@/components/types/Post";
import { IPagePreviewData } from "@/components/types/User";
import { firestore } from "@/firebase/adminApp";
import { Flex, Text } from "@chakra-ui/react";
import { GetServerSidePropsContext } from "next";

type Props = {
  postInformation: PostServerDataV2 | undefined;
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
        <PostPageLayout postDocServerData={postInformation} />
      </Flex>
    );
  }
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
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
      "Error while creating single post page. (We were getting post doc)",
      error
    );
    return {
      props: {
        postInformation: null,
      },
    };
  }

  const postInformationServer = postInformationDoc.data() as PostServerDataV2;

  const pagePreviewData: IPagePreviewData = {
    title: `${postInformationServer.senderUsername}'s post`,
    description: postInformationServer.description
      ? postInformationServer.description
      : `Look at ${postInformationServer.senderUsername}'s post!`,
    type: "website",
    url: `${process.env.NEXT_PUBLIC_USER_PANEL_BASE_URL}/${postInformationServer.senderUsername}/posts/${postInformationDoc.ref.id}`,
    image: postInformationServer.image,
  };

  return {
    props: {
      postInformation: postInformationServer,
      pagePreviewData: pagePreviewData,
    },
  };
}
