import useGetFirebase from "../readHooks/useGetFirebase";

export default function useCheckProviderStatus() {
  const { getDocServer } = useGetFirebase();

  const checkProviderStatusOnLogin = async (username: string) => {
    const currentProviderDocResult = await getDocServer(
      `users/${username}/provider/currentProvider`
    );
    if (!currentProviderDocResult) {
      console.error("Error while getting current provider doc");

      return "server-error";
    }

    if (!currentProviderDocResult.isExists) return "no-current-provider";

    const endTimeInServer = currentProviderDocResult.data.endTime;
    if (Date.now() >= endTimeInServer) return "expired";

    return "good-to-go";
  };

  return { checkProviderStatusOnLogin };
}
