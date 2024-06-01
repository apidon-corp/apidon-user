import useGetFirebase from "@/hooks/readHooks/useGetFirebase";

import { Box, Flex, Icon, Image, Skeleton, Text } from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";

import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { GoDotFill } from "react-icons/go";

interface NotificationItemData {
  senderUsername: string;
  senderFullName: string;
  senderProfilePhoto: string;
  notificationTime: number;
  message: string;
}

type Props = {
  cause: string;
  notificationTime: number;
  seen: boolean;
  sender: string;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
};

export default function NotificationItem({
  cause,
  notificationTime,
  seen,
  sender,
  setModalOpen,
}: Props) {
  const [notificationItemData, setNotificationItemData] =
    useState<NotificationItemData>({
      message: "",
      notificationTime: notificationTime,
      senderFullName: "",
      senderProfilePhoto: "",
      senderUsername: sender,
    });

  const router = useRouter();

  const { getDocServer } = useGetFirebase();

  const notificationItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleIntersection = async (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        // Element is in view, load data
        handleNotificationItemData();
      }
    };

    const observer = new IntersectionObserver(handleIntersection, {
      root: null, // Defaults to the viewport
      rootMargin: "0px",
      threshold: 0.1, // 10% of the element is visible
    });

    if (notificationItemRef.current) {
      observer.observe(notificationItemRef.current);
    }

    return () => {
      // Clean up observer on component unmount
      if (notificationItemRef.current) {
        observer.unobserve(notificationItemRef.current);
      }
    };
  }, []);

  const handleNotificationItemData = async () => {
    const docResult = await getDocServer(`users/${sender}`);
    if (!docResult) return;

    let message: string = "";

    if (cause === "like") message = `Liked your post!`;
    if (cause === "comment") message = `Commented to your post!`;
    if (cause === "follow") message = `Started to follow you!`;
    if (cause === "frenlet") message = `Created frenlet with you!`;

    const tempNotificationItemObject: NotificationItemData = {
      senderUsername: sender,
      senderFullName: docResult.data.fullname,
      senderProfilePhoto: docResult.data.profilePhoto,
      notificationTime: notificationTime,
      message: message,
    };

    setNotificationItemData(tempNotificationItemObject);
  };

  return (
    <Flex
      id="general-not-item"
      gap="2"
      align="center"
      position="relative"
      direction="column"
      border="1px solid white"
      borderRadius="20px"
      p="5"
      ref={notificationItemRef}
    >
      <Image
        src={notificationItemData.senderProfilePhoto}
        rounded="full"
        maxWidth="3.5em"
        maxHeight="3.5em"
        fallback={
          <Icon as={CgProfile} color="white" height="3.5em" width="3.5em" />
        }
        cursor="pointer"
        onClick={() => {
          setModalOpen(false);
          router.push(`/${sender}`);
        }}
      />

      <Flex
        id="username-fullname"
        align="center"
        direction="column"
        width="100%"
      >
        {notificationItemData.senderFullName.length === 0 ? (
          <Box width="30%">
            <Skeleton height="12pt" />
          </Box>
        ) : (
          <Text color="white" fontSize="12pt" fontWeight="600">
            {notificationItemData.senderFullName}
          </Text>
        )}

        <Text color="gray.500" fontSize="8pt" fontWeight="500">
          {formatDistanceToNow(notificationItemData.notificationTime).replace(
            "about ",
            ""
          )}
        </Text>
      </Flex>

      {notificationItemData.message.length === 0 ? (
        <Box width="50%">
          <Skeleton height="13pt" />
        </Box>
      ) : (
        <Flex
          id="message"
          align="center"
          gap="1"
          wrap="wrap"
          cursor="pointer"
          onClick={() => {
            setModalOpen(false);
            router.push(`/${notificationItemData.senderUsername}`);
          }}
        >
          <Text
            fontSize="13pt"
            color="gray.100"
            fontWeight="700"
            textAlign="center"
          >
            {notificationItemData.message}
          </Text>
        </Flex>
      )}

      {!seen && (
        <Icon
          as={GoDotFill}
          color="red"
          width="2em"
          height="2em"
          position="absolute"
          right="1em"
          top="1em"
        />
      )}
    </Flex>
  );
}
