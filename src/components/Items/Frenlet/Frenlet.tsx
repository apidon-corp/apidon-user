import { FrenletServerData } from "@/components/types/Frenlet";
import { UserInServer } from "@/components/types/User";
import { auth } from "@/firebase/clientApp";
import { Button, Flex, Icon, Image, Input, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { FaLongArrowAltRight } from "react-icons/fa";

type FrenletProps = {
  frenletData: FrenletServerData;
};

export default function Frenlet({ frenletData }: FrenletProps) {
  const [senderData, setSenderData] = React.useState<UserInServer>();
  const [receiverData, setReceiverData] = React.useState<UserInServer>();

  const router = useRouter();

  const [canReply, setCanReply] = useState(false);
  const [reply, setReply] = useState("");

  useEffect(() => {
    console.log(frenletData);
  }, []);

  useEffect(() => {
    initialLoading();
  }, []);

  useEffect(() => {
    checkCanReply();
  }, [auth, frenletData]);

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
  };

  const checkCanReply = () => {
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
    ) {
      return setCanReply(true);
    }

    return setCanReply(false);
  };

  const handleReplyButton = async () => {
    if (!canReply) return;
    if (reply.length === 0) return;

    const authObject = auth.currentUser;
    if (authObject === null) return;

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
        return;
      }

      console.log("It is done.");

      return true;
    } catch (error) {
      console.error("Error on fetching to sendReply API: \n", error);
      return false;
    }
  };

  const handleReplyInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.target.value;
    setReply(input);
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
      {frenletData.replies && (
        <Flex id="replies-flex" width="100%" align="center">
          {frenletData.replies.map((reply) => (
            <Flex key={reply.ts} justify="center" align="center" gap="5px">
              <Image
                src={
                  senderData?.username === reply.sender
                    ? senderData.profilePhoto
                    : receiverData?.profilePhoto
                }
                width="2em"
                height="2em"
                rounded="full"
              />
              <Text color="white" fontSize="12pt" fontWeight="700">
                {reply.message}
              </Text>
            </Flex>
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
          >
            Reply
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
