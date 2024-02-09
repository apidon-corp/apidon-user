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
  postDocPath : string
};
