import PostNFT from "@/components/Modals/Post/PostNFT";
import { Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PostComments from "../../Modals/Post/PostComments";
import PostLikes from "../../Modals/Post/PostLikes";
import PostFront from "../../Post/PostFront";
import {
  OpenPanelName,
  PostItemDataV2,
  PostServerDataV2,
} from "../../types/Post";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, firestore } from "@/firebase/clientApp";

type Props = {
  postItemData: PostItemDataV2;
};

export default function PostItem({ postItemData }: Props) {
  const [openPanelName, setOpenPanelName] = useState<OpenPanelName>("main");

  const [postItemDataFinalLayer, setPostItemDataFinalLayer] =
    useState<PostItemDataV2>(postItemData);

  useEffect(() => {
    setPostItemDataFinalLayer(postItemData);
  }, [postItemData]);

  useEffect(() => {
    const postDocRef = doc(
      firestore,
      `/users/${postItemData.senderUsername}/posts/${postItemData.id}`
    );

    const unsubscribe = onSnapshot(postDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        return console.error("Post doc not exists from realtime listening.");
      }

      const postDocData = snapshot.data() as PostServerDataV2;
      if (!postDocData) {
        return console.error("Post doc data is undefined.");
      }

      const likeStatus = postDocData.likes
        .map((l) => l.sender)
        .includes(auth.currentUser?.displayName as string);

      const newPostItemData: PostItemDataV2 = {
        ...postDocData,
        currentUserFollowThisSender: true,
        currentUserLikedThisPost: likeStatus,
      };

      setPostItemDataFinalLayer(newPostItemData);
    });

    return () => unsubscribe();
  }, [postItemData.id]);

  return (
    <Flex width="100%" height="100%">
      <PostFront
        postFrontData={{
          ...postItemDataFinalLayer,
          commentCount: postItemDataFinalLayer.commentCount,
        }}
        openPanelNameSetter={setOpenPanelName}
      />
      <PostComments
        postDocPath={`/users/${postItemDataFinalLayer.senderUsername}/posts/${postItemDataFinalLayer.id}`}
        commentDatas={postItemDataFinalLayer.comments}
        openPanelNameSetter={setOpenPanelName}
        openPanelNameValue={openPanelName}
      />
      <PostLikes
        likeData={postItemDataFinalLayer.likes}
        postSenderUsername={postItemDataFinalLayer.senderUsername}
        openPanelNameSetter={setOpenPanelName}
        openPanelNameValue={openPanelName}
      />
      <PostNFT
        openPanelNameValue={openPanelName}
        openPanelNameValueSetter={setOpenPanelName}
        postInformation={{
          ...postItemDataFinalLayer,
          commentCount: postItemDataFinalLayer.commentCount,
        }}
      />
    </Flex>
  );
}
