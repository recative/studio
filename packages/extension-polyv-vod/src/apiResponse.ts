export interface BasicInfo {
  title: string;
  description: string;
  duration: number;
  thumbnailURL: string;
  coverURL: string;
  creationTime: string;
  updateTime: string;
  size: number;
  status: number;
  cateId: number;
  cateName: string;
  tags: string;
  uploader: string;
  playTimes: number;
  md5Checksum: string;
  extContent?: unknown;
}

export interface MetaData {
  size: number;
  format: string;
  duration: number;
  bitrate: number;
  fps: number;
  height: number;
  width: number;
  codec: string;
}

export interface TranscodeInfo {
  playUrl: string;
  definition: string;
  bitrate: number;
  duration: number;
  encrypt: boolean;
  format: string;
  fps: number;
  height: number;
  width: number;
  status: string;
}

export interface SnapshotInfo {
  imageUrl: string[];
  bigImageUrl: string[];
}

export interface Datum {
  vid: string;
  basicInfo: BasicInfo;
  metaData: MetaData;
  transcodeInfos: TranscodeInfo[];
  snapshotInfo: SnapshotInfo;
}

export interface VideoInfo {
  code: number | string;
  status: string;
  message: string;
  data: Datum[];
}
