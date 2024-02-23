import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import {
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { SetStateAction, useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { useRecoilValue } from "recoil";
import LikeItem from "../../Items/Post/LikeItem";
import { LikeData, OpenPanelName } from "../../types/Post";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";

type Props = {
  likeData: LikeData;
  openPanelNameSetter: React.Dispatch<SetStateAction<OpenPanelName>>;
  openPanelNameValue: OpenPanelName;
  postSenderUsername: string;
};

export default function PostLikes({
  likeData,
  openPanelNameSetter,
  openPanelNameValue,
  postSenderUsername,
}: Props) {
  const [likeDatas, setLikeDatas] = useState<string[]>([]);

  const currentUserState = useRecoilValue(currentUserStateAtom);

  const [gettingLikes, setGettingLikes] = useState(true);

  const { getCollectionServer } = useGetFirebase();

  useEffect(() => {
    if (openPanelNameValue === "likes") getLikes();
  }, [openPanelNameValue]);

  const getLikes = async () => {
    setGettingLikes(true);

    const likesCollection = await getCollectionServer(likeData.likeColPath);
    if (!likesCollection) return;

    if (likesCollection.docsArray.length === 0) {
      setLikeDatas([]);
      return setGettingLikes(false);
    }

    let finalLikeDatas: string[] = [];

    for (const liker of likesCollection.docsArray) {
      finalLikeDatas.push(liker.ref.id);
    }

    if (currentUserState.isThereCurrentUser) {
      if (finalLikeDatas.includes(currentUserState.username)) {
        const filtered = finalLikeDatas.filter(
          (a) => a !== currentUserState.username
        );

        filtered.unshift(currentUserState.username);

        finalLikeDatas = filtered;
      }
    }

    setLikeDatas(finalLikeDatas);
    setGettingLikes(false);
  };

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
          <Stack gap={1} hidden={gettingLikes}>
            {likeDatas.map((w) => (
              <LikeItem
                postSenderUsername={postSenderUsername}
                likerUsername={w}
                openPanelNameSetter={openPanelNameSetter}
                key={w}
              />
            ))}
          </Stack>

          <Text
            fontSize="10pt"
            textColor="white"
            hidden={likeDatas.length !== 0 || gettingLikes}
          >
            No likes yet.
          </Text>
          <Spinner color="white" hidden={!gettingLikes} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
