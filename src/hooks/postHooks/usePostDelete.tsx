import { auth } from "@/firebase/clientApp";
import { useState } from "react";

export default function usePostDelete() {
  const [postDeletionLoading, setPostDeletionLoading] = useState(false);

  const postDelete = async (postDocId: string) => {
    setPostDeletionLoading(true);

    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) {
      setPostDeletionLoading(false);
      return false;
    }

    const displayName = currentUserAuthObject.displayName;
    if (!displayName) {
      setPostDeletionLoading(false);
      return false;
    }

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch("/api/postv2/postDelete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          postDocPath: `/users/${displayName}/posts/${postDocId}`,
        }),
      });

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
    } catch (error) {
      setPostDeletionLoading(false);
      console.error("Error while fecthing to 'postDelete API'", error);
      return false;
    }
  };
  return {
    postDelete,
    postDeletionLoading,
  };
}
