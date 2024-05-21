import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import { FrenletServerData } from "@/components/types/Frenlet";
import { auth } from "@/firebase/clientApp";
import {
  Flex,
  SkeletonCircle,
  Icon,
  Image,
  Text,
  Input,
  Button,
} from "@chakra-ui/react";
import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useRef,
  useState,
} from "react";
import { FaLongArrowAltRight } from "react-icons/fa";
import { useRecoilValue } from "recoil";

type Props = {
  frenUsername: string;
  frenProfilePhoto: string;
  tag: string;
  setFrenletServerDataFinalLayer: Dispatch<SetStateAction<FrenletServerData[]>>;
};

export default function FrenletSendArea({
  frenUsername,
  frenProfilePhoto,
  tag,
  setFrenletServerDataFinalLayer,
}: Props) {
  const currentUserState = useRecoilValue(currentUserStateAtom);

  const messageInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendButton = async () => {
    if (message.length === 0) return;

    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return;

    setLoading(true);

    try {
      const idToken = await currentUserAuthObject.getIdToken();
      const response = await fetch("/api/frenlet/createFrenlet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fren: frenUsername,
          message: message,
          tag: tag,
        }),
      });

      if (!response.ok) {
        console.error(
          "Response from create API is not okay: \n",
          await response.text()
        );
        return setLoading(false);
      }

      const result = await response.json();

      const createdFrenletData: FrenletServerData = result.frenlet;

      // Everthing is alright
      setLoading(false);
      if (messageInputRef.current) messageInputRef.current.value = "";
      setMessage("");

      // Update the final layer of the frenlet server data
      // This is the layer that is used to display the frenlet on the page
      return setFrenletServerDataFinalLayer((prev) => [
        ...prev,
        createdFrenletData,
      ]);
    } catch (error) {
      console.error("Error on fetching to create API: \n", error);
      return setLoading(false);
    }
  };

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    setMessage(input);
  };

  return (
    <Flex
      width="100%"
      direction="column"
      align="center"
      justify="center"
      borderWidth="1px"
      borderColor="orange.500"
      borderRadius="10px"
      p="2em"
      gap="1em"
    >
      <Flex
        id="top-images-flex"
        width="100%"
        align="center"
        justify="space-between"
        px="3.5em"
      >
        <Flex
          id="sender-flex"
          align="center"
          justify="center"
          direction="column"
          gap="10px"
        >
          {currentUserState.profilePhoto ? (
            <Image
              id="sender-pp"
              src={currentUserState.profilePhoto}
              width="5em"
              height="5em"
              rounded="full"
            />
          ) : (
            <SkeletonCircle width="5em" height="5em" />
          )}
          <Text color="white" fontSize="12pt" fontWeight="700">
            {currentUserState.username}
          </Text>
        </Flex>

        <Icon as={FaLongArrowAltRight} color="gray" fontSize="3em" />

        <Flex
          id="receiver-flex"
          align="center"
          justify="center"
          direction="column"
          gap="10px"
        >
          {frenProfilePhoto ? (
            <Image
              id="sender-pp"
              src={frenProfilePhoto}
              width="5em"
              height="5em"
              rounded="full"
            />
          ) : (
            <SkeletonCircle width="5em" height="5em" />
          )}

          <Text color="white" fontSize="12pt" fontWeight="700">
            {frenUsername}
          </Text>
        </Flex>
      </Flex>
      <Input
        ref={messageInputRef}
        color="white"
        placeholder="Say something to your fren..."
        size="md"
        borderColor="blue.500"
        onChange={handleMessageChange}
      />
      <Button
        size="sm"
        variant="outline"
        colorScheme="orange"
        onClick={handleSendButton}
        isLoading={loading}
        isDisabled={message.length === 0}
      >
        Send
      </Button>
    </Flex>
  );
}
