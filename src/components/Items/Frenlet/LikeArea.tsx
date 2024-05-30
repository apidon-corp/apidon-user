import { FrenletServerData } from "@/components/types/Frenlet";
import { auth } from "@/firebase/clientApp";
import {
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { BsHeart, BsHeartFill } from "react-icons/bs";
import { LikeItem } from "./LikeItem";

type Props = {
  likeCount: number;
  likes: FrenletServerData["likes"];
  frenletDocPath: string;
};

export default function LikeArea({ likeCount, likes, frenletDocPath }: Props) {
  const [likedByThisUser, setLikedByThisUser] = useState(false);
  const [likesPanelOpen, setLikesPanelOpen] = useState(false);

  useEffect(() => {
    checkLikeStatusOfUser();
  }, [likes]);

  const checkLikeStatusOfUser = () => {
    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return setLikedByThisUser(false);

    const displayName = currentUserAuthObject.displayName;
    if (!displayName) return setLikedByThisUser(false);

    const likeSenders = likes.map((like) => like.sender);
    if (!likeSenders.includes(displayName)) return setLikedByThisUser(false);

    setLikedByThisUser(true);
  };

  const handleLikeButtonClick = async () => {
    if (likedByThisUser) return;

    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return;

    const displayName = currentUserAuthObject.displayName;
    if (!displayName) return;

    setLikedByThisUser(true);

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("api/frenlet/sendLike", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          frenletDocPath: frenletDocPath,
          action: "like",
        }),
      });

      if (!response.ok) {
        console.error(
          "Response from sendLike API is not okay: : \n",
          await response.text()
        );
        return setLikedByThisUser(false);
      }

      // Everything is alright.
      return;
    } catch (error) {
      console.error("Error on fetching to sendLike API: \n", error);
      return setLikedByThisUser(false);
    }
  };

  const handleDeLikeButtonClick = async () => {
    if (!likedByThisUser) return;

    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return;

    setLikedByThisUser(false);

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("api/frenlet/sendLike", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          frenletDocPath: frenletDocPath,
          action: "delike",
        }),
      });

      if (!response.ok) {
        console.error(
          "Response from sendLike API is not okay: : \n",
          await response.text()
        );
        return setLikedByThisUser(true);
      }

      // Everything is alright.
      return;
    } catch (error) {
      console.error("Error on fetching to sendLike API: \n", error);
      return setLikedByThisUser(true);
    }
  };

  const handleLikeCountButton = () => {
    setLikesPanelOpen(true);
  };

  return (
    <>
      <Flex
        width="100%"
        id="like-area-flex"
        align="center"
        justify="center"
        gap="0.25em"
        direction="column"
      >
        {likedByThisUser && (
          <Icon
            as={BsHeartFill}
            width="20pt"
            height="20pt"
            color="red"
            cursor="pointer"
            onClick={handleDeLikeButtonClick}
          />
        )}
        {!likedByThisUser && (
          <Icon
            as={BsHeart}
            width="20pt"
            height="20pt"
            color="red"
            cursor="pointer"
            onClick={handleLikeButtonClick}
          />
        )}
        <Text
          color="white"
          fontSize="9pt"
          fontWeight="600"
          cursor="pointer"
          onClick={handleLikeCountButton}
        >
          {likeCount} Likes
        </Text>
      </Flex>

      <Modal
        isOpen={likesPanelOpen}
        onClose={() => {
          setLikesPanelOpen(false);
        }}
        size={{
          base: "full",
          sm: "full",
          md: "lg",
          lg: "lg",
        }}
        scrollBehavior="inside"
      >
        <ModalOverlay backdropFilter="auto" backdropBlur="10px" />
        <ModalContent
          bg="#28282B"
          minHeight={{
            md: "500px",
            lg: "500px",
          }}
        >
          <ModalHeader color="white">Likes</ModalHeader>
          <ModalCloseButton color="white" />

          <ModalBody display="flex">
            <Flex width="100%" align="center" direction="column" gap="1em">
              {likes
                .sort((a, b) => b.ts - a.ts)
                .map((like) => (
                  <LikeItem key={like.sender} username={like.sender} />
                ))}
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
