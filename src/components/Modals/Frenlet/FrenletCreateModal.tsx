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
import {
  ChangeEvent,
  ChangeEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";

export default function FrenletCreateModal() {
  const [modalViewState, setModalViewState] = useState<
    "initialLoading" | "create" | "creating"
  >("create");

  // message
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  // username
  const [fren, setFren] = useState<{
    username: string;
    fullname: string;
    image: string;
  } | null>(null);

  const [frensData, setFrensData] = useState<
    {
      username: string;
      fullname: string;
      image: string;
    }[]
  >([]);

  const handleInitialLoading = async () => {
    setModalViewState("initialLoading");

    const frenOptions = await handleGetFrensData();
    setFrensData(frenOptions);

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

      console.log(frensData);

      return frensData;
    } catch (error) {
      console.error("Error on fetching to getFrenOptions API: \n", error);
      return [];
    }
  };

  const handleFrenChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const input = event.target.value;

    const fren = frensData.find((fren) => fren.username === input);
    if (fren) setFren(fren);

    console.log(fren);
  };

  const handleMessageChange = (input: string) => {
    setMessage(input);
  };

  const handleCreateButton = async () => {
    setModalViewState("creating");

    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) {
      console.error("No current user found");
      return setModalViewState("create");
    }

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/frenlet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          frenUsername: fren?.username,
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
    } catch (error) {
      console.error("Error on fetching to create API: \n", error);
      return setModalViewState("create");
    }

    // Everything is alright.
    setModalViewState("create");
  };

  useEffect(() => {
    handleInitialLoading();
  }, []);

  return (
    <Modal
      id="create-frenlet-modal"
      isOpen={true}
      onClose={() => {}}
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
        <ModalCloseButton color="white" />
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
                <Button variant="solid" colorScheme="blue">
                  Create
                </Button>
              </Flex>
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
