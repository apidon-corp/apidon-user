import { auth } from "@/firebase/clientApp";
import { Box, Center, Flex, Image, Text } from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";
import Footer from "../Footer/Footer";
import AuthenticationModal from "../Modals/AuthenticationModal/AuthenticationModal";
import PostCreateModal from "../Modals/Post/PostCreateModal";
import NotificationModal from "../Modals/User/NotificationModal";
import Navbar from "../Navbar/Navbar";
import useLogin from "@/hooks/authHooks/useLogin";
import DataAnalysisPreferencesModal from "../Modals/User/DataAnalysisPreferencesModal";
import CollectedDataInformationModal from "../Modals/User/CollectedDataInformationModal";
import useCookie from "@/hooks/cookieHooks/useCookie";
import TradedNFTsModal from "../Modals/User/TradedNFTsModal";
import ProviderModal from "../Modals/User/Provider/ProviderModal";
import { User } from "firebase/auth";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";
import useCheckProviderStatus from "@/hooks/providerHooks/useCheckProviderStatus";
import { CurrentUser, UserInServer } from "../types/User";
import { useSetRecoilState } from "recoil";
import { authModalStateAtom } from "../atoms/authModalAtom";
import { currentUserStateAtom } from "../atoms/currentUserAtom";
import { providerModalStateAtom } from "../atoms/providerModalAtom";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  const [innerHeight, setInnerHeight] = useState("95vh");

  const [loading, setLoading] = useState(true);

  const { setCookie } = useCookie();

  const { getDocServer } = useGetFirebase();

  const { checkProviderStatus } = useCheckProviderStatus();

  const setCurrentUserState = useSetRecoilState(currentUserStateAtom);
  const setAuthModalState = useSetRecoilState(authModalStateAtom);
  const setProviderModalState = useSetRecoilState(providerModalStateAtom);

  useEffect(() => {
    setInnerHeight(`${window.innerHeight}px`);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        handleAfterSuccessfullAuth(user);
        setCookie("firebase-auth.session-token", await user.getIdToken());
      } else {
        setLoading(false);
        // User is signed out, handle the signed-out state
      }
    });

    return () => unsubscribe(); // Cleanup the event listener when component unmounts
  }, []);

  const handleAfterSuccessfullAuth = async (user: User) => {
    const userDocInServerResult = await getDocServer(
      `users/${user.displayName}`
    );

    if (!userDocInServerResult) {
      console.error("Error while getting userDoc for server.");
      return; // I don't know what to do.
    }

    if (!userDocInServerResult.isExists) {
      console.error("userDoc doesn't exist in server.");
      return; // I don't know what to do.
    }

    const userDocDataInServer = userDocInServerResult.data as UserInServer;

    // Now, we have a valid user doc

    // We need to check provider side.
    const hasProvider = await checkProviderStatus();

    // We need to merge these two data to current user object.

    const currentUserData: CurrentUser = {
      isThereCurrentUser: true,
      email: userDocDataInServer.email,
      fullname: userDocDataInServer.fullname,
      hasProvider: hasProvider,
      nftCount: userDocDataInServer.nftCount,
      profilePhoto: userDocDataInServer.profilePhoto,
      uid: userDocDataInServer.uid,
      username: userDocDataInServer.username,
    };

    setCurrentUserState(currentUserData);
    setAuthModalState((prev) => ({ ...prev, open: false }));
    setProviderModalState({ isOpen: !hasProvider });

    return setLoading(false);
  };

  return (
    <>
      {loading ? (
        <>
          <Center height={innerHeight}>
            <Image src="/og.png" align="center" width="90px" />
          </Center>
        </>
      ) : (
        <Box>
          <Navbar />
          <Flex justifyContent="center">{children}</Flex>
          <PostCreateModal />
          <AuthenticationModal />
          <NotificationModal />
          {/* <CurrentProviderModal/> */}
          <ProviderModal />
          <DataAnalysisPreferencesModal />
          <CollectedDataInformationModal />
          <TradedNFTsModal />
          <Footer />
        </Box>
      )}
    </>
  );
}
