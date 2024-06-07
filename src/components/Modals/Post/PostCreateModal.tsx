import usePostUpload from "@/hooks/postHooks/usePostUpload";
import {
  AspectRatio,
  Button,
  Flex,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { BiImageAdd } from "react-icons/bi";
import { useRecoilState } from "recoil";
import { postCreateModalStateAtom } from "../../atoms/postCreateModalAtom";

export default function PostCreateModal() {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { uploadPost } = usePostUpload();

  const [postCreateModalState, setPostCreatModaleState] = useRecoilState(
    postCreateModalStateAtom
  );

  const [postCreateForm, setPostCreateForm] = useState({
    description: "",
    image: "",
  });
  const bigInputRef = useRef<HTMLTextAreaElement>(null);
  const smallInputRef = useRef<HTMLInputElement>(null);

  const [focusedTextInput, setFocusedInput] = useState<
    "bigInput" | "smallInput"
  >("smallInput");

  const onTextsChanged = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setPostCreateForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSendPost = async () => {
    // Already button is disabled when empty, but for prevent from any
    if (!postCreateForm.description && !postCreateForm.image) {
      return console.log("You Can not create empty post, aborting");
    }
    const operationResult = await uploadPost(postCreateForm);

    if (!operationResult) {
      return;
    }

    setPostCreatModaleState((prev) => ({
      ...prev,
      isOpen: false,
    }));

    setPostCreateForm({ description: "", image: "" });
  };

  useEffect(() => {
    if (
      postCreateForm.description.length >= 40 &&
      focusedTextInput !== "bigInput"
    ) {
      if (bigInputRef.current) {
        setFocusedInput("bigInput");
        bigInputRef.current.focus();
        bigInputRef.current.selectionStart = bigInputRef.current.selectionEnd =
          postCreateForm.description.length;
      }
    } else {
      if (smallInputRef.current && focusedTextInput !== "smallInput") {
        setFocusedInput("smallInput");
        smallInputRef.current.focus();
        smallInputRef.current.selectionStart =
          smallInputRef.current.selectionEnd =
            postCreateForm.description.length;
      }
    }
  }, [postCreateForm.description]);

  return (
    <Modal
      id="post-create-modal"
      size={{
        base: "full",
        sm: "full",
        md: "md",
        lg: "md",
      }}
      isOpen={postCreateModalState.isOpen}
      onClose={() => {
        setPostCreateForm({ description: "", image: "" });
        setPostCreatModaleState({ isOpen: false });
      }}
      autoFocus={false}
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="8px" />
      <ModalContent
        bg="black"
        minHeight={{
          md: "500px",
          lg: "500px",
        }}
      >
        <ModalHeader color="white">Create Post</ModalHeader>
        <ModalCloseButton color="white" />

        <ModalBody display="flex">
          <Flex direction="column" width="100%" gap="5">
            <Text as="b" fontSize="14pt" textColor="white">
              Photo
            </Text>

            <AspectRatio ratio={1}>
              <img
                style={{
                  borderRadius: "10px",
                }}
                alt=""
                src={postCreateForm.image}
              />
            </AspectRatio>

            <Button
              variant="outline"
              onClick={() => {
                setPostCreateForm((prev) => ({
                  ...prev,
                  image: "",
                }));
              }}
              mt={2}
              colorScheme="red"
            >
              Delete Photo
            </Button>

            <AspectRatio
              id="image-upload-placeholder"
              width="100%"
              borderRadius="4"
              bg="black"
              ratio={4 / 3}
            >
              <>
                <Button
                  width="100%"
                  height="100%"
                  onClick={() => imageInputRef.current?.click()}
                  bg="black"
                  borderWidth={3}
                  borderColor="white"
                  textColor="white"
                  fontSize="50pt"
                  fontWeight={700}
                  _hover={{
                    textColor: "black",
                    bg: "white",
                  }}
                >
                  <Icon as={BiImageAdd} />
                </Button>
                <Input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                />
              </>
            </AspectRatio>

            <Flex direction="column" mt={1} gap="1">
              <Text as="b" fontSize="14pt" textColor="white">
                Description
              </Text>
              {postCreateForm.description.length >= 40 ? (
                <Textarea
                  ref={bigInputRef}
                  name="description"
                  textColor="white"
                  fontWeight="600"
                  value={postCreateForm.description}
                  onChange={onTextsChanged}
                />
              ) : (
                <Input
                  ref={smallInputRef}
                  name="description"
                  textColor="white"
                  fontWeight="600"
                  value={postCreateForm.description}
                  onChange={onTextsChanged}
                />
              )}
            </Flex>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            colorScheme="blue"
            mr={3}
            onClick={() => {
              setPostCreatModaleState({ isOpen: false });
              setPostCreateForm({ description: "", image: "" });
            }}
          >
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSendPost}>
            Post
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
