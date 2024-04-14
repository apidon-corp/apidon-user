import getCroppedImg from "@/components/utils/GetCroppedImage";
import usePostUpload from "@/hooks/postHooks/usePostUpload";
import {
  AspectRatio,
  Button,
  Flex,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { AiOutlineClose } from "react-icons/ai";
import { BiImageAdd } from "react-icons/bi";
import { useRecoilState } from "recoil";
import { postCreateModalStateAtom } from "../../atoms/postCreateModalAtom";

export default function PostCreateModal() {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const {
    onSelectWillBeCroppedPhoto,
    willBeCroppedPostPhoto,
    setWillBeCroppedPostPhoto,
    postUploadLoading,
    sendPost,
  } = usePostUpload();

  const [postCreateModalState, setPostCreatModaleState] = useRecoilState(
    postCreateModalStateAtom
  );

  const [postCreateForm, setPostCreateForm] = useState({
    description: "",
    image: "",
  });

  const [cropSize, setCropSize] = useState(400);
  const cropRef = useRef<HTMLDivElement>(null);
  const [minZoom, setMinZoom] = useState(1);

  const bigInputRef = useRef<HTMLTextAreaElement>(null);
  const smallInputRef = useRef<HTMLInputElement>(null);

  const [focusedTextInput, setFocusedInput] = useState<
    "bigInput" | "smallInput"
  >("smallInput");

  useEffect(() => {
    if (cropRef.current) setCropSize(cropRef.current.clientWidth);
  }, [cropRef.current?.clientWidth]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const ratio = width / height;

      const abs = Math.abs(ratio - 1);

      const finalZoomValue = abs * 2 + 1;

      setZoom(finalZoomValue);
      setMinZoom(finalZoomValue);
    };
    img.src = willBeCroppedPostPhoto;
  }, [willBeCroppedPostPhoto]);

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
    const operationResult = await sendPost(postCreateForm);

    if (!operationResult) {
      return;
    }

    handleResetCrop();

    setPostCreatModaleState((prev) => ({
      ...prev,
      isOpen: false,
    }));

    setPostCreateForm({ description: "", image: "" });
  };

  const handleResetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setWillBeCroppedPostPhoto("");

    if (imageInputRef.current) imageInputRef.current.value = "";
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
        handleResetCrop();
        if (!postUploadLoading)
          setPostCreateForm({ description: "", image: "" });
        setPostCreatModaleState({ isOpen: false });
      }}
      autoFocus={false}
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="8px" />
      <ModalContent bg="black">
        <Flex
          position="sticky"
          top="0"
          px={6}
          align="center"
          justify="space-between"
          height="50px"
          bg="black"
        >
          <Flex textColor="white" fontSize="17pt" fontWeight="700" gap={2}>
            <Text>
              {willBeCroppedPostPhoto ? "Adjust Your Photo" : "Create Post"}
            </Text>
          </Flex>

          <Icon
            as={AiOutlineClose}
            color="white"
            fontSize="15pt"
            cursor="pointer"
            onClick={() => {
              handleResetCrop();
              if (!postUploadLoading)
                setPostCreateForm({ description: "", image: "" });
              setPostCreatModaleState({ isOpen: false });
            }}
          />
        </Flex>

        <ModalBody>
          <Stack gap={1}>
            <Text
              as="b"
              fontSize="14pt"
              textColor="white"
              hidden={!!willBeCroppedPostPhoto}
            >
              Photo
            </Text>

            <Flex
              id="post-image-crop-area"
              direction="column"
              hidden={!!!willBeCroppedPostPhoto}
            >
              <Flex id="try-cancel-buttons" justify="flex-end" gap={2} mb="2">
                <Button
                  size="sm"
                  variant="solid"
                  colorScheme="blue"
                  onClick={async () => {
                    // Get cropped image
                    const croppedImage = await getCroppedImg(
                      willBeCroppedPostPhoto,
                      croppedAreaPixels
                    );
                    // Update State
                    setPostCreateForm((prev) => ({
                      ...prev,
                      image: croppedImage as string,
                    }));

                    handleResetCrop();
                  }}
                >
                  Try
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={() => {
                    handleResetCrop();
                  }}
                >
                  Cancel
                </Button>
              </Flex>
              <Flex
                position="relative"
                height={cropSize}
                width="100%"
                mt={4}
                ref={cropRef}
              >
                <Cropper
                  image={willBeCroppedPostPhoto}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropSize={{ height: cropSize, width: cropSize }}
                  minZoom={minZoom}
                  maxZoom={10}
                />
              </Flex>
            </Flex>

            <AspectRatio ratio={1} hidden={!!!postCreateForm.image}>
              <img
                style={{
                  borderRadius: "10px",
                }}
                alt=""
                src={postCreateForm.image}
                hidden={!!!postCreateForm.image}
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
              hidden={!!!postCreateForm.image}
            >
              Delete Photo
            </Button>

            <AspectRatio
              id="image-upload-placeholder"
              width="100%"
              borderRadius="4"
              bg="black"
              hidden={!!willBeCroppedPostPhoto || !!postCreateForm.image}
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
                  onChange={onSelectWillBeCroppedPhoto}
                  isDisabled={postUploadLoading}
                  hidden
                />
              </>
            </AspectRatio>

            <Flex
              direction="column"
              mt={1}
              gap="1"
              hidden={!!willBeCroppedPostPhoto}
            >
              <Text as="b" fontSize="14pt" textColor="white">
                {postCreateForm.image ? "Description" : "Message"}
              </Text>
              {postCreateForm.description.length >= 40 ? (
                <Textarea
                  ref={bigInputRef}
                  name="description"
                  textColor="white"
                  fontWeight="600"
                  value={postCreateForm.description}
                  onChange={onTextsChanged}
                  isDisabled={postUploadLoading}
                />
              ) : (
                <Input
                  ref={smallInputRef}
                  name="description"
                  textColor="white"
                  fontWeight="600"
                  value={postCreateForm.description}
                  onChange={onTextsChanged}
                  isDisabled={postUploadLoading}
                />
              )}
            </Flex>
          </Stack>
        </ModalBody>

        <ModalFooter hidden={!!willBeCroppedPostPhoto}>
          <Button
            variant="outline"
            colorScheme="blue"
            mr={3}
            onClick={() => {
              setPostCreatModaleState({ isOpen: false });
              setPostCreateForm({ description: "", image: "" });
            }}
            isDisabled={postUploadLoading || !!willBeCroppedPostPhoto}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSendPost}
            isLoading={postUploadLoading}
            isDisabled={
              (!!!postCreateForm.description && !!!postCreateForm.image) ||
              !!willBeCroppedPostPhoto
            }
          >
            Post
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
