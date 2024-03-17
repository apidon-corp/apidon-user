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
import { useEffect, useRef, useState } from "react";

import {
  AiFillHeart,
  AiOutlineComment,
  AiOutlineHeart,
  AiOutlineMenu,
} from "react-icons/ai";
import { BsDot, BsImage } from "react-icons/bs";

import { CiShare2 } from "react-icons/ci";

import useFollow from "@/hooks/socialHooks/useFollow";
import usePostDelete from "@/hooks/postHooks/usePostDelete";

import usePostLike from "@/hooks/postHooks/usePostLike";

import moment from "moment";
import { useRouter } from "next/router";
import { CgProfile } from "react-icons/cg";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { authModalStateAtom } from "../atoms/authModalAtom";
import { currentUserStateAtom } from "../atoms/currentUserAtom";
import { postsAtViewAtom } from "../atoms/postsAtViewAtom";
import { OpenPanelName, PostFrontData } from "../types/Post";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";

type Props = {
  postFrontData: PostFrontData;
  openPanelNameSetter: React.Dispatch<React.SetStateAction<OpenPanelName>>;
};

export default function PostFront({
  postFrontData,
  openPanelNameSetter,
}: Props) {
  const [postSenderInformation, setPostSenderInformation] = useState({
    username: postFrontData.senderUsername,
    fullname: "",
    profilePhoto: "",
  });

  const { like } = usePostLike();

  const currentUserState = useRecoilValue(currentUserStateAtom);

  const router = useRouter();

  const setAuthModalState = useSetRecoilState(authModalStateAtom);

  const { follow } = useFollow();

  const { postDelete, postDeletionLoading } = usePostDelete();

  const leastDestructiveRef = useRef<HTMLButtonElement>(null);
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);

  const [followOperationLoading, setFollowOperationLoading] = useState(false);

  const [postsAtView, setPostsAtView] = useRecoilState(postsAtViewAtom);

  const [taggedDescription, setTaggedDescription] = useState<
    {
      isTagged: boolean;
      word: string;
    }[]
  >([]);

  const [showFollowButtonOnPost, setShowFollowButtonOnPost] = useState(false);

  const { getDocServer } = useGetFirebase();

  useEffect(() => {
    handleGetPostSenderData(postFrontData.senderUsername);
  }, [currentUserState.username]);

  useEffect(() => {
    const descriptionContainsTagging = postFrontData.description.includes("@");
    if (!descriptionContainsTagging) return;

    handleTagging();
  }, []);

  useEffect(() => {
    if (!currentUserState.isThereCurrentUser)
      return setShowFollowButtonOnPost(false);

    if (postFrontData.senderUsername === currentUserState.username) {
      return setShowFollowButtonOnPost(false);
    }

    if (postFrontData.currentUserFollowThisSender)
      return setShowFollowButtonOnPost(false);

    return setShowFollowButtonOnPost(true);
  }, [currentUserState, postFrontData, router.asPath]);

  /**
   * Simply gets postSender's pp and fullname.
   * Normally, I used hooks for seperately to get pp and fullname.
   * I thought it was inefficient :) .
   * @param username
   * @returns
   */
  const handleGetPostSenderData = async (username: string) => {
    const userDocResult = await getDocServer(`users/${username}`);
    if (!userDocResult || !userDocResult.isExists) return;

    setPostSenderInformation((prev) => ({
      ...prev,
      fullname: userDocResult.data.fullname,
      profilePhoto: userDocResult.data.profilePhoto,
    }));
  };

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

    // update other posts to prevent unnecessary follow requests
    let updatedPostsAtView = postsAtView.map((a) => {
      if (
        a.senderUsername === postFrontData.senderUsername &&
        a.postDocId !== postFrontData.postDocId
      ) {
        const updatedPost = { ...a };
        updatedPost.currentUserFollowThisSender = true;
        return updatedPost;
      } else {
        return a;
      }
    });

    setPostsAtView(updatedPostsAtView);

    // Follow
    const operationResult = await follow(postFrontData.senderUsername, 1);

    if (!operationResult) {
      console.log("there is issue in here. We are reverting");
      const revertedPostsAtView = updatedPostsAtView.map((a) => {
        if (a.senderUsername === postFrontData.senderUsername) {
          const updatedPost = { ...a };
          updatedPost.currentUserFollowThisSender = false;
          return updatedPost;
        } else {
          return a;
        }
      });
      setPostsAtView(revertedPostsAtView);
      return setFollowOperationLoading(false);
    }

    // update current post
    const finalUpdatedPostsAtView = updatedPostsAtView.map((a) => {
      if (a.postDocId === postFrontData.postDocId) {
        const updatedPost = { ...a };
        updatedPost.currentUserFollowThisSender = true;
        return updatedPost;
      } else {
        return a;
      }
    });

    setPostsAtView(finalUpdatedPostsAtView);

    setFollowOperationLoading(false);
  };

  const handleTagging = () => {
    const desArr = postFrontData.description.split(" ");

    let tempTaggedDescription: {
      isTagged: boolean;
      word: string;
    }[] = [];
    for (const word of desArr) {
      if (word.startsWith("@")) {
        tempTaggedDescription.push({
          isTagged: true,
          word: word,
        });
      } else {
        tempTaggedDescription.push({
          isTagged: false,
          word: word,
        });
      }
    }
    setTaggedDescription(tempTaggedDescription);
  };

  const handleLike = async (opCode: -1 | 1) => {
    console.log("handleLike initiated.");

    if (!currentUserState.username) {
      console.log("Only Users can like");
      setAuthModalState((prev) => ({
        ...prev,
        open: true,
        view: "logIn",
      }));
      return;
    }

    const likeCountBeforeOperations = postFrontData.likeCount;
    const likeStatusBeforeOperation = postFrontData.currentUserLikedThisPost;

    const updatedPostsAtView = postsAtView.map((a) => {
      if (a.postDocId === postFrontData.postDocId) {
        const updatedPost = { ...a };
        updatedPost.currentUserLikedThisPost = opCode === 1 ? true : false;
        updatedPost.likeCount = a.likeCount + opCode;
        return updatedPost;
      } else {
        return a;
      }
    });
    setPostsAtView(updatedPostsAtView);

    const operationResult = await like(
      `users/${postFrontData.senderUsername}/posts/${postFrontData.postDocId}`,
      opCode
    );

    if (!operationResult) {
      const updatedPostsAtView = postsAtView.map((a) => {
        if (a.postDocId === postFrontData.postDocId) {
          const updatedPost = { ...a };
          updatedPost.currentUserLikedThisPost = likeStatusBeforeOperation;
          updatedPost.likeCount = likeCountBeforeOperations;
          return updatedPost;
        } else {
          return a;
        }
      });
      setPostsAtView(updatedPostsAtView);
      return;
    }
  };

  const handlePostDelete = async () => {
    const operationResult = await postDelete(postFrontData.postDocId);
    if (!operationResult) {
      return;
    }
    setShowDeletePostDialog(false);
  };

  return (
    <Flex bg="black" direction="column" width="100%" height="100%" p={1}>
      <Flex
        id="postHeader"
        align="center"
        position="relative"
        gap={1}
        height="58px"
        p={1}
        bg="gray.900"
        borderRadius="10px 10px 0px 0px"
      >
        <Image
          alt=""
          src={postSenderInformation.profilePhoto}
          width="50px"
          height="50px"
          rounded="full"
          fallback={
            postSenderInformation.profilePhoto ? (
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
        <Flex direction="column">
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
              {postSenderInformation.fullname}
            </Text>
            {!postSenderInformation.fullname && (
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
            hidden={!showFollowButtonOnPost}
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
        <AspectRatio ratio={1} width="100%">
          <Image
            alt=""
            src={postFrontData.image}
            fallback={
              <Flex bg="gray.700">
                <Icon as={BsImage} fontSize="8xl" color="white" />
              </Flex>
            }
          />
        </AspectRatio>
      )}

      <Flex
        id="post-footer"
        direction="column"
        bg="gray.900"
        borderRadius="0px 0px 10px 10px"
        height="auto"
      >
        <Text
          px={2}
          pt="1"
          fontSize="13pt"
          fontWeight="medium"
          wordBreak="break-word"
        >
          {taggedDescription.length > 0 ? (
            taggedDescription.map((w, i) => {
              if (w.isTagged) {
                return (
                  <span
                    key={i}
                    style={{ color: "#00A2FF", cursor: "pointer" }}
                    onClick={() => {
                      router.push(w.word.slice(1, w.word.length + 1));
                    }}
                  >
                    {w.word}{" "}
                  </span>
                );
              } else {
                return (
                  <span key={i} style={{ color: "white" }}>
                    {w.word}
                  </span>
                );
              }
            })
          ) : (
            <span style={{ color: "white" }}>{postFrontData.description}</span>
          )}
        </Text>
        <Flex>
          <Flex gap={3} p={2}>
            <Flex gap="1">
              {postFrontData.currentUserLikedThisPost ? (
                <Icon
                  as={AiFillHeart}
                  color="red"
                  fontSize="25px"
                  cursor="pointer"
                  onClick={() => handleLike(-1)}
                />
              ) : (
                <Icon
                  as={AiOutlineHeart}
                  color="white"
                  fontSize="25px"
                  cursor="pointer"
                  onClick={() => handleLike(1)}
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
              gap="1"
              cursor="pointer"
              onClick={() => {
                navigator.clipboard.writeText(
                  `http://localhost:3001/${postFrontData.senderUsername}/posts/${postFrontData.postDocId}`
                );
              }}
            >
              <Icon as={CiShare2} color="white" fontSize="25px" />
            </Flex>
          </Flex>

          <Flex width="100%" position="relative">
            <Button
              hidden={!!!postFrontData.nftStatus.convertedToNft}
              position="absolute"
              right="2.5"
              bottom="2"
              colorScheme="pink"
              size="sm"
              borderRadius="full"
              px={4}
              py={2}
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
    </Flex>
  );
}
