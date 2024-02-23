import { authModalStateAtom } from "@/components/atoms/authModalAtom";
import { currentUserStateAtom } from "@/components/atoms/currentUserAtom";
import { CurrentUser, UserInServer } from "@/components/types/User";

import { providerModalStateAtom } from "@/components/atoms/providerModalAtom";
import { auth } from "@/firebase/clientApp";
import {
  User,
  UserCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { useSetRecoilState } from "recoil";
import useCheckProviderStatus from "../providerHooks/useCheckProviderStatus";
import useGetFirebase from "../readHooks/useGetFirebase";

const useLogin = () => {
  const setCurrentUserState = useSetRecoilState(currentUserStateAtom);
  const setAuthModalState = useSetRecoilState(authModalStateAtom);

  const setProviderModalState = useSetRecoilState(providerModalStateAtom);

  const { checkProviderStatusOnLogin } = useCheckProviderStatus();

  const { getDocServer } = useGetFirebase();

  /**
   * @param emailOrUsername
   * @param password
   */
  const logSignedOutUserIn = async (
    emailOrUsername: string,
    password: string
  ) => {
    let email: string = "";

    const emailRegex = /\S+@\S+\.\S+/;
    const isEmail = emailRegex.test(emailOrUsername);

    if (isEmail) {
      email = emailOrUsername;
    } else {
      const username = emailOrUsername;

      const userDocResult = await getDocServer(`users/${username}`);
      if (!userDocResult) return;

      if (!userDocResult.isExists) {
        email = "";
      } else {
        email = userDocResult.data.email;
      }
    }

    if (!email) return false;

    let userCred: UserCredential;
    try {
      userCred = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error while logging provider.", error);
      return false;
    }

    return true;

    // logSignedUserIn automatically runs by "Layout"
  };

  /**
   * @param user
   * @returns
   */
  const logSignedUserIn = async (user: User) => {
    if (!user) return false;

    const signedInUserDocResult = await getDocServer(
      `users/${user.displayName}`
    );
    if (!signedInUserDocResult) return false;

    if (!signedInUserDocResult.isExists) {
      console.error("Error while login. (User snapshot doesn't exixt)");
      return false;
    }

    let currentUserDataOnServer: UserInServer;

    currentUserDataOnServer = signedInUserDocResult.data as UserInServer;

    const currentUserDataTemp: CurrentUser = {
      isThereCurrentUser: true,

      username: currentUserDataOnServer.username,
      fullname: currentUserDataOnServer.fullname,
      profilePhoto: currentUserDataOnServer.profilePhoto,

      nftCount: currentUserDataOnServer.nftCount,

      email: currentUserDataOnServer.email,
      uid: currentUserDataOnServer.uid,
    };

    const operationResult = await checkProviderStatusOnLogin(
      user.displayName as string
    );

    if (operationResult === "server-error") return false;
    if (operationResult === "no-current-provider")
      setProviderModalState({ open: true, view: "chooseProvider" });

    if (operationResult === "expired")
      setProviderModalState({ open: true, view: "currentProvider" });

    // State Updates
    setCurrentUserState(currentUserDataTemp);

    setAuthModalState((prev) => ({
      ...prev,
      open: false,
    }));

    return true;
  };

  return {
    logSignedOutUserIn,
    logSignedUserIn,
  };
};

export default useLogin;
