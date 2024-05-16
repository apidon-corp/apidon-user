import { createFrenletModalAtom } from "@/components/atoms/createFrenletModalAtom";
import { auth } from "@/firebase/clientApp";
import {
  Button,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { ChangeEvent, useEffect, useState } from "react";
import { useRecoilState } from "recoil";

export default function FrenletCreateModal() {
  const [modalViewState, setModalViewState] = useState<
    "initialLoading" | "create" | "creating"
  >("initialLoading");

  // message
  const [message, setMessage] = useState("");

  // username
  const [fren, setFren] = useState<
    | {
        username: string;
        fullname: string;
        image: string;
      }
    | undefined
  >();

  const [frensData, setFrensData] = useState<
    {
      username: string;
      fullname: string;
      image: string;
    }[]
  >([]);

  const [createFrenletModalState, setCreateFrenletModalState] = useRecoilState(
    createFrenletModalAtom
  );

  const handleInitialLoading = async () => {
    console.log("init");
    setModalViewState("initialLoading");

    const frenOptions = await handleGetFrensData();
    setFrensData(frenOptions);

    setFren(undefined);
    setMessage("");

    setModalViewState("create");
  };

  const handleGetFrensData = async () => {
    try {
      const currentUserAuthObject = auth.currentUser;
      if (!currentUserAuthObject) {
        console.error("No current user found");
        return [];
      }

      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/frenlet/getFrenOptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        console.error(
          "Response from getFrenOptions API is not okay: \n",
          await response.text()
        );

        return [];
      }

      const result = await response.json();
      const frensData = result.frensData as {
        username: string;
        fullname: string;
        image: string;
      }[];

      return frensData;
    } catch (error) {
      console.error("Error on fetching to getFrenOptions API: \n", error);
      return [];
    }
  };

  const handleFrenChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const input = event.target.value;

    const fren = frensData.find((fren) => fren.username === input);
    setFren(fren);
  };

  const handleMessageChange = (input: string) => {
    setMessage(input);
  };

  const handleCreateButton = async () => {
    setModalViewState("creating");

    if (!fren) {
      console.error("Fren is undefined.");
      return setModalViewState("create");
    }

    if (message.length === 0) {
      console.error("Message is empty.");
      return setModalViewState("create");
    }

    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) {
      console.error("No current user found");
      return setModalViewState("create");
    }

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/frenlet/createFrenlet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fren: fren.username,
          message: message,
        }),
      });

      if (!response.ok) {
        console.error(
          "Response from create API is not okay: \n",
          await response.text()
        );
        return setModalViewState("create");
      }

      // Everthing is alright
      console.log((await response.json()).frenlet);
      setModalViewState("initialLoading");
      return setCreateFrenletModalState({ isOpen: false });
    } catch (error) {
      console.error("Error on fetching to create API: \n", error);
      return setModalViewState("create");
    }
  };

  useEffect(() => {
    if (createFrenletModalState.isOpen) handleInitialLoading();
  }, [createFrenletModalState.isOpen]);

  return (
    <Modal
      id="create-frenlet-modal"
      isOpen={createFrenletModalState.isOpen}
      onClose={() => {
        if (modalViewState === "create")
          setCreateFrenletModalState({ isOpen: false });
      }}
      size={{
        base: "full",
        sm: "full",
        md: "lg",
        lg: "lg",
      }}
      scrollBehavior="inside"
      allowPinchZoom
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="10px" />
      <ModalContent
        bg="#28282B"
        minHeight={{
          md: "500px",
          lg: "500px",
        }}
      >
        <ModalHeader color="white">Create Frenlet</ModalHeader>
        {modalViewState === "create" && <ModalCloseButton color="white" />}
        <ModalBody display="flex">
          {modalViewState === "initialLoading" && (
            <Flex
              id="initialLoading-flex"
              width="100%"
              align="center"
              justify="center"
            >
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}
          {modalViewState === "create" && (
            <Flex
              id="create-frenlet-flex"
              width="100%"
              align="center"
              direction="column"
              gap="20px"
            >
              <Flex
                id="choose-fren"
                width="50%"
                align="center"
                justify="center"
                direction="column"
                gap="1em"
              >
                <Image
                  id="photo-circle"
                  rounded="full"
                  border="1px solid white"
                  width="8em"
                  height="8em"
                  src={fren?.image}
                />
                <Text color="white" fontSize="15pt" fontWeight="700">
                  {fren?.fullname}
                </Text>
                <Select
                  iconColor="white"
                  sx={{
                    bg: "gray",
                    textColor: "white",
                    fontWeight: "700",
                    fontSize: "12pt",
                    borderWidth: "0",
                    borderRadius: "10px",
                  }}
                  placeholder="Select a fren"
                  onChange={handleFrenChange}
                  size="sm"
                >
                  {frensData.map((option) => (
                    <option key={option.username} value={option.username}>
                      {option.username}
                    </option>
                  ))}
                </Select>
              </Flex>
              <Flex
                id="write-message-flex"
                width="100%"
                align="center"
                justify="center"
              >
                <Textarea
                  placeholder="Tell something to your fren...."
                  size="sm"
                  resize="vertical"
                  borderRadius="10px"
                  color="white"
                  onChange={(e) => {
                    handleMessageChange(e.target.value);
                  }}
                />
              </Flex>
              <Flex
                id="create-button-flex"
                width="100%"
                align="center"
                justify="center"
              >
                <Button
                  variant="solid"
                  colorScheme="blue"
                  onClick={handleCreateButton}
                  isDisabled={
                    message.length === 0 || fren === undefined || fren === null
                  }
                >
                  Create
                </Button>
              </Flex>
            </Flex>
          )}
          {modalViewState === "creating" && (
            <Flex
              id="initialLoading-flex"
              width="100%"
              align="center"
              justify="center"
              direction="column"
              gap="1em"
            >
              <Spinner width="75px" height="75px" color="white" />
              <Text color="white" fontSize="12pt" fontWeight="700">
                Creating Frenlet
              </Text>
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
