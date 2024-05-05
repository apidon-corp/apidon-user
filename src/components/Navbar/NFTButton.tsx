import { Button } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";

export default function NFTButton() {
  const router = useRouter();

  const handleNFTButtonClick = () => {
    router.push("/nft/nft");
  };

  return (
    <Button
      colorScheme="pink"
      variant="outline"
      size="sm"
      onClick={handleNFTButtonClick}
    >
      NFT
    </Button>
  );
}
