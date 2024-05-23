import { PostItemData } from "./Post";

/**
 * Use when requesting /classification/likeAction API which is in Proivder side.
 */
export type PostLikeActionAPIBody = {
  username: string;
  providerId: string;
  startTime: number;
  postDocPath: string;
};

export type PostLikeAPIBody = {
  action: "like" | "delike";
  postDocPath: string;
};

/**
 * Use when requesting /classification/commentAction API which is in Proivder side.
 */
export type CommentActionAPIBody = {
  username: string;
  providerId: string;
  startTime: number;
  postDocPath: string;
};

export type InteractedPostObject = {
  timestamp: number;
  postDocPath: string;
};

export type DealAPIBody = {
  username: string;
  provider: string;
  interactedPostsObjectsArray: InteractedPostObject[];
};

// Read APIs Part
export type GetDocBody = {
  docPath: string;
};

export type GetDocResponse = {
  data: {
    [key: string]: any;
  };
  ref: {
    id: string;
    path: string;
  };
  isExists: boolean;
};

export type GetCollectionBody = {
  collectionPath: string;
  querySettings?: QuerySettings;
};

export type GetCollectionResponse = {
  docsArray: GetDocResponse[];
};

export type QuerySettings = {
  startAt: string;
  endAt: string;
  orderBy: string;
};

export type UploadNFTResponse = {
  nftDocPath: string;
};

export type GetPersonalizedNftFeedResponse = {
  postItemDatasArray: PostItemData[];
};
