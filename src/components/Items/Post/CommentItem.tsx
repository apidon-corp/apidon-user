import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import useCommentDelete from "@/hooks/postHooks/useCommentDelete";
import {
  Flex,
  Icon,
  Image,
  SkeletonCircle,
  Spinner,
  Text,
} from "@chakra-ui/react";
import moment from "moment";
import { useRouter } from "next/router";
import React, { SetStateAction, useEffect, useState } from "react";
import { BsDot, BsTrash } from "react-icons/bs";
import { CgProfile } from "react-icons/cg";
import { useRecoilValue } from "recoil";
import { CommentDataWithCommentDocPath, OpenPanelName } from "../../types/Post";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";

type Props = {
  commentDataWithCommentDocId: CommentDataWithCommentDocPath;
  openPanelNameSetter: React.Dispatch<SetStateAction<OpenPanelName>>;
  commentCountSetter: React.Dispatch<SetStateAction<number>>;

  commentsDatasWithCommentDocPathSetter: React.Dispatch<
    SetStateAction<CommentDataWithCommentDocPath[]>
  >;
};

export default function CommentItem({
  commentDataWithCommentDocId,
  openPanelNameSetter,
  commentCountSetter,
  commentsDatasWithCommentDocPathSetter,
}: Props) {
  const [commentSenderPhoto, setCommentSenderPhoto] = useState("");
  const [gettingCommentSenderPhoto, setGettingCommentSenderPhoto] =
    useState(false);

  const router = useRouter();

  const currentUserState = useRecoilValue(currentUserStateAtom);

  const { commentDelete } = useCommentDelete();

  const [commentDeletLoading, setCommentDeleteLoading] = useState(false);

  const { getDocServer } = useGetFirebase();

  useEffect(() => {
    getCommentSenderPhoto();
  }, []);

  const getCommentSenderPhoto = async () => {
    setGettingCommentSenderPhoto(true);

    const existsStatus = await getDocServer(
      `users/${commentDataWithCommentDocId.commentSenderUsername}`
    );

    const docResult = await getDocServer(
      `users/${commentDataWithCommentDocId.commentSenderUsername}`
    );

    if (!docResult) return;
    if (existsStatus) {
      setCommentSenderPhoto(docResult.data.profilePhoto as string);
    }
    setGettingCommentSenderPhoto(false);
  };

  const handleDeleteComment = async () => {
    if (!currentUserState.isThereCurrentUser) return;

    setCommentDeleteLoading(true);
    const operationResult = await commentDelete(
      commentDataWithCommentDocId.commentDocPath
    );

    if (!operationResult) {
      return setCommentDeleteLoading(false);
    }

    commentsDatasWithCommentDocPathSetter((prev) =>
      prev.filter(
        (a) => a.commentDocPath !== commentDataWithCommentDocId.commentDocPath
      )
    );
    commentCountSetter((prev) => prev - 1);
    setCommentDeleteLoading(false);
  };

  return (
    <Flex id="main-comment-area" position="relative" align="center">
      <Flex align="center" gap={2}>
        <Image
          alt=""
          src={commentSenderPhoto}
          rounded="full"
          width="35px"
          height="35px"
          cursor="pointer"
          onClick={() => {
            router.push(
              `/${commentDataWithCommentDocId.commentSenderUsername}`
            );
            openPanelNameSetter("main");
          }}
          fallback={
            !!commentSenderPhoto || gettingCommentSenderPhoto ? (
              <Flex id="i-put-this-flex to adjust skeleton">
                <SkeletonCircle
                  width="35px"
                  startColor="gray.100"
                  endColor="gray.800"
                />
              </Flex>
            ) : (
              <Icon
                as={CgProfile}
                color="white"
                width="35px"
                cursor="pointer"
                onClick={() => {
                  router.push(
                    `/${commentDataWithCommentDocId.commentSenderUsername}`
                  );
                  openPanelNameSetter("main");
                }}
              />
            )
          }
        />
        <Flex direction="column">
          <Flex align="center">
            <Text
              fontSize="10pt"
              textColor="white"
              as="b"
              cursor="pointer"
              onClick={() => {
                router.push(
                  `/${commentDataWithCommentDocId.commentSenderUsername}`
                );
                openPanelNameSetter("main");
              }}
            >
              {commentDataWithCommentDocId.commentSenderUsername}
            </Text>
            <Icon as={BsDot} color="white" fontSize="13px" />
            <Text as="i" fontSize="8pt" textColor="gray.300">
              {moment(
                new Date(commentDataWithCommentDocId.creationTime)
              ).fromNow(true)}
            </Text>
            <Flex
              hidden={
                commentDataWithCommentDocId.commentSenderUsername !==
                currentUserState.username
              }
            >
              <>
                {commentDeletLoading ? (
                  <Flex>
                    <Spinner color="red" size="xs" ml={2} />
                  </Flex>
                ) : (
                  <Icon
                    ml={2}
                    as={BsTrash}
                    fontSize="9pt"
                    color="red"
                    cursor="pointer"
                    onClick={handleDeleteComment}
                  />
                )}
              </>
            </Flex>
          </Flex>
          <Text fontSize="10pt" textColor="white" wordBreak="break-word" mr="2">
            {commentDataWithCommentDocId.comment}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}
