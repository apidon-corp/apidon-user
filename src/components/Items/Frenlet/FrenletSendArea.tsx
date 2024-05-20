import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import {
  Flex,
  SkeletonCircle,
  Icon,
  Image,
  Text,
  Input,
  Button,
} from "@chakra-ui/react";
import React from "react";
import { FaLongArrowAltRight } from "react-icons/fa";
import { useRecoilValue } from "recoil";

type Props = {
  frenUsername: string;
  frenProfilePhoto: string;
};

export default function FrenletSendArea({
  frenUsername,
  frenProfilePhoto,
}: Props) {
  const currentUserState = useRecoilValue(currentUserStateAtom);

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
        color="white"
        placeholder="Say something to your fren..."
        size="md"
        borderColor="blue.500"
      />
      <Button
        size="sm"
        variant="outline"
        colorScheme="orange"
        onClick={() => {}}
      >
        Send
      </Button>
    </Flex>
  );
}
