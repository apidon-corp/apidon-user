import PostNFT from "@/components/Modals/Post/PostNFT";
import { firestore } from "@/firebase/clientApp";
import { Flex } from "@chakra-ui/react";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import PostComments from "../../Modals/Post/PostComments";
import PostLikes from "../../Modals/Post/PostLikes";
import PostFront from "../../Post/PostFront";
import { OpenPanelName, PostServerDataV2 } from "../../types/Post";

type Props = {
  postServerData: PostServerDataV2;
};

export default function PostItem({ postServerData }: Props) {
  const [openPanelName, setOpenPanelName] = useState<OpenPanelName>("main");

  const [postServerDataFinalLayer, setPostServerDataFinalLayer] =
    useState<PostServerDataV2>(postServerData);

  const [isPostDeleted, setIsPostDeleted] = useState(false);

  useEffect(() => {
    setPostServerDataFinalLayer(postServerData);
  }, [postServerData]);

  useEffect(() => {
    const postDocRef = doc(
      firestore,
      `/users/${postServerDataFinalLayer.senderUsername}/posts/${postServerDataFinalLayer.id}`
    );

    const unsubscribe = onSnapshot(
      postDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          return console.error("Post doc not exists from realtime listening.");
        }

        const postDocData = snapshot.data() as PostServerDataV2;
        if (!postDocData) {
          return console.error("Post doc data is undefined.");
        }

        setPostServerDataFinalLayer(postDocData);
      },
      (error) => {
        console.error("Error on realtime listening: \n", error);
      }
    );

    return () => unsubscribe();
  }, [postServerData.id]);

  return (
    <>
      {!isPostDeleted && (
        <Flex width="100%">
          <PostFront
            postFrontData={{
              ...postServerDataFinalLayer,
              commentCount: postServerDataFinalLayer.commentCount,
              likers: postServerDataFinalLayer.likes.map((like) => like.sender),
            }}
            openPanelNameSetter={setOpenPanelName}
            setIsPostDeleted={setIsPostDeleted}
          />
          <PostComments
            postDocPath={`/users/${postServerDataFinalLayer.senderUsername}/posts/${postServerDataFinalLayer.id}`}
            commentDatas={postServerDataFinalLayer.comments}
            openPanelNameSetter={setOpenPanelName}
            openPanelNameValue={openPanelName}
          />
          <PostLikes
            likeData={postServerDataFinalLayer.likes}
            postSenderUsername={postServerDataFinalLayer.senderUsername}
            openPanelNameSetter={setOpenPanelName}
            openPanelNameValue={openPanelName}
          />
          <PostNFT
            openPanelNameValue={openPanelName}
            openPanelNameValueSetter={setOpenPanelName}
            postInformation={{
              ...postServerDataFinalLayer,
              commentCount: postServerDataFinalLayer.commentCount,
            }}
          />
        </Flex>
      )}
    </>
  );
}
