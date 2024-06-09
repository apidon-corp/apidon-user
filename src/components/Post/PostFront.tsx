import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AspectRatio,
  Button,
  Flex,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SkeletonCircle,
  SkeletonText,
  Text,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import {
  AiFillHeart,
  AiOutlineComment,
  AiOutlineHeart,
  AiOutlineMenu,
} from "react-icons/ai";
import { BsDot, BsImage } from "react-icons/bs";

import usePostDelete from "@/hooks/postHooks/usePostDelete";
import useFollow from "@/hooks/socialHooks/useFollow";

import { auth, firestore } from "@/firebase/clientApp";
import { doc, onSnapshot } from "firebase/firestore";
import moment from "moment";
import { useRouter } from "next/router";
import { CgProfile } from "react-icons/cg";
import { IoMdLink } from "react-icons/io";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { authModalStateAtom } from "../atoms/authModalAtom";
import { currentUserStateAtom } from "../atoms/currentUserAtom";
import { OpenPanelName, PostFrontData } from "../types/Post";
import { UserInServer } from "../types/User";

type Props = {
  postFrontData: PostFrontData;
  openPanelNameSetter: React.Dispatch<React.SetStateAction<OpenPanelName>>;
  setIsPostDeleted: Dispatch<SetStateAction<boolean>>;
};

