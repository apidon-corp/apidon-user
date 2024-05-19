import { auth } from "@/firebase/clientApp";
import useCookie from "@/hooks/cookieHooks/useCookie";
import useCheckProviderStatus from "@/hooks/providerHooks/useCheckProviderStatus";
import useGetFirebase from "@/hooks/readHooks/useGetFirebase";
import { Box, Center, Flex, Image } from "@chakra-ui/react";
import { User } from "firebase/auth";
import { ReactNode, useEffect, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import Footer from "../Footer/Footer";
import PostCreateModal from "../Modals/Post/PostCreateModal";
import CollectedDataInformationModal from "../Modals/User/CollectedDataInformationModal";
import DataAnalysisPreferencesModal from "../Modals/User/DataAnalysisPreferencesModal";
import NotificationModal from "../Modals/User/NotificationModal";
import ProviderModal from "../Modals/User/Provider/ProviderModal";
import TradedNFTsModal from "../Modals/User/TradedNFTsModal";
import Navbar from "../Navbar/Navbar";
import { authModalStateAtom } from "../atoms/authModalAtom";
import { currentUserStateAtom } from "../atoms/currentUserAtom";
import { providerModalStateAtom } from "../atoms/providerModalAtom";
import { CurrentUser, UserInServer } from "../types/User";
import LoginModal from "../Modals/AuthenticationModal/LoginModal";
import SignupModal from "../Modals/AuthenticationModal/SignupModal";
import ResetPasswordModal from "../Modals/AuthenticationModal/ResetPasswordModal";
import VerifyModal from "../Modals/AuthenticationModal/VerifyModal";
import { verificationModalAtom } from "../atoms/verificationModalAtom";
import FrenletCreateModal from "../Modals/Frenlet/FrenletCreateModal";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  const [loading, setLoading] = useState(true);

  const { setCookie } = useCookie();

  const { getDocServer } = useGetFirebase();

  const { checkProviderStatus } = useCheckProviderStatus();

  const setCurrentUserState = useSetRecoilState(currentUserStateAtom);
  const [authModalState, setAuthModalState] =
    useRecoilState(authModalStateAtom);
  const setProviderModalState = useSetRecoilState(providerModalStateAtom);

  const [verificationModalState, setVerificationModalState] = useRecoilState(
    verificationModalAtom
  );

  /**
   * Setting width and height for company logo on start screen.
   */
  useEffect(() => {
    // Function to calculate viewport height excluding bottom bars on mobile Safari
    const calculateViewportHeight = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Initial calculation
    calculateViewportHeight();

    // Recalculate on window resize
    window.addEventListener("resize", calculateViewportHeight);

    // Clean up the event listener
    return () => {
      window.removeEventListener("resize", calculateViewportHeight);
    };
  }, []);

  /**
   * Handling signing in and out's after opearions.
   */
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
      return setAuthModalState({ open: true, view: "logIn" });
    }

    if (!userDocInServerResult.isExists) {
      console.error("userDoc doesn't exist in server.");
      return setAuthModalState({ open: true, view: "logIn" });
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

    const isEmailVerified = user.emailVerified;

    setCurrentUserState(currentUserData);
    setAuthModalState((prev) => ({ ...prev, open: false }));
    setProviderModalState({ isOpen: !hasProvider });
    setVerificationModalState({ isOpen: !isEmailVerified });

    return setLoading(false);
  };

  return (
    <>
      {loading ? (
        <Center height="calc(var(--vh, 1vh) * 100)">
          <Image src="/og.png" align="center" width="90px" />
        </Center>
      ) : (
        <Box>
          <Navbar />
          <Flex justifyContent="center">{children}</Flex>
          <PostCreateModal />
          <FrenletCreateModal />

          {authModalState.open && authModalState.view === "signUp" && (
            <SignupModal />
          )}
          {authModalState.open && authModalState.view === "logIn" && (
            <LoginModal />
          )}
          {authModalState.open && authModalState.view === "resetPassword" && (
            <ResetPasswordModal />
          )}

          {verificationModalState.isOpen && <VerifyModal />}

          <NotificationModal />
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
