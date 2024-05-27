import { auth } from "@/firebase/clientApp";

export default function useWithdraw() {
  const withdraw = async (withdrawAddress: string) => {
    const currentUserAuthObject = auth.currentUser;

    if (!currentUserAuthObject) {
      console.log("currentUser object is null");
      return false;
    }

    let response;
    try {
      const idToken = await currentUserAuthObject.getIdToken();
      if (!idToken) throw new Error("Id Token is null.");

      response = await fetch("/api/provider/withdraw", {
        method: "POST",
        headers: {
          authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          withdrawAddress: withdrawAddress,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Response from 'withdraw' API is not okay: ${await response.text()}`
        );
      }

      return true;
    } catch (error) {
      console.error("Error while fething withdraw API", error);
      return false;
    }
  };
  return { withdraw };
}