export default function PostFront({
  postFrontData,
  openPanelNameSetter,
  setIsPostDeleted,
}: Props) {
  const currentUserState = useRecoilValue(currentUserStateAtom);

  const router = useRouter();

  const setAuthModalState = useSetRecoilState(authModalStateAtom);

  const { follow } = useFollow();

  const { postDelete, postDeletionLoading } = usePostDelete();

  const leastDestructiveRef = useRef<HTMLButtonElement>(null);
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);

  const [linkCopied, setLinkCopied] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const [postSenderData, setPostSenderData] = useState<UserInServer>();
  const [isFollowingThisSender, setIsFollowingThisSender] = useState(false);
  const [followOperationLoading, setFollowOperationLoading] = useState(false);

  useEffect(() => {
    const displayName = auth.currentUser?.displayName;
    if (!displayName) return;

    setIsLiked(postFrontData.likers.includes(displayName));
  }, []);

  useEffect(() => {
    if (linkCopied) {
      setTimeout(() => {
        setLinkCopied(false);
      }, 3000);
    }
  }, [linkCopied]);

  useEffect(() => {
    const senderDocReference = doc(
      firestore,
      `/users/${postFrontData.senderUsername}`
    );

    const unsubscribe = onSnapshot(
      senderDocReference,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const senderDocData = snapshot.data() as UserInServer;
        if (!senderDocData) return;

        setPostSenderData(senderDocData);
      },
      (error) => {
        console.error("Error on realtime listening: \n", error);
      }
    );

    return () => unsubscribe();
  }, [postFrontData.senderUsername]);

  useEffect(() => {
    const displayName = auth.currentUser?.displayName;
    if (!displayName) return;

    if (displayName === postFrontData.senderUsername) {
      return setIsFollowingThisSender(true);
    }

    const followerDocForCurrentUserOnSender = doc(
      firestore,
      `/users/${postFrontData.senderUsername}/followers/${displayName}`
    );

    const unsubscribe = onSnapshot(
      followerDocForCurrentUserOnSender,
      (snapshot) => {
        if (!snapshot.exists()) return;
        setIsFollowingThisSender(true);
      }
    );

    return () => unsubscribe();
  }, [postFrontData.senderUsername]);

  const handleFollowOnPost = async () => {
    if (!currentUserState.isThereCurrentUser) {
      console.log("Login First to Follow");
      setAuthModalState((prev) => ({
        ...prev,
        open: true,
      }));
      return;
    }

    setFollowOperationLoading(true);

    // Follow
    const operationResult = await follow(postFrontData.senderUsername, 1);
    if (!operationResult) return setFollowOperationLoading(false);

    setFollowOperationLoading(false);
  };

  const handleLike = async () => {
    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) {
      return setAuthModalState((prev) => ({
        ...prev,
        open: true,
        view: "logIn",
      }));
    }

    const displayName = auth.currentUser?.displayName;
    if (!displayName) return;

    if (likeLoading) return;

    setIsLiked(true);
    setLikeLoading(true);

    try {
      const idToken = await currentUserAuthObject.getIdToken();
      const response = await fetch(`/api/postv2/postLike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: "like",
          postDocPath: `users/${postFrontData.senderUsername}/posts/${postFrontData.id}`,
        }),
      });

      if (!response.ok) {
        setLikeLoading(false);
        setIsLiked(false);
        return console.error(
          "Response from postLike API is not okay: \n",
          await response.text()
        );
      }

      return setLikeLoading(false);
    } catch (error) {
      setIsLiked(false);
      console.error("Error on fetching to postLike API: \n", error);
      return setLikeLoading(false);
    }
  };

  const handleDeLike = async () => {
    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) {
      return setAuthModalState((prev) => ({
        ...prev,
        open: true,
        view: "logIn",
      }));
    }

    const displayName = auth.currentUser?.displayName;
    if (!displayName) return;

    if (likeLoading) return;

    setIsLiked(false);
    setLikeLoading(true);

    try {
      const idToken = await currentUserAuthObject.getIdToken();
      const response = await fetch(`/api/postv2/postLike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: "delike",
          postDocPath: `users/${postFrontData.senderUsername}/posts/${postFrontData.id}`,
        }),
      });

      if (!response.ok) {
        console.error(
          "Response from postLike API is not okay: \n",
          await response.text()
        );
        setIsLiked(true);
        return setLikeLoading(false);
      }

      return setLikeLoading(false);
    } catch (error) {
      console.error("Error on fetching to postLike API: \n", error);
      setIsLiked(true);
      return setLikeLoading(false);
    }
  };

  const handlePostDelete = async () => {
    const operationResult = await postDelete(postFrontData.id);
    if (!operationResult) return;

    setIsPostDeleted(true);
    setShowDeletePostDialog(false);
  };

  return (
    <Flex
      bg="black"
      direction="column"
      width="100%"
      height="100%"
      position="relative"
    >
      <Flex
        id="postHeader"
        align="center"
        position="relative"
        gap={2}
        p={1}
        mb="2"
      >
        <Image
          alt=""
          src={postSenderData?.profilePhoto}
          width="50px"
          height="50px"
          rounded="full"
          fallback={
            postSenderData?.profilePhoto ? (
              <SkeletonCircle
                width="50px"
                height="50px"
                startColor="gray.100"
                endColor="gray.800"
              />
            ) : (
              <Icon
                as={CgProfile}
                color="white"
                height="50px"
                width="50px"
                cursor="pointer"
                onClick={() => router.push(`/${postFrontData.senderUsername}`)}
              />
            )
          }
          cursor="pointer"
          onClick={() => router.push(`/${postFrontData.senderUsername}`)}
        />
        <Flex id="username-fullname-date" direction="column">
          <Flex align="center">
            <Text
              textColor="white"
              as="b"
              fontSize="12pt"
              cursor="pointer"
              onClick={() => router.push(`/${postFrontData.senderUsername}`)}
            >
              {postFrontData.senderUsername}
            </Text>
          </Flex>

          <Flex align="center" gap={1}>
            <Text
              textColor="gray.100"
              as="i"
              fontSize="10pt"
              cursor="pointer"
              onClick={() => router.push(`/${postFrontData.senderUsername}`)}
            >
              {postSenderData?.fullname}
            </Text>
            {!postSenderData?.fullname && (
              <SkeletonText noOfLines={1} width="50px" />
            )}

            <Icon as={BsDot} color="white" fontSize="13px" />

            <Text as="i" fontSize="9pt" textColor="gray.500">
              {moment(new Date(postFrontData.creationTime)).fromNow()}
            </Text>
          </Flex>
        </Flex>

        <Flex position="absolute" right="3" id="follow-nft-delete">
          <Button
            variant="solid"
            colorScheme="blue"
            size="sm"
            onClick={handleFollowOnPost}
            hidden={isFollowingThisSender}
            isLoading={followOperationLoading}
          >
            Follow
          </Button>

          <Flex
            hidden={currentUserState.username !== postFrontData.senderUsername}
            width="100%"
          >
            <Menu computePositionOnMount>
              <MenuButton>
                <Icon as={AiOutlineMenu} color="white" />
              </MenuButton>
              <MenuList>
                {postFrontData.nftStatus.convertedToNft ? (
                  <MenuItem onClick={() => openPanelNameSetter("nft")}>
                    Manage NFT
                  </MenuItem>
                ) : (
                  <MenuItem onClick={() => openPanelNameSetter("nft")}>
                    Make NFT
                  </MenuItem>
                )}

                <MenuItem onClick={() => setShowDeletePostDialog(true)}>
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>

          <AlertDialog
            isOpen={showDeletePostDialog}
            leastDestructiveRef={leastDestructiveRef}
            onClose={() => setShowDeletePostDialog(false)}
            returnFocusOnClose={false}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Delete Post
                </AlertDialogHeader>

                <AlertDialogBody>
                  Are you sure? You can&apos;t undo this action afterwards.
                </AlertDialogBody>

                <AlertDialogFooter gap={2}>
                  <Button
                    ref={leastDestructiveRef}
                    onClick={() => setShowDeletePostDialog(false)}
                    variant="solid"
                    size="md"
                    colorScheme="blue"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    colorScheme="red"
                    size="md"
                    onClick={handlePostDelete}
                    isLoading={postDeletionLoading}
                    hidden={
                      currentUserState.username !== postFrontData.senderUsername
                    }
                  >
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </Flex>
      </Flex>

      {postFrontData.image && (
        <Flex id="image-flex" width="100%">
          <Image
            src={postFrontData.image}
            maxHeight="80vh"
            fallback={
              <Flex
                bg="gray.700"
                width="100%"
                height="27em"
                align="center"
                justify="center"
              >
                <Icon as={BsImage} fontSize="8xl" color="white" />
              </Flex>
            }
            draggable={false}
            userSelect="none"
            borderRadius="2em"
            
          />
        </Flex>
      )}

      <Flex
        id="post-footer"
        position="absolute"
        bottom="-2em"
        width="100%"
        bg="#202020"
        borderRadius="2em"
        height="auto"
        px={4}
        py={2}
        gap={1}
        align="center"
      >
        <Flex
          id="like-comment-shaee-text"
          direction="column"
          width="100%"
          flexFlow="1"
          gap="0.5"
        >
          <Text
            color="white"
            fontWeight="600"
            fontSize="16"
            wordBreak="break-word"
          >
            {postFrontData.description}
          </Text>
          <Flex gap={3} width="100%" align="center">
            <Flex id="like-part" gap="1">
              {isLiked ? (
                <Icon
                  as={AiFillHeart}
                  color="red"
                  fontSize="25px"
                  cursor="pointer"
                  onClick={() => handleDeLike()}
                />
              ) : (
                <Icon
                  as={AiOutlineHeart}
                  color="white"
                  fontSize="25px"
                  cursor="pointer"
                  onClick={() => handleLike()}
                />
              )}

              <Text
                textColor="white"
                cursor="pointer"
                onClick={() => {
                  openPanelNameSetter("likes");
                }}
              >
                {`${postFrontData.likeCount}`}
              </Text>
            </Flex>

            <Flex
              id="comments-part"
              gap="1"
              cursor="pointer"
              onClick={() => {
                openPanelNameSetter("comments");
              }}
            >
              <Icon as={AiOutlineComment} color="white" fontSize="25px" />
              <Text textColor="white">{postFrontData.commentCount}</Text>
            </Flex>

            <Flex
              id="share-part"
              gap="1"
              cursor="pointer"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${process.env.NEXT_PUBLIC_USER_PANEL_BASE_URL}/${postFrontData.senderUsername}/posts/${postFrontData.id}`
                );
                setLinkCopied(true);
              }}
              color="white"
              fontSize="12pt"
              align="center"
              justify="center"
            >
              {linkCopied && (
                <Text fontSize="12pt" color="white" fontWeight="600">
                  Copied!
                </Text>
              )}
              {!linkCopied && (
                <Icon as={IoMdLink} color="white" fontSize="25px" />
              )}
            </Flex>
          </Flex>
        </Flex>

        <Flex id="nft-button-area">
          <Button
            hidden={!postFrontData.nftStatus.convertedToNft}
            colorScheme="pink"
            size="sm"
            borderRadius="full"
            fontWeight="bold"
            _hover={{ bg: "pink.500" }}
            _active={{ bg: "pink.600" }}
            onClick={() => {
              openPanelNameSetter("nft");
            }}
          >
            NFT
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
