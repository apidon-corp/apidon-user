import { auth } from "@/firebase/clientApp";
import useGetFirebase from "../readHooks/useGetFirebase";

export default function useCheckProviderStatus() {
  const { getDocServer } = useGetFirebase();

  const checkProviderStatus = async () => {
    const currentUserAuthObject = auth.currentUser;

    if (!currentUserAuthObject) {
      console.error("Current User has no auth object.");
      return false;
    }

    if (!currentUserAuthObject.displayName) {
      console.error("Current User has no displayName field");
      return false;
    }

    const displayName = currentUserAuthObject.displayName;

    const currentProviderDocResult = await getDocServer(
      `users/${displayName}/provider/currentProvider`
    );
    if (!currentProviderDocResult) return false;

    if (!currentProviderDocResult.isExists) return false;

    const endTimeInServer = currentProviderDocResult.data.endTime;
    if (Date.now() >= endTimeInServer) return false;

    return true;
  };

  return { checkProviderStatus };
}
