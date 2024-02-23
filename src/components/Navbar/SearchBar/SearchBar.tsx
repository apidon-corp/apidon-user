import {
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
  Stack,
} from "@chakra-ui/react";
import React, { useRef, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";

import { UserInSearchbar } from "../../types/User";

import { MdCancel } from "react-icons/md";
import SearchItem from "./SearchItem";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";

type Props = {};

export default function SearchBar({}: Props) {
  // const [searchInput, setSearchInput] = useState<string>("");
  const [searchListOpen, setSearchListOpen] = useState(false);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<UserInSearchbar[]>([]);

  /**
   * To clear search keyword
   */
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * To close search panel, when click somewhere else
   */
  const [searchFocus, setSearchFocus] = useState(false);

  const { getCollectionServer } = useGetFirebase();
  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const searchInput = inputValue.toLowerCase();
    if (searchInput.length == 0) {
      setSearchListOpen(false);
      return;
    }
    setSearchLoading(true);
    setSearchResult([]);

    // Search thorugh documents for match....

    const searchCollectionResult = await getCollectionServer("users", {
      endAt: searchInput + "\uf8ff",
      startAt: searchInput,
      orderBy: "username",
    });

    if (!searchCollectionResult) return;

    const resultArray: UserInSearchbar[] = [];
    searchCollectionResult.docsArray.forEach((doc) => {
      const resultObject = {
        username: doc.data.username,
        fullname: doc.data.fullname,
        profilePhoto: doc.data.profilePhoto,
      };
      resultArray.push(resultObject);
    });

    // Update states
    setSearchLoading(false);
    setSearchResult(resultArray);
    setSearchListOpen(true);
  };

  return (
    <Flex direction="column" position="relative">
      <Flex align="center">
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={AiOutlineSearch} color="gray.600" fontSize="12pt" />
          </InputLeftElement>
          <Input
            ref={inputRef}
            placeholder="Search"
            textColor="white"
            onChange={onChange}
            _hover={{
              borderColor: "gray.900",
            }}
            _focus={{
              bg: "gray.900",
            }}
            _placeholder={{
              fontSize: "10pt",
            }}
            borderColor="gray.800"
            onFocus={() => setSearchFocus(true)}
            onBlur={(event) => {
              if (event.relatedTarget?.id == "search-result-panel") {
                return;
              } else {
                setSearchFocus(false);
              }
            }}
          />
          <InputRightElement
            pointerEvents={inputRef.current?.value ? "unset" : "none"}
          >
            <Spinner size="sm" ml={1.5} color="gray" hidden={!searchLoading} />
            {!searchLoading && searchListOpen && (
              <Icon
                as={MdCancel}
                color="gray.400"
                fontSize="11pt"
                cursor="pointer"
                onClick={() => {
                  setSearchListOpen(false);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              />
            )}
          </InputRightElement>
        </InputGroup>
      </Flex>

      {searchListOpen && searchFocus && (
        <Flex
          id="search-result-panel"
          position="absolute"
          width="100%"
          top="42px"
          bg="rgba(0, 0, 0, 0.8)"
          backdropFilter="auto"
          backdropBlur="10px"
          borderRadius="0px 0px 10px 10px"
          tabIndex={0}
        >
          <Stack mt={1} mb={1}>
            {searchResult.map((result) => (
              <SearchItem
                key={result.username}
                inputReferance={inputRef}
                searchListOpenStateSetter={setSearchListOpen}
                searchItemData={result}
              />
            ))}
          </Stack>
        </Flex>
      )}
    </Flex>
  );
}
