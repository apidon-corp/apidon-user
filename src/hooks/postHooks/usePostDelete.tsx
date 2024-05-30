import { auth } from "@/firebase/clientApp";
import { useState } from "react";

export default function usePostDelete() {
  const [postDeletionLoading, setPostDeletionLoading] = useState(false);

  /**
   *
   * @param postDocId
   * @returns true if operation is successfull, otherwise false.
   */
  const postDelete = async (postDocId: string) => {
    setPostDeletionLoading(true);

    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error("Error while post deleting. Couln't be got idToken", error);
      setPostDeletionLoading(false);
      return false;
    }
    let response: Response;
    try {
      response = await fetch("/api/post/postDelete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ postDocId: postDocId }),
      });
    } catch (error) {
      setPostDeletionLoading(false);
      console.error("Error while fecthing to 'postDelete API'", error);
      return false;
    }

    if (!response.ok) {
      console.error(
        "Error while deleting post from 'postDelete' API",
        await response.text()
      );
      setPostDeletionLoading(false);
      return false;
    }

    setPostDeletionLoading(false);
    return true;
  };
  return {
    postDelete,
    postDeletionLoading,
  };
}
