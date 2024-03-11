import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import { postsAtViewAtom } from "@/components/atoms/postsAtViewAtom";
import {
  NFTMetadata,
  NftDocDataInServer,
  NftDocDataInServerPlaceholder,
  NftListInput,
  nftListInputPlaceholder,
  nftMetadataPlaceHolder,
} from "@/components/types/NFT";
import {
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
import { BiError, BiTransferAlt } from "react-icons/bi";
import {
  BsFillCalendarHeartFill,
  BsFillCalendarPlusFill,
} from "react-icons/bs";
import { FaRegUserCircle } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
import { MdContentCopy } from "react-icons/md";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { AiFillDollarCircle } from "react-icons/ai";

import { MdSell } from "react-icons/md";

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
    | "initialLoading"
    | "create"
    | "creating"
    | "created"
    | "updating"
    | "transfer"
    | "transferring"
    | "list"
    | "listing"
  >("initialLoading");

  const [nftDocDataState, setNftDocDataState] = useState<NftDocDataInServer>(
    NftDocDataInServerPlaceholder
  );

  const [nftMetadataState, setNftMetadataState] = useState<NFTMetadata>(
    nftMetadataPlaceHolder
  );

  const {
    mintNft,
    refreshNFT,
    transferNft,
    creatingNFTLoading,
    nftCreated,
    listNft,
  } = useNFT();

  const [nftTitle, setNftTitle] = useState("");
  const [nftDescription, setNftDescription] = useState(
    postInformation.description
  );

  const [nftTransferAddress, setNftTransferAddress] = useState("");
  const [nftTransferAddressRight, setNftTransferAddressRight] = useState(true);

  const nftTransferAddressInputRef = useRef<HTMLInputElement>(null);

  const setPostsAtView = useSetRecoilState(postsAtViewAtom);

  const currentUserState = useRecoilValue(currentUserStateAtom);

  const [listNftInputState, setListNftInputState] = useState<NftListInput>(
    nftListInputPlaceholder
  );

  /**
   * Get intial nft status then save it to state.
   * Create seperated blocks for creating, transferring, updating.
   *
   */
  useEffect(() => {
    if (openPanelNameValue !== "nft") return;
    if (nftPanelViewState !== "initialLoading") return;
    getInitialNFTData();
  }, [nftPanelViewState, openPanelNameValue]);

  useEffect(() => {
    if (openPanelNameValue === "nft") {
      setNftPanelViewState("initialLoading");
    }
  }, [openPanelNameValue]);

  const getInitialNFTData = async () => {
    setNftPanelViewState("initialLoading");

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
      return setNftPanelViewState("initialLoading");
    }

    // In here we have a valid nft data.
    const nftDocData = nftDocResult.data as NftDocDataInServer;
    setNftDocDataState({ ...nftDocData });

    // We need to get NFT Metadata, too.
    const nftMetadaDataResult = await handleGetMetadata(
      nftDocData.metadataLink
    );
    if (!nftMetadaDataResult) {
      console.error("Error on getting nft metadata");
      return setNftPanelViewState("initialLoading");
    }

    // We have a valid nft metadata data.
    setNftMetadataState(nftMetadaDataResult);

    console.log(nftDocData);

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
      return setNftPanelViewState("initialLoading");
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
    setNftPanelViewState("initialLoading");
  };

  const handleUpdateNftButon = async () => {
    setNftPanelViewState("updating");

    const updateNftResult = await refreshNFT(postInformation.postDocId);

    if (!updateNftResult) {
      console.error("Update Nft Result is not okay.");
      return setNftPanelViewState("initialLoading");
    }

    // Operation is successfull, we need to refresh panel
    setNftPanelViewState("initialLoading");
  };

  const handleTransferButton = async () => {
    setNftPanelViewState("transfer");
  };

  const handleNFTransfer = async () => {
    setNftPanelViewState("transferring");

    const transferAddressValidationStatus =
      ethers.isAddress(nftTransferAddress);

    if (!transferAddressValidationStatus) {
      return setNftPanelViewState("transfer");
    }

    const operationResult = await transferNft(
      postInformation.postDocId,
      nftTransferAddress
    );

    if (!operationResult) {
      return setNftPanelViewState("transfer");
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

    setNftPanelViewState("initialLoading");
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

  /**
   * Toggles 'list' panel
   */
  const handleListYourNFTButton = () => {
    setNftPanelViewState("list");
  };

  const handleListPriceInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.value) return;
    const priceInNumber = Number(event.target.value);

    setListNftInputState((prev) => ({ ...prev, price: priceInNumber }));
  };

  /**
   * Function that calls hook.
   */
  const handleListButton = async () => {
    setNftPanelViewState("listing");

    const operationResult = await listNft({
      currency: "dollar",
      postDocId: postInformation.postDocId,
      price: listNftInputState.price,
    });

    return setNftPanelViewState("initialLoading");
  };

  return (
    <Modal
      isOpen={openPanelNameValue === "nft"}
      onClose={() => {
        if (
          !(
            nftPanelViewState === "initialLoading" ||
            nftPanelViewState === "creating" ||
            nftPanelViewState === "updating" ||
            nftPanelViewState === "transferring" ||
            nftPanelViewState === "listing"
          )
        )
          openPanelNameValueSetter("main");
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
        {nftPanelViewState === "initialLoading" && (
          <ModalHeader color="white">NFT</ModalHeader>
        )}
        {nftPanelViewState === "create" && (
          <ModalHeader color="white">Create NFT</ModalHeader>
        )}
        {nftPanelViewState === "creating" && (
          <ModalHeader color="white">Create NFT</ModalHeader>
        )}
        {nftPanelViewState === "created" && (
          <ModalHeader color="white">NFT</ModalHeader>
        )}
        {nftPanelViewState === "updating" && (
          <ModalHeader color="white">Update NFT</ModalHeader>
        )}
        {nftPanelViewState === "transfer" && (
          <ModalHeader color="white">Transfer</ModalHeader>
        )}
        {nftPanelViewState === "transferring" && (
          <ModalHeader color="white">Transfer</ModalHeader>
        )}
        {nftPanelViewState === "list" && (
          <ModalHeader color="white">List Your NFT</ModalHeader>
        )}
        {nftPanelViewState === "listing" && (
          <ModalHeader color="white">List Your NFT</ModalHeader>
        )}
        {!(
          nftPanelViewState === "initialLoading" ||
          nftPanelViewState === "creating" ||
          nftPanelViewState === "updating" ||
          nftPanelViewState === "transferring" ||
          nftPanelViewState == "listing"
        ) && <ModalCloseButton color="white" />}

        <ModalBody display="flex">
          {nftPanelViewState === "initialLoading" && (
            <Flex width="100%" align="center" justify="center">
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}
          {nftPanelViewState === "create" && (
            <Flex id="createNftFlex" direction="column" width="100%">
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
              gap="20px"
            >
              <Flex
                id="top-area"
                direction="column"
                width="100%"
                align="center"
                justify="center"
                gap="5px"
              >
                <Image
                  width="50%"
                  src={nftMetadataState.image}
                  border="1px solid gray"
                  borderRadius="10px"
                />

                <Flex id="nft-title-data" align="center">
                  <Text
                    color="white"
                    fontSize="13pt"
                    fontWeight="700"
                    textAlign="center"
                  >
                    {nftDocDataState.name}
                  </Text>
                </Flex>

                <Flex id="nft-description-data" align="center">
                  <Text color="gray.300" fontSize="10pt" fontWeight="700">
                    "{nftDocDataState.description}"
                  </Text>
                </Flex>
                <Flex align="center" justify="center" gap="10px">
                  <Flex id="nft-like-data" align="center" gap={1}>
                    <Icon as={AiFillHeart} fontSize="13pt" color="white" />
                    <Text color="gray.300" fontSize="13pt">
                      {
                        nftMetadataState.attributes.find(
                          (a) => a.trait_type === "Likes"
                        )?.value
                      }
                    </Text>
                  </Flex>

                  <Flex id="nft-comment-data" align="center" gap={1}>
                    <Icon as={AiOutlineComment} fontSize="13pt" color="white" />
                    <Text color="gray.300" fontSize="13pt">
                      {
                        nftMetadataState.attributes.find(
                          (a) => a.trait_type === "Comments"
                        )?.value
                      }
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
              <Flex
                id="update-transfer-list-buttons"
                gap="10px"
                width="100%"
                align="center"
                justify="center"
                hidden={
                  currentUserState.username !== postInformation.senderUsername
                }
              >
                <Flex
                  id="transfer-button"
                  hidden={nftDocDataState.transferStatus.isTransferred}
                >
                  <Button
                    id="transfer-nft-button"
                    size="sm"
                    variant="solid"
                    colorScheme="blue"
                    onClick={() => {
                      handleTransferButton();
                    }}
                  >
                    Transfer Your NFT
                  </Button>
                </Flex>
                <Flex
                  id="update-button"
                  hidden={
                    postInformation.likeCount ===
                      Number(
                        nftMetadataState.attributes.find(
                          (a) => a.trait_type === "Likes"
                        )?.value
                      ) &&
                    postInformation.commentCount ===
                      Number(
                        nftMetadataState.attributes.find(
                          (a) => a.trait_type === "Comments"
                        )?.value
                      )
                  }
                >
                  <Button
                    id="update-nft-button"
                    size="sm"
                    variant="outline"
                    colorScheme="yellow"
                    onClick={() => {
                      handleUpdateNftButon();
                    }}
                  >
                    Update Your NFT
                  </Button>
                </Flex>
                <Button
                  id="list-nft-button"
                  size="sm"
                  variant="outline"
                  colorScheme="green"
                  onClick={() => {
                    handleListYourNFTButton();
                  }}
                  hidden={nftDocDataState.listStatus.isListed}
                >
                  List Your NFT
                </Button>
              </Flex>

              <Flex
                id="nft-list-status"
                direction="column"
                hidden={!nftDocDataState.listStatus.isListed}
              >
                <Flex id="sold-flex"></Flex>
                <Flex id="not-sold-flex" direction="column" gap="2">
                  <Text fontSize="15pt" as="b" color="white">
                    Listing
                  </Text>
                  <Text fontSize="10pt" as="b" color="white">
                    This NFT is{" "}
                    <span
                      style={{
                        color: "#63B3ED",
                      }}
                    >
                      listed
                    </span>{" "}
                    for{" "}
                    <span
                      style={{
                        color: "green",
                        fontWeight: "700",
                      }}
                    >
                      ${nftDocDataState.listStatus.price}{" "}
                    </span>
                    and{" "}
                    <span
                      style={{
                        color: "#D69E2E",
                      }}
                    >
                      waiting
                    </span>{" "}
                    for buyers.
                  </Text>
                </Flex>
              </Flex>

              <Flex id="nft-market-places-links" direction="column" gap={2}>
                <Text fontSize="15pt" as="b" color="white">
                  Market Place Link
                </Text>
                <Flex
                  gap={1}
                  cursor="pointer"
                  onClick={() => {
                    window.open(
                      `https://testnets.opensea.io/assets/mumbai/${apidonNFTMumbaiContractAddress}/${nftDocDataState.tokenId}`,
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
                      {nftDocDataState.transferStatus.isTransferred
                        ? `${nftDocDataState.transferStatus.transferredAddress?.slice(
                            0,
                            3
                          )}...${nftDocDataState.transferStatus.transferredAddress?.slice(
                            nftDocDataState.transferStatus.transferredAddress
                              ?.length - 3,
                            nftDocDataState.transferStatus.transferredAddress
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
                          nftDocDataState.transferStatus
                            .transferredAddress as string
                        );
                      }}
                    />
                  </Flex>
                  <Flex id="nft-tokenId-data" align="center" gap={1}>
                    <Icon as={AiOutlineNumber} fontSize="11pt" color="white" />
                    <Text color="white" fontSize="11pt">
                      {nftDocDataState.tokenId}
                    </Text>
                    <Icon
                      as={MdContentCopy}
                      fontSize="11pt"
                      color="blue"
                      cursor="pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          nftDocDataState.tokenId.toString()
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
                      {format(
                        new Date(nftDocDataState.mintTime),
                        "dd MMMM yyyy"
                      )}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          )}

          {nftPanelViewState === "transfer" && (
            <Flex
              id="transfer-nft-panel"
              width="100%"
              direction="column"
              align="center"
              justify="center"
              gap="20px"
            >
              <Icon
                as={BiTransferAlt}
                color="white"
                width="100px"
                height="100px"
              />
              <Flex
                id="warning-area"
                direction="column"
                align="center"
                justify="center"
                gap="2px"
                fontWeight="600"
              >
                <Text
                  id="main-warning"
                  color="red"
                  fontSize="12pt"
                  textAlign="center"
                >
                  Warning: NFT Transfer is Permanent
                </Text>
                <Text
                  id="sub-warning"
                  color="yellow.500"
                  fontSize="10pt"
                  textAlign="center"
                >
                  This NFT transfer cannot be reversed.
                </Text>
                <Text
                  id="small-explain"
                  color="yellow.500"
                  fontSize="9pt"
                  textAlign="center"
                >
                  Once you confirm this transaction, the ownership of this NFT
                  will be permanently transferred to the recipient address.
                </Text>
              </Flex>
              <Flex direction="column" width="100%">
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
                  isDisabled={!nftTransferAddressRight || !nftTransferAddress}
                  onClick={() => {
                    handleNFTransfer();
                  }}
                >
                  Transfer your NFT
                </Button>
              </Flex>
            </Flex>
          )}

          {nftPanelViewState === "transferring" && (
            <Flex
              id="transferring-flex"
              width="100%"
              direction="column"
              align="center"
              justify="center"
              gap="15px"
            >
              <Spinner width="75px" height="75px" color="teal" />
              <Text color="white" fontSize="12pt" fontWeight="700">
                NFT is being transferred
              </Text>
            </Flex>
          )}

          {nftPanelViewState === "updating" && (
            <Flex
              id="nft-update-flex"
              width="100%"
              direction="column"
              align="center"
              justify="center"
              gap="10px"
            >
              <Spinner width="75px" height="75px" color="teal" />
              <Text color="white" fontSize="15pt" fontWeight="700">
                NFT is being updated.
              </Text>
            </Flex>
          )}

          {nftPanelViewState === "list" && (
            <Flex
              id="list-nft-flex"
              width="100%"
              direction="column"
              align="center"
              justify="center"
              gap="20px"
            >
              <Icon as={MdSell} color="white" width="75px" height="75px" />
              <Flex
                id="set-price-area"
                width="50%"
                direction="column"
                gap="10px"
                align="center"
                justify="center"
              >
                <Text color="white" fontSize="15pt" fontWeight="700">
                  Set Price
                </Text>

                <InputGroup>
                  <FormControl variant="floating">
                    <Input
                      type="number"
                      required
                      name="price"
                      placeholder=" "
                      mb={2}
                      pr={"9"}
                      onChange={handleListPriceInputChange}
                      //  value={""}
                      _hover={{
                        border: "1px solid",
                        borderColor: "blue.500",
                      }}
                      textColor="white"
                      bg="black"
                      spellCheck={false}
                      isRequired
                    />
                    <FormLabel
                      bg="rgba(0,0,0)"
                      textColor="gray.500"
                      fontSize="12pt"
                      my={2}
                    >
                      Price
                    </FormLabel>
                  </FormControl>
                  <InputRightElement>
                    <Icon
                      as={AiFillDollarCircle}
                      color="green"
                      fontSize="x-large"
                    />
                  </InputRightElement>
                </InputGroup>
              </Flex>

              <Button
                id="list-button"
                colorScheme="green"
                variant="outline"
                size="md"
                onClick={handleListButton}
              >
                List
              </Button>
            </Flex>
          )}

          {nftPanelViewState === "listing" && (
            <Flex
              id="listing-flex"
              width="100%"
              direction="column"
              align="center"
              justify="center"
              gap="15px"
            >
              <Spinner width="75px" height="75px" color="green.500" />
              <Text color="white" fontSize="12pt" fontWeight="700">
                NFT is being listed
              </Text>
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
              }}
            >
              Return to post
            </Button>
          )}
          {nftPanelViewState === "transfer" && (
            <Button
              variant="outline"
              colorScheme="blue"
              onClick={() => {
                setNftPanelViewState("created");
              }}
            >
              Return to NFT
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
