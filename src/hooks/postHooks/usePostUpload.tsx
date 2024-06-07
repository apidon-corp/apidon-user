import { PostCreateForm, PostServerDataV2 } from "@/components/types/Post";
import { auth } from "@/firebase/clientApp";
import { useState } from "react";

const usePostCreate = () => {
  /**
   * @param postCreateForm
   * @returns true if operation is successfull, otherwise false.
   */
  const uploadPost = async (postCreateForm: PostCreateForm) => {
    // This is my third control but, I don't trust states really :/
    if (!postCreateForm.description && !postCreateForm.image) {
      console.log("You Can not create empty post, aborting");
      return false;
    }

    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error("Error while post deleting. Couln't be got idToken", error);

      return false;
    }

    const description = postCreateForm.description;
    const image = postCreateForm.image;

    let response: Response;
    try {
      response = await fetch("/api/postv2/postUpload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ description, image }),
      });
    } catch (error) {
      console.error("Error while fetching to 'postUpload' API", error);

      return false;
    }

    if (!response.ok) {
      console.error(
        "Error while postUpload from 'postUpload' API",
        await response.text()
      );

      return false;
    }

    return true;
  };

  return {
    uploadPost,
  };
};

export default usePostCreate;
