import PostNFT from "@/components/Modals/Post/PostNFT";
import { Flex } from "@chakra-ui/react";
import { useState } from "react";
import PostComments from "../../Modals/Post/PostComments";
import PostLikes from "../../Modals/Post/PostLikes";
import PostFront from "../../Post/PostFront";
import { OpenPanelName, PostItemDataV2 } from "../../types/Post";

type Props = {
  postItemData: PostItemDataV2;
};

export default function PostItem({ postItemData }: Props) {
  const [openPanelName, setOpenPanelName] = useState<OpenPanelName>("main");

  // Update realtime comment count when add or delete (locally)
  const [commentCount, setCommentCount] = useState(postItemData.commentCount);

  return (
    <Flex width="100%" height="100%">
      <PostFront
        postFrontData={{
          ...postItemData,
          commentCount: commentCount,
        }}
        openPanelNameSetter={setOpenPanelName}
      />
      <PostComments
        commentsInfo={{
          postDocPath: `users/${postItemData.senderUsername}/posts/${postItemData.postDocId}`,
          postCommentCount: commentCount,
        }}
        openPanelNameSetter={setOpenPanelName}
        openPanelNameValue={openPanelName}
        commentCountSetter={setCommentCount}
      />
      <PostLikes
        likeData={postItemData.likes}
        postSenderUsername={postItemData.senderUsername}
        openPanelNameSetter={setOpenPanelName}
        openPanelNameValue={openPanelName}
      />
      <PostNFT
        openPanelNameValue={openPanelName}
        openPanelNameValueSetter={setOpenPanelName}
        postInformation={{
          ...postItemData,
          commentCount: commentCount,
        }}
      />
    </Flex>
  );
}
