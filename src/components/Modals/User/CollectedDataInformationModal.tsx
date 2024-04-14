import CommentedItem from "@/components/Items/User/CommentedItem";
import LikedItem from "@/components/Items/User/LikedItem";
import { collectedDataInformationModalAtom } from "@/components/atoms/CollectedDataInformationModalAtom";
import { CommentData, PostServerData } from "@/components/types/Post";
import {
  CommentedItemData,
  LikeDataForUsersPersonal,
  LikedItemData,
} from "@/components/types/User";
import { auth } from "@/firebase/clientApp";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";
import {
  Button,
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";

import { useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { useRecoilState } from "recoil";

export default function CollectedDataInformationModal() {
  const [modalOpenState, setModalOpenState] = useRecoilState(
    collectedDataInformationModalAtom
  );

  const [collectedLikeInformationsArray, setCollectedLikeInformationsArray] =
    useState<LikedItemData[]>([]);

  const [
    collectedCommentInformationsArray,
    setCollectedCommentInformationsArray,
  ] = useState<CommentedItemData[]>([]);

  const [loading, setLoading] = useState(true);

  const { getDocServer, getCollectionServer } = useGetFirebase();

  const getLikeData = async () => {
    // Getting Like Informations....

    const likeCollection = await getCollectionServer(
      `/users/${auth.currentUser?.displayName}/personal/postInteractions/likedPosts`
    );
    if (!likeCollection) return;

    let collectedLikeInformationsArrayLocal: LikedItemData[] = [];
    for (const likeInformationDoc of likeCollection.docsArray) {
      const postDoc = await getDocServer(likeInformationDoc.data.postPath);
      if (!postDoc) continue;

      const senderUsername = (postDoc.data as PostServerData).senderUsername;

      const postId = postDoc.ref.id;
      const postURL = `${process.env.NEXT_PUBLIC_USER_PANEL_BASE_URL}/${senderUsername}/posts/${postId}`;

      const timestamp = (likeInformationDoc.data as LikeDataForUsersPersonal)
        .ts;

      const collectedLikeDataObject: LikedItemData = {
        postSenderUsername: senderUsername,
        postURL: postURL,
        timestamp: timestamp,
        postDocPath: postDoc.ref.path,
      };
      collectedLikeInformationsArrayLocal.push(collectedLikeDataObject);
    }

    collectedLikeInformationsArrayLocal.sort(
      (a, b) => b.timestamp - a.timestamp
    );

    setCollectedLikeInformationsArray(collectedLikeInformationsArrayLocal);
  };

  const getCommentData = async () => {
    // Getting Comment Informations...

    const commentPostCollection = await getCollectionServer(
      `users/${auth.currentUser?.displayName}/personal/postInteractions/commentedPosts`
    );

    if (!commentPostCollection) return;

    let collectedCommentInformationArray: CommentedItemData[] = [];
    for (const commentedPostDoc of commentPostCollection.docsArray) {
      const commentCollection = await getCollectionServer(
        `${commentedPostDoc.ref.path}/comments`
      );

      if (!commentCollection) continue;

      for (const commentDoc of commentCollection.docsArray) {
        const postDoc = await getDocServer(commentDoc.data.postDocPath);
        if (!postDoc) continue;

        const postDocData = postDoc.data as PostServerData;

        const postSenderUsername = postDocData.senderUsername;

        const postId = postDoc.ref.id;
        const postURL = `${process.env.NEXT_PUBLIC_USER_PANEL_BASE_URL}/${postSenderUsername}/posts/${postId}`;

        // Getting comment text....
        const commentDocAtPost = await getDocServer(
          `${postDoc.ref.path}/comments/${auth.currentUser?.displayName}/comments/${commentDoc.ref.id}`
        );
        if (!commentDocAtPost) continue;

        const commentDataAtPost = commentDocAtPost.data as CommentData;
        const comment = commentDataAtPost.comment;

        const commentedItemData: CommentedItemData = {
          timestamp: commentDoc.data.creationTime,
          comment: comment,
          commentDocPathOnPost: commentDocAtPost.ref.path,
          postSenderUsername: postSenderUsername,
          postURL: postURL,
        };

        collectedCommentInformationArray.push(commentedItemData);
      }
    }
    collectedCommentInformationArray.sort((a, b) => b.timestamp - a.timestamp);

    setCollectedCommentInformationsArray(collectedCommentInformationArray);
  };

  const handleGetData = async () => {
    setLoading(true);

    await Promise.all([getLikeData(), getCommentData()]);

    setLoading(false);
  };

  useEffect(() => {
    if (modalOpenState) handleGetData();
  }, [modalOpenState]);

  return (
    <Modal
      id="CollectedDataInformationModal"
      size={{
        base: "full",
        sm: "full",
        md: "md",
        lg: "md",
      }}
      isOpen={modalOpenState}
      autoFocus={false}
      onClose={() => {
        setModalOpenState(false);
      }}
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="8px" />
      <ModalContent
        bg="black"
        minHeight={{
          md: "500px",
          large: "500px",
        }}
      >
        <Flex
          position="sticky"
          top="0"
          px={6}
          align="center"
          justify="space-between"
          height="50px"
          bg="black"
        >
          <Flex textColor="white" fontSize="17pt" fontWeight="700" gap={2}>
            Collected Data
          </Flex>
          <Icon
            as={AiOutlineClose}
            color="white"
            fontSize="15pt"
            cursor="pointer"
            onClick={() => {
              setModalOpenState(false);
            }}
          />
        </Flex>
        <ModalBody>
          <Flex hidden={!loading}>
            <Spinner width="50px" height="50px" color="gray.500" />
          </Flex>
          <Flex direction="column" gap="20px" hidden={loading}>
            <Flex direction="column" id="like-section" gap="5px">
              <Text color="gray.500" fontSize="10pt" fontWeight="600">
                Your Likes
              </Text>
              <Stack height="17em" overflow="auto">
                {collectedLikeInformationsArray.map((e) => (
                  <LikedItem
                    timestamp={e.timestamp}
                    postSenderUsername={e.postSenderUsername}
                    postURL={e.postURL}
                    postDocPath={e.postDocPath}
                    key={`${e.postDocPath}+${e.timestamp}`}
                  />
                ))}
                {collectedLikeInformationsArray.length === 0 && (
                  <Text color="gray.400" fontSize="9pt" fontWeight="700">
                    When you liked some posts, they will show here.
                  </Text>
                )}
              </Stack>
            </Flex>
            <Flex direction="column" id="comment-section" gap="5px">
              <Text color="gray.500" fontSize="10pt" fontWeight="600">
                Your Comments
              </Text>
              <Stack>
                <Stack maxHeight="20em" overflow="auto">
                  {collectedCommentInformationsArray.map((e) => (
                    <CommentedItem
                      timestamp={e.timestamp}
                      postSenderUsername={e.postSenderUsername}
                      postURL={e.postURL}
                      commentDocPathOnPost={e.commentDocPathOnPost}
                      comment={e.comment}
                      key={`${e.commentDocPathOnPost}+${e.timestamp}`}
                    />
                  ))}
                  {collectedCommentInformationsArray.length === 0 && (
                    <Text color="gray.400" fontSize="9pt" fontWeight="700">
                      When you made a comment, it will show here.
                    </Text>
                  )}
                </Stack>
              </Stack>
            </Flex>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            colorScheme="blue"
            mr="3"
            onClick={() => {
              setModalOpenState(false);
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
