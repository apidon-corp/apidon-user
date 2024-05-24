import { auth } from "@/firebase/clientApp";
import useSendComment from "@/hooks/postHooks/useSendComment";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";
import {
  Flex,
  Icon,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  SkeletonCircle,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { AiOutlineClose, AiOutlineSend } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import { useRecoilValue } from "recoil";
import CommentItem from "../../Items/Post/CommentItem";
import { currentUserStateAtom } from "../../atoms/currentUserAtom";
import { CommendDataV2, OpenPanelName } from "../../types/Post";

type Props = {
  commentDatas: CommendDataV2[];
  postDocPath: string;

  openPanelNameValue: OpenPanelName;
  openPanelNameSetter: React.Dispatch<React.SetStateAction<OpenPanelName>>;
  commentCountSetter: React.Dispatch<React.SetStateAction<number>>;
};

export default function PostComments({
  commentDatas,
  postDocPath,
  openPanelNameSetter,
  openPanelNameValue,
  commentCountSetter,
}: Props) {
  const [commentsDataFinalLayer, setCommentsDataFinalLayer] = useState<
    CommendDataV2[]
  >([]);

  const { sendComment } = useSendComment();

  const commentInputRef = useRef<HTMLInputElement>(null);

  const currentUserState = useRecoilValue(currentUserStateAtom);

  const [commentSendLoading, setCommentSendLoading] = useState(false);

  const { getCollectionServer } = useGetFirebase();

  useEffect(() => {
    setCommentsDataFinalLayer(commentDatas);
  }, [commentDatas]);

  const handleSendComment = async () => {
    if (!commentInputRef.current) return;

    const currentComment = commentInputRef.current.value;
    if (currentComment.length === 0) return;

    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return;

    const displayName = currentUserAuthObject.displayName;
    if (!displayName) return;

    setCommentSendLoading(true);

    const createdCommentObject = await sendComment(postDocPath, currentComment);
    if (!createdCommentObject) return setCommentSendLoading(false);

    setCommentsDataFinalLayer((prev) => [createdCommentObject, ...prev]);
    commentCountSetter((prev) => prev + 1);

    if (commentInputRef.current) commentInputRef.current.value = "";
    return setCommentSendLoading(false);
  };

  return (
    <Modal
      onClose={() => openPanelNameSetter("main")}
      size={{
        base: "full",
        sm: "full",
        md: "md",
        lg: "md",
      }}
      isOpen={openPanelNameValue === "comments"}
      autoFocus={false}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent
        bg="black"
        minHeight={{
          md: "500px",
          lg: "500px",
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
          <Text textColor="white" fontSize="17pt" fontWeight="700">
            Comments
          </Text>

          <Icon
            as={AiOutlineClose}
            color="white"
            fontSize="15pt"
            cursor="pointer"
            onClick={() => openPanelNameSetter("main")}
          />
        </Flex>

        <ModalBody>
          <Stack gap={3}>
            {commentsDataFinalLayer.map((commentData, i) => (
              <CommentItem
                key={`${commentData.sender}-${commentData.message}-${commentData.ts}`}
                commentData={commentData}
                openPanelNameSetter={openPanelNameSetter}
                commentCountSetter={commentCountSetter}
                setCommentsDataFinalLayer={setCommentsDataFinalLayer}
              />
            ))}
          </Stack>

          <Text
            fontSize="10pt"
            textColor="white"
            hidden={commentsDataFinalLayer.length !== 0}
          >
            No comments yet.
          </Text>
        </ModalBody>
        <Flex
          id="comment-send-area"
          position="sticky"
          bottom={2}
          width="100%"
          height="70px"
          bg="black"
          px={3}
          hidden={!currentUserState.isThereCurrentUser}
        >
          <Flex align="center" width="100%" border="1px" rounded="full" p={2}>
            <Image
              alt=""
              src={currentUserState.profilePhoto}
              rounded="full"
              width="50px"
              height="50px"
              fallback={
                currentUserState.profilePhoto ? (
                  <Flex>
                    <SkeletonCircle
                      size="50px"
                      startColor="gray.100"
                      endColor="gray.800"
                    />
                  </Flex>
                ) : (
                  <Icon
                    as={CgProfile}
                    color="white"
                    height="50px"
                    width="50px"
                  />
                )
              }
            />
            <Input
              ref={commentInputRef}
              placeholder="Add a comment..."
              _placeholder={{
                fontSize: "10pt",
              }}
              textColor="white"
              focusBorderColor="gray.900"
              borderColor="gray.900"
              _hover={{
                borderColor: "gray.900",
              }}
              ml="3"
              height="40px"
              rounded="full"
              isDisabled={commentSendLoading}
            />
            {commentSendLoading ? (
              <Flex ml={2} mr={1}>
                <Spinner color="white" />
              </Flex>
            ) : (
              <Icon
                as={AiOutlineSend}
                color="white"
                ml={2}
                mr={1}
                cursor="pointer"
                fontSize="20pt"
                onClick={handleSendComment}
              />
            )}
          </Flex>
        </Flex>
      </ModalContent>
    </Modal>
  );
}
