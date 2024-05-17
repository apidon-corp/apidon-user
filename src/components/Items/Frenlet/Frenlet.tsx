import { FrenletServerData } from "@/components/types/Frenlet";
import { UserInServer } from "@/components/types/User";
import { auth } from "@/firebase/clientApp";
import { useElementOnScreen } from "@/hooks/observeHooks/useElementOnScreen";
import { Button, Flex, Icon, Image, Input, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { FaLongArrowAltRight } from "react-icons/fa";
import Replet from "./Replet";

type FrenletProps = {
  frenletData: FrenletServerData;
};

export default function Frenlet({ frenletData }: FrenletProps) {
  const [senderData, setSenderData] = React.useState<UserInServer>();
  const [receiverData, setReceiverData] = React.useState<UserInServer>();

  const router = useRouter();

  const replyInputRef = useRef<HTMLInputElement>(null);
  const [canReply, setCanReply] = useState(false);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [frenletDataFinalLayer, setFrenletDataFinalLayer] =
    useState<FrenletServerData>(frenletData);

  const { containerRef, isVisible } = useElementOnScreen({ threshold: 0.8 });

  useEffect(() => {
    initialLoading();
  }, []);

  useEffect(() => {
    checkCanReply();
  }, [auth, frenletData]);

  useEffect(() => {
    const checkRealtimeUpdates = setInterval(handleGetRealtimeUpdates, 5000);
    return () => clearInterval(checkRealtimeUpdates);
  }, []);

  const getPersonData = async (username: string) => {
    const currentUserAuthObject = auth.currentUser;
    if (currentUserAuthObject === null) {
      console.error("Error while getting user data.");
      return false;
    }

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/frenlet/getPersonData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      if (!response.ok) {
        console.error(
          "Response from getPersonData is not okay: \n",
          await response.text()
        );
        return false;
      }

      const result = await response.json();
      return result.personData as UserInServer;
    } catch (error) {
      console.error("Error on fetching to getPersonData API: \n", error);
      return false;
    }
  };

  const initialLoading = async () => {
    const [senderData, receiverData] = await Promise.all([
      getPersonData(frenletData.frenletSender),
      getPersonData(frenletData.frenletReceiver),
    ]);

    if (senderData) setSenderData(senderData);
    if (receiverData) setReceiverData(receiverData);

    setFrenletDataFinalLayer(frenletData);
  };

  const checkCanReply = async () => {
    const authObject = auth.currentUser;
    if (authObject === null) {
      console.error("Error while checking can reply.");
      return setCanReply(false);
    }

    const displayName = authObject.displayName;
    if (!displayName) {
      console.error("Error while checking can reply.");
      return setCanReply(false);
    }

    if (
      [frenletData.frenletReceiver, frenletData.frenletSender].includes(
        displayName
      )
    )
      return setCanReply(true);

    try {
      const idToken = await authObject.getIdToken();

      const response = await fetch("/api/frenlet/getFrenOptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        console.error(
          "Response from getFrenOptions is not okay: \n",
          await response.text()
        );
        return setCanReply(false);
      }

      const result = await response.json();

      const frensData = result.frensData as {
        username: string;
        fullname: string;
        image: string;
      }[];

      const frensUsernames = frensData.map((fren) => fren.username);

      console.log(frensUsernames);

      if (
        frensUsernames.includes(frenletData.frenletSender) &&
        frensUsernames.includes(frenletData.frenletReceiver)
      )
        return setCanReply(true);

      return setCanReply(false);
    } catch (error) {
      console.error("Error while checking can reply: \n", error);
      return setCanReply(false);
    }
  };

  const handleReplyInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.target.value;
    setReply(input);
  };

  const handleReplyButton = async () => {
    if (!canReply) return;
    if (reply.length === 0) return;

    const authObject = auth.currentUser;
    if (authObject === null) return;

    setSendingReply(true);

    try {
      const idToken = await authObject.getIdToken();

      const response = await fetch("/api/frenlet/sendReply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: reply,
          frenletDocPath: `/users/${frenletData.frenletSender}/frenlets/frenlets/outgoing/${frenletData.frenletDocId}`,
        }),
      });

      if (!response.ok) {
        console.error(
          "Response from sendReply API is not okay: : \n",
          await response.text()
        );
        return setSendingReply(false);
      }

      let replies: FrenletServerData["replies"] = frenletDataFinalLayer.replies;
      replies = [
        ...replies,
        {
          message: reply,
          sender: authObject.displayName!,
          ts: Date.now(),
        },
      ];

      // Everythnig is alright.
      setFrenletDataFinalLayer((prev) => ({ ...prev, replies: replies }));
      if (replyInputRef.current) replyInputRef.current.value = "";
      return setSendingReply(false);
    } catch (error) {
      console.error("Error on fetching to sendReply API: \n", error);
      return setSendingReply(false);
    }
  };

  const handleGetRealtimeUpdates = async () => {
    if (!isVisible) return;

    const currentUserAuthObject = auth.currentUser;
    if (currentUserAuthObject === null) return;

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/frenlet/getRealtimeUpdates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          frenletDocPath: `/users/${frenletData.frenletSender}/frenlets/frenlets/outgoing/${frenletData.frenletDocId}`,
        }),
      });

      if (!response.ok) {
        console.error(
          "Response from getRealtimeUpdates API is not okay: : \n",
          await response.text()
        );
        return false;
      }

      const result = await response.json();
      const updatedFrenletData = result.frenletData as FrenletServerData;

      console.log(updatedFrenletData);

      return setFrenletDataFinalLayer(updatedFrenletData);
    } catch (error) {
      console.error("Error on fetching to getRealtimeUpdates API: \n", error);
      return false;
    }
  };

  return (
    <Flex
      width="100%"
      align="center"
      justify="center"
      direction="column"
      gap="2em"
      border="1px solid white"
      borderRadius="20px"
      padding="10"
      ref={containerRef}
    >
      <Flex
        id="top-images-flex"
        width="100%"
        align="center"
        justify="center"
        gap="2em"
      >
        <Flex
          id="sender-flex"
          align="center"
          justify="center"
          direction="column"
          gap="10px"
          onClick={() => {
            router.push(`/${senderData?.username}`);
          }}
          cursor="pointer"
        >
          <Image
            id="receiver-pp"
            src={senderData?.profilePhoto}
            width="5em"
            height="5em"
            rounded="full"
          />
          <Text color="white" fontSize="12pt" fontWeight="700">
            {senderData?.fullname}
          </Text>
        </Flex>

        <Icon as={FaLongArrowAltRight} color="white" fontSize="3em" />

        <Flex
          id="receiver-flex"
          align="center"
          justify="center"
          direction="column"
          gap="10px"
          onClick={() => {
            router.push(`/${receiverData?.username}`);
          }}
          cursor="pointer"
        >
          <Image
            id="sender-pp"
            src={receiverData?.profilePhoto}
            width="5em"
            height="5em"
            rounded="full"
          />
          <Text color="white" fontSize="12pt" fontWeight="700">
            {receiverData?.fullname}
          </Text>
        </Flex>
      </Flex>
      <Flex id="message-flex" width="100%" align="center" justify="center">
        <Text color="white" fontSize="15pt" fontWeight="700">
          "{frenletData.message}"
        </Text>
      </Flex>
      {frenletDataFinalLayer.replies && (
        <Flex
          id="replies-flex"
          width="100%"
          direction="column"
          gap="1em"
          maxHeight="20em"
          overflow="auto"
          borderWidth="1px"
          borderColor="gray.700"
          borderRadius="10px"
          p="1em"
        >
          {frenletDataFinalLayer.replies.map((reply) => (
            <Replet
              message={reply.message}
              ts={reply.ts}
              username={reply.sender}
              key={reply.ts}
            />
          ))}
        </Flex>
      )}

      {canReply && (
        <Flex
          id="reply-flex"
          width="100%"
          align="center"
          justify="center"
          gap="5px"
        >
          <Input
            ref={replyInputRef}
            size="sm"
            color="white"
            borderRadius="10px"
            placeholder="Reply to your fren..."
            onChange={handleReplyInputChange}
          />
          <Button
            variant="outline"
            size="sm"
            colorScheme="blue"
            onClick={handleReplyButton}
            isLoading={sendingReply}
            isDisabled={reply.length === 0 || !canReply}
          >
            Reply
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
