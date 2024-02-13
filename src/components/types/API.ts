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
  opCode: -1 | 1;
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
