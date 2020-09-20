import HttpError from "../HttpError";

export type UserType = {
  meetup_user_id: number;
  email: string;
  full_name: string;
  member_since: Date;
};

export type GroupType = {
  group_name: string;
  group_id: string;
};

export type EventType = {
  start_date: Date;
  group_id: string;
  event_id: string;
  event_name: string;
};

export type AvatarType = {
  data: string;
  name: string;
  type: string;
};

export type ScrapedData = {
  user: UserType | HttpError;
  events: EventType[] | HttpError;
  groups: GroupType[] | HttpError;
  avatar: AvatarType | HttpError;
};
