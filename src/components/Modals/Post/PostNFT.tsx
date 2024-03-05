import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import { postsAtViewAtom } from "@/components/atoms/postsAtViewAtom";
import { NFTMetadata } from "@/components/types/NFT";
import {
  NftDocDataInServer,
  OpenPanelName,
  PostItemData,
  PostServerData,
} from "@/components/types/Post";
import useNFT from "@/hooks/nftHooks/useNFT";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";
import { apidonNFTMumbaiContractAddress } from "@/web3/NFT/ApidonNFTApp";
import {
  AspectRatio,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { ethers } from "ethers";
import React, { SetStateAction, useEffect, useRef, useState } from "react";
import {
  AiFillHeart,
  AiOutlineCheckCircle,
  AiOutlineComment,
  AiOutlineNumber,
} from "react-icons/ai";
import { BiError } from "react-icons/bi";
import {
  BsArrowRight,
  BsFillCalendarHeartFill,
  BsFillCalendarPlusFill,
} from "react-icons/bs";
import { FaRegUserCircle } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
import { GrTextAlignFull } from "react-icons/gr";
import { MdContentCopy } from "react-icons/md";
import { RxText } from "react-icons/rx";
import { useRecoilValue, useSetRecoilState } from "recoil";

type Props = {
  openPanelNameValue: OpenPanelName;
  openPanelNameValueSetter: React.Dispatch<SetStateAction<OpenPanelName>>;
  postInformation: PostItemData;
};

export default function PostNFT({
  openPanelNameValue,
  openPanelNameValueSetter,
  postInformation,
}: Props) {
  const { getDocServer } = useGetFirebase();

  const [nftPanelViewState, setNftPanelViewState] = useState<
    | "initalLoading"
    | "create"
    | "creating"
    | "created"
    | "transfer"
    | "transferring"
  >("initalLoading");

  const [nftDataState, setNftDataState] = useState<NftDocDataInServer>({
    contractAddress: "",
    description: "",
    metadataLink: "",
    mintTime: 0,
    name: "",
    openseaUrl: "",
    tokenId: 0,
    transferStatus: {
      isTransferred: false,
    },
  });

  const {
    mintNft,
    creatingNFTLoading,
    refreshNFT,
    nftCreated,
    setNftCreated,
    transferNft,
  } = useNFT();

  const [nftTitle, setNftTitle] = useState("");
  const [nftDescription, setNftDescription] = useState(
    postInformation.description
  );

  const [gettingNFTDataLoading, setGettingNFTDataLoading] = useState(true);
  const [nftMetadaData, setNFTMetadata] = useState<NFTMetadata>();

  const [refreshNFTLoading, setRefreshNFTLoading] = useState(false);

  const [nftMetadataLikeCommentCount, setNftMetdataLikeCommentCount] = useState(
    {
      likeCount: 0,
      commentCount: 0,
    }
  );

  /**
   * nftAddress state with 0x add-on
   */
  const [nftTransferAddress, setNftTransferAddress] = useState("");
  const [nftTransferAddressRight, setNftTransferAddressRight] = useState(true);
  const [nftTransferLoading, setNftTransferLoading] = useState(false);

  const currentUserState = useRecoilValue(currentUserStateAtom);

  const nftTransferAddressInputRef = useRef<HTMLInputElement>(null);

  const setPostsAtView = useSetRecoilState(postsAtViewAtom);

  const bigInputRef = useRef<HTMLTextAreaElement>(null);
  const smallInputRef = useRef<HTMLInputElement>(null);
  const [focusedTextInput, setFocusedInput] = useState<
    "bigInput" | "smallInput"
  >("smallInput");

  /**
   * Get intial nft status then save it to state.
   * Create seperated blocks for creating, transferring, updating.
   *
   */

  useEffect(() => {
    if (openPanelNameValue !== "nft") return;
    if (nftPanelViewState !== "initalLoading") return;
    getInitialNFTData();
  }, [nftPanelViewState, openPanelNameValue]);

  const getInitialNFTData = async () => {
    setNftPanelViewState("initalLoading");

    const postDocResult = await getDocServer(
      `/users/${postInformation.senderUsername}/posts/${postInformation.postDocId}`
    );

    if (!postDocResult || !postDocResult.isExists)
      return console.error("Post doc doesn't exist.");

    const postDocData = postDocResult.data as PostServerData;

    const convertedToNft = postDocData.nftStatus.convertedToNft;
    const nftDocPath = postDocData.nftStatus.nftDocPath;

    if (!convertedToNft || !nftDocPath) {
      // We need to show users to create nft panel.
      return setNftPanelViewState("create");
      // return setNftPanelViewState("nftCreating");
    }

    const nftDocResult = await getDocServer(nftDocPath);
    if (!nftDocResult || !nftDocResult.isExists) {
      console.error("NFT Doc doesn't exist.");
      return setNftPanelViewState("initalLoading");
    }

    // In here we have a valid nft data.
    const nftDocData = nftDocResult.data as NftDocDataInServer;
    setNftDataState({ ...nftDocData });

    // We need to show nft information to user
    setNftPanelViewState("created");
  };

  const handleGetMetadata = async (metadataLink: string) => {
    let metadata: NFTMetadata;
    try {
      const response = await fetch(metadataLink, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(
          `Resonse from Firebase is not okey: \n ${await response.text()}`
        );
      }
      metadata = (await response.json()) as NFTMetadata;
    } catch (error) {
      console.error(
        "Error while fetching to Firebase Storage server to get metadata of nft: \n",
        error
      );
      return false;
    }

    return metadata;
  };

  const handleCreateButton = async () => {
    setNftPanelViewState("creating");

    const nftMintResult = await mintNft(
      nftTitle,
      nftDescription,
      postInformation.postDocId
    );

    if (!nftMintResult || !nftMintResult.nftDocPath) {
      console.error("NFT Mint Result is not okay");
      return setNftPanelViewState("initalLoading");
    }

    setPostsAtView((prev) => {
      return prev.map((p) => {
        if (p.postDocId === postInformation.postDocId) {
          const updatedPost = JSON.parse(JSON.stringify(p)) as PostItemData;
          updatedPost.nftStatus = {
            convertedToNft: true,
            nftDocPath: nftMintResult.nftDocPath,
          };
          return updatedPost;
        } else {
          return p;
        }
      });
    });

    // To get updated data from server.
    setNftPanelViewState("initalLoading");
  };

  const resetStatesAfterNFTCreation = () => {
    setNftCreated(false);

    setNftTitle("");
    setNftDescription(postInformation.description);
  };

  const resetStatesAfterAbandon = () => {
    setNftTitle("");
    setNftDescription(postInformation.description);
  };

  /**
  const getNFTData = async () => {
    
    setGettingNFTDataLoading(true);

    setNFTMetadata(undefined);
    setNftMetdataLikeCommentCount({ commentCount: 0, likeCount: 0 });
    const response = await fetch(postInformation.nftStatus.metadataLink, {
      cache: "no-store",
      method: "GET",
    });

    if (!response.ok) {
      setGettingNFTDataLoading(false);
      return console.error(
        "Error while getting nftMetadata",
        await response.json()
      );
    }

    const result: NFTMetadata = await response.json();
    setNFTMetadata(result);
    setNftMetdataLikeCommentCount({
      likeCount: Number(
        result.attributes.find((a) => a.trait_type === "Likes")!.value
      ),
      commentCount: Number(
        result.attributes.find((a) => a.trait_type === "Comments")!.value
      ),
    });

    setGettingNFTDataLoading(false);
  };

  */

  /**
  const handleRefreshNFT = async () => {
    setRefreshNFTLoading(true);
    const operationResult = await refreshNFT(postInformation.postDocId);

    if (!operationResult) {
      return setRefreshNFTLoading(false);
    }
    setRefreshNFTLoading(false);
    getNFTData();
  };
  */

  const handleNFTransfer = async () => {
    const transferAddressValidationStatus =
      ethers.isAddress(nftTransferAddress);
    if (!transferAddressValidationStatus) {
      return setNftTransferAddressRight(false);
    }
    if (!nftTransferAddressRight) return;

    setNftTransferLoading(true);

    const operationResult = await transferNft(
      postInformation.postDocId,
      nftTransferAddress
    );

    if (!operationResult) {
      return setNftTransferLoading(false);
    }

    setPostsAtView((prev) => {
      return prev.map((p) => {
        if (p.postDocId === postInformation.postDocId) {
          const updatedPost = JSON.parse(JSON.stringify(p));
          updatedPost.nftStatus.transferred = true;
          updatedPost.nftStatus.transferredAddress = nftTransferAddress;
          return updatedPost;
        } else {
          return p;
        }
      });
    });

    //getNFTData();

    setNftTransferLoading(false);
  };

  const handleNftTransferAddressChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const susAddress = event.target.value;
    if (susAddress.length === 0) {
      // prevent bad ui
      setNftTransferAddressRight(true);
      setNftTransferAddress(susAddress);
      return;
    }
    const validationStatus = ethers.isAddress(susAddress);
    setNftTransferAddressRight(validationStatus);
    if (validationStatus) {
      if (nftTransferAddressInputRef.current) {
        nftTransferAddressInputRef.current.blur();
      }
    }
    if (validationStatus && !susAddress.startsWith("0x")) {
      setNftTransferAddress(`0x${susAddress}`);
      return;
    }
    setNftTransferAddress(susAddress);
  };
  // openPanelNameValue === "nft"
  return (
    <Modal
      isOpen={openPanelNameValue === "nft"}
      onClose={() => {
        openPanelNameValueSetter("main");
        // To prevent lose unfinished progress
        if (nftCreated) resetStatesAfterNFTCreation();
      }}
      autoFocus={false}
      size={{
        base: "full",
        sm: "full",
        md: "lg",
        lg: "lg",
      }}
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="8px" />
      <ModalContent
        bg="black"
        minHeight={{
          md: "500px",
          lg: "500px",
        }}
      >
        {nftPanelViewState === "initalLoading" && (
          <ModalHeader color="white">NFT</ModalHeader>
        )}
        {nftPanelViewState === "create" && (
          <ModalHeader color="white">Create NFT</ModalHeader>
        )}
        {nftPanelViewState === "creating" && (
          <ModalHeader color="white">Create NFT</ModalHeader>
        )}
        {nftPanelViewState === "created" && (
          <ModalHeader color="white">View NFT</ModalHeader>
        )}
        <ModalCloseButton color="white" />

        <ModalBody display="flex">
          {nftPanelViewState === "initalLoading" && (
            <Flex width="100%" align="center" justify="center">
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}
          {nftPanelViewState === "create" && (
            <Flex id="createNftFlex" direction="column">
              <FormControl variant="floating">
                <Input
                  required
                  name="title"
                  placeholder=" "
                  mb={2}
                  onChange={(event) => {
                    setNftTitle(event.target.value);
                  }}
                  value={nftTitle}
                  _hover={{
                    border: "1px solid",
                    borderColor: "blue.500",
                  }}
                  textColor="white"
                  bg="black"
                  isDisabled={creatingNFTLoading || nftCreated}
                />
                <FormLabel
                  bg="rgba(0,0,0)"
                  textColor="gray.500"
                  fontSize="12pt"
                  my={2}
                >
                  Title
                </FormLabel>
              </FormControl>
              <Image alt="" src={postInformation.image} />
              <FormControl variant="floating">
                <Input
                  required
                  name="description"
                  placeholder=" "
                  mb={2}
                  _hover={{
                    border: "1px solid",
                    borderColor: "blue.500",
                  }}
                  bg="black"
                  textColor="white"
                  value={nftDescription}
                  onChange={(event) => {
                    setNftDescription(event.target.value);
                  }}
                  isDisabled={creatingNFTLoading || nftCreated}
                />

                <FormLabel
                  textColor="gray.500"
                  fontSize="12pt"
                  bg="rgba(0,0,0)"
                  my={2}
                >
                  Description
                </FormLabel>
              </FormControl>
            </Flex>
          )}

          {nftPanelViewState === "creating" && (
            <Flex
              id="nft-creating-flex"
              width="100%"
              direction="column"
              align="center"
              justify="center"
              gap="20px"
            >
              <Spinner color="#D300FD" width="75px" height="75px" />
              <Text fontSize="15pt" fontWeight="600" color="white">
                Creating NFT
              </Text>
            </Flex>
          )}

          {nftPanelViewState === "created" && (
            <Flex
              id="created-nft-flex"
              width="100%"
              direction="column"
              gap="5px"
            >
              <Flex id="nft-title-data" align="center" gap={1}>
                <Image
                  width="50%"
                  src={nftMetadaData?.image}
                  borderRadius="5"
                />
                <Icon as={RxText} fontSize="13pt" color="white" />
                <Text
                  color="gray.300"
                  fontSize="13pt"
                  maxHeight="100px"
                  wordBreak="break-word"
                  overflowY="auto"
                >
                  {nftDataState.name}
                </Text>
              </Flex>

              <Flex id="nft-description-data" align="center" gap={1}>
                <Icon as={GrTextAlignFull} fontSize="13pt" color="white" />

                <Text
                  color="gray.300"
                  fontSize="12pt"
                  maxHeight="100px"
                  wordBreak="break-word"
                  overflowY="auto"
                >
                  {nftDataState.description}
                </Text>
              </Flex>

              <Flex id="nft-like-data" align="center" gap={1}>
                <Icon as={AiFillHeart} fontSize="13pt" color="white" />
                <Text color="gray.300" fontSize="13pt">
                  53
                </Text>
              </Flex>

              <Flex id="nft-comment-data" align="center" gap={1}>
                <Icon as={AiOutlineComment} fontSize="13pt" color="white" />
                <Text color="gray.300" fontSize="13pt">
                  53
                </Text>
              </Flex>

              <Flex id="nft-market-places-links" direction="column" gap={2}>
                <Text fontSize="15pt" as="b" color="white">
                  Market Place Links
                </Text>
                <Flex
                  gap={1}
                  cursor="pointer"
                  onClick={() => {
                    window.open(
                      `https://testnets.opensea.io/assets/mumbai/${apidonNFTMumbaiContractAddress}/${nftDataState.tokenId}`,
                      "blank"
                    );
                  }}
                  maxWidth="150px"
                  overflow="hidden"
                >
                  <Image
                    src="https://storage.googleapis.com/opensea-static/Logomark/OpenSea-Full-Logo%20(light).png"
                    width="120px"
                  />
                  <Icon as={FiExternalLink} color="white" fontSize="10pt" />
                </Flex>
              </Flex>
              <Flex id="nft-details" direction="column" gap={2}>
                <Text color="white" fontSize="15pt" as="b">
                  Details
                </Text>
                <Flex direction="column">
                  <Flex id="nft-owner-data" align="center" gap={1}>
                    <Icon as={FaRegUserCircle} fontSize="11pt" color="white" />
                    <Text color="white" fontSize="11pt">
                      {nftDataState.transferStatus.isTransferred
                        ? `${nftDataState.transferStatus.transferredAddress?.slice(
                            0,
                            3
                          )}...${nftDataState.transferStatus.transferredAddress?.slice(
                            nftDataState.transferStatus.transferredAddress
                              ?.length - 3,
                            nftDataState.transferStatus.transferredAddress
                              ?.length
                          )}`
                        : "Apidon"}
                    </Text>
                    <Icon
                      as={MdContentCopy}
                      fontSize="11pt"
                      color="blue"
                      cursor="pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          nftDataState.transferStatus
                            .transferredAddress as string
                        );
                      }}
                    />
                  </Flex>
                  <Flex id="nft-tokenId-data" align="center" gap={1}>
                    <Icon as={AiOutlineNumber} fontSize="11pt" color="white" />
                    <Text color="white" fontSize="11pt">
                      {nftDataState.tokenId}
                    </Text>
                    <Icon
                      as={MdContentCopy}
                      fontSize="11pt"
                      color="blue"
                      cursor="pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          nftDataState.tokenId.toString()
                        );
                      }}
                    />
                  </Flex>
                  <Flex id="nft-network-data" align="center" gap={1}>
                    <AspectRatio width="20px" ratio={1}>
                      <img src="https://cryptologos.cc/logos/polygon-matic-logo.png?v=024" />
                    </AspectRatio>

                    <Text color="white" fontSize="11pt">
                      {`${apidonNFTMumbaiContractAddress.slice(
                        0,
                        5
                      )}...${apidonNFTMumbaiContractAddress.slice(
                        apidonNFTMumbaiContractAddress.length - 3,
                        apidonNFTMumbaiContractAddress.length
                      )}`}
                    </Text>
                    <Icon
                      as={MdContentCopy}
                      fontSize="11pt"
                      color="blue"
                      cursor="pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          apidonNFTMumbaiContractAddress
                        );
                      }}
                    />
                  </Flex>
                  <Flex id="nft-postCreation-date-data" align="center" gap={1}>
                    <Icon
                      as={BsFillCalendarPlusFill}
                      fontSize="11pt"
                      color="white"
                    />
                    <Text color="white" fontSize="11pt">
                      {format(
                        new Date(postInformation.creationTime),
                        "dd MMMM yyyy"
                      )}
                    </Text>
                  </Flex>
                  <Flex id="nft-nftCreation-date-data" align="center" gap={1}>
                    <Icon
                      as={BsFillCalendarHeartFill}
                      fontSize="11pt"
                      color="white"
                    />
                    <Text color="white" fontSize="11pt">
                      {format(new Date(nftDataState.mintTime), "dd MMMM yyyy")}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          )}

          {nftPanelViewState === "transfer" && (
            <Flex id="transfer-nft-panel">
              <Flex id="transfer-nft-area" direction="column" gap={2}>
                <Text color="red" fontSize="9pt">
                  {postInformation.senderUsername === currentUserState.username
                    ? "Your"
                    : "This"}
                  NFT is not transferred.
                </Text>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleNFTransfer();
                  }}
                  style={{
                    marginTop: "1",
                  }}
                  hidden={
                    postInformation.senderUsername !== currentUserState.username
                  }
                >
                  <InputGroup>
                    <FormControl variant="floating">
                      <Input
                        ref={nftTransferAddressInputRef}
                        required
                        name="nftTransferAddress"
                        placeholder=" "
                        mb={2}
                        pr={"9"}
                        onChange={handleNftTransferAddressChange}
                        value={nftTransferAddress}
                        _hover={{
                          border: "1px solid",
                          borderColor: "blue.500",
                        }}
                        textColor="white"
                        bg="black"
                        spellCheck={false}
                        isRequired
                        disabled={nftTransferLoading}
                      />
                      <FormLabel
                        bg="rgba(0,0,0)"
                        textColor="gray.500"
                        fontSize="12pt"
                        my={2}
                      >
                        Transfer Address
                      </FormLabel>
                    </FormControl>
                    <InputRightElement hidden={nftTransferAddress.length === 0}>
                      {!nftTransferAddressRight ? (
                        <Icon as={BiError} fontSize="20px" color="red" />
                      ) : (
                        <Icon
                          as={AiOutlineCheckCircle}
                          fontSize="20px"
                          color="green"
                        />
                      )}
                    </InputRightElement>
                  </InputGroup>
                  <Button
                    width="100%"
                    variant="outline"
                    type="submit"
                    colorScheme="blue"
                    size="sm"
                    isDisabled={!nftTransferAddressRight}
                    isLoading={nftTransferLoading}
                  >
                    Transfer your NFT
                  </Button>
                </form>
              </Flex>
            </Flex>
          )}
        </ModalBody>

        <ModalFooter>
          {nftPanelViewState === "create" && (
            <Flex gap="10px">
              <Button
                variant="outline"
                colorScheme="blue"
                onClick={() => {
                  resetStatesAfterAbandon();
                  openPanelNameValueSetter("main");
                }}
                isDisabled={creatingNFTLoading}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                colorScheme="blue"
                onClick={() => {
                  handleCreateButton();
                }}
                isLoading={creatingNFTLoading}
              >
                Create!
              </Button>
            </Flex>
          )}
          {nftPanelViewState === "created" && (
            <Button
              variant="outline"
              colorScheme="blue"
              onClick={() => {
                openPanelNameValueSetter("main");
                resetStatesAfterNFTCreation();
              }}
            >
              Return to post
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
