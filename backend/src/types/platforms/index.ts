// 平台特定响应类型定义

// TikTok API响应类型
export interface TikTokProfileResponse {
  id?: string
  uniqueId?: string
  nickname?: string
  signature?: string
  avatarLarger?: string
  avatarMedium?: string
  avatarThumb?: string
  verified?: boolean
  followerCount?: number
  followingCount?: number
  videoCount?: number
  diggCount?: number
  heartCount?: number
  relation?: number
  privateAccount?: boolean
  secret?: boolean
  isADVirtual?: boolean
  ftc?: boolean
  risk?: number
  originalModifiable?: boolean
  modifyTime?: number
  commerceUserInfo?: {
    commerceUserId?: string
    liveCommerce?: boolean
    commerceConfig?: {
      liveCommerceConfig?: boolean
      downloadExpire?: number
      goodsIds?: string[]
    }
  }
  verificationType?: number
  verificationReason?: string
  userNotShow?: boolean
  userNotSee?: boolean
  userNotInterested?: boolean
  userBlock?: boolean
  userFollow?: boolean
  secUid?: string
  signatureDisplayMode?: number
  createTime?: number
  nicknameSetting?: number
  avatarSetting?: number
  storySetting?: number
  moreRelation?: number
  liveVerifyID?: number
  watchTime?: number
  pushSetting?: number
  status?: number
  createTimeMs?: number
  specialLock?: number
  needGuide?: boolean
  userMode?: number
  userRate?: number
  isBanned?: boolean
  banReasonExpires?: number
  endSort?: boolean
  displayGender?: boolean
  topVipNo?: number
  isRecommendUser?: boolean
  newUserGiftEntrance?: boolean
  enableShowMore?: boolean
  enableShowMoreBtn?: boolean
  topVip?: boolean
  profileTab?: any
  enableProfileTab?: boolean
  profileTabType?: any
  [key: string]: any
}

export interface TikTokVideoStats {
  playCount?: number
  diggCount?: number
  shareCount?: number
  commentCount?: number
  collectCount?: number
  [key: string]: any
}

export interface TikTokVideoResponse {
  id?: string
  desc?: string
  createTime?: number
  author?: {
    id?: string
    uniqueId?: string
    nickname?: string
    avatarLarger?: string
    avatarThumb?: string
    [key: string]: any
  }
  music?: {
    id?: string
    title?: string
    playUrl?: string
    coverLarge?: string
    coverMedium?: string
    coverThumb?: string
    [key: string]: any
  }
  challenges?: Array<{
    id?: string
    title?: string
    desc?: string
    [key: string]: any
  }>
  stats?: TikTokVideoStats
  textExtra?: Array<{
    hashtagName?: string
    hashtagId?: string
    start?: number
    end?: number
    [key: string]: any
  }>
  video?: {
    playAddr?: string
    downloadAddr?: string
    cover?: string
    dynamicCover?: string
    staticCover?: string
    originCover?: string
    width?: number
    height?: number
    duration?: number
    ratio?: string
    [key: string]: any
  }
  duetInfo?: {
    duetFromId?: string
    [key: string]: any
  }
  stitchInfo?: {
    stitchFromId?: string
    [key: string]: any
  }
  isPinned?: boolean
  secret?: boolean
  forFriend?: boolean
  digged?: boolean
  itemCommentStatus?: number
  showType?: number
  statsV2?: {
    playCount?: string
    diggCount?: string
    shareCount?: string
    commentCount?: string
    collectCount?: string
    [key: string]: any
  }
  shareCover?: string
  shareCoverLQ?: string
  adInfo?: any
  [key: string]: any
}

export interface TikTokVideosResponse {
  videos?: TikTokVideoResponse[]
  hasMore?: boolean
  cursor?: string
  minCursor?: number
  maxCursor?: number
  count?: number
  [key: string]: any
}

// Instagram API响应类型（待实现）
export interface InstagramProfileResponse {
  id?: string
  username?: string
  fullName?: string
  biography?: string
  profilePicUrl?: string
  followersCount?: number
  followingCount?: number
  postsCount?: number
  isPrivate?: boolean
  isVerified?: boolean
  externalUrl?: string
  [key: string]: any
}

export interface InstagramPostResponse {
  id?: string
  typename?: string
  displayUrl?: string
  videoUrl?: string
  caption?: string
  timestamp?: number
  dimensions?: {
    width?: number
    height?: number
  }
  likeCount?: number
  commentsCount?: number
  videoViewCount?: number
  videoPlayCount?: number
  edgeMediaToCaption?: {
    edges?: Array<{
      node?: {
        text?: string
      }
    }>
  }
  location?: {
    name?: string
    address?: string
  }
  hashtags?: Array<{
    name?: string
  }>
  [key: string]: any
}

export interface InstagramPostsResponse {
  posts?: InstagramPostResponse[]
  hasNextPage?: boolean
  endCursor?: string
  [key: string]: any
}

// YouTube API响应类型（待实现）
export interface YouTubeChannelResponse {
  id?: string
  title?: string
  description?: string
  thumbnails?: {
    default?: { url?: string; width?: number; height?: number }
    medium?: { url?: string; width?: number; height?: number }
    high?: { url?: string; width?: number; height?: number }
  }
  subscriberCount?: string
  videoCount?: string
  viewCount?: string
  publishedAt?: string
  customUrl?: string
  [key: string]: any
}

export interface YouTubeVideoResponse {
  id?: string
  title?: string
  description?: string
  publishedAt?: string
  thumbnails?: {
    default?: { url?: string; width?: number; height?: number }
    medium?: { url?: string; width?: number; height?: number }
    high?: { url?: string; width?: number; height?: number }
    standard?: { url?: string; width?: number; height?: number }
    maxres?: { url?: string; width?: number; height?: number }
  }
  viewCount?: string
  likeCount?: string
  commentCount?: string
  duration?: string
  tags?: string[]
  categoryId?: string
  defaultLanguage?: string
  [key: string]: any
}

export interface YouTubeVideosResponse {
  videos?: YouTubeVideoResponse[]
  hasNextPage?: boolean
  nextPageToken?: string
  pageInfo?: {
    totalResults?: number
    resultsPerPage?: number
  }
  [key: string]: any
}

// Facebook API响应类型（待实现）
export interface FacebookProfileResponse {
  id?: string
  name?: string
  username?: string
  bio?: string
  profilePicUrl?: string
  followersCount?: number
  likes?: number
  talkingAboutCount?: number
  isVerified?: boolean
  link?: string
  [key: string]: any
}

export interface FacebookPostResponse {
  id?: string
  message?: string
  createdTime?: string
  permalinkUrl?: string
  fullPicture?: string
  source?: string
  length?: number
  shares?: {
    count?: number
  }
  reactions?: {
    summary?: {
      totalCount?: number
    }
  }
  comments?: {
    summary?: {
      totalCount?: number
    }
  }
  [key: string]: any
}

export interface FacebookPostsResponse {
  posts?: FacebookPostResponse[]
  hasNextPage?: boolean
  nextCursor?: string
  [key: string]: any
}