import { collectedDataInformationModalAtom } from "@/components/atoms/CollectedDataInformationModalAtom";
import { authModalStateAtom } from "@/components/atoms/authModalAtom";
import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import { CommentedItemData } from "@/components/types/User";
import useCommentDelete from "@/hooks/postHooks/useCommentDelete";
import { Flex, Icon, Spinner, Text } from "@chakra-ui/react";
import moment from "moment";
import { useRouter } from "next/router";
import { useState } from "react";

import { FaRegTrashAlt } from "react-icons/fa";

import { useRecoilValue, useSetRecoilState } from "recoil";

export default function CommentedItem({
  timestamp,
  postSenderUsername,
  postURL,
  commentDocPathOnPost,
  comment,
}: CommentedItemData) {
  const router = useRouter();

  const currentUserState = useRecoilValue(currentUserStateAtom);
  const setAuthModalState = useSetRecoilState(authModalStateAtom);

  const setCollectedDataModelState = useSetRecoilState(
    collectedDataInformationModalAtom
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [iconType, setIconType] = useState<"not-deleted" | "deleted">(
    "not-deleted"
  );

  const { commentDelete } = useCommentDelete();

  const handleDeleteComment = async () => {
    if (!currentUserState.isThereCurrentUser) {
      console.log("Only logged users have ability to delete comments.");
      setAuthModalState((prev) => ({
        ...prev,
        open: true,
        view: "logIn",
      }));
      return;
    }

    setLoading(true);

    const operationResult = true; //await commentDelete()

    if (!operationResult) {
      console.log("Comment Delete operation is failed.");
      return;
    } else {
      console.log("Comment Delete operation is successfull.");
      setIconType("deleted");
    }

    setLoading(false);
  };

  return (
    <Flex
      borderWidth="1px"
      borderColor="gray.500"
      borderStyle="solid"
      borderRadius="10px"
      bg="black"
      width="100%"
      minHeight="95px"
      align="center"
      justifyContent="space-between"
      paddingX="2"
    >
      <Flex direction="column">
        <Flex gap="5px">
          <Text color="gray.500" fontSize="10pt" fontWeight="600">
            Post Sender:
          </Text>
          <Text
            color="gray.300"
            fontSize="10pt"
            fontWeight="700"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            maxWidth="8rem"
          >
            {postSenderUsername}
          </Text>
        </Flex>
        <Flex gap="5px">
          <Text color="gray.500" fontSize="10pt" fontWeight="600">
            Comment Time:
          </Text>
          <Text color="gray.300" fontSize="10pt" fontWeight="700">
            {moment(new Date(timestamp)).fromNow()}
          </Text>
        </Flex>
        <Flex gap="5px">
          <Text color="gray.500" fontSize="10pt" fontWeight="600">
            Comment:
          </Text>
          <Text
            color="gray.300"
            fontSize="10pt"
            fontWeight="700"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            maxWidth="8rem"
          >
            {comment}
          </Text>
        </Flex>
        <Flex gap="5px">
          <Text
            color="#DE3163"
            fontSize="10pt"
            fontWeight="600"
            textDecoration="underline"
            cursor="pointer"
            onClick={() => {
              setCollectedDataModelState(false);
              router.push(postURL);
            }}
          >
            View Post
          </Text>
        </Flex>
      </Flex>
      <Flex height="auto" align="center" justify="center" mr={1}>
        {loading ? (
          <Spinner width="50px" height="50px" />
        ) : (
          <>
            {iconType === "not-deleted" ? (
              <Icon
                as={FaRegTrashAlt}
                color="red"
                fontSize="50px"
                onClick={() => {
                  handleDeleteComment();
                }}
                cursor="pointer"
              />
            ) : (
              <Text color="red" fontSize="12pt" fontWeight="700">
                Deleted
              </Text>
            )}
          </>
        )}
      </Flex>
    </Flex>
  );
}
