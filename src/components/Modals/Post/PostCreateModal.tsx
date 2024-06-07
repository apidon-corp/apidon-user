import { auth, storage } from "@/firebase/clientApp";
import usePostUpload from "@/hooks/postHooks/usePostUpload";
import {
  AspectRatio,
  Button,
  CircularProgress,
  Flex,
  Icon,
  Image,
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
import { ref, uploadBytesResumable } from "firebase/storage";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { BiImageAdd } from "react-icons/bi";
import { useRecoilState } from "recoil";
import { postCreateModalStateAtom } from "../../atoms/postCreateModalAtom";
import { PostCreateForm } from "@/components/types/Post";

export default function PostCreateModal() {
  const { uploadPost } = usePostUpload();

  const [postCreateModalState, setPostCreatModaleState] = useRecoilState(
    postCreateModalStateAtom
  );

  const [postCreateForm, setPostCreateForm] = useState<PostCreateForm>({
    description: "",
    tempImageLocation: "",
  });

  const bigInputRef = useRef<HTMLTextAreaElement>(null);
  const smallInputRef = useRef<HTMLInputElement>(null);

  const [focusedTextInput, setFocusedInput] = useState<
    "bigInput" | "smallInput"
  >("smallInput");

  const imageInputRef = useRef<HTMLInputElement>(null);

  const [imageUplaodProgress, setImageUploadProgress] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [imagePreview, setImagePreview] = useState("");

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

  useEffect(() => {
    if (imageFile) {
      uploadImage();
    }
  }, [imageFile]);

  const onTextsChanged = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setPostCreateForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleImageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      console.warn("Files are null");
      setImagePreview("");
      return;
    }

    const imageInputFile = files[0];

    if (!imageInputFile) {
      console.warn("Image is null");
      setImagePreview("");
      return;
    }

    setImageFile(imageInputFile);
  };

  const handleDeleteButton = () => {
    setPostCreateForm({ description: "", tempImageLocation: "" });
    setImagePreview("");
  };

  const uploadImage = async () => {
    if (!imageFile) return false;

    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return false;

    const displayName = currentUserAuthObject.displayName;
    if (!displayName) return false;

    setUploadingImage(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(imageFile);

    try {
      const storageRef = ref(
        storage,
        `users/${displayName}/postFiles/temp/temp`
      );
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setImageUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error: ", error);
          setUploadingImage(false);
          setImageUploadProgress(0);

          setImageFile(null);
          setPostCreateForm((prev) => ({ ...prev, tempImageLocation: "" }));

          setImagePreview("");
        },
        () => {
          console.log("Image Upload Successfull");
          setPostCreateForm((prev) => ({
            ...prev,
            tempImageLocation: `users/${displayName}/postFiles/temp/temp`,
          }));
          setUploadingImage(false);
          return true;
        }
      );
    } catch (error) {
      console.error("Error uploading image: ", error);
      setUploadingImage(false);
      setImagePreview("");
      return false;
    }
  };

  const handleSendPost = async () => {
    if (!postCreateForm.description && !postCreateForm.tempImageLocation)
      return;
    if (imageFile && !postCreateForm.tempImageLocation) return;

    setLoading(true);

    const operationResult = await uploadPost(postCreateForm);

    if (!operationResult) {
      setLoading(false);
      return;
    }

    setLoading(false);
    setPostCreateForm({ description: "", tempImageLocation: "" });
    setImageFile(null);
    setImageUploadProgress(0);
    setUploadingImage(false);
    setImagePreview("");

    setPostCreatModaleState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

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
        if (loading) return;
        setPostCreateForm({ description: "", tempImageLocation: "" });
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
          <Flex id="overall-flex" direction="column" width="100%" gap={5}>
            <Flex id="image-area" width="100%" direction="column" gap="3">
              <Text as="b" fontSize="14pt" textColor="white">
                Photo
              </Text>
              {imagePreview && (
                <Flex direction="column" width="100%" gap="5">
                  <Flex id="image-flex" width="100%" position="relative">
                    {uploadingImage && (
                      <Flex
                        id="progress-flex"
                        position="absolute"
                        width="100%"
                        height="100%"
                        justify="center"
                        align="center"
                        zIndex={100}
                      >
                        <CircularProgress
                          color="green.500"
                          value={imageUplaodProgress}
                          size="100"
                          isIndeterminate={
                            imageUplaodProgress === 0 ||
                            imageUplaodProgress === 100
                          }
                        />
                      </Flex>
                    )}
                    <Flex
                      width="100%"
                      bg={uploadingImage ? "gray" : "unset"}
                      opacity={uploadingImage ? "0.4" : "unset"}
                    >
                      <Image borderRadius="10px" src={imagePreview} />
                    </Flex>
                  </Flex>

                  <Button
                    variant="outline"
                    onClick={handleDeleteButton}
                    colorScheme="red"
                  >
                    Delete Photo
                  </Button>
                </Flex>
              )}

              {!imagePreview && (
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
                      onChange={handleImageInputChange}
                      type="file"
                      accept="image/*"
                      hidden
                    />
                  </>
                </AspectRatio>
              )}
            </Flex>

            <Flex id="description-area" width="100%" direction="column" gap="3">
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
            size="md"
            mr={3}
            onClick={() => {
              setPostCreatModaleState({ isOpen: false });
              setPostCreateForm({ description: "", tempImageLocation: "" });
            }}
            isDisabled={loading}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            size="md"
            onClick={handleSendPost}
            isDisabled={
              (postCreateForm.description.length === 0 &&
                postCreateForm.tempImageLocation.length === 0) ||
              uploadingImage
            }
            isLoading={loading}
          >
            Post
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
