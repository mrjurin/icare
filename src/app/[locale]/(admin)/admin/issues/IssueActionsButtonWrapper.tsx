"use client";

import IssueActionsButton from "./IssueActionsButton";

type Props = {
  issueId: number;
  reporterId: number | null;
};

export default function IssueActionsButtonWrapper({ issueId, reporterId }: Props) {
  return <IssueActionsButton issueId={issueId} reporterId={reporterId} />;
}
