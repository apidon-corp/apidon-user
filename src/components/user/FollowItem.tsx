import useFollow from "@/hooks/socialHooks/useFollow";
import {
  Flex,
  Text,
  Image,
  Icon,
  SkeletonCircle,
  Button,
  SkeletonText,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { useRecoilState, useSetRecoilState } from "recoil";
import { authModalStateAtom } from "../atoms/authModalAtom";
import { currentUserStateAtom } from "../atoms/currentUserAtom";
import { FollowingsFollowersModalType } from "./Header";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";

type Props = {
  username: string;
  followingsFollowersModalStateSetter: React.Dispatch<
    React.SetStateAction<FollowingsFollowersModalType>
  >;
};

type FollowItemState = {
  username: string;
  fullname: string;
  profilePhoto?: string;
  followedByCurrentUser: boolean;
};

export default function FollowItem({
  username,
  followingsFollowersModalStateSetter,
}: Props) {
  const [followItemState, setFollowItemState] = useState<FollowItemState>({
    username: username,
    fullname: "",
    profilePhoto: "",
    followedByCurrentUser: true,
  });
  const [gettingFollowItemState, setGettingFollowItemState] = useState(false);

  const [currentUserState, setCurrentUserState] =
    useRecoilState(currentUserStateAtom);

  const router = useRouter();

  const { follow } = useFollow();

  const setAuthModalState = useSetRecoilState(authModalStateAtom);

  const [followOperationLoading, setFollowOperationLoading] = useState(false);

  const { getDocServer } = useGetFirebase();

  useEffect(() => {
    if (username) getFollowItemInformation();
  }, [username]);

  const getFollowItemInformation = async () => {
    setGettingFollowItemState(true);

    const followItemUserDocResult = await getDocServer(`users/${username}`);

    if (!followItemUserDocResult || !followItemUserDocResult.isExists) return;

    let currentUserFollowsThisFollowObject = false;
    if (currentUserState.isThereCurrentUser) {
      const docResult = await getDocServer(
        `users/${currentUserState.username}/followings/${username}`
      );
      if (!docResult) return;

      currentUserFollowsThisFollowObject = docResult.isExists;
    }

    const followItemStateServer: FollowItemState = {
      // We know username but if I download from server,I use it.
      username: followItemUserDocResult.data.username,
      fullname: followItemUserDocResult.data.fullname,
      profilePhoto: followItemUserDocResult.data.profilePhoto,
      followedByCurrentUser: currentUserFollowsThisFollowObject,
    };

    setFollowItemState(followItemStateServer);
    setGettingFollowItemState(false);
  };

  const handleFollowonFollowItem = async () => {
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
    const operationResult = await follow(followItemState.username, 1);

    if (!operationResult) {
      return setFollowOperationLoading(false);
    }

    // update follow status
    setFollowItemState((prev) => ({
      ...prev,
      followedByCurrentUser: true,
    }));

    setFollowOperationLoading(false);
  };

  return (
    <Flex align="center" position="relative">
      <Flex
        cursor="pointer"
        onClick={() => {
          followingsFollowersModalStateSetter((prev) => ({
            ...prev,
            isOpen: false,
          }));
          router.push(`/${followItemState.username}`);
        }}
      >
        <Image
          alt=""
          src={followItemState.profilePhoto}
          rounded="full"
          width="50px"
          height="50px"
          fallback={
            !!followItemState.profilePhoto || gettingFollowItemState ? (
              <SkeletonCircle
                width="50px"
                height="50px"
                startColor="gray.100"
                endColor="gray.800"
              />
            ) : (
              <Icon as={CgProfile} color="white" height="50px" width="50px" />
            )
          }
        />

        <Flex justify="center" ml={1} flexDirection="column">
          <Text textColor="white" as="b" fontSize="10pt">
            {username}
          </Text>
          <Text textColor="gray.100" fontSize="9pt" as="i">
            {followItemState.fullname ? (
              followItemState.fullname
            ) : (
              <SkeletonText noOfLines={1} mt="1.5" skeletonHeight="2" />
            )}
          </Text>
        </Flex>
      </Flex>

      <Flex position="absolute" right="1">
        <Button
          size="sm"
          variant="solid"
          colorScheme="blue"
          onClick={handleFollowonFollowItem}
          hidden={
            followItemState.followedByCurrentUser ||
            !followItemState.username ||
            followItemState.username === currentUserState.username
          }
          isLoading={followOperationLoading}
        >
          Follow
        </Button>
      </Flex>
    </Flex>
  );
}
