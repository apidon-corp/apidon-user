import {
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { SetStateAction } from "react";
import { AiOutlineClose } from "react-icons/ai";
import LikeItem from "../../Items/Post/LikeItem";
import { LikeDataV2, OpenPanelName } from "../../types/Post";

type Props = {
  likeData: LikeDataV2[];
  openPanelNameSetter: React.Dispatch<SetStateAction<OpenPanelName>>;
  openPanelNameValue: OpenPanelName;
  postSenderUsername: string;
};

export default function PostLikes({
  openPanelNameSetter,
  openPanelNameValue,
  postSenderUsername,
  likeData,
}: Props) {
  return (
    <Modal
      onClose={() => openPanelNameSetter("main")}
      size={{
        base: "full",
        sm: "full",
        md: "md",
        lg: "md",
      }}
      isOpen={openPanelNameValue === "likes"}
      autoFocus={false}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent
        bg="black"
        minHeight={{
          md: "500px",
          lg: "500px",
        }}
      >
        <Flex
          position="sticky"
          top="0"
          px={6}
          align="center"
          justify="space-between"
          height="50px"
          bg="black"
        >
          <Text textColor="white" fontSize="17pt" fontWeight="700">
            Likes
          </Text>

          <Icon
            as={AiOutlineClose}
            color="white"
            fontSize="15pt"
            cursor="pointer"
            onClick={() => openPanelNameSetter("main")}
          />
        </Flex>

        <ModalBody>
          <Stack gap={1}>
            {likeData.map((w) => (
              <LikeItem
                postSenderUsername={postSenderUsername}
                likerUsername={w.sender}
                openPanelNameSetter={openPanelNameSetter}
                key={w.sender}
              />
            ))}
          </Stack>

          <Text
            fontSize="10pt"
            textColor="white"
            hidden={likeData.length !== 0}
          >
            No likes yet.
          </Text>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
