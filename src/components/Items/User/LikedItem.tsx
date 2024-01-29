import { authModalStateAtom } from "@/components/atoms/authModalAtom";
import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import { LikedItemData } from "@/components/types/User";
import usePostLike from "@/hooks/postHooks/usePostLike";
import { Flex, Icon, Spinner, Text } from "@chakra-ui/react";
import moment from "moment";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";

import { useRecoilValue, useSetRecoilState } from "recoil";

export default function LikedItem({
  timestamp,
  postSenderUsername,
  postURL,
  postDocPath,
}: LikedItemData) {
  const router = useRouter();

  const currentUserState = useRecoilValue(currentUserStateAtom);
  const setAuthModalState = useSetRecoilState(authModalStateAtom);

  const { like } = usePostLike();

  const [loading, setLoading] = useState<boolean>(false);
  const [likeIconType, setLikeIconType] = useState<"outline" | "fill">("fill");

  const handleLikeOrDeLike = async (postDocPath: string, opCode: -1 | 1) => {
    if (!currentUserState.isThereCurrentUser) {
      console.log("Only logged users have ability to like");
      setAuthModalState((prev) => ({
        ...prev,
        open: true,
        view: "logIn",
      }));
      return;
    }

    setLoading(true);

    const operationResult = await like(postDocPath, opCode);

    if (!operationResult) {
      console.error("Error on like or delike at LikedItem");
    } else {
      // Change Icon
      if (opCode === 1) {
        setLikeIconType("fill");
      } else {
        setLikeIconType("outline");
      }
      console.log("Like or Delike operation successfull");
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
      minHeight="80px"
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
            Like Time:
          </Text>
          <Text color="gray.300" fontSize="10pt" fontWeight="700">
            {moment(new Date(timestamp)).fromNow()}
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
          <Icon
            as={likeIconType === "fill" ? FaHeart : FaRegHeart}
            color="red"
            fontSize="50px"
            onClick={() => {
              handleLikeOrDeLike(postDocPath, likeIconType === "fill" ? -1 : 1);
            }}
            cursor="pointer"
          />
        )}
      </Flex>
    </Flex>
  );
}
